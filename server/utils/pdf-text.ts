import { inflateSync } from 'node:zlib'

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
}

function extractTextFromPdfStream(streamText: string): string[] {
  const lines: string[] = []
  const textBlocks = streamText.match(/BT[\s\S]*?ET/g) ?? []

  for (const block of textBlocks) {
    const parts: string[] = []
    const tjMatches = block.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g)
    for (const match of tjMatches) {
      parts.push(decodePdfLiteral(match[1]!))
    }

    const tjArrayMatches = block.matchAll(/\[([\s\S]*?)\]\s*TJ/g)
    for (const match of tjArrayMatches) {
      const inner = match[1]!.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g)
      for (const item of inner) {
        parts.push(decodePdfLiteral(item[1]!))
      }
    }

    const joined = parts.join(' ').replace(/\s+/g, ' ').trim()
    if (joined) lines.push(joined)
  }

  return lines
}

export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const latin1 = buffer.toString('latin1')
  const collected: string[] = []

  const streamMatches = latin1.matchAll(
    /stream\r?\n([\s\S]*?)\r?\nendstream/g,
  )
  for (const match of streamMatches) {
    const rawStream = Buffer.from(match[1]!, 'latin1')
    let decoded = ''
    try {
      decoded = inflateSync(rawStream).toString('utf8')
    } catch {
      decoded = rawStream.toString('utf8')
    }
    collected.push(...extractTextFromPdfStream(decoded))
  }

  if (!collected.length) {
    collected.push(...extractTextFromPdfStream(latin1))
  }

  return collected.join('\n').trim()
}
