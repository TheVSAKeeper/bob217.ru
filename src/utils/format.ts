export const plural = (n: number, one: string, few: string, many: string): string => {
  const tail = n % 100
  if (tail > 10 && tail < 20) return many
  const last = n % 10
  if (last === 1) return one
  return last > 1 && last < 5 ? few : many
}

export const fmtSize = (kb: number): string =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} МБ` : `${kb} КБ`

const DAY_MS = 86_400_000

export const ago = (iso: string): string => {
  if (!iso) return 'когда-то'
  const days = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / DAY_MS))
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`
}

export const fmtTime = (iso: string): string =>
  iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''

export const monthIndex = (ym: string): number =>
  Number(ym.slice(0, 4)) * 12 + (Number(ym.slice(5, 7)) - 1)

export const nowMonthIndex = (): number => {
  const now = new Date()
  return now.getFullYear() * 12 + now.getMonth()
}

export const fmtSpan = (months: number): string => {
  if (months < 1) return 'меньше месяца'
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years) parts.push(`${years} ${plural(years, 'год', 'года', 'лет')}`)
  if (rest) parts.push(`${rest} ${plural(rest, 'месяц', 'месяца', 'месяцев')}`)
  return parts.join(' ')
}

export const fmtMonthYear = (ym: string): string =>
  new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1)
    .toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    .replace(' г.', '')

export const fmtDate = (iso: string): string =>
  iso
    ? new Date(iso)
        .toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
        .replace(' г.', '')
    : ''
