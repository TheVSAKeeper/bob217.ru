import { D2R, easeOutQuint, TAU } from './math'

export type MapView = 'flat' | 'orbit'

export type Projected = [number, number, number]

export interface Camera {
  x: number
  y: number
  z: number
  s: number
  yaw: number
  spin: number
  pitch: number
  tx: number
  ty: number
  tz: number
  ts: number
  tyaw: number
  tpitch: number
}

export interface Viewport {
  cam: Camera
  W: number
  H: number
  R: number
  kx: number
  foc: number
  eyaw: () => number
  flat: () => boolean
  w2s: (wx: number, wy: number, wz?: number) => Projected
  s2w: (sx: number, sy: number) => [number, number]
}

export const DOLLY_FROM = 1.5
export const DOLLY_MS = 2600
export const ZOOM_MIN = 0.6
export const ZOOM_MAX = 2.5
export const PITCH_MAX = 65 * D2R
export const ORBIT_PITCH = 50 * D2R
export const ORBIT_RAD_PER_PX = 0.006
export const FOCAL_K = 0.85
export const ARC_YAW = 28 * D2R
export const ARC_MS = 1050
export const DRIFT_RAD_PER_S = 0.5 * D2R
export const DRIFT_HOLD_MS = 60000

const TARGET_SNAP = 1e-4
const HORIZON_FLOOR = 0.02
const HORIZON_SPAN = 8
const DEPTH_MAX = 6

export const createViewport = (): Viewport => {
  const cam: Camera = {
    x: 0,
    y: 0,
    z: 0,
    s: 1,
    yaw: 0,
    spin: 0,
    pitch: 0,
    tx: 0,
    ty: 0,
    tz: 0,
    ts: 1,
    tyaw: 0,
    tpitch: 0,
  }
  const eyaw = (): number => cam.yaw + cam.spin
  const flat = (): boolean => eyaw() === 0 && cam.pitch === 0
  const vp: Viewport = {
    cam,
    W: 0,
    H: 0,
    R: 340,
    kx: 1,
    foc: 1200,
    eyaw,
    flat,
    w2s: (wx, wy, wz = 0) => {
      if (flat()) return [(wx - cam.x) * cam.s + vp.W / 2, (wy - cam.y) * cam.s + vp.H / 2, 1]
      const px = (wx - cam.x) / vp.kx
      const py = wy - cam.y
      const a = eyaw()
      const cy = Math.cos(a)
      const sy = Math.sin(a)
      const cp = Math.cos(cam.pitch)
      const sp = Math.sin(cam.pitch)
      const x1 = px * cy - py * sy
      const y1 = px * sy + py * cy
      const pz = wz - cam.z
      const zc = y1 * sp + pz * cp
      const depth = vp.foc / Math.max(vp.foc / DEPTH_MAX, vp.foc - zc)
      return [vp.W / 2 + x1 * cam.s * depth, vp.H / 2 + (y1 * cp - pz * sp) * cam.s * depth, depth]
    },
    s2w: (sx, sy) => {
      if (flat()) return [(sx - vp.W / 2) / cam.s + cam.x, (sy - vp.H / 2) / cam.s + cam.y]
      const nx = (sx - vp.W / 2) / cam.s
      const ny = (sy - vp.H / 2) / cam.s
      const sp = Math.sin(cam.pitch)
      const cp = Math.cos(cam.pitch)
      const h = -cam.z
      const den = vp.foc * cp + ny * sp
      const reach = HORIZON_SPAN * vp.R
      const far = (ny * (vp.foc - h * cp) + h * sp * vp.foc) / Math.max(den, vp.foc * HORIZON_FLOOR)
      const y1 = Math.max(-reach, Math.min(reach, far))
      const x1 = (nx * Math.max(vp.foc / DEPTH_MAX, vp.foc - y1 * sp - h * cp)) / vp.foc
      const a = eyaw()
      const cy = Math.cos(a)
      const sy2 = Math.sin(a)
      return [(x1 * cy + y1 * sy2) * vp.kx + cam.x, y1 * cy - x1 * sy2 + cam.y]
    },
  }
  return vp
}

const follow = (v: number, t: number, k: number): number => {
  const d = t - v
  return Math.abs(d) < TARGET_SNAP ? t : v + d * k
}

export const followTargets = (cam: Camera, dt: number): void => {
  const k = Math.min(1, dt * 6)
  cam.x += (cam.tx - cam.x) * k
  cam.y += (cam.ty - cam.y) * k
  cam.z = follow(cam.z, cam.tz, k)
  cam.s += (cam.ts - cam.s) * k
  cam.yaw = follow(cam.yaw, cam.tyaw, k)
  cam.pitch = follow(cam.pitch, cam.tpitch, k)
}

export const clampPitch = (p: number): number => Math.min(PITCH_MAX, Math.max(0, p))

export const dollyScale = (age: number): number =>
  DOLLY_FROM + (1 - DOLLY_FROM) * easeOutQuint(Math.min(1, age / DOLLY_MS))

export const arcSpin = (age: number): number =>
  age < 0 || age >= ARC_MS ? 0 : ARC_YAW * (0.5 - 0.5 * Math.cos((age / ARC_MS) * TAU))
