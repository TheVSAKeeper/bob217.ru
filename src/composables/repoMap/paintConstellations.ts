import { depthAlpha, strokeSmoothLoop, withAlpha, type Point } from './math'
import { drawTracked, hairline, MONO } from './text'
import type { Frame } from './types'

export const paintConstellations = (f: Frame): void => {
  const { ctx, vp } = f
  const [hsx, hsy] = vp.w2s(0, 0)

  for (const a of f.anchors) {
    const intro = f.intro(a.introDelay, 260)
    if (intro <= 0) continue
    const [ax, ay, adz] = vp.w2s(a.bx, a.by)
    const g = f.domGlow(a.key)
    ctx.save()
    ctx.globalAlpha = (0.07 + 0.28 * g) * intro * depthAlpha(adz)
    ctx.strokeStyle = g > 0.02 ? a.color : '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(hsx, hsy)
    ctx.lineTo(hsx + (ax - hsx) * intro, hsy + (ay - hsy) * intro)
    ctx.stroke()
    ctx.restore()
  }

  for (const a of f.anchors) {
    if (a.hull.length < 3) continue
    const intro = f.intro(a.introDelay + 320, 700)
    if (intro <= 0) continue
    const g = f.domGlow(a.key)
    let dzSum = 0
    const pts: Point[] = a.hull.map(([x, y]): Point => {
      const [px, py, pdz] = vp.w2s(x, y)
      dzSum += pdz
      return [px, py]
    })
    const haze = depthAlpha(dzSum / a.hull.length)
    ctx.save()
    ctx.globalAlpha = (0.12 + 0.3 * g) * intro * haze
    ctx.strokeStyle = g > 0.02 ? a.color : 'rgba(255,255,255,.9)'
    ctx.lineWidth = 1
    ctx.setLineDash(g > 0.02 ? [] : [5, 7])
    strokeSmoothLoop(ctx, pts)
    ctx.restore()

    if (g > 0.02 && a.chain.length > 1) {
      ctx.save()
      ctx.globalAlpha = 0.4 * g * haze
      ctx.strokeStyle = a.color
      ctx.lineWidth = 1
      ctx.beginPath()
      a.chain.forEach((n, i) => {
        const [nx, ny] = vp.w2s(n.bx + n.ox, n.by + n.oy)
        if (i === 0) ctx.moveTo(nx, ny)
        else ctx.lineTo(nx, ny)
      })
      ctx.stroke()
      ctx.restore()
    }
  }

  for (const n of f.nodes) {
    const intro = f.intro(n.introDelay, 320)
    if (intro <= 0) continue
    const [ax, ay] = vp.w2s(n.anchor.bx, n.anchor.by)
    const [sx, sy, dz] = vp.w2s(n.bx + n.ox, n.by + n.oy)
    const g = f.domGlow(n.repo.domain)
    const out = f.hardOut(n)
    ctx.save()
    ctx.globalAlpha = (out ? 0.03 : 0.07 + 0.25 * g) * intro * depthAlpha(dz)
    ctx.strokeStyle = g > 0.02 ? n.anchor.color : '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(sx, sy)
    ctx.stroke()
    ctx.restore()
  }
}

export const paintDomainLabels = (f: Frame): void => {
  const { ctx, vp } = f
  for (const a of f.anchors) {
    const [ax, ay] = vp.w2s(a.bx, a.by)
    a.sx = ax
    a.sy = ay
    const intro = f.intro(a.introDelay + 180, 420)
    if (intro <= 0) continue
    const g = f.domGlow(a.key)
    ctx.save()
    ctx.globalAlpha = intro * (0.62 + 0.38 * g)
    ctx.fillStyle = g > 0.02 ? '#fff' : '#b9b9b9'
    ctx.font = `700 10px ${MONO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const width = drawTracked(ctx, a.label.toUpperCase(), ax, ay, 3.4)
    ctx.globalAlpha = intro * (0.28 + 0.5 * g)
    hairline(ctx, ax, ay + 9, width, g > 0.02 ? a.color : withAlpha('#ffffff', 0.75))
    ctx.font = `400 9px ${MONO}`
    ctx.fillStyle = g > 0.02 ? a.color : '#8a8a8a'
    ctx.fillText(String(a.count), ax, ay + 18)
    ctx.restore()
  }
}
