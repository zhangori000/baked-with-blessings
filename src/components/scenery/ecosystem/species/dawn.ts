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
  'crow-mob': [108, 82],
  'crow-peck': [94, 66],
  fox: [132, 72],
  'fox-crouch': [132, 60],
  'fox-pounce': [142, 78],
  hedgehog: [96, 58],
  'hedgehog-ball': [76, 70],
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
const hedgehogAsset = ecoAsset('hedgehog')
const hedgehogBallAsset = ecoAsset('hedgehog-ball')
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
  tags: ['plant', 'fuel'],
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

    const snuffler = world.nearest(
      { x: entity.x, y: world.groundY },
      (other) => world.has(other, 'hedgehog') && other.state !== 'curl',
      unit * 7,
    )

    if (snuffler) {
      snuffler.fx = 'snuffle'
      world.setState(snuffler, 'eat')
      world.remove(entity)
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
  tags: ['plant', 'carrot', 'fuel'],
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
  tags: ['bunny', 'prey', 'burnable'],
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
      (other) => world.has(other, 'hawk') && other.state === 'dive',
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

function crowMobCount(world: EcoWorld, hawk: EcoEntity) {
  const radius = Math.max(world.unit * 16, 132)

  return world.count(
    (other) =>
      other.species === 'crow' &&
      Math.hypot(other.x - hawk.x, other.y - hawk.y) < radius &&
      (other.targetId === hawk.id || other.state === 'mob'),
  )
}

function crowReadyMobCount(world: EcoWorld, hawk: EcoEntity) {
  const radius = Math.max(world.unit * 15, 124)

  return world.count(
    (other) =>
      other.species === 'crow' &&
      other.state === 'mob' &&
      other.targetId === hawk.id &&
      (other.data.mobReadyAt ?? Number.POSITIVE_INFINITY) <= world.time &&
      Math.hypot(other.x - hawk.x, other.y - hawk.y) < radius,
  )
}

function startHawkFlee(hawk: EcoEntity, world: EcoWorld, fromX: number) {
  hawk.targetId = null
  hawk.data.fleeDir = hawk.x >= fromX ? 1 : -1
  hawk.data.zBoost = 0
  hawk.fx = 'hurt'
  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'flee')
}

function peckHawk(crow: EcoEntity, hawk: EcoEntity, world: EcoWorld) {
  const mobbers = crowReadyMobCount(world, hawk)

  crow.fx = 'peck'
  crow.data.fxUntil = world.time + 0.22
  crow.data.peckAt = world.time + between(1.6, 2.45)
  hawk.fx = 'hurt'
  hawk.data.harriedUntil = world.time + (mobbers >= 2 ? 1.2 : 0.55)

  if (mobbers < 2) {
    if ((hawk.state === 'dive' || hawk.state === 'swoop') && Math.random() < 0.35) {
      hawk.targetId = null
      world.setAsset(hawk, hawkSoar)
      world.setState(hawk, 'climb')
    }

    return
  }

  if (Math.random() < (mobbers >= 4 ? 1 : mobbers >= 3 ? 0.9 : 0.65)) {
    hawk.data.crowHits = (hawk.data.crowHits ?? 0) + 1
  }

  hawk.data.crowHitDecayAt = world.time + between(3.2, 5.2)

  if (hawk.state === 'carry' && hawk.t > 1.55 && Math.random() < 0.78) {
    hawk.targetId = null
    world.setAsset(hawk, hawkSoar)
    world.setState(hawk, 'climb')
  }

  if ((hawk.data.crowHits ?? 0) >= 3) {
    startHawkFlee(hawk, world, crow.x)
  }
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
    entity.y = entity.data.centerY
  },
  layer: 'front',
  size: [3.6, 4.4],
  state: 'soar',
  tags: ['hawk', 'predator'],
  tick(entity, world, dt) {
    const unit = world.unit
    const guard = scarecrowAirGuard(world, entity)

    if (entity.fx === 'hurt' && (entity.data.harriedUntil ?? 0) < world.time) {
      entity.fx = ''
    }

    if ((entity.data.crowHits ?? 0) > 0) {
      const readyMobbers = crowReadyMobCount(world, entity)

      if (readyMobbers >= 2) {
        entity.data.crowHitDecayAt = world.time + 4
      } else if ((entity.data.crowHitDecayAt ?? 0) < world.time) {
        entity.data.crowHits = Math.max(0, (entity.data.crowHits ?? 0) - 1)
        entity.data.crowHitDecayAt = world.time + 1.8
      }
    }

    if (entity.state === 'flee') {
      const direction = entity.data.fleeDir ?? (entity.x < world.width / 2 ? -1 : 1)

      entity.vx += (direction * unit * 7 - entity.vx) * Math.min(1, dt * 2.2)
      entity.vy += (-unit * 7.5 - entity.vy) * Math.min(1, dt * 2.8)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 28)

      if (
        entity.y < world.skyTop - unit * 4 ||
        entity.x < -unit * 5 ||
        entity.x > world.width + unit * 5 ||
        entity.t > 4.5
      ) {
        world.kill(entity)
      }
      return
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

    if (entity.state === 'dive' || entity.state === 'swoop') {
      world.setAsset(entity, entity.state === 'dive' ? hawkDive : hawkSoar)
      const prey = world.byId(entity.targetId)
      const preyY = prey
        ? prey.anchor === 'bottom'
          ? prey.y - world.heightOf(prey) * 0.4 - prey.lift
          : prey.y
        : entity.y
      const committed = prey ? Math.hypot(prey.x - entity.x, preyY - entity.y) < unit * 7 : false

      if (
        guard ||
        !prey ||
        prey.state === 'carried' ||
        prey.state === 'drop' ||
        (world.has(prey, 'bunny') && bunnySafeFromHawk(world, prey)) ||
        (prey.species === 'crow' && crowReadyMobCount(world, entity) >= 2) ||
        ((entity.data.harriedUntil ?? 0) > world.time && !committed) ||
        entity.t > 6
      ) {
        entity.targetId = null
        world.setState(entity, 'climb')
        return
      }

      const gap = steer(entity, prey.x, preyY, unit * (entity.state === 'dive' ? 9 : 6.5), dt, 4)
      integrate(entity, dt)
      faceTravel(entity)
      entity.tilt = entity.state === 'dive' ? 0 : entity.tilt * 0.9

      if (gap < unit * 1.3) {
        entity.targetId = null

        if (world.has(prey, 'balloon')) {
          world.setState(prey, 'popped')
        } else if (prey.species === 'crow') {
          world.kill(prey)
          entity.data.hunger = 0
        } else if (!(prey.state === 'flee' && Math.random() < 0.3)) {
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
          return
        }

        world.setState(entity, 'climb')
      }
      return
    }

    if (entity.state === 'climb') {
      world.setAsset(entity, hawkSoar)
      entity.vy += (-unit * 4.5 - entity.vy) * Math.min(1, dt * 3)
      entity.vx *= 0.98
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 25)
      keepInSky(entity, world)

      if (entity.t > 1.6 || entity.y <= world.skyTop + unit) {
        entity.tilt = 0
        entity.data.centerX = entity.x
        entity.data.centerY = clamp(entity.y, world.skyTop + unit, world.height * 0.32)
        world.setState(entity, 'soar')
      }
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 9
    entity.data.angle = (entity.data.angle ?? 0) + dt * 0.55
    entity.data.centerX =
      (entity.data.centerX ?? entity.x) + Math.sin(world.time * 0.13 + entity.id) * unit * 0.8 * dt
    entity.data.centerX = clamp(entity.data.centerX, unit * 6, world.width - unit * 6)
    const radius = (entity.data.radius ?? 5) * unit
    const angle = entity.data.angle ?? 0
    const goalX = (entity.data.centerX ?? entity.x) + Math.cos(angle) * radius
    const goalY = (entity.data.centerY ?? entity.y) + Math.sin(angle) * radius * 0.3

    steer(entity, goalX, goalY, unit * 4, dt, 3)

    if (guard) {
      const away = entity.x >= guard.x ? 1 : -1
      steer(
        entity,
        clamp(entity.x + away * unit * 8, unit * 2, world.width - unit * 2),
        clamp(entity.y - unit * 2.4, world.skyTop + unit, world.skyBottom),
        unit * 6.5,
        dt,
        5,
      )
      entity.fx = 'veer'
    } else if (entity.fx === 'veer') {
      entity.fx = ''
    }

    integrate(entity, dt)
    faceTravel(entity)
    entity.tilt = (entity.vy * 0.15) / unit
    keepInSky(entity, world)

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

    if (
      (entity.data.hunger ?? 0) > 1.18 &&
      crowReadyMobCount(world, entity) < 2 &&
      chance(0.22, dt)
    ) {
      const stragglerCrow = world.nearest(
        entity,
        (other) =>
          other.species === 'crow' &&
          !['flee', 'dead'].includes(other.state) &&
          (other.state !== 'mob' ||
            crowMobCount(world, entity) < 2 ||
            (other.data.mobReadyAt ?? Number.POSITIVE_INFINITY) > world.time) &&
          !world.nearest(
            other,
            (flockmate) =>
              flockmate.species === 'crow' &&
              flockmate.id !== other.id &&
              flockmate.state === 'mob' &&
              flockmate.targetId === entity.id &&
              (flockmate.data.mobReadyAt ?? Number.POSITIVE_INFINITY) <= world.time,
            unit * 10,
          ),
        Math.max(unit * 34, world.height * 0.7),
      )

      if (stragglerCrow) {
        entity.targetId = stragglerCrow.id
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
        entity.targetId = prey.id
        world.setState(entity, 'dive')
        return
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
  tags: ['prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.fx === 'peck' && (entity.data.fxUntil ?? 0) < world.time) {
      entity.fx = ''
    }

    const scarecrow = scarecrowNear(world, entity, Math.max(unit * 10, 92))
    const foxThreat = world.nearest(
      entity,
      (other) => world.has(other, 'fox') && ['stalk', 'pounce'].includes(other.state),
      entity.state === 'peck' ? unit * 9 : unit * 4,
    )

    if ((scarecrow || foxThreat) && entity.state !== 'flee') {
      entity.targetId = null
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
      faceTravel(entity)
      tiltToVelocity(entity, 28)
      keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

      if (entity.t > 1.5 && !scarecrow && !foxThreat) {
        entity.data.goalAt = 0
        entity.lift = 0
        world.setState(entity, 'fly')
      }
      return
    }

    const hawkTarget = world.byId(entity.targetId)
    const hawk =
      hawkTarget?.species === 'hawk' && hawkTarget.state !== 'flee' && hawkTarget.state !== 'dead'
        ? hawkTarget
        : world.nearest(
            entity,
            (other) =>
              world.has(other, 'hawk') &&
              !['flee', 'dead'].includes(other.state) &&
              (['dive', 'swoop', 'carry'].includes(other.state) ||
                Math.hypot(other.x - entity.x, other.y - entity.y) < unit * 15),
            Math.max(unit * 25, world.height * 0.65),
          )

    if (hawk && entity.state !== 'mob' && (entity.data.scatterUntil ?? 0) < world.time) {
      entity.targetId = hawk.id
      entity.data.mobReadyAt = world.time + between(1, 1.8)
      entity.data.peckAt = world.time + between(1.6, 2.5)
      world.setAsset(entity, crowMobAsset)
      world.setState(entity, 'mob')
    }

    if (entity.state === 'mob') {
      const target = world.byId(entity.targetId)

      if (!target || target.species !== 'hawk' || ['flee', 'dead'].includes(target.state)) {
        entity.targetId = null
        world.setAsset(entity, crowAsset)
        world.setState(entity, 'fly')
        return
      }

      const readyMobbers = crowReadyMobCount(world, target)
      const angle = world.time * 5.4 + entity.id * 1.7
      const goalX =
        target.x -
        target.facing * unit * (readyMobbers >= 2 ? 1.1 : 1.9) +
        Math.sin(angle) * unit * 1.7
      const goalY = target.y + Math.cos(angle) * unit * 1.25
      const gap = steer(entity, goalX, goalY, unit * (readyMobbers >= 2 ? 8.2 : 6.1), dt, 5.4)

      world.setAsset(entity, crowMobAsset)
      integrate(entity, dt)
      faceTravel(entity)
      entity.tilt = Math.sin(world.time * 13 + entity.id) * (readyMobbers >= 2 ? 16 : 9)
      keepInSky(entity, world, world.skyTop + unit * 0.8, world.skyBottom)

      if (
        (entity.data.mobReadyAt ?? Number.POSITIVE_INFINITY) <= world.time &&
        gap < unit * 2.25 &&
        (entity.data.peckAt ?? 0) < world.time
      ) {
        peckHawk(entity, target, world)
      }

      if (
        (readyMobbers < 2 &&
          !['dive', 'swoop', 'carry'].includes(target.state) &&
          entity.t > 2.2) ||
        (entity.t > 1.8 && chance(readyMobbers >= 2 ? 0.28 : 0.5, dt))
      ) {
        entity.targetId = null
        entity.data.mobReadyAt = 0
        entity.data.scatterUntil = world.time + between(1.2, 2.4)
        world.setAsset(entity, crowAsset)
        world.setState(entity, 'fly')
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
      entity.facing = dx >= 0 ? 1 : -1
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
    faceTravel(entity)
    entity.tilt = Math.sin(world.time * 2.3 + entity.id) * 6 + (entity.vy * 0.08) / unit
    keepInSky(entity, world, world.skyTop + unit, world.skyBottom)

    if ((entity.data.hunger ?? 0) > 0.85 && chance(0.38, dt)) {
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
  tags: ['fox', 'predator', 'burnable'],
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
        const hedgehogTarget = world.nearest(
          entity,
          (other) => world.has(other, 'hedgehog') && other.state === 'curl',
          unit * 2,
        )

        if (hedgehogTarget) {
          entity.data.resolved = 1
          entity.data.hurtX = hedgehogTarget.x
          entity.lift = 0
          world.setState(entity, 'yelp')
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

        if (crowTarget && Math.abs(crowTarget.x - entity.x) < unit * 3.4) {
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

          if (bunnyTarget.state === 'flee' && Math.random() < 0.52) {
            entity.fx = 'miss'
          } else {
            world.kill(bunnyTarget)
            entity.fx = ''
            entity.data.caught = 1
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

    if (entity.state === 'chase') {
      world.setAsset(entity, foxAsset)
      const target = world.byId(entity.targetId)

      if (!target || !world.has(target, 'hedgehog') || entity.t > 5) {
        entity.targetId = null
        world.setState(entity, 'trot')
        return
      }

      if (target.state === 'curl' && Math.abs(target.x - entity.x) < unit * 3) {
        entity.data.hurtX = target.x
        entity.targetId = null
        world.setState(entity, 'yelp')
        return
      }

      const gap = walkToward(entity, world, target.x, unit * 3.2, dt)

      if (gap < unit * 1.5) {
        world.setState(target, 'curl')
        world.setAsset(target, hedgehogBallAsset)
        entity.data.hurtX = target.x
        entity.targetId = null
        world.setState(entity, 'yelp')
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

    if (chance(0.72, dt)) {
      const hedgehogTarget = world.nearest(
        entity,
        (other) => world.has(other, 'hedgehog') && other.state !== 'curl',
        Math.max(unit * 28, world.width * 0.75),
      )

      if (hedgehogTarget) {
        entity.targetId = hedgehogTarget.id
        world.setState(entity, 'chase')
      }
    }
  },
}

const hedgehog: EcoSpecies = {
  anchor: 'bottom',
  asset: hedgehogAsset,
  idle: 'trot',
  init(entity) {
    entity.data.sniffAt = between(1.5, 3.5)
  },
  layer: 'front',
  size: [2.2, 2.8],
  state: 'waddle',
  tags: ['hedgehog', 'prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    const threat = world.nearest(
      entity,
      (other) =>
        (world.has(other, 'fox') && ['stalk', 'pounce', 'chase'].includes(other.state)) ||
        (world.has(other, 'hawk') && ['dive', 'swoop'].includes(other.state)),
      unit * 7,
    )
    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 4)

    if (threat && entity.state !== 'curl') {
      entity.targetId = null
      entity.vx = 0
      entity.vy = 0
      entity.lift = 0
      world.setAsset(entity, hedgehogBallAsset)
      world.setState(entity, 'curl')
    }

    if (entity.state === 'curl') {
      world.setAsset(entity, hedgehogBallAsset)
      entity.lift = 0
      entity.tilt = Math.sin(entity.t * 4) * 3

      if (!threat && entity.t > 1.3) {
        entity.tilt = 0
        world.setAsset(entity, hedgehogAsset)
        world.setState(entity, 'waddle')
      }
      return
    }

    world.setAsset(entity, hedgehogAsset)

    if (fire) {
      entity.facing = fire.x > entity.x ? -1 : 1
      walk(entity, world, dt, unit * 1.8)
      return
    }

    if (entity.state === 'eat') {
      settle(entity, dt)
      entity.fx = 'snuffle'

      if (entity.t > 0.8) {
        entity.fx = ''
        world.setState(entity, 'waddle')
      }
      return
    }

    let seedTarget = world.byId(entity.targetId)

    if (
      seedTarget &&
      !(seedTarget.species === 'seed' && seedTarget.y > world.groundY - unit * 6.5)
    ) {
      seedTarget = null
      entity.targetId = null
    }

    if (!seedTarget && entity.t > 0.4) {
      seedTarget = world.nearest(
        entity,
        (other) => other.species === 'seed' && other.y > world.groundY - unit * 4.5,
        unit * 14,
      )
      entity.targetId = seedTarget?.id ?? null
    }

    if (seedTarget) {
      if (walkToward(entity, world, seedTarget.x, unit * 1.15, dt) < unit * 0.85) {
        world.remove(seedTarget)
        entity.data.meals = (entity.data.meals ?? 0) + 1
        entity.targetId = null
        world.setState(entity, 'eat')
      }
      return
    }

    walk(entity, world, dt, unit * 0.62)

    if (chance(0.16, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    if (entity.t > (entity.data.sniffAt ?? 2.5)) {
      entity.fx = 'snuffle'
      entity.data.sniffAt = between(2, 5)
      entity.t = 0
    } else if (entity.fx === 'snuffle' && entity.t > 0.5) {
      entity.fx = ''
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
  tags: ['scarecrow', 'fuel'],
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
  tags: ['balloon'],
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
  fox,
  hawk,
  hedgehog,
  scarecrow,
  seed,
}
