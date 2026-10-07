import { ecoAsset, registerViewBoxes } from '../assets'
import {
  between,
  chance,
  clamp,
  faceTravel,
  flee,
  integrate,
  pick,
  steer,
  tiltToVelocity,
  walk,
  wander,
} from '../behaviors'
import type {
  EcoControlAbility,
  EcoControlAbilityContext,
  EcoEntity,
  EcoSpecies,
  EcoSpeciesMap,
  EcoWorld,
} from '../types'

registerViewBoxes({
  'boat-battleship': [214, 92],
  'boat-capsized': [170, 92],
  'boat-dinghy': [154, 70],
  'boat-pirate': [204, 138],
  'boat-rowboat': [158, 80],
  'boat-sailboat': [166, 124],
  'boat-speedboat': [176, 74],
  'boat-submarine': [188, 80],
  'boat-surfboard': [150, 70],
  'boat-trawler': [188, 108],
  'boat-wreck': [166, 90],
  'sea-anglerfish': [130, 82],
  'sea-bubble-ring': [150, 110],
  'sea-crab': [112, 72],
  'sea-depth-charge': [58, 86],
  'sea-drifter-fish': [220, 80],
  'sea-drifter-jelly': [170, 130],
  'sea-drifter-manta': [220, 96],
  'sea-drifter-whale': [240, 92],
  'sea-fish-school': [150, 70],
  'sea-jellyfish': [90, 112],
  'sea-kelp-coral': [116, 132],
  'sea-net': [118, 118],
  'sea-octopus': [120, 112],
  'sea-octopus-ink': [128, 112],
  'sea-orca': [176, 86],
  'sea-puffer': [98, 76],
  'sea-puffer-puffed': [140, 140],
  'sea-shark': [168, 82],
  'sea-shark-bite': [168, 90],
  'sea-swordfish': [190, 74],
  'sea-swimmer': [70, 86],
  'sea-turtle': [132, 86],
  'sea-whale': [210, 96],
})

const kelpAsset = ecoAsset('sea-kelp-coral')
const fishAsset = ecoAsset('sea-fish-school')
const jellyAsset = ecoAsset('sea-jellyfish')
const turtleAsset = ecoAsset('sea-turtle')
const crabAsset = ecoAsset('sea-crab')
const pufferAsset = ecoAsset('sea-puffer')
const pufferPuffedAsset = ecoAsset('sea-puffer-puffed')
const sharkAsset = ecoAsset('sea-shark')
const sharkBiteAsset = ecoAsset('sea-shark-bite')
const swordfishAsset = ecoAsset('sea-swordfish')
const octopusAsset = ecoAsset('sea-octopus')
const octopusInkAsset = ecoAsset('sea-octopus-ink')
const whaleAsset = ecoAsset('sea-whale')
const orcaAsset = ecoAsset('sea-orca')
const anglerAsset = ecoAsset('sea-anglerfish')
const netAsset = ecoAsset('sea-net')
const depthChargeAsset = ecoAsset('sea-depth-charge')
const bubbleRingAsset = ecoAsset('sea-bubble-ring')
const swimmerAsset = ecoAsset('sea-swimmer')
const wreckAsset = ecoAsset('boat-wreck')
const capsizedAsset = ecoAsset('boat-capsized')

const boatVariants = [
  {
    asset: ecoAsset('boat-rowboat'),
    hp: 2,
    id: 'rowboat',
    size: [4.2, 4.7],
    speed: [6, 7.5],
    strongVs: ['fish-school'],
    waterline: 42 / 80,
    weakTo: ['shark', 'whale'],
    weight: 25,
  },
  {
    asset: ecoAsset('boat-dinghy'),
    hp: 2,
    id: 'dinghy',
    size: [4.8, 5.3],
    speed: [6.5, 8],
    strongVs: ['jellyfish'],
    waterline: 34 / 70,
    weakTo: ['shark', 'octopus'],
    weight: 17,
  },
  {
    asset: ecoAsset('boat-sailboat'),
    hp: 2,
    id: 'sailboat',
    size: [6.6, 7.2],
    speed: [7, 9],
    strongVs: ['pufferfish', 'fish-school'],
    waterline: 84 / 124,
    weakTo: ['whale', 'octopus'],
    weight: 16,
  },
  {
    asset: ecoAsset('boat-trawler'),
    hp: 3,
    id: 'trawler',
    size: [10.2, 11],
    speed: [6, 7.2],
    strongVs: ['fish-school', 'jellyfish', 'sea-turtle'],
    waterline: 60 / 108,
    weakTo: ['octopus', 'whale'],
    weight: 13,
  },
  {
    asset: ecoAsset('boat-surfboard'),
    hp: 1,
    id: 'surfboard',
    size: [2.4, 2.8],
    speed: [8, 12],
    strongVs: ['fish-school'],
    waterline: 50 / 70,
    weakTo: ['shark', 'whale', 'jellyfish'],
    weight: 10,
  },
  {
    asset: ecoAsset('boat-speedboat'),
    hp: 2,
    id: 'speedboat',
    size: [5.5, 6.2],
    speed: [9, 12],
    strongVs: ['fish-school', 'jellyfish'],
    waterline: 44 / 74,
    weakTo: ['shark', 'whale'],
    weight: 10,
  },
  {
    asset: ecoAsset('boat-battleship'),
    hp: 5,
    id: 'battleship',
    size: [16.8, 18],
    speed: [6, 7],
    strongVs: ['shark', 'orca'],
    waterline: 50 / 92,
    weakTo: ['whale', 'octopus'],
    weight: 5,
  },
  {
    asset: ecoAsset('boat-pirate'),
    hp: 4,
    id: 'pirate-ship',
    size: [11.4, 12.3],
    speed: [7, 9],
    strongVs: ['boat', 'shark'],
    waterline: 88 / 138,
    weakTo: ['orca', 'whale'],
    weight: 3,
  },
  {
    asset: ecoAsset('boat-submarine'),
    hp: 4,
    id: 'submarine',
    size: [12, 12.9],
    speed: [8, 10],
    strongVs: ['orca', 'anglerfish'],
    waterline: 14 / 80,
    weakTo: ['whale', 'octopus', 'crab'],
    weight: 1,
  },
] as const

const boatWeightTotal = boatVariants.reduce((total, variant) => total + variant.weight, 0)

function weightedBoatAsset() {
  let roll = Math.random() * boatWeightTotal

  for (const variant of boatVariants) {
    roll -= variant.weight

    if (roll <= 0) {
      return variant.asset
    }
  }

  return boatVariants[0]!.asset
}

const isBoat = (other: EcoEntity) => other.species === 'boat' && other.state !== 'wreck'
const isSailingBoat = (other: EcoEntity) => other.species === 'boat' && other.state === 'sail'
const isFish = (other: EcoEntity) => other.species === 'fish-school'
const isKelp = (other: EcoEntity) => other.species === 'kelp-coral'
const isJelly = (other: EcoEntity) => other.species === 'jellyfish'
const isTurtle = (other: EcoEntity) => other.species === 'sea-turtle'
const isCrab = (other: EcoEntity) => other.species === 'crab'
const isPuffer = (other: EcoEntity) => other.species === 'pufferfish'
const isCalmPuffer = (other: EcoEntity) => isPuffer(other) && other.state === 'drift'
const isPuffedPuffer = (other: EcoEntity) => isPuffer(other) && other.scale > 1.6
const isShark = (other: EcoEntity) => other.species === 'shark'
const isSwordfish = (other: EcoEntity) => other.species === 'swordfish'
const isOctopus = (other: EcoEntity) => other.species === 'octopus'
const isWhale = (other: EcoEntity) => other.species === 'whale'
const isOrca = (other: EcoEntity) => other.species === 'orca'
const isAngler = (other: EcoEntity) => other.species === 'anglerfish'
const isPredator = (other: EcoEntity) =>
  isJelly(other) ||
  isShark(other) ||
  isSwordfish(other) ||
  isOctopus(other) ||
  isOrca(other) ||
  isAngler(other)

function surfaceY(world: EcoWorld) {
  return clamp(world.waterY || world.height * 0.16, world.unit * 2.2, world.height * 0.34)
}

function boatBottomOnSurface(entity: EcoEntity, world: EcoWorld) {
  return surfaceY(world) + world.heightOf(entity) * (1 - (entity.data.waterline ?? 0.55))
}

function floorY(world: EcoWorld) {
  return clamp(world.groundY || world.height * 0.88, world.height * 0.72, world.height * 0.96)
}

function waterTop(world: EcoWorld) {
  return surfaceY(world) + world.unit * 2.2
}

function waterBottom(world: EcoWorld) {
  return floorY(world) - world.unit * 3.1
}

function deepTop(world: EcoWorld) {
  return surfaceY(world) + world.unit * 8
}

function deepBottom(world: EcoWorld) {
  return floorY(world) - world.unit * 2.4
}

function keepInWater(
  entity: EcoEntity,
  world: EcoWorld,
  top = waterTop(world),
  bottom = waterBottom(world),
) {
  const margin = Math.max(world.unit, world.widthOf(entity) * 0.35)

  entity.x = clamp(entity.x, margin, world.width - margin)
  entity.y = clamp(entity.y, top, Math.max(top + world.unit, bottom))
}

function keepWaterDepth(
  entity: EcoEntity,
  world: EcoWorld,
  top = waterTop(world),
  bottom = waterBottom(world),
) {
  entity.y = clamp(entity.y, top, Math.max(top + world.unit, bottom))
}

function wrapRight(entity: EcoEntity, world: EcoWorld, margin = world.widthOf(entity) * 0.55) {
  entity.facing = 1
  entity.vx = Math.max(Math.abs(entity.vx), world.unit * 0.35)

  if (entity.x > world.width + margin) {
    entity.x = -margin
  } else if (entity.x < -margin * 1.25) {
    entity.x = -margin
  }
}

function capWidth(entity: EcoEntity, world: EcoWorld, fraction = 0.9) {
  entity.size = Math.min(entity.size, (world.width * fraction) / Math.max(world.unit, 1))
}

const seaMovementSpeeds = {
  anglerfish: { burst: 5, cruise: 2 },
  crab: { burst: 5, cruise: 2.2 },
  fish: { burst: 22, cruise: 9 },
  jellyfish: { burst: 1.5, cruise: 0.65 },
  octopus: { burst: 8, cruise: 3.2 },
  orca: { burst: 30, cruise: 13.5 },
  pufferfish: { burst: 4, cruise: 1.8 },
  shark: { burst: 26, cruise: 11.5 },
  swordfish: { burst: 36, cruise: 15 },
  turtle: { burst: 13, cruise: 5 },
  whale: { burst: 15, cruise: 6.5 },
} as const

type PaceKind = keyof typeof seaMovementSpeeds

const seaSpeedUnitPx = 16
const seaControlUnitScale = 1

function pace(_entity: EcoEntity, _world: EcoWorld, kind: PaceKind, mode: 'burst' | 'cruise') {
  return seaSpeedUnitPx * seaMovementSpeeds[kind][mode]
}

function controlledSeaSpeed(kind: PaceKind) {
  return seaMovementSpeeds[kind].burst * seaControlUnitScale
}

function matchesKey(entity: EcoEntity, world: EcoWorld, key: string) {
  return (
    entity.species === key || (key === 'boat' && isBoat(entity)) || world.has(entity, key as never)
  )
}

function boatVariant(entity: EcoEntity) {
  return isBoat(entity) ? boatVariants[entity.data.kind ?? 0] : null
}

function matchupEdge(attacker: EcoEntity, defender: EcoEntity, world: EcoWorld) {
  let edge = world.edge(attacker, defender)
  const attackerBoat = boatVariant(attacker)
  const defenderBoat = boatVariant(defender)

  if (attackerBoat) {
    if (attackerBoat.strongVs.some((key) => matchesKey(defender, world, key))) {
      edge = Math.max(edge, 1.6)
    }

    if (attackerBoat.weakTo.some((key) => matchesKey(defender, world, key))) {
      edge = Math.min(edge, 0.5)
    }
  }

  if (defenderBoat) {
    if (defenderBoat.weakTo.some((key) => matchesKey(attacker, world, key))) {
      edge = Math.max(edge, 1.6)
    }

    if (defenderBoat.strongVs.some((key) => matchesKey(attacker, world, key))) {
      edge = Math.min(edge, 0.5)
    }
  }

  return edge
}

function driftTurn(entity: EcoEntity, world: EcoWorld, margin = world.unit * 3) {
  if (entity.x < margin) {
    entity.x = margin
    entity.facing = 1
    entity.vx = Math.abs(entity.vx)
  } else if (entity.x > world.width - margin) {
    entity.x = world.width - margin
    entity.facing = -1
    entity.vx = -Math.abs(entity.vx)
  }
}

function clearFx(entity: EcoEntity, dt: number) {
  entity.data.fx = Math.max(0, (entity.data.fx ?? 0) - dt)

  if ((entity.data.fx ?? 0) <= 0) {
    entity.fx = ''
  }
}

function hurt(target: EcoEntity, world: EcoWorld, amount = 1) {
  world.damage(null, target, amount)
}

function spawnBurst(world: EcoWorld, x: number, y: number, size = 3.2) {
  const burst = world.spawn('sea-bubble-ring', { countAs: null, size, x, y })

  if (burst) {
    burst.data.life = 0.85
    burst.data.zBoost = world.height * 2
  }

  return burst
}

function spawnSwimmers(world: EcoWorld, boat: EcoEntity, count = 1) {
  for (let index = 0; index < count; index += 1) {
    world.spawn('sea-swimmer', {
      countAs: null,
      facing: Math.random() < 0.5 ? -1 : 1,
      x: clamp(boat.x + between(-0.8, 0.8) * world.unit, world.unit, world.width - world.unit),
      y: boat.y + world.unit * between(0.8, 2.2),
    })
  }
}

function markBoatSunk(boat: EcoEntity) {
  if ((boat.data.sunk ?? 0) > 0) {
    return
  }

  boat.data.sunk = 1
  boat.countAs = null
}

function overturnBoat(boat: EcoEntity, world: EcoWorld) {
  world.setAsset(boat, capsizedAsset)
  boat.data.waterline = 64 / 92
  boat.y = boatBottomOnSurface(boat, world)
  boat.data.zBoost = world.height * 2
  spawnSwimmers(world, boat, boat.data.kind === 4 ? 1 : Math.round(between(1, 3)))
  spawnBurst(world, boat.x, boat.y + world.unit * 1.2, 2.8)
}

function sinkBoat(boat: EcoEntity, world: EcoWorld, delay: number) {
  world.setState(boat, 'capsized')
  boat.data.sinkDelay = delay
  markBoatSunk(boat)
}

function capsizeBoat(boat: EcoEntity, world: EcoWorld, cause?: EcoEntity) {
  if (boat.state !== 'sail' && boat.state !== 'splashdown') {
    return false
  }

  const edge = cause ? matchupEdge(cause, boat, world) : 1

  if (edge < 1 && Math.random() > 0.45) {
    boat.fx = 'wobble'
    boat.data.fx = 0.5
    return false
  }

  overturnBoat(boat, world)
  boat.vx *= 0.25
  boat.vy = world.unit * 0.35
  boat.tilt = boat.facing * -18
  sinkBoat(boat, world, between(1.8, 3.8))

  return true
}

const boatFlightsToSink = 3

function boatGravity(world: EcoWorld) {
  return world.unit * 60
}

function launchBoat(boat: EcoEntity, rammer: EcoEntity, world: EcoWorld, power: number) {
  const unit = world.unit
  const gravity = boatGravity(world)
  const rest = boatBottomOnSurface(boat, world)
  const ceiling = Math.max(unit * 1.5, rest - world.heightOf(boat) - unit * 0.3)
  const apex = Math.min(
    ceiling,
    Math.max(unit * 2.5, unit * 7.5 * power * clamp(7 / boat.size, 0.45, 1.4)),
  )
  const rise = Math.sqrt(2 * gravity * apex)
  const airtime = (2 * rise) / gravity
  const turns = pick([0.5, 1, 1, 1.5]) + between(-0.06, 0.06)
  const side = rammer.x <= boat.x ? 1 : -1

  boat.vy = -rise
  boat.vx = clamp(boat.vx * 0.4 + (boat.x - rammer.x) * 2.2 + rammer.vx * 0.3, -unit * 9, unit * 9)
  boat.data.spin = (side * boat.facing * turns * 360) / airtime
  boat.data.flips = (boat.data.flips ?? 0) + 1
  boat.data.zBoost = world.height * 2
  boat.fx = ''
  boat.lift = 0
  world.setState(boat, 'airborne')
  world.shake(0.85)
  world.effect({
    text: 'Launched!',
    tone: 'strong',
    type: 'damage',
    x: boat.x,
    y: boat.y - world.heightOf(boat) * 1.2,
  })
}

function wrapAngle(degrees: number) {
  return ((((degrees + 180) % 360) + 360) % 360) - 180
}

// Lands right side up (bob and sail on), upside down (crew spills, then it rolls back over),
// or, after too many flights, it stays capsized and sinks.
function landBoat(boat: EcoEntity, world: EcoWorld) {
  const angle = wrapAngle(boat.tilt)
  const wrecked = (boat.data.flips ?? 0) >= boatFlightsToSink

  boat.vy = 0
  boat.data.spin = 0
  spawnBurst(world, boat.x, surfaceY(world) + world.unit * 0.6, Math.min(6, 2.6 + boat.size * 0.18))
  world.shake(0.45)

  if (wrecked || Math.abs(angle) > 95) {
    boat.tilt = wrapAngle(angle + 180) * 0.4
    overturnBoat(boat, world)

    if (wrecked) {
      sinkBoat(boat, world, 0.9)
    } else {
      world.setState(boat, 'overturned')
    }
    return
  }

  boat.tilt = angle
  boat.data.landTilt = angle
  world.setState(boat, 'splashdown')
}

function flyBoat(boat: EcoEntity, world: EcoWorld, dt: number) {
  const margin = world.widthOf(boat) * 0.4

  boat.vy += boatGravity(world) * dt
  boat.vx *= 1 - dt * 0.35
  boat.x += boat.vx * dt
  boat.y += boat.vy * dt
  boat.tilt += (boat.data.spin ?? 0) * dt

  if (boat.x < margin || boat.x > world.width - margin) {
    boat.x = clamp(boat.x, margin, world.width - margin)
    boat.vx *= -0.55
  }

  if (boat.vy > 0 && boat.y >= boatBottomOnSurface(boat, world)) {
    boat.y = boatBottomOnSurface(boat, world)
    landBoat(boat, world)
  }
}

function resumeSailing(boat: EcoEntity, world: EcoWorld) {
  boat.data.zBoost = 0
  boat.lift = 0
  boat.vx = boat.data.cruise ?? boat.vx
  world.setState(boat, 'sail')
}

function touches(
  point: { x: number; y: number },
  other: EcoEntity,
  world: EcoWorld,
  radius: number,
) {
  const halfWidth = world.widthOf(other) * 0.42
  const halfHeight = world.heightOf(other) * 0.42
  const centerY = other.anchor === 'bottom' ? other.y - world.heightOf(other) * 0.5 : other.y
  const dx = point.x - clamp(point.x, other.x - halfWidth, other.x + halfWidth)
  const dy = point.y - clamp(point.y, centerY - halfHeight, centerY + halfHeight)

  return Math.hypot(dx, dy) <= radius
}

const pufferMaxScale = 5.6
const pufferSmallPrey = new Set(['anglerfish', 'crab', 'fish-school', 'jellyfish', 'sea-swimmer'])
const pufferBigFoes = new Set(['octopus', 'orca', 'sea-turtle', 'shark', 'swordfish', 'whale'])

function startPuff(entity: EcoEntity, world: EcoWorld, seconds: number) {
  world.setAsset(entity, pufferPuffedAsset)
  world.setState(entity, 'puffed')
  entity.data.puffUntil = world.time + seconds
  spawnBurst(world, entity.x, entity.y, 2.6)
  world.shake(0.25)
}

// Spines only bite once the puffer is properly inflated; small fry pop, big swimmers get stabbed and bounced off.
function pufferSpikes(entity: EcoEntity, world: EcoWorld) {
  if (entity.scale < 1.8) {
    return
  }

  const radius = world.widthOf(entity) * 0.4

  for (const other of world.within(
    entity.x,
    entity.y,
    radius + world.unit * 16,
    (candidate) => pufferSmallPrey.has(candidate.species) || pufferBigFoes.has(candidate.species),
  )) {
    if (!touches(entity, other, world, radius)) {
      continue
    }

    if (pufferSmallPrey.has(other.species)) {
      spawnBurst(world, other.x, other.y, 1.4)
      world.kill(other)
      continue
    }

    if ((other.data.spikedAt ?? -9) > world.time - 0.8) {
      continue
    }

    const angle = Math.atan2(other.y - entity.y, other.x - entity.x)
    const push = world.unit * (isWhale(other) ? 6 : 16)

    other.data.spikedAt = world.time
    world.damage(entity, other, isWhale(other) ? 0.6 : 1, entity.x)
    other.vx += Math.cos(angle) * push
    other.vy += Math.sin(angle) * push * 0.6
    other.targetId = null
    other.fx = 'dazed'
    other.data.fx = 0.8
    entity.vx -= Math.cos(angle) * world.unit * 3
    entity.vy -= Math.sin(angle) * world.unit * 2
  }
}

function easeOutBack(value: number) {
  const overshoot = 1.70158

  return 1 + (overshoot + 1) * (value - 1) ** 3 + overshoot * (value - 1) ** 2
}

function springScale(
  entity: EcoEntity,
  goal: number,
  stiffness: number,
  damping: number,
  dt: number,
) {
  const velocity =
    (entity.data.scaleV ?? 0) +
    ((goal - entity.scale) * stiffness - (entity.data.scaleV ?? 0) * damping) * dt

  entity.data.scaleV = velocity
  entity.scale = clamp(entity.scale + velocity * dt, 1, pufferMaxScale * 1.25)
}

type RamKind = 'orca' | 'shark' | 'swordfish' | 'whale'

// clear = share of the body that leaves the water at the top of the jump; launch scales the boat's flight.
const ramProfiles: Record<
  RamKind,
  { clear: number; every: readonly [number, number]; launch: number; rest: string }
> = {
  orca: { clear: 0.62, every: [20, 40], launch: 0.85, rest: 'hunt' },
  shark: { clear: 0.52, every: [24, 46], launch: 0.7, rest: 'prowl' },
  swordfish: { clear: 0.58, every: [26, 50], launch: 0.6, rest: 'lance' },
  whale: { clear: 0.64, every: [10, 22], launch: 1.15, rest: 'cruise' },
}

const isRamState = (state: string) =>
  state === 'ram-dive' || state === 'ram-rise' || state === 'breach'

function ramLength(entity: EcoEntity, world: EcoWorld, kind: RamKind) {
  return world.widthOf(entity) * (kind === 'whale' ? 0.84 : 0.92)
}

function scheduleRam(entity: EcoEntity, world: EcoWorld, kind: RamKind, factor = 1) {
  const [min, max] = ramProfiles[kind].every

  entity.data.ramAt = world.time + between(min, max) * factor
}

function startRam(
  entity: EcoEntity,
  world: EcoWorld,
  kind: RamKind,
  boat: EcoEntity | null,
  quick = false,
) {
  const length = ramLength(entity, world, kind)
  const surface = surfaceY(world)
  const deep = surface + length * 0.5 + world.unit * (quick ? 4 : 10)

  entity.data.ramBoatId = boat?.id ?? -1
  entity.data.ramDepth = clamp(
    quick ? Math.max(entity.y + world.unit * 2, deep) : deep,
    waterTop(world),
    waterBottom(world),
  )
  entity.data.ramDiveUntil = world.time + (quick ? 0.9 : 5)
  entity.data.ramSplashAt = -1
  entity.targetId = null
  world.setState(entity, 'ram-dive')
}

function endRam(entity: EcoEntity, world: EcoWorld, kind: RamKind) {
  entity.data.ramBoatId = -1
  entity.data.ramSplashAt = -1
  scheduleRam(entity, world, kind)
  world.setState(entity, ramProfiles[kind].rest)
}

function maybeStartRam(entity: EcoEntity, world: EcoWorld, kind: RamKind) {
  if (world.time < (entity.data.ramAt ?? 0)) {
    return false
  }

  scheduleRam(entity, world, kind)

  const boat = world.nearest({ x: entity.x, y: surfaceY(world) }, isSailingBoat, world.width * 0.45)

  if (boat && Math.random() < 0.7) {
    startRam(entity, world, kind, boat)
    return true
  }

  if (!boat && kind === 'whale' && Math.random() < 0.35) {
    startRam(entity, world, kind, null)
    return true
  }

  return false
}

// A whale is too big to clear the short sky, so it pivots over the top of its leap, crashes back in,
// and levels out under the surface before cruising again; handing off mid-air would snap its tilt.
function whaleFallBack(
  entity: EcoEntity,
  world: EcoWorld,
  dt: number,
  arc: { gravity: number; launch: number; margin: number; reach: number },
) {
  const unit = world.unit
  const surface = surfaceY(world)
  const splashAt = entity.data.ramSplashAt ?? -1

  if (splashAt < 0) {
    entity.vy += arc.gravity * dt
    integrate(entity, dt)
    entity.x = clamp(entity.x, arc.margin, world.width - arc.margin)
    const goal = clamp(-28 + (entity.vy / arc.launch) * 40, -68, 14)

    entity.tilt += (goal - entity.tilt) * Math.min(1, dt * 7)

    if (entity.vy > 0 && entity.y - arc.reach * 0.75 > surface) {
      spawnBurst(world, entity.x, surface + unit, 5.4)
      world.shake(0.7)
      entity.data.ramSplashAt = world.time
    }

    return true
  }

  entity.vx *= Math.max(0, 1 - dt * 3)
  entity.vy += (unit * 1.5 - entity.vy) * Math.min(1, dt * 6)
  integrate(entity, dt)
  keepInWater(entity, world)
  entity.tilt *= Math.max(0, 1 - dt * 6)

  if (Math.abs(entity.tilt) < 3 || world.time - splashAt > 0.9) {
    endRam(entity, world, 'whale')
  }

  return true
}

// Dive to build speed, rocket straight up under the boat, then arc through the air and splash back down.
function ramming(entity: EcoEntity, world: EcoWorld, dt: number, kind: RamKind) {
  if (!isRamState(entity.state)) {
    return false
  }

  const unit = world.unit
  const surface = surfaceY(world)
  const length = ramLength(entity, world, kind)
  const reach = length * 0.46
  const boatId = entity.data.ramBoatId ?? -1
  const boat = boatId >= 0 ? world.byId(boatId) : null
  const target = boat && isSailingBoat(boat) ? boat : null
  const burst = pace(entity, world, kind, 'burst')
  const margin = world.widthOf(entity) * 0.3

  if (entity.state === 'ram-dive') {
    if (boatId >= 0 && !target) {
      endRam(entity, world, kind)
      return true
    }

    const depth = entity.data.ramDepth ?? entity.y
    const aimX = target ? target.x + target.vx * 1.1 : entity.x

    steer(entity, aimX, depth, burst, dt, 3)
    integrate(entity, dt)
    keepInWater(entity, world)
    faceTravel(entity)

    if (kind === 'whale') {
      const angle = clamp(
        (Math.atan2(entity.vy, Math.abs(entity.vx) + 0.001) * 180) / Math.PI,
        -30,
        30,
      )

      entity.tilt += (angle - entity.tilt) * Math.min(1, dt * 6)
    } else {
      tiltToVelocity(entity, 30)
    }

    const lined = !target || Math.abs(aimX - entity.x) < unit * 4 + world.widthOf(target) * 0.3

    if ((entity.y >= depth - unit * 1.5 && lined) || world.time > (entity.data.ramDiveUntil ?? 0)) {
      world.setState(entity, 'ram-rise')
      entity.vy = Math.min(entity.vy, 0)
    }

    return true
  }

  const gravity = world.unit * 90
  // The sky above the waterline is short, so cap the leap to keep the breach on screen.
  const rise = Math.min(length * ramProfiles[kind].clear, Math.max(unit * 3, surface - unit))
  const launch = Math.sqrt(2 * gravity * rise)

  if (entity.state === 'ram-rise') {
    entity.vy = Math.max(-launch, entity.vy - launch * 5 * dt)

    const eta = Math.max(0.08, (entity.y - reach - surface) / launch)
    const aimX = target ? target.x + target.vx * eta : entity.x

    entity.vx +=
      (clamp((aimX - entity.x) / Math.max(eta, 0.25), -burst, burst) - entity.vx) *
      Math.min(1, dt * 8)
    integrate(entity, dt)
    entity.x = clamp(entity.x, margin, world.width - margin)
    const lean = clamp(((entity.vx * entity.facing) / burst) * 14, -14, 14)

    if (kind === 'whale') {
      // The big side-view body eases nose-up instead of snapping vertical.
      entity.tilt += (-60 + lean - entity.tilt) * Math.min(1, dt * 9)
    } else {
      entity.tilt = -72 + lean
    }

    if (entity.y - reach <= surface + unit * 0.3) {
      if (
        target &&
        Math.abs(target.x - entity.x) <
          world.widthOf(target) * 0.5 + world.widthOf(entity) * 0.2 + unit
      ) {
        launchBoat(target, entity, world, ramProfiles[kind].launch)
        entity.vy *= 0.85
      }

      if (kind !== 'whale') {
        entity.vx = entity.facing * burst * 0.3
      }

      spawnBurst(world, entity.x, surface + unit, kind === 'whale' ? 4.2 : 3)
      world.setState(entity, 'breach')
    }

    return true
  }

  if (kind === 'whale') {
    return whaleFallBack(entity, world, dt, { gravity, launch, margin, reach })
  }

  entity.vy += gravity * dt
  integrate(entity, dt)
  entity.x = clamp(entity.x, margin, world.width - margin)
  entity.tilt = clamp((Math.atan2(entity.vy, Math.abs(entity.vx) + 1) * 180) / Math.PI, -80, 80)

  if (entity.vy > 0 && entity.y - reach * 0.2 > surface + unit) {
    spawnBurst(world, entity.x, surface + unit, 3.2)
    world.shake(0.3)
    entity.vy *= 0.3
    endRam(entity, world, kind)
  }

  return true
}

function consume(hunter: EcoEntity, prey: EcoEntity, world: EcoWorld, reach = 1.7, heal = 0.35) {
  const gap = Math.hypot(prey.x - hunter.x, prey.y - hunter.y)

  if (gap > world.unit * reach + world.widthOf(prey) * 0.28 + world.widthOf(hunter) * 0.18) {
    return false
  }

  const edge = matchupEdge(hunter, prey, world)

  if (edge < 1 && Math.random() < 0.5) {
    hurt(hunter, world, 0.5)
    hunter.targetId = null
    flee(hunter, prey, world.unit * 5, 0.16)
    return false
  }

  if (prey.species === 'boat') {
    capsizeBoat(prey, world, hunter)
    hunter.targetId = null
    return true
  }

  if (edge >= 1.6 || Math.random() < 0.78) {
    world.kill(prey)
    hunter.hp = Math.min(hunter.maxHp, hunter.hp + heal)
    hunter.targetId = null
    hunter.data.fed = (hunter.data.fed ?? 0) + 1
    spawnBurst(world, prey.x, prey.y, 1.7)
    return true
  }

  hurt(prey, world, 0.7)
  hunter.targetId = null

  return false
}

function targetOrNearest(
  entity: EcoEntity,
  world: EcoWorld,
  test: (other: EcoEntity) => boolean,
  range: number,
) {
  const current = world.byId(entity.targetId)

  if (current && test(current)) {
    return current
  }

  const next = world.nearest(entity, test, range)
  entity.targetId = next?.id ?? null

  return next
}

function hungerDrift(entity: EcoEntity, world: EcoWorld, dt: number, fed: boolean, seconds = 42) {
  if (fed) {
    entity.data.hunger = 0
    return
  }

  const hunger = (entity.data.hunger ?? 0) + dt
  entity.data.hunger = hunger

  if (hunger > seconds) {
    entity.fx = 'dazed'
    entity.data.fx = 0.4
    entity.hp -= dt * 0.1

    if (entity.hp <= 0) {
      world.kill(entity)
    }
  }
}

function grazeKelp(fish: EcoEntity, kelp: EcoEntity, world: EcoWorld) {
  if (
    Math.hypot(fish.x - kelp.x, fish.y - (kelp.y - world.heightOf(kelp) * 0.52)) >
    world.unit * 3.3
  ) {
    return false
  }

  fish.data.fed = (fish.data.fed ?? 0) + world.edge(fish, kelp)
  kelp.data.nibbled = 0.55
  kelp.fx = 'wobble'

  if (fish.data.fed > 4.8 && world.canBreed() && world.count(isFish) < 24 && chance(0.2, 0.12)) {
    fish.data.fed = 0
    world.spawn('fish-school', {
      countAs: 'fish-school',
      size: fish.size * between(0.78, 0.94),
      x: clamp(fish.x + between(-1.8, 1.8) * world.unit, world.unit, world.width - world.unit),
      y: clamp(fish.y + between(-1.2, 1.2) * world.unit, waterTop(world), waterBottom(world)),
    })
  }

  return true
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

function isControlTarget(entity: EcoEntity, other: EcoEntity) {
  return (
    other !== entity &&
    !other.dying &&
    !other.removed &&
    (other.maxHp > 1 || isBoat(other)) &&
    other.species !== 'kelp-coral'
  )
}

function frontTarget(entity: EcoEntity, world: EcoWorld, reach: number, vertical = 5) {
  const x = entity.x + entity.facing * reach * 0.5

  return world.nearest(
    { x, y: entity.y },
    (other) =>
      isControlTarget(entity, other) &&
      Math.sign(other.x - entity.x || entity.facing) === entity.facing &&
      Math.abs(other.y - entity.y) < world.unit * vertical,
    reach,
  )
}

function areaTargets(entity: EcoEntity, world: EcoWorld, radius: number) {
  return world.within(entity.x, entity.y, radius, (other) => isControlTarget(entity, other))
}

function controlHit(attacker: EcoEntity, target: EcoEntity, world: EcoWorld, amount: number) {
  if (isBoat(target)) {
    if (amount * matchupEdge(attacker, target, world) > 1.1) {
      capsizeBoat(target, world, attacker)
    } else {
      hurt(target, world, amount)
    }
    return
  }

  const dealt = world.damage(
    null,
    target,
    amount * matchupEdge(attacker, target, world),
    attacker.x,
  )
  if (dealt > 0) {
    attacker.data.hitStopUntil = world.time + 0.05
  }
  world.gainControlResource(attacker, dealt * 8)
}

function shove(attacker: EcoEntity, target: EcoEntity, world: EcoWorld, force: number) {
  target.vx += (target.x >= attacker.x ? 1 : -1) * world.unit * force
  target.vy += (target.y >= attacker.y ? 1 : -1) * world.unit * force * 0.35
  target.data.fx = Math.max(target.data.fx ?? 0, 0.45)
  target.fx = 'dazed'
}

function noseOf(entity: EcoEntity, world: EcoWorld) {
  return { x: entity.x + entity.facing * world.widthOf(entity) * 0.42, y: entity.y }
}

const podRange = 24
const podSize = 3
const podCallRange = 70

function orcasNear(entity: EcoEntity, world: EcoWorld, range = podRange) {
  return world.within(entity.x, entity.y, world.unit * range, isOrca)
}

// An orca's pod is every orca swimming with it that hasn't been driven off a whale.
function orcaPod(orca: EcoEntity, world: EcoWorld) {
  return orcasNear(orca, world, podRange + 6).filter(
    (mate) => world.time > (mate.data.whaleGiveUpUntil ?? 0),
  )
}

function rallyPod(orca: EcoEntity, target: EcoEntity, world: EcoWorld) {
  for (const mate of orcasNear(orca, world)) {
    if (mate !== orca && (!isWhale(target) || world.time > (mate.data.whaleGiveUpUntil ?? 0))) {
      mate.targetId = target.id
    }
  }
}

// One or two orcas can only nip a whale; a pod of three or more takes turns and wears it down.
function orcaBiteWhale(orca: EcoEntity, whale: EcoEntity, world: EcoWorld) {
  const tired = whale.data.tired ?? 0

  whale.data.harriedAt = world.time

  if (orcaPod(orca, world).length >= podSize) {
    whale.data.tired = Math.min(1, tired + 0.1)
    world.damage(null, whale, 0.3 + tired * 0.5, orca.x)
    return
  }

  whale.targetId = orca.id

  if (whale.hp - 0.3 > whale.maxHp * 0.5) {
    world.damage(null, whale, 0.3, orca.x)
    return
  }

  world.effect({
    text: 'Shrugs it off',
    tone: 'resist',
    type: 'damage',
    x: whale.x,
    y: whale.y - world.heightOf(whale) * 0.4,
  })
}

type SeaAbilityConfig = {
  active?: number
  amount?: number | ((target: EcoEntity) => number)
  archetype?: string
  asset?: string
  cooldown: number
  dash?: number
  description: string
  icon?: string
  name: string
  radius?: number
  recovery?: number
  shape: 'circle' | 'line' | 'self'
  state?: string
  target?: 'area' | 'front'
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

function seaAbility(config: SeaAbilityConfig): EcoControlAbility {
  const range = config.radius ?? Math.abs(config.dash ?? 4)
  const width = config.width ?? (config.shape === 'line' ? 2.8 : range)

  return {
    active: config.active ?? 0.26,
    archetype: config.archetype,
    cooldown: config.cooldown,
    dash: config.dash,
    description: config.description,
    icon: config.icon,
    key: 'q',
    name: config.name,
    recovery: config.recovery ?? 0.24,
    telegraph: { range, shape: config.shape, width },
    vfx: config.vfx,
    windup: config.windup ?? 0.25,
    run(entity, world, context) {
      controlAction(
        entity,
        world,
        config.state ?? entity.state,
        (config.active ?? 0.26) + 0.18,
        config.asset,
        config.vfx,
      )

      if (config.vfx === 'shockwave') {
        world.shake(0.35)
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
        const amount = typeof config.amount === 'function' ? config.amount(target) : config.amount

        if (amount > 0) {
          controlHit(entity, target, world, amount)
          shove(entity, target, world, 2.8)
        }
        config.onHit?.(entity, target, world)
      }
    },
  }
}

const fishControls = {
  abilities: [
    seaAbility({
      cooldown: 2.2,
      dash: 5,
      description: 'Flash silver and burst away. Nearby hunters lose track of the school.',
      icon: 'scatter',
      name: 'Flash scatter',
      shape: 'line',
      state: 'scatter',
      vfx: 'water',
      width: 3,
      onRun(entity, world) {
        for (const hunter of world.within(entity.x, entity.y, world.unit * 7, isPredator)) {
          hunter.targetId = null
          hunter.fx = 'dazed'
          hunter.data.fx = 1
        }
      },
    }),
  ],
  idleState: 'school',
  move: 'swim',
  moveState: 'school',
  speed: controlledSeaSpeed('fish'),
} as const

const jellyControls = {
  abilities: [
    seaAbility({
      amount: (target) => (isShark(target) ? 0.7 : 1.1),
      cooldown: 2.2,
      description: 'Sting the closest creature in front and slow it down.',
      icon: 'sting',
      name: 'Sting',
      radius: 4.2,
      shape: 'line',
      state: 'drift',
      target: 'front',
      vfx: 'water',
      width: 3.2,
      onHit(_entity, target, world) {
        target.data.controlSpeedUntil = world.time + 1.2
        target.data.controlSpeed = 0.55
      },
    }),
  ],
  idleState: 'drift',
  move: 'swim',
  moveState: 'drift',
  speed: controlledSeaSpeed('jellyfish'),
} as const

const turtleControls = {
  abilities: [
    seaAbility({
      amount: (target) => (isJelly(target) ? 1.6 : 0.85),
      cooldown: 2.4,
      description: 'Crunch jellyfish and small prey with a hard turtle beak.',
      icon: 'bite',
      name: 'Beak crunch',
      radius: 4.5,
      shape: 'line',
      state: 'paddle',
      target: 'front',
      vfx: 'bite',
      width: 3.8,
      onHit(entity, target, world) {
        world.heal(entity, isJelly(target) ? 0.6 : 0.2)
      },
    }),
  ],
  idleState: 'paddle',
  move: 'swim',
  moveState: 'paddle',
  speed: controlledSeaSpeed('turtle'),
} as const

const crabControls = {
  abilities: [
    seaAbility({
      amount: 0.9,
      cooldown: 1.8,
      description: 'Pinch anything close after a claw tell.',
      icon: 'pinch',
      name: 'Pinch',
      radius: 3.2,
      shape: 'line',
      state: 'scuttle',
      target: 'front',
      vfx: 'slash',
      width: 3,
    }),
  ],
  idleState: 'scuttle',
  move: 'ground',
  moveState: 'scuttle',
  speed: controlledSeaSpeed('crab'),
} as const

const pufferControls = {
  abilities: [
    seaAbility({
      active: 0.35,
      archetype: 'Mega puff',
      cooldown: 3,
      description:
        'Gulp water and balloon into a huge spiky ball. Small fish pop, big swimmers get stabbed and bounced off.',
      icon: 'puff',
      name: 'Mega puff',
      radius: 9,
      shape: 'circle',
      state: 'puffed',
      vfx: 'shockwave',
      onRun(entity, world) {
        startPuff(entity, world, 3.6)
        entity.data.controlSpeedUntil = entity.data.puffUntil ?? world.time
        entity.data.controlSpeed = 0.6
      },
      onTick(entity, world, context) {
        entity.scale = 1 + (pufferMaxScale - 1) * easeOutBack(context.activeProgress)
        pufferSpikes(entity, world)
      },
    }),
  ],
  idleState: 'drift',
  move: 'swim',
  moveState: 'drift',
  pose(entity: EcoEntity, world: EcoWorld) {
    const puffUntil = entity.data.puffUntil ?? 0

    if (world.time < puffUntil) {
      entity.scale = pufferMaxScale + Math.sin(world.time * 9) * 0.06
      pufferSpikes(entity, world)
      return { asset: pufferPuffedAsset, state: 'puffed' }
    }

    const shrink = clamp((world.time - puffUntil) / 0.7, 0, 1)

    entity.scale = 1 + (pufferMaxScale - 1) * (1 - shrink) ** 2
    pufferSpikes(entity, world)

    return {
      asset: shrink < 0.6 ? pufferPuffedAsset : pufferAsset,
      state: shrink < 1 ? 'deflate' : 'drift',
    }
  },
  speed: controlledSeaSpeed('pufferfish'),
} as const

const sharkControls = {
  abilities: [
    seaAbility({
      active: 0.32,
      amount: 1.55,
      archetype: 'Ram-bite',
      asset: sharkBiteAsset,
      cooldown: 1.6,
      dash: 3.8,
      description: 'Burst in with the snout and bite.',
      icon: 'bite',
      name: 'Ram bite',
      radius: 7.2,
      shape: 'line',
      state: 'hunt',
      target: 'front',
      vfx: 'bite',
      width: 4.8,
      onHit(entity, _target, world) {
        world.heal(entity, 0.35)
      },
    }),
  ],
  idleState: 'prowl',
  move: 'swim',
  moveState: 'prowl',
  speed: controlledSeaSpeed('shark'),
} as const

const swordfishControls = {
  abilities: [
    seaAbility({
      amount: 1.35,
      archetype: 'Bill thrust',
      cooldown: 2,
      dash: 7,
      description: 'Thrust the long bill straight through everything in the way.',
      icon: 'lance',
      name: 'Bill thrust',
      shape: 'line',
      state: 'strike',
      target: 'area',
      vfx: 'charge',
      width: 3.2,
    }),
  ],
  idleState: 'lance',
  move: 'swim',
  moveState: 'lance',
  speed: controlledSeaSpeed('swordfish'),
} as const

const octopusControls = {
  abilities: [
    seaAbility({
      archetype: 'Ink jet',
      asset: octopusInkAsset,
      cooldown: 3.2,
      dash: -6,
      description: 'Blast a cloud of ink that dazes nearby hunters, then jet backward out of it.',
      icon: 'ink',
      name: 'Ink jet',
      shape: 'line',
      state: 'ink',
      vfx: 'ink',
      width: 5,
      onRun(entity, world) {
        spawnBurst(world, entity.x, entity.y, 3.1)
        for (const target of areaTargets(entity, world, world.unit * 5.5)) {
          target.targetId = null
          target.data.controlSpeedUntil = world.time + 2
          target.data.controlSpeed = 0.55
          shove(entity, target, world, 2.4)
        }
      },
    }),
  ],
  idleState: 'prowl',
  move: 'swim',
  moveState: 'prowl',
  speed: controlledSeaSpeed('octopus'),
} as const

const whaleControls = {
  abilities: [
    seaAbility({
      active: 8,
      archetype: 'Breach ram',
      cooldown: 4,
      description: 'Dive, then rocket up under the nearest boat and launch it into the air.',
      icon: 'breach',
      name: 'Breach ram',
      radius: 18,
      shape: 'circle',
      vfx: 'water',
      windup: 0.3,
      onRun(entity, world) {
        entity.fx = ''
        entity.data.controlFxUntil = 0
        startRam(
          entity,
          world,
          'whale',
          world.nearest({ x: entity.x, y: surfaceY(world) }, isSailingBoat, world.unit * 18),
          true,
        )
      },
      onTick(entity, world, context, dt) {
        if (ramming(entity, world, dt, 'whale')) {
          return
        }

        context.cast.phaseElapsed = Number.POSITIVE_INFINITY
        entity.data.controlActionUntil = world.time
      },
    }),
  ],
  idleState: 'cruise',
  move: 'swim',
  moveState: 'cruise',
  pose: () => ({ asset: whaleAsset, state: 'cruise' }),
  speed: controlledSeaSpeed('whale'),
} as const

const orcaControls = {
  abilities: [
    seaAbility({
      active: 0.3,
      amount: (target) => (isWhale(target) ? 0 : 1.25),
      archetype: 'Pod strike',
      cooldown: 2.4,
      dash: 4.2,
      description:
        'Lunge-bite and call the pod in. Alone you can only nip a whale; with three or more orcas the pod wears it down.',
      icon: 'pod',
      name: 'Pod strike',
      radius: 6,
      shape: 'line',
      state: 'hunt',
      target: 'front',
      vfx: 'charge',
      width: 4.6,
      onTick(entity, world, context) {
        const nose = noseOf(entity, world)

        for (const whale of world.within(entity.x, entity.y, world.unit * 30, isWhale)) {
          if (!context.cast.hitIds.has(whale.id) && touches(nose, whale, world, world.unit * 1.6)) {
            context.cast.hitIds.add(whale.id)
            orcaBiteWhale(entity, whale, world)
            rallyPod(entity, whale, world)
          }
        }
      },
      onHit(entity, target, world) {
        if (isWhale(target)) {
          orcaBiteWhale(entity, target, world)
        }
        rallyPod(entity, target, world)
      },
    }),
  ],
  idleState: 'hunt',
  move: 'swim',
  moveState: 'hunt',
  speed: controlledSeaSpeed('orca'),
} as const

const anglerControls = {
  abilities: [
    seaAbility({
      active: 0.6,
      amount: 1.25,
      archetype: 'Lure gulp',
      asset: anglerAsset,
      cooldown: 2.8,
      description: 'Flash the lantern to reel small prey in, then snap them up.',
      icon: 'lure',
      name: 'Lure gulp',
      radius: 4.8,
      shape: 'line',
      state: 'strike',
      target: 'front',
      vfx: 'bite',
      width: 3.2,
      onTick(entity, world, _context, dt) {
        const mouth = noseOf(entity, world)

        for (const target of world.within(
          entity.x,
          entity.y,
          world.unit * 9,
          (other) => isFish(other) || isJelly(other),
        )) {
          target.x += (mouth.x - target.x) * Math.min(1, dt * 3)
          target.y += (mouth.y - target.y) * Math.min(1, dt * 3)
          target.fx = 'aim'
          target.data.fx = 0.8
        }
      },
      onHit(entity, _target, world) {
        world.heal(entity, 0.35)
      },
    }),
  ],
  idleState: 'lure',
  move: 'swim',
  moveState: 'lure',
  speed: controlledSeaSpeed('anglerfish'),
} as const

const kelpCoral: EcoSpecies = {
  anchor: 'bottom',
  asset: kelpAsset,
  burnTime: 3.8,
  countAs: 'kelp-coral',
  idle: 'sway',
  init(entity) {
    entity.data.growth = entity.state === 'grow' ? 0 : 1
    entity.scale = entity.state === 'grow' ? 0.42 : 1
  },
  layer: 'front',
  rest(entity) {
    entity.data.growth = 1
    entity.scale = 1
  },
  size: [3.2, 4.5],
  state: 'grow',
  strongVs: ['shark', 'anglerfish'],
  tags: ['plant'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    entity.y = floorY(world) + (entity.data.depth ?? 0)

    if (entity.state === 'grow') {
      const growth = Math.min(1, (entity.data.growth ?? 0) + dt * (entity.user ? 0.42 : 0.14))
      entity.data.growth = growth
      entity.scale = 0.42 + growth * 0.58

      if (growth >= 1) {
        world.setState(entity, 'bloom')
      }
      return
    }

    entity.data.nibbled = Math.max(0, (entity.data.nibbled ?? 0) - dt)

    const shelterSeeker = world.nearest(
      { x: entity.x, y: entity.y - world.heightOf(entity) * 0.5 },
      (other) => isFish(other) || isOctopus(other) || isCrab(other),
      world.unit * 4.5,
    )

    entity.fx = shelterSeeker ? 'shelter' : entity.fx

    if (world.canBreed() && world.count(isFish) < 3 && chance(0.08, dt)) {
      world.spawn('fish-school', {
        countAs: 'fish-school',
        size: between(4.2, 5.2),
        x: clamp(entity.x + between(-2.4, 2.4) * world.unit, world.unit, world.width - world.unit),
        y: clamp(
          entity.y - world.heightOf(entity) * 0.52 + between(-1.4, 1.4) * world.unit,
          waterTop(world),
          waterBottom(world),
        ),
      })
    }

    if (!world.canBreed() || !chance(0.035, dt)) {
      return
    }

    const x = clamp(
      entity.x + between(-5, 5) * world.unit,
      world.unit * 2,
      world.width - world.unit * 2,
    )

    if (!world.nearest({ x, y: floorY(world) }, isKelp, world.unit * 3.2)) {
      world.spawn('kelp-coral', { state: 'grow', x })
    }
  },
  weakTo: ['crab', 'sea-turtle', 'fish-school'],
}

const fishSchool: EcoSpecies = {
  anchor: 'center',
  asset: fishAsset,
  countAs: 'fish-school',
  controls: fishControls,
  hp: 2,
  init(entity, world) {
    entity.data.goalAt = 0
    entity.facing = 1
    entity.y = clamp(entity.y, waterTop(world), waterBottom(world))
    entity.vx = pace(entity, world, 'fish', 'cruise') * between(0.85, 1.15)
  },
  layer: 'front',
  size: [4.8, 5.8],
  state: 'school',
  strongVs: ['kelp-coral'],
  tags: ['prey'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const predator = world.nearest(
      entity,
      (other) => isPredator(other) && world.edge(other, entity) >= 1,
      unit * 9,
    )

    if (predator) {
      world.setState(entity, 'scatter')
      flee(entity, predator, pace(entity, world, 'fish', 'burst'), dt, 5.5)
    } else {
      world.setState(entity, 'school')
      const kelp = targetOrNearest(
        entity,
        world,
        (other) => isKelp(other) && other.state !== 'grow',
        unit * 16,
      )

      if (kelp) {
        steer(
          entity,
          kelp.x,
          kelp.y - world.heightOf(kelp) * 0.55,
          pace(entity, world, 'fish', 'cruise'),
          dt,
          2.2,
        )
        grazeKelp(entity, kelp, world)
      } else {
        wander(
          entity,
          world,
          dt,
          pace(entity, world, 'fish', 'cruise'),
          waterTop(world),
          waterBottom(world),
          1.8,
        )
      }

      entity.vx += (pace(entity, world, 'fish', 'cruise') - entity.vx) * dt * 0.85
    }

    const neighbors = world
      .within(entity.x, entity.y, unit * 7, isFish)
      .filter((other) => other !== entity)

    if (neighbors.length) {
      const center = neighbors.reduce(
        (point, other) => ({ x: point.x + other.x, y: point.y + other.y }),
        { x: 0, y: 0 },
      )
      center.x /= neighbors.length
      center.y /= neighbors.length
      entity.vx += (center.x - entity.x) * dt * 0.35
      entity.vy += (center.y - entity.y) * dt * 0.22

      for (const other of neighbors) {
        const gap = Math.hypot(entity.x - other.x, entity.y - other.y)

        if (gap < unit * 1.6) {
          entity.vx += ((entity.x - other.x) / Math.max(gap, 1)) * unit * dt * 2.5
          entity.vy += ((entity.y - other.y) / Math.max(gap, 1)) * unit * dt * 1.6
        }
      }
    }

    hungerDrift(
      entity,
      world,
      dt,
      world.count(
        (other) =>
          isCrab(other) || isFish(other) || isBoat(other) || isPuffer(other) || isSwordfish(other),
      ) > 0,
      62,
    )
    integrate(entity, dt)
    if (predator) {
      keepInWater(entity, world)
      faceTravel(entity)
    } else {
      keepWaterDepth(entity, world)
      wrapRight(entity, world)
    }
    tiltToVelocity(entity, 14)
  },
  weakTo: ['jellyfish', 'shark', 'octopus', 'boat', 'sea-net', 'anglerfish', 'swordfish'],
}

const jellyfish: EcoSpecies = {
  anchor: 'center',
  asset: jellyAsset,
  countAs: 'jellyfish',
  controls: jellyControls,
  hp: 2,
  idle: 'undulate',
  init(entity, world) {
    entity.y = clamp(entity.y, waterTop(world), waterBottom(world))
    entity.data.pulse = between(0, 6)
  },
  layer: 'front',
  size: [3.2, 3.8],
  state: 'drift',
  strongVs: ['fish-school', 'shark', 'anglerfish', 'swordfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const turtle = world.nearest(entity, isTurtle, unit * 8)

    if (turtle && world.edge(turtle, entity) > 1) {
      flee(entity, turtle, pace(entity, world, 'jellyfish', 'burst'), dt, 2.8)
    } else {
      entity.vx +=
        (Math.sin(world.time * 0.42 + entity.id) * pace(entity, world, 'jellyfish', 'cruise') -
          entity.vx) *
        dt *
        0.6
      entity.vy +=
        (Math.sin(world.time * 0.7 + entity.id) * pace(entity, world, 'jellyfish', 'cruise') * 0.7 -
          entity.vy) *
        dt *
        0.8
    }

    const target = world.nearest(entity, (other) => isFish(other) || isShark(other), unit * 2.8)

    if (target && world.edge(entity, target) >= 1) {
      hurt(target, world, isShark(target) ? 0.45 : 1)
      entity.fx = 'sting'
      entity.data.fx = 0.38
      entity.data.fed = (entity.data.fed ?? 0) + 1
    }

    integrate(entity, dt)
    keepInWater(entity, world, waterTop(world) + unit, waterBottom(world))
    entity.tilt = Math.sin(world.time * 0.6 + entity.id) * 4
  },
  weakTo: ['sea-turtle', 'crab', 'boat'],
}

const seaTurtle: EcoSpecies = {
  anchor: 'center',
  asset: turtleAsset,
  countAs: 'sea-turtle',
  controls: turtleControls,
  hp: 3,
  idle: 'bob',
  init(entity, world) {
    entity.y = clamp(entity.y, waterTop(world) + world.unit * 2, waterBottom(world))
  },
  layer: 'front',
  size: [4.8, 5.4],
  state: 'paddle',
  strongVs: ['jellyfish', 'kelp-coral'],
  tags: ['prey'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const threat = world.nearest(entity, (other) => isOrca(other) || isShark(other), unit * 11)
    let cruising = false

    if (threat && world.edge(threat, entity) > 1) {
      flee(entity, threat, pace(entity, world, 'turtle', 'burst'), dt, 3.2)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) => isJelly(other) || isCalmPuffer(other),
        unit * 15,
      )

      if (target) {
        steer(entity, target.x, target.y, pace(entity, world, 'turtle', 'burst'), dt, 2.6)
        consume(entity, target, world, 1.8)
      } else {
        wander(
          entity,
          world,
          dt,
          pace(entity, world, 'turtle', 'cruise'),
          waterTop(world) + unit * 2,
          waterBottom(world),
          1.6,
        )
        entity.vx += (pace(entity, world, 'turtle', 'cruise') - entity.vx) * dt * 0.55
        cruising = true
      }
    }

    hungerDrift(entity, world, dt, world.count((other) => isFish(other) || isJelly(other)) > 0, 50)
    integrate(entity, dt)
    if (cruising) {
      keepWaterDepth(entity, world, waterTop(world) + unit, waterBottom(world))
      wrapRight(entity, world)
    } else {
      keepInWater(entity, world, waterTop(world) + unit, waterBottom(world))
      faceTravel(entity)
    }
    tiltToVelocity(entity, 16)
  },
  weakTo: ['orca', 'shark'],
}

const crab: EcoSpecies = {
  anchor: 'bottom',
  asset: crabAsset,
  countAs: 'crab',
  controls: crabControls,
  hp: 2,
  idle: 'trot',
  init(entity, world) {
    entity.y = floorY(world) + (entity.data.depth ?? 0)
    entity.data.turnAt = world.time + between(2, 5)
  },
  layer: 'front',
  size: [1.8, 2.1],
  state: 'scuttle',
  strongVs: ['jellyfish', 'kelp-coral'],
  tags: ['prey'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const octopus = world.nearest(entity, isOctopus, unit * 7)

    if (octopus && world.edge(octopus, entity) > 1) {
      entity.facing = entity.x < octopus.x ? -1 : 1
      entity.x += entity.facing * pace(entity, world, 'crab', 'burst') * dt
    } else {
      if (world.time > (entity.data.turnAt ?? 0)) {
        entity.facing = Math.random() < 0.5 ? -1 : 1
        entity.data.turnAt = world.time + between(2, 5)
      }
      walk(entity, world, dt, pace(entity, world, 'crab', 'cruise'))
    }

    const jelly = world.nearest(entity, isJelly, unit * 3.2)

    if (jelly && world.edge(entity, jelly) >= 1 && consume(entity, jelly, world, 1.4, 0.2)) {
      entity.fx = 'pinch'
      entity.data.fx = 0.4
    }

    entity.y = floorY(world) + (entity.data.depth ?? 0)
    driftTurn(entity, world)
  },
  weakTo: ['octopus', 'shark', 'pufferfish'],
}

const pufferfish: EcoSpecies = {
  anchor: 'center',
  asset: pufferAsset,
  countAs: 'pufferfish',
  controls: pufferControls,
  hp: 2,
  idle: 'bob',
  init(entity, world) {
    entity.y = clamp(entity.y, waterTop(world) + world.unit * 2, waterBottom(world))
    entity.data.puffCool = between(1, 3)
  },
  layer: 'front',
  size: [1.8, 2.2],
  state: 'drift',
  strongVs: ['shark', 'orca', 'fish-school', 'crab', 'jellyfish', 'anglerfish'],
  tags: ['prey'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const threat = world.nearest(
      entity,
      (other) =>
        isShark(other) ||
        isOrca(other) ||
        isSwordfish(other) ||
        isOctopus(other) ||
        isTurtle(other),
      unit * 7 + world.widthOf(entity) * 0.5,
    )
    const startled = world.time - (entity.data.hitFlash ?? -9) < 0.5

    entity.data.puffCool = Math.max(0, (entity.data.puffCool ?? 0) - dt)

    if (entity.state === 'drift' && entity.scale > 1.3) {
      world.setState(entity, 'deflate')
    }

    if (
      entity.state === 'drift' &&
      (entity.data.puffCool ?? 0) <= 0 &&
      (threat || startled || chance(0.025, dt))
    ) {
      startPuff(entity, world, between(3, 4.5))
    }

    if (entity.state === 'puffed') {
      springScale(entity, pufferMaxScale, 60, 9, dt)
      pufferSpikes(entity, world)
      const prey = world.nearest(entity, (other) => pufferSmallPrey.has(other.species), unit * 14)
      const aim = prey ?? threat

      if (aim) {
        steer(entity, aim.x, aim.y, pace(entity, world, 'pufferfish', 'cruise') * 1.4, dt, 1.2)
      } else {
        entity.vx *= 1 - Math.min(1, dt)
        entity.vy += (Math.sin(world.time * 2 + entity.id) * unit * 0.6 - entity.vy) * dt
      }

      if (world.time > (entity.data.puffUntil ?? 0)) {
        world.setState(entity, 'deflate')
      }
    } else if (entity.state === 'deflate') {
      world.setAsset(entity, entity.scale > 1.6 ? pufferPuffedAsset : pufferAsset)
      springScale(entity, 1, 14, 5, dt)
      pufferSpikes(entity, world)
      entity.vx += between(-1, 1) * unit * 40 * dt
      entity.vy += between(-1, 1) * unit * 30 * dt
      entity.vx *= 1 - Math.min(1, dt * 1.5)
      entity.vy *= 1 - Math.min(1, dt * 1.5)

      if (entity.scale < 1.04 && entity.t > 0.8) {
        entity.scale = 1
        entity.data.scaleV = 0
        entity.data.puffCool = between(2.5, 5)
        world.setState(entity, 'drift')
      }
    } else {
      world.setAsset(entity, pufferAsset)
      wander(
        entity,
        world,
        dt,
        pace(entity, world, 'pufferfish', 'cruise'),
        waterTop(world),
        waterBottom(world),
        1.8,
      )
      entity.vx += (pace(entity, world, 'pufferfish', 'cruise') - entity.vx) * dt * 0.65
    }

    integrate(entity, dt)
    if (entity.state === 'drift') {
      keepWaterDepth(entity, world)
      wrapRight(entity, world)
    } else {
      keepInWater(entity, world)
      faceTravel(entity)
    }
    tiltToVelocity(entity, entity.state === 'drift' ? 12 : 6)
  },
  weakTo: ['sea-turtle', 'octopus', 'swordfish'],
}

const shark: EcoSpecies = {
  anchor: 'center',
  asset: sharkAsset,
  countAs: 'shark',
  controls: sharkControls,
  hp: 4,
  idle: 'none',
  init(entity, world) {
    entity.y = clamp(entity.y, waterTop(world) + world.unit * 2, waterBottom(world))
    entity.vx = entity.facing * pace(entity, world, 'shark', 'cruise') * between(0.8, 1.15)
    scheduleRam(entity, world, 'shark', 0.5)
  },
  layer: 'front',
  size: [10.6, 11.8],
  state: 'prowl',
  strongVs: ['fish-school', 'sea-turtle', 'crab', 'anglerfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    if (ramming(entity, world, dt, 'shark')) {
      return
    }

    const unit = world.unit
    const danger = world.nearest(
      entity,
      (other) =>
        (isOrca(other) ||
          isOctopus(other) ||
          isPuffedPuffer(other) ||
          isJelly(other) ||
          isSwordfish(other)) &&
        world.edge(other, entity) > 1,
      unit * 8,
    )

    if (danger) {
      world.setAsset(entity, sharkAsset)
      world.setState(entity, 'flee')
      flee(entity, danger, pace(entity, world, 'shark', 'burst'), dt, 4.2)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) => isFish(other) || isTurtle(other) || isCrab(other) || isBoat(other),
        unit * 18,
      )

      if (target) {
        world.setAsset(entity, sharkBiteAsset)
        world.setState(entity, 'hunt')
        steer(entity, target.x, target.y, pace(entity, world, 'shark', 'burst'), dt, 2.8)
        consume(entity, target, world, isBoat(target) ? 2.3 : 1.8)
      } else if (maybeStartRam(entity, world, 'shark')) {
        return
      } else {
        world.setAsset(entity, sharkAsset)
        world.setState(entity, 'prowl')
        wander(
          entity,
          world,
          dt,
          pace(entity, world, 'shark', 'cruise'),
          waterTop(world),
          waterBottom(world),
          1.4,
        )
      }
    }

    hungerDrift(
      entity,
      world,
      dt,
      world.count((other) => isFish(other) || isTurtle(other) || isCrab(other) || isBoat(other)) >
        0,
      58,
    )
    integrate(entity, dt)
    keepInWater(entity, world)
    faceTravel(entity)
    tiltToVelocity(entity, 18)
  },
  weakTo: ['orca', 'octopus', 'pufferfish', 'boat', 'jellyfish', 'swordfish'],
}

const swordfish: EcoSpecies = {
  anchor: 'center',
  asset: swordfishAsset,
  countAs: 'swordfish',
  controls: swordfishControls,
  hp: 3,
  init(entity, world) {
    entity.y = clamp(entity.y, waterTop(world) + world.unit * 2, waterBottom(world))
    entity.vx = entity.facing * pace(entity, world, 'swordfish', 'cruise') * between(0.8, 1.15)
    scheduleRam(entity, world, 'swordfish', 0.5)
  },
  layer: 'front',
  size: [7.6, 8.8],
  state: 'lance',
  strongVs: ['fish-school', 'shark', 'anglerfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    if (ramming(entity, world, dt, 'swordfish')) {
      return
    }

    const unit = world.unit
    const danger = world.nearest(
      entity,
      (other) =>
        (isJelly(other) || isOrca(other) || isBoat(other)) && world.edge(other, entity) > 1,
      unit * 9,
    )

    if (danger) {
      world.setState(entity, 'evade')
      flee(entity, danger, pace(entity, world, 'swordfish', 'burst'), dt, 4.2)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) => isFish(other) || isShark(other) || isAngler(other),
        unit * 22,
      )

      if (target && world.edge(entity, target) > 1) {
        world.setState(entity, 'strike')
        steer(entity, target.x, target.y, pace(entity, world, 'swordfish', 'burst'), dt, 3.4)

        if (
          Math.hypot(entity.x - target.x, entity.y - target.y) <
          world.unit * 2.4 + world.widthOf(entity) * 0.2
        ) {
          hurt(target, world, 0.9 * world.edge(entity, target))
          entity.fx = 'jab'
          entity.data.fx = 0.35
          entity.targetId = null
          entity.vx *= -0.35
        }
      } else if (maybeStartRam(entity, world, 'swordfish')) {
        return
      } else {
        world.setState(entity, 'lance')
        wander(
          entity,
          world,
          dt,
          pace(entity, world, 'swordfish', 'cruise'),
          waterTop(world),
          waterBottom(world),
          1.3,
        )
      }
    }

    hungerDrift(
      entity,
      world,
      dt,
      world.count((other) => isFish(other) || isShark(other) || isAngler(other)) > 0,
      54,
    )
    integrate(entity, dt)
    keepInWater(entity, world)
    faceTravel(entity)
    tiltToVelocity(entity, 14)
  },
  weakTo: ['jellyfish', 'orca', 'boat', 'sea-net'],
}

const octopus: EcoSpecies = {
  anchor: 'center',
  asset: octopusAsset,
  countAs: 'octopus',
  controls: octopusControls,
  hp: 3,
  idle: 'undulate',
  init(entity, world) {
    entity.y = clamp(entity.y, deepTop(world), deepBottom(world))
    entity.data.inkCool = between(1, 3)
  },
  layer: 'front',
  size: [4.3, 5],
  state: 'prowl',
  strongVs: ['shark', 'crab', 'boat', 'pufferfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    entity.data.inkCool = Math.max(0, (entity.data.inkCool ?? 0) - dt)
    const unit = world.unit
    const danger = world.nearest(
      entity,
      (other) => (isOrca(other) || isWhale(other)) && world.edge(other, entity) > 1,
      unit * 8,
    )
    const shark = world.nearest(entity, isShark, unit * 6.5)

    if (danger) {
      world.setAsset(entity, octopusInkAsset)
      world.setState(entity, 'ink')
      entity.fx = 'ink'
      entity.data.fx = 0.7
      flee(entity, danger, pace(entity, world, 'octopus', 'burst'), dt, 3.5)
    } else if (shark && (entity.data.inkCool ?? 0) <= 0 && world.edge(entity, shark) > 1) {
      world.setAsset(entity, octopusInkAsset)
      world.setState(entity, 'ink')
      entity.fx = 'ink'
      entity.data.fx = 1.1
      entity.data.inkCool = between(6, 10)
      hurt(shark, world, 0.55)
      shark.targetId = null
      flee(shark, entity, pace(shark, world, 'shark', 'burst'), dt, 5)
      spawnBurst(world, entity.x, entity.y, 2.1)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) =>
          isCrab(other) ||
          isFish(other) ||
          isBoat(other) ||
          isCalmPuffer(other) ||
          isSwordfish(other),
        unit * 10,
      )

      if (target) {
        world.setAsset(entity, octopusAsset)
        world.setState(entity, 'grab')
        steer(entity, target.x, target.y, pace(entity, world, 'octopus', 'burst'), dt, 2.5)
        consume(entity, target, world, isBoat(target) ? 2.2 : 1.6)
      } else {
        world.setAsset(entity, octopusAsset)
        world.setState(entity, 'prowl')
        const kelp = world.nearest(entity, isKelp, unit * 8)

        if (kelp) {
          steer(
            entity,
            kelp.x,
            kelp.y - world.heightOf(kelp) * 0.4,
            pace(entity, world, 'octopus', 'cruise'),
            dt,
            1.5,
          )
        } else {
          wander(
            entity,
            world,
            dt,
            pace(entity, world, 'octopus', 'cruise'),
            deepTop(world),
            deepBottom(world),
            1.5,
          )
        }
      }
    }

    integrate(entity, dt)
    keepInWater(entity, world, waterTop(world) + unit * 4, deepBottom(world))
    faceTravel(entity)
    tiltToVelocity(entity, 14)
  },
  weakTo: ['orca', 'whale', 'pufferfish'],
}

function whaleTailSlap(whale: EcoEntity, world: EcoWorld, orcas: EcoEntity[], hunted: boolean) {
  if (world.time < (whale.data.slapAt ?? 0)) {
    return
  }

  const reach = world.widthOf(whale) * 0.5
  const orca = orcas.find(
    (other) =>
      Math.hypot(other.x - whale.x, other.y - whale.y) < reach + world.widthOf(other) * 0.3,
  )

  if (!orca) {
    return
  }

  whale.data.slapAt = world.time + (hunted ? between(1.6, 2.6) : between(0.9, 1.6))
  whale.fx = 'slap'
  whale.data.fx = 0.5
  world.damage(whale, orca, hunted ? 0.4 : 0.7, whale.x)
  shove(whale, orca, world, 9)
  orca.targetId = null
  spawnBurst(world, orca.x, orca.y, 2.2)

  if (!hunted && orcasNear(orca, world, podCallRange).length < podSize) {
    orca.data.whaleGiveUpUntil = world.time + between(10, 16)
  }
}

const whale: EcoSpecies = {
  anchor: 'center',
  asset: whaleAsset,
  countAs: 'whale',
  controls: whaleControls,
  hp: 5,
  idle: 'bob',
  init(entity, world) {
    capWidth(entity, world, 0.9)
    entity.y = clamp(entity.y, waterTop(world) + world.unit * 4, waterBottom(world))
    scheduleRam(entity, world, 'whale', 0.5)
    entity.facing = 1
    entity.vx = pace(entity, world, 'whale', 'cruise') * between(0.85, 1.15)
  },
  layer: 'front',
  size: [23.8, 26.3],
  state: 'cruise',
  strongVs: ['boat', 'octopus', 'orca'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    if (ramming(entity, world, dt, 'whale')) {
      return
    }

    const unit = world.unit
    const orcas = orcasNear(entity, world).filter(
      (orca) => world.time > (orca.data.whaleGiveUpUntil ?? 0),
    )
    const hunted = orcas.some((orca) => orcaPod(orca, world).length >= podSize)
    const tired = entity.data.tired ?? 0
    let cruising = false

    world.setAsset(entity, whaleAsset)

    if (orcas.length) {
      whaleTailSlap(entity, world, orcas, hunted)
    }

    if (hunted) {
      const podX = orcas.reduce((sum, other) => sum + other.x, 0) / orcas.length
      const podY = orcas.reduce((sum, other) => sum + other.y, 0) / orcas.length

      world.setState(entity, 'flee')
      flee(
        entity,
        { x: podX, y: podY },
        pace(entity, world, 'whale', 'burst') * (1 - tired * 0.6),
        dt,
        1.4,
      )
    } else if (orcas.length) {
      const orca =
        world.nearest(entity, (other) => orcas.includes(other), unit * podRange) ?? orcas[0]!

      world.setState(entity, 'fight')
      steer(entity, orca.x, orca.y, pace(entity, world, 'whale', 'cruise') * 1.4, dt, 1.2)
    } else {
      entity.data.tired = Math.max(0, tired - dt * 0.05)

      if (world.time - (entity.data.harriedAt ?? -99) > 6) {
        entity.hp = Math.min(entity.maxHp, entity.hp + dt * 0.05)
      }

      if (maybeStartRam(entity, world, 'whale')) {
        return
      }

      world.setState(entity, 'cruise')
      entity.vx += (entity.facing * pace(entity, world, 'whale', 'cruise') - entity.vx) * dt * 0.5
      entity.vy += (Math.sin(world.time * 0.35 + entity.id) * unit * 0.25 - entity.vy) * dt * 0.6
      cruising = true
    }

    hungerDrift(
      entity,
      world,
      dt,
      world.count((other) => isBoat(other) || isOctopus(other)) > 0,
      72,
    )
    integrate(entity, dt)
    if (cruising) {
      keepWaterDepth(entity, world, surfaceY(world) + unit * 0.8, waterBottom(world))
      wrapRight(entity, world, world.widthOf(entity) * 0.58)
    } else {
      keepInWater(entity, world, surfaceY(world) + unit * 0.8, waterBottom(world))
      faceTravel(entity)
    }
    tiltToVelocity(entity, 12)
  },
  weakTo: ['orca-pod'],
}

const orcaPrey = (other: EcoEntity) =>
  isShark(other) || isTurtle(other) || isOctopus(other) || isSwordfish(other)

// The pod takes turns: one orca darts in to bite while the rest box the whale in
// ahead, above (cutting off its air), below and behind.
function podHunt(entity: EcoEntity, whale: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit
  const pod = orcaPod(entity, world).sort((a, b) => a.id - b.id)
  const index = Math.max(0, pod.indexOf(entity))
  const turn = Math.floor(world.time / 2) % pod.length
  const burst = pace(entity, world, 'orca', 'burst')

  world.setState(entity, 'hunt')

  if (index === turn) {
    steer(entity, whale.x, whale.y, burst, dt, 3)

    if (
      world.time > (entity.data.biteAt ?? 0) &&
      touches(noseOf(entity, world), whale, world, unit * 1.6)
    ) {
      entity.data.biteAt = world.time + 1.8
      orcaBiteWhale(entity, whale, world)
      entity.vx = -entity.facing * burst * 0.6
    }
    return
  }

  const ahead = world.widthOf(whale) * 0.6 + unit * 3
  const over = world.heightOf(whale) * 0.5 + unit * 2.5
  const slots = [
    { x: whale.facing * ahead, y: 0 },
    { x: 0, y: -over },
    { x: 0, y: over },
    { x: -whale.facing * ahead, y: 0 },
  ]
  const slot = slots[((index - turn - 1 + pod.length) % pod.length) % slots.length]!

  steer(
    entity,
    whale.x + slot.x + Math.sin(world.time * 1.6 + entity.id) * unit * 1.5,
    whale.y + slot.y,
    burst * 0.85,
    dt,
    2.2,
  )
}

function harassWhale(entity: EcoEntity, whale: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit
  const burst = pace(entity, world, 'orca', 'burst')

  world.setState(entity, 'hunt')

  if (world.time < (entity.data.biteAt ?? 0)) {
    const angle = world.time * 0.9 + entity.id

    steer(
      entity,
      whale.x + Math.cos(angle) * (world.widthOf(whale) * 0.7 + unit * 4),
      whale.y + Math.sin(angle) * (world.heightOf(whale) * 0.6 + unit * 3),
      burst * 0.7,
      dt,
      2,
    )
    return
  }

  steer(entity, whale.x, whale.y, burst, dt, 2.8)

  if (touches(noseOf(entity, world), whale, world, unit * 1.6)) {
    entity.data.biteAt = world.time + between(2.5, 4.5)
    orcaBiteWhale(entity, whale, world)
    entity.vx = -entity.facing * burst * 0.5
  }
}

// Orcas call to each other across the bay and fall in behind the lowest-id one, two abreast,
// keeping a little personal space.
function podFormation(entity: EcoEntity, world: EcoWorld, dt: number) {
  const unit = world.unit
  const pod = orcasNear(entity, world, podCallRange).sort((a, b) => a.id - b.id)

  world.setState(entity, pod.length > 1 ? 'pod' : 'hunt')

  if (pod.length < 2) {
    return false
  }

  const leader = pod[0]!

  if (leader === entity) {
    return false
  }

  const index = pod.indexOf(entity)
  const row = Math.ceil(index / 2)
  const side = index % 2 ? -1 : 1
  const gap = world.widthOf(leader) * 0.75

  steer(
    entity,
    leader.x - leader.facing * gap * row,
    leader.y + side * unit * 2.6 * row,
    pace(entity, world, 'orca', 'burst') * 0.8,
    dt,
    2,
  )

  for (const mate of pod) {
    const dx = entity.x - mate.x
    const dy = entity.y - mate.y
    const spacing = Math.hypot(dx, dy)

    if (mate !== entity && spacing < unit * 3) {
      entity.vx += (dx / Math.max(spacing, 1)) * unit * 20 * dt
      entity.vy += (dy / Math.max(spacing, 1)) * unit * 20 * dt
    }
  }

  return true
}

const orca: EcoSpecies = {
  anchor: 'center',
  asset: orcaAsset,
  countAs: 'orca',
  controls: orcaControls,
  hp: 4,
  init(entity, world) {
    entity.y = clamp(entity.y, waterTop(world) + world.unit * 3, waterBottom(world))
    scheduleRam(entity, world, 'orca', 0.5)
  },
  layer: 'front',
  size: [13.6, 15],
  state: 'hunt',
  strongVs: ['shark', 'sea-turtle', 'octopus', 'swordfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    if (ramming(entity, world, dt, 'orca')) {
      return
    }

    const unit = world.unit
    const puffer = world.nearest(entity, isPuffedPuffer, unit * 12)

    if (puffer) {
      world.setState(entity, 'flee')
      flee(entity, puffer, pace(entity, world, 'orca', 'burst'), dt, 3.5)
    } else {
      const whale =
        world.time > (entity.data.whaleGiveUpUntil ?? 0)
          ? world.nearest(entity, isWhale, unit * 26)
          : null
      const rallied = whale !== null && entity.targetId === whale.id
      const prey = rallied ? null : targetOrNearest(entity, world, orcaPrey, unit * 18)

      if (whale && orcaPod(entity, world).length >= podSize) {
        podHunt(entity, whale, world, dt)
      } else if (prey) {
        world.setState(entity, 'hunt')
        steer(entity, prey.x, prey.y, pace(entity, world, 'orca', 'burst'), dt, 2.4)
        consume(entity, prey, world, 1.8)
      } else if (whale && orcasNear(entity, world, podCallRange).length < podSize) {
        harassWhale(entity, whale, world, dt)
      } else if (maybeStartRam(entity, world, 'orca')) {
        return
      } else if (!podFormation(entity, world, dt)) {
        wander(
          entity,
          world,
          dt,
          pace(entity, world, 'orca', 'cruise'),
          waterTop(world),
          waterBottom(world),
          1.5,
        )
      }
    }

    hungerDrift(
      entity,
      world,
      dt,
      world.count((other) => orcaPrey(other) || isWhale(other)) > 0,
      62,
    )
    integrate(entity, dt)
    keepInWater(entity, world)
    faceTravel(entity)
    tiltToVelocity(entity, 16)
  },
  weakTo: ['boat', 'pufferfish'],
}

const anglerfish: EcoSpecies = {
  anchor: 'center',
  asset: anglerAsset,
  countAs: 'anglerfish',
  controls: anglerControls,
  hp: 2,
  idle: 'glow',
  init(entity, world) {
    entity.y = clamp(entity.y, deepTop(world), deepBottom(world))
  },
  layer: 'front',
  size: [2.7, 3.2],
  state: 'lure',
  style: (entity) => ({
    '--undersea-glow': entity.state === 'lure' ? '1' : '0.35',
  }),
  strongVs: ['fish-school', 'jellyfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const shark = world.nearest(
      entity,
      (other) => (isShark(other) || isSwordfish(other)) && world.edge(other, entity) > 1,
      unit * 7,
    )
    let cruising = false

    if (shark && world.edge(shark, entity) > 1) {
      world.setState(entity, 'hide')
      flee(entity, shark, pace(entity, world, 'anglerfish', 'burst'), dt, 3)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) => isFish(other) || isJelly(other),
        unit * 11,
      )

      if (target) {
        world.setState(entity, 'strike')
        steer(entity, target.x, target.y, pace(entity, world, 'anglerfish', 'burst'), dt, 2.6)
        consume(entity, target, world, 1.6)
      } else {
        world.setState(entity, 'lure')
        wander(
          entity,
          world,
          dt,
          pace(entity, world, 'anglerfish', 'cruise'),
          deepTop(world),
          deepBottom(world),
          1.4,
        )
        entity.vx += (pace(entity, world, 'anglerfish', 'cruise') - entity.vx) * dt * 0.5
        cruising = true
      }
    }

    integrate(entity, dt)
    if (cruising) {
      keepWaterDepth(entity, world, deepTop(world), deepBottom(world))
      wrapRight(entity, world)
    } else {
      keepInWater(entity, world, deepTop(world), deepBottom(world))
      faceTravel(entity)
    }
    tiltToVelocity(entity, 12)
  },
  weakTo: ['shark', 'kelp-coral', 'swordfish'],
}

const boat: EcoSpecies = {
  anchor: 'bottom',
  asset: weightedBoatAsset,
  countAs: 'boat',
  init(entity, world) {
    const variantIndex = Math.max(
      0,
      boatVariants.findIndex((variant) => variant.asset === entity.asset),
    )
    const variant = boatVariants[variantIndex] ?? boatVariants[0]!

    entity.data.kind = variantIndex
    entity.data.actionAt = world.time + between(2, 5)
    entity.data.waterline = variant.waterline
    entity.hp = variant.hp
    entity.size = between(variant.size[0], variant.size[1])
    entity.vx = entity.facing * world.unit * between(variant.speed[0], variant.speed[1])
    entity.data.cruise = entity.vx
    entity.y = boatBottomOnSurface(entity, world)
  },
  layer: 'front',
  size: [2.4, 18],
  state: 'sail',
  strongVs: ['fish-school', 'jellyfish', 'shark', 'orca'],
  tags: ['target'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const kind = entity.data.kind ?? 0
    const variant = boatVariants[kind] ?? boatVariants[0]!
    const variantId = variant.id

    if (entity.state === 'airborne') {
      flyBoat(entity, world, dt)
      return
    }

    if (entity.state === 'splashdown') {
      const bob = Math.sin(entity.t * 13) * Math.exp(-entity.t * 3.5)

      entity.y = boatBottomOnSurface(entity, world) + bob * unit * 0.9
      entity.x += entity.vx * dt
      entity.vx *= 1 - Math.min(1, dt * 1.5)
      entity.data.landTilt = (entity.data.landTilt ?? 0) * (1 - Math.min(1, dt * 4))
      entity.tilt = entity.data.landTilt + bob * 6

      if (entity.t > 1.1) {
        resumeSailing(entity, world)
      }
      return
    }

    if (entity.state === 'overturned') {
      entity.y = boatBottomOnSurface(entity, world)
      entity.x += entity.vx * dt
      entity.vx *= 1 - Math.min(1, dt * 1.2)
      entity.tilt += (Math.sin(entity.t * 3) * 6 - entity.tilt) * Math.min(1, dt * 3)

      if (entity.t > 1.6) {
        world.setState(entity, 'righting')
      }
      return
    }

    // Hops out of the water and rolls back over, swapping to the upright art halfway round.
    if (entity.state === 'righting') {
      const roll = clamp(entity.t / 0.8, 0, 1)

      entity.lift = Math.sin(roll * Math.PI) * unit * 2.2

      if (roll < 0.5) {
        entity.tilt = entity.facing * 180 * roll
      } else {
        world.setAsset(entity, variant.asset)
        entity.data.waterline = variant.waterline
        entity.tilt = entity.facing * (180 * roll - 180)
      }

      entity.y = boatBottomOnSurface(entity, world)

      if (roll >= 1) {
        entity.lift = 0
        entity.data.landTilt = 0
        spawnBurst(world, entity.x, surfaceY(world) + unit * 0.6, 2.4)
        world.setState(entity, 'splashdown')
      }
      return
    }

    if (entity.state === 'capsized') {
      entity.data.sinkDelay = (entity.data.sinkDelay ?? 2) - dt
      entity.y = boatBottomOnSurface(entity, world)
      entity.lift = 0
      entity.tilt += entity.facing * dt * 9

      if ((entity.data.sinkDelay ?? 0) <= 0) {
        world.setState(entity, 'sinking')
        entity.vy = unit * 1.2
      }
      return
    }

    if (entity.state === 'sinking') {
      entity.vy += unit * 0.7 * dt
      entity.y += entity.vy * dt
      entity.x += entity.vx * dt * 0.25
      entity.tilt += entity.facing * dt * 16

      if (entity.y >= floorY(world) + (entity.data.depth ?? 0)) {
        entity.y = floorY(world) + (entity.data.depth ?? 0)
        entity.vx = 0
        entity.vy = 0
        entity.tilt = between(-10, 10)
        world.setAsset(entity, wreckAsset)
        world.setState(entity, 'wreck')
      }
      return
    }

    if (entity.state === 'wreck') {
      entity.y = floorY(world) + (entity.data.depth ?? 0)

      if (entity.t > 28) {
        world.kill(entity)
      }
      return
    }

    entity.y = boatBottomOnSurface(entity, world)
    entity.x += entity.vx * dt
    entity.lift = 0
    entity.tilt = Math.sin(world.time * 1.2 + entity.id) * (kind === 4 ? 5 : 2.2)

    wrapRight(entity, world, world.widthOf(entity) * 0.55)

    entity.data.actionAt = (entity.data.actionAt ?? world.time + 4) - dt

    if ((entity.data.actionAt ?? 0) <= 0) {
      if (variantId === 'trawler') {
        entity.data.actionAt = between(6, 10)
        world.spawn('sea-net', {
          countAs: null,
          facing: entity.facing,
          x: entity.x - entity.facing * world.widthOf(entity) * 0.15,
          y: entity.y + unit * 0.8,
        })
      } else if (variantId === 'battleship') {
        entity.data.actionAt = between(4, 7)
        world.spawn('sea-depth-charge', {
          countAs: null,
          x: entity.x - entity.facing * world.widthOf(entity) * 0.2,
          y: entity.y + unit * 1.1,
        })
      } else if (variantId === 'surfboard' && chance(0.75, 1)) {
        entity.data.actionAt = between(8, 13)
        capsizeBoat(entity, world)
      } else {
        entity.data.actionAt = between(4, 9)
      }
    }
  },
  weakTo: ['whale', 'octopus'],
}

const seaNet: EcoSpecies = {
  anchor: 'center',
  asset: netAsset,
  countAs: null,
  init(entity, world) {
    entity.vy = world.unit * 1.4
    entity.vx = entity.facing * world.unit * 0.4
  },
  layer: 'front',
  size: [3.2, 4.2],
  state: 'sink',
  strongVs: ['fish-school', 'jellyfish'],
  tags: ['projectile'],
  tick(entity, world, dt) {
    entity.vy += world.unit * 0.45 * dt
    integrate(entity, dt)
    entity.tilt += dt * 12

    for (const fish of world.within(
      entity.x,
      entity.y,
      world.unit * 2.8,
      (other) => isFish(other) || isJelly(other),
    )) {
      if (world.edge(entity, fish) >= 1) {
        world.kill(fish)
        entity.fx = 'catch'
        world.tally('net-catches')
      }
    }

    if (entity.y > floorY(world) || entity.age > 12) {
      world.kill(entity)
    }
  },
  weakTo: ['sea-turtle', 'crab'],
}

const depthCharge: EcoSpecies = {
  anchor: 'center',
  asset: depthChargeAsset,
  countAs: null,
  init(entity, world) {
    entity.vy = world.unit * 2.4
    entity.data.explodeAt = between(deepTop(world), deepBottom(world))
  },
  layer: 'front',
  size: [1.4, 1.9],
  state: 'fall',
  strongVs: ['boat', 'shark', 'orca'],
  tags: ['projectile'],
  tick(entity, world, dt) {
    entity.vy += world.unit * 1.8 * dt
    integrate(entity, dt)
    entity.tilt += dt * 90

    if (entity.y < (entity.data.explodeAt ?? deepTop(world)) && entity.y < floorY(world)) {
      return
    }

    spawnBurst(world, entity.x, entity.y, 5.2)

    for (const target of world.within(
      entity.x,
      entity.y,
      world.unit * 8,
      (other) =>
        isBoat(other) || isFish(other) || isShark(other) || isOrca(other) || isTurtle(other),
    )) {
      if (isBoat(target)) {
        capsizeBoat(target, world, entity)
        continue
      }

      const edge = world.edge(entity, target)

      if (edge > 1 || Math.random() < 0.35) {
        hurt(target, world, edge > 1 ? 1.5 : 0.65)
      }
    }

    world.remove(entity)
  },
  weakTo: ['crab', 'octopus'],
}

const bubbleRing: EcoSpecies = {
  anchor: 'center',
  asset: bubbleRingAsset,
  countAs: null,
  init(entity) {
    entity.data.life ??= 0.9
    entity.scale = 0.3
  },
  layer: 'front',
  size: [3.2, 5.4],
  state: 'burst',
  tags: [],
  tick(entity, world, _dt) {
    const life = entity.data.life ?? 0.9
    const progress = clamp(entity.t / life, 0, 1)

    entity.scale = 0.3 + progress * 1.2
    entity.lift = progress * world.unit * 1.8

    if (entity.t >= life) {
      world.remove(entity)
    }
  },
}

const swimmer: EcoSpecies = {
  anchor: 'center',
  asset: swimmerAsset,
  countAs: null,
  init(entity, world) {
    entity.vy = -world.unit * between(1.5, 2.4)
    entity.vx = entity.facing * world.unit * between(0.4, 0.9)
  },
  layer: 'front',
  size: [1.4, 1.9],
  state: 'swim',
  tags: ['prey'],
  tick(entity, world, dt) {
    const boat = world.nearest(
      entity,
      (other) => isBoat(other) && other.state === 'sail',
      world.unit * 7,
    )

    if (boat) {
      steer(entity, boat.x, surfaceY(world) + world.unit, world.unit * 2.8, dt, 3)
    } else {
      entity.vy += (-world.unit * 1.6 - entity.vy) * dt * 1.6
      entity.vx += (entity.facing * world.unit * 0.55 - entity.vx) * dt
    }

    integrate(entity, dt)
    faceTravel(entity)
    entity.tilt = Math.sin(world.time * 5 + entity.id) * 18

    if (entity.y <= surfaceY(world) + world.unit * 0.4 || entity.age > 12) {
      world.remove(entity)
    }
  },
}

export const underseaSpecies: EcoSpeciesMap = {
  anglerfish,
  boat,
  crab,
  'fish-school': fishSchool,
  jellyfish,
  'kelp-coral': kelpCoral,
  octopus,
  orca,
  pufferfish,
  'sea-bubble-ring': bubbleRing,
  'sea-depth-charge': depthCharge,
  'sea-net': seaNet,
  'sea-swimmer': swimmer,
  'sea-turtle': seaTurtle,
  shark,
  swordfish,
  whale,
}
