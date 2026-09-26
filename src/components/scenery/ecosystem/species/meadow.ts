import { ecoAsset } from '../assets'
import {
  between,
  chance,
  clamp,
  faceTravel,
  flee,
  headOf,
  integrate,
  keepInSky,
  steer,
  tiltToVelocity,
  walk,
  walkToward,
  wander,
} from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

const isBloom = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'plant') && other.state === 'bloom' && (other.data.burn ?? 0) <= 0

const isEdiblePlant = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'plant') && (other.data.burn ?? 0) <= 0

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

    if (entity.state === 'sip') {
      sip(entity, world, dt, 1.3)
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
      (other) => world.has(other, 'bird') && other.state === 'hunt',
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

      if (!prey || !isInsectPrey(world)(prey) || entity.t > 8) {
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
      const prey = world.nearest(entity, isInsectPrey(world), unit * 40)

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

const isLowBird = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'bird') && other.y > world.groundY - world.unit * 6

const cat: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('cat'),
  layer: 'front',
  size: [3, 3.6],
  state: 'prowl',
  tags: ['cat', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit

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
        const prey = world.nearest(
          { x: entity.x, y: entity.y - entity.lift - world.heightOf(entity) * 0.5 },
          (other) => world.has(other, 'bird'),
          unit * 1.7,
        )

        if (prey) {
          world.kill(prey)
          entity.data.caught = 1
          entity.data.meals = (entity.data.meals ?? 0) + 1
        }
      }

      if (progress >= 1) {
        entity.lift = 0
        world.setAsset(entity, ecoAsset('cat'))
        world.setState(entity, entity.data.caught ? 'eat' : 'prowl')
      }
      return
    }

    if (entity.state === 'stalk') {
      world.setAsset(entity, ecoAsset('cat-crouch'))
      const prey = world.byId(entity.targetId)

      if (!prey || !isLowBird(world)(prey)) {
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

      if (gap < unit * 4.5) {
        entity.data.startX = entity.x
        entity.data.endX = clamp(prey.x + prey.vx * 0.4, unit, world.width - unit)
        entity.data.jump = clamp(world.groundY - prey.y, unit * 1.2, unit * 6)
        entity.data.caught = 0
        world.setAsset(entity, ecoAsset('cat'))
        world.setState(entity, 'pounce')
      }
      return
    }

    walk(entity, world, dt, unit * 1.1)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 4)

    if (fire) {
      entity.facing = fire.x > entity.x ? -1 : 1
    }

    if (entity.t > 0.6) {
      const prey = world.nearest(entity, isLowBird(world), unit * 18)

      if (prey) {
        entity.targetId = prey.id
        entity.data.lost = 0
        world.setState(entity, 'stalk')
      }
    }
  },
}

export const meadowSpecies = { bee, bird, butterfly, cat, caterpillar, egg }
