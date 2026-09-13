import { DEPTH_MAX, type Projected } from './camera'
import { clamp01, mixHex, withAlpha } from './math'
import type { Anchor, Frame } from './types'

interface Star {
  x: number
  y: number
  r: number
  a: number
  depth: number
  layer: number
  tw: number
}

const STAR_COUNT = 320
const NEB_TEX = 512
const NEB_SPAN = 3.6
const DEEP = '#2b3a7a'
const STAR_DEPTH_MIN = 0.2
const STAR_DEPTH_SPAN = 0.55
const SKY_LAYERS = [
  { yaw: 0.18, pitch: 0.05 },
  { yaw: 0.35, pitch: 0.1 },
  { yaw: 0.62, pitch: 0.18 },
]
const NEB_YAW_PX = 12
const NEB_PITCH_PX = 18
const NEB_GRID = 8

const layerOf = (depth: number): number =>
  Math.min(
    SKY_LAYERS.length - 1,
    Math.floor(((depth - STAR_DEPTH_MIN) / STAR_DEPTH_SPAN) * SKY_LAYERS.length),
  )

export interface Backdrop {
  build: (rnd: () => number, anchors: Anchor[], R: number) => void
  resize: (W: number, H: number) => void
  draw: (f: Frame) => void
  drawVignette: (ctx: CanvasRenderingContext2D) => void
}

export const createBackdrop = (): Backdrop => {
  let stars: Star[] = []
  let nebula: HTMLCanvasElement | null = null
  let vignette: HTMLCanvasElement | null = null
  let span = 1

  const build = (rnd: () => number, anchors: Anchor[], R: number): void => {
    stars = Array.from({ length: STAR_COUNT }, () => {
      const ang = rnd() * Math.PI * 2
      const rad = Math.sqrt(rnd()) * R * 2.6
      const depth = STAR_DEPTH_MIN + rnd() * STAR_DEPTH_SPAN
      return {
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        r: 0.5 + rnd() * 1.3,
        a: 0.12 + rnd() * 0.5,
        depth,
        layer: layerOf(depth),
        tw: rnd() * Math.PI * 2,
      }
    })

    span = R * NEB_SPAN
    const el = document.createElement('canvas')
    el.width = NEB_TEX
    el.height = NEB_TEX
    const ctx = el.getContext('2d') as CanvasRenderingContext2D
    const k = NEB_TEX / span
    const c = NEB_TEX / 2
    ctx.globalCompositeOperation = 'lighter'

    const cloud = (x: number, y: number, radius: number, color: string, alpha: number): void => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
      grad.addColorStop(0, withAlpha(color, alpha))
      grad.addColorStop(0.45, withAlpha(color, alpha * 0.4))
      grad.addColorStop(1, withAlpha(color, 0))
      ctx.fillStyle = grad
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }

    for (const a of anchors) {
      if (!a.count) continue
      const tint = mixHex(a.color, DEEP, 0.5)
      cloud(c + a.bx * k, c + a.by * k, R * 0.52 * k, tint, 0.19)
      cloud(c + a.bx * 1.55 * k, c + a.by * 1.55 * k, R * 0.3 * k, tint, 0.1)
    }
    cloud(c, c, R * 0.44 * k, '#ffb43c', 0.13)
    nebula = el
  }

  const resize = (W: number, H: number): void => {
    if (W <= 0 || H <= 0) return
    const el = document.createElement('canvas')
    el.width = W
    el.height = H
    const ctx = el.getContext('2d') as CanvasRenderingContext2D
    const grad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.28,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.78,
    )
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,.62)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    vignette = el
  }

  const paintTiles = (f: Frame, tex: HTMLCanvasElement): void => {
    const { ctx, vp } = f
    const { W, H } = vp
    const ox = NEB_YAW_PX * Math.sin(vp.eyaw())
    const oy = NEB_PITCH_PX * Math.sin(vp.cam.pitch)
    const cols = NEB_GRID + 1
    const step = span / NEB_GRID
    const grid: Projected[] = []
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < cols; i++) {
        const [x, y, dz] = vp.w2s(-span / 2 + i * step, -span / 2 + j * step)
        grid.push([x + ox, y + oy, dz])
      }
    }

    const tile = NEB_TEX / NEB_GRID
    const shard = (tri: Projected[], m: number[], sx: number, sy: number): void => {
      if (tri.some((p) => p[2] >= DEPTH_MAX)) return
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(tri[0]![0], tri[0]![1])
      ctx.lineTo(tri[1]![0], tri[1]![1])
      ctx.lineTo(tri[2]![0], tri[2]![1])
      ctx.closePath()
      ctx.clip()
      ctx.transform(m[0]!, m[1]!, m[2]!, m[3]!, m[4]!, m[5]!)
      ctx.drawImage(tex, sx, sy, tile, tile, 0, 0, tile, tile)
      ctx.restore()
    }

    for (let j = 0; j < NEB_GRID; j++) {
      for (let i = 0; i < NEB_GRID; i++) {
        const a = grid[j * cols + i]!
        const b = grid[j * cols + i + 1]!
        const c = grid[(j + 1) * cols + i]!
        const d = grid[(j + 1) * cols + i + 1]!
        if (Math.max(a[0], b[0], c[0], d[0]) < 0 || Math.min(a[0], b[0], c[0], d[0]) > W) continue
        if (Math.max(a[1], b[1], c[1], d[1]) < 0 || Math.min(a[1], b[1], c[1], d[1]) > H) continue
        const sx = i * tile
        const sy = j * tile
        shard(
          [a, b, c],
          [
            (b[0] - a[0]) / tile,
            (b[1] - a[1]) / tile,
            (c[0] - a[0]) / tile,
            (c[1] - a[1]) / tile,
            a[0],
            a[1],
          ],
          sx,
          sy,
        )
        shard(
          [b, d, c],
          [
            (d[0] - c[0]) / tile,
            (d[1] - c[1]) / tile,
            (d[0] - b[0]) / tile,
            (d[1] - b[1]) / tile,
            b[0] + c[0] - d[0],
            b[1] + c[1] - d[1],
          ],
          sx,
          sy,
        )
      }
    }
  }

  const draw = (f: Frame): void => {
    const { ctx, vp } = f
    const { cam, W, H } = vp
    const fade = f.intro(0, 900)
    if (fade <= 0) return

    if (nebula) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.9 * fade
      if (vp.flat()) {
        const [nx, ny] = vp.w2s(-span / 2, -span / 2)
        ctx.drawImage(nebula, nx, ny, span * cam.s, span * cam.s)
      } else {
        paintTiles(f, nebula)
      }
      ctx.restore()
    }

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const yaw = vp.eyaw()
    const sp = Math.sin(cam.pitch)
    const sky = SKY_LAYERS.map((l) => ({
      cos: Math.cos(yaw * l.yaw),
      sin: Math.sin(yaw * l.yaw),
      dy: sp * l.pitch * H,
    }))
    for (const s of stars) {
      const sd = 1 + (cam.s - 1) * s.depth
      const px = s.x - cam.x * s.depth
      const py = s.y - cam.y * s.depth
      const l = sky[s.layer]!
      const x = (px * l.cos - py * l.sin) * sd + W / 2
      const y = (px * l.sin + py * l.cos) * sd + H / 2 + l.dy
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue
      const tw = f.reduce ? 1 : 0.72 + 0.28 * Math.sin(f.now / 780 + s.tw)
      ctx.globalAlpha = clamp01(s.a * tw * fade)
      ctx.fillStyle = '#dfe7ff'
      ctx.fillRect(x - s.r / 2, y - s.r / 2, s.r, s.r)
    }
    ctx.restore()
  }

  const drawVignette = (ctx: CanvasRenderingContext2D): void => {
    if (vignette) ctx.drawImage(vignette, 0, 0)
  }

  return { build, resize, draw, drawVignette }
}
