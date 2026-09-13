import { DOLLY_MS } from './camera'
import { FLARE_MS } from './layout'
import { clamp01, depthAlpha, easeOutBack, TAU } from './math'
import { blit, glowSprite, spikeSprite } from './sprites'
import { drawChip, MONO } from './text'
import type { Frame, Node } from './types'

const LABEL_ZOOM = 1.3

const nodeAlpha = (f: Frame, n: Node): number => {
  if (f.hardOut(n)) return 0.12
  const dim = f.hover && f.hover !== n ? 0.4 : 1
  const flowDim = f.flowLayer && !n.repo.contributors.length ? 0.4 : 1
  return dim * flowDim
}

export const paintNodes = (f: Frame): void => {
  const { ctx, vp } = f
  for (const n of f.nodes) {
    const intro = f.intro(n.introDelay, 420)
    if (intro <= 0) continue
    const [sx, sy, dz] = vp.w2s(n.bx + n.ox, n.by + n.oy)
    const hv = f.hover === n
    const g = f.domGlow(n.repo.domain)
    const wave = f.pulseWave(n.dist)
    const tw = f.reduce ? 1 : 1 + 0.07 * Math.sin((f.now / 900) * n.twSpeed + n.twPhase)
    const grow = clamp01(easeOutBack(intro))
    const nr =
      Math.max(0.4, f.nodeRadius(n) * vp.cam.s * dz) *
      grow *
      (hv ? 1.28 : 1 + 0.08 * g + 0.35 * wave)
    const A = nodeAlpha(f, n) * depthAlpha(dz)

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    blit(ctx, glowSprite(n.col), sx, sy, nr * 3.6 * tw, A * (0.34 + 0.3 * g + 0.5 * wave))
    if (f.bright.has(n))
      blit(ctx, spikeSprite(n.col), sx, sy, nr * (hv ? 8 : 6.4) * tw, A * (hv ? 0.75 : 0.5))
    const flare = f.age(n.introDelay)
    if (flare >= 0 && flare < FLARE_MS) {
      const p = 1 - flare / FLARE_MS
      blit(ctx, glowSprite('#ffffff'), sx, sy, nr * (2 + 4 * p), p * p * 0.75)
    }
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = A
    ctx.fillStyle = n.col
    ctx.beginPath()
    ctx.arc(sx, sy, nr, 0, TAU)
    ctx.fill()
    ctx.globalAlpha = A * 0.85
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(sx, sy, nr * 0.42, 0, TAU)
    ctx.fill()
    if (hv) {
      ctx.globalAlpha = 0.55
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(sx, sy, nr + 6, 0, TAU)
      ctx.stroke()
    }
    ctx.restore()
  }
}

export const paintNodeLabels = (f: Frame): void => {
  const { ctx, vp } = f
  if (vp.cam.s < LABEL_ZOOM || (!f.reduce && f.age(0) < DOLLY_MS)) return
  const zoomIn = Math.min(1, (vp.cam.s - LABEL_ZOOM) / 0.3)
  ctx.save()
  ctx.font = `10px ${MONO}`
  for (const n of f.nodes) {
    const intro = f.intro(n.introDelay, 420)
    if (intro <= 0 || f.hardOut(n)) continue
    const [sx, sy, dz] = vp.w2s(n.bx + n.ox, n.by + n.oy)
    const nr = f.nodeRadius(n) * vp.cam.s * dz
    ctx.globalAlpha = zoomIn * intro * depthAlpha(dz) * (f.hover && f.hover !== n ? 0.5 : 1)
    drawChip(ctx, n.repo.name, sx, sy + nr + 7, f.hover === n ? '#fff' : '#c9c9c9')
  }
  ctx.restore()
}
