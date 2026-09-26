import { ecoAsset, registerViewBoxes } from '../assets'
import {
  between,
  chance,
  clamp,
  faceTravel,
  flee,
  headOf,
  integrate,
  keepInSky,
  settle,
  steer,
  tiltToVelocity,
  walk,
  walkToward,
  wander,
} from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

registerViewBoxes({
  bear: [128, 94],
  'bear-stung': [128, 94],
  beehive: [96, 92],
  'beehive-honey': [96, 92],
  frog: [90, 68],
  mouse: [96, 54],
})

const bearAsset = ecoAsset('bear')
const bearStungAsset = ecoAsset('bear-stung')
const beehiveAsset = ecoAsset('beehive')
const beehiveHoneyAsset = ecoAsset('beehive-honey')

const hiveCapacity = 4

const isBloom = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'plant') && other.state === 'bloom' && (other.data.burn ?? 0) <= 0

const isEdiblePlant = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'plant') && (other.data.burn ?? 0) <= 0

const isHive = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'beehive') && (other.data.burn ?? 0) <= 0

function findFullestHive(
  world: EcoWorld,
  from?: EcoEntity,
  maxDistance = Number.POSITIVE_INFINITY,
) {
  let best: EcoEntity | null = null
  let bestHoney = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (const other of world.entities) {
    if (other.dying || other.removed || !isHive(world)(other)) {
      continue
    }

    const honey = other.data.honey ?? 0
    const distance = from ? Math.hypot(other.x - from.x, other.y - from.y) : 0

    if (
      honey > 0.25 &&
      distance <= maxDistance &&
      (honey > bestHoney + 0.2 || (Math.abs(honey - bestHoney) <= 0.2 && distance < bestDistance))
    ) {
      best = other
      bestHoney = honey
      bestDistance = distance
    }
  }

  return best
}

const isFrogPrey = (world: EcoWorld) => (other: EcoEntity) =>
  (world.has(other, 'bee') || world.has(other, 'butterfly') || world.has(other, 'caterpillar')) &&
  other.state !== 'cocoon'

const isMouseFood = (world: EcoWorld) => (other: EcoEntity) =>
  (isEdiblePlant(world)(other) || other.species === 'seed') && other.state !== 'dead'

function sip(entity: EcoEntity, world: EcoWorld, dt: number, seconds: number) {
  const flower = world.byId(entity.targetId)

  if (!flower) {
    world.setState(entity, 'seek')
    return false
  }

  const head = headOf(flower, world)
  const blend = Math.min(1, dt * 6)

  entity.x += (head.x - entity.x) * blend
  entity.y += (head.y - entity.y) * blend
  entity.vx = 0
  entity.vy = 0

  if (entity.t < seconds) {
    return false
  }

  flower.data.nectar = Math.max(0, (flower.data.nectar ?? 1) - 0.6)

  if ((entity.data.pollen ?? 0) > 0 && entity.data.pollenFrom !== flower.id) {
    flower.data.pollinated = 1
  }

  entity.data.pollen = 1
  entity.data.pollenFrom = flower.id
  entity.data.rest = between(1.2, 3.2)
  entity.targetId = null
  world.setState(entity, 'seek')

  return true
}

function seekFlower(entity: EcoEntity, world: EcoWorld, dt: number, speed: number) {
  entity.data.rest = (entity.data.rest ?? 0) - dt
  let flower = world.byId(entity.targetId)

  if (flower && !isBloom(world)(flower)) {
    flower = null
  }

  if (!flower && (entity.data.rest ?? 0) <= 0) {
    flower = world.nearest(
      entity,
      (other) =>
        isBloom(world)(other) &&
        (other.data.nectar ?? 1) > 0.35 &&
        other.id !== entity.data.pollenFrom,
    )
  }

  entity.targetId = flower?.id ?? null

  if (!flower) {
    return false
  }

  const head = headOf(flower, world)

  if (steer(entity, head.x, head.y, speed, dt, 5) < world.unit * 0.5) {
    world.setState(entity, 'sip')
  }

  return true
}

const bee: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('bee'),
  idle: 'buzz',
  layer: 'front',
  size: [1.4, 1.8],
  state: 'seek',
  tags: ['insect', 'bee'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'swarm') {
      const bear = world.byId(entity.targetId)

      if (!bear || !world.has(bear, 'bear') || entity.t > 6) {
        entity.targetId = null
        world.setState(entity, (entity.data.nectarLoad ?? 0) > 0 ? 'home' : 'seek')
        return
      }

      const head = headOf(bear, world)
      const gap = steer(entity, head.x, head.y, unit * 6.2, dt, 7)
      entity.vy += Math.sin(world.time * 18 + entity.id) * unit * 5 * dt
      integrate(entity, dt)
      faceTravel(entity)
      keepInSky(entity, world, world.skyTop, world.groundY - unit * 0.5)

      if (gap < unit * 1.2) {
        bear.data.stings = (bear.data.stings ?? 0) + dt
        bear.data.threatX = entity.x
        bear.fx = 'stung'

        if (bear.state !== 'flee' && (bear.data.stings ?? 0) > 0.55) {
          world.setState(bear, 'flee')
        }
      }
      return
    }

    if (entity.state === 'sip') {
      if (sip(entity, world, dt, 1.3)) {
        entity.data.nectarLoad = 1

        if (
          world.hasSpecies('beehive') &&
          world.nearest(entity, isHive(world), Math.max(unit * 60, world.width))
        ) {
          world.setState(entity, 'home')
        }
      }
      return
    }

    if (world.hasSpecies('bear')) {
      const bear = world.nearest(
        entity,
        (other) =>
          world.has(other, 'bear') &&
          (other.state === 'scoop' || other.state === 'raid' || other.state === 'flee'),
        unit * 20,
      )

      if (bear) {
        entity.targetId = bear.id
        world.setState(entity, 'swarm')
        return
      }
    }

    if (entity.state === 'home') {
      let hive = world.byId(entity.targetId)

      if (!hive || !isHive(world)(hive)) {
        hive = world.nearest(entity, isHive(world), Math.max(unit * 60, world.width))
      }

      entity.targetId = hive?.id ?? null

      if (!hive || (entity.data.nectarLoad ?? 0) <= 0) {
        world.setState(entity, 'seek')
        return
      }

      const head = headOf(hive, world)

      if (steer(entity, head.x, head.y, unit * 4.9, dt, 5) < unit * 0.8) {
        hive.data.honey = Math.min(hiveCapacity, (hive.data.honey ?? 0) + 1)
        hive.fx = 'honey'
        entity.data.nectarLoad = 0
        entity.data.rest = between(1.2, 2.6)
        entity.targetId = null
        world.setState(entity, 'seek')
      }

      entity.vy += Math.sin(world.time * 11 + entity.id) * unit * 3 * dt
      integrate(entity, dt)
      faceTravel(entity)
      keepInSky(entity, world, world.skyTop, world.groundY - unit * 0.8)
      return
    }

    if (!seekFlower(entity, world, dt, unit * 4.2)) {
      wander(entity, world, dt, unit * 3, world.groundY - unit * 10, world.groundY - unit * 2, 3)
    }

    entity.vy += Math.sin(world.time * 11 + entity.id) * unit * 4 * dt
    integrate(entity, dt)
    faceTravel(entity)
    keepInSky(entity, world, world.skyTop, world.groundY - unit * 0.8)
  },
}

const butterfly: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('butterfly'),
  idle: 'flap',
  layer: 'front',
  size: [2, 2.6],
  state: 'seek',
  tags: ['insect', 'butterfly'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'sip') {
      if (sip(entity, world, dt, 2.2)) {
        entity.data.sips = (entity.data.sips ?? 0) + 1

        if (
          (entity.data.sips ?? 0) >= 2 &&
          world.hasSpecies('caterpillar') &&
          world.canBreed() &&
          world.count((other) => other.species === 'caterpillar') < 8 &&
          Math.random() < 0.55
        ) {
          entity.data.sips = 0
          world.spawn('caterpillar', {
            x: clamp(entity.x + between(-unit, unit), unit, world.width - unit),
          })
        }
      }
      return
    }

    const threat = world.nearest(
      entity,
      (other) =>
        (world.has(other, 'bird') && other.state === 'hunt') ||
        (world.hasSpecies('frog') && world.has(other, 'frog') && other.state !== 'dead'),
      unit * 7,
    )

    if (threat) {
      flee(entity, threat, unit * 4, dt)
      entity.targetId = null
    } else if (!seekFlower(entity, world, dt, unit * 2.4)) {
      wander(entity, world, dt, unit * 2, world.skyTop + unit * 2, world.groundY - unit * 2, 1.5)
    }

    entity.vy += Math.cos(world.time * 3.4 + entity.id) * unit * 3 * dt
    integrate(entity, dt)
    faceTravel(entity)
    keepInSky(entity, world, world.skyTop, world.groundY - unit * 0.8)
  },
}

const caterpillar: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('caterpillar'),
  layer: 'front',
  size: [1.8, 2.2],
  state: 'crawl',
  tags: ['insect', 'caterpillar', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'cocoon') {
      if (entity.t > 9) {
        world.spawn('butterfly', {
          countAs: 'butterfly',
          vy: -unit * 2,
          x: entity.x,
          y: world.groundY - world.heightOf(entity),
        })
        world.remove(entity)
      }
      return
    }

    if (entity.state === 'eat') {
      const plant = world.byId(entity.targetId)
      entity.scale = 1 + Math.sin(entity.t * 9) * 0.05

      if (!plant) {
        entity.scale = 1
        world.setState(entity, 'crawl')
        return
      }

      if (entity.t > 2.6) {
        world.kill(plant)
        entity.scale = 1
        entity.targetId = null
        entity.data.meals = (entity.data.meals ?? 0) + 1

        if ((entity.data.meals ?? 0) >= 2) {
          world.setAsset(entity, ecoAsset('cocoon'))
          entity.size *= 0.7
          world.setState(entity, 'cocoon')
        } else {
          world.setState(entity, 'crawl')
        }
      }
      return
    }

    let plant = world.byId(entity.targetId)

    if (!plant && entity.t > 0.5) {
      plant = world.nearest(entity, isEdiblePlant(world), unit * 30)
      entity.targetId = plant?.id ?? null
      entity.t = 0
    }

    if (plant) {
      if (walkToward(entity, world, plant.x, unit * 0.55, dt) < unit * 0.45) {
        world.setState(entity, 'eat')
      }
    } else {
      walk(entity, world, dt, unit * 0.35)

      if (chance(0.1, dt)) {
        entity.facing = entity.facing === 1 ? -1 : 1
      }
    }
  },
}

const isInsectPrey = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'insect') && other.state !== 'cocoon'

const isBirdPrey = (world: EcoWorld) => (other: EcoEntity) =>
  isInsectPrey(world)(other) || (world.has(other, 'frog') && other.state !== 'dead')

const bird: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('bird'),
  idle: 'flap',
  init(entity) {
    entity.data.hunger = between(0.3, 0.7)
  },
  layer: 'front',
  size: [2, 2.5],
  state: 'fly',
  tags: ['bird'],
  tick(entity, world, dt) {
    const unit = world.unit
    const perchY = world.groundY + (entity.data.depth ?? 0) - world.heightOf(entity) * 0.4

    if (entity.state === 'dazed') {
      entity.fx = 'dazed'
      entity.vx *= 0.96
      entity.vy = unit * 1.3
      entity.tilt = Math.sin(entity.t * 14) * 24
      integrate(entity, dt)
      entity.y = Math.min(entity.y, perchY)

      if (entity.t > 2.6) {
        entity.fx = ''
        entity.tilt = 0
        world.setState(entity, 'fly')
      }
      return
    }

    if (entity.state === 'perch') {
      entity.fx = 'perched'
      entity.vx = 0
      entity.vy = 0
      entity.tilt = 0
      entity.y = perchY
      const stalker = world.nearest(
        entity,
        (other) => world.has(other, 'cat') && other.state === 'stalk',
        unit * 5,
      )

      if (entity.t > (entity.data.perchFor ?? 3) || (stalker && chance(0.35, dt))) {
        entity.fx = ''
        entity.vy = -unit * 4
        world.setState(entity, 'fly')
      }
      return
    }

    if (entity.state === 'land') {
      const gap = steer(entity, entity.data.landX ?? entity.x, perchY, unit * 3.4, dt, 3)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 20)

      if (gap < unit * 0.6) {
        if ((entity.data.lay ?? 0) > 0) {
          world.spawn('egg', { x: entity.x - entity.facing * unit * 0.8 })
          entity.data.lay = 0
          entity.data.meals = 0
        }

        entity.data.perchFor = between(2.5, 5)
        world.setState(entity, 'perch')
      }
      return
    }

    if (entity.state === 'hunt') {
      const prey = world.byId(entity.targetId)

      if (!prey || !isBirdPrey(world)(prey) || entity.t > 8) {
        entity.targetId = null
        world.setState(entity, 'fly')
        return
      }

      const preyY = prey.anchor === 'bottom' ? prey.y - world.heightOf(prey) * 0.4 : prey.y
      const gap = steer(entity, prey.x, preyY, unit * 5.6, dt, 5)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 30)
      keepInSky(entity, world, world.skyTop, perchY)

      if (gap < unit * 0.9) {
        entity.targetId = null

        if (world.has(prey, 'frog') && Math.random() > 0.42) {
          prey.fx = 'startled'
          entity.targetId = null
          world.setState(entity, 'fly')
          return
        }

        if (world.has(prey, 'bee') && Math.random() < 0.35) {
          prey.data.rest = 3
          world.setState(entity, 'dazed')
          return
        }

        world.kill(prey)
        entity.tilt = 0
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1

        if (
          (entity.data.meals ?? 0) >= 3 &&
          world.canBreed() &&
          world.count((other) => other.species === 'egg') < 5
        ) {
          entity.data.lay = 1
          entity.data.landX = clamp(
            entity.x + between(-3, 3) * unit,
            unit * 2,
            world.width - unit * 2,
          )
          world.setState(entity, 'land')
        } else {
          world.setState(entity, 'fly')
        }
      }
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 7
    wander(entity, world, dt, unit * 3, world.skyTop, world.groundY - unit * 6, 1.5)
    integrate(entity, dt)
    faceTravel(entity)
    entity.tilt *= 0.9
    keepInSky(entity, world, world.skyTop, perchY)

    if ((entity.data.hunger ?? 0) > 1 && chance(1.5, dt)) {
      const prey =
        world.nearest(entity, isInsectPrey(world), Math.max(unit * 40, world.height)) ??
        (chance(0.22, dt)
          ? world.nearest(
              entity,
              (other) => world.has(other, 'frog') && other.state !== 'dead',
              Math.max(unit * 28, world.height),
            )
          : null)

      if (prey) {
        entity.targetId = prey.id
        world.setState(entity, 'hunt')
        return
      }
    }

    if (chance(0.045, dt)) {
      entity.data.lay = 0
      entity.data.landX = between(world.width * 0.08, world.width * 0.92)
      world.setState(entity, 'land')
    }
  },
}

const egg: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('egg'),
  countAs: null,
  layer: 'front',
  size: [1.3, 1.5],
  state: 'warm',
  tags: ['burnable'],
  tick(entity, world) {
    if (entity.t > 7) {
      entity.fx = 'wobble'
    }

    if (entity.t > 10) {
      world.spawn('bird', { vy: -world.unit * 3, x: entity.x, y: entity.y - world.unit * 1.4 })
      world.kill(entity)
    }
  },
}

const beehive: EcoSpecies = {
  anchor: 'bottom',
  asset: beehiveAsset,
  burnTime: 3.4,
  init(entity) {
    entity.data.honey = entity.data.honey ?? 0
  },
  layer: 'front',
  rest(entity, world) {
    entity.data.honey = hiveCapacity
    world.setAsset(entity, beehiveHoneyAsset)
    world.setState(entity, 'full')
  },
  size: [3.1, 3.7],
  state: 'idle',
  style: (entity) => ({
    '--hive-honey': `${clamp((entity.data.honey ?? 0) / hiveCapacity, 0, 1).toFixed(2)}`,
  }),
  tags: ['beehive', 'fuel', 'burnable'],
  tick(entity, world) {
    const honey = clamp(entity.data.honey ?? 0, 0, hiveCapacity)

    entity.data.honey = honey
    world.setAsset(entity, honey > hiveCapacity * 0.48 ? beehiveHoneyAsset : beehiveAsset)

    if (entity.state === 'birth' && entity.t > 0.8) {
      entity.fx = ''
      world.setState(entity, honey >= hiveCapacity ? 'full' : 'idle')
      return
    }

    if (honey >= hiveCapacity) {
      if (entity.state !== 'full') {
        world.setState(entity, 'full')
        return
      }

      if (
        entity.t > 1.2 &&
        world.canBreed() &&
        world.count((other) => other.species === 'bee') < 24
      ) {
        world.spawn('bee', {
          vx: between(-0.8, 0.8) * world.unit,
          vy: -world.unit * 1.4,
          x: entity.x,
          y: entity.y - world.heightOf(entity) * 0.72,
        })
        entity.data.honey = hiveCapacity * 0.38
        entity.fx = 'birth'
        world.setState(entity, 'birth')
      }
    } else if (entity.state === 'full') {
      entity.fx = ''
      world.setState(entity, 'idle')
    }
  },
}

const frog: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('frog'),
  init(entity) {
    entity.data.sitFor = between(0.6, 1.8)
  },
  layer: 'front',
  rest(entity, world) {
    entity.lift = 0
    entity.y = world.groundY + (entity.data.depth ?? 0)
    world.setState(entity, 'sit')
  },
  size: [2.2, 2.8],
  state: 'sit',
  style: (entity) => ({
    '--frog-tongue': `${Math.max(18, entity.data.tongueReach ?? 42).toFixed(1)}px`,
  }),
  tags: ['frog', 'predator', 'prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    const raining = Boolean(
      world.nearest(
        entity,
        (other) =>
          world.has(other, 'cloud') &&
          other.state === 'rain' &&
          Math.abs(other.x - entity.x) < world.widthOf(other) * 0.55,
        Math.max(world.height, unit * 45),
      ),
    )
    const cat = world.nearest(
      entity,
      (other) => world.has(other, 'cat') && (other.state === 'stalk' || other.state === 'pounce'),
      unit * 8,
    )
    const birdThreat = world.nearest(
      entity,
      (other) => world.has(other, 'bird') && other.state === 'hunt',
      unit * 10,
    )
    const threat = cat ?? birdThreat

    entity.fx = raining ? 'croak' : ''

    if (threat && entity.state !== 'flee' && entity.state !== 'lash') {
      entity.facing = threat.x > entity.x ? -1 : 1
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      walk(entity, world, dt, unit * (raining ? 3.8 : 2.8))
      entity.lift = Math.abs(Math.sin(entity.t * 11)) * unit * 0.8

      if (entity.t > 1.3 && !threat) {
        entity.lift = 0
        world.setState(entity, 'sit')
      }
      return
    }

    if (entity.state === 'lash') {
      const prey = world.byId(entity.targetId)

      if (prey) {
        entity.facing = prey.x >= entity.x ? 1 : -1
        entity.data.tongueReach = clamp(Math.abs(prey.x - entity.x), unit * 2, unit * 10)
      }

      if (entity.t > 0.16 && (entity.data.ate ?? 0) <= 0) {
        entity.data.ate = 1

        if (prey && isFrogPrey(world)(prey)) {
          world.kill(prey)
        }
      }

      if (entity.t > 0.42) {
        entity.targetId = null
        entity.data.ate = 0
        world.setState(entity, 'sit')
      }
      return
    }

    const mouth = {
      x: entity.x + entity.facing * unit * 1.2,
      y: entity.y - world.heightOf(entity) * 0.55,
    }
    const nearbyPrey = world.nearest(mouth, isFrogPrey(world), unit * 11.5)

    if (nearbyPrey) {
      entity.targetId = nearbyPrey.id
      entity.facing = nearbyPrey.x >= entity.x ? 1 : -1
      entity.data.tongueReach = clamp(Math.abs(nearbyPrey.x - entity.x), unit * 2, unit * 10)
      world.setState(entity, 'lash')
      return
    }

    if (entity.state === 'hop') {
      const duration = raining ? 0.42 : 0.62
      const progress = Math.min(1, entity.t / duration)
      const startX = entity.data.startX ?? entity.x
      const endX = entity.data.endX ?? entity.x

      entity.x = startX + (endX - startX) * progress
      entity.y = world.groundY + (entity.data.depth ?? 0)
      entity.lift = Math.sin(Math.PI * progress) * unit * (raining ? 1.6 : 1)

      if (progress >= 1) {
        entity.lift = 0
        entity.data.sitFor = raining ? between(0.15, 0.45) : between(0.7, 1.9)
        world.setState(entity, 'sit')
      }
      return
    }

    settle(entity, dt)

    if (entity.t > (entity.data.sitFor ?? 1) || (raining && chance(1.7, dt))) {
      const prey = world.nearest(entity, isFrogPrey(world), unit * 38)
      const goalX = prey
        ? clamp(
            entity.x + clamp(prey.x - entity.x, -unit * 6.4, unit * 6.4),
            unit,
            world.width - unit,
          )
        : clamp(entity.x + between(-5, 5) * unit, unit, world.width - unit)

      entity.data.startX = entity.x
      entity.data.endX = goalX
      entity.facing = goalX >= entity.x ? 1 : -1
      world.setState(entity, 'hop')
    }
  },
}

const mouse: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('mouse'),
  init(entity, world) {
    entity.data.hunger = between(0.2, 0.9)
    entity.data.nextBaby = world.time + between(18, 30)

    if ((entity.data.baby ?? 0) > 0) {
      entity.scale = 0.62
    }
  },
  layer: 'front',
  rest(entity, world) {
    entity.lift = 0
    entity.y = world.groundY + (entity.data.depth ?? 0)
    world.setState(entity, 'scurry')
  },
  size: [1.55, 1.95],
  state: 'scurry',
  tags: ['mouse', 'prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    const cat = world.nearest(
      entity,
      (other) =>
        world.has(other, 'cat') &&
        (other.state === 'stalk' || other.state === 'pounce' || other.state === 'prowl'),
      unit * 10,
    )

    entity.scale = Math.min(1, entity.scale + dt * 0.04)

    if (cat && entity.state !== 'hide' && entity.state !== 'flee') {
      const cover = world.nearest(entity, isEdiblePlant(world), unit * 4.5)

      if (cover) {
        entity.targetId = cover.id
        world.setState(entity, 'hide')
      } else {
        entity.facing = cat.x > entity.x ? -1 : 1
        world.setState(entity, 'flee')
      }
    }

    if (entity.state === 'hide') {
      const cover = world.byId(entity.targetId)

      if (!cover) {
        world.setState(entity, 'flee')
        return
      }

      entity.fx = 'hidden'
      entity.x += (cover.x + entity.facing * unit * 0.18 - entity.x) * Math.min(1, dt * 10)
      entity.y = world.groundY + (entity.data.depth ?? 0)
      entity.vx = 0

      if (!cat && entity.t > 1.1) {
        entity.fx = ''
        entity.targetId = null
        world.setState(entity, 'scurry')
      }
      return
    }

    if (entity.state === 'flee') {
      entity.fx = ''
      walk(entity, world, dt, unit * 3.5)
      entity.lift = Math.abs(Math.sin(entity.t * 13)) * unit * 0.35

      if (entity.t > 1.3 && !cat) {
        entity.lift = 0
        world.setState(entity, 'scurry')
      }
      return
    }

    if (entity.state === 'nibble') {
      const food = world.byId(entity.targetId)

      if (!food || !isMouseFood(world)(food)) {
        entity.targetId = null
        world.setState(entity, 'scurry')
        return
      }

      entity.facing = food.x >= entity.x ? 1 : -1
      entity.scale = 1 + Math.sin(entity.t * 12) * 0.04

      if (entity.t > 1.8) {
        world.kill(food)
        entity.scale = 1
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1
        entity.targetId = null

        if (
          (entity.data.meals ?? 0) >= 2 &&
          world.time > (entity.data.nextBaby ?? 0) &&
          world.canBreed() &&
          world.count((other) => other.species === 'mouse') < 14
        ) {
          entity.data.meals = 0
          entity.data.nextBaby = world.time + between(24, 38)
          world.spawn('mouse', {
            data: { baby: 1 },
            x: clamp(entity.x + between(-1.4, 1.4) * unit, unit, world.width - unit),
          })
        }

        world.setState(entity, 'scurry')
      }
      return
    }

    if (entity.state === 'seek') {
      const food = world.byId(entity.targetId)

      if (!food || !isMouseFood(world)(food)) {
        entity.targetId = null
        world.setState(entity, 'scurry')
        return
      }

      entity.lift = Math.abs(Math.sin(entity.t * 10)) * unit * 0.25

      if (walkToward(entity, world, food.x, unit * 1.9, dt) < unit * 0.5) {
        entity.lift = 0
        world.setState(entity, 'nibble')
      }
      return
    }

    entity.fx = ''
    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 7
    walk(entity, world, dt, unit * 1.8)
    entity.lift = Math.abs(Math.sin(world.time * 12 + entity.id)) * unit * 0.18

    if (chance(0.32, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    if ((entity.data.hunger ?? 0) > 0.8) {
      const food = world.nearest(entity, isMouseFood(world), unit * 24)

      if (food) {
        entity.targetId = food.id
        world.setState(entity, 'seek')
      }
    }
  },
}

const bear: EcoSpecies = {
  anchor: 'bottom',
  asset: bearAsset,
  burnTime: 3,
  init(entity) {
    entity.data.sniff = between(1, 3)
  },
  layer: 'front',
  rest(entity, world) {
    world.setAsset(entity, bearAsset)
    entity.y = world.groundY + (entity.data.depth ?? 0)
    world.setState(entity, 'wander')
  },
  size: [3.8, 4.7],
  state: 'wander',
  tags: ['bear', 'predator', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'flee') {
      world.setAsset(entity, bearStungAsset)
      entity.fx = 'stung'
      entity.facing = (entity.data.threatX ?? entity.x + 1) > entity.x ? -1 : 1
      walk(entity, world, dt, unit * 3.8)
      entity.lift = Math.abs(Math.sin(entity.t * 10)) * unit * 0.28

      if (entity.t > 3.2) {
        entity.fx = ''
        entity.lift = 0
        entity.data.stings = 0
        world.setAsset(entity, bearAsset)
        world.setState(entity, 'wander')
      }
      return
    }

    if (entity.state === 'raid') {
      const hive = world.byId(entity.targetId)

      if (!hive || !isHive(world)(hive)) {
        entity.targetId = null
        world.setState(entity, 'wander')
        return
      }

      if (
        walkToward(
          entity,
          world,
          hive.x - Math.sign(hive.x - entity.x || 1) * unit * 0.7,
          unit * 1.55,
          dt,
        ) <
        unit * 1.1
      ) {
        entity.facing = hive.x >= entity.x ? 1 : -1
        world.setState(entity, 'scoop')
      }

      if (entity.t > 12) {
        entity.targetId = null
        world.setState(entity, 'wander')
      }
      return
    }

    if (entity.state === 'scoop') {
      const hive = world.byId(entity.targetId)

      if (!hive || !isHive(world)(hive)) {
        entity.targetId = null
        world.setState(entity, 'wander')
        return
      }

      entity.facing = hive.x >= entity.x ? 1 : -1
      entity.lift = Math.sin(entity.t * 6) * unit * 0.12
      hive.fx = 'honey'
      hive.data.honey = Math.max(0, (hive.data.honey ?? 0) - dt * 0.55)

      if ((entity.data.stings ?? 0) > 0.5 || entity.t > 7) {
        entity.data.threatX = hive.x
        world.setState(entity, 'flee')
        return
      }

      if (entity.t > 4.8 && world.count((other) => other.species === 'bee') < 1) {
        world.kill(hive)
        entity.targetId = null
        entity.data.threatX = hive.x
        world.setState(entity, 'flee')
      }
      return
    }

    world.setAsset(entity, bearAsset)
    entity.fx = ''
    walk(entity, world, dt, unit * 0.85)

    if (chance(0.07, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    if (entity.t > (entity.data.sniff ?? 2)) {
      const hive = findFullestHive(world, entity, Math.max(unit * 70, world.width))

      entity.data.sniff = between(1.4, 3)

      if (hive) {
        entity.targetId = hive.id
        world.setState(entity, 'raid')
      } else {
        entity.t = 0
      }
    }
  },
}

const isLowBird = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'bird') && other.y > world.groundY - world.unit * 6

const isCatMouse = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'mouse') && other.state !== 'hide'

const isCatFrog = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'frog') && other.state !== 'dead'

const isCatPrey = (world: EcoWorld) => (other: EcoEntity) =>
  isCatMouse(world)(other) || isCatFrog(world)(other) || isLowBird(world)(other)

const cat: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('cat'),
  layer: 'front',
  size: [3, 3.6],
  state: 'prowl',
  tags: ['cat', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    const bearThreat = world.hasSpecies('bear')
      ? world.nearest(
          entity,
          (other) => world.has(other, 'bear') && other.state !== 'flee',
          unit * 12,
        )
      : null

    if (bearThreat && entity.state !== 'flee-bear') {
      entity.targetId = null
      entity.data.bearX = bearThreat.x
      world.setAsset(entity, ecoAsset('cat'))
      world.setState(entity, 'flee-bear')
    }

    if (entity.state === 'flee-bear') {
      entity.fx = 'puffed'
      entity.facing = (entity.data.bearX ?? entity.x + 1) > entity.x ? -1 : 1
      walk(entity, world, dt, unit * 3.6)
      entity.lift = Math.abs(Math.sin(entity.t * 14)) * unit * 0.32

      if (entity.t > 2.4 && !bearThreat) {
        entity.fx = ''
        entity.lift = 0
        world.setState(entity, 'prowl')
      }
      return
    }

    if (entity.state === 'nap') {
      world.setAsset(entity, ecoAsset('cat-sleep'))
      const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 5)

      if (entity.t > 12 || fire) {
        entity.data.meals = 0
        world.setAsset(entity, ecoAsset('cat'))
        world.setState(entity, 'prowl')
      }
      return
    }

    if (entity.state === 'eat') {
      if (entity.t > 1.4) {
        world.setState(entity, (entity.data.meals ?? 0) >= 2 ? 'nap' : 'prowl')
      }
      return
    }

    if (entity.state === 'pounce') {
      const progress = Math.min(1, entity.t / 0.55)
      const startX = entity.data.startX ?? entity.x
      const endX = entity.data.endX ?? entity.x

      entity.x = startX + (endX - startX) * progress
      entity.lift = Math.sin(Math.PI * progress) * (entity.data.jump ?? unit * 2)

      if (progress > 0.3 && !(entity.data.caught ?? 0)) {
        const target = world.byId(entity.targetId)
        const prey =
          target && isCatPrey(world)(target)
            ? target
            : world.nearest(
                { x: entity.x, y: entity.y - entity.lift - world.heightOf(entity) * 0.5 },
                isCatPrey(world),
                unit * 1.8,
              )

        if (prey) {
          const preyY = prey.anchor === 'bottom' ? prey.y - world.heightOf(prey) * 0.35 : prey.y
          const close = Math.hypot(entity.x - prey.x, entity.y - entity.lift - preyY) < unit * 2.1
          const slipperyFrog = world.has(prey, 'frog') && Math.random() > 0.52

          if (close && !slipperyFrog) {
            world.kill(prey)
            entity.data.caught = 1
            entity.data.meals = (entity.data.meals ?? 0) + 1
          }
        }
      }

      if (progress >= 1) {
        entity.lift = 0
        entity.targetId = null
        world.setAsset(entity, ecoAsset('cat'))
        world.setState(entity, entity.data.caught ? 'eat' : 'prowl')
      }
      return
    }

    if (entity.state === 'stalk') {
      world.setAsset(entity, ecoAsset('cat-crouch'))
      const prey = world.byId(entity.targetId)

      if (!prey || !isCatPrey(world)(prey)) {
        entity.data.lost = (entity.data.lost ?? 0) + dt

        if ((entity.data.lost ?? 0) > 1.2) {
          entity.targetId = null
          world.setAsset(entity, ecoAsset('cat'))
          world.setState(entity, 'prowl')
        }
        return
      }

      entity.data.lost = 0
      const gap = walkToward(entity, world, prey.x, unit * 0.6, dt)

      const pounceGap = world.has(prey, 'bird') ? unit * 4.5 : unit * 3.1

      if (gap < pounceGap) {
        entity.data.startX = entity.x
        entity.data.endX = clamp(prey.x + prey.vx * 0.4, unit, world.width - unit)
        entity.data.jump = world.has(prey, 'bird')
          ? clamp(world.groundY - prey.y, unit * 1.2, unit * 6)
          : unit * 1.3
        entity.data.caught = 0
        world.setAsset(entity, ecoAsset('cat'))
        world.setState(entity, 'pounce')
      }
      return
    }

    entity.fx = ''
    walk(entity, world, dt, unit * 1.1)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 4)

    if (fire) {
      entity.facing = fire.x > entity.x ? -1 : 1
    }

    if (entity.t > 0.6) {
      const prey =
        world.nearest(entity, isCatMouse(world), unit * 24) ??
        world.nearest(entity, isCatFrog(world), unit * 15) ??
        world.nearest(entity, isLowBird(world), unit * 18)

      if (prey) {
        entity.targetId = prey.id
        entity.data.lost = 0
        world.setState(entity, 'stalk')
      }
    }
  },
}

export const meadowSpecies = {
  bear,
  bee,
  beehive,
  bird,
  butterfly,
  cat,
  caterpillar,
  egg,
  frog,
  mouse,
}
