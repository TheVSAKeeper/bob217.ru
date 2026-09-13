import type { Repo } from '@/composables/useForkMap'
import type { Point } from './math'
import type { Viewport } from './camera'

export interface Anchor {
  key: string
  label: string
  ang: number
  radFrac: number
  bx: number
  by: number
  bz: number
  sx: number
  sy: number
  dist: number
  introDelay: number
  calloutStart: number
  color: string
  count: number
  hull: Point[]
  chain: Node[]
}

export interface Node {
  repo: Repo
  anchor: Anchor
  ang: number
  radFrac: number
  bx: number
  by: number
  bz: number
  ox: number
  oy: number
  ovx: number
  ovy: number
  col: string
  satPhase: number
  satPer: number
  twPhase: number
  twSpeed: number
  introDelay: number
  dist: number
}

export interface Particle {
  node: Node
  i: number
  t: number
  sp: number
}

export interface SatHit {
  node: Node
  i: number
  login: string
  merged: number
  last: string
  x: number
  y: number
}

export interface TipState {
  repo: Repo
  code: string
  x: number
  y: number
  pinned: boolean
}

export interface SatTipState {
  login: string
  repo: string
  merged: number
  share: number
  people: number
  last: string
  x: number
  y: number
}

export interface CoreTipState {
  x: number
  y: number
}

export interface Frame {
  ctx: CanvasRenderingContext2D
  vp: Viewport
  now: number
  reduce: boolean
  nodes: Node[]
  anchors: Anchor[]
  particles: Particle[]
  hover: Node | null
  hoverDomain: string | null
  hoverCore: boolean
  satHover: SatHit | null
  flowLayer: boolean
  intro: (start: number, dur: number) => number
  age: (start: number) => number
  hardOut: (n: Node) => boolean
  nodeRadius: (n: Node) => number
  domGlow: (key: string) => number
  pulseWave: (dist: number) => number
  pulseAge: number
  bright: Set<Node>
  activeFlow: () => Node[]
}
