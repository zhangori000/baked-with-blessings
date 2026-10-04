import type { SceneTone } from '../menuHeroScenery'
import { Ecosystem } from './engine'
import { ecosystemSpecies } from './species'
import type {
  EcoControlAbilityKey,
  EcoControlInput,
  EcoEntity,
  EcoLayer,
  EcoSnapshot,
} from './types'

type NodeCache = {
  fx: string
  healthUntil: number
  hp: number
  pose: string
  root: HTMLElement
  poseElement: HTMLElement | null
  state: string
  transform: string
  vars: Record<string, string>
  z: string
}

const emptySnapshot: EcoSnapshot = {
  controlled: null,
  counts: {},
  entities: [],
  scene: '',
  selected: null,
  tallies: {},
  toast: '',
}
const underseaDesktopBackdrop = { floorY: 520, height: 600, surfaceY: 95, width: 1200 }
const underseaMobileBackdrop = { floorY: 760, height: 860, surfaceY: 150, width: 430 }
const labelForSpecies = (species: string) =>
  species
    .split('-')
    .map((part) => (part === 'trex' ? 'T. rex' : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(' ')

const underseaBackdropLines = (rect: DOMRect) => {
  const backdrop =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? underseaMobileBackdrop
      : underseaDesktopBackdrop
  const scale = Math.max(rect.width / backdrop.width, rect.height / backdrop.height)

  return {
    groundY: backdrop.floorY * scale,
    waterY: backdrop.surfaceY * scale,
  }
}

export class EcosystemStore {
  private frozen = false
  private engine: Ecosystem | null
  private layers: Partial<Record<EcoLayer, HTMLElement>> = {}
  private listeners = new Set<() => void>()
  private nodes = new Map<number, NodeCache>()
  private observer: ResizeObserver | null = null
  private offset = { x: 0, y: 0 }
  private scene: SceneTone
  private selectedId: number | null = null
  private snapshot: EcoSnapshot
  private hudPublishAt = 0
  private toast = ''
  private toastUntil = 0

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
    this.selectedId = null
    this.toast = ''
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
      healthUntil: 0,
      hp: Number.NaN,
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
    const measuredGroundY = ground
      ? ground.getBoundingClientRect().top - rect.top
      : rect.height * 0.9
    const measuredWaterY = water ? water.getBoundingClientRect().top - rect.top : measuredGroundY
    const underseaLines = this.scene === 'undersea' ? underseaBackdropLines(rect) : null
    const groundY = underseaLines?.groundY ?? measuredGroundY
    const waterY = underseaLines?.waterY ?? measuredWaterY
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
    this.releaseControl()
    this.selectedId = null
    this.engine?.clear()
    this.publish()
  }

  selectEntity = (id: number) => {
    const entity = this.engine?.byId(id)

    if (!entity || !this.engine?.species[entity.species]?.controls) {
      return
    }

    this.selectedId = id
    this.publish()
  }

  takeControl = (id: number) => {
    const engine = this.engine
    const entity = engine?.byId(id)
    const controls = entity ? engine?.species[entity.species]?.controls : null

    if (!engine || !entity || !controls) {
      return
    }

    this.selectedId = null
    engine.setControlled(id)
    engine.setControlInput({
      followCursor:
        controls.move === 'swim' &&
        typeof window !== 'undefined' &&
        !window.matchMedia('(pointer: coarse)').matches,
      x: 0,
      y: 0,
    })
    entity.targetId = null
    entity.controlResetAsset = entity.asset
    this.publish()
  }

  releaseControl = () => {
    const engine = this.engine

    if (!engine || engine.controlledId === null) {
      return
    }

    const entity = engine.byId(engine.controlledId)
    const definition = entity ? engine.species[entity.species] : null

    if (entity && definition?.controls) {
      engine.setAsset(entity, entity.controlResetAsset)
      engine.setState(entity, definition.controls.idleState ?? entity.state)
    }

    engine.setControlled(null)
    engine.setControlInput({ followCursor: false, x: 0, y: 0 })
    this.publish()
  }

  dismissSelection = () => {
    this.selectedId = null
    this.publish()
  }

  setControlInput = (input: Partial<EcoControlInput>) => {
    this.engine?.setControlInput(input)
  }

  setControlCursorFromClient = (clientX: number, clientY: number, followCursor?: boolean) => {
    const front = this.layers.front

    if (!front) {
      return
    }

    const rect = front.getBoundingClientRect()
    const input: Partial<EcoControlInput> = {
      cursorX: clientX - rect.left,
      cursorY: clientY - rect.top,
    }

    if (followCursor !== undefined) {
      input.followCursor = followCursor
    }

    this.engine?.setControlInput(input)
  }

  activateAbility = (key: EcoControlAbilityKey) => {
    const engine = this.engine
    const entity = engine?.byId(engine.controlledId)
    const controls = entity ? engine?.species[entity.species]?.controls : null
    const ability = controls?.abilities.find((entry) => entry.key === key)

    if (
      !engine ||
      !entity ||
      !ability ||
      (entity.data[`controlCooldown-${key}`] ?? 0) > engine.time
    ) {
      return
    }

    entity.data[`controlCooldown-${key}`] = engine.time + ability.cooldown
    ability.run(entity, engine)
    engine.dirty = true
    this.publish()
  }

  setFollowCursor = (followCursor: boolean) => {
    this.engine?.setControlInput({ followCursor })
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

    const controlled = engine.byId(engine.controlledId)

    if (engine.controlledId !== null && (!controlled || controlled.dying || controlled.hp <= 0)) {
      const fallen =
        controlled ?? engine.entities.find((entity) => entity.id === engine.controlledId)
      const label = fallen ? labelForSpecies(fallen.species) : 'Your creature'

      this.toast = `${label} fell`
      this.toastUntil = performance.now() + 2600
      engine.setControlled(null)
      engine.setControlInput({ followCursor: false, x: 0, y: 0 })
      engine.dirty = true
    }

    if (this.toast && performance.now() > this.toastUntil) {
      this.toast = ''
      engine.dirty = true
    }

    if (engine.controlledId !== null && engine.time >= this.hudPublishAt) {
      this.hudPublishAt = engine.time + 0.12
      engine.dirty = true
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

    if (node.hp !== entity.hp) {
      node.hp = entity.hp
      node.healthUntil = engine.time + 3.2
    }

    const health = Math.max(0, Math.min(1, entity.hp / Math.max(1, entity.maxHp)))
    node.root.style.setProperty('--eco-health', health.toFixed(3))
    const showHealth =
      entity.maxHp > 1 &&
      (engine.controlledId === entity.id ||
        this.selectedId === entity.id ||
        node.healthUntil > engine.time ||
        entity.hp < entity.maxHp)

    if (showHealth) {
      node.root.dataset.health = ''
    } else {
      delete node.root.dataset.health
    }

    node.root.dataset.healthTone = health > 0.56 ? 'good' : health > 0.28 ? 'warn' : 'danger'

    if (engine.controlledId === entity.id) {
      node.root.dataset.controlled = ''
    } else {
      delete node.root.dataset.controlled
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
      return {
        controlled: null,
        counts: {},
        entities: [],
        scene: this.scene,
        selected: null,
        tallies: {},
        toast: this.toast,
      }
    }

    const selected = engine.byId(this.selectedId)
    const controlled = engine.byId(engine.controlledId)
    const selectedDefinition = selected ? engine.species[selected.species] : null
    const controlledDefinition = controlled ? engine.species[controlled.species] : null

    return {
      controlled:
        controlled && controlledDefinition?.controls
          ? {
              abilities: controlledDefinition.controls.abilities.map((ability) => ({
                cooldown: ability.cooldown,
                cooldownLeft: Math.max(
                  0,
                  (controlled.data[`controlCooldown-${ability.key}`] ?? 0) - engine.time,
                ),
                description: ability.description,
                icon: ability.icon,
                key: ability.key,
                name: ability.name,
              })),
              followCursor: engine.controlInput.followCursor,
              health: Math.max(0, controlled.hp),
              healthMax: controlled.maxHp,
              id: controlled.id,
              label: labelForSpecies(controlled.species),
              move: controlledDefinition.controls.move,
              species: controlled.species,
            }
          : null,
      counts: engine.counts(),
      entities: engine.entities.map((entity) => {
        const definition = engine.species[entity.species]

        return {
          anchor: entity.anchor,
          aspect: entity.aspect,
          asset: entity.asset,
          controllable: Boolean(definition?.controls),
          controlled: engine.controlledId === entity.id,
          dying: entity.dying,
          fuel: definition?.tags.includes('fuel') ?? false,
          health: Math.max(0, entity.hp),
          healthMax: entity.maxHp,
          id: entity.id,
          idle: entity.idle,
          layer: definition?.layer ?? 'front',
          label: labelForSpecies(entity.species),
          particles: definition?.particles,
          rain: definition?.tags.includes('cloud') ?? false,
          selected: this.selectedId === entity.id,
          size: entity.size,
          species: entity.species,
          strong: definition?.strongVs ?? [],
          weak: definition?.weakTo ?? [],
        }
      }),
      scene: this.scene,
      selected:
        selected && selectedDefinition?.controls
          ? {
              health: Math.max(0, selected.hp),
              healthMax: selected.maxHp,
              id: selected.id,
              label: labelForSpecies(selected.species),
              strong: selectedDefinition.strongVs ?? [],
              weak: selectedDefinition.weakTo ?? [],
            }
          : null,
      tallies: engine.tallies,
      toast: this.toast,
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
