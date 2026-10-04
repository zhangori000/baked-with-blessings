import { aspectOf } from './assets'
import { between } from './behaviors'
import type {
  EcoControlInput,
  EcoEntity,
  EcoMatchup,
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
  controlledId: number | null = null
  controlInput: EcoControlInput = { followCursor: false, x: 0, y: 0 }

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

  private listed(list: readonly string[] | undefined, entity: EcoEntity) {
    return (
      list?.some(
        (key) =>
          key === entity.species || this.species[entity.species]?.tags.includes(key as EcoTag),
      ) ?? false
    )
  }

  matchup(attacker: EcoEntity, defender: EcoEntity): EcoMatchup {
    const mine = this.species[attacker.species]
    const theirs = this.species[defender.species]
    const strong = this.listed(mine?.strongVs, defender) || this.listed(theirs?.weakTo, attacker)
    const weak = this.listed(mine?.weakTo, defender) || this.listed(theirs?.strongVs, attacker)

    if (strong && !weak) {
      return 'strong'
    }

    if (weak && !strong) {
      return 'weak'
    }

    return 'even'
  }

  edge(attacker: EcoEntity, defender: EcoEntity) {
    const matchup = this.matchup(attacker, defender)

    return matchup === 'strong' ? 1.6 : matchup === 'weak' ? 0.5 : 1
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
      controlResetAsset: asset,
      data: { depth, ...options.data },
      dying: false,
      facing: options.facing ?? (Math.random() < 0.5 ? -1 : 1),
      fx: '',
      hp: definition.hp ?? 1,
      id: ++this.sequence,
      idle: definition.idle ?? 'none',
      lift: 0,
      maxHp: definition.hp ?? 1,
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
    entity.maxHp = entity.hp
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

  setControlled(id: number | null) {
    this.controlledId = id
  }

  setControlInput(input: Partial<EcoControlInput>) {
    this.controlInput = { ...this.controlInput, ...input }
  }

  private controlEntity(entity: EcoEntity, definition: EcoSpecies, dt: number) {
    const controls = definition.controls

    if (!controls) {
      return false
    }

    const unit = this.unit
    const input = this.controlInput
    let moveX = input.x
    let moveY = input.y

    if (
      input.followCursor &&
      input.cursorX !== undefined &&
      input.cursorY !== undefined &&
      controls.move !== 'ground'
    ) {
      const dx = input.cursorX - entity.x
      const dy = input.cursorY - entity.y
      const gap = Math.hypot(dx, dy)

      if (gap > unit * 0.3) {
        moveX = dx / gap
        moveY = dy / gap
      } else {
        moveX = 0
        moveY = 0
      }
    }

    const moving = Math.hypot(moveX, moveY) > 0.1
    const length = Math.max(1, Math.hypot(moveX, moveY))
    const speedBoost =
      (entity.data.controlSpeedUntil ?? 0) > this.time ? (entity.data.controlSpeed ?? 1) : 1
    const speed = controls.speed * unit * speedBoost
    const vx = (moveX / length) * speed
    const vy = (moveY / length) * speed

    if (controls.move === 'ground') {
      entity.x = Math.min(Math.max(entity.x + vx * dt, unit), this.width - unit)
      const depth = Math.min(Math.max((entity.data.depth ?? 0) + vy * dt, -unit * 1.5), unit * 1.3)
      entity.data.depth = depth
      entity.y = this.groundY + depth
      entity.vx = vx
      entity.vy = 0
      entity.lift = Math.max(0, entity.lift - dt * unit * 4)
      entity.tilt *= 0.85
    } else if (controls.move === 'swim') {
      entity.x = Math.min(Math.max(entity.x + vx * dt, unit), this.width - unit)
      entity.y = Math.min(
        Math.max(entity.y + vy * dt, this.waterY + unit),
        this.groundY - unit * 0.8,
      )
      entity.vx = vx
      entity.vy = vy
      entity.tilt = Math.min(
        Math.max((Math.atan2(vy, Math.abs(vx) + 0.001) * 180) / Math.PI, -28),
        28,
      )
    } else {
      entity.x = Math.min(Math.max(entity.x + vx * dt, unit), this.width - unit)
      entity.y = Math.min(
        Math.max(entity.y + vy * dt, this.skyTop + unit),
        Math.min(this.skyBottom, this.groundY - unit * 1.4),
      )
      entity.vx = vx
      entity.vy = vy
      entity.tilt = Math.min(
        Math.max((Math.atan2(vy, Math.abs(vx) + 0.001) * 180) / Math.PI, -35),
        35,
      )
    }

    if (moveX > 0.05) {
      entity.facing = 1
    } else if (moveX < -0.05) {
      entity.facing = -1
    }

    if ((entity.data.controlActionUntil ?? 0) <= this.time) {
      this.setAsset(entity, entity.controlResetAsset)

      this.setState(
        entity,
        moving
          ? (controls.moveState ?? controls.idleState ?? 'move')
          : (controls.idleState ?? 'idle'),
      )
      entity.fx =
        entity.data.controlFxUntil && entity.data.controlFxUntil > this.time ? entity.fx : ''
    }

    return true
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
        const definition = this.species[entity.species]

        if (entity.id === this.controlledId && definition?.controls) {
          this.controlEntity(entity, definition, dt)
        } else {
          definition?.tick(entity, this, dt)
        }
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
