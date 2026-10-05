import { ecoAsset, registerViewBoxes } from '../assets'
import {
  ballistic,
  between,
  chance,
  clamp,
  faceTravel,
  hop,
  integrate,
  keepInSky,
  onGround,
  pick,
  settle,
  steer,
  tiltToVelocity,
  walk,
  walkToward,
  wander,
} from '../behaviors'
import type {
  EcoControlAbility,
  EcoControlAbilityContext,
  EcoEntity,
  EcoSpecies,
  EcoWorld,
} from '../types'

registerViewBoxes({
  ballista: [126, 82],
  'arcane-missile': [92, 48],
  bolt: [128, 24],
  'duel-beam-dark': [144, 18],
  'duel-beam-good': [144, 18],
  'fire-lance': [144, 22],
  'frost-nova': [116, 116],
  'green-flame': [58, 70],
  'flame-stream': [168, 72],
  'dragon-shockwave': [150, 68],
  'ice-wall': [86, 96],
  'ice-shard': [108, 42],
  'lightning-strike': [96, 220],
  'mounted-knight': [156, 104],
  'mounted-knight-charge': [172, 104],
  prince: [76, 88],
  princess: [78, 96],
  'shield-bubble': [124, 112],
  'siege-plant': [102, 100],
  'spell-familiar': [96, 74],
  'spell-impact': [86, 86],
  'spell-meteor': [84, 118],
  'spell-polymorph': [92, 82],
  'spell-tornado': [104, 116],
  'light-ball': [80, 42],
  'arrow-volley': [100, 72],
  'rally-banner': [72, 110],
  'sword-arc': [108, 82],
  'vine-snare': [116, 74],
  wizard: [92, 112],
  'wizard-archmage': [92, 112],
  'wizard-archmage-cast': [92, 112],
  'wizard-bender': [92, 112],
  'wizard-bender-cast': [92, 112],
  'wizard-cast': [86, 86],
  'wizard-druid': [92, 112],
  'wizard-druid-cast': [92, 112],
  'wizard-frost': [92, 112],
  'wizard-frost-cast': [92, 112],
  'wizard-light': [92, 112],
  'wizard-light-cast': [92, 112],
  'wizard-pyromancer': [92, 112],
  'wizard-pyromancer-cast': [92, 112],
  'wizard-raise': [92, 112],
  'wizard-storm': [92, 112],
  'wizard-storm-cast': [92, 112],
  'wizard-fireball': [110, 70],
  'dark-lord': [92, 104],
  'dark-lord-cast': [92, 104],
})

const fireballGravity = 9
const arrowGravity = 4
const boltGravity = 3

const darkLordAsset = ecoAsset('dark-lord')
const darkLordCastAsset = ecoAsset('dark-lord-cast')
const knightAsset = ecoAsset('knight')
const mountedKnightAsset = ecoAsset('mounted-knight')
const mountedKnightChargeAsset = ecoAsset('mounted-knight-charge')
const flameStreamAsset = ecoAsset('flame-stream')
const dragonShockwaveAsset = ecoAsset('dragon-shockwave')
const lightBallAsset = ecoAsset('light-ball')
const siegePlantAsset = ecoAsset('siege-plant')
const spellTornadoAsset = ecoAsset('spell-tornado')
const spellTornadoFireAsset = ecoAsset('spell-tornado-fire')
const spellTornadoFrostAsset = ecoAsset('spell-tornado-frost')
const arrowVolleyAsset = ecoAsset('arrow-volley')
const rallyBannerAsset = ecoAsset('rally-banner')

const castleTeam = 1
const darkTeam = 2
const wildTeam = 3
const wizardTeamBase = 10

const teamPalette: Record<number, { color: string; accent: string }> = {
  [castleTeam]: { accent: 'rgba(255, 217, 102, 0.72)', color: '92 111 168' },
  [darkTeam]: { accent: 'rgba(121, 211, 106, 0.68)', color: '45 42 50' },
  [wildTeam]: { accent: 'rgba(255, 166, 94, 0.66)', color: '139 115 85' },
  10: { accent: 'rgba(184, 217, 240, 0.78)', color: '184 217 240' },
  11: { accent: 'rgba(255, 166, 94, 0.78)', color: '255 166 94' },
  12: { accent: 'rgba(255, 246, 200, 0.82)', color: '255 217 102' },
  13: { accent: 'rgba(168, 218, 130, 0.78)', color: '119 170 82' },
  14: { accent: 'rgba(216, 191, 255, 0.78)', color: '170 132 218' },
  15: { accent: 'rgba(255, 246, 200, 0.82)', color: '255 246 200' },
  16: { accent: 'rgba(139, 196, 212, 0.82)', color: '139 196 212' },
}

const worldlessSpecies = new Set([
  'arcane-missile',
  'arrow',
  'arrow-volley',
  'bolt',
  'dragon-burn-zone',
  'dragon-fog-bank',
  'dragon-hedge-ridge',
  'dragon-ice-pop',
  'dragon-ice-slick',
  'dragon-rain-puddle',
  'dragon-root-bump',
  'dragon-shockwave',
  'dragon-storm-pulse',
  'dragon-trunk',
  'dragon-updraft',
  'dragon-vine-patch',
  'duel-beam-dark',
  'duel-beam-good',
  'fire-lance',
  'flame-stream',
  'frost-nova',
  'ice-shard',
  'light-ball',
  'lightning-strike',
  'rally-banner',
  'siege-plant',
  'spell-familiar',
  'spell-impact',
  'spell-meteor',
  'spell-polymorph',
  'spell-tornado',
  'sword-arc',
  'vine-snare',
  'wizard-cast',
  'earth-slab',
  'water-whip',
  'fire-step-arc',
  'air-spout',
  'wizard-fireball',
])

function isCastleUnit(entity: EcoEntity) {
  return (
    entity.species === 'cottage' ||
    entity.species === 'archer' ||
    entity.species === 'princess' ||
    entity.species === 'ballista' ||
    entity.species === 'knight' ||
    entity.species === 'prince'
  )
}

function teamOf(entity: EcoEntity) {
  if ((entity.data.ownerTeam ?? 0) > 0) {
    return entity.data.ownerTeam
  }

  if ((entity.data.team ?? 0) > 0) {
    return entity.data.team
  }

  if (entity.species === 'wizard') {
    return wizardTeamBase + (entity.data.wizardType ?? 0)
  }

  if (entity.species === 'dark-lord' || entity.species === 'green-flame') {
    return darkTeam
  }

  if (entity.species === 'dragon') {
    return wildTeam
  }

  if (isCastleUnit(entity)) {
    return castleTeam
  }

  return 0
}

function siegeTeamStyle(entity: EcoEntity) {
  const team = teamOf(entity)
  const palette = teamPalette[team] ?? { accent: 'rgba(255, 246, 200, 0.58)', color: '255 246 200' }

  return {
    '--siege-team-accent': palette.accent,
    '--siege-team-color': palette.color,
    '--siege-team-on': team > 0 ? '1' : '0',
  }
}

function sameTeam(a: EcoEntity, b: EcoEntity) {
  const teamA = teamOf(a)
  const teamB = teamOf(b)

  return teamA > 0 && teamA === teamB
}

function isEnemy(attacker: EcoEntity, target: EcoEntity) {
  return attacker !== target && !target.dying && !target.removed && !sameTeam(attacker, target)
}

function isTargetableFoe(attacker: EcoEntity, target: EcoEntity) {
  return (
    isEnemy(attacker, target) &&
    !worldlessSpecies.has(target.species) &&
    (target.maxHp > 1 || target.species === 'cottage' || target.species === 'fireball')
  )
}

const isHazardTarget = (world: EcoWorld) => (other: EcoEntity) =>
  (world.has(other, 'burnable') || world.has(other, 'target')) && onGround(other, world)

const isDragon = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'dragon') && other.state !== 'falling'

function dragonMeleeVulnerable(entity: EcoEntity) {
  return (
    entity.state === 'sleep' ||
    entity.state === 'falling' ||
    entity.state === 'rooted' ||
    entity.state === 'flame-strafe' ||
    entity.state === 'talon-snatch' ||
    entity.state === 'rootstep' ||
    entity.state === 'canopy' ||
    entity.state === 'antler-plow' ||
    entity.state === 'body-roll' ||
    entity.state === 'orchard' ||
    entity.state === 'ice-skid' ||
    entity.state === 'wing-pinion' ||
    entity.state === 'pagoda-coil'
  )
}

function dragonWeakPointOpen(entity: EcoEntity) {
  return (
    worldlessSpecies.has(entity.species) === false &&
    (entity.state === 'flame-strafe' ||
      entity.state === 'talon-snatch' ||
      entity.state === 'wing-pinion' ||
      entity.state === 'body-roll' ||
      entity.state === 'whisker-lash' ||
      entity.state === 'rootstep' ||
      entity.state === 'canopy' ||
      entity.state === 'antler-plow' ||
      entity.state === 'orchard' ||
      entity.state === 'ice-skid' ||
      entity.state === 'whiteout' ||
      entity.state === 'pagoda-coil')
  )
}

function attackerElement(attacker?: EcoEntity) {
  if (!attacker) return ''
  if (
    attacker.species === 'ice-shard' ||
    attacker.species === 'frost-nova' ||
    attacker.species === 'ice-wall' ||
    attacker.state === 'frost' ||
    attacker.state === 'ice-shard' ||
    attacker.state === 'ice-wall' ||
    attacker.fx === 'frost'
  )
    return 'frost'
  if (attacker.species === 'water-whip' || attacker.fx === 'water' || attacker.state === 'water')
    return 'water'
  if (
    attacker.species === 'light-ball' ||
    attacker.state === 'light' ||
    attacker.state === 'heal' ||
    attacker.fx === 'light'
  )
    return 'light'
  if (
    attacker.species === 'earth-slab' ||
    attacker.state === 'earth' ||
    attacker.fx === 'earth' ||
    attacker.fx === 'earth-slide'
  )
    return 'earth'
  if (
    attacker.species === 'wizard-fireball' ||
    attacker.species === 'fire-step-arc' ||
    attacker.species === 'spell-meteor' ||
    attacker.state === 'fireball' ||
    attacker.state === 'meteor' ||
    attacker.state === 'fire-lance' ||
    attacker.fx === 'fire'
  )
    return 'fire'
  if (
    attacker.species === 'lightning-strike' ||
    (attacker.data.lightning ?? 0) > 0 ||
    attacker.state === 'storm' ||
    attacker.state === 'lightning'
  )
    return 'lightning'

  return ''
}

function dragonChargeInterrupts(attacker: EcoEntity | undefined) {
  const element = attackerElement(attacker)

  return (
    attacker?.species === 'bolt' ||
    attacker?.species === 'ice-shard' ||
    attacker?.species === 'earth-slab' ||
    element === 'lightning' ||
    element === 'frost' ||
    element === 'earth'
  )
}

function interruptEmberFlame(entity: EcoEntity, world: EcoWorld) {
  if (entity.species !== 'ember-dragon' || entity.state !== 'flame-strafe') return

  entity.data.flameStage = 3
  entity.data.flameClimbAt = world.time
  entity.data.flameStartX = entity.x
  entity.data.flameStartY = entity.y
  entity.data.flameClimbEndX = clamp(
    entity.x - entity.facing * world.unit * 7,
    world.unit * 2,
    world.width - world.unit * 2,
  )
  entity.data.flameClimbEndY = clamp(world.skyTop + world.unit * 2.2, world.skyTop, world.height)
  entity.data.flameStaggerUntil = world.time + 0.58
  entity.data.flameDuration = 0.6
  entity.fx = 'flame-stagger'
  spawnImpact(
    world,
    entity.x + entity.facing * world.widthOf(entity) * 0.22,
    entity.y,
    3,
    'smoke',
    0.72,
  )
}

function canKnightHitTarget(target: EcoEntity, world: EcoWorld) {
  return !world.has(target, 'dragon') || dragonMeleeVulnerable(target)
}

function landingX(projectile: EcoEntity, world: EcoWorld, gravity: number) {
  const drop = world.groundY - projectile.y

  if (drop <= 0) {
    return projectile.x
  }

  const g = gravity * world.unit
  const seconds = (-projectile.vy + Math.sqrt(projectile.vy * projectile.vy + 2 * g * drop)) / g

  return projectile.x + projectile.vx * seconds
}

function incomingFireball(entity: EcoEntity, world: EcoWorld, reach: number) {
  return world.nearest(
    entity,
    (other) =>
      world.has(other, 'fireball') &&
      Math.abs(landingX(other, world, fireballGravity) - entity.x) < world.unit * reach,
    world.unit * 12,
  )
}

function shielded(entity: EcoEntity, world: EcoWorld) {
  return (entity.data.shieldUntil ?? 0) > world.time
}

function spawnCast(world: EcoWorld, x: number, y: number, size = 2.1, fx = 'sparkle', life = 0.65) {
  const cast = world.spawn('wizard-cast', { data: { life }, size, x, y })

  if (cast) {
    cast.fx = fx
  }

  return cast
}

function leadTarget(foe: EcoEntity, originX: number, originY: number, speed: number) {
  let aimX = foe.x
  let aimY = foe.y

  for (let pass = 0; pass < 3; pass += 1) {
    const seconds = Math.hypot(aimX - originX, aimY - originY) / speed
    aimX = foe.x + foe.vx * seconds
    aimY = foe.y + foe.vy * seconds
  }

  return { aimX, aimY, seconds: Math.hypot(aimX - originX, aimY - originY) / speed }
}

function smoothStep(progress: number) {
  const p = clamp(progress, 0, 1)

  return p * p * (3 - p * 2)
}

function moveTowardPoint(
  entity: EcoEntity,
  world: EcoWorld,
  dt: number,
  x: number,
  y: number,
  maxUnits = 1.45,
) {
  const oldX = entity.x
  const oldY = entity.y
  const dx = x - oldX
  const dy = y - oldY
  const distance = Math.hypot(dx, dy)
  const maxStep = world.unit * maxUnits
  const scale = distance > maxStep && distance > 0 ? maxStep / distance : 1

  entity.x = oldX + dx * scale
  entity.y = oldY + dy * scale

  if (dt > 0) {
    entity.vx = (entity.x - oldX) / dt
    entity.vy = (entity.y - oldY) / dt
  }

  return Math.hypot(x - entity.x, y - entity.y)
}

function hurt(dragon: EcoEntity, world: EcoWorld, amount = 1, wake = false, attacker?: EcoEntity) {
  const edge = attacker ? world.edge(attacker, dragon) : 1
  const element = attackerElement(attacker)
  const flameStage = dragon.data.flameStage ?? 0
  const exposedFlame = dragon.state === 'flame-strafe' && (flameStage === 1 || flameStage === 2)
  const exposed = dragonWeakPointOpen(dragon) && (dragon.state !== 'flame-strafe' || exposedFlame)
  const rangedChargeBonus =
    exposedFlame &&
    flameStage === 1 &&
    (attacker?.species === 'arrow' || attacker?.species === 'bolt')
      ? attacker.species === 'bolt'
        ? 1.35
        : 1.2
      : 1
  const exposure = exposed ? 2 : 1
  const dealt = amount * edge * exposure * rangedChargeBonus

  dragon.hp -= dealt
  if (attacker) {
    world.gainControlResource(attacker, dealt * 12)
    world.gainControlResource(dragon, dealt * 8)
  }
  dragon.data.hurt = 0.45
  dragon.fx = exposed ? 'weak-hit' : 'hurt'

  if (dragon.species === 'ember-dragon' && (element === 'frost' || element === 'water')) {
    dragon.data.flameDuration = Math.min(dragon.data.flameDuration ?? 1.9, 0.82)
    dragon.data.dousedUntil = world.time + 1.2
    spawnImpact(world, dragon.x, dragon.y, 3.2, 'steam', 0.62)
  }

  if (
    dragon.species === 'ember-dragon' &&
    dragon.state === 'flame-strafe' &&
    flameStage === 1 &&
    dealt >= 1.4 &&
    dragonChargeInterrupts(attacker)
  ) {
    interruptEmberFlame(dragon, world)
  }

  if (dragon.species === 'emerald-dragon' && element === 'fire') {
    dragon.data.rootFor = 0
    dragon.data.cool = Math.max(dragon.data.cool ?? 0, 1.2)
    spawnImpact(world, dragon.x, dragon.y, 2.8, 'fire', 0.48)
  }

  if (dragon.species === 'frost-dragon' && element === 'light' && dragon.state === 'whiteout') {
    dragon.data.moveStep = 1
    dragon.fx = 'frozen'
    spawnImpact(world, dragon.x, dragon.y, 3, 'light', 0.58)
    world.setState(dragon, 'patrol')
  }

  if (wake && dragon.state === 'sleep') {
    dragon.targetId = null
    dragon.data.angry = 6
    dragon.data.cool = 0.25
    dragon.vy = -world.unit * 1.4
    world.setState(dragon, 'patrol')
  }
}

const cottageSpecies = (assets: readonly string[]): EcoSpecies => ({
  anchor: 'bottom',
  asset: () => pick(assets),
  burnTime: 5,
  countAs: 'cottage',
  layer: 'front',
  size: [3.2, 4],
  state: 'stand',
  style: (entity, world) => ({
    ...siegeTeamStyle(entity),
    '--siege-fizzle': (entity.data.fizzleUntil ?? 0) > world.time ? '1' : '0',
    '--siege-shield': shielded(entity, world) ? '1' : '0',
  }),
  strongVs: ['princess'],
  tags: ['building', 'fuel', 'target'],
  weakTo: ['dragon', 'dark-lord', 'fireball'],
  tick() {},
})

const dragonVariants = [
  {
    asset: ecoAsset('dragon-eastern-red'),
    idle: 'undulate',
    size: [14.5, 17.5],
    species: 'eastern-dragon',
  },
  {
    asset: ecoAsset('dragon-eastern-jade'),
    idle: 'undulate',
    size: [14.5, 17.5],
    species: 'eastern-dragon',
  },
  {
    asset: ecoAsset('dragon-western-ember'),
    idle: 'flap',
    size: [12.4, 14.2],
    species: 'ember-dragon',
  },
  {
    asset: ecoAsset('dragon-western-frost'),
    idle: 'flap',
    size: [12.2, 14],
    species: 'frost-dragon',
  },
  {
    asset: ecoAsset('dragon-western-emerald'),
    idle: 'flap',
    size: [12.2, 14],
    species: 'emerald-dragon',
  },
] as const

function startDragonFlameStrafe(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  entity.targetId = target?.id ?? null
  entity.data.flameStage = 0
  entity.data.flameStartedAt = world.time
  entity.data.flameSwoopAt = world.time
  entity.data.flameStartX = entity.x
  entity.data.flameStartY = entity.y
  entity.data.flameTargetX = target?.x ?? entity.x + entity.facing * world.unit * 9
  entity.data.flameTargetY = target ? bodyPoint(target, world).y : world.groundY - world.unit * 3.6
  entity.data.flameTick = 0
  entity.data.flameRecharge = 0
  entity.data.flameChargeFor = between(0.65, 0.9)
  entity.data.flameDuration = between(1.65, 2.15)
  entity.data.flameHoverY = world.height * between(0.45, 0.55)
  entity.data.breathed = 0
  world.setState(entity, 'flame-strafe')
}

function dragonFlameTarget(entity: EcoEntity, world: EcoWorld) {
  const target = world.byId(entity.targetId)
  const targetX = clamp(
    target?.x ?? entity.data.flameTargetX ?? entity.x,
    world.unit,
    world.width - world.unit,
  )
  const targetY = target ? target.y - target.lift : (entity.data.flameTargetY ?? world.groundY)
  const direction: 1 | -1 = targetX >= entity.x ? 1 : -1
  const mouthSideOffset = clamp(world.unit * 7.2, 70, 125)
  const bodySideOffset = mouthSideOffset + world.widthOf(entity) * 0.36
  const hoverY = clamp(
    entity.data.flameHoverY ?? world.height * 0.5,
    world.skyTop + world.unit * 6,
    world.groundY - world.unit * 15,
  )

  return {
    direction,
    hoverX: clamp(
      targetX - direction * bodySideOffset,
      world.unit * 1.8,
      world.width - world.unit * 1.8,
    ),
    hoverY,
    target,
    targetX,
    targetY,
  }
}

function tickDragonFlameStrafe(entity: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit
  const target = dragonFlameTarget(entity, world)
  entity.facing = target.direction

  if ((entity.data.flameStage ?? 0) <= 0) {
    entity.fx = 'flame-swoop'
    const startX = entity.data.flameStartX ?? entity.x
    const startY = entity.data.flameStartY ?? entity.y
    const distance = Math.max(unit, Math.hypot(target.hoverX - startX, target.hoverY - startY))
    const duration = clamp(distance / (unit * 13.5), 0.72, 1.55)
    const progress = clamp((world.time - (entity.data.flameSwoopAt ?? world.time)) / duration, 0, 1)
    const eased = smoothStep(progress)
    const desiredX = startX + (target.hoverX - startX) * eased
    const desiredY =
      startY + (target.hoverY - startY) * eased - Math.sin(progress * Math.PI) * unit * 2.7
    const remaining = moveTowardPoint(entity, world, dt, desiredX, desiredY, 1.45)
    tiltToVelocity(entity, 28)

    if (chance(4, dt)) {
      spawnImpact(
        world,
        entity.x - entity.facing * unit * 2.2,
        entity.y + unit * 0.35,
        1.1,
        'dust',
        0.22,
      )
    }

    if (progress >= 1 && remaining < unit * 0.75) {
      entity.data.flameStage = 1
      entity.data.flameStartedAt = world.time
      entity.data.flameTick = 0
      entity.vx = 0
      entity.vy = 0
    }
    return
  }

  if ((entity.data.flameStage ?? 0) === 1) {
    entity.fx = 'flame-charge'
    entity.data.flameRecharge = clamp(
      (world.time - (entity.data.flameStartedAt ?? world.time)) /
        (entity.data.flameChargeFor ?? 0.75),
      0,
      1,
    )
    moveTowardPoint(entity, world, dt, target.hoverX, target.hoverY, 0.72)
    entity.lift = Math.sin(world.time * 22 + entity.id) * clamp(unit * 0.38, 4, 6)
    entity.tilt = -entity.facing * (8 + Math.sin(world.time * 13 + entity.id) * 4)
    entity.data.flameTick = (entity.data.flameTick ?? 0) - dt

    if ((entity.data.flameTick ?? 0) <= 0) {
      entity.data.flameTick = 0.12
      const mouthX = entity.x + entity.facing * world.widthOf(entity) * 0.36
      const mouthY = entity.y + entity.lift - world.heightOf(entity) * 0.18
      spawnImpact(
        world,
        mouthX - entity.facing * between(1.2, 3.2) * unit,
        mouthY + between(-1.2, 1.2) * unit,
        between(0.8, 1.3),
        'fire',
        0.26,
      )
    }

    if (
      world.time - (entity.data.flameStartedAt ?? world.time) >
      (entity.data.flameChargeFor ?? 0.75)
    ) {
      entity.data.flameStage = 2
      entity.data.flameStartedAt = world.time
      entity.data.flameTick = 0
      entity.data.flameRecharge = 1
    }
    return
  }

  if ((entity.data.flameStage ?? 0) === 2) {
    entity.fx = (entity.data.dousedUntil ?? 0) > world.time ? 'flame-doused' : 'flame-hover'
    moveTowardPoint(entity, world, dt, target.hoverX, target.hoverY, 0.85)
    entity.lift = Math.sin(world.time * 18 + entity.id) * clamp(unit * 0.38, 4, 6)
    entity.tilt = Math.sin(world.time * 11 + entity.id) * 5
    entity.data.flameTick = (entity.data.flameTick ?? 0) - dt

    if ((entity.data.flameTick ?? 0) <= 0) {
      entity.data.flameTick = 0.055
      const mouthX = entity.x + entity.facing * world.widthOf(entity) * 0.38
      const mouthY = entity.y + entity.lift - world.heightOf(entity) * 0.15
      const burnX = target.target?.x ?? target.targetX
      const burnY = target.target
        ? target.target.y - target.target.lift - unit * 0.35
        : target.targetY
      const dx = burnX - mouthX
      const dy = burnY - mouthY
      const length = Math.max(unit * 5.8, Math.hypot(dx, dy))
      const stream = world.spawn('flame-stream', {
        data: {
          life: 0.28,
          originX: mouthX,
          originY: mouthY,
          ownerId: entity.id,
          ownerTeam: teamOf(entity),
          targetId: target.target?.id ?? -1,
          targetX: burnX,
          targetY: burnY,
        },
        facing: entity.facing,
        size: Math.max(entity.data.flameSize ?? 10.5, (length / unit) * 1.36),
        x: mouthX + dx * 0.5,
        y: mouthY + dy * 0.5,
      })
      if (stream) {
        stream.tilt = (Math.atan2(dy, dx) * 180) / Math.PI
      }
    }

    if (target.target && isEnemy(entity, target.target)) {
      target.target.fx = 'burn'
      target.target.data.burn = Math.max(target.target.data.burn ?? 0, 0.01)
    }

    if (
      world.time - (entity.data.flameStartedAt ?? world.time) >
      (entity.data.flameDuration ?? 1.9)
    ) {
      entity.data.flameStage = 3
      entity.data.flameClimbAt = world.time
      entity.data.flameStartX = entity.x
      entity.data.flameStartY = entity.y
      entity.data.flameClimbEndX = clamp(
        entity.x - entity.facing * unit * 8.5,
        unit * 2,
        world.width - unit * 2,
      )
      entity.data.flameClimbEndY = clamp(
        world.skyTop + unit * 2.4,
        world.skyTop + unit,
        world.height,
      )
    }
    return
  }

  if ((entity.data.flameStage ?? 0) === 3) {
    entity.fx = (entity.data.flameStaggerUntil ?? 0) > world.time ? 'flame-stagger' : 'flame-climb'
    const progress = clamp((world.time - (entity.data.flameClimbAt ?? world.time)) / 1.18, 0, 1)
    const eased = smoothStep(progress)
    const startX = entity.data.flameStartX ?? entity.x
    const startY = entity.data.flameStartY ?? entity.y
    const endX = entity.data.flameClimbEndX ?? entity.x
    const endY = entity.data.flameClimbEndY ?? world.skyTop + unit * 2.4
    const desiredX = startX + (endX - startX) * eased
    const desiredY = startY + (endY - startY) * eased - Math.sin(progress * Math.PI) * unit * 1.8
    const remaining = moveTowardPoint(entity, world, dt, desiredX, desiredY, 1.3)
    tiltToVelocity(entity, 24)

    if (progress >= 1 && remaining < unit * 0.9) {
      entity.data.flameStage = 4
      entity.data.flameRecharge = 0
      entity.data.flameRechargeAt = world.time
      entity.vx = 0
      entity.vy = 0
    }
    return
  }

  entity.fx = 'flame-recharge'
  entity.data.flameRecharge = clamp(
    (world.time - (entity.data.flameRechargeAt ?? world.time)) / 1.55,
    0,
    1,
  )
  const rechargeAt = entity.data.flameRechargeAt ?? world.time
  const cruise = world.time - rechargeAt
  const centerX = clamp(entity.data.flameClimbEndX ?? entity.x, unit * 2, world.width - unit * 2)
  const centerY = clamp(
    entity.data.flameClimbEndY ?? entity.y,
    world.skyTop + unit,
    world.groundY - unit * 7,
  )
  moveTowardPoint(
    entity,
    world,
    dt,
    centerX + Math.sin(cruise * 2.8) * unit * 2.2,
    centerY + Math.sin(cruise * 5.6) * unit * 0.65,
    0.75,
  )
  entity.tilt = Math.sin(world.time * 2 + entity.id) * 3

  if ((entity.data.flameRecharge ?? 0) >= 1) {
    entity.fx = ''
    entity.lift = 0
    entity.data.flameStage = 0
    entity.data.flameRecharge = 0
    entity.data.cool = between(0.55, 1.15)
    world.setState(entity, 'patrol')
  }
}

function spawnDragonZone(
  world: EcoWorld,
  species: string,
  entity: EcoEntity,
  x: number,
  y: number,
  size: number,
  life: number,
) {
  return world.spawn(species, {
    data: { life, ownerId: entity.id, ownerTeam: teamOf(entity) },
    facing: entity.facing,
    size,
    x: clamp(x, world.unit, world.width - world.unit),
    y,
  })
}

function dragonMoveTarget(entity: EcoEntity, world: EcoWorld) {
  const target = world.byId(entity.targetId)
  const targetX = clamp(
    target?.x ?? entity.data.moveTargetX ?? entity.x + entity.facing * world.unit * 7,
    world.unit,
    world.width - world.unit,
  )
  const targetY = target
    ? bodyPoint(target, world).y
    : (entity.data.moveTargetY ?? world.groundY - world.unit * 2)

  return { target, targetX, targetY }
}

function startDragonMove(
  entity: EcoEntity,
  world: EcoWorld,
  state: string,
  target: EcoEntity | null,
) {
  entity.targetId = target?.id ?? null
  entity.data.moveStartAt = world.time
  entity.data.moveStartX = entity.x
  entity.data.moveStartY = entity.y
  entity.data.moveTargetX = target?.x ?? entity.x + entity.facing * world.unit * 7
  entity.data.moveTargetY = target ? bodyPoint(target, world).y : world.groundY - world.unit * 2
  entity.data.moveStep = 0
  entity.data.moveTick = 0
  world.setState(entity, state)
}

function dragonAiRest(entity: EcoEntity, min = 1.2, max = 2.4) {
  entity.data.cool = between(min, max)
}

function dragonControlledTarget(
  entity: EcoEntity,
  world: EcoWorld,
  context: EcoControlAbilityContext,
) {
  const point = controlCastPoint(entity, world, context)
  const target =
    frontTarget(entity, world, world.unit * 18, 8) ??
    world.nearest(entity, (other) => isTargetableFoe(entity, other), world.unit * 18)

  entity.data.moveTargetX = point.x
  entity.data.moveTargetY = point.y

  return target
}

function tickDragonMove(entity: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit
  const move = dragonMoveTarget(entity, world)
  const elapsed = world.time - (entity.data.moveStartAt ?? world.time)
  entity.facing = move.targetX >= entity.x ? 1 : -1

  if (entity.state === 'talon-snatch') {
    entity.fx = 'talon-snatch'
    const progress = clamp(elapsed / 1.25, 0, 1)
    const startX = entity.data.moveStartX ?? entity.x
    const startY = entity.data.moveStartY ?? entity.y
    const dive = smoothStep(Math.min(progress / 0.55, 1))
    const lift = smoothStep(clamp((progress - 0.48) / 0.52, 0, 1))
    moveTowardPoint(
      entity,
      world,
      dt,
      startX + (move.targetX - startX) * dive + entity.facing * unit * 5.5 * lift,
      startY + (world.groundY - unit * 3.2 - startY) * dive - unit * 5.2 * lift,
      1.35,
    )
    if (progress > 0.42 && (entity.data.moveStep ?? 0) <= 0) {
      entity.data.moveStep = 1
      const foe = move.target ?? world.nearest(entity, isSpellDuelTarget(world, entity), unit * 5)
      if (foe) {
        foe.lift = Math.max(foe.lift, unit * 2.6)
        foe.vx += entity.facing * unit * 3.2
        foe.vy -= unit * 3.6
        damageGroundTarget(foe, world, 0.95, entity, 2.8)
        spawnImpact(world, foe.x, bodyPoint(foe, world).y, 2.4, 'slash', 0.36)
      }
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.2, 2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'wing-pinion') {
    entity.fx = 'wing-pinion'
    const progress = clamp(elapsed / 0.95, 0, 1)
    moveTowardPoint(
      entity,
      world,
      dt,
      move.targetX - entity.facing * unit * 1.5,
      world.groundY - unit * 2.2,
      1.2,
    )
    entity.tilt = Math.sin(progress * Math.PI) * entity.facing * 12
    if (progress > 0.35 && (entity.data.moveStep ?? 0) <= 0) {
      entity.data.moveStep = 1
      for (const foe of world.within(entity.x, world.groundY, unit * 4.3, (other) =>
        isTargetableFoe(entity, other),
      )) {
        foe.data.slowUntil = Math.max(foe.data.slowUntil ?? 0, world.time + 1.4)
        foe.fx = 'frozen'
        damageGroundTarget(foe, world, 0.78, entity, 1.6)
      }
      spawnImpact(world, entity.x, world.groundY - unit * 1.2, 3.2, 'frost', 0.48)
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.4, 2.4)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'body-roll') {
    entity.fx = 'body-roll'
    const startX = entity.data.moveStartX ?? entity.x
    const progress = clamp(elapsed / 1.05, 0, 1)
    moveTowardPoint(
      entity,
      world,
      dt,
      clamp(startX + entity.facing * unit * 8 * progress, unit, world.width - unit),
      world.groundY - unit * 2.1,
      1.2,
    )
    entity.tilt += entity.facing * dt * 220
    for (const foe of world.within(entity.x, world.groundY, unit * 4, (other) =>
      isTargetableFoe(entity, other),
    )) {
      if ((entity.data[`roll-${foe.id}`] ?? 0) <= 0) {
        entity.data[`roll-${foe.id}`] = 1
        foe.lift = Math.max(foe.lift, unit * 1.2)
        damageGroundTarget(foe, world, 0.8, entity, 3)
      }
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.3, 2.3)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'whisker-lash') {
    entity.fx = 'whisker-lash'
    const progress = clamp(elapsed / 0.75, 0, 1)
    moveTowardPoint(
      entity,
      world,
      dt,
      move.targetX - entity.facing * unit * 4.4,
      move.targetY - unit * 1.4,
      1.3,
    )
    entity.tilt = Math.sin(progress * Math.PI * 2) * entity.facing * 14
    if (progress > 0.42 && (entity.data.moveStep ?? 0) <= 0) {
      entity.data.moveStep = 1
      spawnBeam(
        world,
        'duel-beam-good',
        {
          x: entity.x + entity.facing * world.widthOf(entity) * 0.45,
          y: entity.y - world.heightOf(entity) * 0.2,
        },
        { x: move.targetX, y: move.targetY },
        0.18,
      )
      for (const foe of world.within(move.targetX, world.groundY, unit * 3.6, (other) =>
        isTargetableFoe(entity, other),
      )) {
        foe.fx = 'soaked'
        damageGroundTarget(foe, world, 0.66, entity, 2.4)
      }
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1, 1.8)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'scale-run') {
    entity.fx = 'scale-run'
    const startX = entity.data.moveStartX ?? entity.x
    const progress = clamp(elapsed / 1.05, 0, 1)
    const desiredX = clamp(startX + entity.facing * unit * 8.5 * progress, unit, world.width - unit)
    const desiredY = clamp(
      world.groundY - unit * 3.4,
      world.skyTop + unit,
      world.groundY - unit * 2.4,
    )
    moveTowardPoint(entity, world, dt, desiredX, desiredY, 1.1)
    entity.tilt = Math.sin(progress * Math.PI * 2) * 7
    for (let index = 0; index < 5; index += 1) {
      const threshold = 0.18 + index * 0.14
      const key = `scale-${index}`
      if (progress > threshold && (entity.data[key] ?? 0) <= 0) {
        entity.data[key] = 1
        spawnDragonZone(
          world,
          'dragon-burn-zone',
          entity,
          entity.x - entity.facing * unit * between(0.6, 1.8),
          world.groundY - unit * 0.45,
          between(2, 2.8),
          2.2,
        )
      }
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.4, 2.2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'chimney') {
    entity.fx = 'chimney'
    entity.vy = -unit * 5.8
    entity.vx *= 0.88
    integrate(entity, dt)
    keepInSky(entity, world, world.skyTop, world.groundY - unit * 3)
    if ((entity.data.moveStep ?? 0) <= 0) {
      entity.data.moveStep = 1
      spawnDragonZone(
        world,
        'dragon-updraft',
        entity,
        entity.x,
        world.groundY - unit * 1.4,
        5.2,
        0.9,
      )
    }
    if (elapsed > 0.9) {
      entity.fx = ''
      dragonAiRest(entity, 1.2, 2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'kiln-spiral') {
    entity.fx = 'kiln-spiral'
    const centerX = clamp(entity.data.moveTargetX ?? entity.x, unit * 3, world.width - unit * 3)
    const centerY = world.groundY - unit * 4.2
    const progress = clamp(elapsed / 2.2, 0, 1)
    const angle = progress * Math.PI * 4.8
    const radius = unit * (7 - progress * 3.2)
    moveTowardPoint(
      entity,
      world,
      dt,
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * unit * 1.3,
      1.35,
    )
    entity.tilt = Math.sin(angle) * 20
    entity.data.moveTick = (entity.data.moveTick ?? 0) - dt
    if ((entity.data.moveTick ?? 0) <= 0) {
      entity.data.moveTick = 0.18
      spawnDragonZone(
        world,
        'dragon-burn-zone',
        entity,
        entity.x,
        world.groundY - unit * 0.45,
        3,
        2.6,
      )
    }
    if (progress >= 1) {
      spawnDragonZone(world, 'dragon-updraft', entity, centerX, world.groundY - unit * 1.5, 7.6, 1)
      entity.fx = ''
      dragonAiRest(entity, 1.4, 2.2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'rootstep') {
    entity.fx = 'rootstep'
    const progress = clamp(elapsed / 0.8, 0, 1)
    moveTowardPoint(
      entity,
      world,
      dt,
      entity.x + entity.facing * unit * 0.25,
      world.groundY - unit * 2.3,
      0.8,
    )
    entity.tilt = Math.sin(progress * Math.PI * 4) * 5
    for (let index = 0; index < 4; index += 1) {
      const key = `root-${index}`
      if (progress > 0.18 + index * 0.14 && (entity.data[key] ?? 0) <= 0) {
        entity.data[key] = 1
        spawnDragonZone(
          world,
          'dragon-root-bump',
          entity,
          entity.x + entity.facing * unit * (2 + index * 1.6),
          world.groundY - unit * 0.6,
          2.4 + index * 0.2,
          1.2,
        )
      }
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.2, 2.2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'canopy') {
    entity.fx = 'canopy'
    const progress = clamp(elapsed / 1.25, 0, 1)
    moveTowardPoint(entity, world, dt, entity.x, world.groundY - unit * 2.8, 0.7)
    entity.tilt = Math.sin(progress * Math.PI) * -8
    if (progress > 0.38 && (entity.data.moveStep ?? 0) <= 0) {
      entity.data.moveStep = 1
      const charge = clamp(entity.data.controlCharge ?? 1, 0.35, 1)
      spawnDragonZone(
        world,
        'dragon-vine-patch',
        entity,
        move.targetX,
        world.groundY - unit * 0.9,
        4.6 + charge * 3.2,
        2 + charge * 2,
      )
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.6, 2.8)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'antler-plow') {
    entity.fx = 'antler-plow'
    const startX = entity.data.moveStartX ?? entity.x
    const progress = clamp(elapsed / 1, 0, 1)
    const desiredX = clamp(startX + entity.facing * unit * 8.2 * progress, unit, world.width - unit)
    const desiredY = world.groundY - unit * (2.2 + Math.sin(progress * Math.PI) * 0.5)
    moveTowardPoint(entity, world, dt, desiredX, desiredY, 1.15)
    if ((entity.data.moveTick ?? 0) <= 0) {
      entity.data.moveTick = 0.18
      spawnDragonZone(
        world,
        'dragon-hedge-ridge',
        entity,
        entity.x,
        world.groundY - unit * 0.8,
        3.1,
        2.1,
      )
    }
    entity.data.moveTick = (entity.data.moveTick ?? 0) - dt
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.4, 2.4)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'orchard') {
    entity.fx = 'orchard'
    const progress = clamp(elapsed / 1.5, 0, 1)
    for (let index = 0; index < 3; index += 1) {
      const key = `trunk-${index}`
      if (progress > 0.18 + index * 0.22 && (entity.data[key] ?? 0) <= 0) {
        entity.data[key] = 1
        spawnDragonZone(
          world,
          'dragon-trunk',
          entity,
          move.targetX + (index - 1) * unit * 3.2,
          world.groundY - unit * 2.1,
          4.8,
          1.1,
        )
      }
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.4, 2.4)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'ice-skid') {
    entity.fx = 'ice-skid'
    const startX = entity.data.moveStartX ?? entity.x
    const progress = clamp(elapsed / 1.05, 0, 1)
    moveTowardPoint(
      entity,
      world,
      dt,
      clamp(startX + entity.facing * unit * 9.2 * progress, unit, world.width - unit),
      world.groundY - unit * 1.85,
      1.25,
    )
    if ((entity.data.moveTick ?? 0) <= 0) {
      entity.data.moveTick = 0.16
      spawnDragonZone(
        world,
        'dragon-ice-slick',
        entity,
        entity.x,
        world.groundY - unit * 0.65,
        2.8,
        2.4,
      )
    }
    entity.data.moveTick = (entity.data.moveTick ?? 0) - dt
    if (progress >= 1) {
      spawnDragonZone(
        world,
        'dragon-ice-pop',
        entity,
        entity.x,
        world.groundY - unit * 1.2,
        4.4,
        0.8,
      )
      entity.fx = ''
      dragonAiRest(entity, 1.4, 2.4)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'whiteout') {
    entity.fx = elapsed < 0.42 ? 'whiteout-wrap' : 'whiteout-burst'
    const charge = clamp(entity.data.controlCharge ?? 1, 0.35, 1)
    if ((entity.data.moveStep ?? 0) <= 0) {
      entity.data.moveStep = 1
      spawnDragonZone(
        world,
        'dragon-fog-bank',
        entity,
        entity.x,
        world.groundY - unit * 2.3,
        4 + charge * 3,
        2.6,
      )
    }
    if (elapsed > 0.42) {
      moveTowardPoint(
        entity,
        world,
        dt,
        clamp(
          (entity.data.moveStartX ?? entity.x) + entity.facing * unit * (6 + charge * 5),
          unit,
          world.width - unit,
        ),
        world.groundY - unit * 2.2,
        1.25,
      )
    }
    if (elapsed > 1.15) {
      entity.fx = ''
      dragonAiRest(entity, 1.6, 2.8)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'icicle-snap') {
    entity.fx = 'icicle-snap'
    const progress = clamp(elapsed / 0.95, 0, 1)
    moveTowardPoint(
      entity,
      world,
      dt,
      move.targetX - entity.facing * unit * 2,
      world.groundY - unit * (4.5 - progress * 2),
      1,
    )
    if (progress > 0.52 && (entity.data.moveStep ?? 0) <= 0) {
      entity.data.moveStep = 1
      spawnDragonZone(
        world,
        'dragon-ice-pop',
        entity,
        move.targetX,
        world.groundY - unit * 1.6,
        5.2,
        1.2,
      )
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.2, 2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'snowglobe') {
    entity.fx = 'snowglobe'
    const centerX = move.targetX
    const progress = clamp(elapsed / 2.1, 0, 1)
    const angle = progress * Math.PI * 3.6
    moveTowardPoint(
      entity,
      world,
      dt,
      centerX + Math.cos(angle) * unit * 6,
      world.groundY - unit * (3.3 + Math.sin(angle) * 1.3),
      1.25,
    )
    if ((entity.data.moveTick ?? 0) <= 0) {
      entity.data.moveTick = 0.22
      spawnDragonZone(
        world,
        'dragon-ice-slick',
        entity,
        entity.x,
        world.groundY - unit * 0.7,
        4.3,
        1.8,
      )
    }
    entity.data.moveTick = (entity.data.moveTick ?? 0) - dt
    if (progress >= 1) {
      spawnDragonZone(world, 'dragon-ice-pop', entity, centerX, world.groundY - unit * 1.5, 8, 1)
      entity.fx = ''
      dragonAiRest(entity, 1.6, 2.8)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'river-loop') {
    entity.fx = 'river-loop'
    const progress = clamp(elapsed / 0.95, 0, 1)
    const angle = progress * Math.PI * 2
    moveTowardPoint(
      entity,
      world,
      dt,
      (entity.data.moveStartX ?? entity.x) + entity.facing * unit * 5.8 * progress,
      (entity.data.moveStartY ?? entity.y) + Math.sin(angle) * unit * 3,
      1.25,
    )
    if ((entity.data.moveStep ?? 0) <= 0 && progress > 0.48) {
      entity.data.moveStep = 1
      spawnDragonZone(
        world,
        'dragon-rain-puddle',
        entity,
        entity.x,
        world.groundY - unit * 0.6,
        5,
        2.2,
      )
    }
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1, 1.8)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'pagoda-coil') {
    entity.fx = 'pagoda-coil'
    const charge = clamp(entity.data.controlCharge ?? 1, 0.35, 1)
    const progress = clamp(elapsed / (1.1 + charge * 0.45), 0, 1)
    const wraps = 1.2 + charge * 1.6
    const angle = progress * Math.PI * 2 * wraps
    moveTowardPoint(
      entity,
      world,
      dt,
      move.targetX + Math.cos(angle) * unit * 4,
      move.targetY + Math.sin(angle) * unit * 2,
      1.25,
    )
    if ((entity.data.moveTick ?? 0) <= 0) {
      entity.data.moveTick = 0.2
      spawnDragonZone(world, 'dragon-storm-pulse', entity, move.targetX, move.targetY, 4.4, 0.7)
    }
    entity.data.moveTick = (entity.data.moveTick ?? 0) - dt
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.2, 2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'cloud-step') {
    entity.fx = 'cloud-step'
    const progress = clamp(elapsed / 1.15, 0, 1)
    const step = Math.floor(progress * 5)
    moveTowardPoint(
      entity,
      world,
      dt,
      (entity.data.moveStartX ?? entity.x) + entity.facing * unit * 9 * progress,
      (entity.data.moveStartY ?? entity.y) +
        Math.sin(progress * Math.PI * 4) * unit * 1.5 +
        step * unit * 0.35,
      1.25,
    )
    if ((entity.data.moveTick ?? 0) <= 0) {
      entity.data.moveTick = 0.18
      spawnDragonZone(
        world,
        'dragon-rain-puddle',
        entity,
        entity.x,
        world.groundY - unit * 0.6,
        3.2,
        2.1,
      )
    }
    entity.data.moveTick = (entity.data.moveTick ?? 0) - dt
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.2, 2.2)
      world.setState(entity, 'patrol')
    }
    return true
  }

  if (entity.state === 'deluge') {
    entity.fx = 'deluge'
    const progress = clamp(elapsed / 2.3, 0, 1)
    const angle = progress * Math.PI * 4.4
    moveTowardPoint(
      entity,
      world,
      dt,
      move.targetX + Math.cos(angle) * unit * 7,
      world.groundY - unit * (4 + Math.sin(angle) * 1.7),
      1.35,
    )
    if ((entity.data.moveTick ?? 0) <= 0) {
      entity.data.moveTick = 0.2
      spawnDragonZone(
        world,
        progress < 0.55 ? 'dragon-rain-puddle' : 'dragon-storm-pulse',
        entity,
        entity.x,
        world.groundY - unit * 0.7,
        4.6,
        1.8,
      )
    }
    entity.data.moveTick = (entity.data.moveTick ?? 0) - dt
    if (progress >= 1) {
      entity.fx = ''
      dragonAiRest(entity, 1.4, 2.4)
      world.setState(entity, 'patrol')
    }
    return true
  }

  return false
}

const dragon: EcoSpecies = {
  anchor: 'center',
  asset: () => pick(dragonVariants).asset,
  hp: 3,
  init(entity, world) {
    const variant =
      dragonVariants.find((entry) => entry.asset === entity.asset) ?? dragonVariants[0]

    entity.species = variant.species
    entity.countAs = 'dragon'
    entity.idle = variant.idle
    entity.size = between(variant.size[0], variant.size[1])
    entity.data.team = Math.random() < 0.46 ? darkTeam : wildTeam
    entity.hp = variant.species === 'eastern-dragon' ? 18 : 16
    entity.maxHp = entity.hp
    entity.data.cool =
      variant.species === 'eastern-dragon' ? between(0.35, 0.85) : between(0.8, 1.8)
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.36)
    if (variant.species === 'eastern-dragon') {
      entity.x = clamp(entity.x, world.unit * 5, world.width - world.unit * 5)
      entity.data.cruiseSeed = between(0, Math.PI * 2)
    }
  },
  layer: 'front',
  size: [9, 11.2],
  state: 'patrol',
  style: (entity) => ({
    ...siegeTeamStyle(entity),
    '--eco-recharge': String(clamp(entity.data.flameRecharge ?? 0, 0, 1)),
  }),
  strongVs: ['knight', 'building'],
  tags: ['dragon'],
  weakTo: ['archer', 'ballista', 'wizard', 'projectile'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.data.angry = Math.max(0, (entity.data.angry ?? 0) - dt)

    if ((entity.data.hurt ?? 0) > 0) {
      entity.data.hurt = (entity.data.hurt ?? 0) - dt

      if ((entity.data.hurt ?? 0) <= 0 && entity.state !== 'falling') {
        entity.fx = ''
      }
    }

    if (entity.hp <= 0 && entity.state !== 'falling') {
      entity.fx = 'crash'
      entity.data.crashed = 0
      world.setState(entity, 'falling')
    }

    if (entity.state === 'falling') {
      if ((entity.data.crashed ?? 0) > 0) {
        entity.fx = 'crash-landed'
        entity.vx = 0
        entity.vy = 0
        entity.tilt *= 0.96
        entity.scale = Math.max(0.1, entity.scale - dt * 0.42)

        if (world.time - (entity.data.crashAt ?? world.time) > 0.85) {
          world.kill(entity)
        }
        return
      }

      entity.fx = 'crash'
      entity.vy += unit * 7.8 * dt
      entity.vx *= 0.985
      entity.tilt += dt * 120 * (entity.facing || 1)
      integrate(entity, dt)

      if (entity.y >= world.groundY - world.heightOf(entity) * 0.3) {
        for (const other of world.within(
          entity.x,
          world.groundY,
          unit * 3,
          isHazardTarget(world),
        )) {
          if (world.has(other, 'fuel')) {
            other.data.burn = 0.01
          } else if (!world.has(other, 'knight')) {
            world.kill(other)
          }
        }

        world.spawn('fire', { x: entity.x })
        world.spawn('fire', { x: clamp(entity.x - unit * 1.4, 0, world.width) })
        spawnImpact(world, entity.x, world.groundY - unit * 0.7, 5.8, 'dust', 0.9)
        entity.data.crashed = 1
        entity.data.crashAt = world.time
        entity.y = world.groundY - world.heightOf(entity) * 0.3
        entity.vx = 0
        entity.vy = 0
        entity.fx = 'crash-landed'
      }
      return
    }

    if (entity.state === 'frozen') {
      entity.fx = 'frozen'
      entity.data.cool = Math.max(entity.data.cool ?? 0, 1.2)
      entity.vx *= 0.975
      entity.vy += unit * 1.8 * dt
      entity.vy = Math.min(entity.vy, unit * 1.6)
      integrate(entity, dt)
      if (entity.y > world.groundY - unit * 3.8) {
        moveTowardPoint(entity, world, dt, entity.x, world.groundY - unit * 3.8)
      }
      entity.tilt = Math.sin(world.time * 1.8 + entity.id) * 4
      keepInSky(entity, world, world.skyTop, world.groundY - unit * 3.8)

      if (entity.t > (entity.data.freezeFor ?? 3.6)) {
        entity.fx = ''
        entity.data.angry = 3.5
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'rooted') {
      entity.fx = 'rooted'
      entity.data.cool = Math.max(entity.data.cool ?? 0, 1.2)
      entity.vx *= 0.92
      entity.vy += unit * 1.2 * dt
      entity.vy = Math.min(entity.vy, unit * 1.2)
      integrate(entity, dt)
      if (entity.y > world.groundY - unit * 3.2) {
        moveTowardPoint(entity, world, dt, entity.x, world.groundY - unit * 3.2)
      }
      entity.tilt = Math.sin(world.time * 2 + entity.id) * 3

      if (entity.t > (entity.data.rootFor ?? 3.2)) {
        entity.fx = ''
        entity.data.angry = 4
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'flame-strafe') {
      tickDragonFlameStrafe(entity, world, dt)
      return
    }

    if (tickDragonMove(entity, world, dt)) {
      return
    }

    if (entity.species === 'eastern-dragon') {
      const cruise = world.time * 0.42 + (entity.data.cruiseSeed ?? 0)
      const targetX = world.width * 0.5 + Math.sin(cruise) * world.width * 0.32
      const targetY = world.skyTop + unit * 3.2 + Math.sin(cruise * 2.1) * unit * 2.1
      const dx = clamp(targetX, unit * 4, world.width - unit * 4) - entity.x
      const dy = clamp(targetY, world.skyTop + unit * 1.4, world.groundY - unit * 8) - entity.y
      const distance = Math.max(unit, Math.hypot(dx, dy))
      const speed = unit * 2.8
      entity.vx += (dx / distance) * speed * dt
      entity.vy += (dy / distance) * speed * dt
      entity.vx *= 0.94
      entity.vy *= 0.94
    } else {
      wander(
        entity,
        world,
        dt,
        unit * ((entity.data.angry ?? 0) > 0 ? 3.8 : 2.6),
        world.skyTop + unit,
        world.height * 0.4,
        1.4,
      )
    }
    integrate(entity, dt)
    faceTravel(entity)
    tiltToVelocity(entity, 12)
    keepInSky(entity, world)
    entity.data.cool = (entity.data.cool ?? 0) - dt

    if ((entity.data.cool ?? 0) <= 0) {
      const targets = world.entities.filter(
        (other) =>
          !other.dying &&
          !other.removed &&
          world.has(other, 'target') &&
          isEnemy(entity, other) &&
          (entity.species === 'eastern-dragon' || Math.abs(other.x - entity.x) < unit * 30),
      )

      if (targets.length > 0) {
        const target = pick(targets)
        entity.targetId = target.id

        if (entity.species === 'ember-dragon') {
          if (Math.random() < 0.46) {
            startDragonMove(entity, world, 'talon-snatch', target)
          } else {
            startDragonFlameStrafe(entity, world, target)
          }
        } else if (entity.species === 'emerald-dragon') {
          startDragonMove(
            entity,
            world,
            Math.random() < 0.36 ? 'antler-plow' : Math.random() < 0.62 ? 'body-roll' : 'rootstep',
            target,
          )
        } else if (entity.species === 'frost-dragon') {
          startDragonMove(
            entity,
            world,
            Math.random() < 0.38 ? 'wing-pinion' : Math.random() < 0.72 ? 'ice-skid' : 'whiteout',
            target,
          )
        } else if (entity.species === 'eastern-dragon') {
          startDragonMove(
            entity,
            world,
            Math.random() < 0.4
              ? 'whisker-lash'
              : Math.random() < 0.7
                ? 'pagoda-coil'
                : 'cloud-step',
            target,
          )
        } else {
          startDragonFlameStrafe(entity, world, target)
        }
        return
      }

      entity.data.cool = entity.species === 'eastern-dragon' ? between(0.5, 1) : between(1, 2)
    }
  },
}

const fireball: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('fireball'),
  countAs: null,
  layer: 'front',
  size: [1.8, 2.2],
  state: 'fly',
  strongVs: ['archer', 'building', 'burnable', 'princess'],
  tags: ['fireball', 'projectile', 'fire'],
  weakTo: ['knight', 'wizard'],
  tick(entity, world, dt) {
    const unit = world.unit

    entity.vy += fireballGravity * unit * dt
    integrate(entity, dt)
    entity.facing = entity.vx >= 0 ? 1 : -1
    tiltToVelocity(entity, 90)

    if (entity.x < -unit * 3 || entity.x > world.width + unit * 3) {
      world.remove(entity)
      return
    }

    if (entity.y < world.groundY - unit * 0.2) {
      const iceWall = world.nearest(
        entity,
        (other) => other.species === 'ice-wall' && Math.abs(other.x - entity.x) < unit * 1.4,
        unit * 2.2,
      )

      if (iceWall) {
        spawnImpact(world, entity.x, entity.y, 2.2, 'frost', 0.48)
        iceWall.data.flash = 0.5
        world.kill(entity)
      }

      return
    }

    const shield = world.nearest(
      { x: entity.x, y: world.groundY },
      (other) => world.has(other, 'building') && shielded(other, world),
      unit * 5,
    )

    if (shield) {
      shield.data.fizzleUntil = world.time + 0.45
      spawnCast(world, entity.x, world.groundY - unit * 2.4, 1.7)
      world.kill(entity)
      return
    }

    const blocker = world.nearest(
      entity,
      (other) => world.has(other, 'knight') && other.state === 'guard',
      unit * 2.6,
    )

    if (blocker && Math.random() < Math.min(0.95, 0.75 * world.edge(blocker, entity))) {
      blocker.fx = 'block'
      blocker.data.block = 0.5
      world.kill(entity)
      return
    }

    for (const other of world.within(entity.x, world.groundY, unit * 1.9, isHazardTarget(world))) {
      const edge = world.edge(entity, other)

      if (world.has(other, 'wizard') && Math.random() < 0.9 / edge) {
        const direction = entity.x >= other.x ? -1 : 1

        spawnCast(world, other.x, other.y - world.heightOf(other) * 0.55, 2.4, 'blink', 0.55)
        other.vx += direction * unit * between(7, 10)
        other.facing = direction === 1 ? -1 : 1
        other.fx = 'blink'
        other.lift = unit * 0.25
        other.data.blinkCool = between(5, 8)
        other.data.blinkFx = 0.75
        world.setAsset(other, wizardTypeFor(other).asset)
        world.setState(other, 'wander')
        spawnCast(
          world,
          clamp(other.x + direction * unit * 3, unit, world.width - unit),
          other.y - world.heightOf(other) * 0.55,
          2.6,
          'blink',
          0.65,
        )
      } else if (world.has(other, 'fuel')) {
        other.data.burn = Math.max(other.data.burn ?? 0, 0.01)
      } else if (world.has(other, 'knight') && other.hp > 1) {
        other.hp -= world.edge(entity, other)
        other.fx = 'burn'
        other.data.burn = Math.max(other.data.burn ?? 0, 0.01)
        other.data.block = 0.45
      } else if (Math.random() < Math.min(0.96, 0.72 * edge)) {
        world.kill(other)
      } else {
        other.fx = 'burn'
        other.data.burn = Math.max(other.data.burn ?? 0, 0.01)
      }
    }

    if (!world.nearest(entity, (other) => world.has(other, 'fire'), unit * 1.2)) {
      world.spawn('fire', { x: entity.x })
    }

    world.kill(entity)
  },
}

const isFireOrBurning = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'fire') || (other.data.burn ?? 0) > 0

function dismountKnight(entity: EcoEntity, world: EcoWorld) {
  if ((entity.data.mounted ?? 0) <= 0 || entity.dying || entity.removed) {
    return false
  }

  entity.data.mounted = 0
  entity.hp = Math.max(1, entity.hp + 1)
  entity.size = clamp(entity.size * 0.72, 2.75, 3.35)
  entity.lift = Math.max(entity.lift, world.unit * 0.45)
  entity.vx *= 0.35
  entity.vy = 0
  entity.fx = 'dismount'
  entity.data.block = 0.55
  entity.data.cool = Math.max(entity.data.cool ?? 0, 1.2)
  world.setAsset(entity, knightAsset)
  world.setState(entity, 'march')
  spawnImpact(world, entity.x, entity.y - world.unit * 1.2, 2.2, 'dust', 0.5)

  return true
}

function elementalImpactFx(attacker: EcoEntity, world: EcoWorld) {
  if (
    world.has(attacker, 'fire') ||
    attacker.species === 'flame-stream' ||
    attacker.species === 'dragon-burn-zone'
  ) {
    return 'burn'
  }

  if (
    attacker.species === 'dragon-ice-slick' ||
    attacker.species === 'dragon-ice-pop' ||
    attacker.species === 'dragon-fog-bank' ||
    attacker.fx === 'frost'
  ) {
    return 'frozen'
  }

  if (
    attacker.species === 'dragon-root-bump' ||
    attacker.species === 'dragon-vine-patch' ||
    attacker.species === 'dragon-hedge-ridge' ||
    attacker.species === 'dragon-trunk' ||
    attacker.fx === 'plant' ||
    attacker.fx === 'vine'
  ) {
    return 'rooted'
  }

  if (
    attacker.species === 'dragon-rain-puddle' ||
    attacker.species === 'dragon-storm-pulse' ||
    attacker.species === 'eastern-dragon' ||
    attacker.fx === 'rain' ||
    attacker.fx === 'storm'
  ) {
    return 'soaked'
  }

  return 'hurt'
}

function damageGroundTarget(
  target: EcoEntity,
  world: EcoWorld,
  amount: number,
  attacker: EcoEntity,
  knock = 0,
) {
  if (target.dying || target.removed || !isEnemy(attacker, target)) {
    return
  }

  if (
    world.has(attacker, 'knight') &&
    world.has(target, 'dragon') &&
    !dragonMeleeVulnerable(target)
  ) {
    spawnImpact(world, target.x, target.y, 1.8, 'sparkle', 0.22)
    return
  }

  const edge = world.edge(attacker, target)
  const impactFx = elementalImpactFx(attacker, world)
  world.gainControlResource(attacker, amount * edge * 12)
  world.gainControlResource(target, amount * edge * 8)

  if (world.has(target, 'dragon') || target.species === 'dark-lord') {
    hurtDragonOrLord(target, world, amount, target.state === 'sleep', attacker.x, attacker)
  } else if (world.has(target, 'knight')) {
    target.hp -= amount * edge
    target.fx = impactFx
    target.data.block = 0.45

    if (target.hp <= 1 && dismountKnight(target, world)) {
      return
    }

    if (target.hp <= 0) {
      world.kill(target)
    }
  } else if (world.has(target, 'wizard')) {
    target.hp -= amount * edge
    target.fx = impactFx
    target.data.blinkFx = 0.45

    if (target.hp <= 0) {
      world.kill(target)
    }
  } else if (world.has(target, 'burnable') || world.has(target, 'target')) {
    if (amount >= 1 || Math.random() < Math.min(0.92, amount * world.edge(attacker, target))) {
      world.kill(target)
    } else {
      target.fx = impactFx
    }
  }

  if (knock !== 0) {
    target.vx += Math.sign(target.x - attacker.x || attacker.facing || 1) * world.unit * knock
    target.vy -= world.unit * knock * 0.42
    target.lift = Math.max(target.lift, world.unit * Math.min(1.8, knock * 0.35))
  }
}

function isSpellDuelTarget(world: EcoWorld, attacker?: EcoEntity) {
  return (other: EcoEntity) =>
    (isDragonOrLord(world)(other) || world.has(other, 'knight') || world.has(other, 'wizard')) &&
    (!attacker || isEnemy(attacker, other))
}

function deflectableByKnight(projectile: EcoEntity, world: EcoWorld) {
  return world.nearest(
    projectile,
    (other) =>
      world.has(other, 'knight') &&
      (other.state === 'guard' || other.state === 'parry') &&
      Math.abs(other.x - projectile.x) < world.unit * 2.3,
    world.unit * 2.8,
  )
}

function controlAction(
  entity: EcoEntity,
  world: EcoWorld,
  state: string,
  seconds: number,
  asset?: string,
  fx?: string,
) {
  entity.data.controlActionUntil = world.time + seconds
  entity.controlResetAsset = entity.controlResetAsset || entity.asset
  entity.targetId = null

  if (asset) {
    world.setAsset(entity, asset)
  }

  if (fx) {
    entity.fx = fx
    entity.data.controlFxUntil = world.time + seconds
  }

  world.setState(entity, state)
}

function wizardCastAssetForState(entity: EcoEntity, state: string) {
  const wizardUnit =
    entity.countAs === 'wizard' || entity.species === 'wizard' || entity.species.endsWith('-wizard')

  return !wizardUnit || !isWizardCasting(state) ? undefined : wizardTypeFor(entity).castAsset
}

function siegeControlTarget(entity: EcoEntity, other: EcoEntity) {
  return isTargetableFoe(entity, other)
}

function frontTarget(entity: EcoEntity, world: EcoWorld, reach: number, vertical = 4.5) {
  const x = entity.x + entity.facing * reach * 0.5

  return world.nearest(
    { x, y: entity.y },
    (other) =>
      siegeControlTarget(entity, other) &&
      Math.sign(other.x - entity.x || entity.facing) === entity.facing &&
      Math.abs(bodyPoint(other, world).y - bodyPoint(entity, world).y) < world.unit * vertical,
    reach,
  )
}

function areaTargets(entity: EcoEntity, world: EcoWorld, radius: number) {
  return world.within(entity.x, entity.y, radius, (other) => siegeControlTarget(entity, other))
}

function controlHit(
  entity: EcoEntity,
  target: EcoEntity,
  world: EcoWorld,
  amount: number,
  knock = 1.6,
) {
  damageGroundTarget(target, world, amount, entity, knock)
  world.gainControlResource(entity, amount * 8)
}

function controlCastPoint(entity: EcoEntity, world: EcoWorld, context: EcoControlAbilityContext) {
  const endX =
    Math.abs(context.cast.endX - context.cast.startX) > world.unit * 0.2
      ? context.cast.endX
      : entity.x + entity.facing * world.unit * 12
  const endY =
    Math.abs(context.cast.endY - context.cast.startY) > world.unit * 0.2
      ? context.cast.endY
      : entity.y - world.heightOf(entity) * 0.45

  return {
    x: clamp(endX, world.unit, world.width - world.unit),
    y: clamp(endY, world.skyTop + world.unit, world.groundY),
  }
}

type SiegeAbilityConfig = {
  active?: number
  amount?: number
  archetype?: string
  asset?: string | ((entity: EcoEntity) => string)
  buff?: { block?: number; icon: string; name: string; seconds: number; speed?: number }
  charge?: { max: number; min?: number }
  cooldown?: number
  dash?: number
  description: string
  icon?: string
  key: 'q' | 'w' | 'e' | 'r'
  name: string
  radius?: number
  recovery?: number
  shape: 'circle' | 'cone' | 'ellipse' | 'line' | 'self'
  state?: string
  target?: 'area' | 'front'
  ultimate?: boolean
  vfx?: EcoControlAbility['vfx']
  width?: number
  windup?: number
  onRun?: (entity: EcoEntity, world: EcoWorld, context: EcoControlAbilityContext) => void
  onTick?: (
    entity: EcoEntity,
    world: EcoWorld,
    context: EcoControlAbilityContext,
    dt: number,
  ) => void
  onHit?: (entity: EcoEntity, target: EcoEntity, world: EcoWorld) => void
}

function siegeAbility(config: SiegeAbilityConfig): EcoControlAbility {
  const range = config.radius ?? Math.abs(config.dash ?? 4)
  const width = config.width ?? (config.shape === 'line' ? 2.8 : range)

  return {
    active: config.active ?? 0.28,
    archetype: config.archetype,
    asset: (entity) =>
      (typeof config.asset === 'function' ? config.asset(entity) : config.asset) ??
      wizardCastAssetForState(entity, config.state ?? entity.state),
    charge: config.charge,
    cooldown: config.cooldown ?? 0,
    dash: config.dash,
    description: config.description,
    icon: config.icon,
    key: config.key,
    name: config.name,
    recovery: config.recovery ?? 0.25,
    telegraph: { range, shape: config.shape, width },
    ultimate: config.ultimate,
    vfx: config.vfx,
    windup: config.windup ?? (config.key === 'r' ? 0.55 : config.key === 'q' ? 0.18 : 0.28),
    run(entity, world, context) {
      const state = config.state ?? entity.state
      const asset =
        (typeof config.asset === 'function' ? config.asset(entity) : config.asset) ??
        wizardCastAssetForState(entity, state)
      controlAction(
        entity,
        world,
        state,
        (config.active ?? 0.28) + (config.recovery ?? 0.25) + 0.04,
        asset,
        config.vfx,
      )

      if (config.buff) {
        if (config.buff.block !== undefined) {
          entity.data.controlBlockUntil = world.time + config.buff.seconds
          entity.data.controlBlock = config.buff.block
        }

        if (config.buff.speed !== undefined) {
          entity.data.controlSpeedUntil = world.time + config.buff.seconds
          entity.data.controlSpeed = config.buff.speed
        }

        world.addControlBuff(entity, config.buff.name, config.buff.icon, config.buff.seconds)
      }

      if (config.ultimate || config.vfx === 'shockwave') {
        world.shake(config.ultimate ? 0.8 : 0.36)
      }

      config.onRun?.(entity, world, context)
    },
    tick(entity, world, context, dt) {
      config.onTick?.(entity, world, context, dt)

      if (config.amount === undefined) {
        return
      }

      const targets =
        config.target === 'front'
          ? [frontTarget(entity, world, world.unit * range, width)].filter(Boolean)
          : areaTargets(entity, world, world.unit * range)

      for (const target of targets) {
        if (!target || context.cast.hitIds.has(target.id)) {
          continue
        }

        if (
          config.shape === 'line' &&
          Math.sign(target.x - entity.x || entity.facing) !== entity.facing
        ) {
          continue
        }

        context.cast.hitIds.add(target.id)
        if (config.archetype?.includes('Basic')) {
          const comboKey = `combo-${config.key}`
          const lastAt = entity.data[`${comboKey}-at`] ?? 0
          const nextStep = lastAt + 1.2 > world.time ? ((entity.data[comboKey] ?? 0) % 3) + 1 : 1
          entity.data[comboKey] = nextStep
          entity.data[`${comboKey}-at`] = world.time
        }
        const comboStep = config.archetype?.includes('Basic')
          ? (entity.data[`combo-${config.key}`] ?? 1)
          : 1
        const charge = clamp(entity.data.controlCharge ?? 1, 0.35, 1)
        const amount =
          config.amount * (config.charge ? 0.7 + charge * 0.75 : 1) * (comboStep === 3 ? 1.45 : 1)
        controlHit(entity, target, world, amount, config.ultimate ? 4.4 : 2)
        if (comboStep === 3) {
          world.effect({
            text: 'Combo!',
            tone: 'heavy',
            type: 'banner',
            x: entity.x,
            y: entity.y - world.heightOf(entity),
          })
        }
        config.onHit?.(entity, target, world)
      }
    },
  }
}

function fireControlProjectile(
  entity: EcoEntity,
  world: EcoWorld,
  context: EcoControlAbilityContext,
  species: string,
  speed: number,
  size: number,
  gravity = 0,
) {
  const origin = staffPoint(entity, world)
  const target = controlCastPoint(entity, world, context)
  const seconds = clamp(
    Math.hypot(target.x - origin.x, target.y - origin.y) / (world.unit * speed),
    0.18,
    1.4,
  )
  const launch = ballistic(origin.x, origin.y, target.x, target.y, seconds, gravity * world.unit)
  entity.facing = target.x >= entity.x ? 1 : -1

  return world.spawn(species, {
    ...launch,
    data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: -1 },
    facing: entity.facing,
    size,
    x: origin.x,
    y: origin.y,
  })
}

function reflectProjectiles(entity: EcoEntity, world: EcoWorld, radius = 5.2) {
  let count = 0

  for (const projectile of world.within(
    entity.x,
    entity.y - world.unit * 1.8,
    world.unit * radius,
    (other) => world.has(other, 'projectile') && !sameTeam(entity, other),
  )) {
    projectile.data.ownerTeam = teamOf(entity)
    projectile.data.ownerId = entity.id
    projectile.vx *= -1.2
    projectile.vy = -Math.abs(projectile.vy) * 0.45
    projectile.facing = projectile.vx >= 0 ? 1 : -1
    projectile.fx = projectile.fx || 'magic'
    count += 1
    spawnImpact(world, projectile.x, projectile.y, 1.8, 'shield', 0.34)
  }

  if (count > 0) {
    entity.data.shieldUntil = Math.max(entity.data.shieldUntil ?? 0, world.time + 0.8)
    world.gainControlResource(entity, count * 8)
  }

  return count
}

function spawnPlants(entity: EcoEntity, world: EcoWorld, x: number, count = 3) {
  for (let index = 0; index < count; index += 1) {
    world.spawn('siege-plant', {
      data: { life: between(4.2, 6.2), ownerId: entity.id, ownerTeam: teamOf(entity) },
      size: between(1.8, 2.35),
      x: clamp(x + between(-3, 3) * world.unit, world.unit, world.width - world.unit),
      y: world.groundY,
    })
  }
}

function benderHandPoint(entity: EcoEntity, world: EcoWorld) {
  return {
    x: entity.x + entity.facing * world.widthOf(entity) * 0.28,
    y: entity.y - entity.lift - world.heightOf(entity) * 0.56,
  }
}

function benderSlab(entity: EcoEntity, world: EcoWorld) {
  const existing = world.nearest(
    entity,
    (other) =>
      other.species === 'earth-slab' &&
      sameTeam(entity, other) &&
      Math.abs(other.x - entity.x) < world.unit * 7,
    world.unit * 7.5,
  )

  if (existing) {
    existing.state = 'slide'
    existing.facing = entity.facing
    existing.vx = entity.facing * world.unit * 6.8
    existing.data.life = Math.max(existing.data.life ?? 0, 1.3)
    existing.data.tumble = 1
    spawnImpact(world, existing.x, existing.y - world.unit * 1.2, 2.4, 'dust', 0.38)
    return existing
  }

  const slab = world.spawn('earth-slab', {
    data: { life: 2.5, ownerId: entity.id, ownerTeam: teamOf(entity) },
    facing: entity.facing,
    size: 3.2,
    x: clamp(entity.x + entity.facing * world.unit * 3.2, world.unit, world.width - world.unit),
    y: world.groundY,
  })

  spawnImpact(world, slab?.x ?? entity.x, world.groundY - world.unit * 1.4, 2.8, 'dust', 0.48)
  return slab
}

function benderWaterWhip(entity: EcoEntity, world: EcoWorld, x: number, charge = 1) {
  const origin = benderHandPoint(entity, world)
  const targetX = clamp(x, world.unit, world.width - world.unit)
  const dx = targetX - origin.x
  const direction: 1 | -1 = dx >= 0 ? 1 : -1
  const length = clamp(Math.abs(dx) / world.unit, 5, 9 + charge * 5)

  entity.facing = direction
  return world.spawn('water-whip', {
    data: {
      charge,
      life: 0.82,
      ownerId: entity.id,
      ownerTeam: teamOf(entity),
      originX: origin.x,
      originY: origin.y,
    },
    facing: direction,
    size: length,
    x: origin.x + direction * world.unit * length * 0.5,
    y: origin.y + world.unit * 0.7,
  })
}

function benderFireStep(entity: EcoEntity, world: EcoWorld) {
  const origin = bodyPoint(entity, world)

  world.spawn('fire-step-arc', {
    data: { life: 0.55, ownerId: entity.id, ownerTeam: teamOf(entity) },
    facing: entity.facing,
    size: 3.2,
    vx: entity.facing * world.unit * 5.4,
    x: origin.x + entity.facing * world.unit * 1.2,
    y: origin.y + world.unit * 0.4,
  })
  entity.vx += entity.facing * world.unit * 3.2
  spawnImpact(
    world,
    origin.x + entity.facing * world.unit * 1.2,
    world.groundY - world.unit * 0.7,
    2,
    'fire',
    0.34,
  )
}

function benderAirSpout(entity: EcoEntity, world: EcoWorld, x: number) {
  entity.lift = Math.max(entity.lift, world.unit * 2.8)
  world.spawn('air-spout', {
    data: { life: 1.4, ownerId: entity.id, ownerTeam: teamOf(entity) },
    size: 6.2,
    x: clamp(x, world.unit, world.width - world.unit),
    y: world.groundY,
  })
  spawnImpact(world, x, world.groundY - world.unit * 1.8, 4.5, 'dust', 0.72)
}

function controlCharge(entity: EcoEntity) {
  return clamp(entity.data.controlCharge ?? 1, 0.25, 1)
}

function lineTargets(entity: EcoEntity, world: EcoWorld, reach: number, width: number) {
  return world.within(
    entity.x + entity.facing * reach * 0.5,
    entity.y,
    reach,
    (other) =>
      siegeControlTarget(entity, other) &&
      Math.sign(other.x - entity.x || entity.facing) === entity.facing &&
      Math.abs(bodyPoint(other, world).y - bodyPoint(entity, world).y) < width,
  )
}

function alliedTargets(entity: EcoEntity, world: EcoWorld, radius: number) {
  return world.within(
    entity.x,
    world.groundY,
    radius,
    (other) => other !== entity && sameTeam(entity, other) && !other.dying && !other.removed,
  )
}

function chainLightning(
  entity: EcoEntity,
  world: EcoWorld,
  first: EcoEntity | null,
  hops: number,
  amount: number,
) {
  let from = staffPoint(entity, world)
  let current = first
  const hit = new Set<number>()

  for (let index = 0; index < hops && current; index += 1) {
    const to = bodyPoint(current, world)
    hit.add(current.id)
    spawnBeam(world, 'duel-beam-good', from, to, 0.18)
    world.spawn('lightning-strike', {
      size: clamp(Math.abs(from.y - to.y) / world.unit, 4.2, 7.4),
      x: current.x,
      y: to.y,
    })
    spawnImpact(world, current.x, to.y, 2.4, 'lightning', 0.42)
    damageGroundTarget(current, world, amount * (index === 0 ? 1 : 0.72), entity, 1.7)
    from = to
    current = world.nearest(
      current,
      (other) => !hit.has(other.id) && isSpellDuelTarget(world, entity)(other),
      world.unit * 10,
    )
  }
}

function lightBallBurst(
  entity: EcoEntity,
  world: EcoWorld,
  context: EcoControlAbilityContext,
  count: number,
  speed: number,
) {
  for (let index = 0; index < count; index += 1) {
    const ball = fireControlProjectile(entity, world, context, 'light-ball', speed, 1.25, 0)

    if (ball) {
      ball.vy += (index - (count - 1) / 2) * world.unit * 0.45
      ball.x -= entity.facing * index * world.unit * 0.12
    }
  }
}

function freezeNearby(entity: EcoEntity, world: EcoWorld, radius: number, amount: number) {
  for (const foe of world.within(entity.x, world.groundY, radius, (other) =>
    isTargetableFoe(entity, other),
  )) {
    foe.data.slowUntil = world.time + 3.2
    foe.fx = 'frozen'
    damageGroundTarget(foe, world, amount, entity, 1.1)
  }
}

function rootNearby(entity: EcoEntity, world: EcoWorld, x: number, radius: number, amount: number) {
  for (const foe of world.within(x, world.groundY, radius, (other) =>
    isTargetableFoe(entity, other),
  )) {
    foe.data.slowUntil = world.time + 3.8
    foe.fx = 'rooted'
    damageGroundTarget(foe, world, amount, entity, 0.8)
  }
}

function healAllies(entity: EcoEntity, world: EcoWorld, radius: number, amount: number) {
  for (const ally of alliedTargets(entity, world, radius)) {
    world.heal(ally, amount)
    ally.data.burn = 0
    ally.data.shieldUntil = Math.max(ally.data.shieldUntil ?? 0, world.time + 1.8)
    spawnImpact(world, ally.x, bodyPoint(ally, world).y, 2.2, 'heal', 0.48)
  }
}

function arcanePrison(entity: EcoEntity, world: EcoWorld, x: number) {
  for (let index = -1; index <= 1; index += 1) {
    world.spawn('ice-wall', {
      data: { life: 3.4 },
      size: 2.1,
      x: clamp(x + index * world.unit * 1.6, world.unit, world.width - world.unit),
      y: world.groundY,
    })
  }
  world.spawn('vine-snare', { data: { life: 2.6 }, size: 4.2, x, y: world.groundY })
  rootNearby(entity, world, x, world.unit * 4.6, 0.62)
  spawnImpact(world, x, world.groundY - world.unit * 2.4, 3.8, 'shield', 0.7)
}

const knightControls = {
  abilities: [
    siegeAbility({
      active: 0.22,
      amount: 0.62,
      archetype: 'Basic 3-hit sword combo',
      cooldown: 0,
      description: 'Fast sword-and-shield jab; every third hit bites harder.',
      icon: 'shield',
      key: 'q',
      name: 'Shield bash',
      radius: 4.2,
      shape: 'cone',
      state: 'strike',
      target: 'front',
      vfx: 'slash',
      width: 3.6,
      onHit(entity, target, world) {
        spawnImpact(world, target.x, bodyPoint(target, world).y, 1.8, 'slash', 0.32)
        target.vx += entity.facing * world.unit * 2.2
      },
    }),
    siegeAbility({
      active: 0.95,
      amount: 0.55,
      cooldown: 0,
      description: 'Hold to charge, then rush with a lance.',
      charge: { max: 1.4, min: 0.25 },
      dash: 7.5,
      icon: 'lance',
      key: 'w',
      name: 'Lance charge',
      radius: 7.5,
      shape: 'line',
      state: 'charge',
      target: 'front',
      vfx: 'charge',
      width: 2.8,
      asset: (entity) => ((entity.data.mounted ?? 0) > 0 ? mountedKnightChargeAsset : knightAsset),
    }),
    siegeAbility({
      buff: { block: 0.18, icon: '🛡', name: 'Parry', seconds: 1.7 },
      cooldown: 0,
      description: 'Raise the shield to parry melee and spells.',
      icon: 'parry',
      key: 'e',
      name: 'Parry stance',
      radius: 3,
      shape: 'self',
      state: 'parry',
      vfx: 'buff',
      onRun(entity, world) {
        entity.data.block = 0.8
        spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.55, 2.2, 'shield', 0.42)
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Plant a rally banner that shields nearby allies.',
      icon: 'banner',
      key: 'r',
      name: 'Rally banner',
      radius: 7,
      shape: 'circle',
      state: 'rally',
      ultimate: true,
      vfx: 'buff',
      onRun(entity, world) {
        world.spawn('rally-banner', {
          data: { life: 5.2, ownerId: entity.id, ownerTeam: teamOf(entity) },
          x: clamp(
            entity.x + entity.facing * world.unit * 1.8,
            world.unit,
            world.width - world.unit,
          ),
          y: world.groundY,
        })
      },
    }),
  ],
  idleState: 'march',
  move: 'ground',
  moveState: 'march',
  speed: 11,
} as const

const archerControls = {
  abilities: [
    siegeAbility({
      active: 0.2,
      archetype: 'Basic 3-shot volley',
      cooldown: 0,
      description: 'Loose a quick combo arrow downrange.',
      icon: 'arrow',
      key: 'q',
      name: 'Quick shot',
      radius: 15,
      shape: 'line',
      state: 'aim',
      width: 2,
      onRun(entity, world, context) {
        const originX = entity.x + entity.facing * world.unit * 0.6
        const originY = entity.y - world.heightOf(entity) * 0.72
        const point = controlCastPoint(entity, world, context)
        const seconds = clamp(
          Math.hypot(point.x - originX, point.y - originY) / (world.unit * 15),
          0.35,
          1.25,
        )
        const launch = ballistic(
          originX,
          originY,
          point.x,
          point.y,
          seconds,
          arrowGravity * world.unit,
        )
        world.spawn('arrow', {
          ...launch,
          data: { ownerId: entity.id, ownerTeam: teamOf(entity) },
          x: originX,
          y: originY,
        })
      },
    }),
    siegeAbility({
      amount: 0.95,
      charge: { max: 1.5, min: 0.35 },
      cooldown: 0,
      description: 'Hold to charge a piercing power shot.',
      icon: 'power-shot',
      key: 'w',
      name: 'Power shot',
      radius: 18,
      shape: 'line',
      state: 'aim',
      target: 'front',
      vfx: 'charge',
      width: 2.4,
      windup: 0.38,
      onHit(_entity, target, world) {
        spawnImpact(world, target.x, bodyPoint(target, world).y, 2, 'slash', 0.36)
      },
    }),
    siegeAbility({
      active: 0.46,
      buff: { icon: '↷', name: 'Dodge roll', seconds: 1.2, speed: 1.75 },
      cooldown: 0,
      dash: -3.4,
      description: 'Roll away and drop a snaring net.',
      icon: 'net',
      key: 'e',
      name: 'Trap roll',
      radius: 4,
      shape: 'self',
      state: 'roll',
      vfx: 'buff',
      onRun(entity, world) {
        world.spawn('vine-snare', {
          data: { life: 1.6, ownerId: entity.id, ownerTeam: teamOf(entity) },
          size: 2.6,
          x: clamp(
            entity.x + entity.facing * world.unit * 2.4,
            world.unit,
            world.width - world.unit,
          ),
          y: world.groundY,
        })
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Call a rain of arrows over an area.',
      icon: 'volley',
      key: 'r',
      name: 'Arrow volley',
      radius: 13,
      shape: 'ellipse',
      state: 'aim',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        const point = controlCastPoint(entity, world, context)
        world.spawn('arrow-volley', {
          data: { life: 1, ownerId: entity.id, ownerTeam: teamOf(entity) },
          size: 4.5,
          x: point.x,
          y: world.groundY - world.unit * 2.3,
        })
      },
    }),
  ],
  idleState: 'patrol',
  move: 'ground',
  moveState: 'patrol',
  speed: 12,
} as const

const emberDragonControls = {
  abilities: [
    siegeAbility({
      active: 1.25,
      cooldown: 0,
      description: 'Swoop low, snatch a unit in the talons, carry it up and drop it.',
      icon: 'talon',
      key: 'q',
      name: 'Talon snatch',
      radius: 9,
      shape: 'line',
      state: 'talon-snatch',
      vfx: 'shockwave',
      width: 3,
      windup: 0.22,
      onRun(entity, world, context) {
        startDragonMove(
          entity,
          world,
          'talon-snatch',
          dragonControlledTarget(entity, world, context),
        )
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 5.2,
      charge: { max: 1.45, min: 0.25 },
      cooldown: 0,
      description:
        'Swoop from the sky, hover in front of the target, breathe fire, then climb and recharge.',
      icon: 'flame',
      key: 'w',
      name: 'Swoop breath',
      radius: 13,
      recovery: 0.1,
      shape: 'line',
      state: 'flame-strafe',
      vfx: 'shockwave',
      width: 4.8,
      windup: 0.35,
      onRun(entity, world, context) {
        const point = controlCastPoint(entity, world, context)
        const charge = controlCharge(entity)
        const target =
          frontTarget(entity, world, world.unit * 18, 8) ??
          world.nearest(entity, (other) => isTargetableFoe(entity, other), world.unit * 18)
        startDragonFlameStrafe(entity, world, target)
        entity.data.flameTargetX = point.x
        entity.data.flameTargetY = point.y
        entity.data.flameDuration = 1.25 + charge * 1.25
        entity.data.flameSize = 5.8 + charge * 2.1
      },
      onTick(entity, world, _context, dt) {
        tickDragonFlameStrafe(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 0.9,
      cooldown: 0,
      description: 'Wing-brake upward and pop enemies with a hot chimney updraft.',
      icon: 'chimney',
      key: 'e',
      name: 'Chimney stall',
      radius: 6.5,
      shape: 'ellipse',
      state: 'chimney',
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'chimney', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 2.25,
      cooldown: 0,
      description: 'Corkscrew around the lane, painting a spiral burn zone.',
      icon: 'spiral',
      key: 'r',
      name: 'Kiln spiral',
      radius: 13,
      shape: 'circle',
      state: 'kiln-spiral',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(
          entity,
          world,
          'kiln-spiral',
          dragonControlledTarget(entity, world, context),
        )
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
  ],
  idleState: 'patrol',
  move: 'fly',
  moveState: 'patrol',
  speed: 20,
} as const

const emeraldDragonControls = {
  abilities: [
    siegeAbility({
      active: 0.8,
      cooldown: 0,
      description: 'Double-stomp a cone of root bumps that trips enemies.',
      icon: 'root',
      key: 'q',
      name: 'Rootstep tremor',
      radius: 8,
      shape: 'cone',
      state: 'rootstep',
      vfx: 'shockwave',
      width: 5,
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'rootstep', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 1.25,
      charge: { max: 1.5, min: 0.25 },
      cooldown: 0,
      description: 'Crouch under a wing canopy, then fling open a dragging vine patch.',
      icon: 'canopy',
      key: 'w',
      name: 'Canopy germination',
      radius: 9,
      shape: 'circle',
      state: 'canopy',
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'canopy', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 1,
      cooldown: 0,
      description: 'Bulldoze horn-first and leave a hedge ridge.',
      icon: 'antler',
      key: 'e',
      name: 'Antler plow',
      radius: 9,
      shape: 'line',
      state: 'antler-plow',
      vfx: 'charge',
      width: 4,
      onRun(entity, world, context) {
        startDragonMove(
          entity,
          world,
          'antler-plow',
          dragonControlledTarget(entity, world, context),
        )
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 1.5,
      cooldown: 0,
      description: 'Raise three giant trunks under enemy clusters.',
      icon: 'orchard',
      key: 'r',
      name: 'Orchard uprising',
      radius: 14,
      shape: 'ellipse',
      state: 'orchard',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'orchard', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
  ],
  idleState: 'patrol',
  move: 'fly',
  moveState: 'patrol',
  speed: 17,
} as const

const frostDragonControls = {
  abilities: [
    siegeAbility({
      active: 1.05,
      cooldown: 0,
      dash: 8,
      description: 'Belly-skid across the ground, dragging enemies over slick ice.',
      icon: 'skid',
      key: 'q',
      name: 'Belly-ice skid',
      radius: 9,
      shape: 'line',
      state: 'ice-skid',
      vfx: 'charge',
      width: 4,
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'ice-skid', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 1.15,
      charge: { max: 1.45, min: 0.25 },
      cooldown: 0,
      description: 'Wrap in fog, then burst out in the aimed direction.',
      icon: 'whiteout',
      key: 'w',
      name: 'Whiteout mantle',
      radius: 10,
      shape: 'line',
      state: 'whiteout',
      vfx: 'buff',
      width: 5,
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'whiteout', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 0.95,
      cooldown: 0,
      description: 'Drop low and pin enemies under a freezing wing.',
      icon: 'pinion',
      key: 'e',
      name: 'Wing-pinion clamp',
      radius: 10,
      shape: 'ellipse',
      state: 'wing-pinion',
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(
          entity,
          world,
          'wing-pinion',
          dragonControlledTarget(entity, world, context),
        )
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 2.1,
      cooldown: 0,
      description: 'Orbit a lane inside a frost ring that collapses inward.',
      icon: 'snowglobe',
      key: 'r',
      name: 'Snowglobe siege',
      radius: 13,
      shape: 'circle',
      state: 'snowglobe',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'snowglobe', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
  ],
  idleState: 'patrol',
  move: 'fly',
  moveState: 'patrol',
  speed: 17,
} as const

const easternDragonControls = {
  abilities: [
    siegeAbility({
      active: 0.95,
      cooldown: 0,
      description: 'Snap long whiskers in a wet lash that clips clustered foes.',
      icon: 'whisker',
      key: 'q',
      name: 'Whisker lash',
      radius: 8,
      shape: 'line',
      state: 'whisker-lash',
      vfx: 'water',
      width: 3.2,
      onRun(entity, world, context) {
        startDragonMove(
          entity,
          world,
          'whisker-lash',
          dragonControlledTarget(entity, world, context),
        )
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 1.45,
      charge: { max: 1.5, min: 0.25 },
      cooldown: 0,
      description: 'Orbit the target, then tighten a crushing coil.',
      icon: 'coil',
      key: 'w',
      name: 'Pagoda coil',
      radius: 10,
      shape: 'circle',
      state: 'pagoda-coil',
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(
          entity,
          world,
          'pagoda-coil',
          dragonControlledTarget(entity, world, context),
        )
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 1.15,
      cooldown: 0,
      description: 'Ride a cloud down a stair-step S path, leaving conductive rain puddles.',
      icon: 'cloud',
      key: 'e',
      name: 'Cloud step cascade',
      radius: 10,
      shape: 'line',
      state: 'cloud-step',
      vfx: 'water',
      width: 5,
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'cloud-step', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
    siegeAbility({
      active: 2.3,
      cooldown: 0,
      description: 'Form a rain-court circle with lightning pulses travelling down the body.',
      icon: 'deluge',
      key: 'r',
      name: 'Dragon court deluge',
      radius: 14,
      shape: 'circle',
      state: 'deluge',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        startDragonMove(entity, world, 'deluge', dragonControlledTarget(entity, world, context))
      },
      onTick(entity, world, _context, dt) {
        tickDragonMove(entity, world, dt)
      },
    }),
  ],
  idleState: 'patrol',
  move: 'fly',
  moveState: 'patrol',
  speed: 22,
} as const

const dragonControls = emberDragonControls

const wardWizardControls = {
  abilities: [
    siegeAbility({
      active: 0.22,
      amount: 0.58,
      archetype: 'Basic staff thrust combo',
      cooldown: 0,
      description: 'Thrust the staff in a close arcane poke.',
      icon: 'staff',
      key: 'q',
      name: 'Staff thrust',
      radius: 3.8,
      shape: 'cone',
      state: 'arcane',
      target: 'front',
      vfx: 'slash',
      width: 2.8,
      onHit(entity, target, world) {
        spawnBeam(
          world,
          'duel-beam-good',
          staffPoint(entity, world),
          bodyPoint(target, world),
          0.12,
        )
      },
    }),
    siegeAbility({
      charge: { max: 1.35, min: 0.2 },
      cooldown: 0,
      description: 'Hold a mirror shield that throws projectiles back.',
      icon: 'mirror',
      key: 'w',
      name: 'Mirror shield',
      radius: 7,
      shape: 'self',
      state: 'ward',
      vfx: 'buff',
      onRun(entity, world) {
        const charge = controlCharge(entity)
        entity.data.shieldUntil = Math.max(
          entity.data.shieldUntil ?? 0,
          world.time + 1.2 + charge * 1.8,
        )
        reflectProjectiles(entity, world, 4.5 + charge * 4)
        spawnImpact(
          world,
          entity.x,
          entity.y - world.heightOf(entity) * 0.52,
          3.2 + charge,
          'shield',
          0.72,
        )
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Place a reflecting bubble on a nearby ally.',
      icon: 'bubble',
      key: 'e',
      name: 'Ally bubble',
      radius: 9,
      shape: 'circle',
      state: 'shield',
      vfx: 'buff',
      onRun(entity, world, context) {
        const point = controlCastPoint(entity, world, context)
        const ally =
          world.nearest(point, (other) => sameTeam(entity, other), world.unit * 9) ?? entity
        ally.data.shieldUntil = Math.max(ally.data.shieldUntil ?? 0, world.time + 3.2)
        spawnCast(world, ally.x, bodyPoint(ally, world).y, 3.1, 'shield', 0.82)
        reflectProjectiles(ally, world, 5.2)
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Trap foes inside an arcane prison.',
      icon: 'prison',
      key: 'r',
      name: 'Arcane prison',
      radius: 13,
      shape: 'ellipse',
      state: 'ward',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        arcanePrison(entity, world, controlCastPoint(entity, world, context).x)
      },
    }),
  ],
  idleState: 'wander',
  move: 'ground',
  moveState: 'wander',
  speed: 11,
} as const

const pyroWizardControls = {
  abilities: [
    siegeAbility({
      active: 0.2,
      amount: 0.52,
      archetype: 'Basic fire-palm combo',
      cooldown: 0,
      description: 'Pop enemies with a close fire-palm jab.',
      icon: 'palm',
      key: 'q',
      name: 'Fire-palm jab',
      radius: 4.2,
      shape: 'cone',
      state: 'fireball',
      target: 'front',
      vfx: 'slash',
      width: 3,
      onHit(_entity, target, world) {
        target.data.burn = Math.max(target.data.burn ?? 0, 0.01)
        spawnImpact(world, target.x, bodyPoint(target, world).y, 2.1, 'fire', 0.36)
      },
    }),
    siegeAbility({
      amount: 0.72,
      charge: { max: 1.45, min: 0.25 },
      cooldown: 0,
      description: 'Charge a heavier fireball before release.',
      icon: 'fireball',
      key: 'w',
      name: 'Charged fireball',
      radius: 16,
      shape: 'line',
      state: 'fireball',
      target: 'front',
      vfx: 'charge',
      width: 3.4,
      onRun(entity, world, context) {
        const charge = controlCharge(entity)
        fireControlProjectile(
          entity,
          world,
          context,
          'wizard-fireball',
          9 + charge * 4,
          1.8 + charge * 1.2,
          fireballGravity,
        )
      },
    }),
    siegeAbility({
      active: 0.72,
      cooldown: 0,
      dash: 5.4,
      description: 'Dash forward and leave a line of fire.',
      icon: 'dash',
      key: 'e',
      name: 'Flame dash',
      radius: 5.4,
      shape: 'line',
      state: 'blink',
      vfx: 'buff',
      width: 3,
      onRun(entity, world, context) {
        for (let index = 0; index < 4; index += 1) {
          const x = context.cast.startX + (context.cast.endX - context.cast.startX) * (index / 3)
          spawnImpact(world, x, world.groundY - world.unit * 1.1, 2.2, 'fire', 0.45)
          world.spawn('fire', { x })
        }
        for (const foe of lineTargets(entity, world, world.unit * 6, world.unit * 3.2)) {
          foe.data.burn = Math.max(foe.data.burn ?? 0, 0.01)
          damageGroundTarget(foe, world, 0.44, entity, 1.8)
        }
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Call meteors onto the target area.',
      icon: 'meteor',
      key: 'r',
      name: 'Meteor storm',
      radius: 16,
      shape: 'ellipse',
      state: 'meteor',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        entity.targetId = frontTarget(entity, world, world.unit * 18, 10)?.id ?? null
        entity.data.controlMeteorX = controlCastPoint(entity, world, context).x
        releaseWizardSpell(Object.assign(entity, { state: 'meteor' }), world)
      },
    }),
  ],
  idleState: 'wander',
  move: 'ground',
  moveState: 'wander',
  speed: 11,
} as const

const frostWizardControls = {
  abilities: [
    siegeAbility({
      cooldown: 0,
      description: 'Flick a quick shard of ice.',
      icon: 'ice',
      key: 'q',
      name: 'Ice shard',
      radius: 14,
      shape: 'line',
      state: 'ice-shard',
      vfx: 'charge',
      width: 2,
      onRun(entity, world, context) {
        fireControlProjectile(entity, world, context, 'ice-shard', 15, 1.55, 1.1)
      },
    }),
    siegeAbility({
      amount: 0.9,
      charge: { max: 1.55, min: 0.3 },
      cooldown: 0,
      description: 'Charge a long freezing lance.',
      icon: 'lance',
      key: 'w',
      name: 'Ice lance',
      radius: 17,
      shape: 'line',
      state: 'frost',
      target: 'front',
      vfx: 'charge',
      width: 2.5,
      onRun(entity, world, context) {
        const charge = controlCharge(entity)
        fireControlProjectile(
          entity,
          world,
          context,
          'ice-shard',
          15 + charge * 5,
          1.7 + charge * 1.1,
          0.8,
        )
      },
      onHit(_entity, target, world) {
        target.data.slowUntil = world.time + 3
        target.fx = 'frozen'
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Pulse a freezing ring around you.',
      icon: 'ring',
      key: 'e',
      name: 'Freeze ring',
      radius: 6,
      shape: 'circle',
      state: 'frost',
      vfx: 'shockwave',
      onRun(entity, world) {
        world.spawn('frost-nova', {
          data: { ownerId: entity.id, ownerTeam: teamOf(entity) },
          size: 4.5,
          x: entity.x,
          y: world.groundY - world.unit * 1.6,
        })
        freezeNearby(entity, world, world.unit * 6, 0.36)
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Blanket the lane in a blizzard.',
      icon: 'blizzard',
      key: 'r',
      name: 'Blizzard',
      radius: 14,
      shape: 'ellipse',
      state: 'frost',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        const point = controlCastPoint(entity, world, context)
        for (let index = 0; index < 7; index += 1) {
          const x = clamp(
            point.x + between(-5, 5) * world.unit,
            world.unit,
            world.width - world.unit,
          )
          world.spawn('frost-nova', {
            data: { ownerId: entity.id, ownerTeam: teamOf(entity) },
            size: between(2.4, 4.2),
            x,
            y: world.groundY - world.unit * between(1.2, 3.2),
          })
        }
        freezeNearby(entity, world, world.unit * 13, 0.68)
      },
    }),
  ],
  idleState: 'wander',
  move: 'ground',
  moveState: 'wander',
  speed: 11,
} as const

const plantWizardControls = {
  abilities: [
    siegeAbility({
      active: 0.24,
      amount: 0.56,
      archetype: 'Basic thorn whip combo',
      cooldown: 0,
      description: 'Snap a thorny vine at close range.',
      icon: 'thorn',
      key: 'q',
      name: 'Thorn whip',
      radius: 4.8,
      shape: 'cone',
      state: 'vine',
      target: 'front',
      vfx: 'slash',
      width: 2.8,
      onHit(_entity, target, world) {
        spawnImpact(world, target.x, bodyPoint(target, world).y, 1.9, 'vine', 0.36)
      },
    }),
    siegeAbility({
      charge: { max: 1.45, min: 0.25 },
      cooldown: 0,
      description: 'Grow frenzied flytraps at the target point.',
      icon: 'plant',
      key: 'w',
      name: 'Flytrap frenzy',
      radius: 13,
      shape: 'ellipse',
      state: 'plant',
      vfx: 'charge',
      onRun(entity, world, context) {
        const charge = controlCharge(entity)
        spawnPlants(
          entity,
          world,
          controlCastPoint(entity, world, context).x,
          3 + Math.round(charge * 3),
        )
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Snare foes in roots.',
      icon: 'root',
      key: 'e',
      name: 'Root snare',
      radius: 9,
      shape: 'ellipse',
      state: 'vine',
      vfx: 'buff',
      onRun(entity, world, context) {
        const x = controlCastPoint(entity, world, context).x
        world.spawn('vine-snare', {
          data: { life: 2.4, ownerId: entity.id, ownerTeam: teamOf(entity) },
          size: 3.6,
          x,
          y: world.groundY,
        })
        rootNearby(entity, world, x, world.unit * 4.2, 0.42)
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Raise an overgrowth grove of plants and roots.',
      icon: 'grove',
      key: 'r',
      name: 'Overgrowth grove',
      radius: 14,
      shape: 'ellipse',
      state: 'plant',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        const x = controlCastPoint(entity, world, context).x
        spawnPlants(entity, world, x, 7)
        for (let index = -2; index <= 2; index += 1) {
          world.spawn('vine-snare', {
            data: { life: 3.2, ownerId: entity.id, ownerTeam: teamOf(entity) },
            size: 3.4,
            x: clamp(x + index * world.unit * 2.2, world.unit, world.width - world.unit),
            y: world.groundY,
          })
        }
        rootNearby(entity, world, x, world.unit * 8, 0.64)
      },
    }),
  ],
  idleState: 'wander',
  move: 'ground',
  moveState: 'wander',
  speed: 11,
} as const

const stormWizardControls = {
  abilities: [
    siegeAbility({
      active: 0.2,
      amount: 0.5,
      archetype: 'Basic static combo',
      cooldown: 0,
      description: 'Snap a fast static zap.',
      icon: 'zap',
      key: 'q',
      name: 'Static zap',
      radius: 8,
      shape: 'line',
      state: 'lightning',
      target: 'front',
      vfx: 'charge',
      width: 2.4,
      onHit(entity, target, world) {
        spawnBeam(
          world,
          'duel-beam-good',
          staffPoint(entity, world),
          bodyPoint(target, world),
          0.12,
        )
        spawnImpact(world, target.x, bodyPoint(target, world).y, 1.8, 'lightning', 0.3)
      },
    }),
    siegeAbility({
      charge: { max: 1.55, min: 0.3 },
      cooldown: 0,
      description: 'Charge chain lightning; more charge jumps farther.',
      icon: 'chain',
      key: 'w',
      name: 'Chain lightning',
      radius: 16,
      shape: 'line',
      state: 'lightning',
      vfx: 'charge',
      width: 4,
      onRun(entity, world) {
        const charge = controlCharge(entity)
        const first =
          frontTarget(entity, world, world.unit * 18, 8) ??
          world.nearest(entity, isSpellDuelTarget(world, entity), world.unit * 20)
        chainLightning(entity, world, first, 2 + Math.round(charge * 3), 0.72 + charge * 0.36)
      },
    }),
    siegeAbility({
      active: 0.64,
      buff: { icon: '⚡', name: 'Thunder blink', seconds: 1, speed: 1.35 },
      cooldown: 0,
      dash: -4.8,
      description: 'Blink away and thunderclap at both points.',
      icon: 'blink',
      key: 'e',
      name: 'Thunder blink',
      radius: 5,
      shape: 'self',
      state: 'blink',
      vfx: 'buff',
      onRun(entity, world, context) {
        for (const x of [context.cast.startX, context.cast.endX]) {
          spawnImpact(world, x, world.groundY - world.unit * 2, 2.7, 'lightning', 0.42)
          for (const foe of world.within(x, world.groundY, world.unit * 4.2, (other) =>
            isTargetableFoe(entity, other),
          )) {
            damageGroundTarget(foe, world, 0.34, entity, 1.8)
          }
        }
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Summon a storm cloud that repeatedly strikes enemies.',
      icon: 'storm',
      key: 'r',
      name: 'Storm cloud',
      radius: 15,
      shape: 'ellipse',
      state: 'storm',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        const point = controlCastPoint(entity, world, context)
        for (let index = 0; index < 7; index += 1) {
          const foe = world.nearest(
            { x: point.x + between(-5, 5) * world.unit, y: world.groundY },
            isSpellDuelTarget(world, entity),
            world.unit * 12,
          )
          const x =
            foe?.x ??
            clamp(point.x + between(-6, 6) * world.unit, world.unit, world.width - world.unit)
          world.spawn('lightning-strike', {
            size: between(5.4, 7.8),
            x,
            y: world.groundY - world.unit * 2.4,
          })
          spawnImpact(world, x, world.groundY - world.unit * 1.5, 2.6, 'lightning', 0.45)
          if (foe) damageGroundTarget(foe, world, 0.68, entity, 2.4)
        }
      },
    }),
  ],
  idleState: 'wander',
  move: 'ground',
  moveState: 'wander',
  speed: 11,
} as const

const lightWizardControls = {
  abilities: [
    siegeAbility({
      active: 0.2,
      amount: 0.48,
      archetype: 'Basic light jab combo',
      cooldown: 0,
      description: 'Jab with a compact flash of light.',
      icon: 'light',
      key: 'q',
      name: 'Light jab',
      radius: 5.2,
      shape: 'line',
      state: 'light',
      target: 'front',
      vfx: 'charge',
      width: 2.5,
      onHit(entity, target, world) {
        spawnBeam(
          world,
          'duel-beam-good',
          staffPoint(entity, world),
          bodyPoint(target, world),
          0.12,
        )
        spawnImpact(world, target.x, bodyPoint(target, world).y, 2, 'light', 0.32)
      },
    }),
    siegeAbility({
      charge: { max: 1.6, min: 0.35 },
      cooldown: 0,
      description: 'Charge piercing light balls; more charge adds more orbs.',
      icon: 'orbs',
      key: 'w',
      name: 'Piercing light balls',
      radius: 18,
      shape: 'line',
      state: 'light',
      vfx: 'charge',
      width: 4.8,
      onRun(entity, world, context) {
        const charge = controlCharge(entity)
        lightBallBurst(entity, world, context, 2 + Math.round(charge * 4), 17 + charge * 3)
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Heal and shield nearby allies with a radiant pulse.',
      icon: 'heal',
      key: 'e',
      name: 'Radiant heal pulse',
      radius: 7,
      shape: 'circle',
      state: 'heal',
      vfx: 'heal',
      onRun(entity, world) {
        healAllies(entity, world, world.unit * 7.5, 0.6)
        world.heal(entity, 0.35)
        spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.55, 3.4, 'heal', 0.62)
      },
    }),
    siegeAbility({
      cooldown: 0,
      description: 'Fire a long piercing solar beam.',
      icon: 'solar',
      key: 'r',
      name: 'Solar beam',
      radius: 20,
      shape: 'line',
      state: 'light',
      ultimate: true,
      vfx: 'shockwave',
      width: 4.4,
      onRun(entity, world) {
        const from = staffPoint(entity, world)
        const to = {
          x: clamp(
            entity.x + entity.facing * world.unit * 20,
            world.unit,
            world.width - world.unit,
          ),
          y: from.y,
        }
        spawnBeam(world, 'duel-beam-good', from, to, 0.36)
        for (const foe of lineTargets(entity, world, world.unit * 20, world.unit * 5)) {
          spawnImpact(world, foe.x, bodyPoint(foe, world).y, 2.8, 'light', 0.5)
          damageGroundTarget(foe, world, 1.05, entity, 3.2)
        }
      },
    }),
  ],
  idleState: 'wander',
  move: 'ground',
  moveState: 'wander',
  speed: 11,
} as const

const benderWizardControls = {
  abilities: [
    siegeAbility({
      active: 0.32,
      cooldown: 0,
      description: 'Stomp up a rock slab, then punch it forward on the next jab.',
      icon: 'earth',
      key: 'q',
      name: 'Earth lift',
      radius: 6,
      shape: 'line',
      state: 'earth',
      vfx: 'shockwave',
      width: 3.4,
      onRun(entity, world) {
        benderSlab(entity, world)
      },
    }),
    siegeAbility({
      active: 0.82,
      charge: { max: 1.45, min: 0.25 },
      cooldown: 0,
      description: 'Draw water into a long sweeping two-arm lash.',
      icon: 'water',
      key: 'w',
      name: 'Water whip',
      radius: 15,
      shape: 'line',
      state: 'water',
      vfx: 'water',
      width: 4,
      onRun(entity, world, context) {
        benderWaterWhip(
          entity,
          world,
          controlCastPoint(entity, world, context).x,
          controlCharge(entity),
        )
      },
    }),
    siegeAbility({
      active: 0.55,
      cooldown: 0,
      dash: 3.2,
      description: 'Spin a short crescent of flame from a roundhouse kick.',
      icon: 'fire-step',
      key: 'e',
      name: 'Fire step',
      radius: 6,
      shape: 'line',
      state: 'fire-step',
      vfx: 'charge',
      width: 3.2,
      onRun(entity, world) {
        benderFireStep(entity, world)
      },
    }),
    siegeAbility({
      active: 1.4,
      cooldown: 0,
      description: 'Spin upward on air, then land with a cycling elemental shockwave.',
      icon: 'spout',
      key: 'r',
      name: 'Air spout cycle',
      radius: 13,
      shape: 'circle',
      state: 'air-spout',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world, context) {
        benderAirSpout(entity, world, controlCastPoint(entity, world, context).x)
      },
    }),
  ],
  idleState: 'wander',
  move: 'ground',
  moveState: 'wander',
  speed: 11,
} as const

const wizardControls = wardWizardControls

dragon.controls = dragonControls

const emberDragon = {
  ...dragon,
  asset: ecoAsset('dragon-western-ember'),
  controls: emberDragonControls,
}
const emeraldDragon = {
  ...dragon,
  asset: ecoAsset('dragon-western-emerald'),
  controls: emeraldDragonControls,
}
const frostDragon = {
  ...dragon,
  asset: ecoAsset('dragon-western-frost'),
  controls: frostDragonControls,
}
const easternDragon = {
  ...dragon,
  asset: ecoAsset('dragon-eastern-jade'),
  controls: easternDragonControls,
}

const knight: EcoSpecies = {
  anchor: 'bottom',
  controls: knightControls,
  asset: knightAsset,
  hp: 2,
  idle: 'trot',
  init(entity, world) {
    if (Math.random() < 0.35) {
      entity.data.mounted = 1
      entity.hp = 3
      entity.size = between(7.1, 8.4)
      world.setAsset(entity, mountedKnightAsset)
    }

    entity.data.abilityCool =
      (entity.data.mounted ?? 0) > 0 ? between(0.15, 0.45) : between(0.8, 1.6)
  },
  layer: 'front',
  size: [3.85, 4.7],
  state: 'march',
  style: siegeTeamStyle,
  strongVs: ['archer', 'dark-lord', 'fireball'],
  tags: ['knight', 'target'],
  weakTo: ['dragon', 'wizard'],
  tick(entity, world, dt) {
    const unit = world.unit
    const mounted = (entity.data.mounted ?? 0) > 0
    const speedScale = mounted ? 1.75 : 1

    if (mounted && entity.asset !== mountedKnightChargeAsset && entity.state !== 'charge') {
      world.setAsset(entity, mountedKnightAsset)
    } else if (!mounted && entity.asset !== knightAsset) {
      world.setAsset(entity, knightAsset)
    }

    entity.data.cool = (entity.data.cool ?? 0) - dt
    entity.data.abilityCool = (entity.data.abilityCool ?? 0) - dt

    if ((entity.data.slowUntil ?? 0) > 0 && (entity.data.slowUntil ?? 0) < world.time) {
      entity.data.slowUntil = 0
      if (entity.fx === 'frozen') {
        entity.fx = ''
      }
    }

    if ((entity.data.block ?? 0) > 0) {
      entity.data.block = (entity.data.block ?? 0) - dt

      if ((entity.data.block ?? 0) <= 0 && entity.fx === 'hurt') {
        entity.fx = ''
      }
    }

    if (entity.hp <= 1 && dismountKnight(entity, world)) {
      return
    }

    if (entity.state === 'strike' || entity.state === 'leap') {
      const progress = Math.min(1, entity.t / 0.6)
      entity.lift = Math.sin(Math.PI * progress) * unit * (entity.state === 'leap' ? 2.4 : 1.8)
      entity.fx = entity.state === 'leap' ? 'leap' : 'slash'

      if (progress > 0.45 && !(entity.data.struck ?? 0)) {
        entity.data.struck = 1
        spawnImpact(
          world,
          entity.x + entity.facing * unit * 1.4,
          entity.y - entity.lift - world.heightOf(entity) * 0.56,
          2.4,
          'slash',
          0.36,
        )
        world.spawn('sword-arc', {
          facing: entity.facing,
          size: entity.state === 'leap' ? 3.2 : 2.6,
          x: entity.x + entity.facing * unit * 1.2,
          y: entity.y - entity.lift - world.heightOf(entity) * 0.58,
        })
        const foe = world.nearest(
          { x: entity.x, y: entity.y - entity.lift - world.heightOf(entity) },
          (other) => isSpellDuelTarget(world, entity)(other) && canKnightHitTarget(other, world),
          unit * 4.8,
        )

        if (foe) {
          damageGroundTarget(
            foe,
            world,
            foe.state === 'sleep' || entity.state === 'leap' ? 2 : 1,
            entity,
            2.2,
          )
        } else {
          const lord = world.nearest(
            { x: entity.x, y: entity.y - entity.lift - world.heightOf(entity) },
            (other) => isDarkLord(other) && isEnemy(entity, other),
            unit * 4.2,
          )

          if (lord) {
            hitDarkLord(lord, world, entity.state === 'leap' ? 1.4 : 1, entity.x, entity)
          }
        }
      }

      if (progress >= 1) {
        entity.lift = 0
        entity.fx = ''
        world.setState(entity, 'march')
      }
      return
    }

    if (entity.state === 'whirlwind') {
      settle(entity, dt)
      entity.fx = 'whirlwind'

      if (entity.t > 0.18 && !(entity.data.struck ?? 0)) {
        entity.data.struck = 1
        world.spawn('sword-arc', {
          facing: entity.facing,
          size: 3.7,
          x: entity.x,
          y: entity.y - world.heightOf(entity) * 0.52,
        })

        for (const foe of world.within(
          entity.x,
          entity.y - unit * 1.5,
          unit * 4.2,
          isSpellDuelTarget(world, entity),
        )) {
          if (foe !== entity) {
            damageGroundTarget(foe, world, 1, entity, 3)
          }
        }
      }

      if (entity.t > 0.72) {
        entity.fx = ''
        entity.data.struck = 0
        world.setState(entity, 'march')
      }
      return
    }

    if (entity.state === 'charge') {
      const foe = world.byId(entity.targetId)
      const direction = foe ? (foe.x >= entity.x ? 1 : -1) : entity.facing

      entity.facing = direction
      world.setAsset(entity, mountedKnightChargeAsset)
      entity.fx = 'charge'
      entity.x = clamp(entity.x + direction * unit * 5.7 * dt, unit, world.width - unit)
      entity.y = world.groundY + (entity.data.depth ?? 0)
      entity.lift = Math.abs(Math.sin(entity.t * 18)) * unit * 0.18

      if (chance(7, dt)) {
        spawnImpact(
          world,
          entity.x - direction * unit * 1.9,
          entity.y - unit * 0.35,
          1.4,
          'dust',
          0.36,
        )
      }

      if (foe && Math.abs(foe.x - entity.x) < unit * 2.1) {
        damageGroundTarget(foe, world, world.has(foe, 'wizard') ? 2 : 1.4, entity, 6)
        entity.data.cool = 2.6
        entity.data.abilityCool = 4
        entity.fx = ''
        entity.lift = 0
        world.setAsset(entity, mountedKnightAsset)
        world.setState(entity, 'march')
        return
      }

      if (entity.t > 2.35 || entity.x <= unit || entity.x >= world.width - unit) {
        entity.fx = ''
        entity.lift = 0
        world.setAsset(entity, mountedKnightAsset)
        world.setState(entity, 'march')
      }
      return
    }

    const incoming = incomingFireball(entity, world, 2.6)

    if (incoming) {
      entity.facing = incoming.x >= entity.x ? 1 : -1
      settle(entity, dt)
      entity.fx = (entity.data.block ?? 0) > 0 ? 'block' : 'guard'
      world.setState(entity, Math.random() < 0.28 ? 'parry' : 'guard')
      return
    }

    if (entity.state === 'guard' || entity.state === 'parry') {
      entity.fx = (entity.data.block ?? 0) > 0 ? 'block' : 'guard'

      if (entity.t > (entity.state === 'parry' ? 0.78 : 0.5)) {
        entity.fx = ''
        world.setState(entity, 'march')
      }
      return
    }

    if (entity.state === 'stomp') {
      const fire = world.byId(entity.targetId)

      if (!fire || !isFireOrBurning(world)(fire)) {
        entity.targetId = null
        settle(entity, dt)
        world.setState(entity, 'march')
        return
      }

      if (walkToward(entity, world, fire.x, unit * 1.7, dt) < unit * 0.8) {
        entity.data.stomp = (entity.data.stomp ?? 0) + dt
        entity.lift = Math.abs(Math.sin(entity.data.stomp * 12)) * unit * 0.4

        if ((entity.data.stomp ?? 0) > 1.1) {
          entity.data.stomp = 0
          entity.lift = 0

          if (world.has(fire, 'fire')) {
            world.kill(fire)
          } else {
            fire.data.burn = 0
          }

          entity.targetId = null
          world.setState(entity, 'march')
        }
      }
      return
    }

    if (entity.state === 'advance') {
      const foe = world.byId(entity.targetId)

      if (!foe || foe.state !== 'sleep') {
        entity.targetId = null
        world.setState(entity, 'march')
        return
      }

      if (walkToward(entity, world, foe.x, unit * 3.2, dt) < unit * 1.5) {
        entity.data.cool = 2.2
        entity.data.struck = 0
        entity.facing = foe.x >= entity.x ? 1 : -1
        world.setState(entity, 'strike')
      }
      return
    }

    const speedPenalty = (entity.data.slowUntil ?? 0) > world.time ? 0.45 : 1

    walk(entity, world, dt, unit * 0.9 * speedScale * speedPenalty)

    if (chance(0.06, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    const fire = world.nearest(entity, isFireOrBurning(world), unit * 14)

    if (fire) {
      entity.targetId = fire.id
      entity.data.stomp = 0
      world.setState(entity, 'stomp')
      return
    }

    const lord = world.nearest(entity, isDarkLord, unit * 5.8)

    if (lord && (entity.data.cool ?? 0) <= 0) {
      entity.data.cool = 2.4
      entity.data.struck = 0
      entity.facing = lord.x >= entity.x ? 1 : -1
      world.setState(entity, 'strike')
      return
    }

    if ((entity.data.abilityCool ?? 0) <= 0) {
      const closeFoes = world.within(
        entity.x,
        entity.y - unit * 1.5,
        unit * 4.2,
        (other) => isSpellDuelTarget(world, entity)(other) && canKnightHitTarget(other, world),
      )

      if (closeFoes.length >= 2) {
        entity.data.abilityCool = between(4.5, 6)
        entity.data.struck = 0
        world.setState(entity, 'whirlwind')
        return
      }

      const wizardFoe = world.nearest(
        entity,
        (other) => world.has(other, 'wizard') && isEnemy(entity, other),
        mounted ? Math.max(world.width, unit * 48) : unit * 12,
      )

      if (wizardFoe) {
        entity.targetId = wizardFoe.id
        entity.facing = wizardFoe.x >= entity.x ? 1 : -1
        entity.data.abilityCool = between(4.5, 6.5)
        entity.data.struck = 0
        world.setState(entity, mounted ? 'charge' : 'leap')
        return
      }
    }

    const sleepingDragon = world.nearest(
      entity,
      (other) => world.has(other, 'dragon') && other.state === 'sleep',
      Math.max(unit * 60, world.width),
    )

    if (sleepingDragon && (entity.data.cool ?? 0) <= 0) {
      entity.targetId = sleepingDragon.id
      world.setState(entity, 'advance')
      return
    }

    const lowDragon = world.nearest(
      entity,
      (other) =>
        world.has(other, 'dragon') &&
        dragonMeleeVulnerable(other) &&
        other.y > world.groundY - unit * 8 &&
        Math.abs(other.x - entity.x) < unit * 3.5,
    )

    if (lowDragon && (entity.data.cool ?? 0) <= 0) {
      entity.data.cool = 2.5
      entity.data.struck = 0
      entity.facing = lowDragon.x >= entity.x ? 1 : -1
      world.setState(entity, Math.random() < 0.4 ? 'leap' : 'strike')
    }
  },
}

const prince: EcoSpecies = {
  ...knight,
  asset: ecoAsset('prince'),
  countAs: 'frog-prince',
  size: [3.6, 4.5],
  strongVs: ['dark-lord'],
  tags: ['knight', 'prince', 'target'],
  weakTo: ['dragon', 'wizard'],
  tick(entity, world, dt) {
    if (entity.fx === 'sparkle' && entity.age > 1.4) {
      entity.fx = ''
    }

    knight.tick(entity, world, dt)
  },
}

const archer: EcoSpecies = {
  anchor: 'bottom',
  controls: archerControls,
  asset: ecoAsset('archer'),
  init(entity) {
    entity.data.cool = between(0.5, 1.5)
  },
  layer: 'front',
  size: [3.6, 4.35],
  state: 'patrol',
  style: siegeTeamStyle,
  strongVs: ['dragon', 'wizard'],
  tags: ['burnable', 'target'],
  weakTo: ['knight', 'dark-lord', 'fireball'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'aim') {
      const foe = world.byId(entity.targetId)

      if (!foe || foe.state === 'falling') {
        entity.fx = ''
        world.setState(entity, 'patrol')
        return
      }

      entity.facing = foe.x >= entity.x ? 1 : -1
      entity.fx = 'aim'

      if (entity.t > 1) {
        const speed = unit * 15
        const originX = entity.x + entity.facing * unit * 0.6
        const originY = entity.y - world.heightOf(entity) * 0.72
        const { aimX, aimY, seconds } = leadTarget(foe, originX, originY, speed)
        const launch = ballistic(originX, originY, aimX, aimY, seconds, arrowGravity * unit)

        world.spawn('arrow', {
          ...launch,
          data: { ownerId: entity.id, ownerTeam: teamOf(entity) },
          x: originX,
          y: originY,
        })
        entity.fx = ''
        entity.data.cool = between(2, 3.5)
        world.setState(entity, 'patrol')
      }
      return
    }

    walk(entity, world, dt, unit * 0.6)
    entity.data.cool = (entity.data.cool ?? 0) - dt

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 3)

    if (fire) {
      entity.facing = fire.x > entity.x ? -1 : 1
    }

    if ((entity.data.cool ?? 0) <= 0) {
      const foe = world.nearest(
        entity,
        (other) =>
          (isDarkLord(other) ||
            world.has(other, 'wizard') ||
            (world.has(other, 'dragon') && other.state !== 'falling')) &&
          isEnemy(entity, other),
        Math.max(unit * 45, world.height),
      )

      if (foe) {
        entity.targetId = foe.id
        world.setState(entity, 'aim')
      } else {
        entity.data.cool = 1
      }
    }
  },
}

const arrow: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('arrow'),
  countAs: null,
  layer: 'front',
  size: [2, 2.4],
  state: 'fly',
  strongVs: ['dragon', 'wizard'],
  tags: ['projectile'],
  weakTo: ['knight'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'stuck') {
      if (entity.t > 1.2) {
        world.remove(entity)
      }
      return
    }

    entity.vy += arrowGravity * unit * dt
    integrate(entity, dt)
    entity.facing = entity.vx >= 0 ? 1 : -1
    tiltToVelocity(entity, 90)

    const foe = world.nearest(
      entity,
      (other) =>
        (isDragonOrLord(world)(other) || world.has(other, 'wizard')) && isEnemy(entity, other),
      unit * 5,
    )

    if (foe && Math.hypot(foe.x - entity.x, foe.y - entity.y) < world.widthOf(foe) * 0.46) {
      damageGroundTarget(foe, world, 1, entity, 1.6)
      world.remove(entity)
      return
    }

    if (entity.x < -unit * 3 || entity.x > world.width + unit * 3 || entity.y < -unit * 6) {
      world.remove(entity)
    } else if (entity.y >= world.groundY) {
      entity.y = world.groundY
      world.setState(entity, 'stuck')
    }
  },
}

const bolt: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('bolt'),
  countAs: null,
  init(entity) {
    if ((entity.data.lightning ?? 0) > 0) {
      entity.fx = 'lightning'
      entity.size *= 0.9
    } else if ((entity.data.magic ?? 0) > 0) {
      entity.fx = 'magic'
      entity.size *= 0.82
    }
  },
  layer: 'front',
  size: [2.8, 3.5],
  state: 'fly',
  strongVs: ['dragon'],
  tags: ['projectile'],
  weakTo: ['wizard'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'stuck') {
      if (entity.t > 1.1) {
        world.remove(entity)
      }
      return
    }

    if ((entity.data.magic ?? 0) <= 0 && (entity.data.lightning ?? 0) <= 0) {
      entity.vy += boltGravity * unit * dt
    } else {
      entity.vy += Math.sin(world.time * 5 + entity.id) * unit * 0.15 * dt
    }

    integrate(entity, dt)
    entity.facing = entity.vx >= 0 ? 1 : -1
    tiltToVelocity(entity, 90)

    const foe = world.nearest(entity, isSpellDuelTarget(world, entity), unit * 5.6)

    if (foe && Math.hypot(foe.x - entity.x, foe.y - entity.y) < world.widthOf(foe) * 0.5) {
      hurtDragonOrLord(
        foe,
        world,
        1,
        foe.state === 'sleep' && (entity.data.magic ?? 0) <= 0,
        entity.x,
        entity,
      )

      if ((entity.data.knock ?? 0) > 0) {
        foe.vx += Math.sign(entity.vx || 1) * unit * 4.2
        foe.vy -= unit * 1.5
      }

      if ((entity.data.lightning ?? 0) > 0 && (entity.data.chain ?? 0) > 0) {
        const next = world.nearest(
          foe,
          (other) => other !== foe && isSpellDuelTarget(world, entity)(other),
          unit * 26,
        )

        if (next) {
          const speed = unit * 22
          const seconds = Math.max(0.18, Math.hypot(next.x - foe.x, next.y - foe.y) / speed)
          const launch = ballistic(foe.x, foe.y, next.x, next.y, seconds, 0)

          world.spawn('bolt', {
            ...launch,
            data: {
              chain: (entity.data.chain ?? 1) - 1,
              lightning: 1,
              magic: 1,
              ownerId: entity.data.ownerId ?? entity.id,
              ownerTeam: teamOf(entity),
            },
            size: 2.6,
            x: foe.x,
            y: foe.y,
          })
          spawnCast(world, foe.x, foe.y, 1.8, 'lightning', 0.45)
        }
      }

      world.remove(entity)
      return
    }

    if (entity.x < -unit * 4 || entity.x > world.width + unit * 4 || entity.y < -unit * 6) {
      world.remove(entity)
    } else if (entity.y >= world.groundY) {
      entity.y = world.groundY
      world.setState(entity, 'stuck')
    }
  },
}

const wizardFireball: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('wizard-fireball'),
  countAs: null,
  init(entity) {
    entity.fx = 'fireball'
  },
  layer: 'front',
  size: [1.9, 2.4],
  state: 'fly',
  strongVs: ['knight', 'building', 'burnable', 'dark-lord'],
  tags: ['projectile', 'fireball', 'fire'],
  weakTo: ['ice-wall', 'knight'],
  tick(entity, world, dt) {
    const unit = world.unit

    entity.vy += fireballGravity * unit * dt
    integrate(entity, dt)
    entity.facing = entity.vx >= 0 ? 1 : -1
    tiltToVelocity(entity, 80)

    const blocker = deflectableByKnight(entity, world)

    if (blocker && Math.random() < 0.45 * world.edge(blocker, entity)) {
      blocker.fx = 'block'
      blocker.data.block = 0.45
      entity.vx *= -0.55
      entity.vy -= unit * 3
      entity.facing = entity.vx >= 0 ? 1 : -1
      spawnImpact(world, entity.x, entity.y, 1.8, 'slash', 0.36)
      return
    }

    const foe = world.nearest(
      entity,
      (other) =>
        other.id !== (entity.data.ownerId ?? -1) && isSpellDuelTarget(world, entity)(other),
      unit * 2.4,
    )
    const hitGround = entity.y >= world.groundY - unit * 0.15

    if (!foe && !hitGround && entity.x > -unit * 4 && entity.x < world.width + unit * 4) {
      return
    }

    const x = foe?.x ?? entity.x
    const y = foe ? bodyPoint(foe, world).y : world.groundY - unit * 0.7

    spawnImpact(world, x, y, 3.2, 'fire', 0.58)

    for (const other of world.within(x, world.groundY, unit * 3.2, (target) => target !== entity)) {
      if (world.has(other, 'fuel') || world.has(other, 'burnable')) {
        other.data.burn = Math.max(other.data.burn ?? 0, 0.01)
      }

      if (other.id !== (entity.data.ownerId ?? -1) && isSpellDuelTarget(world, entity)(other)) {
        damageGroundTarget(other, world, other === foe ? 1.15 : 0.55, entity, 2)
      }
    }

    if (!world.nearest(entity, (other) => world.has(other, 'fire'), unit * 1.4)) {
      world.spawn('fire', { x })
    }

    world.remove(entity)
  },
}

const spellTornado: EcoSpecies = {
  anchor: 'bottom',
  asset: spellTornadoAsset,
  countAs: null,
  idle: 'sway',
  init(entity) {
    entity.data.life = between(2.3, 3.2)
  },
  layer: 'front',
  size: [3.4, 4.8],
  state: 'spin',
  strongVs: ['archer', 'knight', 'princess'],
  tags: ['projectile'],
  weakTo: ['wizard'],
  tick(entity, world, dt) {
    const unit = world.unit

    entity.data.life = (entity.data.life ?? 2) - dt
    entity.x += entity.vx * dt
    entity.y = world.groundY + (entity.data.depth ?? 0)
    entity.fx = entity.fx || 'air'
    const asset =
      entity.fx === 'fire-tornado'
        ? spellTornadoFireAsset
        : entity.fx === 'blizzard'
          ? spellTornadoFrostAsset
          : spellTornadoAsset
    if (entity.asset !== asset) {
      world.setAsset(entity, asset)
    }
    entity.scale =
      0.84 + Math.sin(world.time * 7 + entity.id) * 0.07 + Math.min(0.45, entity.t * 0.12)

    for (const foe of world.within(
      entity.x,
      world.groundY,
      unit * entity.size * 1.15,
      (other) =>
        isSpellDuelTarget(world, entity)(other) && other.id !== (entity.data.ownerId ?? -1),
    )) {
      const angle = world.time * 8 + foe.id
      const pull = Math.sign(entity.x - foe.x || entity.facing)
      foe.lift = Math.max(foe.lift, unit * (2.1 + Math.sin(entity.t * 3) * 1.2))
      foe.vx += (pull * unit * 2.6 + Math.cos(angle) * unit * 1.8) * dt
      foe.vy -= unit * 2.2 * dt
      foe.tilt += dt * 180 * pull
      damageGroundTarget(
        foe,
        world,
        entity.fx === 'fire-tornado' ? 0.56 : entity.fx === 'blizzard' ? 0.48 : 0.32,
        entity,
        1.8,
      )
    }

    if ((entity.data.life ?? 0) <= 0 || entity.x < -unit * 4 || entity.x > world.width + unit * 4) {
      spawnImpact(world, entity.x, world.groundY - unit * 1.8, 2.6, 'dust', 0.45)
      world.remove(entity)
    }
  },
}

const arcaneMissile: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('arcane-missile'),
  countAs: null,
  layer: 'front',
  size: [1.05, 1.45],
  state: 'seek',
  strongVs: ['dragon', 'dark-lord', 'knight'],
  tags: ['projectile'],
  weakTo: ['knight'],
  tick(entity, world, dt) {
    const unit = world.unit
    const blocker = deflectableByKnight(entity, world)

    if (blocker && Math.random() < 0.55 * world.edge(blocker, entity)) {
      blocker.fx = 'block'
      blocker.data.block = 0.45
      entity.targetId = null
      entity.vx *= -0.8
      entity.vy -= unit * 1.4
      spawnImpact(world, entity.x, entity.y, 1.5, 'slash', 0.32)
    }

    const target = world.byId(entity.data.targetId ?? entity.targetId)

    if (target && isSpellDuelTarget(world, entity)(target)) {
      const point = bodyPoint(target, world)
      steer(entity, point.x, point.y, unit * 12, dt, 5.5)
    } else {
      entity.vy += Math.sin(world.time * 4 + entity.id) * unit * 0.1 * dt
    }

    integrate(entity, dt)
    faceTravel(entity, 1)
    tiltToVelocity(entity, 50)

    const foe = world.nearest(
      entity,
      (other) =>
        other.id !== (entity.data.ownerId ?? -1) && isSpellDuelTarget(world, entity)(other),
      unit * 1.5,
    )

    if (foe) {
      spawnImpact(world, entity.x, entity.y, 1.7, 'arcane', 0.38)
      damageGroundTarget(foe, world, 0.42, entity, 1.1)
      world.remove(entity)
      return
    }

    if (entity.t > 2.2 || entity.x < -unit * 4 || entity.x > world.width + unit * 4) {
      world.remove(entity)
    }
  },
}

const iceShard: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('ice-shard'),
  countAs: null,
  layer: 'front',
  size: [1.5, 1.9],
  state: 'fly',
  strongVs: ['dragon', 'knight', 'fireball'],
  tags: ['projectile'],
  weakTo: ['dark-lord', 'fireball'],
  tick(entity, world, dt) {
    const unit = world.unit

    entity.vy += unit * 0.8 * dt
    entity.vy += Math.sin(world.time * 8 + entity.id) * unit * 0.12 * dt
    integrate(entity, dt)
    entity.facing = entity.vx >= 0 ? 1 : -1
    tiltToVelocity(entity, 65)

    const foe = world.nearest(
      entity,
      (other) =>
        other.id !== (entity.data.ownerId ?? -1) && isSpellDuelTarget(world, entity)(other),
      unit * 1.9,
    )

    if (foe) {
      spawnImpact(world, entity.x, entity.y, 2.2, 'frost', 0.48)

      if (world.has(foe, 'dragon')) {
        foe.data.freezeFor = between(1.8, 2.8)
        world.setState(foe, 'frozen')
      } else {
        foe.data.slowUntil = world.time + between(2.3, 3.4)
        foe.fx = 'frozen'
        damageGroundTarget(foe, world, 0.55, entity, 0.7)
      }

      world.remove(entity)
      return
    }

    if (
      entity.t > 2 ||
      entity.x < -unit * 4 ||
      entity.x > world.width + unit * 4 ||
      entity.y > world.groundY
    ) {
      world.remove(entity)
    }
  },
}

const lightningStrike: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('lightning-strike'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [4.2, 6.8],
  state: 'flash',
  strongVs: ['knight', 'dragon', 'dark-lord'],
  tags: ['projectile'],
  weakTo: ['archer'],
  tick(entity, world) {
    entity.scale = Math.max(0.25, 1 + Math.sin(entity.t * 42) * 0.06)

    if (entity.t > (entity.data.life ?? 0.28)) {
      world.remove(entity)
    }
  },
}

const flameStream: EcoSpecies = {
  anchor: 'center',
  asset: flameStreamAsset,
  countAs: null,
  idle: 'flicker',
  layer: 'front',
  size: [5.8, 7.2],
  state: 'burn',
  strongVs: ['knight', 'building', 'burnable', 'princess'],
  tags: ['projectile', 'fire'],
  weakTo: ['wizard'],
  tick(entity, world, dt) {
    const unit = world.unit
    const life = entity.data.life ?? 0.28
    const liveTarget = world.byId(entity.data.targetId)
    const originX = entity.data.originX ?? entity.x - entity.facing * unit * 2.8
    const originY = entity.data.originY ?? entity.y
    const targetX = liveTarget?.x ?? entity.data.targetX ?? entity.x + entity.facing * unit * 6
    const targetY = liveTarget
      ? liveTarget.y - liveTarget.lift - unit * 0.35
      : (entity.data.targetY ?? entity.y)
    const sweep = Math.sin((entity.t / life) * Math.PI * 2.2 + entity.id)
    const dx = targetX - originX
    const dy = targetY - originY
    const length = Math.max(unit * 4.8, Math.hypot(dx, dy))
    entity.x = originX + dx * 0.5
    entity.y = originY + dy * 0.5 + sweep * unit * 0.08
    entity.tilt = (Math.atan2(dy, dx) * 180) / Math.PI
    entity.facing = dx >= 0 ? 1 : -1
    entity.scale = 1.04 + Math.sin(world.time * 24 + entity.id) * 0.06
    entity.size = Math.max(entity.size, (length / unit) * 1.16)

    if (chance(18, dt)) {
      spawnImpact(
        world,
        targetX + between(-0.7, 0.7) * unit,
        world.groundY - unit * 0.35,
        between(1.4, 2.2),
        'fire',
        0.32,
      )
    }

    const slab = world.nearest(
      { x: (originX + targetX) * 0.5, y: world.groundY },
      (other) => other.species === 'earth-slab' && !sameTeam(entity, other),
      length * 0.58,
    )

    if (slab) {
      const along =
        ((slab.x - originX) * dx + (bodyPoint(slab, world).y - originY) * dy) / (length * length)
      const clamped = clamp(along, 0, 1)
      const lineX = originX + dx * clamped
      const lineY = originY + dy * clamped

      if (
        along >= 0 &&
        along <= 1 &&
        Math.hypot(slab.x - lineX, bodyPoint(slab, world).y - lineY) < unit * 3.2
      ) {
        slab.data.flash = 0.34
        spawnImpact(world, slab.x, bodyPoint(slab, world).y, 3.2, 'steam', 0.48)
        world.remove(entity)
        return
      }
    }

    for (const foe of world.within(
      (originX + targetX) * 0.5,
      world.groundY,
      length * 0.7,
      (other) => isTargetableFoe(entity, other),
    )) {
      const along =
        ((foe.x - originX) * dx + (bodyPoint(foe, world).y - originY) * dy) / (length * length)
      const clamped = clamp(along, 0, 1)
      const lineX = originX + dx * clamped
      const lineY = originY + dy * clamped
      const distance = Math.hypot(foe.x - lineX, bodyPoint(foe, world).y - lineY)

      if (along >= 0 && along <= 1 && distance < unit * (1.5 + clamped * 1.9)) {
        foe.fx = 'burn'
        foe.data.burn = Math.max(foe.data.burn ?? 0, 0.01)
        damageGroundTarget(foe, world, 0.08 * dt, entity, 0.5)
      }
    }

    if (entity.t > life) {
      world.remove(entity)
    }
  },
}

const earthSlab: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('spell-impact'),
  countAs: null,
  layer: 'front',
  size: [2.8, 3.8],
  state: 'wall',
  strongVs: ['projectile', 'archer', 'fireball'],
  tags: [],
  weakTo: ['lightning', 'water'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.fx = entity.state === 'slide' ? 'earth-slide' : 'earth'
    entity.data.life = (entity.data.life ?? 2.5) - dt

    if (entity.state === 'slide') {
      integrate(entity, dt)
      entity.y = world.groundY
      entity.tilt += entity.facing * dt * 280

      for (const foe of world.within(entity.x, world.groundY, unit * 2.8, (other) =>
        isTargetableFoe(entity, other),
      )) {
        damageGroundTarget(foe, world, 0.7, entity, 3.2)
      }
    }

    if ((entity.data.life ?? 0) <= 0 || entity.x < -unit * 2 || entity.x > world.width + unit * 2) {
      spawnImpact(world, entity.x, world.groundY - unit, 2.8, 'dust', 0.42)
      world.remove(entity)
    }
  },
}

const waterWhip: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('duel-beam-good'),
  countAs: null,
  layer: 'front',
  size: [5, 8],
  state: 'lash',
  strongVs: ['fire', 'dragon', 'knight'],
  tags: ['projectile'],
  weakTo: ['frost', 'lightning'],
  tick(entity, world, _dt) {
    const unit = world.unit
    const life = entity.data.life ?? 0.82
    const progress = clamp(entity.t / life, 0, 1)
    entity.fx = 'water'
    entity.scale = 0.8 + Math.sin(progress * Math.PI) * 0.34
    entity.tilt = entity.facing * (-18 + progress * 46)

    for (const flame of world.within(
      entity.x,
      world.groundY,
      unit * entity.size * 0.9,
      isFireOrBurning(world),
    )) {
      if (world.has(flame, 'fire')) {
        world.kill(flame)
      } else {
        flame.data.burn = 0
        flame.fx = 'soaked'
      }
      spawnImpact(world, flame.x, flame.y - unit * 1.1, 2.4, 'steam', 0.42)
    }

    if (
      world.nearest(
        entity,
        (other) =>
          other.fx === 'frost' || other.species === 'frost-nova' || other.species === 'ice-shard',
        unit * 2.2,
      )
    ) {
      entity.fx = 'frost'
    }

    for (const foe of world.within(entity.x, world.groundY, unit * entity.size * 0.62, (other) =>
      isTargetableFoe(entity, other),
    )) {
      foe.fx = entity.fx === 'frost' ? 'frozen' : 'soaked'
      damageGroundTarget(foe, world, entity.fx === 'frost' ? 0.44 : 0.36, entity, 1.6)
    }

    if (entity.t > life) {
      world.remove(entity)
    }
  },
}

const fireStepArc: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('fire-lance'),
  countAs: null,
  layer: 'front',
  size: [3, 4],
  state: 'kick',
  strongVs: ['plant', 'knight'],
  tags: ['projectile', 'fire'],
  weakTo: ['water', 'frost'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.fx = 'fire'
    integrate(entity, dt)
    entity.tilt = entity.facing * -18
    entity.scale = 0.75 + Math.sin(entity.t * 8) * 0.08

    for (const foe of world.within(entity.x, entity.y, unit * 2.2, (other) =>
      isTargetableFoe(entity, other),
    )) {
      foe.data.burn = Math.max(foe.data.burn ?? 0, 0.01)
      damageGroundTarget(foe, world, 0.42, entity, 1.8)
    }

    if (entity.t > (entity.data.life ?? 0.55)) {
      world.remove(entity)
    }
  },
}

const airSpout: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('spell-tornado'),
  countAs: null,
  layer: 'front',
  size: [4.5, 6.8],
  state: 'spout',
  strongVs: ['knight', 'archer', 'wizard'],
  tags: ['projectile'],
  weakTo: ['earth'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.fx = 'air'
    entity.data.life = (entity.data.life ?? 1.4) - dt
    entity.scale = 0.86 + Math.sin(entity.t * 8) * 0.06

    for (const foe of world.within(entity.x, world.groundY, unit * entity.size, (other) =>
      isTargetableFoe(entity, other),
    )) {
      const angle = entity.t * 7 + foe.id
      foe.lift = Math.max(foe.lift, unit * (1.5 + Math.sin(entity.t * Math.PI) * 2.8))
      foe.vx += Math.cos(angle) * unit * 2.1 * dt
      foe.vy -= unit * 1.4 * dt
      damageGroundTarget(foe, world, 0.2 * dt, entity, 1.1)
    }

    if ((entity.data.life ?? 0) <= 0) {
      for (const foe of world.within(entity.x, world.groundY, unit * entity.size * 0.9, (other) =>
        isTargetableFoe(entity, other),
      )) {
        damageGroundTarget(foe, world, 0.55, entity, 2.6)
      }
      spawnImpact(world, entity.x, world.groundY - unit * 1.4, 4, 'dust', 0.58)
      world.remove(entity)
    }
  },
}

const dragonShockwave: EcoSpecies = {
  anchor: 'center',
  asset: dragonShockwaveAsset,
  countAs: null,
  layer: 'front',
  size: [4.2, 6.2],
  state: 'burst',
  strongVs: ['knight', 'building', 'wizard'],
  tags: [],
  weakTo: ['archer', 'wizard'],
  tick(entity, world) {
    const unit = world.unit
    entity.scale = Math.max(0.25, 0.75 + entity.t * 1.1)

    if (!(entity.data.struck ?? 0)) {
      entity.data.struck = 1
      world.shake(0.45)

      for (const foe of world.within(entity.x, world.groundY, unit * 6.2, (other) =>
        isTargetableFoe(entity, other),
      )) {
        damageGroundTarget(foe, world, 0.9, entity, 5)
      }
    }

    if (entity.t > (entity.data.life ?? 0.72)) {
      world.remove(entity)
    }
  },
}

const dragonZone = (
  asset: string,
  fx: string,
  amount: number,
  knock: number,
  pull = 0,
): EcoSpecies => ({
  anchor: 'center',
  asset,
  countAs: null,
  layer: 'front',
  size: [2.6, 4.4],
  state: 'zone',
  strongVs: ['knight', 'wizard', 'building'],
  tags: fx === 'fire' ? ['fire'] : [],
  weakTo: fx === 'vine' ? ['fire'] : ['wizard'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.fx = fx
    entity.scale = 0.78 + Math.min(0.55, entity.t * 0.45)
    entity.data.life = (entity.data.life ?? 1.5) - dt

    for (const foe of world.within(entity.x, world.groundY, unit * entity.size * 1.2, (other) =>
      isTargetableFoe(entity, other),
    )) {
      if (pull !== 0) {
        foe.vx += Math.sign(entity.x - foe.x || entity.facing) * unit * pull * dt
      }

      if (fx === 'fire') {
        foe.fx = 'burn'
        foe.data.burn = Math.max(foe.data.burn ?? 0, 0.01)
      } else if (fx === 'frost' || fx === 'fog' || fx === 'rain' || fx === 'vine') {
        foe.data.slowUntil = Math.max(foe.data.slowUntil ?? 0, world.time + 0.8)
        foe.fx = fx === 'vine' ? 'rooted' : 'frozen'
      }

      if ((entity.data.hit ?? 0) <= 0 || entity.t < 0.18) {
        damageGroundTarget(foe, world, amount * dt, entity, knock)
      }
    }

    if (entity.t > 0.22) {
      entity.data.hit = 1
    }

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
})

const dragonBurnZone = dragonZone(ecoAsset('spell-impact'), 'fire', 0.36, 1.4)
const dragonUpdraft = dragonZone(dragonShockwaveAsset, 'fire', 0.62, 5.8)
const dragonRootBump = dragonZone(siegePlantAsset, 'vine', 0.5, 2.8, 0.4)
const dragonVinePatch = dragonZone(ecoAsset('vine-snare'), 'vine', 0.42, 1.2, 4.2)
const dragonHedgeRidge = dragonZone(siegePlantAsset, 'vine', 0.34, 3.4, 0.8)
const dragonTrunk = dragonZone(siegePlantAsset, 'vine', 0.9, 6.4)
const dragonIceSlick = dragonZone(ecoAsset('frost-nova'), 'frost', 0.34, 1.2, 0.5)
const dragonFogBank = dragonZone(ecoAsset('frost-nova'), 'fog', 0.18, 0.5, 1)
const dragonIcePop = dragonZone(ecoAsset('ice-wall'), 'frost', 0.76, 5.2)
const dragonRainPuddle = dragonZone(ecoAsset('spell-impact'), 'rain', 0.24, 0.8, 0.6)
const dragonStormPulse = dragonZone(ecoAsset('lightning-strike'), 'lightning', 0.64, 2.2)

const lightBall: EcoSpecies = {
  anchor: 'center',
  asset: lightBallAsset,
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [1.15, 1.55],
  state: 'fly',
  strongVs: ['dark-lord', 'dragon', 'wizard'],
  tags: ['projectile'],
  weakTo: ['ward', 'knight'],
  tick(entity, world, dt) {
    const unit = world.unit

    integrate(entity, dt)
    faceTravel(entity, 1)
    tiltToVelocity(entity, 12)

    for (const foe of world.within(entity.x, entity.y, unit * 1.8, (other) =>
      isSpellDuelTarget(world, entity)(other),
    )) {
      const key = `hit-${foe.id}`

      if ((entity.data[key] ?? 0) > 0) {
        continue
      }

      entity.data[key] = 1
      spawnImpact(world, entity.x, entity.y, 1.8, 'light', 0.36)
      damageGroundTarget(foe, world, 0.62, entity, 1.5)
    }

    if (entity.t > 1.45 || entity.x < -unit * 4 || entity.x > world.width + unit * 4) {
      world.remove(entity)
    }
  },
}

const carnivorousPlant: EcoSpecies = {
  anchor: 'bottom',
  asset: siegePlantAsset,
  countAs: null,
  idle: 'sway',
  layer: 'front',
  size: [2.2, 3],
  state: 'snap',
  style: siegeTeamStyle,
  strongVs: ['knight', 'archer', 'wizard'],
  tags: ['plant'],
  weakTo: ['fire', 'dragon'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.data.life = (entity.data.life ?? 5.5) - dt
    entity.scale =
      Math.min(1, 0.45 + entity.t * 2) * (0.96 + Math.sin(world.time * 9 + entity.id) * 0.05)
    entity.fx = 'snap'

    if ((entity.data.biteCool ?? 0) > 0) {
      entity.data.biteCool = (entity.data.biteCool ?? 0) - dt
    }

    const foe = world.nearest(
      entity,
      (other) => isTargetableFoe(entity, other) && onGround(other, world),
      unit * 3.6,
    )

    if (foe && (entity.data.biteCool ?? 0) <= 0) {
      entity.data.biteCool = 0.46
      entity.facing = foe.x >= entity.x ? 1 : -1
      damageGroundTarget(foe, world, 0.58, entity, 1.6)
      spawnImpact(world, foe.x, bodyPoint(foe, world).y, 1.7, 'vine', 0.32)
    }

    if ((entity.data.life ?? 0) <= 0) {
      spawnImpact(world, entity.x, entity.y - unit * 1.2, 1.7, 'vine', 0.36)
      world.remove(entity)
    }
  },
}

const arrowVolley: EcoSpecies = {
  anchor: 'center',
  asset: arrowVolleyAsset,
  countAs: null,
  layer: 'front',
  size: [2.8, 3.8],
  state: 'rain',
  strongVs: ['dragon', 'wizard'],
  tags: ['projectile'],
  weakTo: ['knight'],
  tick(entity, world) {
    entity.scale = 0.78 + entity.t * 0.45

    if (!(entity.data.struck ?? 0) && entity.t > 0.28) {
      entity.data.struck = 1

      for (const foe of world.within(entity.x, world.groundY, world.unit * 5.8, (other) =>
        isTargetableFoe(entity, other),
      )) {
        damageGroundTarget(foe, world, 0.72, entity, 1.8)
      }
    }

    if (entity.t > (entity.data.life ?? 0.9)) {
      world.remove(entity)
    }
  },
}

const rallyBanner: EcoSpecies = {
  anchor: 'bottom',
  asset: rallyBannerAsset,
  countAs: null,
  idle: 'wave',
  layer: 'front',
  size: [2.1, 2.8],
  state: 'rally',
  style: siegeTeamStyle,
  strongVs: ['dark-lord'],
  tags: [],
  weakTo: ['fire'],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 4.8) - dt

    for (const ally of world.within(entity.x, world.groundY, world.unit * 7, (other) =>
      sameTeam(entity, other),
    )) {
      ally.data.rallyUntil = Math.max(ally.data.rallyUntil ?? 0, world.time + 0.6)
      ally.data.shieldUntil = Math.max(ally.data.shieldUntil ?? 0, world.time + 0.6)
    }

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}

const spellMeteor: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('spell-meteor'),
  countAs: null,
  layer: 'front',
  size: [2, 2.7],
  state: 'fall',
  strongVs: ['knight', 'building', 'burnable', 'dark-lord'],
  tags: ['projectile', 'fireball', 'fire'],
  weakTo: ['ice-wall', 'knight'],
  tick(entity, world, dt) {
    const unit = world.unit

    entity.vy += fireballGravity * unit * dt
    integrate(entity, dt)
    tiltToVelocity(entity, 25)

    const foe = world.nearest(
      entity,
      (other) =>
        other.id !== (entity.data.ownerId ?? -1) && isSpellDuelTarget(world, entity)(other),
      unit * 2.6,
    )
    const hitGround = entity.y >= world.groundY - unit * 0.2

    if (!foe && !hitGround && entity.t <= 1.7) {
      return
    }

    const x = foe?.x ?? entity.x
    const y = foe ? bodyPoint(foe, world).y : world.groundY - unit * 0.6

    spawnImpact(world, x, y, 3.4, 'fire', 0.64)

    for (const other of world.within(x, world.groundY, unit * 3.4, (target) => target !== entity)) {
      if (world.has(other, 'fuel') || world.has(other, 'burnable')) {
        other.data.burn = Math.max(other.data.burn ?? 0, 0.01)
      }

      if (other.id !== (entity.data.ownerId ?? -1) && isSpellDuelTarget(world, entity)(other)) {
        damageGroundTarget(other, world, other === foe ? 1.05 : 0.58, entity, 2.2)
      }
    }

    if (!world.nearest(entity, (other) => world.has(other, 'fire'), unit * 1.3)) {
      world.spawn('fire', { x })
    }

    world.remove(entity)
  },
}

const wizardFamiliar: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('spell-familiar'),
  countAs: null,
  idle: 'flap',
  init(entity) {
    entity.data.life = between(3.2, 4.4)
  },
  layer: 'front',
  size: [1.8, 2.3],
  state: 'hunt',
  strongVs: ['dragon', 'dark-lord', 'knight'],
  tags: ['owl', 'projectile'],
  weakTo: ['archer', 'fireball'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.data.life = (entity.data.life ?? 3.6) - dt

    const target = world.byId(entity.data.targetId ?? entity.targetId)
    const foe =
      target && isSpellDuelTarget(world, entity)(target)
        ? target
        : world.nearest(entity, isSpellDuelTarget(world, entity), unit * 24)

    if (foe) {
      entity.targetId = foe.id
      const point = bodyPoint(foe, world)
      steer(entity, point.x, point.y - unit * 0.4, unit * 8.5, dt, 4.2)
    } else {
      entity.vx += entity.facing * unit * 0.8 * dt
      entity.vy += Math.sin(world.time * 4 + entity.id) * unit * 0.18 * dt
    }

    integrate(entity, dt)
    faceTravel(entity, 1)
    entity.tilt = Math.sin(world.time * 8 + entity.id) * 8
    entity.scale = 0.9 + Math.sin(world.time * 10 + entity.id) * 0.06

    if (foe && Math.hypot(foe.x - entity.x, bodyPoint(foe, world).y - entity.y) < unit * 2) {
      spawnImpact(world, entity.x, entity.y, 2, 'arcane', 0.45)
      damageGroundTarget(foe, world, 0.72, entity, 1.8)
      entity.data.life = Math.min(entity.data.life ?? 0, 0.2)
      entity.vx *= -0.55
      entity.vy -= unit * 1.2
      entity.targetId = null
    }

    if (
      (entity.data.life ?? 0) <= 0 ||
      entity.x < -unit * 4 ||
      entity.x > world.width + unit * 4 ||
      entity.y < world.skyTop - unit * 5 ||
      entity.y > world.groundY + unit * 3
    ) {
      world.remove(entity)
    }
  },
}

const spellPolymorph: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('spell-polymorph'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [2, 2.6],
  state: 'frog',
  strongVs: ['knight', 'wizard', 'dark-lord'],
  tags: [],
  weakTo: ['fireball'],
  tick(entity, world) {
    const target = world.byId(entity.data.targetId ?? null)

    if (target && !target.dying && !target.removed) {
      const point = bodyPoint(target, world)
      entity.x = point.x
      entity.y = point.y + world.unit * 0.3
      entity.scale = 0.82 + Math.sin(world.time * 12 + entity.id) * 0.05

      if ((target.data.polymorphUntil ?? 0) <= world.time && target.fx === 'polymorph') {
        target.fx = ''
      }
    }

    if (!target || entity.t > (entity.data.life ?? 2.1)) {
      if (target && target.fx === 'polymorph') {
        target.fx = ''
      }

      world.remove(entity)
    }
  },
}

const swordArc: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('sword-arc'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [2.2, 3.4],
  state: 'slash',
  strongVs: ['wizard', 'dark-lord'],
  tags: [],
  weakTo: ['dragon', 'fireball'],
  tick(entity, world) {
    entity.scale = Math.max(0.2, 0.85 + entity.t * 1.8)

    if (entity.t > 0.34) {
      world.remove(entity)
    }
  },
}

const frogPrince: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('frog-prince'),
  init(entity) {
    entity.data.sitFor = between(1.5, 4)
  },
  layer: 'front',
  size: [2, 2.6],
  state: 'sit',
  strongVs: ['fireball'],
  tags: ['frog', 'prince', 'burnable', 'target'],
  weakTo: ['princess', 'dragon'],
  tick(entity, world) {
    const unit = world.unit

    if (entity.state === 'hop') {
      const progress = Math.min(1, entity.t / 0.5)
      const fromX = entity.data.fromX ?? entity.x
      const toX = entity.data.toX ?? entity.x

      entity.x = fromX + (toX - fromX) * progress
      entity.lift = Math.sin(Math.PI * progress) * unit * (entity.data.high ?? 1)

      if (progress >= 1) {
        entity.lift = 0
        entity.data.sitFor = between(1.5, 4)
        world.setState(entity, 'sit')
      }
      return
    }

    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 5)
    const incoming = incomingFireball(entity, world, 4)
    const threat = fire ?? incoming
    const ready = entity.t > (entity.data.sitFor ?? 3)

    if (!threat && !ready) {
      return
    }

    if (threat) {
      entity.facing = threat.x > entity.x ? -1 : 1
    } else if (Math.random() < 0.4) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    const reach = threat ? 3 : 1.5
    entity.data.fromX = entity.x
    entity.data.toX = clamp(entity.x + entity.facing * reach * unit, unit, world.width - unit)
    entity.data.high = threat ? 1.6 : 1
    world.setState(entity, 'hop')
  },
}

const princess: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('princess'),
  idle: 'trot',
  init(entity) {
    entity.data.seekCool = between(0.2, 1)
  },
  layer: 'front',
  size: [2, 2.45],
  state: 'stroll',
  style: siegeTeamStyle,
  strongVs: ['frog-prince'],
  tags: ['princess', 'target', 'burnable'],
  weakTo: ['dragon', 'dark-lord'],
  tick(entity, world, dt) {
    const unit = world.unit
    const lowDragon = world.nearest(
      entity,
      (other) =>
        world.has(other, 'dragon') &&
        other.state !== 'falling' &&
        (other.state === 'swoop' || other.y > world.groundY - unit * 8),
      unit * 18,
    )
    const incoming = incomingFireball(entity, world, 4.8)

    if (entity.state === 'hide' || entity.state === 'hidden') {
      const cottage = world.byId(entity.targetId)

      if (!cottage || !world.has(cottage, 'building')) {
        entity.scale = 1
        entity.lift = 0
        entity.fx = ''
        entity.targetId = null
        world.setState(entity, 'stroll')
        return
      }

      if (entity.state === 'hide') {
        if (walkToward(entity, world, cottage.x, unit * 2.2, dt) < unit * 0.5) {
          entity.scale = 0.2
          entity.lift = unit * 0.35
          entity.fx = 'hidden'
          world.setState(entity, 'hidden')
        }
        return
      }

      moveTowardPoint(entity, world, dt, cottage.x, cottage.y, 0.8)
      entity.lift = unit * 0.35

      if (!lowDragon && entity.t > 1.2) {
        entity.scale = 1
        entity.lift = 0
        entity.fx = ''
        entity.targetId = null
        world.setState(entity, 'stroll')
      }
      return
    }

    if (lowDragon) {
      const cottage = world.nearest(entity, (other) => world.has(other, 'building'), unit * 24)

      if (cottage) {
        entity.targetId = cottage.id
        entity.fx = 'hide'
        world.setState(entity, 'hide')
        return
      }
    }

    if (incoming) {
      entity.facing = incoming.x >= entity.x ? -1 : 1
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      walk(entity, world, dt, unit * 3.4)
      hop(entity, dt, unit * 0.42, 10)

      if (entity.t > 1.8 && !incoming) {
        entity.lift = 0
        world.setState(entity, 'stroll')
      }
      return
    }

    if (entity.state === 'kiss') {
      settle(entity, dt)
      entity.fx = 'kiss'
      const frog = world.byId(entity.targetId)

      if (frog) {
        entity.facing = frog.x >= entity.x ? 1 : -1
      }

      if (entity.t > 0.45 && !(entity.data.transformed ?? 0)) {
        entity.data.transformed = 1

        if (frog && frog.species === 'frog-prince') {
          const princeEntity = world.spawn('prince', {
            countAs: 'frog-prince',
            facing: entity.facing,
            x: frog.x,
            y: frog.y,
          })

          if (princeEntity) {
            princeEntity.fx = 'sparkle'
          }

          spawnCast(world, frog.x, frog.y - unit * 2.4, 2.4)
          world.kill(frog)
        }
      }

      if (entity.t > 1) {
        entity.fx = ''
        entity.targetId = null
        entity.data.transformed = 0
        world.setState(entity, 'stroll')
      }
      return
    }

    if (entity.state === 'seek') {
      const frog = world.byId(entity.targetId)

      if (!frog || frog.species !== 'frog-prince') {
        entity.targetId = null
        world.setState(entity, 'stroll')
        return
      }

      hop(entity, dt, unit * 0.18, 5)

      if (walkToward(entity, world, frog.x, unit * 2.6, dt) < unit * 0.9) {
        world.setState(entity, 'kiss')
      }
      return
    }

    walk(entity, world, dt, unit * 0.72)
    settle(entity, dt)
    entity.data.seekCool = (entity.data.seekCool ?? 0) - dt

    if (chance(0.05, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    if ((entity.data.seekCool ?? 0) <= 0) {
      const frog = world.nearest(
        entity,
        (other) => other.species === 'frog-prince',
        Math.max(unit * 50, world.width),
      )

      if (frog) {
        entity.targetId = frog.id
        world.setState(entity, 'seek')
      } else {
        entity.data.seekCool = between(1.5, 3)
      }
    }
  },
}

const wizardTypes = [
  {
    asset: ecoAsset('wizard-archmage'),
    castAsset: ecoAsset('wizard-archmage-cast'),
    code: 0,
    glow: 'rgba(184, 217, 240, 0.96)',
    rune: 'rgba(184, 217, 240, 0.82)',
    species: 'ward-wizard',
    strength: 1.1,
  },
  {
    asset: ecoAsset('wizard-pyromancer'),
    castAsset: ecoAsset('wizard-pyromancer-cast'),
    code: 1,
    glow: 'rgba(255, 166, 94, 0.98)',
    rune: 'rgba(255, 217, 102, 0.86)',
    species: 'pyro-wizard',
    strength: 1.18,
  },
  {
    asset: ecoAsset('wizard-frost'),
    castAsset: ecoAsset('wizard-frost-cast'),
    code: 2,
    glow: 'rgba(216, 244, 255, 0.98)',
    rune: 'rgba(143, 210, 230, 0.84)',
    species: 'frost-wizard',
    strength: 1.05,
  },
  {
    asset: ecoAsset('wizard-druid'),
    castAsset: ecoAsset('wizard-druid-cast'),
    code: 3,
    glow: 'rgba(168, 218, 130, 0.95)',
    rune: 'rgba(119, 170, 82, 0.84)',
    species: 'plant-wizard',
    strength: 1.0,
  },
  {
    asset: ecoAsset('wizard-storm'),
    castAsset: ecoAsset('wizard-storm-cast'),
    code: 4,
    glow: 'rgba(216, 191, 255, 0.98)',
    rune: 'rgba(170, 132, 218, 0.86)',
    species: 'storm-wizard',
    strength: 1.22,
  },
  {
    asset: ecoAsset('wizard-light'),
    castAsset: ecoAsset('wizard-light-cast'),
    code: 5,
    glow: 'rgba(255, 246, 200, 0.98)',
    rune: 'rgba(255, 217, 102, 0.88)',
    species: 'light-wizard',
    strength: 1.12,
  },
  {
    asset: ecoAsset('wizard-bender'),
    castAsset: ecoAsset('wizard-bender-cast'),
    code: 6,
    glow: 'rgba(139, 196, 212, 0.98)',
    rune: 'rgba(139, 115, 85, 0.84)',
    species: 'bender-wizard',
    strength: 1.16,
  },
] as const

const wizardSpellStates = [
  'shield',
  'lightning',
  'frost',
  'fireball',
  'tornado',
  'arcane',
  'ice-shard',
  'rain',
  'blink',
  'meteor',
  'summon',
  'polymorph',
  'fire-lance',
  'ice-wall',
  'vine',
  'heal',
  'storm',
  'plant',
  'light',
  'ward',
  'earth',
  'water',
  'fire-step',
  'air-spout',
  'duel',
] as const

const isWizardCasting = (state: string) => wizardSpellStates.some((spell) => spell === state)

const wizardTypeFor = (entity: EcoEntity) =>
  wizardTypes.find((entry) => entry.code === (entity.data.wizardType ?? 0)) ?? wizardTypes[0]

const wizardTypeFromAsset = (asset: string) =>
  wizardTypes.find((entry) => entry.asset === asset || entry.castAsset === asset) ?? wizardTypes[0]

function wizardChargeFx(spell: string) {
  if (spell === 'lightning' || spell === 'storm') {
    return 'lightning'
  }

  if (spell === 'frost' || spell === 'ice-shard' || spell === 'ice-wall') {
    return 'frost'
  }

  if (spell === 'plant' || spell === 'vine') {
    return 'vine'
  }

  if (spell === 'shield' || spell === 'ward') {
    return 'shield'
  }

  if (spell === 'rain' || spell === 'heal' || spell === 'light') {
    return spell
  }

  if (spell === 'blink' || spell === 'polymorph') {
    return 'blink'
  }

  if (spell === 'fireball' || spell === 'meteor' || spell === 'fire-lance') {
    return 'fire'
  }

  return 'arcane'
}

const staffPoint = (entity: EcoEntity, world: EcoWorld) => ({
  x: entity.x + entity.facing * world.widthOf(entity) * 0.32,
  y: entity.y - entity.lift - world.heightOf(entity) * 0.82,
})

const bodyPoint = (entity: EcoEntity, world: EcoWorld) => ({
  x: entity.x,
  y: entity.y - entity.lift - world.heightOf(entity) * 0.48,
})

function spawnImpact(world: EcoWorld, x: number, y: number, size: number, fx: string, life = 0.55) {
  const impact = world.spawn('spell-impact', { data: { life }, size, x, y })

  if (impact) {
    impact.fx = fx
  }

  return impact
}

function spawnBeam(
  world: EcoWorld,
  species: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  life = 0.16,
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(world.unit * 0.8, Math.hypot(dx, dy))
  const beam = world.spawn(species, {
    data: { life },
    size: length / world.unit,
    x: from.x + dx * 0.5,
    y: from.y + dy * 0.5,
  })

  if (beam) {
    beam.tilt = (Math.atan2(dy, dx) * 180) / Math.PI
  }

  return beam
}

let lastSpellCollisionAt = -1

function spellMatter(entity: EcoEntity, world: EcoWorld) {
  if (entity.species === 'earth-slab') return 'earth'
  if (entity.species === 'water-whip' || entity.species === 'dragon-rain-puddle') return 'water'
  if (entity.species === 'spell-tornado') return entity.fx || 'air'
  if (
    world.has(entity, 'fire') ||
    entity.species === 'wizard-fireball' ||
    entity.species === 'spell-meteor'
  )
    return 'fire'
  if (
    entity.species === 'ice-shard' ||
    entity.species === 'ice-wall' ||
    entity.species === 'frost-nova'
  )
    return 'frost'
  if (
    entity.species === 'vine-snare' ||
    entity.species === 'siege-plant' ||
    entity.species === 'dragon-vine-patch'
  )
    return 'plant'
  if (entity.species === 'light-ball' || entity.species === 'duel-beam-good') return 'light'
  if (entity.species === 'green-flame') return 'green-fire'
  if (entity.species === 'lightning-strike' || (entity.data.lightning ?? 0) > 0) return 'lightning'
  if (entity.species === 'arrow' || entity.species === 'bolt' || entity.species === 'arrow-volley')
    return 'arrow'
  if (world.has(entity, 'projectile')) return entity.species

  return ''
}

function spellCollisionCandidate(entity: EcoEntity, world: EcoWorld) {
  return (
    world.has(entity, 'projectile') ||
    entity.species === 'earth-slab' ||
    entity.species === 'water-whip' ||
    entity.species === 'dragon-rain-puddle' ||
    entity.species === 'dragon-vine-patch' ||
    entity.species === 'vine-snare' ||
    entity.species === 'siege-plant' ||
    entity.species === 'ice-wall' ||
    entity.species === 'frost-nova'
  )
}

function cancelSpell(entity: EcoEntity, world: EcoWorld) {
  if (!entity.removed && !entity.dying) {
    world.remove(entity)
  }
}

function reflectSpell(projectile: EcoEntity, owner: EcoEntity, world: EcoWorld) {
  projectile.data.ownerTeam = teamOf(owner)
  projectile.data.ownerId = owner.id
  projectile.vx *= -1.15
  projectile.vy = -Math.abs(projectile.vy) * 0.35
  projectile.facing = projectile.vx >= 0 ? 1 : -1
  projectile.fx = projectile.fx || 'magic'
  spawnImpact(world, projectile.x, projectile.y, 1.9, 'shield', 0.32)
}

function conductWater(entity: EcoEntity, water: EcoEntity, world: EcoWorld) {
  spawnImpact(world, water.x, water.y, water.size * 1.6, 'lightning', 0.45)

  for (const foe of world.within(water.x, world.groundY, world.unit * water.size * 1.8, (other) =>
    isTargetableFoe(entity, other),
  )) {
    spawnBeam(world, 'duel-beam-good', { x: water.x, y: water.y }, bodyPoint(foe, world), 0.16)
    damageGroundTarget(foe, world, 0.42, entity, 1.6)
  }
}

function handleSpellCollision(a: EcoEntity, b: EcoEntity, world: EcoWorld) {
  const kindA = spellMatter(a, world)
  const kindB = spellMatter(b, world)

  if (!kindA || !kindB) return false

  const x = (a.x + b.x) * 0.5
  const y = (a.y + b.y) * 0.5
  const pair = [kindA, kindB].sort().join(':')

  if ((kindA === kindB && kindA !== 'water') || pair === 'fire:frost') {
    spawnImpact(
      world,
      x,
      y,
      pair === 'fire:frost' ? 2.8 : 2.1,
      pair === 'fire:frost' ? 'steam' : 'duel',
      0.45,
    )
    cancelSpell(a, world)
    cancelSpell(b, world)
    return true
  }

  if (pair === 'fire:water') {
    spawnImpact(world, x, y, 3.1, 'steam', 0.58)
    cancelSpell(kindA === 'fire' ? a : b, world)
    return true
  }

  if (pair === 'fire:plant') {
    const plant = kindA === 'plant' ? a : b
    plant.fx = 'burn'
    plant.data.burn = Math.max(plant.data.burn ?? 0, 0.01)
    plant.vx += Math.sign(plant.x - x || 1) * world.unit * 1.2
    spawnImpact(world, x, y, 2.5, 'fire', 0.46)
    if (plant.species !== 'siege-plant') cancelSpell(plant, world)
    return true
  }

  if (pair === 'lightning:water') {
    conductWater(kindA === 'lightning' ? a : b, kindA === 'water' ? a : b, world)
    return true
  }

  if ((kindA === 'air' || kindB === 'air') && (kindA === 'fire' || kindB === 'fire')) {
    const tornado = kindA === 'air' ? a : b
    const fire = kindA === 'fire' ? a : b
    tornado.fx = 'fire-tornado'
    tornado.size = Math.max(tornado.size, 4.2)
    tornado.data.ownerTeam = tornado.data.ownerTeam || fire.data.ownerTeam
    spawnImpact(world, x, y, 2.8, 'fire', 0.4)
    cancelSpell(fire, world)
    return true
  }

  if ((kindA === 'air' || kindB === 'air') && (kindA === 'frost' || kindB === 'frost')) {
    const tornado = kindA === 'air' ? a : b
    const frost = kindA === 'frost' ? a : b
    tornado.fx = 'blizzard'
    tornado.size = Math.max(tornado.size, 4.1)
    spawnImpact(world, x, y, 2.7, 'frost', 0.4)
    cancelSpell(frost, world)
    return true
  }

  if (
    (kindA === 'air' || kindB === 'air') &&
    (kindA === 'light' || kindB === 'light' || kindA === 'arrow' || kindB === 'arrow')
  ) {
    const pulled = kindA === 'air' ? b : a
    pulled.vx *= 0.25
    pulled.vy -= world.unit * 1.4
    spawnImpact(world, x, y, 1.7, 'dust', 0.28)
    return true
  }

  if (
    (kindA === 'earth' || kindB === 'earth') &&
    (kindA === 'arrow' ||
      kindB === 'arrow' ||
      kindA === 'fire' ||
      kindB === 'fire' ||
      kindA === 'frost' ||
      kindB === 'frost')
  ) {
    const projectile = kindA === 'earth' ? b : a
    spawnImpact(
      world,
      x,
      y,
      kindA === 'fire' || kindB === 'fire' ? 2.6 : 2,
      kindA === 'fire' || kindB === 'fire' ? 'fire' : 'dust',
      0.38,
    )
    cancelSpell(projectile, world)
    return true
  }

  if (pair === 'green-fire:light') {
    spawnImpact(world, x, y, 3, 'light', 0.42)
    cancelSpell(a, world)
    cancelSpell(b, world)
    return true
  }

  return false
}

function runSpellCollisionPass(world: EcoWorld) {
  if (Math.abs(lastSpellCollisionAt - world.time) < 0.0001) return

  lastSpellCollisionAt = world.time
  const entities = world.entities.filter(
    (entity) => !entity.dying && !entity.removed && spellCollisionCandidate(entity, world),
  )

  for (let outer = 0; outer < entities.length; outer += 1) {
    const a = entities[outer]

    if (!a || a.removed || a.dying) continue

    for (let inner = outer + 1; inner < entities.length; inner += 1) {
      const b = entities[inner]

      if (!b || b.removed || b.dying || sameTeam(a, b)) continue

      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const reach = world.unit * Math.max(1.4, Math.min(5.2, (a.size + b.size) * 0.38))

      if (distance <= reach) {
        handleSpellCollision(a, b, world)
      }
    }
  }

  for (const projectile of world.entities) {
    if (!world.has(projectile, 'projectile') || projectile.removed || projectile.dying) continue

    const shield = world.nearest(
      projectile,
      (other) => shielded(other, world) && isEnemy(projectile, other),
      world.unit * 4.6,
    )

    if (shield) {
      reflectSpell(projectile, shield, world)
    }
  }
}

function hitDarkLord(
  entity: EcoEntity,
  world: EcoWorld,
  amount = 1,
  sourceX = entity.x,
  attacker?: EcoEntity,
) {
  if (
    entity.dying ||
    entity.removed ||
    entity.species !== 'dark-lord' ||
    (attacker && !isEnemy(attacker, entity))
  ) {
    return
  }

  const edge = attacker ? world.edge(attacker, entity) : 1
  entity.hp -= amount * edge
  if (attacker) {
    world.gainControlResource(attacker, amount * edge * 12)
    world.gainControlResource(entity, amount * edge * 8)
  }
  entity.data.hurt = 0.55
  entity.fx = 'hurt'
  spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.6, 2.8, 'curse-hit', 0.58)

  if (entity.hp <= 0) {
    entity.fx = 'ash'
    world.kill(entity)
    return
  }

  if ((entity.data.teleportCool ?? 0) <= 0 && entity.state !== 'duel') {
    entity.data.teleportCool = between(2.8, 4.2)
    entity.data.smoke = 0.7
    entity.fx = 'smoke'
    spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.46, 3.2, 'smoke', 0.72)
    const direction = entity.x >= sourceX ? 1 : -1
    entity.vx += direction * world.unit * between(5, 8)
    entity.facing = direction === 1 ? -1 : 1
    spawnImpact(
      world,
      clamp(entity.x + direction * world.unit * 2.4, world.unit, world.width - world.unit),
      entity.y - world.heightOf(entity) * 0.46,
      3.2,
      'smoke',
      0.72,
    )
  }
}

function hurtDragonOrLord(
  foe: EcoEntity,
  world: EcoWorld,
  amount = 1,
  wake = false,
  sourceX = foe.x,
  attacker?: EcoEntity,
) {
  if (world.has(foe, 'dragon')) {
    hurt(foe, world, amount, wake, attacker)
  } else if (foe.species === 'dark-lord') {
    hitDarkLord(foe, world, amount, sourceX, attacker)
  }
}

const isDarkLord = (other: EcoEntity) => other.species === 'dark-lord'

const isDragonOrLord = (world: EcoWorld) => (other: EcoEntity) =>
  isDragon(world)(other) || isDarkLord(other)

function releaseDuelWizards(world: EcoWorld, lord: EcoEntity | null) {
  for (const other of world.entities) {
    if (
      world.has(other, 'wizard') &&
      other.state === 'duel' &&
      (!lord || other.targetId === lord.id)
    ) {
      other.targetId = null
      other.data.casted = 0
      other.fx = ''
      other.lift = 0
      world.setAsset(other, wizardTypeFor(other).asset)
      world.setState(other, 'wander')
    }
  }
}

function duelSnapshot(world: EcoWorld, lord: EcoEntity) {
  const challengers = world.entities.filter(
    (other) =>
      world.has(other, 'wizard') &&
      other.state === 'duel' &&
      other.targetId === lord.id &&
      !other.dying &&
      !other.removed,
  )
  const good = challengers.reduce(
    (sum, other) => sum + wizardTypeFor(other).strength * world.edge(other, lord),
    0,
  )
  const dark = 2.25 + Math.max(0, lord.hp - 1) * 0.13
  const average = challengers.reduce(
    (point, other) => {
      const staff = staffPoint(other, world)

      return { x: point.x + staff.x, y: point.y + staff.y }
    },
    { x: 0, y: 0 },
  )
  const from = challengers.length
    ? { x: average.x / challengers.length, y: average.y / challengers.length }
    : bodyPoint(lord, world)
  const to = staffPoint(lord, world)
  const progress = clamp(good / Math.max(0.1, good + dark), 0.18, 0.86)
  const pulse = Math.sin(world.time * 12) * world.unit * 0.18

  return {
    challengers,
    dark,
    from,
    good,
    clash: {
      x: from.x + (to.x - from.x) * progress + pulse,
      y: from.y + (to.y - from.y) * progress + Math.sin(world.time * 9) * world.unit * 0.08,
    },
  }
}

function startWizardSpell(
  entity: EcoEntity,
  world: EcoWorld,
  spell: string,
  target: EcoEntity | null,
  cooldown: number,
) {
  entity.targetId = target?.id ?? null
  entity.data.casted = 0
  entity.data.beamPulse = 0
  entity.data.spellCool = cooldown
  entity.fx = spell
  world.setAsset(entity, wizardTypeFor(entity).castAsset)
  const charge = staffPoint(entity, world)
  spawnCast(
    world,
    charge.x,
    charge.y,
    spell === 'storm' || spell === 'light' ? 2.3 : 1.8,
    wizardChargeFx(spell),
    0.72,
  )
  world.setState(entity, spell)
}

function startDarkSpell(
  entity: EcoEntity,
  world: EcoWorld,
  spell: string,
  target: EcoEntity | null,
  cooldown: number,
) {
  entity.targetId = target?.id ?? null
  entity.data.casted = 0
  entity.data.beamPulse = 0
  entity.data.spellCool = cooldown
  entity.fx = spell
  world.setAsset(entity, darkLordCastAsset)
  world.setState(entity, spell)
}

function releaseWizardSpell(entity: EcoEntity, world: EcoWorld) {
  const unit = world.unit
  const origin = staffPoint(entity, world)

  if (entity.state === 'shield') {
    const cottage = world.byId(entity.targetId)

    if (cottage && world.has(cottage, 'building')) {
      cottage.data.shieldUntil = Math.max(cottage.data.shieldUntil ?? 0, world.time + 5.8)
      cottage.data.fizzleUntil = world.time + 0.5
      entity.facing = cottage.x >= entity.x ? 1 : -1
      spawnCast(world, cottage.x, cottage.y - world.heightOf(cottage) * 0.52, 3.2, 'shield', 0.9)
      spawnImpact(world, cottage.x, cottage.y - world.heightOf(cottage) * 0.58, 2.9, 'shield', 0.55)
    }
  } else if (entity.state === 'ward') {
    reflectProjectiles(entity, world, 7)
    entity.data.shieldUntil = Math.max(entity.data.shieldUntil ?? 0, world.time + 2.2)
    spawnCast(world, origin.x, origin.y, 2.7, 'shield', 0.75)
    spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.52, 3.1, 'shield', 0.68)
  } else if (entity.state === 'plant') {
    const foe = world.byId(entity.targetId)
    const x = clamp(foe?.x ?? entity.x + entity.facing * unit * 7, unit, world.width - unit)

    spawnPlants(entity, world, x, 4)
    spawnCast(world, origin.x, origin.y, 2.5, 'vine', 0.66)
  } else if (entity.state === 'light') {
    const foe = world.byId(entity.targetId)
    const target = foe
      ? bodyPoint(foe, world)
      : { x: entity.x + entity.facing * unit * 12, y: entity.y - unit * 2 }

    entity.facing = target.x >= entity.x ? 1 : -1

    for (let index = -2; index <= 2; index += 1) {
      const seconds = clamp(
        Math.hypot(target.x - origin.x, target.y - origin.y) / (unit * 18),
        0.34,
        1.1,
      )
      const launch = ballistic(
        origin.x,
        origin.y,
        target.x,
        target.y + index * unit * 0.45,
        seconds,
        0,
      )

      world.spawn('light-ball', {
        ...launch,
        data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: foe?.id ?? -1 },
        size: 1.35,
        x: origin.x,
        y: origin.y,
      })
    }

    spawnCast(world, origin.x, origin.y, 2.7, 'light', 0.7)
  } else if (entity.state === 'rain') {
    const fire = world.byId(entity.targetId)
    const rainX = fire?.x ?? entity.x

    for (const flame of world.within(rainX, world.groundY, unit * 5.8, isFireOrBurning(world))) {
      if (world.has(flame, 'fire')) {
        world.kill(flame)
      } else {
        flame.data.burn = 0
      }
    }

    for (let index = 0; index < 6; index += 1) {
      spawnCast(
        world,
        clamp(rainX + between(-3.2, 3.2) * unit, unit, world.width - unit),
        world.groundY - between(1.4, 4.8) * unit,
        between(1.2, 2.1),
        'rain',
        between(0.55, 0.95),
      )
    }
  } else if (entity.state === 'frost') {
    const foe = world.byId(entity.targetId)

    if (foe && world.has(foe, 'dragon') && foe.state !== 'falling') {
      entity.facing = foe.x >= entity.x ? 1 : -1
      foe.data.freezeFor = between(3, 4.4)
      foe.vy = Math.max(foe.vy, unit * 0.4)
      world.setState(foe, 'frozen')
      world.spawn('frost-nova', { size: 4.8, x: foe.x, y: foe.y })
      spawnCast(world, foe.x, foe.y, 3.2, 'frost', 0.9)
      spawnImpact(world, foe.x, foe.y, 3.1, 'frost', 0.58)
    }
  } else if (entity.state === 'lightning') {
    const foe = world.byId(entity.targetId)

    if (foe && isSpellDuelTarget(world, entity)(foe)) {
      entity.facing = foe.x >= entity.x ? 1 : -1
      const speed = unit * 24
      const seconds = Math.max(0.24, Math.hypot(foe.x - origin.x, foe.y - origin.y) / speed)
      const launch = ballistic(origin.x, origin.y, foe.x, foe.y, seconds, 0)

      const foePoint = bodyPoint(foe, world)

      world.spawn('lightning-strike', {
        size: clamp(Math.abs(origin.y - foePoint.y) / unit, 4.2, 7.2),
        x: foe.x,
        y: foePoint.y,
      })
      spawnBeam(world, 'duel-beam-good', origin, foePoint, 0.16)
      damageGroundTarget(foe, world, 1.15, entity, 2.1)
      world.spawn('bolt', {
        ...launch,
        data: { chain: 3, lightning: 1, magic: 1, ownerId: entity.id, ownerTeam: teamOf(entity) },
        size: 2.8,
        x: origin.x,
        y: origin.y,
      })
      spawnCast(world, origin.x, origin.y, 2.2, 'lightning', 0.65)
      spawnImpact(world, foe.x, foe.y, 2.4, 'lightning', 0.42)

      const chained = world.nearest(
        foe,
        (other) => other !== foe && isSpellDuelTarget(world, entity)(other),
        unit * 10,
      )

      if (chained) {
        world.spawn('lightning-strike', {
          size: 5.4,
          x: chained.x,
          y: bodyPoint(chained, world).y,
        })
        spawnBeam(world, 'duel-beam-good', bodyPoint(foe, world), bodyPoint(chained, world), 0.16)
        damageGroundTarget(chained, world, 0.85, entity, 1.4)
      }
    }
  } else if (entity.state === 'fireball') {
    const foe = world.byId(entity.targetId)

    if (foe && isSpellDuelTarget(world, entity)(foe)) {
      entity.facing = foe.x >= entity.x ? 1 : -1
      const seconds = clamp(Math.abs(foe.x - origin.x) / (unit * 10), 0.55, 1.3)
      const targetY = foe.anchor === 'bottom' ? world.groundY - unit * 0.6 : foe.y
      const launch = ballistic(origin.x, origin.y, foe.x, targetY, seconds, fireballGravity * unit)

      world.spawn('wizard-fireball', {
        ...launch,
        data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: foe.id },
        size: 2.2,
        x: origin.x,
        y: origin.y,
      })
      spawnCast(world, origin.x, origin.y, 2.4, 'fire', 0.58)
    }
  } else if (entity.state === 'tornado') {
    const foe = world.byId(entity.targetId)
    const direction = foe ? (foe.x >= entity.x ? 1 : -1) : entity.facing

    entity.facing = direction
    world.spawn('spell-tornado', {
      data: { ownerId: entity.id, ownerTeam: teamOf(entity) },
      facing: direction,
      size: between(2.4, 3.1),
      vx: direction * unit * 4.1,
      x: entity.x + direction * unit * 1.2,
      y: world.groundY,
    })
    spawnCast(world, origin.x, origin.y, 2.3, 'storm', 0.58)
  } else if (entity.state === 'arcane') {
    const foe = world.byId(entity.targetId)

    if (foe && isSpellDuelTarget(world, entity)(foe)) {
      entity.facing = foe.x >= entity.x ? 1 : -1

      for (let index = 0; index < 4; index += 1) {
        world.spawn('arcane-missile', {
          data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: foe.id },
          size: between(1.1, 1.45),
          vx: entity.facing * unit * between(5, 7),
          vy: unit * between(-2.5, 1.2),
          x: origin.x - entity.facing * unit * 0.18 * index,
          y: origin.y + unit * between(-0.5, 0.55),
        })
      }

      spawnCast(world, origin.x, origin.y, 2.4, 'arcane', 0.58)
    }
  } else if (entity.state === 'ice-shard') {
    const foe = world.byId(entity.targetId)

    if (foe && isSpellDuelTarget(world, entity)(foe)) {
      entity.facing = foe.x >= entity.x ? 1 : -1
      const speed = unit * 17
      const target = bodyPoint(foe, world)
      const seconds = Math.max(0.28, Math.hypot(target.x - origin.x, target.y - origin.y) / speed)
      const launch = ballistic(origin.x, origin.y, target.x, target.y, seconds, unit * 1.4)

      world.spawn('ice-shard', {
        ...launch,
        data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: foe.id },
        size: 1.75,
        x: origin.x,
        y: origin.y,
      })
      spawnCast(world, origin.x, origin.y, 2.1, 'frost', 0.55)
    }
  } else if (entity.state === 'meteor') {
    const foe = world.byId(entity.targetId)
    const strikeX = foe?.x ?? entity.x + entity.facing * unit * 7

    for (let index = 0; index < 4; index += 1) {
      const targetX = clamp(strikeX + between(-3.8, 3.8) * unit, unit, world.width - unit)
      const startX = clamp(
        targetX - entity.facing * between(5, 11) * unit,
        unit,
        world.width - unit,
      )
      const startY = world.skyTop + between(0.4, 2.4) * unit
      const seconds = between(0.62, 0.96)
      const launch = ballistic(
        startX,
        startY,
        targetX,
        world.groundY - unit * 0.55,
        seconds,
        fireballGravity * unit,
      )

      world.spawn('spell-meteor', {
        ...launch,
        data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: foe?.id ?? -1 },
        size: between(2, 2.7),
        x: startX,
        y: startY,
      })
    }

    spawnCast(world, origin.x, origin.y, 2.7, 'fire', 0.62)
  } else if (entity.state === 'summon') {
    const foe = world.byId(entity.targetId)

    world.spawn('wizard-familiar', {
      data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: foe?.id ?? -1 },
      facing: entity.facing,
      size: 2.1,
      vx: entity.facing * unit * 4.2,
      vy: -unit * 1.4,
      x: origin.x,
      y: origin.y,
    })
    spawnCast(world, origin.x, origin.y, 2.5, 'arcane', 0.64)
  } else if (entity.state === 'polymorph') {
    const foe = world.byId(entity.targetId)

    if (foe && isSpellDuelTarget(world, entity)(foe)) {
      entity.facing = foe.x >= entity.x ? 1 : -1
      const target = bodyPoint(foe, world)

      spawnBeam(world, 'duel-beam-good', origin, target, 0.18)
      world.spawn('spell-polymorph', {
        data: { life: 2.1, ownerId: entity.id, ownerTeam: teamOf(entity), targetId: foe.id },
        size: world.has(foe, 'dragon') ? 3.1 : 2.2,
        x: target.x,
        y: target.y,
      })
      spawnImpact(world, target.x, target.y, 2.7, 'polymorph', 0.62)
      foe.data.polymorphUntil = world.time + 2.1
      foe.data.slowUntil = world.time + 2.4
      foe.fx = 'polymorph'
      foe.vx *= 0.12
      foe.vy = Math.min(foe.vy, unit * 0.3)
      damageGroundTarget(foe, world, world.has(foe, 'knight') ? 0.45 : 0.25, entity, 0.8)
    }
  } else if (entity.state === 'storm') {
    const foes = world.entities.filter(isSpellDuelTarget(world, entity)).slice(0, 4)

    for (const foe of foes) {
      spawnBeam(world, 'duel-beam-good', origin, bodyPoint(foe, world), 0.22)
      spawnImpact(world, foe.x, foe.y - world.heightOf(foe) * 0.2, 2.7, 'lightning', 0.5)
      hurtDragonOrLord(foe, world, 1, foe.state === 'sleep', entity.x, entity)
    }
  } else if (entity.state === 'fire-lance') {
    const foe = world.byId(entity.targetId)

    if (foe && isDragonOrLord(world)(foe)) {
      entity.facing = foe.x >= entity.x ? 1 : -1
      spawnBeam(world, 'fire-lance', origin, bodyPoint(foe, world), 0.25)
      spawnImpact(world, foe.x, foe.y - world.heightOf(foe) * 0.18, 3.2, 'fire', 0.55)
      hurtDragonOrLord(
        foe,
        world,
        foe.species === 'dark-lord' ? 1 : 0.85,
        foe.state === 'sleep',
        entity.x,
        entity,
      )
      foe.vx += Math.sign(foe.x - entity.x || entity.facing) * unit * 4.6
      foe.vy -= unit * 1.2
    }
  } else if (entity.state === 'ice-wall') {
    const fireball = world.byId(entity.targetId)
    const wallX = clamp(
      fireball ? landingX(fireball, world, fireballGravity) : entity.x,
      unit,
      world.width - unit,
    )

    world.spawn('ice-wall', {
      data: { life: 4.2 },
      size: between(2.3, 2.9),
      x: wallX,
      y: world.groundY,
    })
    spawnImpact(world, wallX, world.groundY - unit * 2.4, 2.8, 'frost', 0.58)
  } else if (entity.state === 'vine') {
    const foe = world.byId(entity.targetId)

    if (foe && world.has(foe, 'dragon') && foe.state !== 'falling') {
      entity.facing = foe.x >= entity.x ? 1 : -1
      foe.data.rootFor = between(2.8, 4.2)
      foe.vx *= 0.25
      foe.vy = Math.max(foe.vy, unit * 0.25)
      world.setState(foe, 'rooted')
      world.spawn('vine-snare', { data: { life: 1.8 }, size: 3.8, x: foe.x, y: foe.y })
      spawnImpact(world, foe.x, foe.y, 2.5, 'vine', 0.5)
    }
  } else if (entity.state === 'heal') {
    const target = world.byId(entity.targetId)

    if (target) {
      if (world.has(target, 'fire')) {
        const x = target.x
        world.kill(target)
        world.spawn('cottage', { x })
        spawnImpact(world, x, world.groundY - unit * 2.4, 3.2, 'heal', 0.66)
      } else {
        target.data.burn = 0
        target.data.shieldUntil = Math.max(target.data.shieldUntil ?? 0, world.time + 2.2)
        spawnImpact(world, target.x, target.y - world.heightOf(target) * 0.5, 2.9, 'heal', 0.62)
      }
    }
  } else if (entity.state === 'blink') {
    const threat = world.byId(entity.targetId)
    const landing =
      threat && world.has(threat, 'fireball') ? landingX(threat, world, fireballGravity) : entity.x
    const direction = landing >= entity.x ? -1 : 1

    spawnCast(world, entity.x, entity.y - world.heightOf(entity) * 0.55, 2.5, 'blink', 0.55)
    entity.vx += direction * unit * between(7, 10)
    entity.facing = direction === 1 ? -1 : 1
    entity.lift = unit * 0.25
    spawnCast(
      world,
      clamp(entity.x + direction * unit * 3.2, unit, world.width - unit),
      entity.y - world.heightOf(entity) * 0.55,
      2.7,
      'blink',
      0.65,
    )
  } else if (entity.state === 'earth') {
    benderSlab(entity, world)
  } else if (entity.state === 'water') {
    const foe = world.byId(entity.targetId)
    benderWaterWhip(entity, world, foe?.x ?? entity.x + entity.facing * unit * 10, 1)
  } else if (entity.state === 'fire-step') {
    benderFireStep(entity, world)
  } else if (entity.state === 'air-spout') {
    const foe = world.byId(entity.targetId)
    benderAirSpout(entity, world, foe?.x ?? entity.x + entity.facing * unit * 6)
  }
}

const wizard: EcoSpecies = {
  anchor: 'bottom',
  controls: wizardControls,
  asset: () => pick(wizardTypes).asset,
  hp: 2,
  idle: 'sway',
  init(entity) {
    const type = wizardTypeFromAsset(entity.asset)

    entity.species = type.species
    entity.countAs = 'wizard'
    entity.data.wizardType = type.code
    entity.data.team = wizardTeamBase + type.code
    entity.data.book = Math.floor(between(0, 3))
    entity.data.blinkCool = between(1, 2)
    entity.data.frostCool = between(2.5, 4)
    entity.data.lightningCool = between(1.2, 2.2)
    entity.data.rainCool = between(0.6, 1.4)
    entity.data.shieldCool = between(0.3, 1)
    entity.data.summonCool = between(1.6, 3)
    entity.data.polymorphCool = between(2.2, 4)
    entity.data.specialCool = between(1.4, 2.6)
    entity.data.spellCool = between(0.4, 1)
  },
  layer: 'front',
  size: [3.6, 4.35],
  state: 'wander',
  style: (entity) => {
    const type = wizardTypeFor(entity)

    return {
      ...siegeTeamStyle(entity),
      '--wizard-glow': type.glow,
      '--wizard-rune': type.rune,
    }
  },
  strongVs: ['dragon', 'dark-lord', 'knight', 'fireball'],
  tags: ['wizard', 'target', 'burnable'],
  weakTo: ['archer'],
  tick(entity, world, dt) {
    const unit = world.unit
    const type = wizardTypeFor(entity)

    runSpellCollisionPass(world)

    entity.data.blinkCool = (entity.data.blinkCool ?? 0) - dt
    entity.data.frostCool = (entity.data.frostCool ?? 0) - dt
    entity.data.lightningCool = (entity.data.lightningCool ?? 0) - dt
    entity.data.rainCool = (entity.data.rainCool ?? 0) - dt
    entity.data.shieldCool = (entity.data.shieldCool ?? 0) - dt
    entity.data.summonCool = (entity.data.summonCool ?? 0) - dt
    entity.data.polymorphCool = (entity.data.polymorphCool ?? 0) - dt
    entity.data.specialCool = (entity.data.specialCool ?? 0) - dt
    entity.data.spellCool = (entity.data.spellCool ?? 0) - dt

    if ((entity.data.blinkFx ?? 0) > 0) {
      entity.data.blinkFx = (entity.data.blinkFx ?? 0) - dt

      if ((entity.data.blinkFx ?? 0) <= 0 && entity.fx === 'blink') {
        entity.fx = ''
      }
    }

    if (isWizardCasting(entity.state)) {
      world.setAsset(entity, type.castAsset)
      settle(entity, dt)
      entity.fx = entity.state

      if (entity.state === 'duel') {
        const lord = world.byId(entity.targetId)

        if (!lord || lord.species !== 'dark-lord') {
          releaseDuelWizards(world, lord)
          return
        }

        entity.facing = lord.x >= entity.x ? 1 : -1
        entity.data.beamPulse = (entity.data.beamPulse ?? 0) - dt

        if ((entity.data.beamPulse ?? 0) <= 0) {
          entity.data.beamPulse = 0.08
          const snapshot = duelSnapshot(world, lord)
          spawnBeam(world, 'duel-beam-good', staffPoint(entity, world), snapshot.clash, 0.14)
          spawnImpact(world, snapshot.clash.x, snapshot.clash.y, 1.4, 'duel', 0.18)
        }

        if (entity.t > 2.8) {
          entity.fx = ''
          entity.targetId = null
          world.setAsset(entity, type.asset)
          world.setState(entity, 'wander')
        }
        return
      }

      const windup = entity.state === 'blink' ? 0.22 : 0.62
      const doneAt = entity.state === 'blink' ? 0.5 : 1.18

      if (entity.t > windup && !(entity.data.casted ?? 0)) {
        entity.data.casted = 1
        releaseWizardSpell(entity, world)
      }

      if (entity.t > doneAt) {
        entity.fx = ''
        entity.targetId = null
        entity.data.casted = 0
        entity.lift = 0
        world.setAsset(entity, type.asset)
        world.setState(entity, 'wander')
      }
      return
    }

    world.setAsset(entity, type.asset)
    const incoming = incomingFireball(entity, world, 5.8)
    const incomingSpell = world.nearest(
      entity,
      (other) => world.has(other, 'projectile') && !sameTeam(entity, other),
      unit * 6.2,
    )

    if (incomingSpell && type.code === 0 && (entity.data.specialCool ?? 0) <= 0) {
      entity.data.specialCool = between(4.8, 6.8)
      startWizardSpell(entity, world, 'ward', incomingSpell, 1.4)
      return
    }

    if (incomingSpell && type.code === 6 && (entity.data.specialCool ?? 0) <= 0) {
      entity.data.specialCool = between(2.4, 3.8)
      entity.facing = incomingSpell.x >= entity.x ? 1 : -1
      startWizardSpell(entity, world, 'earth', incomingSpell, 1.2)
      return
    }

    if (incoming && (entity.data.blinkCool ?? 0) <= 0) {
      entity.data.blinkCool = between(6, 8)
      startWizardSpell(entity, world, 'blink', incoming, 1.2)
      return
    }

    const lord = world.nearest(entity, isDarkLord, Math.max(unit * 62, world.width))

    if (lord && (entity.data.spellCool ?? 0) <= 0) {
      entity.facing = lord.x >= entity.x ? 1 : -1
      startWizardSpell(entity, world, 'duel', lord, between(2.6, 3.8))

      if (lord.state !== 'duel') {
        startDarkSpell(lord, world, 'duel', entity, 2.2)
      }
      return
    }

    const fire = world.nearest(entity, isFireOrBurning(world), Math.max(unit * 34, world.height))

    if (fire && (entity.data.rainCool ?? 0) <= 0 && (type.code === 0 || type.code === 4)) {
      entity.facing = fire.x >= entity.x ? 1 : -1
      entity.data.rainCool = between(7, 10)
      startWizardSpell(entity, world, 'rain', fire, 1.8)
      return
    }

    if (fire && (entity.data.rainCool ?? 0) <= 0 && type.code === 6) {
      entity.facing = fire.x >= entity.x ? 1 : -1
      entity.data.rainCool = between(3.5, 5)
      startWizardSpell(entity, world, 'water', fire, 1.4)
      return
    }

    if (fire && (entity.data.specialCool ?? 0) <= 0 && type.code === 3) {
      entity.facing = fire.x >= entity.x ? 1 : -1
      entity.data.specialCool = between(6, 8)
      startWizardSpell(entity, world, 'heal', fire, 2)
      return
    }

    const threatenedCottage = world.nearest(
      entity,
      (other) =>
        world.has(other, 'building') &&
        ((other.data.burn ?? 0) > 0 ||
          Boolean(incomingFireball(other, world, 5)) ||
          world.entities.some(
            (dragonEntity) =>
              world.has(dragonEntity, 'dragon') &&
              dragonEntity.state === 'aim' &&
              dragonEntity.targetId === other.id,
          )),
      Math.max(unit * 46, world.width),
    )

    if (threatenedCottage && (entity.data.shieldCool ?? 0) <= 0 && type.code === 0) {
      entity.data.shieldCool = between(5, 7)
      startWizardSpell(entity, world, 'shield', threatenedCottage, 1.4)
      return
    }

    if (incoming && (entity.data.specialCool ?? 0) <= 0 && type.code === 2) {
      entity.data.specialCool = between(5, 7)
      startWizardSpell(entity, world, 'ice-wall', incoming, 1.8)
      return
    }

    if ((entity.data.spellCool ?? 0) <= 0) {
      const foe = world.nearest(
        entity,
        isSpellDuelTarget(world, entity),
        Math.max(unit * 56, world.width),
      )

      if (foe) {
        const book = entity.data.book ?? 0
        const nearbyGround = world.within(
          foe.x,
          world.groundY,
          unit * 7,
          (other) => isSpellDuelTarget(world, entity)(other) && onGround(other, world),
        )
        entity.data.book = book + 1

        if (nearbyGround.length >= 3 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(6, 8)
          startWizardSpell(
            entity,
            world,
            type.code === 1 ? 'meteor' : type.code === 6 ? 'air-spout' : 'tornado',
            foe,
            between(2.3, 3.3),
          )
          return
        }

        if (
          type.code === 0 &&
          (entity.data.summonCool ?? 0) <= 0 &&
          (world.has(foe, 'dragon') || foe.species === 'dark-lord')
        ) {
          entity.data.summonCool = between(8, 12)
          startWizardSpell(entity, world, 'summon', foe, between(2.6, 3.8))
          return
        }

        if (
          type.code === 3 &&
          (entity.data.polymorphCool ?? 0) <= 0 &&
          (world.has(foe, 'knight') || world.has(foe, 'wizard') || foe.species === 'dark-lord')
        ) {
          entity.data.polymorphCool = between(8, 12)
          startWizardSpell(entity, world, 'polymorph', foe, between(2.6, 3.8))
          return
        }

        if (world.has(foe, 'knight') && (entity.data.lightningCool ?? 0) <= 0) {
          entity.data.lightningCool = between(4.5, 6.5)
          startWizardSpell(entity, world, 'lightning', foe, between(2, 3))
          return
        }

        if (type.code === 1 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(4.8, 7)
          startWizardSpell(
            entity,
            world,
            Math.random() < 0.45 ? 'meteor' : Math.random() < 0.72 ? 'fireball' : 'fire-lance',
            foe,
            between(2.4, 3.2),
          )
          return
        }

        if (type.code === 2 && (entity.data.frostCool ?? 0) <= 0) {
          entity.data.frostCool = between(9, 13)
          startWizardSpell(
            entity,
            world,
            Math.random() < 0.62 ? 'ice-shard' : 'frost',
            foe,
            between(2.6, 3.8),
          )
          return
        }

        if (type.code === 3 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(6, 8.5)
          startWizardSpell(entity, world, 'plant', foe, between(2.2, 3.2))
          return
        }

        if (type.code === 5 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(5.5, 7.5)
          startWizardSpell(entity, world, 'light', foe, between(2.1, 3.1))
          return
        }

        if (type.code === 4 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(6, 9)
          startWizardSpell(entity, world, 'storm', foe, between(2.7, 3.8))
          return
        }

        if (type.code === 6 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(3.2, 5)
          const spell = world.has(foe, 'dragon')
            ? 'air-spout'
            : world.has(foe, 'plant')
              ? 'fire-step'
              : (foe.data.burn ?? 0) > 0 || foe.species === 'green-flame'
                ? 'water'
                : Math.random() < 0.45
                  ? 'earth'
                  : Math.random() < 0.65
                    ? 'water'
                    : 'fire-step'
          startWizardSpell(entity, world, spell, foe, between(1.7, 2.6))
          return
        }

        if ((book + entity.id) % 4 === 1) {
          startWizardSpell(entity, world, 'arcane', foe, between(2.2, 3.2))
          return
        }

        if (Math.random() < 0.25) {
          startWizardSpell(entity, world, 'fireball', foe, between(2.2, 3.2))
          return
        }

        if (
          (book % 3 === 0 || foe.state === 'swoop') &&
          world.has(foe, 'dragon') &&
          (entity.data.frostCool ?? 0) <= 0
        ) {
          entity.data.frostCool = between(10, 14)
          startWizardSpell(entity, world, 'frost', foe, between(2.6, 3.8))
          return
        }

        if ((entity.data.lightningCool ?? 0) <= 0) {
          entity.data.lightningCool = between(5.5, 8)
          startWizardSpell(entity, world, 'lightning', foe, between(2.4, 3.4))
          return
        }
      }

      entity.data.spellCool = 1.2
    }

    walk(entity, world, dt, unit * 0.62)
    hop(entity, dt, unit * 0.08, 3)

    if (chance(0.06, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const wizardControlsByType = [
  wardWizardControls,
  pyroWizardControls,
  frostWizardControls,
  plantWizardControls,
  stormWizardControls,
  lightWizardControls,
  benderWizardControls,
] as const

const wizardSpeciesFor = (code: 0 | 1 | 2 | 3 | 4 | 5 | 6) => ({
  ...wizard,
  asset: wizardTypes[code].asset,
  controls: wizardControlsByType[code],
})

const wardWizard = wizardSpeciesFor(0)
const pyroWizard = wizardSpeciesFor(1)
const frostWizard = wizardSpeciesFor(2)
const plantWizard = wizardSpeciesFor(3)
const stormWizard = wizardSpeciesFor(4)
const lightWizard = wizardSpeciesFor(5)
const benderWizard = wizardSpeciesFor(6)

const darkLord: EcoSpecies = {
  anchor: 'bottom',
  asset: darkLordAsset,
  hp: 5,
  idle: 'sway',
  init(entity) {
    entity.data.curseCool = between(1.2, 2.2)
    entity.data.fireCool = between(2, 3)
    entity.data.spellCool = between(0.7, 1.4)
  },
  layer: 'front',
  size: [2.35, 2.9],
  state: 'stalk',
  style: siegeTeamStyle,
  strongVs: ['princess', 'archer'],
  tags: ['dark-lord', 'burnable'],
  weakTo: ['wizard', 'archer', 'knight'],
  tick(entity, world, dt) {
    const unit = world.unit

    entity.data.curseCool = (entity.data.curseCool ?? 0) - dt
    entity.data.fireCool = (entity.data.fireCool ?? 0) - dt
    entity.data.spellCool = (entity.data.spellCool ?? 0) - dt
    entity.data.teleportCool = (entity.data.teleportCool ?? 0) - dt
    entity.data.smoke = Math.max(0, (entity.data.smoke ?? 0) - dt)
    entity.data.hurt = Math.max(0, (entity.data.hurt ?? 0) - dt)

    if (entity.hp <= 0) {
      entity.fx = 'ash'
      world.kill(entity)
      return
    }

    if (entity.state === 'duel') {
      world.setAsset(entity, darkLordCastAsset)
      settle(entity, dt)
      const snapshot = duelSnapshot(world, entity)

      if (snapshot.challengers.length === 0) {
        entity.fx = ''
        world.setAsset(entity, darkLordAsset)
        world.setState(entity, 'stalk')
        return
      }

      const nearestWizard = snapshot.challengers[0]
      entity.facing = nearestWizard && nearestWizard.x >= entity.x ? 1 : -1
      entity.fx = 'duel'
      entity.data.beamPulse = (entity.data.beamPulse ?? 0) - dt

      if ((entity.data.beamPulse ?? 0) <= 0) {
        entity.data.beamPulse = 0.08
        spawnBeam(world, 'duel-beam-dark', staffPoint(entity, world), snapshot.clash, 0.14)
        spawnImpact(world, snapshot.clash.x, snapshot.clash.y, 1.7, 'curse', 0.2)
      }

      if (entity.t > 2.12 && !(entity.data.casted ?? 0)) {
        entity.data.casted = 1
        const goodRoll = snapshot.good + Math.random() * 0.55
        const darkRoll = snapshot.dark + Math.random() * 0.45

        if (goodRoll >= darkRoll) {
          spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.55, 3.8, 'duel', 0.72)
          hitDarkLord(entity, world, snapshot.good >= 3.1 ? 2 : 1, snapshot.from.x)
        } else {
          const victim = pick(snapshot.challengers)
          spawnImpact(world, victim.x, victim.y - world.heightOf(victim) * 0.55, 3.2, 'curse', 0.66)
          world.kill(victim)
          entity.data.smoke = 0.5
          entity.fx = 'smoke'
        }

        releaseDuelWizards(world, entity)
        entity.targetId = null
        entity.data.spellCool = between(1.3, 2.2)
        entity.data.casted = 0
        world.setAsset(entity, darkLordAsset)
        world.setState(entity, 'stalk')
      }
      return
    }

    const casting = entity.state === 'curse' || entity.state === 'green-fire'

    if (casting) {
      world.setAsset(entity, darkLordCastAsset)
      settle(entity, dt)
      entity.fx = entity.state
      const target = world.byId(entity.targetId)

      if (target) {
        entity.facing = target.x >= entity.x ? 1 : -1
      }

      if (entity.t > 0.58 && !(entity.data.casted ?? 0)) {
        entity.data.casted = 1

        if (target) {
          const origin = staffPoint(entity, world)
          const targetPoint = bodyPoint(target, world)

          spawnBeam(world, 'duel-beam-dark', origin, targetPoint, 0.24)
          spawnImpact(world, targetPoint.x, targetPoint.y, 2.8, 'curse', 0.58)

          if (
            entity.state === 'curse' &&
            Math.random() < Math.min(0.96, 0.68 * world.edge(entity, target))
          ) {
            world.kill(target)
          } else if (world.has(target, 'fuel')) {
            target.data.burn = Math.max(target.data.burn ?? 0, 0.01)
            world.spawn('green-flame', { x: target.x })
          }
        }
      }

      if (entity.t > 1.2) {
        entity.targetId = null
        entity.fx = (entity.data.smoke ?? 0) > 0 ? 'smoke' : ''
        entity.data.casted = 0
        world.setAsset(entity, darkLordAsset)
        world.setState(entity, 'stalk')
      }
      return
    }

    world.setAsset(entity, darkLordAsset)

    if ((entity.data.smoke ?? 0) <= 0 && (entity.data.hurt ?? 0) <= 0) {
      entity.fx = ''
    }

    const wizardTarget = world.nearest(
      entity,
      (other) => world.has(other, 'wizard') && isEnemy(entity, other),
      unit * 28,
    )

    if (wizardTarget && (entity.data.spellCool ?? 0) <= 0) {
      startDarkSpell(entity, world, 'duel', wizardTarget, 2.4)
      return
    }

    const victim = world.nearest(
      entity,
      (other) =>
        world.has(other, 'knight') || world.has(other, 'prince') || world.has(other, 'princess'),
      Math.max(unit * 42, world.width * 0.9),
    )

    if (victim && (entity.data.curseCool ?? 0) <= 0) {
      entity.data.curseCool = between(3.8, 5.4)
      startDarkSpell(entity, world, 'curse', victim, 1.8)
      return
    }

    const fuel = world.nearest(
      entity,
      (other) => world.has(other, 'fuel') && (other.data.burn ?? 0) <= 0,
      Math.max(unit * 38, world.width * 0.8),
    )

    if (fuel && (entity.data.fireCool ?? 0) <= 0) {
      entity.data.fireCool = between(5, 7)
      startDarkSpell(entity, world, 'green-fire', fuel, 2.1)
      return
    }

    walk(entity, world, dt, unit * 0.52)
    hop(entity, dt, unit * 0.06, 2.6)

    if (chance(0.04, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const ballista: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('ballista'),
  burnTime: 4.2,
  init(entity) {
    entity.data.cool = between(0.8, 1.6)
  },
  layer: 'front',
  size: [3.8, 4.6],
  state: 'ready',
  style: siegeTeamStyle,
  strongVs: ['dragon'],
  tags: ['fuel', 'target'],
  weakTo: ['dark-lord', 'fireball'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.data.cool = (entity.data.cool ?? 0) - dt

    if (entity.state === 'aim') {
      const foe = world.byId(entity.targetId)

      if (!foe || foe.state === 'falling') {
        entity.fx = ''
        world.setState(entity, 'ready')
        return
      }

      entity.facing = foe.x >= entity.x ? 1 : -1
      entity.fx = 'aim'

      if (entity.t > 1.05) {
        const speed = unit * 18
        const originX = entity.x + entity.facing * world.widthOf(entity) * 0.36
        const originY = entity.y - world.heightOf(entity) * 0.58
        const { aimX, aimY, seconds } = leadTarget(foe, originX, originY, speed)
        const launch = ballistic(originX, originY, aimX, aimY, seconds, boltGravity * unit)

        world.spawn('bolt', {
          ...launch,
          data: { knock: 1, ownerId: entity.id, ownerTeam: teamOf(entity) },
          size: 3.2,
          x: originX,
          y: originY,
        })
        entity.fx = ''
        entity.data.cool = between(5.5, 7.5)
        world.setState(entity, 'ready')
      }
      return
    }

    settle(entity, dt)

    if ((entity.data.cool ?? 0) <= 0) {
      const foe = world.nearest(entity, isDragon(world), Math.max(unit * 58, world.width))

      if (foe) {
        entity.targetId = foe.id
        world.setState(entity, 'aim')
      } else {
        entity.data.cool = 1.5
      }
    }
  },
}

const frostNova: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('frost-nova'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [3.8, 5],
  state: 'bloom',
  strongVs: ['dragon', 'fireball'],
  tags: [],
  weakTo: ['fireball', 'dark-lord'],
  tick(entity, world) {
    entity.scale = Math.max(0.25, 0.7 + entity.t * 0.9)

    if (entity.t > (entity.data.life ?? 0.95)) {
      world.remove(entity)
    }
  },
}

const wizardCast: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('wizard-cast'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [1.6, 2.5],
  state: 'sparkle',
  strongVs: ['dark-lord'],
  tags: [],
  weakTo: ['fireball'],
  tick(entity, world) {
    entity.scale = Math.max(0.2, 1 + entity.t * 0.55)

    if (entity.t > (entity.data.life ?? 0.65)) {
      world.remove(entity)
    }
  },
}

const spellImpact: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('spell-impact'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [1.4, 2.6],
  state: 'burst',
  strongVs: ['dark-lord', 'fireball'],
  tags: [],
  weakTo: ['dragon'],
  tick(entity, world) {
    entity.scale = Math.max(0.25, 0.8 + entity.t * 0.85)

    if (entity.t > (entity.data.life ?? 0.55)) {
      world.remove(entity)
    }
  },
}

const beamEffect = (asset: string): EcoSpecies => ({
  anchor: 'center',
  asset,
  countAs: null,
  layer: 'front',
  size: [2, 2],
  state: 'beam',
  strongVs: ['dragon', 'dark-lord'],
  tags: [],
  weakTo: ['knight', 'fireball'],
  tick(entity, world) {
    if (entity.t > (entity.data.life ?? 0.16)) {
      world.remove(entity)
    }
  },
})

const iceWall: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('ice-wall'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [2.2, 3],
  state: 'stand',
  strongVs: ['fireball', 'dragon'],
  tags: [],
  weakTo: ['dark-lord'],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 3.8) - dt
    entity.data.flash = Math.max(0, (entity.data.flash ?? 0) - dt)
    entity.fx = (entity.data.flash ?? 0) > 0 ? 'block' : ''

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}

const vineSnare: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('vine-snare'),
  countAs: null,
  idle: 'sway',
  layer: 'front',
  size: [2.35, 3.15],
  state: 'snare',
  strongVs: ['dragon', 'knight'],
  tags: [],
  weakTo: ['fireball', 'dark-lord'],
  tick(entity, world) {
    entity.scale = Math.max(0.6, 1 + Math.sin(entity.t * 8) * 0.04)

    if (entity.t > (entity.data.life ?? 1.8)) {
      world.remove(entity)
    }
  },
}

const greenFlame: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('green-flame'),
  countAs: null,
  idle: 'flicker',
  init(entity) {
    entity.data.life = between(5, 8)
    entity.data.spread = 0.45
    entity.scale = 0.45
  },
  layer: 'front',
  size: [1.8, 2.4],
  state: 'burn',
  strongVs: ['building', 'princess'],
  tags: ['fire'],
  weakTo: ['wizard'],
  tick(entity, world, dt) {
    entity.scale = Math.min(1.08, 0.45 + entity.age * 1.7)
    entity.data.life = (entity.data.life ?? 7) - dt

    if ((entity.data.life ?? 0) <= 0) {
      world.kill(entity)
      return
    }

    entity.data.spread = (entity.data.spread ?? 0.45) - dt

    if ((entity.data.spread ?? 0) > 0) {
      return
    }

    entity.data.spread = 0.55

    for (const other of world.within(entity.x, world.groundY, world.unit * 3.2, () => true)) {
      if (other === entity || world.has(other, 'fire')) {
        continue
      }

      if (world.has(other, 'fuel') && (other.data.burn ?? 0) <= 0 && Math.random() < 0.42) {
        other.data.burn = 0.01
      } else if (
        world.has(other, 'burnable') &&
        Math.abs(other.x - entity.x) < world.unit * 1.5 &&
        onGround(other, world)
      ) {
        world.kill(other)
      }
    }
  },
}

export const siegeSpecies = (cottageAssets: readonly string[]) => ({
  'air-spout': airSpout,
  'arcane-missile': arcaneMissile,
  archer,
  arrow,
  'arrow-volley': arrowVolley,
  ballista,
  bolt,
  cottage: cottageSpecies(cottageAssets),
  'dark-lord': darkLord,
  dragon,
  'earth-slab': earthSlab,
  'eastern-dragon': easternDragon,
  'ember-dragon': emberDragon,
  'emerald-dragon': emeraldDragon,
  'frost-dragon': frostDragon,
  'duel-beam-dark': beamEffect(ecoAsset('duel-beam-dark')),
  'duel-beam-good': beamEffect(ecoAsset('duel-beam-good')),
  'dragon-burn-zone': dragonBurnZone,
  'dragon-fog-bank': dragonFogBank,
  'dragon-hedge-ridge': dragonHedgeRidge,
  'dragon-ice-pop': dragonIcePop,
  'dragon-ice-slick': dragonIceSlick,
  'dragon-rain-puddle': dragonRainPuddle,
  'dragon-root-bump': dragonRootBump,
  'dragon-shockwave': dragonShockwave,
  'dragon-storm-pulse': dragonStormPulse,
  'dragon-trunk': dragonTrunk,
  'dragon-updraft': dragonUpdraft,
  'dragon-vine-patch': dragonVinePatch,
  'fire-lance': beamEffect(ecoAsset('fire-lance')),
  'fire-step-arc': fireStepArc,
  'flame-stream': flameStream,
  fireball,
  'frost-nova': frostNova,
  'frog-prince': frogPrince,
  'green-flame': greenFlame,
  'ice-wall': iceWall,
  'ice-shard': iceShard,
  knight,
  'light-ball': lightBall,
  'lightning-strike': lightningStrike,
  prince,
  princess,
  'rally-banner': rallyBanner,
  'siege-plant': carnivorousPlant,
  'spell-familiar': wizardFamiliar,
  'spell-impact': spellImpact,
  'spell-meteor': spellMeteor,
  'spell-polymorph': spellPolymorph,
  'spell-tornado': spellTornado,
  'sword-arc': swordArc,
  'vine-snare': vineSnare,
  'water-whip': waterWhip,
  wizard,
  'ward-wizard': wardWizard,
  'pyro-wizard': pyroWizard,
  'frost-wizard': frostWizard,
  'plant-wizard': plantWizard,
  'storm-wizard': stormWizard,
  'light-wizard': lightWizard,
  'bender-wizard': benderWizard,
  'wizard-cast': wizardCast,
  'wizard-fireball': wizardFireball,
})
