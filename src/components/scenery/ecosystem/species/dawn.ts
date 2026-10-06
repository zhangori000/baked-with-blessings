import { ecoAsset, registerViewBoxes } from '../assets'
import {
  between,
  chance,
  clamp,
  faceTravel,
  hop,
  integrate,
  keepInSky,
  onGround,
  settle,
  steer,
  tiltToVelocity,
  walk,
  walkToward,
  wander,
} from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

registerViewBoxes({
  carrot: [70, 88],
  'carrot-pulled': [72, 116],
  'carrot-sprout': [62, 74],
  crow: [112, 76],
  'crow-feather': [44, 18],
  'crow-mob': [108, 82],
  'crow-peck': [94, 66],
  fox: [132, 72],
  'fox-crouch': [132, 60],
  'fox-pounce': [142, 78],
  goose: [116, 78],
  'goose-honk': [124, 84],
  'hawk-feather': [44, 18],
  'hawk-talons': [138, 82],
  scarecrow: [92, 150],
})

const bloomAsset = ecoAsset('dandelion-bloom')
const puffAsset = ecoAsset('dandelion')
const sproutAsset = ecoAsset('sprout')
const carrotAsset = ecoAsset('carrot')
const carrotSproutAsset = ecoAsset('carrot-sprout')
const carrotPulledAsset = ecoAsset('carrot-pulled')
const foxAsset = ecoAsset('fox')
const foxCrouchAsset = ecoAsset('fox-crouch')
const foxPounceAsset = ecoAsset('fox-pounce')
const gooseAsset = ecoAsset('goose')
const gooseHonkAsset = ecoAsset('goose-honk')
const scarecrowAsset = ecoAsset('scarecrow')
const crowAsset = ecoAsset('crow')
const crowMobAsset = ecoAsset('crow-mob')
const crowPeckAsset = ecoAsset('crow-peck')

const isPlant = (world: EcoWorld) => (other: EcoEntity) => world.has(other, 'plant')

const isActiveScarecrow = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'scarecrow') && (other.data.burn ?? 0) <= 0

const scarecrowRadius = (world: EcoWorld) => Math.max(world.unit * 8.5, 74)

const scarecrowNear = (
  world: EcoWorld,
  point: { x: number; y: number },
  radius = scarecrowRadius(world),
) => world.nearest(point, isActiveScarecrow(world), radius)

const scarecrowAirGuard = (world: EcoWorld, point: { x: number; y: number }) => {
  let best: EcoEntity | null = null
  let bestDistance = Math.max(world.unit * 9.5, 82)

  if (point.y < world.groundY - world.unit * 18) {
    return null
  }

  for (const other of world.entities) {
    if (other.dying || other.removed || !isActiveScarecrow(world)(other)) {
      continue
    }

    const distance = Math.abs(other.x - point.x)

    if (distance < bestDistance) {
      best = other
      bestDistance = distance
    }
  }

  return best
}

const bunnySafeFromHawk = (world: EcoWorld, bunny: EcoEntity) =>
  Boolean(scarecrowNear(world, bunny, scarecrowRadius(world)))

const isReadyCarrot = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'carrot') && other.state !== 'grow' && (other.data.burn ?? 0) <= 0

const dandelion: EcoSpecies = {
  anchor: 'bottom',
  asset: bloomAsset,
  burnTime: 1.8,
  countAs: 'dandelion',
  idle: 'sway',
  init(entity, world) {
    if (entity.state === 'grow') {
      entity.scale = 0.45
      entity.data.growth = 0
      world.setAsset(entity, sproutAsset)
    }

    entity.data.bloomFor = between(9, 15)
    entity.data.puffFor = between(4, 7)
  },
  layer: 'front',
  rest(entity, world) {
    entity.scale = 1
    entity.data.growth = 1
    world.setAsset(entity, bloomAsset)
    world.setState(entity, 'bloom')
  },
  size: [2.2, 2.9],
  state: 'grow',
  strongVs: ['carrot'],
  tags: ['plant', 'fuel'],
  weakTo: ['crow', 'goose', 'fire'],
  tick(entity, world, dt) {
    entity.data.water = Math.max(0, (entity.data.water ?? 0) - dt)
    const watered = (entity.data.water ?? 0) > 0

    if (entity.state === 'grow') {
      const rate = (entity.user ? 1 / 3 : 1 / 9) * (watered ? 2.6 : 1)
      const growth = Math.min(1, (entity.data.growth ?? 0) + dt * rate)

      entity.data.growth = growth
      entity.scale = 0.45 + 0.55 * growth
      world.setAsset(entity, growth < 0.5 ? sproutAsset : bloomAsset)

      if (growth >= 1) {
        world.setState(entity, 'bloom')
      }
      return
    }

    if (entity.state === 'bloom') {
      if (entity.t > (entity.data.bloomFor ?? 12) / (watered ? 1.5 : 1)) {
        world.setAsset(entity, puffAsset)
        world.setState(entity, 'puff')
      }
      return
    }

    if (entity.state === 'puff' && entity.t > (entity.data.puffFor ?? 5)) {
      const seeds = Math.round(between(3, 5))
      const headY = entity.y - world.heightOf(entity) * 0.85

      for (let index = 0; index < seeds; index += 1) {
        world.spawn('seed', {
          data: { sure: index === 0 ? 1 : 0 },
          vx: world.wind * between(0.6, 1.4),
          vy: -world.unit * between(0.8, 1.8),
          x: entity.x + between(-0.3, 0.3) * world.unit,
          y: headY,
        })
      }

      world.kill(entity)
    }
  },
}

const seed: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('dandelion-seed'),
  countAs: null,
  layer: 'front',
  size: [0.9, 1.2],
  state: 'float',
  tags: [],
  tick(entity, world, dt) {
    const unit = world.unit
    const rising = entity.age < (entity.data.rise ?? 1.6)
    const fall = unit * (entity.data.fall ?? 0.55)

    entity.vx += (world.wind - entity.vx) * Math.min(1, dt * 0.8)
    entity.vy += ((rising ? -unit * 0.9 : fall) - entity.vy) * Math.min(1, dt * 1.2)
    entity.vy += Math.sin(world.time * 2.2 + entity.id) * unit * 0.8 * dt
    entity.tilt = Math.sin(world.time * 1.8 + entity.id) * 14
    integrate(entity, dt)

    if (
      entity.x < -unit * 2 ||
      entity.x > world.width + unit * 2 ||
      entity.age > (entity.data.life ?? 24)
    ) {
      world.remove(entity)
      return
    }

    if (entity.y < world.groundY + (entity.data.depth ?? 0) - unit * 0.3) {
      return
    }

    const crowded = world.nearest({ x: entity.x, y: world.groundY }, isPlant(world), unit * 1.6)
    const plants = world.count(isPlant(world))
    const inside = entity.x > unit && entity.x < world.width - unit

    if (inside && (entity.data.sure ? plants < 40 : !crowded && plants < 26 && world.canBreed())) {
      world.spawn('dandelion', { x: entity.x, state: 'grow' })
    }

    world.remove(entity)
  },
}

const carrot: EcoSpecies = {
  anchor: 'bottom',
  asset: carrotSproutAsset,
  burnTime: 1.6,
  countAs: 'carrot',
  idle: 'sway',
  init(entity, world) {
    if (entity.state === 'grow') {
      entity.scale = 0.48
      entity.data.growth = 0
      world.setAsset(entity, carrotSproutAsset)
    } else {
      world.setAsset(entity, carrotAsset)
    }
  },
  layer: 'front',
  rest(entity, world) {
    entity.scale = 1
    entity.data.growth = 1
    world.setAsset(entity, carrotAsset)
    world.setState(entity, 'ready')
  },
  size: [1.8, 2.3],
  state: 'grow',
  strongVs: ['dandelion'],
  tags: ['plant', 'carrot', 'fuel'],
  weakTo: ['bunny', 'crow', 'goose'],
  tick(entity, world, dt) {
    entity.data.water = Math.max(0, (entity.data.water ?? 0) - dt)
    const watered = (entity.data.water ?? 0) > 0

    if (entity.state === 'grow') {
      const rate = (entity.user ? 1 / 3 : 1 / 10) * (watered ? 2.8 : 1)
      const growth = Math.min(1, (entity.data.growth ?? 0) + dt * rate)

      entity.data.growth = growth
      entity.scale = 0.48 + growth * 0.52
      world.setAsset(entity, growth < 0.55 ? carrotSproutAsset : carrotAsset)

      if (growth >= 1) {
        world.setState(entity, 'ready')
      }
      return
    }

    if (entity.state === 'pulled') {
      world.setAsset(entity, carrotPulledAsset)
      entity.lift = Math.max(0, Math.sin(Math.min(1, entity.t / 0.7) * Math.PI) * world.unit * 0.65)
      entity.tilt = Math.sin(entity.t * 9) * 5

      if (entity.t > 4 && !world.byId(entity.data.puller ?? null)) {
        world.kill(entity)
      }
      return
    }

    entity.lift = 0
    entity.tilt = Math.sin(world.time * 1.6 + entity.id) * (watered ? 1.6 : 0.7)
  },
}

const isBunnyFood = (world: EcoWorld) => (other: EcoEntity) =>
  (isReadyCarrot(world)(other) ||
    (world.has(other, 'plant') && !world.has(other, 'carrot') && other.state !== 'grow')) &&
  (other.data.burn ?? 0) <= 0

const bunny: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('bunny'),
  init(entity) {
    entity.data.hunger = between(0.4, 0.9)

    if ((entity.data.baby ?? 0) > 0) {
      entity.scale = 0.6
    }
  },
  layer: 'front',
  size: [2.4, 3],
  state: 'graze',
  strongVs: ['carrot', 'plant'],
  tags: ['bunny', 'prey', 'burnable'],
  weakTo: ['hawk', 'fox'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'carried') {
      const carrier = world.byId(entity.data.carrier ?? null)

      if (carrier?.state === 'carry') {
        return
      }

      entity.fx = ''
      entity.vy = 0
      world.setState(entity, 'drop')
    }

    if (entity.state === 'drop') {
      entity.vy += unit * 22 * dt
      entity.y += entity.vy * dt
      const floor = world.groundY + (entity.data.depth ?? 0)

      if (entity.y >= floor) {
        entity.y = floor
        entity.vy = 0
        world.setState(entity, 'flee')
      }
      return
    }

    entity.scale = Math.min(1, entity.scale + dt * 0.02)

    const hawk = world.nearest(
      entity,
      (other) =>
        world.has(other, 'hawk') &&
        (other.state === 'dive' || other.state === 'flush') &&
        (other.data.waitUntil ?? 0) <= world.time,
      unit * 14,
    )
    const fox = world.nearest(
      entity,
      (other) => world.has(other, 'fox') && ['stalk', 'pounce', 'chase'].includes(other.state),
      unit * 16,
    )
    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 4.5)
    const threat = fox ?? hawk ?? fire

    if (threat) {
      entity.facing = threat.x > entity.x ? -1 : 1
      entity.targetId = null
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      const fromFox = Boolean(fox)
      walk(entity, world, dt, unit * (fromFox ? 5.1 : 3.8))
      hop(entity, dt, unit * (fromFox ? 1.35 : 1.1), fromFox ? 11 : 9)

      if (fromFox) {
        if ((entity.data.zigAt ?? 0) < world.time) {
          entity.data.zig = Math.random() < 0.5 ? -1 : 1
          entity.data.zigAt = world.time + between(0.22, 0.52)
        }

        entity.x = clamp(
          entity.x + (entity.data.zig ?? 1) * unit * 1.8 * dt,
          unit,
          world.width - unit,
        )
      }

      if (entity.t > (fromFox ? 2.7 : 2) && !threat) {
        world.setState(entity, 'graze')
      }
      return
    }

    if (entity.state === 'eat') {
      settle(entity, dt)
      const plant = world.byId(entity.targetId)

      if (!plant) {
        world.setState(entity, 'graze')
        return
      }

      const eatingCarrot = world.has(plant, 'carrot')

      if (eatingCarrot && plant.state !== 'pulled') {
        plant.data.puller = entity.id
        world.setAsset(plant, carrotPulledAsset)
        world.setState(plant, 'pulled')
      }

      if (entity.t > (eatingCarrot ? 1.35 : 2)) {
        world.kill(plant)
        entity.targetId = null
        entity.data.hunger = eatingCarrot ? -0.35 : 0
        entity.data.meals = (entity.data.meals ?? 0) + (eatingCarrot ? 2 : 1)

        const partner = world.nearest(
          entity,
          (other) => other.species === 'bunny' && other.scale > 0.9,
          unit * 12,
        )

        if (
          (entity.data.meals ?? 0) >= 2 &&
          partner &&
          entity.scale > 0.9 &&
          world.canBreed() &&
          world.count((other) => other.species === 'bunny') < 14
        ) {
          entity.data.meals = 0
          world.spawn('bunny', {
            data: { baby: 1 },
            x: clamp(entity.x + between(-1.4, 1.4) * unit, unit, world.width - unit),
          })
        }

        world.setState(entity, 'graze')
      }
      return
    }

    if (entity.state === 'seek') {
      const plant = world.byId(entity.targetId)

      if (!plant || !isBunnyFood(world)(plant)) {
        entity.targetId = null
        world.setState(entity, 'graze')
        return
      }

      const carrotTarget = world.has(plant, 'carrot')

      hop(entity, dt, unit * (carrotTarget ? 0.95 : 0.8), carrotTarget ? 8 : 7)

      if (walkToward(entity, world, plant.x, unit * (carrotTarget ? 2.45 : 1.7), dt) < unit * 0.6) {
        if (carrotTarget) {
          plant.data.puller = entity.id
          world.setAsset(plant, carrotPulledAsset)
          world.setState(plant, 'pulled')
        }

        world.setState(entity, 'eat')
      }
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 8

    if (entity.state === 'sit') {
      settle(entity, dt)

      if (entity.t > (entity.data.sitFor ?? 2)) {
        world.setState(entity, 'graze')
      }
    } else {
      walk(entity, world, dt, unit * 1.4)
      hop(entity, dt, unit * 0.7, 7)

      if (chance(0.35, dt)) {
        entity.data.sitFor = between(1.2, 3)
        world.setState(entity, 'sit')
      } else if (chance(0.1, dt)) {
        entity.facing = entity.facing === 1 ? -1 : 1
      }
    }

    if ((entity.data.hunger ?? 0) > 1) {
      const carrotTarget = world.nearest(
        entity,
        isReadyCarrot(world),
        Math.max(unit * 40, world.height * 0.55),
      )
      const plant = carrotTarget ?? world.nearest(entity, isBunnyFood(world), unit * 26)

      if (plant) {
        entity.targetId = plant.id
        world.setState(entity, 'seek')
      }
    }
  },
}

const hawkSoar = ecoAsset('hawk')
const hawkDive = ecoAsset('hawk-dive')
const hawkCarry = ecoAsset('hawk-carry')
const hawkTalons = ecoAsset('hawk-talons')
const hawkFeather = ecoAsset('hawk-feather')
const crowFeather = ecoAsset('crow-feather')

const hawkGoneStates = ['depart', 'away', 'return']
const hawkHuntStates = ['dive', 'flush', 'swoop']
const hawkTransientFx = ['flinch', 'flinch-b', 'veer']
// Shared across every hawk so the crow flock is only thinned now and then.
const crowMealGate = new WeakMap<EcoWorld, number>()

const faceFlight = (entity: EcoEntity, world: EcoWorld, hold = 0.35) =>
  faceTravel(entity, world.unit * 0.6, hold)

const hawkPresent = (other: EcoEntity) =>
  other.species === 'hawk' && !other.dying && !hawkGoneStates.includes(other.state)

function hawkPack(world: EcoWorld, hawk: EcoEntity) {
  return world.within(
    hawk.x,
    hawk.y,
    Math.max(world.unit * 26, world.width * 0.3),
    (other) => other !== hawk && hawkPresent(other),
  )
}

type HawkMob = {
  centerX: number
  closest: EcoEntity | null
  closestGap: number
  count: number
  ready: number
}

function hawkMob(world: EcoWorld, hawk: EcoEntity): HawkMob {
  const radius = Math.max(world.unit * 14, 120)
  const mob: HawkMob = {
    centerX: hawk.x,
    closest: null,
    closestGap: Number.POSITIVE_INFINITY,
    count: 0,
    ready: 0,
  }
  let sumX = 0

  for (const other of world.entities) {
    if (
      other.dying ||
      other.removed ||
      other.species !== 'crow' ||
      other.state !== 'mob' ||
      other.targetId !== hawk.id
    ) {
      continue
    }

    const gap = Math.hypot(other.x - hawk.x, other.y - hawk.y)

    if (gap > radius) {
      continue
    }

    mob.count += 1
    sumX += other.x

    if ((other.data.mobReadyAt ?? Number.POSITIVE_INFINITY) <= world.time) {
      mob.ready += 1
    }

    if (gap < mob.closestGap) {
      mob.closest = other
      mob.closestGap = gap
    }
  }

  if (mob.count > 0) {
    mob.centerX = sumX / mob.count
  }

  return mob
}

function crowMealReady(world: EcoWorld, hawk: EcoEntity) {
  return (
    (hawk.data.crowMealAt ?? 0) <= world.time &&
    (crowMealGate.get(world) ?? 0) <= world.time &&
    world.count((other) => other.species === 'crow') > 3
  )
}

function shedFeathers(world: EcoWorld, from: EcoEntity, asset: string, count: number, burst = 1) {
  if (world.entities.length > 150) {
    return
  }

  const unit = world.unit

  for (let index = 0; index < count; index += 1) {
    const angle = between(0, Math.PI * 2)
    const speed = unit * between(0.8, 2.2) * burst

    world.spawn('feather', {
      data: { crow: asset === crowFeather ? 1 : 0, life: between(2.2, 3.4), spin: between(-1, 1) },
      vx: from.vx * 0.2 + Math.cos(angle) * speed,
      vy: from.vy * 0.1 + Math.sin(angle) * speed - unit * 0.5,
      x: from.x + between(-0.4, 0.4) * unit,
      y: from.y + between(-0.3, 0.3) * unit,
    })
  }
}

function holdPrey(hawk: EcoEntity, prey: EcoEntity, world: EcoWorld) {
  prey.facing = hawk.facing
  prey.lift = 0
  prey.x = hawk.x + hawk.facing * world.widthOf(hawk) * 0.08
  prey.y = hawk.y + world.heightOf(hawk) * 0.4 + world.heightOf(prey) * 0.58
}

function burstIntoSeeds(prey: EcoEntity, world: EcoWorld) {
  const unit = world.unit
  const seeds = 9
  const centerY = prey.y - world.heightOf(prey) * 0.5

  for (let index = 0; index < seeds; index += 1) {
    const angle = (index / seeds) * Math.PI * 2 + between(-0.2, 0.2)
    const speed = unit * between(2.6, 4)

    world.spawn('seed', {
      data: { fall: between(1.8, 2.6), life: 40, rise: 0, sure: index % 4 === 0 ? 1 : 0 },
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      x: prey.x + Math.cos(angle) * unit * 0.4,
      y: centerY + Math.sin(angle) * unit * 0.4,
    })
  }

  world.kill(prey)
}

function releaseCarry(hawk: EcoEntity, world: EcoWorld) {
  hawk.targetId = null
  hawk.data.zBoost = 0
  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'climb')
}

// Picks up the soaring circle exactly where the hawk is, already heading the way it faces.
function resumeSoar(hawk: EcoEntity, world: EcoWorld) {
  const unit = world.unit
  const radius = (hawk.data.radius ?? 5) * unit
  const angle = hawk.facing > 0 ? -Math.PI / 2 : Math.PI / 2

  hawk.targetId = null
  hawk.tilt = 0
  hawk.data.angle = angle
  hawk.data.centerX = clamp(hawk.x - Math.cos(angle) * radius, unit * 6, world.width - unit * 6)
  hawk.data.centerY = clamp(
    hawk.y - Math.sin(angle) * radius * 0.3,
    world.skyTop + unit,
    world.height * 0.32,
  )
  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'soar')
}

function endHunt(hawk: EcoEntity, world: EcoWorld, veer = false) {
  hawk.targetId = null
  hawk.data.waitUntil = 0
  hawk.data.packHunt = 0

  if (veer && !hawk.fx) {
    hawk.fx = 'veer'
    hawk.data.fxUntil = world.time + 0.6
  }

  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'climb')
}

function startEvade(hawk: EcoEntity, world: EcoWorld) {
  hawk.targetId = null
  hawk.data.calm = 0
  hawk.data.jinkAt = 0
  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'evade')
}

function strikeCrow(hawk: EcoEntity, crow: EcoEntity, world: EcoWorld) {
  hawk.targetId = crow.id
  hawk.data.strikeAt = world.time + between(2.5, 4)
  world.setAsset(hawk, hawkTalons)
  world.setState(hawk, 'strike')
}

function hawkFlinch(hawk: EcoEntity, world: EcoWorld, fromX: number) {
  hawk.fx = hawk.fx === 'flinch' ? 'flinch-b' : 'flinch'
  hawk.data.fxUntil = world.time + 0.42
  hawk.vx += (hawk.x >= fromX ? 1 : -1) * world.unit * 1.4
  hawk.vy += world.unit * 0.9

  if (Math.random() < 0.55) {
    shedFeathers(world, hawk, hawkFeather, 1)
  }
}

function releaseCrow(crow: EcoEntity, world: EcoWorld, rest: number) {
  crow.targetId = null
  crow.data.mobPhase = 0
  crow.data.restUntil = world.time + rest
  crow.data.goalAt = 0
  world.setAsset(crow, crowAsset)
  world.setState(crow, 'fly')
}

function knockCrow(crow: EcoEntity, world: EcoWorld, fromX: number) {
  const away = crow.x >= fromX ? 1 : -1

  crow.targetId = null
  crow.fx = ''
  crow.data.mobPhase = 0
  crow.data.tumbleDir = away
  crow.data.scatterUntil = world.time + between(2.5, 4)
  crow.vx = away * world.unit * 4.5
  crow.vy = -world.unit * 1.2

  if (Math.random() < 0.6) {
    shedFeathers(world, crow, crowFeather, 2)
  }

  world.setAsset(crow, crowAsset)
  world.setState(crow, 'tumble')
}

function dodgeCrow(crow: EcoEntity, world: EcoWorld, hawk: EcoEntity) {
  const away = crow.x >= hawk.x ? 1 : -1

  crow.vx = away * world.unit * 6
  crow.vy = -world.unit * 3.2
  crow.fx = 'caw'
  crow.data.fxUntil = world.time + 0.45
}

function takeCrow(hawk: EcoEntity, crow: EcoEntity, world: EcoWorld) {
  shedFeathers(world, crow, crowFeather, 6, 1.4)
  world.kill(crow)
  hawk.data.hunger = 0
  hawk.data.crowMealAt = world.time + between(45, 70)
  crowMealGate.set(world, world.time + between(26, 36))

  for (const other of world.within(
    hawk.x,
    hawk.y,
    Math.max(world.unit * 16, 140),
    (candidate) => candidate.species === 'crow' && candidate.state === 'mob',
  )) {
    releaseCrow(other, world, between(3, 5))
  }

  for (const mate of hawkPack(world, hawk)) {
    mate.data.hunger = Math.max(0, (mate.data.hunger ?? 0) - 0.35)
  }
}

function driveOff(hawk: EcoEntity, world: EcoWorld, fromX: number, awayFor: number) {
  const unit = world.unit

  hawk.targetId = null
  hawk.data.departDir =
    Math.abs(hawk.x - fromX) < unit * 2
      ? hawk.x < world.width / 2
        ? -1
        : 1
      : hawk.x >= fromX
        ? 1
        : -1
  hawk.data.awayFor = awayFor
  hawk.data.pressure = 0
  hawk.data.waitUntil = 0
  hawk.data.packHunt = 0
  hawk.data.zBoost = 0
  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'depart')
}

function reenterHawk(hawk: EcoEntity, world: EcoWorld) {
  const unit = world.unit
  let crowX = 0
  let crows = 0

  for (const other of world.entities) {
    if (other.species === 'crow' && !other.dying && !other.removed) {
      crowX += other.x
      crows += 1
    }
  }

  const fromLeft = crows > 0 ? crowX / crows > world.width / 2 : Math.random() < 0.5

  hawk.x = fromLeft ? -unit * 5 : world.width + unit * 5
  hawk.y = between(world.skyTop + unit * 2, world.height * 0.28)
  hawk.facing = fromLeft ? 1 : -1
  hawk.vx = hawk.facing * unit * 4
  hawk.vy = 0
  hawk.tilt = 0
  hawk.data.centerX = world.width * (fromLeft ? between(0.18, 0.4) : between(0.6, 0.82))
  hawk.data.centerY = clamp(hawk.y, world.skyTop + unit, world.height * 0.32)
  hawk.data.pressure = 0
  hawk.data.harriedUntil = 0
  hawk.data.faceTurnAt = -1
  hawk.data.hunger = Math.max(hawk.data.hunger ?? 0, between(0.35, 0.7))
  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'return')
}

function mateInTrouble(world: EcoWorld, hawk: EcoEntity, pack: EcoEntity[]) {
  const reach = Math.max(world.unit * 18, 150)

  for (const mate of pack) {
    const mob = hawkMob(world, mate)

    if (
      mob.closest &&
      mob.closestGap < world.unit * 6 &&
      Math.hypot(mob.closest.x - hawk.x, mob.closest.y - hawk.y) < reach
    ) {
      return mob.closest
    }
  }

  return null
}

function gooseClusterCount(world: EcoWorld, goose: EcoEntity) {
  const radius = Math.max(world.unit * 13, 104)

  return world.count(
    (other) =>
      world.has(other, 'goose') &&
      !other.dying &&
      !other.removed &&
      Math.hypot(other.x - goose.x, (other.y - goose.y) * 0.45) < radius,
  )
}

function gooseAirGuard(world: EcoWorld, hawk: EcoEntity) {
  let best: EcoEntity | null = null
  let bestDistance = Math.max(world.unit * 20, 156)

  for (const other of world.entities) {
    if (!world.has(other, 'goose') || other.dying || other.removed) {
      continue
    }

    if (gooseClusterCount(world, other) < 2) {
      continue
    }

    const distance = Math.abs(other.x - hawk.x)

    if (distance < bestDistance) {
      best = other
      bestDistance = distance
    }
  }

  return best
}

function startGooseFlap(goose: EcoEntity, world: EcoWorld, fromX: number, seconds = 1.2) {
  goose.targetId = null
  goose.data.avoidX = fromX
  goose.data.flapUntil = world.time + seconds
  world.setAsset(goose, gooseHonkAsset)
  world.setState(goose, 'flap')
}

// A crow landing a hit on a hawk: it flinches, loses a feather now and then, and the
// pressure that eventually drives it out of the crows' territory builds up.
function peckHawk(crow: EcoEntity, hawk: EcoEntity, world: EcoWorld) {
  const mob = hawkMob(world, hawk)

  crow.fx = 'jab'
  crow.data.fxUntil = world.time + 0.26
  hawk.data.pressure = (hawk.data.pressure ?? 0) + 1
  hawk.data.pressureAt = world.time
  hawk.data.harriedUntil = world.time + 2
  hawkFlinch(hawk, world, crow.x)

  if (
    hawkHuntStates.includes(hawk.state) &&
    Math.random() < 0.18 + 0.08 * Math.min(3, Math.max(0, mob.count - 1))
  ) {
    endHunt(hawk, world)
    return
  }

  if (hawk.state === 'carry' && hawk.t > 0.8) {
    const drop = mob.count >= 3 ? 0.4 : mob.count === 2 ? 0.25 : 0.1

    if (Math.random() < drop) {
      releaseCarry(hawk, world)
    }
  }
}

const feather: EcoSpecies = {
  anchor: 'center',
  asset: hawkFeather,
  countAs: null,
  init(entity, world) {
    if (entity.data.crow) {
      world.setAsset(entity, crowFeather)
    }

    entity.tilt = between(-40, 40)
  },
  layer: 'front',
  size: [0.75, 1],
  state: 'drift',
  style: (entity) => ({
    '--dawn-feather-fade': clamp(((entity.data.life ?? 3) - entity.age) / 0.8, 0, 1).toFixed(2),
  }),
  tags: [],
  tick(entity, world, dt) {
    const unit = world.unit

    if (
      entity.age > (entity.data.life ?? 3) ||
      entity.x < -unit * 2 ||
      entity.x > world.width + unit * 2
    ) {
      world.remove(entity)
      return
    }

    const floor = world.groundY - unit * 0.2

    if (entity.y >= floor) {
      entity.y = floor
      entity.vx *= Math.max(0, 1 - dt * 6)
      entity.vy = 0
      entity.tilt += (12 - entity.tilt) * Math.min(1, dt * 5)
      return
    }

    const sway = Math.sin(entity.age * 3.2 + entity.id)

    entity.vx += (world.wind * 0.4 + sway * unit * 1.2 - entity.vx) * Math.min(1, dt * 1.6)
    entity.vy += (unit * 1.3 - entity.vy) * Math.min(1, dt * 2)
    entity.tilt = sway * 32 + (entity.data.spin ?? 0) * 18
    integrate(entity, dt)
  },
}

const hawk: EcoSpecies = {
  anchor: 'center',
  asset: hawkSoar,
  init(entity, world) {
    entity.data.centerX = entity.x
    entity.data.centerY = between(world.skyTop + world.unit, world.height * 0.3)
    entity.data.angle = between(0, Math.PI * 2)
    entity.data.radius = between(4, 7)
    entity.data.hunger = between(0.2, 0.6)
    entity.data.crowMealAt = world.time + between(16, 28)
    entity.y = entity.data.centerY
  },
  layer: 'front',
  size: [3.6, 4.4],
  state: 'soar',
  strongVs: ['bunny', 'balloon'],
  tags: ['hawk', 'predator'],
  weakTo: ['crow', 'scarecrow', 'goose'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (hawkTransientFx.includes(entity.fx) && (entity.data.fxUntil ?? 0) < world.time) {
      entity.fx = ''
    }

    if (entity.state === 'away') {
      entity.vx = 0
      entity.vy = 0

      if (world.time >= (entity.data.returnAt ?? 0)) {
        reenterHawk(entity, world)
      }
      return
    }

    if (entity.state === 'depart') {
      const direction = entity.data.departDir ?? 1
      const climb = entity.y > world.skyTop + unit * 2 ? -unit * 2.4 : 0

      world.setAsset(entity, hawkSoar)
      entity.vx += (direction * unit * 7.4 - entity.vx) * Math.min(1, dt * 2)
      entity.vy += (climb - entity.vy) * Math.min(1, dt * 2)
      integrate(entity, dt)
      faceFlight(entity, world, 0.2)
      tiltToVelocity(entity, 18)

      if (entity.x < -unit * 6 || entity.x > world.width + unit * 6 || entity.t > 20) {
        entity.vx = 0
        entity.vy = 0
        entity.x = entity.x < world.width / 2 ? -unit * 6 : world.width + unit * 6
        entity.data.returnAt = world.time + (entity.data.awayFor ?? 12)
        world.setState(entity, 'away')
      }
      return
    }

    if (entity.state === 'return') {
      const radius = (entity.data.radius ?? 5) * unit
      const gap = steer(
        entity,
        entity.data.centerX ?? world.width / 2,
        (entity.data.centerY ?? entity.y) - radius * 0.3,
        unit * 5,
        dt,
        2,
      )

      integrate(entity, dt)
      faceFlight(entity, world)
      entity.tilt = (entity.vy * 0.15) / unit

      const inside = entity.x > unit * 3 && entity.x < world.width - unit * 3

      if ((inside && (gap < radius || entity.t > 7)) || entity.t > 14) {
        resumeSoar(entity, world)
      }
      return
    }

    const mob = hawkMob(world, entity)
    const pack = hawkPack(world, entity)

    if ((entity.data.pressureAt ?? 0) + 3 < world.time) {
      entity.data.pressure = Math.max(0, (entity.data.pressure ?? 0) - dt * 0.2)
    }

    // A lone hawk leaves once a real mob has formed; a pack only yields to a much bigger one.
    if (entity.state !== 'carry' && (entity.data.pressure ?? 0) >= 3.5 + pack.length * 3) {
      const ready = pack.reduce((total, mate) => total + hawkMob(world, mate).ready, mob.ready)

      if (ready >= (pack.length > 0 ? pack.length + 3 : 2)) {
        const awayFor = between(10, 16)

        driveOff(entity, world, mob.centerX, awayFor)
        pack
          .filter((mate) => mate.state !== 'carry')
          .forEach((mate, index) =>
            driveOff(mate, world, mob.centerX, awayFor + (index + 1) * between(0.8, 1.6)),
          )
        return
      }
    }

    if (entity.state === 'carry') {
      const prey = world.byId(entity.targetId)

      if (!prey) {
        releaseCarry(entity, world)
        return
      }

      entity.vx += (entity.facing * unit * 3.2 - entity.vx) * Math.min(1, dt * 2)
      entity.vy += (-unit * 5.5 - entity.vy) * Math.min(1, dt * 2.4)
      integrate(entity, dt)
      entity.tilt = -8 + Math.sin(entity.t * 9) * 3
      keepInSky(entity, world, world.skyTop + unit * 2)

      if (entity.x <= unit * 2 || entity.x >= world.width - unit * 2) {
        entity.facing = entity.x <= unit * 2 ? 1 : -1
      }

      holdPrey(entity, prey, world)

      const high = Math.max(world.skyTop + unit * 3, world.height * 0.26)

      if ((entity.y <= high && entity.t > 1.2) || entity.t > 6) {
        burstIntoSeeds(prey, world)
        entity.data.hunger = 0
        releaseCarry(entity, world)
      }
      return
    }

    if (entity.state === 'flip') {
      world.setAsset(entity, hawkTalons)
      entity.vx *= Math.max(0, 1 - dt * 2.4)
      entity.vy += ((entity.t < 0.3 ? -unit * 1.2 : unit * 1.4) - entity.vy) * Math.min(1, dt * 4)
      integrate(entity, dt)
      entity.tilt *= 0.85
      keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

      if (!entity.data.flipResolved && entity.t > 0.22 && entity.t < 0.6) {
        const crow = world.nearest(
          entity,
          (other) => other.species === 'crow' && other.state === 'mob',
          unit * 2.8,
        )

        if (crow) {
          entity.data.flipResolved = 1

          if (crowMealReady(world, entity) && Math.random() < (pack.length > 0 ? 0.14 : 0.08)) {
            takeCrow(entity, crow, world)
          } else if (Math.random() < (pack.length > 0 ? 0.85 : 0.6)) {
            knockCrow(crow, world, entity.x)
          } else {
            dodgeCrow(crow, world, entity)
          }
        }
      }

      if (entity.t > 0.85) {
        world.setAsset(entity, hawkSoar)
        world.setState(entity, 'evade')
      }
      return
    }

    if (entity.state === 'strike') {
      const crow = world.byId(entity.targetId)

      if (!crow || crow.species !== 'crow' || crow.state === 'tumble' || entity.t > 2.4) {
        endHunt(entity, world, true)
        return
      }

      world.setAsset(entity, hawkTalons)
      const gap = steer(entity, crow.x, crow.y, unit * (9 + 3 * Math.min(1, entity.t)), dt, 5.5)
      integrate(entity, dt)
      faceFlight(entity, world, 0.15)
      tiltToVelocity(entity, 30)
      keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

      if (gap < unit * 1.3) {
        if (crowMealReady(world, entity) && Math.random() < (pack.length > 0 ? 0.2 : 0.12)) {
          takeCrow(entity, crow, world)
        } else if (Math.random() < 0.3) {
          dodgeCrow(crow, world, entity)
        } else {
          knockCrow(crow, world, entity.x)
        }

        endHunt(entity, world)
      }
      return
    }

    if (hawkHuntStates.includes(entity.state)) {
      const prey = world.byId(entity.targetId)
      const guard = scarecrowAirGuard(world, entity)
      const gooseGuard = gooseAirGuard(world, entity)
      const low = entity.y > world.groundY - unit * 9
      const stoop = Math.min(entity.t, world.time - (entity.data.waitUntil ?? 0))

      // Dives commit: only something the viewer can see (cover, a flock, a guard) calls one off.
      if (
        !prey ||
        prey.state === 'carried' ||
        prey.state === 'drop' ||
        guard ||
        (world.has(prey, 'balloon') && prey.state !== 'float') ||
        (world.has(prey, 'bunny') && bunnySafeFromHawk(world, prey)) ||
        (world.has(prey, 'goose') && gooseClusterCount(world, prey) >= 2) ||
        (gooseGuard && low && Math.abs(gooseGuard.x - entity.x) < unit * 5) ||
        stoop > 7 ||
        entity.t > 12
      ) {
        endHunt(entity, world, true)
        return
      }

      const preyY =
        prey.anchor === 'bottom' ? prey.y - world.heightOf(prey) * 0.4 - prey.lift : prey.y

      if ((entity.data.waitUntil ?? 0) > world.time) {
        if (prey.state === 'flee' && entity.t > 0.6) {
          entity.data.waitUntil = Math.min(entity.data.waitUntil ?? 0, world.time + 0.35)
        }

        world.setAsset(entity, hawkSoar)
        steer(
          entity,
          clamp(prey.x + (entity.data.huntSide ?? 1) * unit * 7, unit * 3, world.width - unit * 3),
          clamp(preyY - unit * 14, world.skyTop + unit * 2, world.skyBottom),
          unit * 6,
          dt,
          3,
        )
        integrate(entity, dt)
        faceFlight(entity, world)
        tiltToVelocity(entity, 16)
        keepInSky(entity, world, world.skyTop + unit, world.skyBottom)
        return
      }

      const near = Math.hypot(prey.x - entity.x, preyY - entity.y) < unit * 6
      const flushing = entity.state === 'flush'
      const speed = entity.state === 'dive' ? Math.min(13.5, 8.5 + 3.2 * stoop) : flushing ? 8 : 6.5

      world.setAsset(entity, entity.state === 'dive' ? hawkDive : hawkSoar)
      const gap = steer(
        entity,
        prey.x,
        flushing ? preyY - unit * 1.6 : preyY,
        unit * speed,
        dt,
        near ? 7 : 4,
      )
      integrate(entity, dt)
      faceFlight(entity, world, 0.15)

      if (entity.state === 'dive') {
        entity.tilt = 0
      } else {
        tiltToVelocity(entity, 20)
      }

      if (flushing) {
        if (gap < unit * 4) {
          for (const mate of pack) {
            if (mate.state === 'dive' && mate.targetId === prey.id) {
              mate.data.waitUntil = Math.min(
                mate.data.waitUntil ?? 0,
                world.time + between(0.25, 0.5),
              )
            }
          }
        }

        if (gap < unit * 1.8) {
          endHunt(entity, world)
        }
        return
      }

      if (gap < unit * 1.3) {
        const packHunt = Boolean(entity.data.packHunt)
        const relays = entity.data.relays ?? 0

        endHunt(entity, world)

        if (world.has(prey, 'balloon')) {
          world.setState(prey, 'popped')
        } else if (world.has(prey, 'goose')) {
          startGooseFlap(prey, world, entity.x, 1.35)
          entity.data.hunger = Math.max(0.25, (entity.data.hunger ?? 0) - 0.35)
        } else if (prey.species === 'crow') {
          if (crowMealReady(world, entity) && Math.random() < 0.35) {
            takeCrow(entity, prey, world)
          } else {
            knockCrow(prey, world, entity.x)
          }
        } else if (
          prey.state === 'flee' &&
          Math.random() < (packHunt ? 0.5 : Math.min(0.88, 1.1 / world.edge(entity, prey)))
        ) {
          const relay =
            packHunt && relays < 1
              ? pack.find((mate) => ['soar', 'climb'].includes(mate.state) && !mate.targetId)
              : undefined

          if (relay) {
            relay.targetId = prey.id
            relay.data.packHunt = 1
            relay.data.relays = relays + 1
            relay.data.huntSide = relay.x >= prey.x ? 1 : -1
            relay.data.waitUntil = world.time + between(0.2, 0.45)
            world.setState(relay, 'dive')
          }
        } else {
          entity.targetId = prey.id
          entity.data.zBoost = 4000
          entity.vy = -unit * 1.5
          entity.facing = entity.x < world.width / 2 ? 1 : -1
          prey.targetId = null
          prey.data.carrier = entity.id
          prey.fx = 'carried'
          world.setState(prey, 'carried')
          world.setAsset(entity, hawkCarry)
          world.setState(entity, 'carry')
          holdPrey(entity, prey, world)

          if (packHunt) {
            for (const mate of pack) {
              mate.data.hunger = Math.max(0, (mate.data.hunger ?? 0) - 0.35)
            }
          }
        }
      }
      return
    }

    const harried =
      mob.count > 0 && (mob.closestGap < unit * 7 || (entity.data.harriedUntil ?? 0) > world.time)

    if (entity.state === 'evade') {
      entity.data.hunger = (entity.data.hunger ?? 0) + dt / 9
      entity.data.calm = harried ? 0 : (entity.data.calm ?? 0) + dt

      if ((entity.data.calm ?? 0) > 1.6) {
        resumeSoar(entity, world)
        return
      }

      const closest = mob.closest
      const canStrike = (entity.data.strikeAt ?? 0) < world.time

      // Red-tails roll over mid-air to flash their talons at a crow closing in.
      if (
        closest &&
        mob.closestGap < unit * (closest.data.mobPhase === 1 ? 3.6 : 2.2) &&
        (entity.data.flipAt ?? 0) < world.time &&
        chance(pack.length > 0 ? 1.6 : 1, dt)
      ) {
        entity.data.flipAt = world.time + (pack.length > 0 ? between(2.6, 4.2) : between(3.5, 6))
        entity.data.flipResolved = 0
        world.setAsset(entity, hawkTalons)
        world.setState(entity, 'flip')
        return
      }

      if (
        canStrike &&
        closest &&
        mob.closestGap < unit * 6 &&
        (pack.length > 0 || mob.count === 1) &&
        chance(pack.length > 0 ? 0.9 : 0.25, dt)
      ) {
        strikeCrow(entity, closest, world)
        return
      }

      const rescue = canStrike && pack.length > 0 ? mateInTrouble(world, entity, pack) : null

      if (rescue && chance(0.9, dt)) {
        strikeCrow(entity, rescue, world)
        return
      }

      if ((entity.data.jinkAt ?? 0) < world.time) {
        let direction: number = mob.count > 0 ? (entity.x >= mob.centerX ? 1 : -1) : entity.facing

        if (Math.random() < 0.25) {
          direction = -direction
        }

        if (entity.x < unit * 8) {
          direction = 1
        } else if (entity.x > world.width - unit * 8) {
          direction = -1
        }

        entity.data.jinkDir = direction
        entity.data.jinkAt = world.time + between(1.1, 2)
      }

      const top = world.skyTop + unit * 2

      world.setAsset(entity, hawkSoar)
      steer(
        entity,
        clamp(entity.x + (entity.data.jinkDir ?? 1) * unit * 9, unit * 3, world.width - unit * 3),
        pack.length > 0 ? clamp(entity.y - unit * 1.5, top, world.skyBottom) : top,
        unit * 6.9,
        dt,
        2.6,
      )
      integrate(entity, dt)
      faceFlight(entity, world)
      tiltToVelocity(entity, 22)
      keepInSky(entity, world, world.skyTop + unit, world.skyBottom)
      return
    }

    if (harried) {
      startEvade(entity, world)
      return
    }

    if (pack.length > 0 && (entity.data.strikeAt ?? 0) < world.time) {
      const rescue = mateInTrouble(world, entity, pack)

      if (rescue && chance(1.4, dt)) {
        strikeCrow(entity, rescue, world)
        return
      }
    }

    if (entity.state === 'climb') {
      world.setAsset(entity, hawkSoar)
      entity.vy += (-unit * 4.5 - entity.vy) * Math.min(1, dt * 3)
      entity.vx *= 0.98
      integrate(entity, dt)
      faceFlight(entity, world)
      tiltToVelocity(entity, 25)
      keepInSky(entity, world)

      if (entity.t > 1.6 || entity.y <= world.skyTop + unit) {
        resumeSoar(entity, world)
      }
      return
    }

    const guard = scarecrowAirGuard(world, entity)
    const gooseGuard = gooseAirGuard(world, entity)

    world.setAsset(entity, hawkSoar)
    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 9
    entity.data.angle = (entity.data.angle ?? 0) + dt * 0.55
    entity.data.centerX =
      (entity.data.centerX ?? entity.x) + Math.sin(world.time * 0.13 + entity.id) * unit * 0.8 * dt

    // Family members drift their circles together, which is how a pack forms.
    const mate = world.nearest(entity, (other) => other !== entity && hawkPresent(other))

    if (mate) {
      const apart = (mate.data.centerX ?? mate.x) - (entity.data.centerX ?? entity.x)

      if (Math.abs(apart) > unit * 9) {
        entity.data.centerX = (entity.data.centerX ?? entity.x) + Math.sign(apart) * unit * 2 * dt
      }
    }

    entity.data.centerX = clamp(entity.data.centerX ?? entity.x, unit * 6, world.width - unit * 6)
    const radius = (entity.data.radius ?? 5) * unit
    const angle = entity.data.angle ?? 0
    const goalX = (entity.data.centerX ?? entity.x) + Math.cos(angle) * radius
    const goalY = (entity.data.centerY ?? entity.y) + Math.sin(angle) * radius * 0.3

    steer(entity, goalX, goalY, unit * 4, dt, 3)

    const airGuard = guard ?? gooseGuard

    if (airGuard) {
      const away = entity.x >= airGuard.x ? 1 : -1

      steer(
        entity,
        clamp(entity.x + away * unit * 8, unit * 2, world.width - unit * 2),
        clamp(entity.y - unit * 2.4, world.skyTop + unit, world.skyBottom),
        unit * 6.5,
        dt,
        5,
      )
      // Drift the whole circle away too, so the hawk doesn't bounce on the guard's edge.
      entity.data.centerX = clamp(
        (entity.data.centerX ?? entity.x) + away * unit * 2.5 * dt,
        unit * 6,
        world.width - unit * 6,
      )
      entity.fx = entity.fx || 'veer'
      entity.data.fxUntil = Math.max(entity.data.fxUntil ?? 0, world.time + 0.3)
    }

    integrate(entity, dt)
    faceFlight(entity, world)
    entity.tilt = (entity.vy * 0.15) / unit
    keepInSky(entity, world)

    // Mobbed hawks have lost the element of surprise, so they don't start hunts.
    if (mob.count > 0) {
      return
    }

    const balloon = world.nearest(
      entity,
      (other) => world.has(other, 'balloon') && other.state === 'float',
      unit * ((entity.data.hunger ?? 0) > 0.6 ? 30 : 4),
    )

    if (balloon && chance(0.6, dt)) {
      entity.targetId = balloon.id
      world.setState(entity, 'swoop')
      return
    }

    if ((entity.data.hunger ?? 0) > 1.18 && crowMealReady(world, entity) && chance(0.12, dt)) {
      const straggler = world.nearest(
        entity,
        (other) =>
          other.species === 'crow' &&
          ['fly', 'peck'].includes(other.state) &&
          !world.nearest(
            other,
            (flockmate) => flockmate.species === 'crow' && flockmate.id !== other.id,
            unit * 8,
          ),
        Math.max(unit * 34, world.height * 0.7),
      )

      if (straggler) {
        entity.targetId = straggler.id
        entity.data.waitUntil = 0
        world.setState(entity, 'dive')
        return
      }
    }

    if ((entity.data.hunger ?? 0) > 1.12 && chance(0.72, dt)) {
      const prey = world.nearest(
        entity,
        (other) =>
          world.has(other, 'bunny') &&
          other.state !== 'carried' &&
          other.state !== 'drop' &&
          !bunnySafeFromHawk(world, other),
        Math.max(unit * 45, world.height),
      )

      if (prey) {
        const partner = pack.find(
          (other) => ['soar', 'climb'].includes(other.state) && hawkMob(world, other).count === 0,
        )

        entity.targetId = prey.id
        entity.data.waitUntil = 0
        entity.data.relays = 0

        if (!partner) {
          entity.data.packHunt = 0
          world.setState(entity, 'dive')
          return
        }

        // Harris's hawks hunt as a team: the closer bird flushes, the other waits high and strikes.
        const flusher =
          Math.abs(partner.x - prey.x) < Math.abs(entity.x - prey.x) ? partner : entity
        const striker = flusher === entity ? partner : entity

        for (const member of [flusher, striker]) {
          member.targetId = prey.id
          member.data.packHunt = 1
          member.data.relays = 0
        }

        flusher.data.waitUntil = 0
        striker.data.waitUntil = world.time + 4
        striker.data.huntSide = flusher.x < prey.x ? 1 : -1
        world.setAsset(flusher, hawkSoar)
        world.setState(flusher, 'flush')
        world.setAsset(striker, hawkSoar)
        world.setState(striker, 'dive')
        return
      }
    }

    if ((entity.data.hunger ?? 0) > 1.35 && chance(0.26, dt)) {
      const prey = world.nearest(
        entity,
        (other) =>
          world.has(other, 'goose') &&
          other.state !== 'flap' &&
          gooseClusterCount(world, other) < 2,
        Math.max(unit * 36, world.height * 0.8),
      )

      if (prey) {
        entity.targetId = prey.id
        entity.data.waitUntil = 0
        entity.data.packHunt = 0
        world.setState(entity, 'dive')
      }
    }
  },
}

function crowGroundY(crow: EcoEntity, world: EcoWorld) {
  return world.groundY - world.heightOf(crow) * 0.42 + (crow.data.depth ?? 0) * 0.16
}

function crowFoodTarget(crow: EcoEntity, world: EcoWorld) {
  const unit = world.unit

  return (
    world.nearest(
      { x: crow.x, y: world.groundY },
      (other) => other.species === 'seed' && other.y > world.groundY - unit * 4,
      unit * 18,
    ) ??
    world.nearest(
      { x: crow.x, y: world.groundY },
      (other) =>
        world.has(other, 'carrot') && other.state === 'grow' && (other.data.burn ?? 0) <= 0,
      unit * 15,
    )
  )
}

const crowTransientFx = ['caw', 'jab', 'peck']

// How often a crow's dive at a hawk actually connects, by what the hawk is doing.
const crowContactChance: Record<string, number> = {
  carry: 0.6,
  climb: 0.7,
  dive: 0.55,
  evade: 0.45,
  flush: 0.55,
  soar: 0.7,
  strike: 0.35,
  swoop: 0.55,
}

const mobbableHawk = (world: EcoWorld) => (other: EcoEntity) =>
  hawkPresent(other) && other.x > 0 && other.x < world.width

function startCrowMob(crow: EcoEntity, hawk: EcoEntity, world: EcoWorld) {
  crow.targetId = hawk.id
  crow.fx = 'caw'
  crow.data.fxUntil = world.time + 0.5
  crow.data.mobReadyAt = world.time + between(0.6, 1.3)
  crow.data.peckAt = world.time + between(0.8, 1.8)
  crow.data.mobUntil = world.time + between(14, 24)
  crow.data.mobPhase = 0
  crow.data.slot = between(-1, 1)
  world.setAsset(crow, crowMobAsset)
  world.setState(crow, 'mob')
}

function peelCrow(crow: EcoEntity, world: EcoWorld) {
  crow.data.mobPhase = 2
  crow.data.peelUntil = world.time + between(0.45, 0.7)
  crow.data.peelDir = crow.vx >= 0 ? 1 : -1
}

const crow: EcoSpecies = {
  anchor: 'center',
  asset: crowAsset,
  idle: 'flap',
  init(entity, world) {
    entity.data.angle = between(0, Math.PI * 2)
    entity.data.goalAt = 0
    entity.data.hunger = between(0.15, 0.7)
    entity.y = between(
      world.skyTop + world.unit * 2,
      Math.min(world.skyBottom, world.height * 0.48),
    )
  },
  layer: 'front',
  size: [2.15, 2.75],
  state: 'fly',
  strongVs: ['hawk', 'carrot', 'balloon'],
  tags: ['prey', 'burnable'],
  weakTo: ['fox', 'scarecrow'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (crowTransientFx.includes(entity.fx) && (entity.data.fxUntil ?? 0) < world.time) {
      entity.fx = ''
    }

    if (entity.state === 'tumble') {
      const direction = entity.data.tumbleDir ?? 1

      world.setAsset(entity, crowAsset)

      if (entity.t < 0.5) {
        entity.vx *= Math.max(0, 1 - dt * 1.5)
        entity.vy += unit * 16 * dt
      } else {
        steer(
          entity,
          clamp(entity.x + direction * unit * 8, unit, world.width - unit),
          clamp(entity.y - unit * 3, world.skyTop + unit, world.skyBottom),
          unit * 6.5,
          dt,
          3,
        )
        tiltToVelocity(entity, 26)
      }

      integrate(entity, dt)
      faceTravel(entity, unit * 0.8, 0.3)
      keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

      if (entity.t > 1.3) {
        entity.data.goalAt = 0
        world.setState(entity, 'fly')
      }
      return
    }

    const scarecrow = scarecrowNear(world, entity, Math.max(unit * 10, 92))
    const foxThreat = world.nearest(
      entity,
      (other) => world.has(other, 'fox') && ['stalk', 'pounce'].includes(other.state),
      entity.state === 'peck' ? unit * 9 : unit * 4,
    )

    if ((scarecrow || foxThreat) && entity.state !== 'flee') {
      entity.targetId = null
      entity.data.mobPhase = 0
      entity.data.avoidX = (scarecrow ?? foxThreat)?.x ?? entity.x
      world.setAsset(entity, crowAsset)
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      const fromX = entity.data.avoidX ?? entity.x
      const direction = entity.x >= fromX ? 1 : -1
      const goalX = clamp(entity.x + direction * unit * 9, unit, world.width - unit)
      const goalY = clamp(entity.y - unit * 4, world.skyTop + unit * 1.2, world.skyBottom)

      world.setAsset(entity, crowAsset)
      steer(entity, goalX, goalY, unit * 7.4, dt, 5)
      integrate(entity, dt)
      faceTravel(entity, unit * 0.5, 0.2)
      tiltToVelocity(entity, 28)
      keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

      if (entity.t > 1.5 && !scarecrow && !foxThreat) {
        entity.data.goalAt = 0
        entity.lift = 0
        world.setState(entity, 'fly')
      }
      return
    }

    if (entity.state === 'balloon-peck') {
      const target = world.byId(entity.targetId)

      if (!target || !world.has(target, 'balloon') || target.state !== 'float') {
        entity.targetId = null
        world.setAsset(entity, crowAsset)
        world.setState(entity, 'fly')
        return
      }

      world.setAsset(entity, crowPeckAsset)
      const gap = steer(entity, target.x, target.y, unit * 6.6, dt, 5)
      integrate(entity, dt)
      faceTravel(entity, unit * 0.5, 0.25)
      tiltToVelocity(entity, 24)
      keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

      if (gap < unit * 1.35 && entity.t > 0.24) {
        entity.fx = 'peck'
        entity.data.fxUntil = world.time + 0.24

        if (Math.random() < Math.min(0.96, 0.58 * world.edge(entity, target))) {
          world.setState(target, 'popped')
          entity.data.hunger = 0
        }

        entity.targetId = null
        world.setAsset(entity, crowAsset)
        world.setState(entity, 'fly')
      } else if (entity.t > 5) {
        entity.targetId = null
        world.setAsset(entity, crowAsset)
        world.setState(entity, 'fly')
      }
      return
    }

    if (
      entity.state !== 'mob' &&
      (entity.data.scatterUntil ?? 0) < world.time &&
      (entity.data.restUntil ?? 0) < world.time
    ) {
      const spotRadius = Math.max(unit * 17, world.height * 0.38)
      const alarmRadius = Math.max(unit * 26, world.height * 0.6)
      const spotted = world.nearest(
        entity,
        (other) =>
          mobbableHawk(world)(other) &&
          (Math.hypot(other.x - entity.x, other.y - entity.y) < spotRadius ||
            [...hawkHuntStates, 'carry', 'strike'].includes(other.state)),
        alarmRadius,
      )

      if (spotted) {
        const alarming = [...hawkHuntStates, 'carry', 'strike'].includes(spotted.state)

        if (chance(alarming ? 5 : 2.5, dt)) {
          startCrowMob(entity, spotted, world)
          return
        }
      } else {
        // Mobbing crows caw; others within earshot fly in to join.
        const caller = world.nearest(
          entity,
          (other) => other.species === 'crow' && other.state === 'mob',
          Math.max(unit * 34, world.width * 0.45),
        )
        const called = caller ? world.byId(caller.targetId) : null

        if (called && mobbableHawk(world)(called)) {
          if (chance(1.4, dt)) {
            startCrowMob(entity, called, world)
            return
          }
        } else if (chance(0.3, dt)) {
          // Sooner or later a crow notices a hawk circling anywhere over its patch.
          const distant = world.nearest(
            entity,
            mobbableHawk(world),
            Math.max(unit * 40, world.width * 0.5),
          )

          if (distant) {
            startCrowMob(entity, distant, world)
            return
          }
        }
      }
    }

    if (entity.state === 'mob') {
      const target = world.byId(entity.targetId)

      if (!target || target.species !== 'hawk' || ['away', 'return'].includes(target.state)) {
        releaseCrow(entity, world, between(2, 4))
        return
      }

      const escorting = target.state === 'depart'
      const phase = entity.data.mobPhase ?? 0

      if (escorting && (target.x < unit * 4 || target.x > world.width - unit * 4)) {
        releaseCrow(entity, world, between(6, 10))
        return
      }

      if (phase === 0 && world.time > (entity.data.mobUntil ?? 0)) {
        releaseCrow(entity, world, between(6, 11))
        return
      }

      world.setAsset(entity, crowMobAsset)

      if (phase === 1) {
        const gap = steer(
          entity,
          target.x - target.facing * unit * 0.3,
          target.y - unit * 0.45,
          unit * 10.5,
          dt,
          6.5,
        )
        integrate(entity, dt)
        faceTravel(entity, unit * 0.8, 0.2)
        tiltToVelocity(entity, 34)
        keepInSky(entity, world, world.skyTop + unit * 0.6, world.skyBottom)

        if (gap < unit * 1.4) {
          if (target.state === 'flip') {
            dodgeCrow(entity, world, target)
            peelCrow(entity, world)
            return
          }

          if (Math.random() < (crowContactChance[target.state] ?? 0.5)) {
            peckHawk(entity, target, world)
          } else {
            // A near miss still counts as harassment.
            target.data.pressure = (target.data.pressure ?? 0) + 0.35
            target.data.pressureAt = world.time
            target.data.harriedUntil = Math.max(target.data.harriedUntil ?? 0, world.time + 1.2)
          }

          peelCrow(entity, world)
        } else if (world.time - (entity.data.attackAt ?? 0) > 1.6) {
          peelCrow(entity, world)
        }
        return
      }

      if (phase === 2) {
        steer(
          entity,
          entity.x + (entity.data.peelDir ?? entity.facing) * unit * 6,
          entity.y - unit * 3,
          unit * 8,
          dt,
          4,
        )
        integrate(entity, dt)
        faceTravel(entity, unit * 0.8, 0.3)
        tiltToVelocity(entity, 28)
        keepInSky(entity, world, world.skyTop + unit * 0.6, world.skyBottom)

        if (world.time > (entity.data.peelUntil ?? 0)) {
          entity.data.mobPhase = 0
          entity.data.peckAt = world.time + (escorting ? between(2.6, 4) : between(1.2, 2.4))
        }
        return
      }

      // Hold station above and behind the hawk (its blind spot), then dive-bomb its back.
      const slot = entity.data.slot ?? 0
      const stationX =
        target.x -
        target.facing * unit * (2.6 + slot * 1.2) +
        Math.sin(world.time * 1.1 + entity.id) * unit * 0.6
      const stationY =
        target.y -
        unit * (1.8 + Math.abs(slot) * 0.9) +
        Math.cos(world.time * 1.4 + entity.id * 0.7) * unit * 0.4
      const gap = steer(
        entity,
        clamp(stationX, unit, world.width - unit),
        stationY,
        unit * 7.6,
        dt,
        3.4,
      )

      // Crows flap hard but can't out-climb a hawk riding a thermal.
      entity.vy = Math.max(entity.vy, -unit * (3.6 + (entity.id % 5) * 0.2))
      integrate(entity, dt)
      faceTravel(entity, unit * 1.5, 0.45)
      entity.tilt =
        clamp((entity.vy * 0.12) / unit, -14, 14) + Math.sin(world.time * 2.1 + entity.id) * 4
      keepInSky(entity, world, world.skyTop + unit * 0.6, world.skyBottom)

      const attackers = world.count(
        (other) =>
          other.species === 'crow' &&
          other.state === 'mob' &&
          other.targetId === target.id &&
          other.data.mobPhase === 1,
      )

      if (
        (entity.data.mobReadyAt ?? Number.POSITIVE_INFINITY) <= world.time &&
        (entity.data.peckAt ?? 0) < world.time &&
        gap < unit * 3 &&
        entity.y <= target.y + unit * 0.5 &&
        attackers < 2
      ) {
        entity.data.mobPhase = 1
        entity.data.attackAt = world.time
        entity.fx = 'caw'
        entity.data.fxUntil = world.time + 0.4
      }
      return
    }

    if (entity.state === 'peck') {
      const target = world.byId(entity.targetId)
      const groundY = crowGroundY(entity, world)
      const dy = groundY - entity.y
      const grounded = Math.abs(dy) < unit * 0.8

      world.setAsset(entity, crowPeckAsset)
      entity.y += Math.sign(dy) * Math.min(Math.abs(dy), unit * 5.8 * dt)
      entity.vx *= 0.82
      entity.vy *= 0.82
      entity.lift = Math.abs(Math.sin(entity.t * 9)) * unit * 0.22
      entity.tilt = Math.sin(entity.t * 12) * 4

      if (!target || (target.species !== 'seed' && !world.has(target, 'carrot'))) {
        if ((entity.data.peckUntil ?? 0) > world.time) {
          return
        }

        entity.targetId = null
        entity.data.peckUntil = 0
        world.setState(entity, 'fly')
        return
      }

      const dx = target.x - entity.x

      if (Math.abs(dx) > unit * 0.2) {
        entity.facing = dx >= 0 ? 1 : -1
      }

      entity.x += Math.sign(dx) * Math.min(Math.abs(dx), unit * 2.2 * dt)
      entity.x = clamp(entity.x, unit, world.width - unit)

      if (grounded && Math.abs(dx) < unit * 0.8 && entity.t > 0.32) {
        if (target.species === 'seed') {
          world.remove(target)
        } else if (target.state === 'grow') {
          world.kill(target)
        }

        entity.data.hunger = 0
        entity.targetId = null
        entity.data.peckUntil = world.time + between(1.1, 2.2)
      } else if (entity.t > 8) {
        entity.targetId = null
        entity.data.peckUntil = 0
        world.setState(entity, 'fly')
      }
      return
    }

    world.setAsset(entity, crowAsset)
    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 7.5
    entity.lift = 0
    entity.data.angle = (entity.data.angle ?? 0) + dt * 1.8

    const flockmate = world.nearest(
      entity,
      (other) => other.species === 'crow' && other.state === 'fly',
      unit * 16,
    )

    if (flockmate) {
      entity.vx += (flockmate.vx - entity.vx) * Math.min(1, dt * 0.35)
      entity.vy += (flockmate.vy - entity.vy) * Math.min(1, dt * 0.3)
    }

    wander(entity, world, dt, unit * 3.6, world.skyTop + unit * 1.2, world.skyBottom, 2.2)
    integrate(entity, dt)
    faceTravel(entity, unit * 0.5, 0.3)
    entity.tilt = Math.sin(world.time * 2.3 + entity.id) * 6 + (entity.vy * 0.08) / unit
    keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

    if ((entity.data.hunger ?? 0) > 0.55 && chance(0.72, dt)) {
      const balloon = world.nearest(
        entity,
        (other) => world.has(other, 'balloon') && other.state === 'float',
        Math.max(unit * 42, world.height * 0.7),
      )

      if (balloon && chance(0.95 * world.edge(entity, balloon), dt)) {
        entity.targetId = balloon.id
        entity.vx = 0
        entity.vy = 0
        world.setAsset(entity, crowPeckAsset)
        world.setState(entity, 'balloon-peck')
        return
      }

      const food = crowFoodTarget(entity, world)

      if (food) {
        entity.targetId = food.id
        entity.vx = 0
        entity.vy = unit * 1.2
        world.setAsset(entity, crowPeckAsset)
        world.setState(entity, 'peck')
      }
    }
  },
}

const foxTargetStates = ['graze', 'seek', 'sit', 'eat', 'flee']

const fox: EcoSpecies = {
  anchor: 'bottom',
  asset: foxAsset,
  idle: 'trot',
  init(entity) {
    entity.data.hunger = between(0.35, 0.85)
    entity.data.patience = between(0.8, 1.6)
  },
  layer: 'front',
  size: [3.2, 3.9],
  state: 'trot',
  strongVs: ['crow', 'bunny'],
  tags: ['fox', 'predator', 'burnable'],
  weakTo: ['goose'],
  tick(entity, world, dt) {
    const unit = world.unit
    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 6)

    if (fire && !['avoid', 'yelp', 'pounce', 'eat'].includes(entity.state)) {
      entity.targetId = null
      entity.data.avoidX = fire.x
      world.setAsset(entity, foxAsset)
      world.setState(entity, 'avoid')
    }

    if (entity.state === 'avoid') {
      const fromX = entity.data.avoidX ?? fire?.x ?? entity.x

      entity.fx = 'spooked'
      entity.facing = fromX > entity.x ? -1 : 1
      walk(entity, world, dt, unit * 4.2)
      entity.x = clamp(entity.x, unit, world.width - unit)

      if (entity.t > 1.4 && !fire) {
        entity.fx = ''
        world.setState(entity, 'trot')
      }
      return
    }

    if (entity.state === 'yelp') {
      world.setAsset(entity, foxAsset)
      entity.fx = 'hurt'
      entity.facing = (entity.data.hurtX ?? entity.x) > entity.x ? -1 : 1
      walk(entity, world, dt, unit * 4.8)
      entity.lift = Math.abs(Math.sin(entity.t * 12)) * unit * 0.55

      if (entity.t > 1.35) {
        entity.fx = ''
        entity.lift = 0
        entity.data.hunger = Math.max(0.2, (entity.data.hunger ?? 0) - 0.35)
        world.setState(entity, 'trot')
      }
      return
    }

    if (entity.state === 'eat') {
      world.setAsset(entity, foxAsset)
      settle(entity, dt)

      if (entity.t > 1.5) {
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1
        world.setState(entity, 'trot')
      }
      return
    }

    if (entity.state === 'pounce') {
      world.setAsset(entity, foxPounceAsset)
      const progress = Math.min(1, entity.t / 0.7)
      const startX = entity.data.startX ?? entity.x
      const endX = entity.data.endX ?? entity.x

      entity.x = clamp(startX + (endX - startX) * progress, unit, world.width - unit)
      entity.y = world.groundY + (entity.data.depth ?? 0)
      entity.lift = Math.sin(Math.PI * progress) * (entity.data.jump ?? unit * 2.2)

      if (progress > 0.32 && !(entity.data.resolved ?? 0)) {
        const gooseGuard = world.nearest(
          entity,
          (other) => world.has(other, 'goose') && ['charge', 'honk', 'flap'].includes(other.state),
          unit * 4.2,
        )

        if (gooseGuard) {
          entity.data.resolved = 1
          entity.data.avoidX = gooseGuard.x
          gooseGuard.targetId = entity.id
          entity.lift = 0
          world.setAsset(gooseGuard, gooseHonkAsset)
          world.setState(gooseGuard, 'charge')
          world.setAsset(entity, foxAsset)
          world.setState(entity, 'avoid')
          return
        }

        const target = world.byId(entity.targetId)
        const crowTarget =
          target?.species === 'crow' &&
          ['peck', 'flee'].includes(target.state) &&
          target.y > world.groundY - unit * 6
            ? target
            : world.nearest(
                entity,
                (other) =>
                  other.species === 'crow' &&
                  ['peck', 'flee'].includes(other.state) &&
                  other.y > world.groundY - unit * 6,
                unit * 1.65,
              )

        if (
          crowTarget &&
          Math.abs(crowTarget.x - entity.x) < unit * 3.4 &&
          Math.random() < Math.min(0.96, 0.72 * world.edge(entity, crowTarget))
        ) {
          entity.data.resolved = 1
          world.kill(crowTarget)
          entity.fx = ''
          entity.data.caught = 1
          return
        }

        const bunnyTarget = world.nearest(
          entity,
          (other) => world.has(other, 'bunny') && foxTargetStates.includes(other.state),
          unit * 1.65,
        )

        if (bunnyTarget) {
          entity.data.resolved = 1

          const edge = world.edge(entity, bunnyTarget)

          if (bunnyTarget.state === 'flee' && Math.random() < 0.52 / edge) {
            entity.fx = 'miss'
          } else if (Math.random() < Math.min(0.95, 0.76 * edge)) {
            world.kill(bunnyTarget)
            entity.fx = ''
            entity.data.caught = 1
          } else {
            entity.fx = 'miss'
          }
        }
      }

      if (progress >= 1) {
        entity.lift = 0
        world.setAsset(entity, foxAsset)
        world.setState(entity, entity.data.caught ? 'eat' : 'trot')
        entity.fx = ''
      }
      return
    }

    if (entity.state === 'stalk') {
      world.setAsset(entity, foxCrouchAsset)
      const prey = world.byId(entity.targetId)
      const stalkingBunny = Boolean(
        prey && world.has(prey, 'bunny') && foxTargetStates.includes(prey.state),
      )
      const stalkingCrow = Boolean(
        prey?.species === 'crow' &&
        ['peck', 'flee'].includes(prey.state) &&
        prey.y > world.groundY - unit * 6,
      )

      if (!prey || (!stalkingBunny && !stalkingCrow) || entity.t > 8) {
        entity.targetId = null
        world.setAsset(entity, foxAsset)
        world.setState(entity, 'trot')
        return
      }

      const gap = walkToward(entity, world, prey.x, unit * 0.95, dt)

      if (
        gap < unit * (stalkingCrow ? 3.2 : 4.4) ||
        entity.t > (entity.data.patience ?? 1.2) + 1.6
      ) {
        entity.data.startX = entity.x
        entity.data.endX = clamp(prey.x + prey.vx * 0.25, unit, world.width - unit)
        entity.data.jump = unit * between(1.7, 2.9)
        entity.data.caught = 0
        entity.data.resolved = 0
        world.setAsset(entity, foxPounceAsset)
        world.setState(entity, 'pounce')
      }
      return
    }

    if ((entity.data.hunger ?? 0) > 0.5) {
      const groundedCrow = world.nearest(
        entity,
        (other) =>
          other.species === 'crow' && other.state === 'peck' && other.y > world.groundY - unit * 6,
        unit * 14,
      )

      if (groundedCrow) {
        entity.targetId = groundedCrow.id
        entity.data.patience = between(0.2, 0.55)
        world.setState(entity, 'stalk')
        return
      }
    }

    world.setAsset(entity, foxAsset)
    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 8
    walk(entity, world, dt, unit * 1.35)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    if ((entity.data.hunger ?? 0) > 0.62 && chance(1.25, dt)) {
      const crowTarget = world.nearest(
        entity,
        (other) =>
          other.species === 'crow' && other.state === 'peck' && other.y > world.groundY - unit * 6,
        Math.max(unit * 28, world.height * 0.45),
      )

      if (crowTarget) {
        entity.targetId = crowTarget.id
        entity.data.patience = between(0.2, 0.55)
        world.setState(entity, 'stalk')
        return
      }

      const bunnyTarget = world.nearest(
        entity,
        (other) => world.has(other, 'bunny') && foxTargetStates.includes(other.state),
        Math.max(unit * 42, world.height * 0.7),
      )

      if (bunnyTarget) {
        entity.targetId = bunnyTarget.id
        entity.data.patience = between(0.75, 1.5)
        world.setState(entity, 'stalk')
        return
      }
    }
  },
}

const isGooseFood = (world: EcoWorld) => (other: EcoEntity) =>
  ((world.has(other, 'carrot') && other.state === 'grow') ||
    (world.has(other, 'plant') && !world.has(other, 'carrot') && other.state !== 'puff')) &&
  (other.data.burn ?? 0) <= 0

const gooseFoxTarget = (goose: EcoEntity, world: EcoWorld) =>
  world.nearest(
    goose,
    (other) => {
      if (!world.has(other, 'fox') || !['stalk', 'pounce'].includes(other.state)) {
        return false
      }

      const prey = world.byId(other.targetId)

      return Boolean(prey && world.has(prey, 'bunny') && foxTargetStates.includes(prey.state))
    },
    Math.max(world.unit * 20, 132),
  )

function gooseHawkThreat(goose: EcoEntity, world: EcoWorld, flockSize: number) {
  let best: EcoEntity | null = null
  let bestDistance = world.unit * (flockSize >= 2 ? 24 : 8)

  for (const other of world.entities) {
    if (!world.has(other, 'hawk')) {
      continue
    }

    if (
      flockSize >= 2
        ? ['depart', 'away', 'dead'].includes(other.state)
        : !['dive', 'swoop'].includes(other.state)
    ) {
      continue
    }

    const distance =
      flockSize >= 2
        ? Math.abs(other.x - goose.x)
        : Math.hypot(other.x - goose.x, other.y - goose.y)

    if (distance < bestDistance) {
      best = other
      bestDistance = distance
    }
  }

  return best
}

const goose: EcoSpecies = {
  anchor: 'bottom',
  asset: gooseAsset,
  idle: 'trot',
  init(entity, world) {
    entity.data.hunger = between(0.25, 0.85)
    entity.data.turnAt = world.time + between(1.2, 3)
  },
  layer: 'front',
  size: [2.7, 3.4],
  state: 'waddle',
  strongVs: ['fox', 'hawk', 'plant', 'carrot'],
  tags: ['goose', 'prey', 'burnable'],
  weakTo: ['hawk', 'fire'],
  tick(entity, world, dt) {
    const unit = world.unit
    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 5)
    const flockSize = gooseClusterCount(world, entity)
    const poppedBalloon = world.nearest(
      entity,
      (other) => world.has(other, 'balloon') && other.state === 'popped',
      unit * 10,
    )
    const hawkThreat = gooseHawkThreat(entity, world, flockSize)
    const foxThreat = gooseFoxTarget(entity, world)

    if (fire) {
      startGooseFlap(entity, world, fire.x, 1.3)
    }

    if (poppedBalloon && !fire && !['charge', 'flap'].includes(entity.state)) {
      startGooseFlap(entity, world, poppedBalloon.x, 1.05)
    }

    if (hawkThreat && !fire && entity.state !== 'flap') {
      if (flockSize >= 2) {
        entity.data.honkUntil = world.time + 1.6
        world.setAsset(entity, gooseHonkAsset)
        world.setState(entity, 'honk')
      } else {
        startGooseFlap(entity, world, hawkThreat.x, 1.15)
      }
    }

    if (foxThreat && !fire && entity.state !== 'charge') {
      entity.targetId = foxThreat.id
      world.setAsset(entity, gooseHonkAsset)
      world.setState(entity, 'charge')
    }

    if (entity.state === 'flap') {
      const fromX = entity.data.avoidX ?? entity.x

      world.setAsset(entity, gooseHonkAsset)
      entity.facing = fromX > entity.x ? -1 : 1
      walk(entity, world, dt, unit * 3.1)
      entity.x = clamp(entity.x, unit, world.width - unit)
      entity.lift = Math.abs(Math.sin(entity.t * 13)) * unit * 0.42

      if (world.time > (entity.data.flapUntil ?? 0) && !fire && !hawkThreat && !poppedBalloon) {
        entity.lift = 0
        world.setAsset(entity, gooseAsset)
        world.setState(entity, 'waddle')
      }
      return
    }

    if (entity.state === 'honk') {
      world.setAsset(entity, gooseHonkAsset)
      settle(entity, dt)
      entity.lift = 0

      if (
        entity.t > 0.78 &&
        world.time > (entity.data.honkUntil ?? 0) &&
        !hawkThreat &&
        !foxThreat
      ) {
        world.setAsset(entity, gooseAsset)
        world.setState(entity, 'waddle')
      }
      return
    }

    if (entity.state === 'charge') {
      const fox = world.byId(entity.targetId)

      world.setAsset(entity, gooseHonkAsset)
      entity.lift = Math.abs(Math.sin(entity.t * 11)) * unit * 0.22

      if (!fox || !world.has(fox, 'fox') || entity.t > 3.2) {
        entity.targetId = null
        entity.lift = 0
        world.setAsset(entity, gooseAsset)
        world.setState(entity, 'waddle')
        return
      }

      const gap = walkToward(entity, world, fox.x, unit * 3.7, dt)

      if (gap < unit * 3.2) {
        fox.data.avoidX = entity.x
        entity.data.honkUntil = world.time + 1
        world.setAsset(fox, foxAsset)
        world.setState(fox, 'avoid')
        world.setState(entity, 'honk')
      }
      return
    }

    if (entity.state === 'eat') {
      const plant = world.byId(entity.targetId)

      world.setAsset(entity, gooseAsset)
      settle(entity, dt)

      if (!plant || !isGooseFood(world)(plant)) {
        entity.targetId = null
        world.setState(entity, 'waddle')
        return
      }

      if (entity.t > 1.1) {
        if (!world.has(plant, 'carrot') && Math.random() < 0.68) {
          world.spawn('seed', {
            data: { fall: 0.65, life: 13, rise: 0 },
            vx: world.wind * 0.18,
            vy: -unit * 0.25,
            x: clamp(entity.x + entity.facing * unit * 0.9, unit, world.width - unit),
            y: world.groundY - unit * 0.7,
          })
        }

        world.kill(plant)
        entity.targetId = null
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1
        world.setState(entity, 'waddle')
      }
      return
    }

    if (entity.state === 'seek') {
      const plant = world.byId(entity.targetId)

      world.setAsset(entity, gooseAsset)

      if (!plant || !isGooseFood(world)(plant)) {
        entity.targetId = null
        world.setState(entity, 'waddle')
        return
      }

      entity.lift = Math.abs(Math.sin(entity.t * 7)) * unit * 0.08

      if (walkToward(entity, world, plant.x, unit * 1.35, dt) < unit * 0.75) {
        entity.lift = 0
        world.setState(entity, 'eat')
      }
      return
    }

    world.setAsset(entity, gooseAsset)
    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 7
    entity.lift = 0
    walk(entity, world, dt, unit * 0.72)

    if (world.time > (entity.data.turnAt ?? 0)) {
      entity.facing = entity.facing === 1 ? -1 : 1
      entity.data.turnAt = world.time + between(1.3, 3.5)
    }

    if ((entity.data.hunger ?? 0) > 0.72 && chance(0.85, dt)) {
      const food = world.nearest(entity, isGooseFood(world), Math.max(unit * 28, world.width * 0.5))

      if (food) {
        entity.targetId = food.id
        world.setState(entity, 'seek')
      }
    }
  },
}

const scarecrow: EcoSpecies = {
  anchor: 'bottom',
  asset: scarecrowAsset,
  burnTime: 3.2,
  idle: 'sway',
  init(entity) {
    entity.facing = 1
    entity.data.sway = between(0.6, 1.4)
  },
  layer: 'front',
  size: [3.2, 4],
  state: 'guard',
  style: (entity, world) => ({
    '--dawn-scarecrow-lean': `${(Math.sin(world.time * 0.9 + entity.id) * (entity.data.sway ?? 1.0)).toFixed(2)}deg`,
  }),
  strongVs: ['crow', 'hawk'],
  tags: ['scarecrow', 'fuel'],
  weakTo: ['fire', 'balloon'],
  tick(entity) {
    entity.tilt = Math.sin(entity.age * 0.7 + entity.id) * 1.8
  },
}

const balloon: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('balloon'),
  idle: 'bob',
  init(entity, world) {
    entity.facing = 1
    entity.data.direction = Math.random() < 0.5 ? -1 : 1
    entity.data.speed = between(0.35, 0.7)
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.42)
  },
  layer: 'front',
  size: [3.8, 5],
  state: 'float',
  strongVs: ['scarecrow', 'plant', 'burnable'],
  tags: ['balloon'],
  weakTo: ['hawk', 'crow'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'popped') {
      entity.fx = 'popped'
      entity.vy += unit * 7 * dt
      entity.vx *= 0.99
      entity.tilt += dt * 160 * (entity.data.direction ?? 1)
      integrate(entity, dt)

      if (entity.y >= world.groundY - unit * 0.6) {
        for (const other of world.within(entity.x, world.groundY, unit * 2.6, () => true)) {
          if (world.has(other, 'burnable') && onGround(other, world)) {
            world.kill(other)
          } else if (world.has(other, 'fuel')) {
            other.data.burn = 0.01
          }
        }

        world.spawn('fire', { x: entity.x })
        world.spawn('fire', { x: clamp(entity.x + unit * 1.3, 0, world.width) })
        world.kill(entity)
      }
      return
    }

    const half = world.widthOf(entity) / 2
    entity.x += (entity.data.direction ?? 1) * (entity.data.speed ?? 0.5) * unit * dt
    entity.y += Math.sin(world.time * 0.8 + entity.id) * unit * 0.25 * dt

    if (entity.x > world.width + half) {
      entity.x = -half
    } else if (entity.x < -half) {
      entity.x = world.width + half
    }
  },
}

export const dawnSpecies = {
  balloon,
  bunny,
  carrot,
  crow,
  dandelion,
  feather,
  fox,
  goose,
  hawk,
  scarecrow,
  seed,
}
