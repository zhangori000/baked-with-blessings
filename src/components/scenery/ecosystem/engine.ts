import { aspectOf } from './assets'
import { between } from './behaviors'
import type {
  EcoEntity,
  EcoSpawnOptions,
  EcoSpecies,
  EcoSpeciesMap,
  EcoTag,
  EcoWorld,
} from './types'

const dyingSeconds = 0.7
const naturalLimit = 170

export class Ecosystem implements EcoWorld {
  entities: EcoEntity[] = []
  groundY = 0
  height = 0
  time = 0
  unit = 16
  waterY = 0
  width = 0
  dirty = true
  tallies: Record<string, number> = {}
  private sequence = 0
  private readonly windDirection = Math.random() < 0.5 ? -1 : 1

  constructor(readonly species: EcoSpeciesMap) {}

  get skyTop() {
    return this.height * 0.07
  }

  get skyBottom() {
    return Math.max(this.skyTop + this.unit * 4, this.groundY - this.unit * 5)
  }

  get wind() {
    return this.windDirection * this.unit * (0.35 + 0.55 * (0.5 + 0.5 * Math.sin(this.time * 0.07)))
  }

  resize(width: number, height: number, groundY: number, waterY: number, unit: number) {
    this.width = width
    this.height = height
    this.groundY = groundY
    this.waterY = waterY
    this.unit = unit

    for (const entity of this.entities) {
      entity.x = Math.min(Math.max(entity.x, 0), width)
      if (entity.anchor === 'bottom' && entity.lift === 0 && entity.y > groundY - unit * 3) {
        entity.y = groundY + (entity.data.depth ?? 0)
      }
    }
  }

  definition(entity: EcoEntity): EcoSpecies | undefined {
    return this.species[entity.species]
  }

  has(entity: EcoEntity, tag: EcoTag) {
    return this.species[entity.species]?.tags.includes(tag) ?? false
  }

  hasSpecies(species: string) {
    return species in this.species
  }

  widthOf(entity: EcoEntity) {
    return entity.size * this.unit * entity.scale
  }

  heightOf(entity: EcoEntity) {
    return this.widthOf(entity) * entity.aspect
  }

  canBreed() {
    return this.entities.length < naturalLimit
  }

  byId(id: number | null) {
    if (id === null) {
      return null
    }

    const found = this.entities.find((entity) => entity.id === id)

    return found && !found.dying && !found.removed ? found : null
  }

  spawn(speciesId: string, options: EcoSpawnOptions = {}) {
    const definition = this.species[speciesId]

    if (!definition) {
      return null
    }

    const asset = typeof definition.asset === 'function' ? definition.asset() : definition.asset
    const depth = definition.anchor === 'bottom' ? between(0, this.unit * 0.9) : 0
    const entity: EcoEntity = {
      age: 0,
      anchor: definition.anchor,
      aspect: aspectOf(asset),
      asset,
      countAs:
        options.countAs !== undefined
          ? options.countAs
          : definition.countAs !== undefined
            ? definition.countAs
            : speciesId,
      data: { depth, ...options.data },
      dying: false,
      facing: options.facing ?? (Math.random() < 0.5 ? -1 : 1),
      fx: '',
      hp: definition.hp ?? 1,
      id: ++this.sequence,
      idle: definition.idle ?? 'none',
      lift: 0,
      removed: false,
      scale: 1,
      size: options.size ?? between(definition.size[0], definition.size[1]),
      species: speciesId,
      state: options.state ?? definition.state ?? 'idle',
      t: 0,
      targetId: null,
      tilt: 0,
      user: options.user ?? false,
      vx: options.vx ?? 0,
      vy: options.vy ?? 0,
      x: options.x ?? between(this.width * 0.06, this.width * 0.94),
      y:
        options.y ??
        (definition.anchor === 'bottom'
          ? this.groundY + depth
          : between(this.skyTop, this.skyBottom)),
    }

    definition.init?.(entity, this)
    this.entities.push(entity)
    this.dirty = true

    return entity
  }

  kill(entity: EcoEntity) {
    if (entity.dying || entity.removed) {
      return
    }

    entity.dying = true
    entity.state = 'dead'
    entity.t = 0
    this.dirty = true
  }

  remove(entity: EcoEntity) {
    entity.removed = true
    this.dirty = true
  }

  setState(entity: EcoEntity, state: string) {
    if (entity.state !== state) {
      entity.state = state
      entity.t = 0
    }
  }

  setAsset(entity: EcoEntity, asset: string) {
    if (entity.asset !== asset) {
      entity.asset = asset
      entity.aspect = aspectOf(asset)
      this.dirty = true
    }
  }

  count(test: (entity: EcoEntity) => boolean) {
    let total = 0

    for (const entity of this.entities) {
      if (!entity.dying && !entity.removed && test(entity)) {
        total += 1
      }
    }

    return total
  }

  nearest(
    from: { x: number; y: number },
    test: (entity: EcoEntity) => boolean,
    maxDistance = Number.POSITIVE_INFINITY,
  ) {
    let best: EcoEntity | null = null
    let bestDistance = maxDistance

    for (const entity of this.entities) {
      if (entity.dying || entity.removed || entity === from || !test(entity)) {
        continue
      }

      const distance = Math.hypot(entity.x - from.x, entity.y - from.y)

      if (distance < bestDistance) {
        best = entity
        bestDistance = distance
      }
    }

    return best
  }

  within(x: number, y: number, radius: number, test: (entity: EcoEntity) => boolean) {
    return this.entities.filter(
      (entity) =>
        !entity.dying &&
        !entity.removed &&
        Math.hypot(entity.x - x, entity.y - y) <= radius &&
        test(entity),
    )
  }

  private burn(entity: EcoEntity, dt: number) {
    const burn = entity.data.burn ?? 0

    if (burn <= 0) {
      if (entity.fx === 'burning') {
        entity.fx = ''
      }
      return
    }

    entity.fx = 'burning'
    entity.data.burn = burn + dt

    if (entity.data.burn >= (this.species[entity.species]?.burnTime ?? 2.4)) {
      const x = entity.x
      this.kill(entity)

      if (
        !this.nearest({ x, y: this.groundY }, (other) => this.has(other, 'fire'), this.unit * 1.3)
      ) {
        this.spawn('fire', { x })
      }
    }
  }

  step(dt: number) {
    this.time += dt

    for (const entity of [...this.entities]) {
      if (entity.removed) {
        continue
      }

      entity.t += dt

      if (entity.dying) {
        if (entity.t >= dyingSeconds) {
          this.remove(entity)
        }
        continue
      }

      entity.age += dt
      this.burn(entity, dt)

      if (!entity.dying) {
        this.species[entity.species]?.tick(entity, this, dt)
      }
    }

    if (this.entities.some((entity) => entity.removed)) {
      this.entities = this.entities.filter((entity) => !entity.removed)
    }
  }

  tally(key: string, delta = 1) {
    const next = Math.max(0, (this.tallies[key] ?? 0) + delta)

    this.tallies = { ...this.tallies, [key]: next }
    this.dirty = true

    return next
  }

  resetTally(key: string) {
    this.tally(key, -(this.tallies[key] ?? 0))
  }

  counts() {
    const counts: Record<string, number> = {}

    for (const entity of this.entities) {
      if (!entity.dying && !entity.removed && entity.countAs) {
        counts[entity.countAs] = (counts[entity.countAs] ?? 0) + 1
      }
    }

    return counts
  }

  clear() {
    this.entities = []
    this.dirty = true
  }
}
