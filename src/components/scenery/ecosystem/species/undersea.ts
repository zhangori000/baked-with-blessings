import { ecoAsset, registerViewBoxes } from '../assets'
import {
  between,
  chance,
  clamp,
  faceTravel,
  flee,
  integrate,
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
  'sea-kraken': [230, 186],
  'sea-kraken-grab': [280, 224],
  'sea-net': [118, 118],
  'sea-octopus': [120, 112],
  'sea-octopus-ink': [128, 112],
  'sea-orca': [176, 86],
  'sea-puffer': [98, 76],
  'sea-puffer-puffed': [112, 100],
  'sea-shark': [168, 82],
  'sea-shark-bite': [168, 90],
  'sea-swordfish': [190, 74],
  'sea-swimmer': [70, 86],
  'sea-turtle': [132, 86],
  'sea-whale': [210, 96],
  'sea-whale-breach': [180, 152],
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
const whaleBreachAsset = ecoAsset('sea-whale-breach')
const orcaAsset = ecoAsset('sea-orca')
const anglerAsset = ecoAsset('sea-anglerfish')
const krakenAsset = ecoAsset('sea-kraken')
const krakenGrabAsset = ecoAsset('sea-kraken-grab')
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
    weakTo: ['shark', 'whale', 'kraken'],
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
    weakTo: ['shark', 'octopus', 'kraken'],
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
    weakTo: ['whale', 'kraken', 'octopus'],
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
    weakTo: ['octopus', 'kraken', 'whale'],
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
    weakTo: ['shark', 'whale', 'kraken'],
    weight: 10,
  },
  {
    asset: ecoAsset('boat-battleship'),
    hp: 5,
    id: 'battleship',
    size: [16.8, 18],
    speed: [6, 7],
    strongVs: ['shark', 'orca', 'kraken'],
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
    weakTo: ['kraken', 'orca', 'whale'],
    weight: 3,
  },
  {
    asset: ecoAsset('boat-submarine'),
    hp: 4,
    id: 'submarine',
    size: [12, 12.9],
    speed: [8, 10],
    strongVs: ['kraken', 'orca', 'anglerfish'],
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
const isFish = (other: EcoEntity) => other.species === 'fish-school'
const isKelp = (other: EcoEntity) => other.species === 'kelp-coral'
const isJelly = (other: EcoEntity) => other.species === 'jellyfish'
const isTurtle = (other: EcoEntity) => other.species === 'sea-turtle'
const isCrab = (other: EcoEntity) => other.species === 'crab'
const isPuffer = (other: EcoEntity) => other.species === 'pufferfish'
const isShark = (other: EcoEntity) => other.species === 'shark'
const isSwordfish = (other: EcoEntity) => other.species === 'swordfish'
const isOctopus = (other: EcoEntity) => other.species === 'octopus'
const isWhale = (other: EcoEntity) => other.species === 'whale'
const isOrca = (other: EcoEntity) => other.species === 'orca'
const isAngler = (other: EcoEntity) => other.species === 'anglerfish'
const isKraken = (other: EcoEntity) => other.species === 'kraken'
const isPredator = (other: EcoEntity) =>
  isJelly(other) ||
  isShark(other) ||
  isSwordfish(other) ||
  isOctopus(other) ||
  isOrca(other) ||
  isAngler(other) ||
  isKraken(other)

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
  kraken: { burst: 12, cruise: 5 },
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

function callKraken(world: EcoWorld, x: number) {
  const kraken = world.spawn('kraken', {
    state: 'rise',
    size: between(35, 42),
    x: clamp(x, world.unit * 4, world.width - world.unit * 4),
    y: floorY(world) + world.unit * 2,
  })

  if (kraken) {
    kraken.data.called = 1
    kraken.data.dragAt = 0
    kraken.data.zBoost = world.height * 3
    spawnBurst(world, kraken.x, surfaceY(world) + world.unit * 2, 6.5)
  }

  world.resetTally('boats-sunk')
}

function markBoatSunk(boat: EcoEntity, world: EcoWorld, cause?: EcoEntity) {
  if ((boat.data.sunk ?? 0) > 0) {
    return
  }

  boat.data.sunk = 1
  boat.countAs = null
  const sunk = world.tally('boats-sunk')
  const callActive = world.nearest(
    boat,
    (other) => isKraken(other) && (other.data.called ?? 0) > 0 && other.age < 9,
    world.width,
  )

  if (sunk >= 5 && callActive) {
    world.resetTally('boats-sunk')
  } else if (sunk >= 5) {
    callKraken(world, cause?.x ?? boat.x)
  }
}

function capsizeBoat(boat: EcoEntity, world: EcoWorld, cause?: EcoEntity) {
  if (boat.state === 'capsized' || boat.state === 'sinking' || boat.state === 'wreck') {
    return false
  }

  const edge = cause ? matchupEdge(cause, boat, world) : 1

  if (edge < 1 && Math.random() > 0.45) {
    boat.fx = 'wobble'
    boat.data.fx = 0.5
    return false
  }

  world.setAsset(boat, capsizedAsset)
  world.setState(boat, 'capsized')
  boat.data.waterline = 64 / 92
  boat.vx *= 0.25
  boat.vy = world.unit * 0.35
  boat.y = boatBottomOnSurface(boat, world)
  boat.tilt = boat.facing * -18
  boat.data.sinkDelay = between(1.8, 3.8)
  boat.data.zBoost = world.height * 2
  markBoatSunk(boat, world, cause)
  spawnSwimmers(world, boat, boat.data.kind === 4 ? 1 : Math.round(between(1, 3)))
  spawnBurst(world, boat.x, boat.y + world.unit * 1.2, 2.8)

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

function heal(entity: EcoEntity, amount: number) {
  entity.hp = Math.min(entity.maxHp, entity.hp + amount)
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

  if ((attacker.data.controlLifestealUntil ?? 0) > world.time) {
    heal(attacker, amount * 0.22)
  }
}

function shove(attacker: EcoEntity, target: EcoEntity, world: EcoWorld, force: number) {
  target.vx += (target.x >= attacker.x ? 1 : -1) * world.unit * force
  target.vy += (target.y >= attacker.y ? 1 : -1) * world.unit * force * 0.35
  target.data.fx = Math.max(target.data.fx ?? 0, 0.45)
  target.fx = 'dazed'
}

type SeaAbilityConfig = {
  active?: number
  amount?: number | ((target: EcoEntity) => number)
  archetype?: string
  asset?: string
  buff?: { block?: number; icon: string; name: string; seconds: number; speed?: number }
  charge?: { max: number; min?: number }
  cooldown: number
  dash?: number
  description: string
  heal?: number
  icon?: string
  key: 'q' | 'w' | 'e' | 'r'
  name: string
  radius?: number
  recovery?: number
  shape: 'circle' | 'cone' | 'line' | 'self'
  state?: string
  target?: 'area' | 'front'
  ultimate?: boolean
  vfx?: EcoControlAbility['vfx']
  width?: number
  windup?: number
  onRun?: (entity: EcoEntity, world: EcoWorld, context: EcoControlAbilityContext) => void
  onHit?: (entity: EcoEntity, target: EcoEntity, world: EcoWorld) => void
}

function seaAbility(config: SeaAbilityConfig): EcoControlAbility {
  const range = config.radius ?? Math.abs(config.dash ?? 4)
  const width = config.width ?? (config.shape === 'line' ? 2.8 : range)
  const windup = Math.max(
    config.windup ?? 0.2,
    config.key === 'r' ? 0.45 : config.key === 'q' ? 0.25 : 0,
  )

  return {
    active: config.active ?? 0.26,
    archetype: config.archetype,
    charge: config.charge,
    cooldown: config.cooldown,
    dash: config.dash,
    description: config.description,
    icon: config.icon,
    key: config.key,
    name: config.name,
    recovery: config.recovery ?? 0.24,
    telegraph: { range, shape: config.shape, width },
    ultimate: config.ultimate,
    vfx: config.vfx,
    windup,
    run(entity, world, context) {
      controlAction(
        entity,
        world,
        config.state ?? entity.state,
        (config.active ?? 0.26) + 0.18,
        config.asset,
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

      if (config.heal) {
        world.heal(entity, config.heal)
      }

      if (config.ultimate || config.vfx === 'shockwave') {
        world.shake(config.ultimate ? 0.8 : 0.35)
      }

      config.onRun?.(entity, world, context)
    },
    tick(entity, world, context) {
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
        const charge = clamp(entity.data.controlCharge ?? 1, 0.35, 1)
        const baseAmount =
          typeof config.amount === 'function' ? config.amount(target) : config.amount
        const amount = baseAmount * (config.charge ? 0.7 + charge * 0.75 : 1)

        controlHit(entity, target, world, amount)
        shove(entity, target, world, config.ultimate ? 4.8 : 2.8)
        config.onHit?.(entity, target, world)
      }
    },
  }
}

const fishControls = {
  abilities: [
    seaAbility({
      cooldown: 2.2,
      dash: 4.2,
      description: 'Scatter in a short skillshot burst.',
      icon: 'scatter',
      key: 'q',
      name: 'Scatter',
      shape: 'line',
      state: 'scatter',
      vfx: 'water',
      width: 3,
    }),
    seaAbility({
      buff: { block: 0.45, icon: '◆', name: 'Bait ball', seconds: 3.4 },
      cooldown: 5.4,
      description: 'Tighten into a bait ball that blunts bites.',
      icon: 'bait',
      key: 'w',
      name: 'Bait ball',
      shape: 'self',
      state: 'school',
      vfx: 'buff',
    }),
    seaAbility({
      amount: 0.55,
      cooldown: 3.4,
      dash: 5,
      description: 'Dart through nearby predators.',
      icon: 'dart',
      key: 'e',
      name: 'Dart',
      shape: 'line',
      state: 'scatter',
      target: 'front',
      vfx: 'water',
      width: 3.2,
    }),
    seaAbility({
      cooldown: 3,
      description: 'Ultimate: split and call a helper shoal.',
      icon: 'school',
      key: 'r',
      name: 'School call',
      shape: 'self',
      state: 'school',
      ultimate: true,
      vfx: 'buff',
      onRun(entity, world) {
        if (world.canBreed()) {
          world.spawn('fish-school', {
            countAs: 'fish-school',
            size: entity.size * 0.72,
            x: clamp(
              entity.x - entity.facing * world.unit * 2,
              world.unit,
              world.width - world.unit,
            ),
            y: clamp(entity.y + between(-1, 1) * world.unit, waterTop(world), waterBottom(world)),
          })
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
      description: 'Sting the closest creature in front.',
      icon: 'sting',
      key: 'q',
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
    seaAbility({
      amount: 0.55,
      cooldown: 4.8,
      description: 'Pulse outward and shove nearby swimmers.',
      icon: 'pulse',
      key: 'w',
      name: 'Drift pulse',
      radius: 5.5,
      shape: 'circle',
      state: 'drift',
      target: 'area',
      vfx: 'shockwave',
    }),
    seaAbility({
      buff: { icon: '⚡', name: 'Bell lift', seconds: 2.4, speed: 1.5 },
      cooldown: 5.8,
      dash: 2.4,
      description: 'Float upward out of danger.',
      icon: 'lift',
      key: 'e',
      name: 'Bell lift',
      shape: 'line',
      state: 'drift',
      vfx: 'water',
      onRun(entity, world) {
        entity.y = clamp(entity.y - world.unit * 2.2, waterTop(world), waterBottom(world))
      },
    }),
    seaAbility({
      cooldown: 3,
      description: 'Ultimate: bloom with stinging bubbles.',
      icon: 'bloom',
      key: 'r',
      name: 'Bloom',
      radius: 6,
      shape: 'circle',
      state: 'drift',
      ultimate: true,
      vfx: 'shockwave',
      onRun(entity, world) {
        for (let index = 0; index < 3; index += 1) {
          spawnBurst(
            world,
            clamp(entity.x + between(-2.5, 2.5) * world.unit, world.unit, world.width - world.unit),
            clamp(entity.y + between(-1.5, 1.5) * world.unit, waterTop(world), waterBottom(world)),
            1.7,
          )
        }
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
      key: 'q',
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
    seaAbility({
      buff: { block: 0.28, icon: '◆', name: 'Shell', seconds: 3.8 },
      cooldown: 5.6,
      description: 'Tuck into the shell and reduce damage.',
      icon: 'block',
      key: 'w',
      name: 'Shell block',
      shape: 'self',
      state: 'paddle',
      vfx: 'buff',
    }),
    seaAbility({
      buff: { icon: '⚡', name: 'Paddle', seconds: 1.8, speed: 1.8 },
      cooldown: 4.4,
      dash: 3.2,
      description: 'Paddle dash through danger.',
      icon: 'dash',
      key: 'e',
      name: 'Paddle dash',
      shape: 'line',
      state: 'paddle',
      vfx: 'water',
      width: 3,
    }),
    seaAbility({
      cooldown: 3,
      description: 'Ultimate: graze kelp and heal.',
      heal: 1.8,
      icon: 'kelp',
      key: 'r',
      name: 'Kelp snack',
      shape: 'self',
      state: 'paddle',
      ultimate: true,
      vfx: 'heal',
      onRun(entity, world) {
        const kelp = world.nearest(
          entity,
          (other) => isKelp(other) && other.state !== 'grow',
          world.unit * 8,
        )
        if (kelp) {
          kelp.fx = 'wobble'
          spawnBurst(world, kelp.x, kelp.y - world.heightOf(kelp) * 0.5, 1.7)
        }
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
      amount: (target) => (isKraken(target) ? 0.75 : 0.9),
      cooldown: 1.8,
      description: 'Pinch anything close after a claw tell.',
      icon: 'pinch',
      key: 'q',
      name: 'Pinch',
      radius: 3.2,
      shape: 'line',
      state: 'scuttle',
      target: 'front',
      vfx: 'slash',
      width: 3,
    }),
    seaAbility({
      buff: { block: 0.32, icon: '◆', name: 'Burrow', seconds: 3.6 },
      cooldown: 5,
      description: 'Burrow into sand to block damage.',
      icon: 'burrow',
      key: 'w',
      name: 'Burrow',
      shape: 'self',
      state: 'scuttle',
      vfx: 'buff',
    }),
    seaAbility({
      cooldown: 3.6,
      dash: 4,
      description: 'Side scuttle in a quick burst.',
      icon: 'scuttle',
      key: 'e',
      name: 'Scuttle',
      shape: 'line',
      state: 'scuttle',
      vfx: 'charge',
      width: 2.8,
    }),
    seaAbility({
      amount: 0.85,
      cooldown: 3,
      description: 'Ultimate: rake claws through nearby enemies.',
      icon: 'claw',
      key: 'r',
      name: 'Claw rake',
      radius: 4.2,
      shape: 'circle',
      state: 'scuttle',
      target: 'area',
      ultimate: true,
      vfx: 'slash',
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
      amount: 1.2,
      asset: pufferPuffedAsset,
      cooldown: 2.6,
      description: 'Puff spikes and punish close attackers.',
      icon: 'puff',
      key: 'q',
      name: 'Puff spikes',
      radius: 4.5,
      shape: 'circle',
      state: 'puffed',
      target: 'area',
      vfx: 'shockwave',
    }),
    seaAbility({
      amount: 0.6,
      asset: pufferPuffedAsset,
      cooldown: 5.2,
      description: 'Poison cloud that slows nearby predators.',
      icon: 'toxin',
      key: 'w',
      name: 'Toxin cloud',
      radius: 5.5,
      shape: 'circle',
      state: 'puffed',
      target: 'area',
      vfx: 'water',
      onHit(_entity, target, world) {
        target.data.controlSpeedUntil = world.time + 2.4
        target.data.controlSpeed = 0.58
      },
    }),
    seaAbility({
      cooldown: 4,
      dash: -3.5,
      description: 'Scoot backward from danger.',
      icon: 'scoot',
      key: 'e',
      name: 'Back scoot',
      shape: 'line',
      state: 'drift',
      vfx: 'water',
      width: 2.8,
    }),
    seaAbility({
      asset: pufferPuffedAsset,
      buff: { block: 0.45, icon: '◆', name: 'Spines', seconds: 4.2 },
      cooldown: 3,
      description: 'Ultimate: stay puffed and shrug off hits.',
      heal: 0.5,
      icon: 'spine',
      key: 'r',
      name: 'Spine armor',
      shape: 'self',
      state: 'puffed',
      ultimate: true,
      vfx: 'buff',
    }),
  ],
  idleState: 'drift',
  move: 'swim',
  moveState: 'drift',
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
      description: 'Burst in with the snout, bite and start a head-shake.',
      icon: 'bite',
      key: 'q',
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
    seaAbility({
      archetype: 'Head-shake hold',
      buff: { icon: '⚡', name: 'Head shake', seconds: 2.4, speed: 1.25 },
      charge: { max: 1.1, min: 0.22 },
      cooldown: 5.2,
      description: 'Hold after closing in, then thrash the head side to side.',
      icon: 'thrash',
      key: 'w',
      name: 'Head shake',
      shape: 'self',
      state: 'hunt',
      vfx: 'buff',
    }),
    seaAbility({
      archetype: 'Blood-scent sprint',
      asset: sharkBiteAsset,
      buff: { icon: '⚡', name: 'Blood scent', seconds: 2.6, speed: 1.4 },
      cooldown: 3.6,
      description: 'Smell blood and sprint toward wounded prey.',
      icon: 'blood',
      key: 'e',
      name: 'Blood scent',
      shape: 'self',
      state: 'hunt',
      vfx: 'buff',
    }),
    seaAbility({
      asset: sharkBiteAsset,
      buff: { icon: '⚡', name: 'Frenzy', seconds: 5, speed: 1.65 },
      cooldown: 3,
      description: 'Ultimate: fast lifesteal frenzy.',
      heal: 0.6,
      icon: 'frenzy',
      key: 'r',
      name: 'Frenzy',
      shape: 'self',
      state: 'hunt',
      ultimate: true,
      vfx: 'buff',
      onRun(entity, world) {
        entity.data.controlLifestealUntil = world.time + 5
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
      description: 'Thrust the long bill straight through prey.',
      icon: 'lance',
      key: 'q',
      name: 'Bill thrust',
      shape: 'line',
      state: 'strike',
      target: 'area',
      vfx: 'charge',
      width: 3.2,
    }),
    seaAbility({
      amount: 1.1,
      archetype: 'Side-sweep bill slash',
      cooldown: 3.2,
      dash: 2.8,
      description: 'Sweep the bill sideways through close prey.',
      icon: 'slash',
      key: 'w',
      name: 'Side sweep',
      radius: 5.2,
      shape: 'cone',
      state: 'strike',
      target: 'area',
      vfx: 'slash',
      width: 5.2,
    }),
    seaAbility({
      archetype: 'Hold sprint',
      buff: { icon: '⚡', name: 'Current', seconds: 3.2, speed: 1.9 },
      charge: { max: 1.15, min: 0.22 },
      cooldown: 5,
      description: 'Sprint with a fast current.',
      icon: 'sprint',
      key: 'e',
      name: 'Current sprint',
      shape: 'self',
      state: 'lance',
      vfx: 'water',
    }),
    seaAbility({
      amount: 1.2,
      cooldown: 3,
      dash: 9,
      description: 'Ultimate: pierce every close target.',
      icon: 'skewer',
      key: 'r',
      name: 'Skewer run',
      shape: 'line',
      state: 'strike',
      target: 'area',
      ultimate: true,
      vfx: 'charge',
      width: 4,
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
      archetype: 'Local ink cloud',
      cooldown: 3.2,
      description: 'Release a close ink cloud that dazes hunters around the octopus.',
      icon: 'ink',
      key: 'q',
      name: 'Ink cloud',
      radius: 5.5,
      shape: 'circle',
      state: 'ink',
      asset: octopusInkAsset,
      vfx: 'ink',
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
    seaAbility({
      amount: (target) => (isBoat(target) ? 1.6 : 1.1),
      archetype: 'Hold grab',
      asset: octopusAsset,
      charge: { max: 1.1, min: 0.24 },
      cooldown: 3.8,
      description: 'Grab a close target after a tentacle tell.',
      icon: 'grab',
      key: 'w',
      name: 'Grab',
      radius: 5,
      shape: 'line',
      state: 'grab',
      target: 'front',
      vfx: 'bite',
      width: 4,
    }),
    seaAbility({
      asset: octopusAsset,
      buff: { block: 0.38, icon: '◆', name: 'Camo', seconds: 4 },
      cooldown: 6,
      description: 'Camouflage to reduce damage.',
      icon: 'camouflage',
      key: 'e',
      name: 'Camouflage',
      shape: 'self',
      state: 'prowl',
      vfx: 'buff',
    }),
    seaAbility({
      asset: octopusInkAsset,
      buff: { icon: '⚡', name: 'Jet', seconds: 1.3, speed: 3.25 },
      cooldown: 3,
      dash: -7,
      description: 'Ultimate: jet escape in a burst of ink.',
      icon: 'jet',
      key: 'r',
      name: 'Jet escape',
      shape: 'line',
      state: 'ink',
      ultimate: true,
      vfx: 'ink',
      width: 5,
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
      active: 0.45,
      asset: whaleBreachAsset,
      cooldown: 4,
      description: 'Breach upward and flip boats.',
      icon: 'breach',
      key: 'q',
      name: 'Breach',
      radius: 10,
      shape: 'circle',
      state: 'breach',
      vfx: 'shockwave',
      windup: 0.42,
      onRun(entity, world) {
        entity.y = clamp(surfaceY(world) + world.unit * 1.6, surfaceY(world), waterBottom(world))
        const boat = world.nearest({ x: entity.x, y: surfaceY(world) }, isBoat, world.unit * 10)
        if (boat) {
          capsizeBoat(boat, world, entity)
        }
        spawnBurst(world, entity.x, surfaceY(world) + world.unit * 2, 4)
      },
    }),
    seaAbility({
      amount: (target) => (isBoat(target) ? 1.4 : 1),
      asset: whaleAsset,
      cooldown: 4.8,
      description: 'Spin a bubble-net ring that traps fish close enough to feed.',
      icon: 'bubble',
      key: 'w',
      name: 'Bubble net',
      radius: 9,
      shape: 'circle',
      state: 'cruise',
      target: 'area',
      vfx: 'water',
      onHit(entity, target) {
        if (isFish(target)) {
          target.vx += (entity.x - target.x) * 1.1
          target.vy += (entity.y - target.y) * 0.7
        }
      },
    }),
    seaAbility({
      asset: whaleAsset,
      cooldown: 6.5,
      description: 'Whale song scatters and calms enemies.',
      icon: 'song',
      key: 'e',
      name: 'Song',
      radius: 13,
      shape: 'circle',
      state: 'cruise',
      vfx: 'shockwave',
      onRun(entity, world) {
        for (const target of areaTargets(entity, world, world.unit * 13)) {
          target.targetId = null
          target.data.controlSpeedUntil = world.time + 2.2
          target.data.controlSpeed = 0.62
          shove(entity, target, world, 2)
        }
      },
    }),
    seaAbility({
      asset: whaleAsset,
      cooldown: 3,
      description: 'Ultimate: gulp krill bubbles and heal.',
      heal: 2,
      icon: 'gulp',
      key: 'r',
      name: 'Krill gulp',
      shape: 'self',
      state: 'cruise',
      ultimate: true,
      vfx: 'heal',
    }),
  ],
  idleState: 'cruise',
  move: 'swim',
  moveState: 'cruise',
  speed: controlledSeaSpeed('whale'),
} as const

const orcaControls = {
  abilities: [
    seaAbility({
      amount: 1.25,
      archetype: 'Wave-wash',
      cooldown: 2.4,
      dash: 2.4,
      description: 'Wash a bow wave forward to roll prey off balance.',
      icon: 'wave',
      key: 'q',
      name: 'Wave wash',
      shape: 'line',
      state: 'hunt',
      target: 'front',
      vfx: 'charge',
      width: 4.6,
    }),
    seaAbility({
      amount: 0.9,
      archetype: 'Hold tail slap',
      charge: { max: 1.15, min: 0.24 },
      cooldown: 4.5,
      description: 'Tail slap and stun nearby prey.',
      icon: 'tail',
      key: 'w',
      name: 'Tail stun',
      radius: 6.5,
      shape: 'circle',
      state: 'hunt',
      target: 'area',
      vfx: 'slash',
      onHit(_entity, target, world) {
        target.data.controlSpeedUntil = world.time + 1.7
        target.data.controlSpeed = 0.45
      },
    }),
    seaAbility({
      amount: 1.15,
      archetype: 'Coordinated pod ram',
      cooldown: 6,
      dash: 6.8,
      description: 'Coordinate a pod-style ram through the target line.',
      icon: 'pod',
      key: 'e',
      name: 'Pod ram',
      radius: 9,
      shape: 'line',
      state: 'hunt',
      target: 'area',
      vfx: 'charge',
      width: 5.2,
    }),
    seaAbility({
      amount: 1.6,
      cooldown: 3,
      dash: 7.2,
      description: 'Final Smash: beaching lunge with a brief helper orca.',
      icon: 'lunge',
      key: 'r',
      name: 'Beach lunge',
      shape: 'line',
      state: 'hunt',
      target: 'area',
      ultimate: true,
      vfx: 'buff',
      width: 5.4,
      onRun(entity, world) {
        if (world.canBreed()) {
          const helper = world.spawn('orca', {
            countAs: null,
            data: { life: 7 },
            size: entity.size * 0.72,
            x: clamp(
              entity.x - entity.facing * world.unit * 4,
              world.unit,
              world.width - world.unit,
            ),
            y: clamp(entity.y + world.unit * 1.2, waterTop(world), waterBottom(world)),
          })
          if (helper) {
            helper.hp = 2
            helper.maxHp = 2
          }
        }
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
      cooldown: 3,
      description: 'Lure small prey toward the lantern.',
      icon: 'lure',
      key: 'q',
      name: 'Lure',
      radius: 9,
      shape: 'circle',
      state: 'lure',
      asset: anglerAsset,
      vfx: 'buff',
      onRun(entity, world) {
        for (const target of world.within(
          entity.x,
          entity.y,
          world.unit * 9,
          (other) => isFish(other) || isJelly(other),
        )) {
          steer(
            target,
            entity.x,
            entity.y,
            pace(target, world, isFish(target) ? 'fish' : 'jellyfish', 'cruise'),
            0.2,
            2.5,
          )
          target.fx = 'aim'
          target.data.fx = 0.8
        }
      },
    }),
    seaAbility({
      amount: 1.25,
      cooldown: 2.8,
      description: 'Ambush gulp after the lure pulls prey close.',
      icon: 'bite',
      key: 'w',
      name: 'Ambush gulp',
      radius: 4.8,
      shape: 'line',
      state: 'strike',
      target: 'front',
      vfx: 'bite',
      width: 3.2,
      onHit(entity, _target, world) {
        world.heal(entity, 0.35)
      },
    }),
    seaAbility({
      buff: { block: 0.4, icon: '◆', name: 'Hide', seconds: 3 },
      cooldown: 5.6,
      description: 'Dim the lantern and hide.',
      icon: 'hide',
      key: 'e',
      name: 'Deep hide',
      shape: 'self',
      state: 'hide',
      asset: anglerAsset,
      vfx: 'buff',
    }),
    seaAbility({
      amount: 0.45,
      cooldown: 3,
      description: 'Ultimate: flash the lure and daze close prey.',
      icon: 'lantern',
      key: 'r',
      name: 'Lantern flash',
      radius: 6,
      shape: 'circle',
      state: 'lure',
      asset: anglerAsset,
      target: 'area',
      ultimate: true,
      vfx: 'shockwave',
      onHit(_entity, target) {
        target.fx = 'dazed'
        target.data.fx = 1.2
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
    const threat = world.nearest(entity, (other) => isOrca(other) || isKraken(other), unit * 11)
    let cruising = false

    if (threat && world.edge(threat, entity) > 1) {
      flee(entity, threat, pace(entity, world, 'turtle', 'burst'), dt, 3.2)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) => isJelly(other) || isPuffer(other),
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
  weakTo: ['orca', 'kraken', 'shark'],
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
  strongVs: ['jellyfish', 'kelp-coral', 'kraken'],
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

    const kraken = world.nearest(entity, isKraken, unit * 3.2)

    if (kraken && world.edge(entity, kraken) > 1) {
      hurt(kraken, world, 0.45)
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
  },
  layer: 'front',
  size: [1.8, 2.2],
  state: 'drift',
  strongVs: ['shark', 'crab', 'fish-school', 'kraken', 'orca'],
  tags: ['prey'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const threat = world.nearest(
      entity,
      (other) => isShark(other) || isKraken(other) || isOrca(other),
      unit * 6,
    )

    if (threat && world.matchup(entity, threat) === 'strong') {
      world.setAsset(entity, pufferPuffedAsset)
      world.setState(entity, 'puffed')
      entity.scale = Math.min(1.22, entity.scale + dt * 1.4)
      flee(entity, threat, pace(entity, world, 'pufferfish', 'burst'), dt, 2.4)

      if (
        Math.hypot(entity.x - threat.x, entity.y - threat.y) <
        Math.max(unit * 3.2, world.widthOf(threat) * 0.35)
      ) {
        hurt(threat, world, 0.8 * world.edge(entity, threat))
        threat.targetId = null
        threat.fx = 'dazed'
        threat.data.fx = 0.6
      }
    } else {
      world.setAsset(entity, pufferAsset)
      world.setState(entity, 'drift')
      entity.scale = Math.max(1, entity.scale - dt * 0.8)
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
    if (threat && world.matchup(entity, threat) === 'strong') {
      keepInWater(entity, world)
      faceTravel(entity)
    } else {
      keepWaterDepth(entity, world)
      wrapRight(entity, world)
    }
    tiltToVelocity(entity, 12)
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
  },
  layer: 'front',
  size: [10.6, 11.8],
  state: 'prowl',
  strongVs: ['fish-school', 'sea-turtle', 'crab', 'anglerfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const danger = world.nearest(
      entity,
      (other) =>
        (isOrca(other) ||
          isOctopus(other) ||
          isPuffer(other) ||
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
  },
  layer: 'front',
  size: [7.6, 8.8],
  state: 'lance',
  strongVs: ['fish-school', 'shark', 'kraken', 'anglerfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
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
        (other) => isFish(other) || isShark(other) || isKraken(other) || isAngler(other),
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
      world.count(
        (other) => isFish(other) || isShark(other) || isKraken(other) || isAngler(other),
      ) > 0,
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
          isCrab(other) || isFish(other) || isBoat(other) || isPuffer(other) || isSwordfish(other),
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
    entity.data.breachAt = world.time + between(5, 10)
    entity.facing = 1
    entity.vx = pace(entity, world, 'whale', 'cruise') * between(0.85, 1.15)
  },
  layer: 'front',
  size: [23.8, 26.3],
  state: 'cruise',
  strongVs: ['boat', 'octopus', 'kraken'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    const unit = world.unit
    const orca = world.nearest(
      entity,
      (other) => isOrca(other) && world.edge(other, entity) > 1,
      unit * 9,
    )
    let cruising = false

    if (orca && world.edge(orca, entity) > 1) {
      flee(entity, orca, pace(entity, world, 'whale', 'burst'), dt, 1.6)
    } else if (world.time > (entity.data.breachAt ?? 0)) {
      world.setAsset(entity, whaleBreachAsset)
      world.setState(entity, 'breach')
      const boat = world.nearest({ x: entity.x, y: surfaceY(world) }, isBoat, unit * 7)
      const breachX = boat?.x ?? entity.x + entity.facing * unit * 2

      steer(
        entity,
        breachX,
        surfaceY(world) + unit * 1.4,
        pace(entity, world, 'whale', 'burst'),
        dt,
        2.2,
      )

      if (
        boat &&
        Math.abs(boat.x - entity.x) < Math.max(unit * 5.2, world.widthOf(entity) * 0.42)
      ) {
        capsizeBoat(boat, world, entity)
      }

      if (entity.y < surfaceY(world) + unit * 1.2 || entity.t > 1.2) {
        entity.data.breachAt = world.time + between(8, 16)
        entity.vy = unit * 1.2
        world.setState(entity, 'dive')
      }
    } else {
      world.setAsset(entity, whaleAsset)
      world.setState(entity, entity.state === 'dive' && entity.t < 1.4 ? 'dive' : 'cruise')
      entity.vx += (entity.facing * pace(entity, world, 'whale', 'cruise') - entity.vx) * dt * 0.5
      entity.vy += (Math.sin(world.time * 0.35 + entity.id) * unit * 0.25 - entity.vy) * dt * 0.6
      cruising = entity.state === 'cruise'
    }

    hungerDrift(
      entity,
      world,
      dt,
      world.count((other) => isBoat(other) || isOctopus(other) || isKraken(other)) > 0,
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
  weakTo: ['orca'],
}

const orca: EcoSpecies = {
  anchor: 'center',
  asset: orcaAsset,
  countAs: 'orca',
  controls: orcaControls,
  hp: 4,
  init(entity, world) {
    entity.y = clamp(entity.y, waterTop(world) + world.unit * 3, waterBottom(world))
  },
  layer: 'front',
  size: [13.6, 15],
  state: 'hunt',
  strongVs: ['shark', 'sea-turtle', 'whale', 'octopus', 'swordfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)

    if ((entity.data.life ?? 0) > 0 && entity.age > (entity.data.life ?? 0)) {
      world.kill(entity)
      return
    }

    const unit = world.unit
    const kraken = world.nearest(
      entity,
      (other) => (isKraken(other) || isPuffer(other)) && world.edge(other, entity) > 1,
      unit * 10,
    )

    if (kraken && world.edge(kraken, entity) > 1) {
      flee(entity, kraken, pace(entity, world, 'orca', 'burst'), dt, 3.5)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) =>
          isShark(other) ||
          isTurtle(other) ||
          isWhale(other) ||
          isOctopus(other) ||
          isSwordfish(other),
        unit * 18,
      )

      if (target) {
        steer(entity, target.x, target.y, pace(entity, world, 'orca', 'burst'), dt, 2.4)
        consume(entity, target, world, isWhale(target) ? 2.2 : 1.8)
      } else {
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
      world.count(
        (other) =>
          isShark(other) ||
          isTurtle(other) ||
          isWhale(other) ||
          isOctopus(other) ||
          isSwordfish(other),
      ) > 0,
      62,
    )
    integrate(entity, dt)
    keepInWater(entity, world)
    faceTravel(entity)
    tiltToVelocity(entity, 16)
  },
  weakTo: ['kraken', 'boat', 'pufferfish'],
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
      (other) =>
        (isShark(other) || isKraken(other) || isSwordfish(other)) && world.edge(other, entity) > 1,
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
  weakTo: ['shark', 'kelp-coral', 'kraken', 'swordfish'],
}

const kraken: EcoSpecies = {
  anchor: 'center',
  asset: krakenAsset,
  countAs: 'kraken',
  hp: 7,
  idle: 'undulate',
  init(entity, world) {
    capWidth(entity, world, 0.9)
    entity.y =
      entity.state === 'rise'
        ? floorY(world) + world.unit * 2
        : clamp(entity.y, deepTop(world), deepBottom(world))
    entity.data.grabCool = between(1, 2)
  },
  layer: 'front',
  size: [26.2, 29.4],
  state: 'prowl',
  strongVs: ['boat', 'orca', 'anglerfish'],
  tags: ['predator'],
  tick(entity, world, dt) {
    clearFx(entity, dt)
    entity.data.grabCool = Math.max(0, (entity.data.grabCool ?? 0) - dt)
    const unit = world.unit

    if (entity.state === 'rise') {
      world.setAsset(entity, krakenGrabAsset)
      steer(
        entity,
        entity.x,
        surfaceY(world) + unit * 7,
        pace(entity, world, 'kraken', 'burst'),
        dt,
        1.8,
      )
      integrate(entity, dt)
      entity.data.dragAt = Math.max(0, (entity.data.dragAt ?? 0) - dt)

      if ((entity.data.dragAt ?? 0) <= 0) {
        entity.data.dragAt = 0.28
        spawnBurst(
          world,
          clamp(entity.x + between(-5, 5) * unit, unit * 2, world.width - unit * 2),
          surfaceY(world) + unit * between(1.2, 5.6),
          between(3.4, 5.8),
        )
      }

      for (const boatTarget of world.within(
        entity.x,
        surfaceY(world) + unit * 1.8,
        Math.max(unit * 24, world.width * 0.42),
        isBoat,
      )) {
        capsizeBoat(boatTarget, world, entity)
        boatTarget.x += (entity.x - boatTarget.x) * dt * 1.6
        boatTarget.y += unit * dt * 3.4
      }

      if (entity.y <= surfaceY(world) + unit * 8 || entity.t > 3.2) {
        world.setState(entity, 'prowl')
      }
      return
    }

    const puffer = world.nearest(
      entity,
      (other) =>
        (isPuffer(other) || isCrab(other) || isWhale(other) || isSwordfish(other)) &&
        world.edge(other, entity) > 1,
      unit * 8,
    )

    if (puffer && world.edge(puffer, entity) > 1) {
      world.setAsset(entity, krakenAsset)
      flee(entity, puffer, pace(entity, world, 'kraken', 'burst'), dt, 2.4)
    } else {
      const target = targetOrNearest(
        entity,
        world,
        (other) => isBoat(other) || isOrca(other) || isAngler(other),
        unit * 24,
      )

      if (target) {
        world.setAsset(entity, krakenGrabAsset)
        world.setState(entity, 'grab')
        steer(entity, target.x, target.y, pace(entity, world, 'kraken', 'burst'), dt, 2.1)
        consume(entity, target, world, isBoat(target) ? 3.4 : 2.1)
      } else {
        world.setAsset(entity, krakenAsset)
        world.setState(entity, 'prowl')
        wander(
          entity,
          world,
          dt,
          pace(entity, world, 'kraken', 'cruise'),
          deepTop(world),
          deepBottom(world),
          1.2,
        )
      }
    }

    hungerDrift(
      entity,
      world,
      dt,
      world.count((other) => isBoat(other) || isOrca(other) || isAngler(other)) > 0,
      78,
    )
    integrate(entity, dt)
    keepInWater(entity, world, surfaceY(world) + unit * 3, deepBottom(world))
    faceTravel(entity)
    tiltToVelocity(entity, 10)
  },
  weakTo: ['pufferfish', 'crab', 'whale', 'swordfish', 'sea-depth-charge'],
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
    const variantId = boatVariants[kind]?.id ?? 'rowboat'

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

    const whaleLike = world.nearest(
      entity,
      (other) => isWhale(other) || isKraken(other),
      unit * 4.2,
    )

    if (
      whaleLike &&
      matchupEdge(whaleLike, entity, world) > 1 &&
      Math.abs(whaleLike.y - entity.y) < unit * 4
    ) {
      capsizeBoat(entity, world, whaleLike)
    }
  },
  weakTo: ['whale', 'kraken', 'octopus'],
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
  strongVs: ['boat', 'shark', 'orca', 'kraken'],
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
        isBoat(other) ||
        isFish(other) ||
        isShark(other) ||
        isOrca(other) ||
        isKraken(other) ||
        isTurtle(other),
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
  kraken,
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
