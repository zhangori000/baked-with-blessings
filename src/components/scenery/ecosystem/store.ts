import type { SceneTone } from '../menuHeroScenery'
import { Ecosystem } from './engine'
import { ecosystemSpecies } from './species'
import type { EcoEntity, EcoLayer, EcoSnapshot } from './types'

type NodeCache = {
  fx: string
  pose: string
  root: HTMLElement
  poseElement: HTMLElement | null
  state: string
  transform: string
  vars: Record<string, string>
  z: string
}

const emptySnapshot: EcoSnapshot = { counts: {}, entities: [], scene: '' }

export class EcosystemStore {
  private frozen = false
  private engine: Ecosystem | null
  private layers: Partial<Record<EcoLayer, HTMLElement>> = {}
  private listeners = new Set<() => void>()
  private nodes = new Map<number, NodeCache>()
  private observer: ResizeObserver | null = null
  private offset = { x: 0, y: 0 }
  private scene: SceneTone
  private snapshot: EcoSnapshot

  constructor(scene: SceneTone) {
    this.scene = scene
    this.engine = this.build(scene)
    this.snapshot = this.createSnapshot()
  }

  private build(scene: SceneTone) {
    const species = ecosystemSpecies(scene)

    return species ? new Ecosystem(species) : null
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = () => this.snapshot

  getServerSnapshot = () => emptySnapshot

  setFrozen(frozen: boolean) {
    this.frozen = frozen
  }

  get active() {
    return this.engine !== null
  }

  setScene(scene: SceneTone) {
    if (scene === this.scene) {
      return
    }

    this.scene = scene
    this.engine = this.build(scene)
    this.nodes.clear()
    this.measure()
    this.publish()
  }

  attachLayer(layer: EcoLayer, element: HTMLElement | null) {
    if (element) {
      this.layers[layer] = element
    } else {
      delete this.layers[layer]
    }

    this.observer?.disconnect()
    this.observer = null

    const front = this.layers.front

    if (front && typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.measure())
      this.observer.observe(front)
    }

    this.measure()
  }

  attachNode(id: number, element: HTMLElement | null) {
    if (!element) {
      this.nodes.delete(id)
      return
    }

    const existing = this.nodes.get(id)

    if (existing?.root === element) {
      return
    }

    this.nodes.set(id, {
      fx: '',
      pose: '',
      poseElement: element.querySelector<HTMLElement>('.ecoPose'),
      root: element,
      state: '',
      transform: '',
      vars: {},
      z: '',
    })

    const entity = this.engine?.entities.find((entry) => entry.id === id)

    if (entity) {
      this.apply(entity)
    }
  }

  measure() {
    const front = this.layers.front
    const engine = this.engine

    if (!front || !engine) {
      return
    }

    const rect = front.getBoundingClientRect()
    const ground = front.querySelector<HTMLElement>('[data-eco-probe="ground"]')
    const water = front.querySelector<HTMLElement>('[data-eco-probe="water"]')
    const unit = front.querySelector<HTMLElement>('[data-eco-probe="unit"]')
    const groundY = ground ? ground.getBoundingClientRect().top - rect.top : rect.height * 0.9
    const waterY = water ? water.getBoundingClientRect().top - rect.top : groundY
    const unitPx = unit ? unit.getBoundingClientRect().width || 16 : 16
    const back = this.layers.back?.getBoundingClientRect()

    this.offset = back ? { x: back.left - rect.left, y: back.top - rect.top } : { x: 0, y: 0 }
    engine.resize(rect.width, rect.height, groundY, waterY, unitPx)
  }

  spawn = (species: string, countAs: string) => {
    const engine = this.engine

    if (!engine) {
      return
    }

    if (engine.width === 0) {
      this.measure()
    }

    const entity = engine.spawn(species, { countAs, user: true })

    if (entity && this.frozen) {
      engine.species[species]?.rest?.(entity, engine)
    }

    this.publish()
  }

  clear = () => {
    this.engine?.clear()
    this.publish()
  }

  frame(dt: number) {
    const engine = this.engine

    if (!engine || engine.entities.length === 0) {
      if (engine?.dirty) {
        this.publish()
      }
      return
    }

    if (!this.frozen) {
      engine.step(dt)
    }

    if (engine.dirty) {
      this.publish()
    }

    for (const entity of engine.entities) {
      this.apply(entity)
    }
  }

  private apply(entity: EcoEntity) {
    const node = this.nodes.get(entity.id)
    const engine = this.engine

    if (!node || !engine) {
      return
    }

    const definition = engine.species[entity.species]
    const isBack = definition?.layer === 'back'
    const x = entity.x - (isBack ? this.offset.x : 0)
    const y = entity.y - entity.lift - (isBack ? this.offset.y : 0)
    const transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`

    if (node.transform !== transform) {
      node.transform = transform
      node.root.style.transform = transform
    }

    const pose = `scaleX(${entity.facing}) rotate(${entity.tilt.toFixed(1)}deg) scale(${entity.scale.toFixed(3)})`

    if (node.pose !== pose && node.poseElement) {
      node.pose = pose
      node.poseElement.style.transform = pose
    }

    const z = String(
      Math.round(
        (entity.anchor === 'bottom' ? entity.y : entity.y + engine.heightOf(entity) * 0.5) +
          (entity.data.zBoost ?? 0),
      ),
    )

    if (node.z !== z) {
      node.z = z
      node.root.style.zIndex = z
    }

    if (node.state !== entity.state) {
      node.state = entity.state
      node.root.dataset.state = entity.state
    }

    if (node.fx !== entity.fx) {
      node.fx = entity.fx
      node.root.dataset.fx = entity.fx
    }

    const vars = definition?.style?.(entity, engine)

    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        if (node.vars[name] !== value) {
          node.vars[name] = value
          node.root.style.setProperty(name, value)
        }
      }
    }
  }

  private createSnapshot(): EcoSnapshot {
    const engine = this.engine

    if (!engine) {
      return { counts: {}, entities: [], scene: this.scene }
    }

    return {
      counts: engine.counts(),
      entities: engine.entities.map((entity) => {
        const definition = engine.species[entity.species]

        return {
          anchor: entity.anchor,
          asset: entity.asset,
          dying: entity.dying,
          fuel: definition?.tags.includes('fuel') ?? false,
          ghost: Boolean(entity.data.ghost),
          id: entity.id,
          idle: entity.idle,
          layer: definition?.layer ?? 'front',
          particles: definition?.particles,
          rain: definition?.tags.includes('cloud') ?? false,
          size: entity.size,
          species: entity.species,
        }
      }),
      scene: this.scene,
    }
  }

  private publish() {
    if (this.engine) {
      this.engine.dirty = false
    }

    this.snapshot = this.createSnapshot()

    for (const listener of this.listeners) {
      listener()
    }
  }
}
