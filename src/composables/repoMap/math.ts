export const D2R = Math.PI / 180
export const TAU = Math.PI * 2

export type Point = [number, number]

export const mulberry32 = (a: number) => (): number => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t)

const DEPTH_DIM = 0.55

export const depthAlpha = (dz: number): number =>
  1 - DEPTH_DIM + DEPTH_DIM * clamp01((dz - (1 - DEPTH_DIM)) / DEPTH_DIM)

export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3)
export const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5)

export const easeOutBack = (t: number): number => {
  const c1 = 1.9
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export const withAlpha = (hex: string, alpha: number): string => {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const num = Number.parseInt(full, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

const channels = (hex: string): [number, number, number] => {
  const raw = hex.replace('#', '')
  const num = Number.parseInt(
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw,
    16,
  )
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export const mixHex = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = channels(a)
  const [r2, g2, b2] = channels(b)
  const mix = (x: number, y: number): number => Math.round(x + (y - x) * t)
  const hex = (v: number): string => v.toString(16).padStart(2, '0')
  return `#${hex(mix(r1, r2))}${hex(mix(g1, g2))}${hex(mix(b1, b2))}`
}

const cross = (o: Point, a: Point, b: Point): number =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

export const convexHull = (points: Point[]): Point[] => {
  if (points.length < 3) return points.slice()
  const pts = points.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1])
  const lower: Point[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop()
    lower.push(p)
  }
  const upper: Point[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

export const expandHull = (hull: Point[], pad: number): Point[] => {
  if (!hull.length) return hull
  let cx = 0
  let cy = 0
  for (const [x, y] of hull) {
    cx += x
    cy += y
  }
  cx /= hull.length
  cy /= hull.length
  return hull.map(([x, y]) => {
    const dx = x - cx
    const dy = y - cy
    const len = Math.hypot(dx, dy) || 1
    return [x + (dx / len) * pad, y + (dy / len) * pad] as Point
  })
}

export const strokeSmoothLoop = (ctx: CanvasRenderingContext2D, pts: Point[]): void => {
  if (pts.length < 3) return
  ctx.beginPath()
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  ctx.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2)
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i]!
    const next = pts[(i + 1) % pts.length]!
    ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2)
  }
  ctx.closePath()
  ctx.stroke()
}
