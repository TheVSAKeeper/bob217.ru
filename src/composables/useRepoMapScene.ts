import { readonly, ref, watch, type Ref } from 'vue'
import type { Repo, SizeBy } from '@/composables/useForkMap'
import { createBackdrop } from '@/composables/repoMap/backdrop'
import {
  clampPitch,
  createViewport,
  dollyScale,
  DOLLY_MS,
  FOCAL_K,
  followTargets,
  ORBIT_PITCH,
  ORBIT_RAD_PER_PX,
  ZOOM_MAX,
  ZOOM_MIN,
  type MapView,
} from '@/composables/repoMap/camera'
import { buildScene, layoutScene, SAT_INTRO } from '@/composables/repoMap/layout'
import { clamp01, easeOut, mulberry32 } from '@/composables/repoMap/math'
import { paintConstellations, paintDomainLabels } from '@/composables/repoMap/paintConstellations'
import { paintCore, paintPulse, PULSE_MS } from '@/composables/repoMap/paintCore'
import { paintFlow, paintSatellites } from '@/composables/repoMap/paintFlow'
import { paintNodeLabels, paintNodes } from '@/composables/repoMap/paintNodes'
import {
  pickCore,
  pickDomain,
  pickNode,
  pickSat,
  type PickCtx,
} from '@/composables/repoMap/picking'
import type {
  Anchor,
  CoreTipState,
  Frame,
  Node,
  Particle,
  SatHit,
  SatTipState,
  TipState,
} from '@/composables/repoMap/types'

export type { CoreTipState, MapView, SatTipState, TipState }

interface SceneParams {
  repos: Ref<Repo[]>
  filt: Ref<'all' | 'forked'>
  flowLayer: Ref<boolean>
  langOff: Ref<Set<string>>
  sizeBy: Ref<SizeBy>
}

const SEED = 20240720
const WAVE_WIDTH = 76
const BRIGHT_COUNT = 6
const BRIGHT_EVERY = 400
const VIEW_KEY = 'repo-map-view'

const readView = (): MapView => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'orbit' ? 'orbit' : 'flat'
  } catch {
    return 'flat'
  }
}

const writeView = (v: MapView): void => {
  try {
    localStorage.setItem(VIEW_KEY, v)
  } catch {
    return
  }
}

export function useRepoMapScene(params: SceneParams) {
  const tip = ref<TipState | null>(null)
  const satTip = ref<SatTipState | null>(null)
  const coreTip = ref<CoreTipState | null>(null)
  const counter = ref(0)
  const view = ref<MapView>(readView())

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let rnd = mulberry32(SEED)

  const vp = createViewport()
  const backdrop = createBackdrop()
  let nodes: Node[] = []
  let drawNodes: Node[] = []
  let anchors: Anchor[] = []
  const particles: Particle[] = []
  const spawnAcc = new Map<Node, number>()
  const bright = new Set<Node>()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let T0 = 0
  let last = 0
  let nowMs = 0
  let introBase = 0
  let pulseStart = -1e9
  let brightAt = -1e9
  let dolly = true

  const maxMetric: Record<SizeBy, number> = { stars: 1, forks: 1, merged: 1, size: 1, commits: 1 }

  let hover: Node | null = null
  let focusNode: Node | null = null
  let hoverDomain: string | null = null
  let satHover: SatHit | null = null
  let hoverCore = false
  let tipNode: Node | null = null

  const metricVal = (n: Node): number => {
    const r = n.repo
    switch (params.sizeBy.value) {
      case 'stars':
        return r.stars
      case 'forks':
        return r.forks
      case 'merged':
        return r.merged
      case 'size':
        return r.sizeKb
      case 'commits':
        return r.commits ?? 0
    }
  }

  const nodeRadius = (n: Node): number => {
    const mx = maxMetric[params.sizeBy.value] || 1
    return 5 + 9 * Math.sqrt(Math.max(0, metricVal(n)) / mx)
  }

  const hardOut = (n: Node): boolean => {
    if (params.filt.value === 'forked' && n.repo.forks === 0) return true
    return params.langOff.value.size > 0 && params.langOff.value.has(n.repo.lang)
  }

  const emitsFlow = (n: Node): boolean => n.repo.contributors.length > 0

  const activeFlow = (): Node[] => {
    if (params.flowLayer.value) return nodes.filter((n) => emitsFlow(n) && !hardOut(n))
    if (hover && emitsFlow(hover)) return [hover]
    if (focusNode && emitsFlow(focusNode)) return [focusNode]
    return []
  }

  const intro = (start: number, dur: number): number => {
    if (reduce) return 1
    const t = clamp01((nowMs - introBase - start) / dur)
    return t === 0 ? 0 : easeOut(t)
  }

  const age = (start: number): number => nowMs - introBase - start

  const domGlow = (key: string): number => {
    if (hoverDomain === key) return 1
    if (reduce) return 0
    const a = anchors.find((x) => x.key === key)
    if (!a) return 0
    const t = nowMs - a.calloutStart
    if (t < 0 || t > 2500) return 0
    return t < 800 ? t / 800 : Math.max(0, 1 - (t - 800) / 1200)
  }

  const pulseWave = (dist: number): number => {
    if (reduce) return 0
    const t = nowMs - pulseStart
    if (t < 0 || t >= PULSE_MS) return 0
    const front = easeOut(t / PULSE_MS) * vp.R * 1.15
    return Math.max(0, 1 - Math.abs(dist - front) / WAVE_WIDTH)
  }

  const nodeDepth = (n: Node): number => vp.w2s(n.bx + n.ox, n.by + n.oy)[2]

  const orderByDepth = (): void => {
    if (vp.flat()) {
      drawNodes = nodes
      return
    }
    drawNodes = nodes
      .map((n): [number, Node] => [nodeDepth(n), n])
      .sort((a, b) => a[0] - b[0])
      .map(([, n]) => n)
  }

  const frame = (): Frame => ({
    ctx,
    vp,
    now: nowMs,
    reduce,
    nodes: drawNodes,
    anchors,
    particles,
    hover,
    hoverDomain,
    hoverCore,
    satHover,
    flowLayer: params.flowLayer.value,
    intro,
    age,
    hardOut,
    nodeRadius,
    domGlow,
    pulseWave,
    pulseAge: nowMs - pulseStart,
    bright,
    activeFlow,
  })

  const pickCtx = (): PickCtx => ({ vp, nodes, anchors, now: nowMs, hardOut, nodeRadius })

  const layout = (): void => {
    const host = canvas.parentElement as HTMLElement
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    vp.W = host.clientWidth
    vp.H = host.clientHeight
    canvas.width = Math.round(vp.W * dpr)
    canvas.height = Math.round(vp.H * dpr)
    canvas.style.width = `${vp.W}px`
    canvas.style.height = `${vp.H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    vp.R = Math.min(vp.W, vp.H) / 2 - (vp.W < 560 ? 36 : 64)
    vp.kx = Math.max(1, Math.min(1.4, vp.W / vp.H / 1.5))
    vp.foc = Math.max(600, FOCAL_K * Math.max(vp.W, vp.H))
    layoutScene(nodes, anchors, vp.R, vp.kx)
    backdrop.build(mulberry32(SEED + 7), anchors, vp.R)
    backdrop.resize(vp.W, vp.H)
  }

  const refreshBright = (): void => {
    bright.clear()
    const ranked = nodes
      .filter((n) => !hardOut(n) && metricVal(n) > 0)
      .sort((a, b) => metricVal(b) - metricVal(a))
      .slice(0, BRIGHT_COUNT)
    for (const n of ranked) bright.add(n)
    brightAt = nowMs
  }

  const pickSource = (n: Node): number => {
    const list = n.repo.contributors
    let roll = rnd() * n.repo.merged
    for (let i = 0; i < list.length; i++) {
      roll -= list[i]!.merged
      if (roll <= 0) return i
    }
    return list.length - 1
  }

  const emitParticles = (dt: number): void => {
    if (reduce || intro(SAT_INTRO, 500) < 1) return
    const active = activeFlow()
    const set = new Set(active)
    for (const n of active) {
      const rate = Math.min(8, n.repo.merged / 8)
      let acc = (spawnAcc.get(n) ?? 0) + rate * dt
      while (acc >= 1) {
        particles.push({ node: n, i: pickSource(n), t: 0, sp: 70 * (0.9 + rnd() * 0.2) })
        acc -= 1
      }
      spawnAcc.set(n, acc)
    }
    for (const k of spawnAcc.keys()) if (!set.has(k)) spawnAcc.set(k, 0)
  }

  const update = (dt: number): void => {
    let ms = 1
    let mf = 1
    let mm = 1
    let mz = 1
    let mc = 1
    for (const n of nodes) {
      ms = Math.max(ms, n.repo.stars)
      mf = Math.max(mf, n.repo.forks)
      mm = Math.max(mm, n.repo.merged)
      mz = Math.max(mz, n.repo.sizeKb)
      mc = Math.max(mc, n.repo.commits ?? 0)
    }
    maxMetric.stars = ms
    maxMetric.forks = mf
    maxMetric.merged = mm
    maxMetric.size = mz
    maxMetric.commits = mc
    if (nowMs - brightAt > BRIGHT_EVERY) refreshBright()

    for (const n of nodes) {
      let tox = 0
      let toy = 0
      if (dragNode === n && dragging) {
        tox = dragW[0] - n.bx
        toy = dragW[1] - n.by
      }
      n.ovx += (tox - n.ox) * 0.12
      n.ovx *= 0.82
      n.ox += n.ovx
      n.ovy += (toy - n.oy) * 0.12
      n.ovy *= 0.82
      n.oy += n.ovy
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      const dist = nodeRadius(p.node) * vp.cam.s * nodeDepth(p.node) + 13
      p.t += (p.sp * dt) / dist
      if (p.t >= 1) particles.splice(i, 1)
    }

    const introAge = nowMs - introBase
    if (dolly && !reduce && introAge < DOLLY_MS) {
      vp.cam.s = vp.cam.ts = dollyScale(introAge)
    } else if (dolly) {
      dolly = false
      vp.cam.ts = 1
    }
    followTargets(vp.cam, dt)
    emitParticles(dt)
  }

  const draw = (): void => {
    orderByDepth()
    const f = frame()
    ctx.clearRect(0, 0, vp.W, vp.H)
    backdrop.draw(f)
    paintConstellations(f)
    paintFlow(f)
    paintSatellites(f)
    paintNodes(f)
    paintNodeLabels(f)
    paintDomainLabels(f)
    paintPulse(f)
    paintCore(f)
    backdrop.drawVignette(ctx)
  }

  const tickCounter = (): void => {
    if (reduce) {
      counter.value = nodes.length
      return
    }
    let seated = 0
    for (const n of nodes) if (nowMs - introBase >= n.introDelay) seated++
    const v = Math.min(nodes.length, seated)
    if (v !== counter.value) counter.value = v
  }

  const tipAt = (n: Node): [number, number] => {
    const [x, y] = vp.w2s(n.bx + n.ox, n.by + n.oy)
    return [Math.round(x), Math.round(y)]
  }

  const syncTip = (): void => {
    const t = tip.value
    if (!tipNode || !t) return
    const [x, y] = tipAt(tipNode)
    if (Math.abs(t.x - x) > 0.6 || Math.abs(t.y - y) > 0.6) tip.value = { ...t, x, y }
  }

  let raf = 0
  const tick = (t: number): void => {
    nowMs = t - T0
    const dt = Math.min(0.05, (t - last) / 1000)
    last = t
    update(dt)
    draw()
    syncTip()
    tickCounter()
    raf = requestAnimationFrame(tick)
  }

  const calloutAll = (): void => {
    anchors.forEach((a, i) => {
      a.calloutStart = nowMs + i * 150
    })
  }

  const pulse = (): void => {
    pulseStart = nowMs
  }

  const viewPitch = (): number => (view.value === 'orbit' ? ORBIT_PITCH : 0)

  const snapView = (): void => {
    vp.cam.yaw = vp.cam.tyaw = 0
    vp.cam.pitch = vp.cam.tpitch = viewPitch()
  }

  const setView = (v: MapView): void => {
    if (view.value === v) return
    view.value = v
    writeView(v)
    dolly = false
    vp.cam.tyaw = 0
    vp.cam.tpitch = viewPitch()
    if (reduce) snapView()
  }

  const anchorTo = (wx: number, wy: number, sx: number, sy: number, ns: number): void => {
    vp.cam.s = ns
    vp.cam.ts = ns
    if (vp.flat()) {
      vp.cam.x = wx - (sx - vp.W / 2) / ns
      vp.cam.y = wy - (sy - vp.H / 2) / ns
    } else {
      for (let i = 0; i < 2; i++) {
        const [ux, uy] = vp.s2w(sx, sy)
        vp.cam.x += wx - ux
        vp.cam.y += wy - uy
      }
    }
    vp.cam.tx = vp.cam.x
    vp.cam.ty = vp.cam.y
  }

  const rebuild = (): void => {
    introBase = nowMs
    dolly = true
    focusNode = null
    hover = null
    satHover = null
    hoverCore = false
    hoverDomain = null
    hideTip()
    satTip.value = null
    coreTip.value = null
    counter.value = 0
    particles.length = 0
    spawnAcc.clear()
    for (const n of nodes) {
      n.ox = n.oy = n.ovx = n.ovy = 0
    }
    for (const a of anchors) a.calloutStart = -1e9
    vp.cam.x = vp.cam.tx = 0
    vp.cam.y = vp.cam.ty = 0
    vp.cam.s = vp.cam.ts = reduce ? 1 : dollyScale(0)
    snapView()
    pulseStart = nowMs + 180
  }

  const rebuildAll = (): void => {
    rnd = mulberry32(SEED)
    const built = buildScene(params.repos.value, rnd)
    nodes = built.nodes
    anchors = built.anchors
    bright.clear()
    layout()
    rebuild()
  }

  let mounted = false
  watch(params.repos, () => {
    if (mounted) rebuildAll()
  })

  const catalogCode = (n: Node): string => {
    const order = n.anchor.chain
      .slice()
      .sort((a, b) => b.repo.stars - a.repo.stars || a.repo.name.localeCompare(b.repo.name))
    const rank = order.indexOf(n) + 1
    return `${n.anchor.key.toUpperCase()}-${String(rank).padStart(2, '0')}`
  }

  const showTip = (n: Node, pin: boolean): void => {
    const [x, y] = tipAt(n)
    tipNode = n
    tip.value = { repo: n.repo, code: catalogCode(n), x, y, pinned: pin }
    satTip.value = null
    coreTip.value = null
  }

  const hideTip = (): void => {
    tipNode = null
    tip.value = null
  }

  const satTipFor = (hit: SatHit): SatTipState => ({
    login: hit.login,
    repo: hit.node.repo.name,
    merged: hit.merged,
    share: Math.round((hit.merged / (hit.node.repo.merged || 1)) * 100),
    people: hit.node.repo.contributors.length,
    last: hit.last,
    x: Math.round(hit.x),
    y: Math.round(hit.y),
  })

  const focusOn = (n: Node): void => {
    dolly = false
    focusNode = n
    hover = n
    satHover = null
    hoverCore = false
    coreTip.value = null
    satTip.value = null
    vp.cam.tx = n.bx + n.ox
    vp.cam.ty = n.by + n.oy
    vp.cam.ts = 1.6
    showTip(n, true)
  }

  const focusRepo = (name: string): void => {
    const n = nodes.find((node) => node.repo.name === name)
    if (n) focusOn(n)
  }

  const resetHome = (): void => {
    dolly = false
    focusNode = null
    hover = null
    vp.cam.ts = 1
    vp.cam.tx = 0
    vp.cam.ty = 0
    vp.cam.tyaw = 0
    vp.cam.tpitch = viewPitch()
    if (reduce) snapView()
    hideTip()
    coreTip.value = null
    calloutAll()
    pulse()
  }

  let dragging = false
  let dragNode: Node | null = null
  let dragW: [number, number] = [0, 0]
  let panning = false
  let orbiting = false
  let panStart: [number, number] = [0, 0]
  let moved = false
  let satDown: SatHit | null = null
  let coreDown = false

  const localXY = (e: { clientX: number; clientY: number }): [number, number] => {
    const rect = canvas.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  const orbitBy = (dx: number, dy: number): void => {
    vp.cam.yaw = vp.cam.tyaw = vp.cam.yaw + dx * ORBIT_RAD_PER_PX
    vp.cam.pitch = vp.cam.tpitch = clampPitch(vp.cam.pitch - dy * ORBIT_RAD_PER_PX)
  }

  const panBy = (from: [number, number], sx: number, sy: number): void => {
    const w1 = vp.s2w(from[0], from[1])
    const w2 = vp.s2w(sx, sy)
    vp.cam.x -= w2[0] - w1[0]
    vp.cam.y -= w2[1] - w1[1]
    vp.cam.tx = vp.cam.x
    vp.cam.ty = vp.cam.y
  }

  const onMove = (e: MouseEvent): void => {
    const [sx, sy] = localXY(e)
    const c = pickCtx()
    if (dragging && dragNode) {
      dragW = vp.s2w(sx, sy)
      moved = true
      return
    }
    if (orbiting) {
      orbitBy(sx - panStart[0], sy - panStart[1])
      panStart = [sx, sy]
      moved = true
      return
    }
    if (panning) {
      panBy(panStart, sx, sy)
      panStart = [sx, sy]
      moved = true
      return
    }
    const n = pickNode(c, sx, sy)
    hover = n
    if (n) {
      satHover = null
      hoverCore = false
      hoverDomain = null
      canvas.classList.add('pointing')
      if (!focusNode) showTip(n, false)
      return
    }
    if (focusNode) {
      satHover = null
      hoverCore = false
      satTip.value = null
      canvas.classList.remove('pointing')
      hoverDomain = pickDomain(c, sx, sy)
      return
    }
    const s = pickSat(c, sx, sy)
    if (s) {
      satHover = s
      hoverCore = false
      hoverDomain = null
      canvas.classList.add('pointing')
      satTip.value = satTipFor(s)
      hideTip()
      coreTip.value = null
      return
    }
    satHover = null
    if (pickCore(c, sx, sy)) {
      if (!hoverCore) calloutAll()
      hoverCore = true
      hoverDomain = null
      canvas.classList.add('pointing')
      const [hx, hy] = vp.w2s(0, 0)
      coreTip.value = { x: hx, y: hy }
      hideTip()
      satTip.value = null
      return
    }
    hoverCore = false
    coreTip.value = null
    satTip.value = null
    canvas.classList.remove('pointing')
    hoverDomain = pickDomain(c, sx, sy)
    hideTip()
  }

  const onDown = (e: MouseEvent): void => {
    moved = false
    satDown = null
    coreDown = false
    const [sx, sy] = localXY(e)
    const c = pickCtx()
    const n = pickNode(c, sx, sy)
    if (n) {
      dragging = true
      dragNode = n
      dragW = vp.s2w(sx, sy)
      return
    }
    const s = pickSat(c, sx, sy)
    if (s) {
      satDown = s
      return
    }
    if (pickCore(c, sx, sy)) {
      coreDown = true
      return
    }
    const orbitDrag = view.value === 'orbit' && !e.shiftKey && e.button !== 2
    if (orbitDrag) orbiting = true
    else panning = true
    dolly = false
    panStart = [sx, sy]
    canvas.classList.add('grabbing')
  }

  const onContextMenu = (e: MouseEvent): void => {
    if (view.value === 'orbit') e.preventDefault()
  }

  const onUp = (): void => {
    canvas.classList.remove('grabbing')
    if (dragging && dragNode && !moved) focusOn(dragNode)
    else if (satDown && !moved)
      window.open(`https://github.com/${satDown.login}`, '_blank', 'noopener,noreferrer')
    else if (coreDown && !moved) resetHome()
    else if ((panning || orbiting) && !moved) {
      const wasFocus = focusNode !== null
      focusNode = null
      vp.cam.ts = 1
      if (wasFocus) {
        vp.cam.tx = 0
        vp.cam.ty = 0
      }
      hideTip()
      coreTip.value = null
    }
    dragging = false
    dragNode = null
    panning = false
    orbiting = false
    satDown = null
    coreDown = false
  }

  const onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    dolly = false
    const [sx, sy] = localXY(e)
    const [wx, wy] = vp.s2w(sx, sy)
    const ns = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, vp.cam.ts * (e.deltaY < 0 ? 1.12 : 0.89)))
    anchorTo(wx, wy, sx, sy, ns)
  }

  let tStart: [number, number] | null = null
  let pinch: { d0: number; s0: number; wx: number; wy: number } | null = null

  const touchPair = (e: TouchEvent): { mx: number; my: number; d: number } | null => {
    const a = e.targetTouches[0]
    const b = e.targetTouches[1]
    if (!a || !b) return null
    const [ax, ay] = localXY(a)
    const [bx, by] = localXY(b)
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    return { mx, my, d: Math.hypot(bx - ax, by - ay) }
  }

  const startPinch = (e: TouchEvent): void => {
    const p = touchPair(e)
    if (!p) return
    const [wx, wy] = vp.s2w(p.mx, p.my)
    pinch = { d0: Math.max(1, p.d), s0: vp.cam.s, wx, wy }
    dolly = false
    tStart = null
  }

  const onTouchStart = (e: TouchEvent): void => {
    if (e.targetTouches.length >= 2) {
      startPinch(e)
      return
    }
    const touch = e.targetTouches[0]
    if (e.targetTouches.length !== 1 || !touch) return
    pinch = null
    const [sx, sy] = localXY(touch)
    const c = pickCtx()
    const n = pickNode(c, sx, sy)
    if (n) {
      focusOn(n)
      return
    }
    const s = pickSat(c, sx, sy)
    if (s) {
      satTip.value = satTipFor(s)
      return
    }
    if (pickCore(c, sx, sy)) {
      resetHome()
      return
    }
    dolly = false
    tStart = [sx, sy]
  }

  const onTouchMove = (e: TouchEvent): void => {
    if (e.targetTouches.length >= 2) {
      if (!pinch) startPinch(e)
      const p = touchPair(e)
      if (!pinch || !p) return
      const ns = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (pinch.s0 * p.d) / pinch.d0))
      anchorTo(pinch.wx, pinch.wy, p.mx, p.my, ns)
      return
    }
    const touch = e.targetTouches[0]
    if (e.targetTouches.length !== 1 || !touch) return
    if (pinch) {
      pinch = null
      tStart = localXY(touch)
      return
    }
    if (!tStart) return
    const [sx, sy] = localXY(touch)
    if (view.value === 'orbit' && !e.shiftKey) orbitBy(sx - tStart[0], sy - tStart[1])
    else panBy(tStart, sx, sy)
    tStart = [sx, sy]
  }

  const onTouchEnd = (e: TouchEvent): void => {
    if (e.targetTouches.length >= 2) {
      startPinch(e)
      return
    }
    const touch = e.targetTouches[0]
    if (touch) {
      pinch = null
      tStart = localXY(touch)
      return
    }
    pinch = null
    tStart = null
  }

  const mount = (el: HTMLCanvasElement): (() => void) => {
    canvas = el
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const built = buildScene(params.repos.value, rnd)
    nodes = built.nodes
    anchors = built.anchors
    layout()
    mounted = true
    T0 = performance.now()
    last = T0
    introBase = 0
    vp.cam.s = vp.cam.ts = reduce ? 1 : dollyScale(0)
    snapView()
    window.addEventListener('resize', layout)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)
    raf = requestAnimationFrame(tick)

    return () => {
      mounted = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', layout)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  }

  return {
    tip,
    satTip,
    coreTip,
    counter,
    view: readonly(view),
    setView,
    mount,
    pulse,
    rebuild,
    focusRepo,
    resetHome,
  }
}
