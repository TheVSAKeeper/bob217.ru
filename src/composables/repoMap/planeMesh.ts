import { DEPTH_MAX, type Projected } from './camera'
import type { Frame } from './types'

type Cell = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void

export const paintOnPlane = (
  f: Frame,
  halfX: number,
  halfY: number,
  grid: number,
  paint: Cell,
  ox = 0,
  oy = 0,
): void => {
  const { ctx, vp } = f
  const { W, H } = vp
  const cols = grid + 1
  const stepX = (halfX * 2) / grid
  const stepY = (halfY * 2) / grid
  const pts: Projected[] = []
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < cols; i++) {
      const [sx, sy, dz] = vp.w2s(-halfX + i * stepX, -halfY + j * stepY)
      pts.push([sx + ox, sy + oy, dz])
    }
  }

  const shard = (tri: Projected[], m: number[], x: number, y: number): void => {
    if (tri.some((p) => p[2] >= DEPTH_MAX || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) {
      return
    }
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(tri[0]![0], tri[0]![1])
    ctx.lineTo(tri[1]![0], tri[1]![1])
    ctx.lineTo(tri[2]![0], tri[2]![1])
    ctx.closePath()
    ctx.clip()
    ctx.transform(m[0]!, m[1]!, m[2]!, m[3]!, m[4]!, m[5]!)
    paint(ctx, x, y, stepX, stepY)
    ctx.restore()
  }

  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; i++) {
      const a = pts[j * cols + i]!
      const b = pts[j * cols + i + 1]!
      const c = pts[(j + 1) * cols + i]!
      const d = pts[(j + 1) * cols + i + 1]!
      if (Math.max(a[0], b[0], c[0], d[0]) < 0 || Math.min(a[0], b[0], c[0], d[0]) > W) continue
      if (Math.max(a[1], b[1], c[1], d[1]) < 0 || Math.min(a[1], b[1], c[1], d[1]) > H) continue
      const x = -halfX + i * stepX
      const y = -halfY + j * stepY
      const ax = (b[0] - a[0]) / stepX
      const ay = (b[1] - a[1]) / stepX
      const bx = (c[0] - a[0]) / stepY
      const by = (c[1] - a[1]) / stepY
      shard([a, b, c], [ax, ay, bx, by, a[0] - ax * x - bx * y, a[1] - ay * x - by * y], x, y)
      const cx = (d[0] - c[0]) / stepX
      const cy = (d[1] - c[1]) / stepX
      const dx = (d[0] - b[0]) / stepY
      const dy = (d[1] - b[1]) / stepY
      const ex = b[0] + c[0] - d[0]
      const ey = b[1] + c[1] - d[1]
      shard([b, d, c], [cx, cy, dx, dy, ex - cx * x - dx * y, ey - cy * x - dy * y], x, y)
    }
  }
}
