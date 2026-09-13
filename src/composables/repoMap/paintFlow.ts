import { SAT_INTRO } from './layout'
import { depthAlpha, easeOut, TAU } from './math'
import { satScreen } from './satellites'
import { blit, glowSprite } from './sprites'
import type { Frame } from './types'

const FLOW = '#ffcc00'

export const paintFlow = (f: Frame): void => {
  const { ctx, vp } = f

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const p of f.particles) {
    const n = p.node
    const [sx, sy, dz] = vp.w2s(n.bx + n.ox, n.by + n.oy)
    const nr = f.nodeRadius(n) * vp.cam.s * dz
    const [fx, fy] = satScreen(vp, n, p.i, sx, sy, nr, f.now)
    const fade = p.t < 0.12 ? p.t / 0.12 : 1
    const ee = easeOut(Math.min(p.t, 1))
    const cx = fx + (sx - fx) * ee
    const cy = fy + (sy - fy) * ee
    const tailT = Math.max(0, ee - 0.42)
    const tx = fx + (sx - fx) * tailT
    const ty = fy + (sy - fy) * tailT
    const grad = ctx.createLinearGradient(tx, ty, cx, cy)
    grad.addColorStop(0, 'rgba(255,204,0,0)')
    grad.addColorStop(1, `rgba(255,214,80,${0.95 * fade})`)
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(cx, cy)
    ctx.stroke()
    blit(ctx, glowSprite(FLOW), cx, cy, 7, 0.5 * fade)
  }

  if (f.reduce) {
    for (const n of f.activeFlow()) {
      const [sx, sy, dz] = vp.w2s(n.bx + n.ox, n.by + n.oy)
      const nr = f.nodeRadius(n) * vp.cam.s * dz
      n.repo.contributors.forEach((_, i) => {
        const [fx, fy] = satScreen(vp, n, i, sx, sy, nr, f.now)
        const grad = ctx.createLinearGradient(fx, fy, sx, sy)
        grad.addColorStop(0, 'rgba(255,204,0,.15)')
        grad.addColorStop(1, 'rgba(255,204,0,.6)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.lineTo(sx, sy)
        ctx.stroke()
      })
    }
  }
  ctx.restore()
}

export const paintSatellites = (f: Frame): void => {
  const { ctx, vp } = f
  const intro = f.intro(SAT_INTRO, 600)
  if (intro <= 0) return

  for (const n of f.nodes) {
    if (!n.repo.contributors.length || f.hardOut(n)) continue
    const [sx, sy, dz] = vp.w2s(n.bx + n.ox, n.by + n.oy)
    const nr = f.nodeRadius(n) * vp.cam.s * dz
    const dim = f.hover && f.hover !== n ? 0.4 : 1
    const top = n.repo.contributors[0]?.merged ?? 1
    n.repo.contributors.forEach((c, i) => {
      const [fx, fy] = satScreen(vp, n, i, sx, sy, nr, f.now)
      const on = f.satHover?.node === n && f.satHover.i === i
      const rad = 2.6 + 1.7 * Math.sqrt(c.merged / top) + (on ? 2 : 0)
      const a = (on ? 1 : 0.8) * intro * dim * depthAlpha(dz)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      blit(ctx, glowSprite(FLOW), fx, fy, rad * (on ? 6 : 4), a * 0.55)
      ctx.restore()
      ctx.save()
      ctx.globalAlpha = a
      ctx.fillStyle = on ? '#fff' : FLOW
      ctx.beginPath()
      ctx.arc(fx, fy, rad, 0, TAU)
      ctx.fill()
      if (on) {
        ctx.globalAlpha = 0.6 * intro
        ctx.strokeStyle = FLOW
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(fx, fy, rad + 4, 0, TAU)
        ctx.stroke()
      }
      ctx.restore()
    })
  }
}
