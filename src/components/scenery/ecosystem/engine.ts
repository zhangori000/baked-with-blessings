import { aspectOf, assetScaleOf } from './assets'
import { between } from './behaviors'
import type {
  EcoControlAbility,
  EcoControlInput,
  EcoEntity,
  EcoEffect,
  EcoMatchup,
  EcoSpawnOptions,
  EcoSpecies,
  EcoSpeciesMap,
  EcoTag,
  EcoWorld,
} from './types'

const dyingSeconds = 0.7
const naturalLimit = 170
const maxControlResource = 100

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

export class Ecosystem implements EcoWorld {
  entities: EcoEntity[] = []
  groundY = 0
  height = 0
  time = 0
  unit = 16
  waterY = 0
  width = 0
  dirty = true
  effects: EcoEffect[] = []
  tallies: Record<string, number> = {}
  private effectSequence = 0
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
    return entity.size * assetScaleOf(entity.asset) * this.unit * entity.scale
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

  effect(effect: EcoEffect) {
    this.effects.push({ ...effect, id: ++this.effectSequence })
    this.dirty = true
  }

  drainEffects() {
    const effects = this.effects

    this.effects = []

    return effects
  }

  shake(amount = 1) {
    this.effect({ amount, type: 'shake', x: 0, y: 0 })
  }

  gainControlResource(entity: EcoEntity, amount: number) {
    if (!this.species[entity.species]?.controls) {
      return
    }

    entity.data.controlResource = clampValue(
      (entity.data.controlResource ?? 0) + amount,
      0,
      maxControlResource,
    )
    this.dirty = true
  }

  heal(entity: EcoEntity, amount: number) {
    if (entity.dying || entity.removed || amount <= 0) {
      return 0
    }

    const before = entity.hp

    entity.hp = Math.min(entity.maxHp, entity.hp + amount)

    const healed = entity.hp - before

    if (healed > 0) {
      this.effect({
        amount: healed,
        text: `+${Math.max(1, Math.round(healed))}`,
        tone: 'heal',
        type: 'heal',
        x: entity.x,
        y: entity.y - this.heightOf(entity) * (entity.anchor === 'center' ? 0.36 : 0.72),
      })
    }

    return healed
  }

  damage(
    attacker: EcoEntity | null,
    target: EcoEntity,
    amount: number,
    fromX = attacker?.x ?? target.x,
  ) {
    if (target.dying || target.removed || amount <= 0) {
      return 0
    }

    const edge = attacker ? this.edge(attacker, target) : 1
    const block =
      (target.data.controlBlockUntil ?? 0) > this.time ? (target.data.controlBlock ?? 0.5) : 1
    const adjusted = Math.max(0.1, amount * edge * block)

    target.hp -= adjusted
    target.fx = 'hurt'
    target.data.fx = 0.38
    target.data.hitFlash = this.time
    target.vx += (target.x >= fromX ? 1 : -1) * this.unit * Math.min(4.8, 1.5 + adjusted * 0.7)
    target.data.hitStopUntil = this.time + 0.07

    if (attacker) {
      attacker.data.hitStopUntil = this.time + 0.05
      this.gainControlResource(attacker, adjusted * 13)
    }

    this.gainControlResource(target, adjusted * 8)

    if (adjusted >= 1.8 || edge > 1) {
      this.shake(edge > 1 ? 0.75 : 0.45)
    }

    this.effect({
      amount: adjusted,
      text: `${Math.max(1, Math.round(adjusted))}${edge > 1 ? '!' : ''}`,
      tone: edge > 1 ? 'strong' : edge < 1 ? 'resist' : adjusted >= 2 ? 'heavy' : 'normal',
      type: 'damage',
      x: target.x,
      y: target.y - this.heightOf(target) * (target.anchor === 'center' ? 0.32 : 0.66),
    })

    if (target.hp <= 0) {
      this.kill(target)
    }

    this.dirty = true

    return adjusted
  }

  addControlBuff(entity: EcoEntity, name: string, icon: string, seconds: number) {
    const startedAt = this.time
    const expiresAt = startedAt + seconds
    const existing = entity.controlBuffs?.filter((buff) => buff.name !== name) ?? []

    entity.controlBuffs = [...existing, { expiresAt, icon, name, startedAt }]
    this.effect({
      key: 'w',
      name,
      text: name,
      tone: 'heal',
      type: 'vfx',
      vfx: 'buff',
      x: entity.x,
      y: entity.y - this.heightOf(entity) * (entity.anchor === 'center' ? 0.34 : 0.7),
    })
    this.dirty = true
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

  private abilityFor(entity: EcoEntity, key: string | null): EcoControlAbility | null {
    const controls = this.species[entity.species]?.controls

    return controls?.abilities.find((ability) => ability.key === key) ?? null
  }

  startControlAbility(key: string) {
    if (key !== 'q' && key !== 'w' && key !== 'e' && key !== 'r') {
      return false
    }

    const entity = this.byId(this.controlledId)
    const ability = entity ? this.abilityFor(entity, key) : null

    if (!entity || !ability) {
      return false
    }

    if (entity.controlCast) {
      const remaining = this.castRemaining(entity, ability)

      if (remaining <= 0.3) {
        entity.controlCast.queuedKey = key
        this.dirty = true
        return true
      }

      return false
    }

    if ((entity.data[`controlCooldown-${key}`] ?? 0) > this.time) {
      return false
    }

    if (ability.ultimate && (entity.data.controlResource ?? 0) < maxControlResource) {
      return false
    }

    if (ability.ultimate) {
      entity.data.controlResource = 0
      this.effect({
        key,
        name: ability.name,
        text: ability.name,
        tone: 'heavy',
        type: 'banner',
        vfx: ability.vfx,
        x: entity.x,
        y: entity.y - this.heightOf(entity) * (entity.anchor === 'center' ? 0.9 : 1.55) - 18,
      })
      this.shake(0.85)
    }

    const cooldown = ability.ultimate ? ability.cooldown : 0

    entity.data[`controlCooldown-${key}`] = this.time + cooldown
    entity.data[`controlReadyAt-${key}`] = cooldown > 0 ? this.time + cooldown : 0
    entity.controlCast = {
      activeStarted: false,
      elapsed: 0,
      endX: entity.x,
      endY: entity.y,
      hitIds: new Set<number>(),
      key,
      phase: 'windup',
      phaseElapsed: 0,
      queuedKey: null,
      releaseRequested: false,
      startX: entity.x,
      startY: entity.y,
    }
    const castAsset = typeof ability.asset === 'function' ? ability.asset(entity) : ability.asset

    if (castAsset) {
      entity.controlResetAsset = entity.controlResetAsset || entity.asset
      this.setAsset(entity, castAsset)
    }

    entity.fx = ability.vfx ?? 'aim'
    entity.data.controlCastStarted = this.time
    entity.data.controlCastProgress = 0
    this.dirty = true

    return true
  }

  releaseControlAbility(key: string) {
    if (key !== 'q' && key !== 'w' && key !== 'e' && key !== 'r') {
      return false
    }

    const entity = this.byId(this.controlledId)
    const cast = entity?.controlCast
    const ability = entity && cast ? this.abilityFor(entity, cast.key) : null

    if (!entity || !cast || !ability?.charge || cast.key !== key || cast.phase !== 'windup') {
      return false
    }

    cast.releaseRequested = true
    this.dirty = true

    return true
  }

  private castDuration(ability: EcoControlAbility, phase: 'active' | 'recovery' | 'windup') {
    if (phase === 'windup') {
      if (ability.charge) {
        return ability.charge.max
      }

      return ability.windup ?? 0.18
    }

    if (phase === 'active') {
      return ability.active ?? 0.22
    }

    return ability.recovery ?? 0.24
  }

  private castRemaining(entity: EcoEntity, nextAbility?: EcoControlAbility | null) {
    const cast = entity.controlCast

    if (!cast) {
      return 0
    }

    const ability = this.abilityFor(entity, cast.key) ?? nextAbility

    if (!ability) {
      return 0
    }

    const phases: readonly ('active' | 'recovery' | 'windup')[] = ['windup', 'active', 'recovery']
    const index = phases.indexOf(cast.phase)
    let remaining = Math.max(0, this.castDuration(ability, cast.phase) - cast.phaseElapsed)

    for (let phaseIndex = index + 1; phaseIndex < phases.length; phaseIndex += 1) {
      remaining += this.castDuration(ability, phases[phaseIndex]!)
    }

    return remaining
  }

  private advanceCastPhase(entity: EcoEntity, ability: EcoControlAbility) {
    const cast = entity.controlCast

    if (!cast) {
      return
    }

    if (cast.phase === 'windup') {
      entity.data.controlCharge = ability.charge
        ? clampValue(cast.phaseElapsed / ability.charge.max, 0, 1)
        : 1
      cast.phase = 'active'
      cast.phaseElapsed = 0
      cast.activeStarted = false
      cast.startX = entity.x
      cast.startY = entity.y
      cast.endX = clampValue(
        entity.x + entity.facing * (ability.dash ?? 0) * this.unit,
        this.unit,
        this.width - this.unit,
      )
      cast.endY = entity.y
      return
    }

    if (cast.phase === 'active') {
      cast.phase = 'recovery'
      cast.phaseElapsed = 0
      return
    }

    const queuedKey = cast.queuedKey

    entity.controlCast = undefined
    entity.fx = ''
    entity.data.controlCharge = 0
    entity.data.controlCastProgress = 0

    if (ability.asset) {
      this.setAsset(entity, entity.controlResetAsset)
    }

    if (queuedKey) {
      this.startControlAbility(queuedKey)
    }
  }

  private tickCast(entity: EcoEntity, ability: EcoControlAbility, dt: number) {
    const cast = entity.controlCast

    if (!cast) {
      return
    }

    const duration = Math.max(0.01, this.castDuration(ability, cast.phase))

    cast.phaseElapsed += dt
    cast.elapsed += dt

    const phaseProgress = clampValue(cast.phaseElapsed / duration, 0, 1)
    const chargeProgress = ability.charge
      ? clampValue(cast.phaseElapsed / ability.charge.max, 0, 1)
      : phaseProgress
    const activeDuration = Math.max(0.01, this.castDuration(ability, 'active'))
    const activeProgress =
      cast.phase === 'active' ? clampValue(cast.phaseElapsed / activeDuration, 0, 1) : 0

    entity.data.controlCastProgress = chargeProgress

    if (cast.phase === 'active') {
      if (!cast.activeStarted) {
        cast.activeStarted = true
        ability.run?.(entity, this, { activeProgress, cast, phaseProgress })

        if (ability.vfx) {
          this.effect({
            key: ability.key,
            name: ability.name,
            tone: ability.ultimate ? 'heavy' : 'normal',
            type: 'vfx',
            vfx: ability.vfx,
            x: entity.x,
            y: entity.y - this.heightOf(entity) * (entity.anchor === 'center' ? 0.2 : 0.55),
          })
        }
      }

      if (ability.dash) {
        const eased = easeOutCubic(activeProgress)

        entity.x = cast.startX + (cast.endX - cast.startX) * eased
        entity.y = cast.startY + (cast.endY - cast.startY) * eased
        entity.vx = ((cast.endX - cast.startX) / activeDuration) * (1 - activeProgress)
      }

      ability.tick?.(entity, this, { activeProgress, cast, phaseProgress }, dt)
    }

    const chargeMin = ability.charge?.min ?? 0
    const chargeReady =
      ability.charge && cast.phase === 'windup'
        ? cast.phaseElapsed >= ability.charge.max ||
          (cast.releaseRequested && cast.phaseElapsed >= chargeMin)
        : false

    if (cast.phaseElapsed >= duration || chargeReady) {
      this.advanceCastPhase(entity, ability)
    }
  }

  private controlEntity(entity: EcoEntity, definition: EcoSpecies, dt: number) {
    const controls = definition.controls

    if (!controls) {
      return false
    }

    const unit = this.unit
    const input = this.controlInput
    const cast = entity.controlCast
    const castAbility = cast ? this.abilityFor(entity, cast.key) : null

    this.gainControlResource(entity, (maxControlResource / 25) * dt)

    if (cast?.phase === 'active' && castAbility) {
      this.tickCast(entity, castAbility, dt)
      return true
    }

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
    const castSpeed = cast?.phase === 'recovery' ? 0.45 : cast?.phase === 'windup' ? 0.35 : 1
    const speed = controls.speed * unit * speedBoost * castSpeed
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

    if (cast && castAbility && cast.phase !== 'active') {
      this.tickCast(entity, castAbility, dt)
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

      if ((entity.data.hitStopUntil ?? 0) > this.time) {
        continue
      }

      if (entity.controlBuffs?.length) {
        entity.controlBuffs = entity.controlBuffs.filter((buff) => buff.expiresAt > this.time)
      }

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
