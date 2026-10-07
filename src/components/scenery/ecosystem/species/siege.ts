import { ecoAsset, registerViewBoxes } from '../assets'
import {
  ballistic,
  between,
  chance,
  clamp,
  faceTravel,
  groundLine,
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
  bolt: [128, 24],
  'duel-beam-dark': [144, 18],
  'duel-beam-good': [144, 18],
  'green-flame': [58, 70],
  'mounted-knight': [156, 104],
  'mounted-knight-charge': [172, 104],
  prince: [76, 88],
  princess: [78, 96],
  'shield-bubble': [124, 112],
  'spell-impact': [86, 86],
  'dragon-wyvern-glide': [180, 120],
  'dragon-dread': [158, 98],
  'dragon-dread-breath': [158, 98],
  'dread-flame': [168, 56],
  'arrow-volley': [100, 72],
  'rally-banner': [72, 110],
  'sword-arc': [108, 82],
  'vine-snare': [116, 74],
  wizard: [92, 112],
  'wizard-druid': [92, 112],
  'wizard-druid-cast': [92, 112],
  'wizard-frost': [92, 112],
  'wizard-frost-cast': [92, 112],
  'wizard-pyromancer': [92, 112],
  'wizard-pyromancer-cast': [92, 112],
  'wizard-raise': [92, 112],
  'fire-seed': [64, 28],
  'plant-thorn': [48, 14],
  'thorn-sapling': [84, 100],
  'thorn-spike': [44, 96],
  'impact-fire': [64, 64],
  'impact-frost': [64, 64],
  'impact-thorn': [64, 64],
  'sky-vine': [44, 320],
  'dark-lord': [92, 104],
  'dark-lord-cast': [92, 104],
  'dark-lord-chain': [240, 10],
  'dark-lord-serpent': [132, 56],
  'dark-lord-sigil': [120, 40],
  'dark-lord-skeleton': [64, 84],
  'dark-lord-skull-bolt': [104, 44],
  'dark-lord-toad': [92, 104],
})

const arrowGravity = 4
const boltGravity = 3

const darkLordAsset = ecoAsset('dark-lord')
const darkLordCastAsset = ecoAsset('dark-lord-cast')
const knightAsset = ecoAsset('knight')
const mountedKnightAsset = ecoAsset('mounted-knight')
const mountedKnightChargeAsset = ecoAsset('mounted-knight-charge')
const wyvernGlideAsset = ecoAsset('dragon-wyvern-glide')
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
  11: { accent: 'rgba(255, 166, 94, 0.78)', color: '255 166 94' },
  12: { accent: 'rgba(216, 244, 255, 0.82)', color: '143 210 230' },
  13: { accent: 'rgba(168, 218, 130, 0.78)', color: '119 170 82' },
}

const homingShots = new Set(['fire-seed', 'plant-thorn'])

const worldlessSpecies = new Set([
  'arrow',
  'arrow-volley',
  'bolt',
  'duel-beam-dark',
  'duel-beam-good',
  'rally-banner',
  'spell-impact',
  'sword-arc',
  'vine-snare',
  'spell-clash',
  'fire-seed',
  'plant-thorn',
  'thorn-spike',
  'sky-vine',
  'dread-flame',
  'dark-tether',
  'dark-lord-serpent',
  'dark-lord-sigil',
  'dark-lord-skull-bolt',
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
    return wizardTeamBase + (entity.data.wizardType ?? 1)
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

// Frost creeps over a dragon while an ice beam holds on it, so the target is obvious.
function dragonStyle(entity: EcoEntity, world: EcoWorld) {
  const fresh = world.time - (entity.data.chillAt ?? -9) < 0.7

  return {
    ...siegeTeamStyle(entity),
    '--frost': fresh ? clamp(0.25 + (entity.data.chill ?? 0) * 0.18, 0, 1).toFixed(2) : '0',
  }
}

// While any dragon flies, wizards and the Dark lord fight it together; once the sky is clear
// they go back to fighting each other.
let casterTruce = false
let casterTruceCheckedAt = -1

function refreshCasterTruce(world: EcoWorld) {
  if (Math.abs(casterTruceCheckedAt - world.time) < 0.0001) return

  casterTruceCheckedAt = world.time
  casterTruce = world.entities.some(
    (entity) =>
      !entity.dying && !entity.removed && world.has(entity, 'dragon') && entity.state !== 'falling',
  )
}

const isCasterTeam = (team: number) => team === darkTeam || team >= wizardTeamBase

function sameTeam(a: EcoEntity, b: EcoEntity) {
  const teamA = teamOf(a)
  const teamB = teamOf(b)

  if (teamA > 0 && teamA === teamB) return true

  return casterTruce && isCasterTeam(teamA) && isCasterTeam(teamB)
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
    entity.state === 'frozen' ||
    entity.state === 'breath'
  )
}

function dragonWeakPointOpen(entity: EcoEntity) {
  return entity.state === 'rooted' || entity.state === 'frozen'
}

function attackerElement(attacker?: EcoEntity) {
  if (!attacker) return ''
  if (attacker.state === 'ice-beam' || attacker.fx === 'frost' || attacker.fx === 'ice-beam')
    return 'frost'
  if (
    attacker.species === 'fire-seed' ||
    attacker.species === 'fireball' ||
    attacker.state === 'meteor-seeds' ||
    attacker.fx === 'fire'
  )
    return 'fire'
  if ((attacker.data.lightning ?? 0) > 0) return 'lightning'

  return ''
}

function canKnightHitTarget(target: EcoEntity, world: EcoWorld) {
  return !world.has(target, 'dragon') || dragonMeleeVulnerable(target)
}

function landingX(projectile: EcoEntity, world: EcoWorld) {
  const drop = world.groundY - projectile.y

  if (drop <= 0 || projectile.vy <= 0) {
    return projectile.x
  }

  return projectile.x + (projectile.vx * drop) / projectile.vy
}

function incomingFireball(entity: EcoEntity, world: EcoWorld, reach: number) {
  return world.nearest(
    entity,
    (other) =>
      world.has(other, 'fireball') &&
      Math.abs(landingX(other, world) - entity.x) < world.unit * reach,
    world.unit * 12,
  )
}

function shielded(entity: EcoEntity, world: EcoWorld) {
  return (entity.data.shieldUntil ?? 0) > world.time
}

function spawnCast(world: EcoWorld, x: number, y: number, size = 2.1, fx = 'sparkle', life = 0.65) {
  return spawnImpact(world, x, y, size, fx, life)
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
  const exposed = dragonWeakPointOpen(dragon)
  const dealt = amount * edge * (exposed ? 1.5 : 1)

  dragon.hp -= dealt
  if (attacker) {
    world.gainControlResource(attacker, dealt * 12)
    world.gainControlResource(dragon, dealt * 8)
  }
  dragon.data.hurt = 0.45
  dragon.fx = exposed ? 'weak-hit' : 'hurt'

  if (dragon.species === 'ember-dragon' && element === 'frost') {
    dragon.data.cool = Math.max(dragon.data.cool ?? 0, 1.2)
    spawnImpact(world, dragon.x, dragon.y, 3.2, 'steam', 0.62)
  }

  if (dragon.species === 'emerald-dragon' && element === 'fire' && dragon.state === 'rooted') {
    dragon.data.rootFor = 0
    spawnImpact(world, dragon.x, dragon.y, 2.8, 'fire', 0.48)
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
    size: [7.6, 8.8],
    species: 'eastern-dragon',
  },
  {
    asset: ecoAsset('dragon-eastern-jade'),
    idle: 'undulate',
    size: [7.6, 8.8],
    species: 'eastern-dragon',
  },
  {
    asset: ecoAsset('dragon-western-ember'),
    idle: 'flap',
    size: [6.2, 7],
    species: 'ember-dragon',
  },
  {
    asset: ecoAsset('dragon-western-frost'),
    idle: 'flap',
    size: [6.1, 6.9],
    species: 'frost-dragon',
  },
  {
    asset: wyvernGlideAsset,
    idle: 'flap',
    size: [6.3, 7.1],
    species: 'emerald-dragon',
  },
] as const

function dragonMouth(entity: EcoEntity, world: EcoWorld) {
  const localX = world.widthOf(entity) * 0.46
  const localY = -world.heightOf(entity) * 0.1
  const angle = (entity.tilt * Math.PI) / 180
  const turnedX = localX * Math.cos(angle) - localY * Math.sin(angle)
  const turnedY = localX * Math.sin(angle) + localY * Math.cos(angle)

  return {
    x: entity.x + entity.facing * turnedX,
    y: entity.y - entity.lift + turnedY,
  }
}

const dragonShotSpeed = 26

function leadBody(
  target: EcoEntity,
  world: EcoWorld,
  from: { x: number; y: number },
  speed: number,
) {
  const body = bodyPoint(target, world)
  const seconds = Math.hypot(body.x - from.x, body.y - from.y) / speed

  return {
    x: body.x + target.vx * seconds * 0.8,
    y: body.y + (onGround(target, world) ? 0 : target.vy * seconds * 0.8),
  }
}

function dragonShotAim(target: EcoEntity, world: EcoWorld, from: { x: number; y: number }) {
  return leadBody(target, world, from, world.unit * dragonShotSpeed)
}

function shootDragonFireball(
  entity: EcoEntity,
  world: EcoWorld,
  point: { x: number; y: number },
  spread = 0,
) {
  const mouth = dragonMouth(entity, world)
  const angle = Math.atan2(point.y - mouth.y, point.x - mouth.x) + spread
  const speed = world.unit * dragonShotSpeed

  world.spawn('fireball', {
    data: { ownerId: entity.id, ownerTeam: teamOf(entity) },
    facing: Math.cos(angle) >= 0 ? 1 : -1,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    x: mouth.x,
    y: mouth.y,
  })
  spawnImpact(world, mouth.x, mouth.y, 1.2, 'fire', 0.16)
}

function dragonShotTargets(entity: EcoEntity, world: EcoWorld) {
  return world.entities.filter(
    (other) =>
      !other.dying &&
      !other.removed &&
      !world.has(other, 'dragon') &&
      (world.has(other, 'target') ||
        world.has(other, 'wizard') ||
        world.has(other, 'knight') ||
        other.species === 'dark-lord') &&
      isEnemy(entity, other),
  )
}

function startDragonBurst(entity: EcoEntity, world: EcoWorld, target: EcoEntity) {
  entity.targetId = target.id
  entity.data.shots = 0
  entity.data.shotCount = entity.species === 'eastern-dragon' ? 4 : 3
  entity.data.nextShotAt = world.time + 0.4
  entity.fx = 'fire-charge'
  world.setState(entity, 'fireball-burst')
}

function finishDragonBurst(entity: EcoEntity, world: EcoWorld) {
  entity.fx = ''
  entity.targetId = null
  entity.data.cool = entity.species === 'eastern-dragon' ? between(1.4, 2.4) : between(1.8, 3)
  world.setState(entity, 'patrol')
}

function tickDragonBurst(entity: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit
  const target = world.byId(entity.targetId)
  const shots = entity.data.shots ?? 0

  entity.vx *= 0.9
  entity.vy = entity.vy * 0.9 + Math.sin(world.time * 5 + entity.id) * unit * 0.6 * dt
  integrate(entity, dt)
  keepInSky(entity, world)

  if (target && !target.dying && !target.removed) {
    const aim = dragonShotAim(target, world, entity)
    const nose = (Math.atan2(aim.y - entity.y, Math.abs(aim.x - entity.x) + unit) * 180) / Math.PI

    entity.facing = target.x >= entity.x ? 1 : -1
    entity.tilt += (clamp(nose * 0.55, -10, 26) - entity.tilt) * Math.min(1, dt * 8)
  } else if (shots === 0) {
    finishDragonBurst(entity, world)
    return
  }

  if (shots < (entity.data.shotCount ?? 3) && world.time >= (entity.data.nextShotAt ?? 0)) {
    const point =
      target && !target.dying && !target.removed
        ? dragonShotAim(target, world, dragonMouth(entity, world))
        : { x: entity.x + entity.facing * unit * 14, y: entity.y + unit * 7 }

    shootDragonFireball(entity, world, point, between(-0.05, 0.05))
    entity.data.shots = shots + 1
    entity.data.nextShotAt = world.time + 0.2
    entity.fx = 'fire-spit'
  }

  if (
    ((entity.data.shots ?? 0) >= (entity.data.shotCount ?? 3) &&
      world.time > (entity.data.nextShotAt ?? 0) + 0.12) ||
    entity.t > 3
  ) {
    finishDragonBurst(entity, world)
  }
}

function fireballHits(shot: EcoEntity, other: EcoEntity, world: EcoWorld) {
  const height = world.heightOf(other)
  const top =
    other.anchor === 'center' ? other.y - height * 0.42 : other.y - other.lift - height * 0.92
  const bottom =
    other.anchor === 'center' ? other.y + height * 0.42 : other.y - other.lift + world.unit * 0.2

  return (
    Math.abs(other.x - shot.x) <= world.widthOf(other) * 0.4 + world.unit * 0.35 &&
    shot.y >= top - world.unit * 0.3 &&
    shot.y <= bottom
  )
}

function tickDragonAilments(entity: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit
  entity.data.angry = Math.max(0, (entity.data.angry ?? 0) - dt)

  if ((entity.data.hurt ?? 0) > 0) {
    entity.data.hurt = (entity.data.hurt ?? 0) - dt

    if ((entity.data.hurt ?? 0) <= 0 && entity.state !== 'falling') {
      entity.fx = ''
    }
  }

  if ((entity.data.hexBurn ?? 0) > 0) {
    entity.data.hexBurn = (entity.data.hexBurn ?? 0) - dt
    entity.hp -= 0.3 * dt
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
      return true
    }

    entity.fx = 'crash'
    entity.vy += unit * 7.8 * dt
    entity.vx *= 0.985
    entity.tilt += dt * 120 * (entity.facing || 1)
    integrate(entity, dt)

    if (entity.y >= world.groundY - world.heightOf(entity) * 0.3) {
      for (const other of world.within(entity.x, world.groundY, unit * 3, isHazardTarget(world))) {
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
    return true
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
    return true
  }

  if (entity.state === 'rooted') {
    entity.fx = (entity.data.chained ?? 0) > 0 ? 'chained' : 'rooted'
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
      entity.data.chained = 0
      entity.data.angry = 4
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
    entity.data.team = wildTeam
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
  size: [5.6, 6.6],
  state: 'patrol',
  style: dragonStyle,
  strongVs: ['knight', 'building'],
  tags: ['dragon'],
  weakTo: ['archer', 'ballista', 'wizard', 'projectile'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (tickDragonAilments(entity, world, dt)) {
      return
    }

    if (entity.state === 'fireball-burst') {
      tickDragonBurst(entity, world, dt)
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
      const targets = dragonShotTargets(entity, world).filter(
        (other) => entity.species === 'eastern-dragon' || Math.abs(other.x - entity.x) < unit * 34,
      )

      if (targets.length > 0) {
        const nearest = targets.reduce((best, other) =>
          Math.abs(other.x - entity.x) < Math.abs(best.x - entity.x) ? other : best,
        )

        startDragonBurst(entity, world, Math.random() < 0.6 ? nearest : pick(targets))
        return
      }

      entity.data.cool = entity.species === 'eastern-dragon' ? between(0.5, 1) : between(1, 2)
    }
  },
}

const dreadDragonAsset = ecoAsset('dragon-dread')
const dreadDragonBreathAsset = ecoAsset('dragon-dread-breath')
const dreadBreathDip = (44 * Math.PI) / 180
const dreadStrafeHeight = 14
const dreadStrafeFor = 1.8

function distanceToSegment(
  point: { x: number; y: number },
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const span = dx * dx + dy * dy || 1
  const along = clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / span, 0, 1)

  return Math.hypot(point.x - (from.x + dx * along), point.y - (from.y + dy * along))
}

// The jet leaves the mouth angled forward-down and stops where it licks the ground.
function dreadJet(entity: EcoEntity, world: EcoWorld) {
  const from = dragonMouth(entity, world)
  const angle = entity.facing > 0 ? dreadBreathDip : Math.PI - dreadBreathDip
  const drop = Math.max(world.unit, world.groundY - world.unit * 0.2 - from.y)
  const length = clamp(drop / Math.sin(dreadBreathDip), world.unit * 4, world.unit * 21)

  return {
    angle,
    from,
    length,
    to: { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length },
  }
}

function pickDreadTarget(entity: EcoEntity, world: EcoWorld) {
  const targets = dragonShotTargets(entity, world)
  const grounded = targets.filter((other) => onGround(other, world))
  const pool = grounded.length > 0 ? grounded : targets

  if (pool.length === 0) {
    return undefined
  }

  if (Math.random() < 0.35) {
    return pick(pool)
  }

  return pool.reduce((best, other) =>
    Math.abs(other.x - entity.x) < Math.abs(best.x - entity.x) ? other : best,
  )
}

function startDreadSwoop(entity: EcoEntity, world: EcoWorld, target: EcoEntity) {
  const unit = world.unit
  // Start far enough back that the angled jet sweeps across the target mid-strafe.
  const lead = unit * (dreadStrafeHeight / Math.tan(dreadBreathDip) + 5)
  const low = unit * 3
  const high = world.width - unit * 3
  let dir: 1 | -1 = entity.x <= target.x ? 1 : -1
  let startX = target.x - dir * lead

  if (startX < low || startX > high) {
    const flipped = target.x + dir * lead

    if (flipped >= low && flipped <= high) {
      dir = dir === 1 ? -1 : 1
      startX = flipped
    } else {
      startX = clamp(startX, low, high)
    }
  }

  const toY = Math.max(world.skyTop + unit * 3, world.groundY - unit * dreadStrafeHeight)
  entity.targetId = target.id
  entity.data.diveDir = dir
  entity.data.diveFromX = entity.x
  entity.data.diveFromY = entity.y
  entity.data.diveToX = startX
  entity.data.diveToY = toY
  entity.data.diveFor = clamp(Math.hypot(startX - entity.x, toY - entity.y) / (unit * 10), 0.9, 1.7)
  world.setState(entity, 'swoop')
}

function startDreadBreath(entity: EcoEntity, world: EcoWorld) {
  const mouth = dragonMouth(entity, world)
  world.setState(entity, 'breath')
  world.setAsset(entity, dreadDragonBreathAsset)
  entity.data.breathTick = 0.2
  entity.data.patchTick = 0.25
  world.spawn('dread-flame', {
    data: { ownerId: entity.id },
    facing: 1,
    size: 13,
    x: mouth.x,
    y: mouth.y,
  })
}

function scorchUnderDreadJet(entity: EcoEntity, world: EcoWorld, jet: ReturnType<typeof dreadJet>) {
  const unit = world.unit

  for (const other of world.entities) {
    if (
      !isTargetableFoe(entity, other) ||
      world.has(other, 'projectile') ||
      other.species === 'fireball'
    ) {
      continue
    }

    const body = bodyPoint(other, world)
    const inJet = distanceToSegment(body, jet.from, jet.to) < unit * 1.3
    const inSplash = onGround(other, world) && Math.abs(other.x - jet.to.x) < unit * 1.9

    if (!inJet && !inSplash) {
      continue
    }

    if (world.has(other, 'fuel')) {
      if ((other.data.burn ?? 0) <= 0) {
        other.data.burn = 0.01
      }
      continue
    }

    damageGroundTarget(other, world, 0.3, entity, 0.35)
    if (Math.random() < 0.4) {
      spawnImpact(world, body.x, body.y, 1.5, 'curse', 0.22)
    }
  }
}

function tickDreadDragon(entity: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit

  if (entity.state !== 'breath' && entity.asset === dreadDragonBreathAsset) {
    world.setAsset(entity, dreadDragonAsset)
  }

  if (tickDragonAilments(entity, world, dt)) {
    return
  }

  const dir = (entity.data.diveDir ?? entity.facing) >= 0 ? 1 : -1

  if (entity.state === 'swoop') {
    const progress = clamp(entity.t / (entity.data.diveFor ?? 1.2), 0, 1)
    const fromX = entity.data.diveFromX ?? entity.x
    const fromY = entity.data.diveFromY ?? entity.y
    const toX = entity.data.diveToX ?? entity.x
    const toY = entity.data.diveToY ?? entity.y
    // Drop steeply first, then level out into the strafe line.
    const desiredX = fromX + (toX - fromX) * progress
    const desiredY = fromY + (toY - fromY) * (1 - (1 - progress) ** 2)
    moveTowardPoint(entity, world, dt, desiredX, desiredY, 1)
    entity.facing = progress > 0.6 || Math.abs(toX - fromX) < unit ? dir : toX > fromX ? 1 : -1
    const dive = (Math.atan2(entity.vy, Math.max(unit, Math.abs(entity.vx))) * 180) / Math.PI
    entity.tilt += (clamp(dive * 0.7, -12, 34) - entity.tilt) * Math.min(1, dt * 8)

    if (progress >= 1) {
      startDreadBreath(entity, world)
    }
    return
  }

  if (entity.state === 'breath') {
    const holdY = entity.data.diveToY ?? world.groundY - unit * dreadStrafeHeight
    entity.facing = dir
    entity.vx += (dir * unit * 6.5 - entity.vx) * Math.min(1, dt * 5)
    entity.vy += ((holdY - entity.y) * 3 - entity.vy) * Math.min(1, dt * 5)
    integrate(entity, dt)
    entity.tilt += (9 + Math.sin(world.time * 16) * 1.5 - entity.tilt) * Math.min(1, dt * 8)
    const jet = dreadJet(entity, world)
    entity.data.breathTick = (entity.data.breathTick ?? 0) - dt
    entity.data.patchTick = (entity.data.patchTick ?? 0) - dt

    if ((entity.data.breathTick ?? 0) <= 0) {
      entity.data.breathTick = 0.14
      scorchUnderDreadJet(entity, world, jet)
    }

    if ((entity.data.patchTick ?? 0) <= 0) {
      entity.data.patchTick = 0.3
      const patch = world.spawn('green-flame', {
        data: { ownerTeam: teamOf(entity) },
        x: clamp(jet.to.x, unit, world.width - unit),
      })
      if (patch) patch.data.life = between(1.8, 2.8)
    }

    if (entity.t > dreadStrafeFor || entity.x < unit * 1.5 || entity.x > world.width - unit * 1.5) {
      world.setState(entity, 'climb')
    }
    return
  }

  if (entity.state === 'climb') {
    steer(
      entity,
      clamp(entity.x + dir * unit * 6, unit * 3, world.width - unit * 3),
      world.skyTop + unit * 3,
      unit * 7,
      dt,
      3,
    )
    integrate(entity, dt)
    faceTravel(entity)
    entity.tilt += (-14 - entity.tilt) * Math.min(1, dt * 6)

    if (entity.t > 1.4 || entity.y < world.height * 0.3) {
      entity.data.cool = between(4, 6)
      world.setState(entity, 'patrol')
    }
    return
  }

  wander(
    entity,
    world,
    dt,
    unit * ((entity.data.angry ?? 0) > 0 ? 3.6 : 2.4),
    world.skyTop + unit,
    world.height * 0.32,
    1.4,
  )
  integrate(entity, dt)
  faceTravel(entity)
  tiltToVelocity(entity, 12)
  keepInSky(entity, world)
  entity.data.cool = (entity.data.cool ?? 0) - dt

  if ((entity.data.cool ?? 0) <= 0) {
    const target = pickDreadTarget(entity, world)

    if (target) {
      startDreadSwoop(entity, world, target)
    } else {
      entity.data.cool = between(0.8, 1.4)
    }
  }
}

// One Clash-of-Clans-style dread dragon: swoops low and strafes with a green flamethrower.
const dreadDragon: EcoSpecies = {
  ...dragon,
  asset: dreadDragonAsset,
  init(entity, world) {
    entity.countAs = 'dread-dragon'
    entity.idle = 'flap'
    entity.size = between(7, 7.6)
    entity.data.team = wildTeam
    entity.hp = 26
    entity.maxHp = entity.hp
    entity.data.cool = between(1.6, 2.6)
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.3)
  },
  tick: tickDreadDragon,
}

const dreadFlame: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('dread-flame'),
  countAs: null,
  layer: 'front',
  size: [13, 13],
  state: 'burn',
  strongVs: [],
  // Uniform scale would fatten a long jet, so squash it back to a 15u jet's thickness.
  style: (entity) => ({
    '--jet-thin': String(Math.min(1, 15 / Math.max(1, entity.size * entity.scale))),
  }),
  tags: [],
  weakTo: [],
  tick(entity, world) {
    const owner = world.byId(entity.data.ownerId ?? -1)

    if (!owner || owner.dying || owner.removed || owner.state !== 'breath') {
      world.remove(entity)
      return
    }

    const jet = dreadJet(owner, world)
    const length = Math.max(
      world.unit * 0.4,
      jet.length * (1 - (1 - clamp(entity.age / 0.22, 0, 1)) ** 3),
    )
    entity.facing = 1
    entity.x = jet.from.x + Math.cos(jet.angle) * length * 0.5
    entity.y = jet.from.y + Math.sin(jet.angle) * length * 0.5
    entity.tilt = (jet.angle * 180) / Math.PI
    entity.scale = length / (entity.size * world.unit)
  },
}

const fireball: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('fireball'),
  countAs: null,
  init(entity) {
    entity.fx = 'dragon-shot'
  },
  layer: 'front',
  size: [1.9, 2.1],
  state: 'fly',
  strongVs: ['archer', 'building', 'burnable', 'princess', 'wizard'],
  tags: ['fireball', 'projectile', 'fire'],
  weakTo: ['knight'],
  tick(entity, world, dt) {
    const unit = world.unit

    integrate(entity, dt)
    entity.facing = entity.vx >= 0 ? 1 : -1
    tiltToVelocity(entity, 90)

    if (
      entity.t > 1.8 ||
      entity.x < -unit * 3 ||
      entity.x > world.width + unit * 3 ||
      entity.y < -unit * 3
    ) {
      world.remove(entity)
      return
    }

    const wall = world.nearest(
      entity,
      (other) =>
        world.has(other, 'building') &&
        shielded(other, world) &&
        fireballHits(entity, other, world),
      unit * 6,
    )

    if (wall) {
      wall.data.flash = 0.4
      wall.data.fizzleUntil = world.time + 0.4
      spawnImpact(world, entity.x, entity.y, 1.6, 'shield', 0.3)
      world.remove(entity)
      return
    }

    const hit = dragonShotTargets(entity, world).find((other) => fireballHits(entity, other, world))

    if (hit) {
      if (
        world.has(hit, 'knight') &&
        (hit.state === 'guard' || hit.state === 'parry') &&
        Math.sign(entity.x - hit.x || 1) === hit.facing
      ) {
        hit.fx = 'block'
        hit.data.block = 0.45
        spawnImpact(world, entity.x, entity.y, 1.5, 'slash', 0.26)
      } else if (world.has(hit, 'fuel')) {
        spawnImpact(world, entity.x, entity.y, 1.8, 'fire', 0.32)

        if (Math.random() < 0.3) {
          hit.data.burn = Math.max(hit.data.burn ?? 0, 0.01)
        }
      } else {
        spawnImpact(world, entity.x, entity.y, 1.8, 'fire', 0.32)
        damageGroundTarget(hit, world, 0.55, entity, 0.9)
      }

      world.remove(entity)
      return
    }

    if (entity.y >= world.groundY - unit * 0.15) {
      spawnImpact(world, entity.x, world.groundY - unit * 0.4, 1.5, 'fire', 0.3)
      world.remove(entity)
    }
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
  if (world.has(attacker, 'fire')) return 'burn'
  if (attacker.fx === 'frost' || attacker.state === 'ice-beam') return 'frozen'
  if (attacker.species === 'sky-vine' || attacker.fx === 'plant' || attacker.fx === 'vine')
    return 'rooted'

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
    (isDragonOrLord(world)(other) ||
      world.has(other, 'knight') ||
      world.has(other, 'wizard') ||
      other.species === 'dark-lord-skeleton') &&
    (!attacker || isEnemy(attacker, other))
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
        const originY = entity.y - world.heightOf(entity) * 0.5
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

const dragonControls = {
  abilities: [
    siegeAbility({
      active: 0.14,
      cooldown: 0.3,
      description: 'Spit a quick fireball at the nearest foe ahead. Tap again to keep them coming.',
      icon: 'flame',
      key: 'q',
      name: 'Fireball',
      radius: 26,
      recovery: 0.08,
      shape: 'line',
      state: 'fire-spit',
      width: 1.6,
      windup: 0.08,
      onRun(entity, world) {
        const unit = world.unit
        const target = world.nearest(
          entity,
          (other) =>
            dragonShotTargets(entity, world).includes(other) &&
            Math.sign(other.x - entity.x || entity.facing) === entity.facing,
          unit * 34,
        )
        const point = target
          ? dragonShotAim(target, world, dragonMouth(entity, world))
          : { x: entity.x + entity.facing * unit * 14, y: entity.y + unit * 6 }

        shootDragonFireball(entity, world, point)
      },
    }),
  ],
  idleState: 'patrol',
  move: 'fly',
  moveState: 'patrol',
  speed: 20,
} as const

dragon.controls = dragonControls

const emberDragon = { ...dragon, asset: ecoAsset('dragon-western-ember') }
const emeraldDragon = { ...dragon, asset: wyvernGlideAsset }
const frostDragon = { ...dragon, asset: ecoAsset('dragon-western-frost') }
const easternDragon = { ...dragon, asset: ecoAsset('dragon-eastern-jade') }

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
      entity.size = between(5.1, 6)
      world.setAsset(entity, mountedKnightAsset)
    }

    entity.data.abilityCool =
      (entity.data.mounted ?? 0) > 0 ? between(0.15, 0.45) : between(0.8, 1.6)
  },
  layer: 'front',
  size: [2.8, 3.4],
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
  size: [2.6, 3.25],
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
  size: [2.6, 3.15],
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
        const originY = entity.y - world.heightOf(entity) * 0.5
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
  size: [1.5, 1.9],
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
  size: [1.45, 1.75],
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
    asset: ecoAsset('wizard-pyromancer'),
    castAsset: ecoAsset('wizard-pyromancer-cast'),
    code: 1,
    glow: 'rgba(255, 166, 94, 0.98)',
    rune: 'rgba(255, 217, 102, 0.86)',
    species: 'pyro-wizard',
  },
  {
    asset: ecoAsset('wizard-frost'),
    castAsset: ecoAsset('wizard-frost-cast'),
    code: 2,
    glow: 'rgba(216, 244, 255, 0.98)',
    rune: 'rgba(143, 210, 230, 0.84)',
    species: 'frost-wizard',
  },
  {
    asset: ecoAsset('wizard-druid'),
    castAsset: ecoAsset('wizard-druid-cast'),
    code: 3,
    glow: 'rgba(168, 218, 130, 0.95)',
    rune: 'rgba(119, 170, 82, 0.84)',
    species: 'plant-wizard',
  },
] as const

type WizardCode = (typeof wizardTypes)[number]['code']

const wizardSpellStates = ['meteor-seeds', 'ice-beam', 'frenzy-plant'] as const

const isWizardCasting = (state: string) => wizardSpellStates.some((spell) => spell === state)

const wizardTypeFor = (entity: EcoEntity) =>
  wizardTypes.find((entry) => entry.code === (entity.data.wizardType ?? 1)) ?? wizardTypes[0]

const wizardTypeFromAsset = (asset: string) =>
  wizardTypes.find((entry) => entry.asset === asset || entry.castAsset === asset) ?? wizardTypes[0]

function wizardChargeFx(spell: string) {
  if (spell === 'ice-beam') return 'frost'
  if (spell === 'frenzy-plant') return 'vine'
  if (spell === 'meteor-seeds') return 'fire'

  return 'arcane'
}

const staffPoint = (entity: EcoEntity, world: EcoWorld) => ({
  x: entity.x + entity.facing * world.widthOf(entity) * 0.32,
  y: entity.y - entity.lift - world.heightOf(entity) * 0.82,
})

const bodyPoint = (entity: EcoEntity, world: EcoWorld) => ({
  x: entity.x,
  y:
    entity.anchor === 'center'
      ? entity.y - entity.lift
      : entity.y - entity.lift - world.heightOf(entity) * 0.48,
})

const impactArt: Record<string, string> = {
  fire: ecoAsset('impact-fire'),
  frost: ecoAsset('impact-frost'),
  'ice-beam': ecoAsset('impact-frost'),
  thorn: ecoAsset('impact-thorn'),
  vine: ecoAsset('impact-thorn'),
}

function spawnImpact(world: EcoWorld, x: number, y: number, size: number, fx: string, life = 0.55) {
  const impact = world.spawn('spell-impact', { data: { life }, size, x, y })

  if (impact) {
    impact.fx = fx
    const art = impactArt[fx]
    if (art) world.setAsset(impact, art)
  }

  return impact
}

function spawnBeam(
  world: EcoWorld,
  species: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  life = 0.16,
  fx = '',
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(world.unit * 0.8, Math.hypot(dx, dy))
  const beam = world.spawn(species, {
    data: { life },
    facing: 1,
    size: length / world.unit,
    x: from.x + dx * 0.5,
    y: from.y + dy * 0.5,
  })

  if (beam) {
    beam.tilt = (Math.atan2(dy, dx) * 180) / Math.PI
    beam.fx = fx
  }

  return beam
}

let lastSpellCollisionAt = -1

function spellMatter(entity: EcoEntity, world: EcoWorld) {
  if (world.has(entity, 'fire')) return 'fire'
  if (entity.species === 'vine-snare' || entity.species === 'sky-vine') return 'plant'
  if (
    entity.species === 'green-flame' ||
    entity.species === 'dark-lord-serpent' ||
    entity.species === 'dark-lord-skull-bolt'
  )
    return 'green-fire'
  if (entity.species === 'arrow' || entity.species === 'bolt' || entity.species === 'arrow-volley')
    return 'arrow'
  if (world.has(entity, 'projectile')) return entity.species

  return ''
}

function spellCollisionCandidate(entity: EcoEntity, world: EcoWorld) {
  return (
    (world.has(entity, 'projectile') && !homingShots.has(entity.species)) ||
    entity.species === 'vine-snare' ||
    entity.species === 'sky-vine'
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

function handleSpellCollision(a: EcoEntity, b: EcoEntity, world: EcoWorld) {
  const kindA = spellMatter(a, world)
  const kindB = spellMatter(b, world)

  if (!kindA || !kindB) return false

  const x = (a.x + b.x) * 0.5
  const y = (a.y + b.y) * 0.5
  const pair = [kindA, kindB].sort().join(':')

  if (kindA === kindB) {
    spawnImpact(world, x, y, 2.1, 'duel', 0.45)
    cancelSpell(a, world)
    cancelSpell(b, world)
    return true
  }

  if (pair === 'fire:plant') {
    const plant = kindA === 'plant' ? a : b
    plant.fx = 'burn'
    plant.data.wither = Math.max(plant.data.wither ?? 0, 0.01)
    spawnImpact(world, x, y, 2.5, 'fire', 0.46)
    cancelSpell(kindA === 'fire' ? a : b, world)
    if (plant.species !== 'sky-vine') cancelSpell(plant, world)
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

const darkLordWard = 0.35

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

  // His ward soaks most ranged and spell damage; a knight's blade cuts straight through.
  const ward = attacker && !world.has(attacker, 'knight') ? darkLordWard : 1
  const edge =
    (attacker ? world.edge(attacker, entity) : 1) * (entity.state === 'toad' ? 2 : 1) * ward
  entity.hp -= amount * edge
  if (attacker) {
    world.gainControlResource(attacker, amount * edge * 12)
    world.gainControlResource(entity, amount * edge * 8)
  }
  entity.data.hurt = 0.55
  entity.fx = 'hurt'

  // A stream of small shots shouldn't strobe a big burst on every hit.
  if (world.time - (entity.data.hitFxAt ?? -9) > 0.4) {
    entity.data.hitFxAt = world.time
    spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.6, 2.8, 'curse-hit', 0.58)
  }

  if (entity.hp <= 0) {
    entity.fx = 'ash'
    world.kill(entity)
    return
  }

  if ((entity.data.teleportCool ?? 0) <= 0) {
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

function wizardSignatureStateForCode(code: number) {
  if (code === 2) return 'ice-beam'
  if (code === 3) return 'frenzy-plant'

  return 'meteor-seeds'
}

function wizardCastLength(state: string) {
  if (state === 'meteor-seeds') return 2.3
  if (state === 'frenzy-plant') return 1.5

  return 2.9
}

function wizardSpellName(code: WizardCode) {
  if (code === 2) return 'Ice beam'
  if (code === 3) return 'Wild thorns'

  return 'Meteor seeds'
}

function wizardSpellDescription(code: WizardCode) {
  if (code === 2)
    return 'Channel a freezing beam. Keep it on a dragon long enough and it freezes solid.'
  if (code === 3)
    return 'Fire thorns at flyers, burst sharp thorns from the floor under walkers, or plant a fighting sapling.'

  return 'Rapid-fire a volley of tiny meteors from the wand.'
}

function activeSignatureCaster(entity: EcoEntity) {
  return (
    !entity.dying &&
    !entity.removed &&
    worldlessSpecies.has(entity.species) === false &&
    (entity.countAs === 'wizard' ||
      entity.species === 'wizard' ||
      entity.species.endsWith('-wizard')) &&
    entity.state === 'ice-beam' &&
    entity.t > 0.58
  )
}

let lastWizardClashAt = -1

function updateWizardClashes(world: EcoWorld, dt: number) {
  if (Math.abs(lastWizardClashAt - world.time) < 0.0001) return

  lastWizardClashAt = world.time
  const unit = world.unit
  const casters = world.entities.filter(activeSignatureCaster)

  for (const left of casters) {
    if (left.facing !== 1) continue

    const right = world.nearest(
      left,
      (other) =>
        activeSignatureCaster(other) &&
        other.facing === -1 &&
        other.x > left.x &&
        isEnemy(left, other),
      unit * 38,
    )

    if (!right) continue

    const leftTeam = teamOf(left)
    const rightTeam = teamOf(right)
    const existing = world.nearest(
      { x: (left.x + right.x) * 0.5, y: world.groundY - unit * 4 },
      (other) =>
        other.species === 'spell-clash' &&
        ((other.data.leftTeam === leftTeam && other.data.rightTeam === rightTeam) ||
          (other.data.leftTeam === rightTeam && other.data.rightTeam === leftTeam)),
      unit * 22,
    )

    if (!existing) {
      world.spawn('spell-clash', {
        data: { leftTeam, life: 4, rightTeam },
        size: 2.8,
        x: (left.x + right.x) * 0.5,
        y: (staffPoint(left, world).y + staffPoint(right, world).y) * 0.5,
      })
    }
  }

  for (const clash of world.entities.filter((entity) => entity.species === 'spell-clash')) {
    const leftTeam = clash.data.leftTeam ?? 0
    const rightTeam = clash.data.rightTeam ?? 0
    const leftCasters = casters.filter(
      (caster) =>
        teamOf(caster) === leftTeam &&
        caster.facing === 1 &&
        caster.x < clash.x + unit * 2 &&
        Math.abs(caster.x - clash.x) < unit * 38,
    )
    const rightCasters = casters.filter(
      (caster) =>
        teamOf(caster) === rightTeam &&
        caster.facing === -1 &&
        caster.x > clash.x - unit * 2 &&
        Math.abs(caster.x - clash.x) < unit * 38,
    )

    if (leftCasters.length === 0 || rightCasters.length === 0) {
      spawnImpact(world, clash.x, clash.y, 2.2, 'duel', 0.32)
      world.remove(clash)
      continue
    }

    const leftAverage = leftCasters.reduce((sum, caster) => sum + staffPoint(caster, world).y, 0)
    const rightAverage = rightCasters.reduce((sum, caster) => sum + staffPoint(caster, world).y, 0)
    clash.y = (leftAverage / leftCasters.length + rightAverage / rightCasters.length) * 0.5
    clash.x += (leftCasters.length - rightCasters.length) * unit * 1.6 * dt
    if (leftCasters.length === rightCasters.length) {
      clash.x += Math.sin(world.time * 18 + clash.id) * unit * 0.08
    }
    clash.fx = leftCasters.length === rightCasters.length ? 'hold' : 'push'

    const rightEdge = Math.min(...rightCasters.map((caster) => caster.x))
    const leftEdge = Math.max(...leftCasters.map((caster) => caster.x))

    if (clash.x > rightEdge - unit * 1.2) {
      for (const caster of rightCasters) {
        caster.fx = 'stagger'
        caster.vx += unit * 3.6
        damageGroundTarget(caster, world, 0.65, leftCasters[0] ?? clash, 2.4)
        world.setAsset(caster, wizardTypeFor(caster).asset)
        world.setState(caster, 'wander')
      }
      spawnImpact(world, clash.x, clash.y, 3.4, 'duel', 0.62)
      world.remove(clash)
    } else if (clash.x < leftEdge + unit * 1.2) {
      for (const caster of leftCasters) {
        caster.fx = 'stagger'
        caster.vx -= unit * 3.6
        damageGroundTarget(caster, world, 0.65, rightCasters[0] ?? clash, 2.4)
        world.setAsset(caster, wizardTypeFor(caster).asset)
        world.setState(caster, 'wander')
      }
      spawnImpact(world, clash.x, clash.y, 3.4, 'duel', 0.62)
      world.remove(clash)
    } else if (clash.t > (clash.data.life ?? 4)) {
      for (const caster of [...leftCasters, ...rightCasters]) {
        caster.vx += (caster.x < clash.x ? -1 : 1) * unit * 2.8
        caster.fx = 'stagger'
        world.setAsset(caster, wizardTypeFor(caster).asset)
        world.setState(caster, 'wander')
      }
      spawnImpact(world, clash.x, clash.y, 3.2, 'duel', 0.58)
      world.remove(clash)
    }
  }
}

function wizardClashFor(entity: EcoEntity, world: EcoWorld) {
  const team = teamOf(entity)

  return world.nearest(
    entity,
    (other) =>
      other.species === 'spell-clash' &&
      (other.data.leftTeam === team || other.data.rightTeam === team) &&
      Math.sign(other.x - entity.x || entity.facing) === entity.facing,
    world.unit * 40,
  )
}

// Meteor seeds fly 24u/s for 2.2s, so keep casts inside what they can actually reach.
const wizardSpellRange = 44

function wizardSpellTarget(entity: EcoEntity, world: EcoWorld) {
  const target = world.byId(entity.targetId)

  return target && !target.dying && !target.removed && target.state !== 'falling' ? target : null
}

function castMeteorSeed(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  if ((entity.data.beamPulse ?? 0) > world.time) return

  const unit = world.unit
  const origin = staffPoint(entity, world)
  const speed = unit * 24
  const aim = target
    ? leadBody(target, world, origin, speed)
    : { x: origin.x + entity.facing * unit * 16, y: origin.y }
  const angle = Math.atan2(aim.y - origin.y, aim.x - origin.x) + between(-0.07, 0.07)

  entity.data.beamPulse = world.time + 0.15
  world.spawn('fire-seed', {
    data: { ownerId: entity.id, ownerTeam: teamOf(entity), targetId: target?.id ?? -1 },
    facing: Math.cos(angle) >= 0 ? 1 : -1,
    size: between(1.5, 1.8),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    x: origin.x,
    y: origin.y,
  })
  spawnImpact(world, origin.x, origin.y, 1.1, 'fire', 0.14)
}

function pulseIceBeam(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  const unit = world.unit
  const clash = wizardClashFor(entity, world)
  const origin = staffPoint(entity, world)
  const end = clash
    ? { x: clash.x, y: clash.y }
    : target
      ? bodyPoint(target, world)
      : { x: origin.x + entity.facing * unit * 18, y: origin.y }

  if ((entity.data.beamPulse ?? 0) <= world.time) {
    entity.data.beamPulse = world.time + 0.08
    spawnBeam(world, 'duel-beam-good', origin, end, 0.14, 'ice-beam')
  }

  if (clash || !target || (entity.data.sigTick ?? 0) > world.time) return

  entity.data.sigTick = world.time + 0.28
  spawnImpact(world, end.x, end.y, 1.9, 'frost', 0.3)
  damageGroundTarget(target, world, 0.3, entity, 0.4)

  if (world.has(target, 'dragon')) {
    if (world.time - (target.data.chillAt ?? -9) > 1.5) target.data.chill = 0
    target.data.chillAt = world.time
    target.data.chill = (target.data.chill ?? 0) + 1

    if ((target.data.chill ?? 0) >= 5 && target.state !== 'frozen') {
      target.data.chill = 0
      target.data.freezeFor = 1.8
      target.fx = 'frozen'
      world.setState(target, 'frozen')
    }
  } else {
    target.data.slowUntil = Math.max(target.data.slowUntil ?? 0, world.time + 1.5)
    target.fx = 'frozen'
  }
}

function growSkyVine(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  const x = target?.x ?? entity.x + entity.facing * world.unit * 10

  world.spawn('sky-vine', {
    data: { depth: 0, ownerId: entity.id, ownerTeam: teamOf(entity), vineTarget: target?.id ?? -1 },
    x: clamp(x, world.unit, world.width - world.unit),
    y: world.groundY,
  })
  spawnImpact(world, x, world.groundY - world.unit * 0.6, 2.2, 'vine', 0.5)
}

function shootThorn(
  owner: EcoEntity,
  world: EcoWorld,
  from: { x: number; y: number },
  target: EcoEntity | null,
) {
  const unit = world.unit
  const speed = unit * 30
  const aim = target
    ? leadBody(target, world, from, speed)
    : { x: from.x + owner.facing * unit * 16, y: from.y - unit * 2 }
  const angle = Math.atan2(aim.y - from.y, aim.x - from.x) + between(-0.05, 0.05)

  world.spawn('plant-thorn', {
    data: { ownerId: owner.id, ownerTeam: teamOf(owner), targetId: target?.id ?? -1 },
    facing: Math.cos(angle) >= 0 ? 1 : -1,
    size: between(1.15, 1.35),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    x: from.x,
    y: from.y,
  })
}

// Sharp thorns burst out of the floor one after another, racing toward a ground foe.
function eruptThornLine(entity: EcoEntity, world: EcoWorld, target: EcoEntity) {
  const unit = world.unit
  const direction = target.x >= entity.x ? 1 : -1
  const start = entity.x + direction * unit * 1.6
  const end = target.x + direction * unit * 1.4
  const count = clamp(Math.ceil(Math.abs(end - start) / (unit * 1.2)), 3, 16)

  for (let index = 0; index < count; index += 1) {
    world.spawn('thorn-spike', {
      data: { delay: index * 0.05, ownerId: entity.id, ownerTeam: teamOf(entity) },
      facing: direction,
      size: between(1.1, 1.35) * (index === count - 1 ? 1.4 : 1),
      x: clamp(start + ((end - start) * index) / (count - 1), unit, world.width - unit),
      y: world.groundY,
    })
  }
}

function plantThornSapling(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  const unit = world.unit
  const direction = target ? (target.x >= entity.x ? 1 : -1) : entity.facing
  const x = clamp(entity.x + direction * unit * between(2.4, 3.4), unit * 2, world.width - unit * 2)

  world.spawn('thorn-sapling', {
    data: { ownerId: entity.id, ownerTeam: teamOf(entity) },
    facing: direction,
    x,
    y: world.groundY,
  })
  spawnImpact(world, x, world.groundY - unit * 0.5, 1.8, 'dust', 0.4)
}

const plantVolley = 1
const plantSnare = 2
const plantEruption = 3
const plantSapling = 4

function castWildThorns(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  if (!(entity.data.casted ?? 0)) {
    entity.data.casted = 1
    const flying = !!target && (world.has(target, 'dragon') || !onGround(target, world))
    const hasSapling = world.entities.some(
      (other) =>
        other.species === 'thorn-sapling' &&
        other.data.ownerId === entity.id &&
        !other.dying &&
        !other.removed,
    )

    if (!hasSapling && (entity.data.saplingAt ?? 0) <= world.time && Math.random() < 0.5) {
      entity.data.saplingAt = world.time + 12
      entity.data.plantMove = plantSapling
      plantThornSapling(entity, world, target)
    } else if (flying && (entity.data.vineAt ?? 0) <= world.time && Math.random() < 0.35) {
      entity.data.vineAt = world.time + 8
      entity.data.plantMove = plantSnare
      growSkyVine(entity, world, target)
    } else if (target && !flying) {
      entity.data.plantMove = plantEruption
      eruptThornLine(entity, world, target)
    } else {
      entity.data.plantMove = plantVolley
    }
  }

  if (entity.data.plantMove !== plantVolley || (entity.data.beamPulse ?? 0) > world.time) return

  const origin = staffPoint(entity, world)
  entity.data.beamPulse = world.time + 0.13
  shootThorn(entity, world, origin, target)
  spawnImpact(world, origin.x, origin.y, 0.9, 'thorn', 0.14)
}

// When the first target dies or starts falling, swing to the next enemy instead of
// firing blindly into the sky.
function reacquireWizardTarget(entity: EcoEntity, world: EcoWorld) {
  const unit = world.unit
  const next = casterTruce
    ? world.nearest(entity, isDragon(world), wizardSpellRange * unit)
    : world.nearest(
        entity,
        (other) => isSpellDuelTarget(world, entity)(other) && other.state !== 'falling',
        wizardSpellRange * unit,
      )

  entity.targetId = next?.id ?? null

  return next
}

function tickWizardSignature(entity: EcoEntity, world: EcoWorld, retarget = false) {
  const target =
    wizardSpellTarget(entity, world) ?? (retarget ? reacquireWizardTarget(entity, world) : null)

  if (retarget && !target) return false

  if (target) {
    entity.facing = target.x >= entity.x ? 1 : -1
  }

  if (entity.state === 'meteor-seeds') {
    if (entity.t < 2.1) castMeteorSeed(entity, world, target)
  } else if (entity.state === 'ice-beam') {
    pulseIceBeam(entity, world, target)
  } else if (entity.state === 'frenzy-plant') {
    castWildThorns(entity, world, target)
  }

  return true
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
  entity.data.sigTick = 0
  entity.data.spellCool = cooldown
  entity.fx = spell
  world.setAsset(entity, wizardTypeFor(entity).castAsset)
  const charge = staffPoint(entity, world)
  spawnImpact(world, charge.x, charge.y, 1.8, wizardChargeFx(spell), 0.42)
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

const wizard: EcoSpecies = {
  anchor: 'bottom',
  asset: () => pick(wizardTypes).asset,
  hp: 2,
  idle: 'sway',
  init(entity) {
    const type = wizardTypeFromAsset(entity.asset)

    entity.species = type.species
    entity.countAs = 'wizard'
    entity.data.wizardType = type.code
    entity.data.team = wizardTeamBase + type.code
    entity.data.spellCool = between(0.4, 1)
  },
  layer: 'front',
  size: [2.6, 3.15],
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

    refreshCasterTruce(world)
    runSpellCollisionPass(world)
    updateWizardClashes(world, dt)

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

      const lostTarget = entity.t > 0.58 && !tickWizardSignature(entity, world, true)

      if (lostTarget || entity.t > wizardCastLength(entity.state)) {
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

    const dragonFoe = casterTruce
      ? world.nearest(entity, isDragon(world), Math.max(unit * 80, world.width * 1.5))
      : null

    if (dragonFoe) {
      const inRange =
        Math.hypot(dragonFoe.x - entity.x, dragonFoe.y - entity.y) < unit * wizardSpellRange

      if ((entity.data.spellCool ?? 0) <= 0 && inRange) {
        entity.facing = dragonFoe.x >= entity.x ? 1 : -1
        startWizardSpell(
          entity,
          world,
          wizardSignatureStateForCode(type.code),
          dragonFoe,
          between(1, 1.8),
        )
        return
      }

      const standoff = dragonFoe.x + (entity.x < dragonFoe.x ? -1 : 1) * unit * 8

      if (Math.abs(standoff - entity.x) > unit * 2) {
        walkToward(entity, world, clamp(standoff, unit * 2, world.width - unit * 2), unit * 1.4, dt)
        hop(entity, dt, unit * 0.08, 3)
      } else {
        settle(entity, dt)
        entity.facing = dragonFoe.x >= entity.x ? 1 : -1
      }
      return
    }

    const foe = world.nearest(
      entity,
      (other) =>
        isSpellDuelTarget(world, entity)(other) &&
        Math.abs(other.x - entity.x) < Math.max(unit * 54, world.width * 0.72),
      Math.max(unit * 56, world.width),
    )

    if (foe && (entity.data.spellCool ?? 0) <= 0) {
      entity.facing = foe.x >= entity.x ? 1 : -1

      if (Math.hypot(foe.x - entity.x, foe.y - entity.y) > unit * wizardSpellRange) {
        walkToward(entity, world, foe.x, unit * 1.4, dt)
        hop(entity, dt, unit * 0.08, 3)
        return
      }

      startWizardSpell(
        entity,
        world,
        wizardSignatureStateForCode(type.code),
        foe,
        between(1.2, 2.2),
      )
      return
    }

    walk(entity, world, dt, unit * 0.62)
    hop(entity, dt, unit * 0.08, 3)

    if (chance(0.06, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const signatureWizardControlsFor = (code: WizardCode) =>
  ({
    abilities: [
      siegeAbility({
        active: 2.45,
        cooldown: 0,
        description: wizardSpellDescription(code),
        icon: 'spell',
        key: 'q',
        name: wizardSpellName(code),
        radius: 18,
        recovery: 0.25,
        shape: 'line',
        state: wizardSignatureStateForCode(code),
        vfx: 'charge',
        width: code === 3 ? 2.4 : 3.4,
        windup: 0.6,
        onRun(entity, world, context) {
          const point = controlCastPoint(entity, world, context)
          const target =
            world.nearest(point, isSpellDuelTarget(world, entity), world.unit * 14) ??
            frontTarget(entity, world, world.unit * 22, 10) ??
            world.nearest(
              entity,
              (other) =>
                isSpellDuelTarget(world, entity)(other) &&
                Math.sign(other.x - entity.x || entity.facing) === entity.facing,
              world.unit * 40,
            )
          startWizardSpell(entity, world, wizardSignatureStateForCode(code), target, 0.6)
        },
        onTick(entity, world) {
          updateWizardClashes(world, 1 / 60)
          if (entity.t > 0.58 && isWizardCasting(entity.state)) {
            tickWizardSignature(entity, world)
          }
        },
      }),
    ],
    idleState: 'wander',
    move: 'ground',
    moveState: 'wander',
    speed: 11,
  }) as const

const wizardSpeciesFor = (code: WizardCode) => ({
  ...wizard,
  asset: (wizardTypes.find((type) => type.code === code) ?? wizardTypes[0]).asset,
  controls: signatureWizardControlsFor(code),
})

const pyroWizard = wizardSpeciesFor(1)
const frostWizard = wizardSpeciesFor(2)
const plantWizard = wizardSpeciesFor(3)

const darkLordToadAsset = ecoAsset('dark-lord-toad')
const darkLordCastStates = ['serpent', 'chains', 'thralls', 'hex', 'green-fire', 'betray'] as const
const maxThralls = 3

const isLiveDragon = (world: EcoWorld) => (other: EcoEntity) =>
  isDragon(world)(other) && !other.dying && !other.removed

function aliveTarget(world: EcoWorld, id: number | null | undefined) {
  const target = world.byId(id ?? -1)

  return target && !target.dying && !target.removed && target.state !== 'falling' ? target : null
}

function lowestDragon(world: EcoWorld) {
  return world.entities
    .filter(isLiveDragon(world))
    .reduce<EcoEntity | null>((low, dragon) => (!low || dragon.y > low.y ? dragon : low), null)
}

function isCastleVictim(world: EcoWorld, lord: EcoEntity) {
  return (other: EcoEntity) =>
    (world.has(other, 'knight') || other.species === 'archer') &&
    other.species !== 'frog-prince' &&
    isEnemy(lord, other)
}

function finishDarkSpell(entity: EcoEntity, world: EcoWorld) {
  entity.targetId = null
  entity.fx = (entity.data.smoke ?? 0) > 0 ? 'smoke' : ''
  entity.data.casted = 0
  world.setAsset(entity, darkLordAsset)
  world.setState(entity, 'stalk')
}

function soulHarvest(lord: EcoEntity | null, world: EcoWorld, from: EcoEntity) {
  if (!lord || lord.dying || lord.removed) return

  spawnBeam(world, 'duel-beam-dark', bodyPoint(from, world), staffPoint(lord, world), 0.5, 'curse')
  lord.hp = Math.min(lord.maxHp, lord.hp + 0.5)
}

const tetherReach = 0.3
// The chain art is 24:1, so this sets how thick the drawn chain is (in units).
const tetherThickness = 0.55

// Gravechains: one slim chain flies from the staff like a hook, latches on, and holds.
function castGravechains(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  if (!(entity.data.casted ?? 0)) {
    if (entity.t < 0.35) return

    if (!target) {
      finishDarkSpell(entity, world)
      return
    }

    const from = staffPoint(entity, world)
    entity.data.casted = 1
    entity.data.hookAt = entity.t + tetherReach
    world.spawn('dark-tether', {
      data: { lordId: entity.id, preyId: target.id },
      facing: 1,
      size: tetherThickness * 24,
      x: from.x,
      y: from.y,
    })
    return
  }

  if (entity.data.casted === 1) {
    if (entity.t < (entity.data.hookAt ?? 0)) return

    if (!target) {
      finishDarkSpell(entity, world)
      return
    }

    entity.data.casted = 2
    entity.data.chainEnd = entity.t + (world.has(target, 'dragon') ? 2.4 : 1.6)
    const grip = bodyPoint(target, world)
    spawnImpact(world, grip.x, grip.y, 1.4, 'curse', 0.36)

    if (world.has(target, 'dragon')) {
      target.data.rootFor = 2.4
      target.data.chained = 1
      target.fx = 'chained'
      world.setState(target, 'rooted')
      hurt(target, world, 0.6, false, entity)
    } else {
      damageGroundTarget(target, world, 0.5, entity)
      target.data.spellCool = Math.max(target.data.spellCool ?? 0, 1.6)
      target.data.slowUntil = Math.max(target.data.slowUntil ?? 0, world.time + 1.6)
      if (world.has(target, 'wizard') && isWizardCasting(target.state)) {
        target.targetId = null
        target.fx = 'chained'
        world.setAsset(target, wizardTypeFor(target).asset)
        world.setState(target, 'wander')
      }
    }
  }

  if (!target || entity.t > (entity.data.chainEnd ?? 0)) {
    finishDarkSpell(entity, world)
  }
}

function raiseThralls(entity: EcoEntity, world: EcoWorld, target: EcoEntity | null) {
  if ((entity.data.casted ?? 0) || entity.t < 1) return

  entity.data.casted = 1
  const unit = world.unit
  const alive = world.entities.filter(
    (other) => other.species === 'dark-lord-skeleton' && !other.dying && !other.removed,
  ).length
  const x = target?.x ?? entity.x + entity.facing * unit * 4

  for (let index = 0; index < Math.min(2, maxThralls - alive); index += 1) {
    const at = clamp(x + (index === 0 ? -1.6 : 1.6) * unit, unit, world.width - unit)
    world.spawn('dark-lord-skeleton', { facing: at < x ? 1 : -1, x: at })
    spawnImpact(world, at, world.groundY - unit * 0.4, 2.2, 'dust', 0.6)
  }
}

const darkLord: EcoSpecies = {
  anchor: 'bottom',
  asset: darkLordAsset,
  hp: 5,
  idle: 'sway',
  init(entity) {
    entity.data.chainCool = between(0.6, 1.4)
    entity.data.fireCool = between(2, 3)
    entity.data.hexCool = between(2, 3.5)
    entity.data.serpentCool = between(1.2, 2.4)
    entity.data.spellCool = between(0.7, 1.4)
    entity.data.thrallCool = between(3, 5)
  },
  layer: 'front',
  size: [1.7, 2.1],
  state: 'stalk',
  style: siegeTeamStyle,
  strongVs: ['princess', 'archer'],
  tags: ['dark-lord', 'burnable'],
  weakTo: ['wizard', 'archer', 'knight'],
  tick(entity, world, dt) {
    const unit = world.unit

    refreshCasterTruce(world)
    for (const cool of [
      'chainCool',
      'fireCool',
      'hexCool',
      'serpentCool',
      'spellCool',
      'teleportCool',
      'thrallCool',
    ]) {
      entity.data[cool] = (entity.data[cool] ?? 0) - dt
    }
    entity.data.smoke = Math.max(0, (entity.data.smoke ?? 0) - dt)
    entity.data.hurt = Math.max(0, (entity.data.hurt ?? 0) - dt)

    if (entity.hp <= 0) {
      entity.fx = 'ash'
      world.kill(entity)
      return
    }

    if (entity.state === 'toad') {
      world.setAsset(entity, darkLordToadAsset)
      entity.fx = 'toad'
      walk(entity, world, dt, unit * 0.4)
      hop(entity, dt, unit * 0.3, 5)

      if (entity.t > 3) {
        spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.5, 3, 'smoke', 0.6)
        finishDarkSpell(entity, world)
      }
      return
    }

    if (darkLordCastStates.some((spell) => spell === entity.state)) {
      world.setAsset(entity, darkLordCastAsset)
      settle(entity, dt)
      entity.fx = entity.state
      const target = aliveTarget(world, entity.targetId)

      if (target) {
        entity.facing = target.x >= entity.x ? 1 : -1
      }

      if (entity.state === 'betray') {
        if (!(entity.data.casted ?? 0)) {
          entity.data.casted = 1
          const head = { x: entity.x, y: entity.y - world.heightOf(entity) * 0.6 }
          spawnImpact(world, head.x, head.y, 3.6, 'curse', 0.7)
          spawnImpact(world, entity.x, world.groundY - unit * 0.6, 3, 'smoke', 0.6)
        }
        if (entity.t > 1.2) finishDarkSpell(entity, world)
        return
      }

      if (entity.state === 'chains') {
        castGravechains(entity, world, target)
        return
      }

      if (entity.state === 'thralls') {
        if (entity.t > 0.2 && entity.t < 0.3 && !(entity.data.sigil ?? 0)) {
          entity.data.sigil = 1
          world.spawn('dark-lord-sigil', {
            data: { depth: 0, life: 1.2 },
            x: target?.x ?? entity.x + entity.facing * unit * 4,
            y: world.groundY,
          })
        }
        raiseThralls(entity, world, target)
        if (entity.t > 1.4) {
          entity.data.sigil = 0
          finishDarkSpell(entity, world)
        }
        return
      }

      if (entity.t > 0.6 && !(entity.data.casted ?? 0)) {
        entity.data.casted = 1
        const origin = staffPoint(entity, world)

        if (entity.state === 'serpent' && target) {
          world.spawn('dark-lord-serpent', {
            data: {
              lordId: entity.id,
              ownerId: entity.id,
              ownerTeam: darkTeam,
              prey: target.id,
              sky: world.has(target, 'dragon') ? 1 : 0,
            },
            facing: entity.facing,
            vx: entity.facing * unit * 4,
            vy: world.has(target, 'dragon') ? -unit * 6 : 0,
            x: origin.x,
            y: origin.y,
          })
          spawnImpact(world, origin.x, origin.y, 2.6, 'curse', 0.4)
        } else if (entity.state === 'hex' && target) {
          world.spawn('dark-lord-skull-bolt', {
            data: { lordId: entity.id, ownerId: entity.id, ownerTeam: darkTeam, prey: target.id },
            facing: entity.facing,
            vx: entity.facing * unit * 8,
            vy: -unit * 2,
            x: origin.x,
            y: origin.y,
          })
          spawnImpact(world, origin.x, origin.y, 2, 'curse', 0.35)
        } else if (entity.state === 'green-fire' && target) {
          const targetPoint = bodyPoint(target, world)

          spawnBeam(world, 'duel-beam-dark', origin, targetPoint, 0.24)
          spawnImpact(world, targetPoint.x, targetPoint.y, 2.8, 'curse', 0.58)
          if (world.has(target, 'fuel')) {
            target.data.burn = Math.max(target.data.burn ?? 0, 0.01)
            world.spawn('green-flame', { x: target.x })
          }
        }
      }

      if (entity.t > 1.1) finishDarkSpell(entity, world)
      return
    }

    world.setAsset(entity, darkLordAsset)

    if ((entity.data.smoke ?? 0) <= 0 && (entity.data.hurt ?? 0) <= 0) {
      entity.fx = ''
    }

    const ready = (entity.data.spellCool ?? 0) <= 0
    const reach = Math.max(unit * 42, world.width * 0.9)

    if (casterTruce) {
      entity.data.truceSeen = 1
      const lowDragon = lowestDragon(world)

      if (ready && lowDragon && (entity.data.chainCool ?? 0) <= 0) {
        entity.data.chainCool = between(9, 11)
        startDarkSpell(entity, world, 'chains', lowDragon, 1.4)
        return
      }

      const skyFoe = world.nearest(entity, isLiveDragon(world), Math.max(unit * 80, world.width))

      if (ready && skyFoe && (entity.data.serpentCool ?? 0) <= 0) {
        entity.data.serpentCool = between(7, 9)
        startDarkSpell(entity, world, 'serpent', skyFoe, 1.4)
        return
      }

      const pinned = world.nearest(
        entity,
        (other) =>
          isLiveDragon(world)(other) && (other.state === 'rooted' || other.state === 'frozen'),
        reach,
      )

      if (ready && pinned && (entity.data.thrallCool ?? 0) <= 0) {
        entity.data.thrallCool = between(10, 12)
        startDarkSpell(entity, world, 'thralls', pinned, 1.4)
        return
      }

      const castleFoe = world.nearest(entity, isCastleVictim(world, entity), reach)

      if (ready && castleFoe && (entity.data.hexCool ?? 0) <= 0) {
        entity.data.hexCool = between(5, 7)
        startDarkSpell(entity, world, 'hex', castleFoe, 1.4)
        return
      }

      if (skyFoe) {
        const standoff = skyFoe.x + (entity.x < skyFoe.x ? -1 : 1) * unit * 7

        if (Math.abs(standoff - entity.x) > unit * 2) {
          walkToward(entity, world, clamp(standoff, unit * 2, world.width - unit * 2), unit, dt)
          hop(entity, dt, unit * 0.06, 2.6)
        } else {
          settle(entity, dt)
          entity.facing = skyFoe.x >= entity.x ? 1 : -1
        }
        return
      }
    } else if (entity.data.truceSeen) {
      entity.data.truceSeen = 0
      startDarkSpell(entity, world, 'betray', null, 0.6)
      return
    }

    const groundFoe = world.nearest(
      entity,
      (other) =>
        (world.has(other, 'wizard') || isCastleVictim(world, entity)(other)) &&
        isEnemy(entity, other),
      reach,
    )

    if (ready && groundFoe && (entity.data.serpentCool ?? 0) <= 0) {
      entity.data.serpentCool = between(7, 9)
      startDarkSpell(entity, world, 'serpent', groundFoe, 1.4)
      return
    }

    const hexVictim = world.nearest(
      entity,
      (other) =>
        (world.has(other, 'wizard') || isCastleVictim(world, entity)(other)) &&
        isEnemy(entity, other),
      reach,
    )

    if (ready && hexVictim && (entity.data.hexCool ?? 0) <= 0) {
      entity.data.hexCool = between(5, 7)
      startDarkSpell(entity, world, 'hex', hexVictim, 1.4)
      return
    }

    const castingWizard = world.nearest(
      entity,
      (other) =>
        world.has(other, 'wizard') && isEnemy(entity, other) && isWizardCasting(other.state),
      reach,
    )

    if (ready && castingWizard && (entity.data.chainCool ?? 0) <= 0) {
      entity.data.chainCool = between(9, 11)
      startDarkSpell(entity, world, 'chains', castingWizard, 1.4)
      return
    }

    const castleFoe = world.nearest(entity, isCastleVictim(world, entity), reach)

    if (ready && castleFoe && (entity.data.thrallCool ?? 0) <= 0) {
      entity.data.thrallCool = between(10, 12)
      startDarkSpell(entity, world, 'thralls', castleFoe, 1.4)
      return
    }

    const fuel = world.nearest(
      entity,
      (other) => world.has(other, 'fuel') && (other.data.burn ?? 0) <= 0,
      Math.max(unit * 38, world.width * 0.8),
    )

    if (ready && fuel && (entity.data.fireCool ?? 0) <= 0) {
      entity.data.fireCool = between(5, 7)
      startDarkSpell(entity, world, 'green-fire', fuel, 1.4)
      return
    }

    walk(entity, world, dt, unit * 0.52)
    hop(entity, dt, unit * 0.06, 2.6)

    if (chance(0.04, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const darkLordSerpent: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('dark-lord-serpent'),
  countAs: null,
  layer: 'front',
  size: [2.4, 2.8],
  state: 'slither',
  strongVs: ['dragon', 'wizard', 'knight'],
  tags: ['projectile'],
  weakTo: ['knight'],
  tick(entity, world, dt) {
    const unit = world.unit
    const lord = aliveTarget(world, entity.data.lordId)
    const sky = (entity.data.sky ?? 0) > 0

    if ((entity.data.fade ?? 0) > 0) {
      entity.scale = Math.max(0, entity.scale - dt * 3)
      integrate(entity, dt)
      if (entity.scale <= 0.1) world.remove(entity)
      return
    }

    let prey = aliveTarget(world, entity.data.prey)

    if (!prey || !isEnemy(entity, prey)) {
      prey = sky
        ? world.nearest(entity, isLiveDragon(world), world.width)
        : world.nearest(
            entity,
            (other) => isTargetableFoe(entity, other) && onGround(other, world),
            world.width,
          )
      entity.data.prey = prey?.id ?? -1
    }

    if (!prey || entity.t > 3.2) {
      entity.data.fade = 1
      spawnImpact(world, entity.x, entity.y, 2, 'curse', 0.4)
      return
    }

    if (sky) {
      const grip = bodyPoint(prey, world)
      steer(entity, grip.x, grip.y, unit * 9, dt, 2.2)
      integrate(entity, dt)
      entity.facing = entity.vx >= 0 ? 1 : -1
      tiltToVelocity(entity, 50)

      if (fireballHits(entity, prey, world)) {
        spawnImpact(world, grip.x, grip.y, 3.4, 'curse', 0.55)
        hurt(prey, world, 2, true, entity)
        prey.data.hexBurn = 3
        if (prey.hp <= 0) soulHarvest(lord, world, prey)
        entity.data.fade = 1
      }
      return
    }

    const dx = prey.x - entity.x
    entity.vx = Math.sign(dx || entity.facing) * unit * 6
    entity.vy = 0
    entity.x += entity.vx * dt
    entity.y = world.groundY - unit * 0.9 + Math.sin(entity.t * 9) * unit * 0.25
    entity.facing = entity.vx >= 0 ? 1 : -1
    entity.tilt = Math.sin(entity.t * 9) * 8

    if ((entity.data.trail ?? 0) <= entity.t) {
      entity.data.trail = entity.t + 0.35
      const flame = world.spawn('green-flame', { data: { ownerTeam: darkTeam }, x: entity.x })
      if (flame) flame.data.life = 1.2
    }

    if (Math.abs(dx) < unit * 1.4) {
      if (
        world.has(prey, 'knight') &&
        (prey.state === 'guard' || prey.state === 'parry') &&
        Math.sign(entity.x - prey.x || 1) === prey.facing
      ) {
        spawnImpact(world, entity.x, entity.y, 2.2, 'shield', 0.36)
      } else {
        damageGroundTarget(prey, world, 1, entity, 1.2)
        if (prey.dying) soulHarvest(lord, world, prey)
      }
      entity.data.fade = 1
    }
  },
}

const darkLordSkullBolt: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('dark-lord-skull-bolt'),
  countAs: null,
  layer: 'front',
  size: [1.2, 1.4],
  state: 'fly',
  strongVs: ['knight', 'wizard', 'archer'],
  tags: ['projectile'],
  weakTo: ['princess', 'knight'],
  tick(entity, world, dt) {
    const unit = world.unit
    const lord = aliveTarget(world, entity.data.lordId)
    const reflected = (entity.data.reflected ?? 0) > 0
    const prey = reflected ? lord : aliveTarget(world, entity.data.prey)

    if (!prey || entity.t > 3) {
      spawnImpact(world, entity.x, entity.y, 1.8, 'curse', 0.4)
      world.remove(entity)
      return
    }

    const grip = bodyPoint(prey, world)
    steer(entity, grip.x, grip.y, unit * 11, dt, 1.8)
    integrate(entity, dt)
    entity.facing = entity.vx >= 0 ? 1 : -1
    tiltToVelocity(entity, 60)

    if (!fireballHits(entity, prey, world)) return

    world.remove(entity)

    if (reflected && prey.species === 'dark-lord') {
      spawnImpact(world, grip.x, grip.y, 3.4, 'smoke', 0.6)
      prey.targetId = null
      prey.data.casted = 0
      world.setAsset(prey, darkLordToadAsset)
      world.setState(prey, 'toad')
      return
    }

    if (prey.species === 'princess') {
      spawnImpact(world, grip.x, grip.y, 2.2, 'sparkle', 0.5)
      return
    }

    if (
      world.has(prey, 'knight') &&
      (prey.state === 'guard' || prey.state === 'parry') &&
      Math.sign(entity.x - prey.x || 1) === prey.facing
    ) {
      const bounced = world.spawn('dark-lord-skull-bolt', {
        data: { lordId: entity.data.lordId ?? -1, ownerTeam: castleTeam, reflected: 1 },
        facing: entity.facing === 1 ? -1 : 1,
        vx: -entity.vx,
        vy: -Math.abs(entity.vy),
        x: entity.x,
        y: entity.y,
      })
      if (bounced) bounced.t = entity.t
      spawnImpact(world, grip.x, grip.y, 2.2, 'shield', 0.4)
      return
    }

    spawnImpact(world, grip.x, grip.y, 3.4, 'curse', 0.6)
    spawnImpact(world, prey.x, world.groundY - unit * 0.8, 3, 'smoke', 0.6)
    world.remove(prey)
    world.spawn('frog-prince', { facing: prey.facing, x: prey.x })
    soulHarvest(lord, world, prey)
  },
}

const darkLordSkeleton: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('dark-lord-skeleton'),
  countAs: null,
  hp: 1.5,
  init(entity) {
    entity.data.team = darkTeam
    entity.data.swing = 0.4
  },
  layer: 'front',
  size: [1.4, 1.6],
  state: 'rise',
  style: siegeTeamStyle,
  strongVs: ['knight', 'wizard', 'archer'],
  tags: ['target'],
  weakTo: ['knight', 'archer', 'wizard', 'fireball'],
  tick(entity, world, dt) {
    const unit = world.unit

    entity.y = groundLine(entity, world)

    if (entity.t > 9) {
      spawnImpact(world, entity.x, entity.y - unit * 0.6, 2, 'dust', 0.5)
      world.kill(entity)
      return
    }

    if (entity.state === 'rise') {
      if (entity.t > 0.8) world.setState(entity, 'shamble')
      return
    }

    entity.data.swing = (entity.data.swing ?? 0) - dt

    const pinned = world.nearest(
      entity,
      (other) =>
        isLiveDragon(world)(other) &&
        dragonMeleeVulnerable(other) &&
        isEnemy(entity, other) &&
        Math.abs(other.x - entity.x) < unit * 9,
      world.width,
    )
    const foe =
      pinned ??
      world.nearest(
        entity,
        (other) =>
          isTargetableFoe(entity, other) &&
          !world.has(other, 'dragon') &&
          !world.has(other, 'building') &&
          onGround(other, world),
        world.width,
      )

    if (!foe) {
      walk(entity, world, dt, unit * 0.6)
      return
    }

    const close = pinned
      ? Math.hypot(bodyPoint(foe, world).x - entity.x, bodyPoint(foe, world).y - entity.y) <
        unit * 4.5
      : Math.abs(foe.x - entity.x) < unit * 1.3

    if (close) {
      entity.facing = foe.x >= entity.x ? 1 : -1

      if ((entity.data.swing ?? 0) <= 0) {
        entity.data.swing = 1.1
        entity.fx = 'swing'
        spawnImpact(
          world,
          entity.x + entity.facing * unit * 0.8,
          entity.y - unit,
          1.4,
          'curse',
          0.3,
        )
        damageGroundTarget(foe, world, 0.5, entity, 0.4)
      } else if ((entity.data.swing ?? 0) < 0.8) {
        entity.fx = ''
      }
      return
    }

    walkToward(entity, world, foe.x, unit * 2.2, dt)
    hop(entity, dt, unit * 0.08, 6)
  },
}

const darkLordSigil: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('dark-lord-sigil'),
  countAs: null,
  layer: 'back',
  size: [3, 3],
  state: 'glow',
  strongVs: [],
  tags: [],
  weakTo: [],
  tick(entity, world) {
    entity.y = world.groundY

    if (entity.t > (entity.data.life ?? 1.2)) {
      world.remove(entity)
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
  size: [2.9, 3.4],
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

// Wand shots (pyromancer fire seeds, plant thorns) curve gently toward the foe they were aimed
// at and burst on its body, so every hit visibly lands on the target.
function tickHomingShot(
  entity: EcoEntity,
  world: EcoWorld,
  dt: number,
  damage: number,
  fx: 'fire' | 'thorn',
) {
  const unit = world.unit
  const prey = world.byId(entity.data.targetId ?? -1)
  const tracking = prey && !prey.dying && !prey.removed ? prey : null

  if (tracking && (entity.data.lost ?? 0) === 0) {
    const aim = bodyPoint(tracking, world)
    const heading = Math.atan2(entity.vy, entity.vx)
    const want = Math.atan2(aim.y - entity.y, aim.x - entity.x)
    const turn = Math.atan2(Math.sin(want - heading), Math.cos(want - heading))

    // Only steer while the target is still ahead; overshoots fly on.
    if (Math.abs(turn) > 1.3) {
      entity.data.lost = 1
    } else {
      const speed = Math.hypot(entity.vx, entity.vy)
      const next = heading + clamp(turn, -dt * 3.4, dt * 3.4)
      entity.vx = Math.cos(next) * speed
      entity.vy = Math.sin(next) * speed
    }
  }

  integrate(entity, dt)
  entity.facing = entity.vx >= 0 ? 1 : -1
  tiltToVelocity(entity, 90)

  // A shot whose target died burns out quickly instead of sailing across the field.
  if (!tracking && (entity.data.targetId ?? -1) >= 0) {
    entity.data.orphanAt ??= entity.age

    if (entity.age - entity.data.orphanAt > 0.3) {
      spawnImpact(world, entity.x, entity.y, 0.9, fx, 0.18)
      world.remove(entity)
      return
    }
  }

  if (
    entity.age > 2.2 ||
    entity.x < -unit * 3 ||
    entity.x > world.width + unit * 3 ||
    entity.y < -unit * 3
  ) {
    world.remove(entity)
    return
  }

  const hit =
    tracking && isEnemy(entity, tracking) && fireballHits(entity, tracking, world)
      ? tracking
      : world.entities.find(
          (other) =>
            other.id !== (entity.data.ownerId ?? -1) &&
            isSpellDuelTarget(world, entity)(other) &&
            fireballHits(entity, other, world),
        )

  if (hit) {
    const body = bodyPoint(hit, world)
    spawnImpact(
      world,
      entity.x + (body.x - entity.x) * 0.45,
      entity.y + (body.y - entity.y) * 0.45,
      fx === 'fire' ? 2 : 1.5,
      fx,
      0.32,
    )
    damageGroundTarget(hit, world, damage, entity, 0.25)
    world.remove(entity)
    return
  }

  if (entity.y >= world.groundY - unit * 0.15) {
    spawnImpact(world, entity.x, world.groundY - unit * 0.4, 1.2, fx, 0.24)
    world.remove(entity)
  }
}

const fireSeed: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('fire-seed'),
  countAs: null,
  layer: 'front',
  size: [1.5, 1.8],
  state: 'fly',
  strongVs: ['dragon', 'knight', 'burnable'],
  tags: ['projectile', 'fire'],
  weakTo: ['knight'],
  tick(entity, world, dt) {
    tickHomingShot(entity, world, dt, 0.24, 'fire')
  },
}

const plantThorn: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('plant-thorn'),
  countAs: null,
  layer: 'front',
  size: [1.15, 1.35],
  state: 'fly',
  strongVs: ['dragon', 'knight'],
  tags: ['projectile'],
  weakTo: ['knight'],
  tick(entity, world, dt) {
    tickHomingShot(entity, world, dt, 0.2, 'thorn')
  },
}

const thornSpike: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('thorn-spike'),
  countAs: null,
  layer: 'front',
  size: [1.1, 1.35],
  state: 'erupt',
  strongVs: ['knight', 'wizard', 'dark-lord'],
  style: (entity) => ({ '--rise': clamp(entity.data.rise ?? 0, 0, 1).toFixed(2) }),
  tags: [],
  weakTo: ['fire'],
  tick(entity, world) {
    const unit = world.unit
    const age = entity.t - (entity.data.delay ?? 0)

    entity.y = world.groundY

    if (age < 0) {
      entity.data.rise = 0
      return
    }

    if (!(entity.data.struck ?? 0)) {
      entity.data.struck = 1
      spawnImpact(world, entity.x, world.groundY - unit * 0.3, 1.3, 'dust', 0.3)
      const top = world.groundY - world.heightOf(entity)

      for (const other of world.entities) {
        if (
          !isSpellDuelTarget(world, entity)(other) ||
          Math.abs(other.x - entity.x) > world.widthOf(other) * 0.3 + unit * 0.7 ||
          bodyPoint(other, world).y < top
        ) {
          continue
        }

        damageGroundTarget(other, world, 0.35, entity, 0.5)
        spawnImpact(world, other.x, bodyPoint(other, world).y, 1.4, 'thorn', 0.3)
      }
    }

    entity.data.rise = age < 0.12 ? age / 0.12 : age > 0.85 ? 1 - (age - 0.85) / 0.25 : 1

    if (age > 1.1) {
      world.remove(entity)
    }
  },
}

// A small fighting tree: lashes walkers that come close and spits thorns at flyers.
const thornSapling: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('thorn-sapling'),
  countAs: null,
  hp: 3,
  layer: 'front',
  size: [2.3, 2.6],
  state: 'grow',
  style: siegeTeamStyle,
  strongVs: ['knight', 'dragon'],
  tags: ['plant', 'burnable'],
  weakTo: ['fire', 'fireball'],
  tick(entity, world) {
    const unit = world.unit

    entity.y = world.groundY

    if (entity.hp <= 0 || entity.age > 10) {
      world.kill(entity)
      return
    }

    if (entity.state === 'grow') {
      if (entity.t > 0.5) world.setState(entity, 'guard')
      return
    }

    if (entity.state === 'whip') {
      if (entity.t < 0.35) return
      world.setState(entity, 'guard')
    }

    const walker = world.nearest(
      entity,
      (other) =>
        isSpellDuelTarget(world, entity)(other) &&
        bodyPoint(other, world).y > world.groundY - unit * 3.5,
      unit * 3.4,
    )

    if (walker && (entity.data.whipAt ?? 0) <= world.time) {
      entity.data.whipAt = world.time + 0.9
      entity.facing = walker.x >= entity.x ? 1 : -1
      world.setState(entity, 'whip')
      damageGroundTarget(walker, world, 0.5, entity, 1.2)
      spawnImpact(world, walker.x, bodyPoint(walker, world).y, 1.5, 'thorn', 0.3)
      return
    }

    const flyer = world.nearest(
      entity,
      (other) => isSpellDuelTarget(world, entity)(other) && !onGround(other, world),
      Math.max(unit * 40, world.width * 0.6),
    )

    if (flyer && (entity.data.shotAt ?? 0) <= world.time) {
      entity.data.shotAt = world.time + 0.55
      entity.facing = flyer.x >= entity.x ? 1 : -1
      shootThorn(
        entity,
        world,
        {
          x: entity.x + entity.facing * world.widthOf(entity) * 0.2,
          y: entity.y - world.heightOf(entity) * 0.75,
        },
        flyer,
      )
    }
  },
}

const skyVine: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('sky-vine'),
  countAs: null,
  layer: 'front',
  size: [1, 1],
  state: 'grow',
  strongVs: ['dragon', 'knight'],
  style: (entity) => ({ '--vine-grow': String(clamp(entity.data.grow ?? 0, 0, 1)) }),
  tags: ['plant'],
  weakTo: ['fire'],
  tick(entity, world, dt) {
    const unit = world.unit
    const target = world.byId(entity.data.vineTarget ?? -1)
    const holding =
      target && !target.dying && !target.removed && target.state !== 'falling' ? target : null
    const grip = holding ? bodyPoint(holding, world) : null
    const snared = (entity.data.snared ?? 0) > 0

    entity.y = world.groundY

    if (grip) {
      entity.x += (grip.x - entity.x) * Math.min(1, dt * 5)
      entity.data.reach = clamp(world.groundY - grip.y + unit * 0.8, unit * 2.4, world.height)
    }

    entity.size = (entity.data.reach ?? unit * 3) / (unit * entity.aspect)

    if ((entity.data.wither ?? 0) > 0 || (!holding && !snared) || (snared && !holding)) {
      entity.data.wither = (entity.data.wither ?? 0) + dt / 0.4
      entity.data.grow = Math.min(entity.data.grow ?? 0, 1 - (entity.data.wither ?? 0))

      if ((entity.data.wither ?? 0) >= 1) {
        world.remove(entity)
      }
      return
    }

    if (!snared) {
      entity.data.grow = Math.min(1, (entity.data.grow ?? 0) + dt / 0.5)

      if ((entity.data.grow ?? 0) >= 1 && holding) {
        entity.data.snared = 1
        entity.data.holdUntil = entity.t + (world.has(holding, 'dragon') ? 2.6 : 1.4)
        spawnImpact(world, grip?.x ?? entity.x, grip?.y ?? entity.y, 2.6, 'vine', 0.5)
        damageGroundTarget(holding, world, 0.8, entity)

        if (world.has(holding, 'dragon') && !holding.dying && holding.hp > 0) {
          holding.data.rootFor = 2.6
          holding.data.chained = 0
          holding.fx = 'rooted'
          world.setState(holding, 'rooted')
        } else {
          holding.fx = 'rooted'
          holding.data.slowUntil = Math.max(holding.data.slowUntil ?? 0, world.time + 1.6)
        }
      }
      return
    }

    if (holding && world.has(holding, 'dragon')) {
      holding.vy = Math.min(holding.vy + unit * 3 * dt, unit * 2.4)
    }

    if (entity.t > (entity.data.holdUntil ?? 0) || (holding && holding.state === 'patrol')) {
      entity.data.wither = 0.01
    }
  },
}

const spellClash: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('spell-impact'),
  countAs: null,
  idle: 'glow',
  layer: 'front',
  size: [2.4, 3.4],
  state: 'clash',
  strongVs: ['wizard'],
  tags: [],
  weakTo: ['wizard'],
  tick(entity, world) {
    entity.scale = 0.85 + Math.sin(world.time * 18 + entity.id) * 0.08
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

// The pose box stays chain-thick; CSS tiles the links along --tether-len so they never fatten.
const darkTether: EcoSpecies = {
  ...beamEffect(ecoAsset('dark-lord-chain')),
  style: (entity) => ({ '--tether-len': `${(entity.data.length ?? 0).toFixed(1)}px` }),
  tick(entity, world) {
    const lord = world.byId(entity.data.lordId ?? -1)
    const prey = world.byId(entity.data.preyId ?? -1)

    if (
      !lord ||
      lord.dying ||
      lord.removed ||
      lord.state !== 'chains' ||
      !prey ||
      prey.dying ||
      prey.removed
    ) {
      world.remove(entity)
      return
    }

    const from = staffPoint(lord, world)
    const to = bodyPoint(prey, world)
    const reach = 1 - (1 - clamp(entity.t / tetherReach, 0, 1)) ** 3
    const dx = (to.x - from.x) * reach
    const dy = (to.y - from.y) * reach
    const length = Math.max(world.unit * 0.3, Math.hypot(dx, dy))

    entity.x = from.x + dx * 0.5
    entity.y = from.y + dy * 0.5
    entity.tilt = (Math.atan2(dy, dx) * 180) / Math.PI
    entity.data.length = length
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
      if (other === entity || world.has(other, 'fire') || sameTeam(entity, other)) {
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
  archer,
  arrow,
  'arrow-volley': arrowVolley,
  ballista,
  bolt,
  cottage: cottageSpecies(cottageAssets),
  'dark-lord': darkLord,
  'dark-lord-serpent': darkLordSerpent,
  'dark-lord-sigil': darkLordSigil,
  'dark-tether': darkTether,
  'dark-lord-skeleton': darkLordSkeleton,
  'dark-lord-skull-bolt': darkLordSkullBolt,
  dragon,
  'dread-dragon': dreadDragon,
  'dread-flame': dreadFlame,
  'eastern-dragon': easternDragon,
  'ember-dragon': emberDragon,
  'emerald-dragon': emeraldDragon,
  'frost-dragon': frostDragon,
  'duel-beam-dark': beamEffect(ecoAsset('duel-beam-dark')),
  'duel-beam-good': beamEffect(ecoAsset('duel-beam-good')),
  fireball,
  'frog-prince': frogPrince,
  'green-flame': greenFlame,
  knight,
  prince,
  princess,
  'rally-banner': rallyBanner,
  'spell-impact': spellImpact,
  'sword-arc': swordArc,
  'vine-snare': vineSnare,
  wizard,
  'pyro-wizard': pyroWizard,
  'frost-wizard': frostWizard,
  'plant-wizard': plantWizard,
  'spell-clash': spellClash,
  'fire-seed': fireSeed,
  'plant-thorn': plantThorn,
  'thorn-sapling': thornSapling,
  'thorn-spike': thornSpike,
  'sky-vine': skyVine,
})
