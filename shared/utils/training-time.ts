/** datetime-local values always represent the club's timezone, regardless of the device timezone. */
export function warsawDateTime(value: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

export function trainingDateToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const utc = Date.parse(`${value}:00Z`)
  if (!Number.isFinite(utc)) return null
  // Warsaw uses UTC+1 or UTC+2. Round-trip validation rejects nonexistent DST times.
  for (const offset of [2, 1]) {
    const candidate = new Date(utc - offset * 3_600_000).toISOString()
    if (warsawDateTime(candidate) === value) return candidate
  }
  return null
}
