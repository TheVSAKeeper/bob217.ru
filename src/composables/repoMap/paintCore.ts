import { OWNER } from '@/composables/useForkMap'
import { easeOut, TAU } from './math'
import { blit, glowSprite, spikeSprite } from './sprites'
import { drawTracked, hairline, MONO } from './text'
import type { Viewport } from './camera'
import type { Frame } from './types'

export const CORE_BASE = 26
export const PULSE_MS = 800
const ACCENT = '#ffcc00'
const RING_STEPS = 36

const ringPath = (vp: Viewport, ctx: CanvasRenderingContext2D, rad: number): void => {
  for (let i = 0; i <= RING_STEPS; i++) {
    const t = (i / RING_STEPS) * TAU
    const [x, y] = vp.w2s(Math.cos(t) * rad * vp.kx, Math.sin(t) * rad)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

export const paintPulse = (f: Frame): void => {
  if (f.reduce) return
  const { ctx, vp } = f
  const [hsx, hsy] = vp.w2s(0, 0)
  const ring = (age: number, width: number, alpha: number): void => {
    if (age < 0 || age >= PULSE_MS) return
    const p = age / PULSE_MS
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = (1 - p) * alpha
    ctx.strokeStyle = ACCENT
    ctx.lineWidth = width
    const rad = easeOut(p) * vp.R * 1.15
    const front = rad * vp.cam.s
    ctx.beginPath()
    if (vp.flat()) ctx.ellipse(hsx, hsy, front * vp.kx, front, 0, 0, TAU)
    else ringPath(vp, ctx, rad)
    ctx.stroke()
    ctx.restore()
  }
  ring(f.pulseAge, 2.2, 0.5)
  ring(f.pulseAge - 110, 1, 0.28)
}

export const paintCore = (f: Frame): void => {
  const { ctx, vp } = f
  const intro = f.intro(0, 620)
  if (intro <= 0) return
  const [hsx, hsy, hdz] = vp.w2s(0, 0)
  const cr = (CORE_BASE + (f.hoverCore ? 5 : 0)) * vp.cam.s * hdz * intro
  const breathe = f.reduce ? 1 : 1 + 0.035 * Math.sin(f.now / 1400)

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  blit(ctx, glowSprite(ACCENT), hsx, hsy, cr * 5.2 * breathe, (f.hoverCore ? 0.75 : 0.55) * intro)
  ctx.translate(hsx, hsy)
  if (!f.reduce) ctx.rotate((f.now / 62000) * TAU)
  blit(ctx, spikeSprite(ACCENT), 0, 0, cr * 5.4 * breathe, 0.32 * intro)
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = intro
  const grad = ctx.createRadialGradient(hsx, hsy, 0, hsx, hsy, cr)
  grad.addColorStop(0, '#fffdf2')
  grad.addColorStop(0.42, '#ffdb4d')
  grad.addColorStop(1, '#ff9f00')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(hsx, hsy, cr, 0, TAU)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = (f.hoverCore ? 0.55 : 0.3) * intro
  ctx.strokeStyle = ACCENT
  ctx.lineWidth = 1
  ctx.setLineDash([4, 9])
  ctx.lineDashOffset = f.reduce ? 0 : -f.now / 90
  ctx.beginPath()
  ctx.arc(hsx, hsy, cr + 13, 0, TAU)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = (f.hoverCore ? 1 : 0.75) * intro
  ctx.fillStyle = f.hoverCore ? '#fff' : '#d8d8d8'
  ctx.font = `700 12px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const width = drawTracked(ctx, `@${OWNER}`, hsx, hsy + cr + 20, 2.2)
  ctx.globalAlpha = 0.4 * intro
  hairline(ctx, hsx, hsy + cr + 29, width, ACCENT)
  ctx.restore()
}
