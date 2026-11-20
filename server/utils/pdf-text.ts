import { inflateSync } from 'node:zlib'

type CMap = Map<number, string>

function parseCMap(cmapText: string): CMap {
  const map: CMap = new Map()

  for (const block of cmapText.matchAll(
    /beginbfchar\s+([\s\S]*?)endbfchar/g,
  )) {
    for (const pair of block[1]!.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const src = Number.parseInt(pair[1]!, 16)
      const dstHex = pair[2]!
      const chars: number[] = []
      for (let i = 0; i < dstHex.length; i += 4) {
        chars.push(Number.parseInt(dstHex.slice(i, i + 4), 16))
      }
      map.set(src, String.fromCodePoint(...chars))
    }
  }

  for (const block of cmapText.matchAll(
    /beginbfrange\s+([\s\S]*?)endbfrange/g,
  )) {
    const lines = block[1]!
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    for (const line of lines) {
      const arrayMatch = line.match(
        /^<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]+)\]$/,
      )
      if (arrayMatch) {
        const start = Number.parseInt(arrayMatch[1]!, 16)
        const end = Number.parseInt(arrayMatch[2]!, 16)
        const targets = [...arrayMatch[3]!.matchAll(/<([0-9A-Fa-f]+)>/g)].map(
          (m) => m[1]!,
        )
        for (let code = start; code <= end; code += 1) {
          const dstHex = targets[code - start]
          if (!dstHex) continue
          const chars: number[] = []
          for (let i = 0; i < dstHex.length; i += 4) {
            chars.push(Number.parseInt(dstHex.slice(i, i + 4), 16))
          }
          map.set(code, String.fromCodePoint(...chars))
        }
        continue
      }

      const rangeMatch = line.match(
        /^<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>$/,
      )
      if (rangeMatch) {
        const start = Number.parseInt(rangeMatch[1]!, 16)
        const end = Number.parseInt(rangeMatch[2]!, 16)
        const baseTarget = Number.parseInt(rangeMatch[3]!, 16)
        for (let code = start; code <= end; code += 1) {
          map.set(code, String.fromCodePoint(baseTarget + (code - start)))
        }
      }
    }
  }

  return map
}

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct) =>
      String.fromCharCode(Number.parseInt(oct, 8)),
    )
}

function decodeHexToken(hex: string, cmap: CMap | undefined, fallbackCmap: CMap): string {
  const clean = hex.replace(/\s+/g, '')
  const step = clean.length % 4 === 0 ? 4 : 2
  let out = ''
  for (let i = 0; i < clean.length; i += step) {
    const code = Number.parseInt(clean.slice(i, i + step), 16)
    const mapped = cmap?.get(code) ?? fallbackCmap.get(code)
    if (mapped !== undefined) {
      out += mapped
    } else if (code >= 32 && code <= 126) {
      out += String.fromCharCode(code)
    }
  }
  return out
}

function decodeTextOperand(
  operand: string,
  cmap: CMap | undefined,
  fallbackCmap: CMap,
): string {
  let out = ''
  const tokenRegex =
    /\(([^()\\]*(?:\\.[^()\\]*)*)\)|<([0-9A-Fa-f\s]+)>|(-?\d+(?:\.\d+)?)/g
  for (const token of operand.matchAll(tokenRegex)) {
    if (token[1] !== undefined) {
      out += decodePdfLiteral(token[1])
    } else if (token[2] !== undefined) {
      out += decodeHexToken(token[2], cmap, fallbackCmap)
    } else if (token[3] !== undefined) {
      const kerning = Number(token[3])
      if (kerning < -180 && !out.endsWith(' ')) {
        out += ' '
      }
    }
  }
  return out
}

type PositionedSpan = {
  x: number
  y: number
  text: string
}

function extractTextFromPdfStream(
  streamText: string,
  fontNameToCmap: Map<string, CMap>,
  fallbackCmap: CMap,
): string[] {
  const spans: PositionedSpan[] = []
  let currentFont = ''
  let currentX = 0
  let currentY = 0

  const textBlocks = streamText.match(/BT[\s\S]*?ET/g) ?? []
  for (const block of textBlocks) {
    const ops = block.matchAll(
      /\/(F\d+)\s+[\d.]+\s+Tf|(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+Tm|(-?[\d.]+)\s+(-?[\d.]+)\s+T[dD]|(\((?:[^()\\]|\\.)*\)|<[0-9A-Fa-f\s]+>)\s*Tj|\[([\s\S]*?)\]\s*TJ/g,
    )

    let blockParts = ''
    let spanX = currentX
    let spanY = currentY

    for (const op of ops) {
      if (op[1]) {
        currentFont = op[1]
      } else if (op[6] !== undefined && op[7] !== undefined) {
        if (blockParts.trim()) {
          spans.push({ x: spanX, y: spanY, text: blockParts })
          blockParts = ''
        }
        currentX = Number(op[6])
        currentY = Number(op[7])
        spanX = currentX
        spanY = currentY
      } else if (op[8] !== undefined && op[9] !== undefined) {
        if (blockParts.trim()) {
          spans.push({ x: spanX, y: spanY, text: blockParts })
          blockParts = ''
        }
        currentX += Number(op[8])
        currentY += Number(op[9])
        spanX = currentX
        spanY = currentY
      } else if (op[10] !== undefined) {
        const cmap = fontNameToCmap.get(currentFont)
        blockParts += decodeTextOperand(op[10], cmap, fallbackCmap)
      } else if (op[11] !== undefined) {
        const cmap = fontNameToCmap.get(currentFont)
        blockParts += decodeTextOperand(op[11], cmap, fallbackCmap)
      }
    }

    if (blockParts.trim()) {
      spans.push({ x: spanX, y: spanY, text: blockParts })
    }
  }

  if (!spans.length) return []

  // Group spans that sit on the same horizontal visual line (within 2.5pt Y)
  const lines: Array<{ y: number; items: PositionedSpan[] }> = []
  for (const span of spans) {
    const existingLine = lines.find((line) => Math.abs(line.y - span.y) <= 2.5)
    if (existingLine) {
      existingLine.items.push(span)
    } else {
      lines.push({ y: span.y, items: [span] })
    }
  }

  // Sort top-to-bottom (higher Y is higher on a PDF page), then left-to-right
  lines.sort((a, b) => b.y - a.y)

  return lines
    .map((line) => {
      line.items.sort((a, b) => a.x - b.x)
      let combined = ''
      let prevX: number | null = null
      for (const item of line.items) {
        if (!combined) {
          combined = item.text
        } else {
          const gap = prevX !== null ? item.x - prevX : 20
          const needsSpace =
            gap > 4 &&
            !combined.endsWith(' ') &&
            !item.text.startsWith(' ') &&
            !/[–\-:]$/.test(combined) &&
            !/^[–\-:,•′']/.test(item.text)
          combined += (needsSpace ? ' ' : '') + item.text
        }
        prevX = item.x
      }
      return combined.replace(/\s+/g, ' ').trim()
    })
    .filter(Boolean)
}

export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const latin1 = buffer.toString('latin1')

  const objects = new Map<number, string>()
  const decodedStreams = new Map<number, string>()

  for (const objMatch of latin1.matchAll(/(\d+)\s+0\s+obj\b([\s\S]*?)endobj/g)) {
    const objId = Number(objMatch[1])
    const body = objMatch[2]!
    objects.set(objId, body)

    const streamMatch = body.match(/stream\r?\n([\s\S]*?)\r?\nendstream/)
    if (streamMatch) {
      const rawStream = Buffer.from(streamMatch[1]!, 'latin1')
      try {
        decodedStreams.set(objId, inflateSync(rawStream).toString('latin1'))
      } catch {
        decodedStreams.set(objId, rawStream.toString('latin1'))
      }
    }
  }

  const cmapsByObjId = new Map<number, CMap>()
  const fallbackCmap: CMap = new Map()
  for (const [objId, streamText] of decodedStreams.entries()) {
    if (
      streamText.includes('begincmap') ||
      streamText.includes('beginbfchar') ||
      streamText.includes('beginbfrange')
    ) {
      const cmap = parseCMap(streamText)
      cmapsByObjId.set(objId, cmap)
      for (const [k, v] of cmap.entries()) {
        if (!fallbackCmap.has(k)) fallbackCmap.set(k, v)
      }
    }
  }

  const fontObjToCmap = new Map<number, CMap>()
  for (const [objId, body] of objects.entries()) {
    const toUnicodeMatch = body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/)
    if (toUnicodeMatch) {
      const cmap = cmapsByObjId.get(Number(toUnicodeMatch[1]))
      if (cmap) fontObjToCmap.set(objId, cmap)
    }
  }

  const globalFontNameToCmap = new Map<string, CMap>()
  for (const body of objects.values()) {
    for (const fontMapMatch of body.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
      const fontName = fontMapMatch[1]!
      const fontObjId = Number(fontMapMatch[2])
      const cmap = fontObjToCmap.get(fontObjId)
      if (cmap) globalFontNameToCmap.set(fontName, cmap)
    }
  }

  const collected: string[] = []
  for (const streamText of decodedStreams.values()) {
    if (!streamText.includes('BT')) continue
    collected.push(
      ...extractTextFromPdfStream(
        streamText,
        globalFontNameToCmap,
        fallbackCmap,
      ),
    )
  }

  if (!collected.length) {
    collected.push(
      ...extractTextFromPdfStream(latin1, globalFontNameToCmap, fallbackCmap),
    )
  }

  return collected.join('\n').trim()
}
