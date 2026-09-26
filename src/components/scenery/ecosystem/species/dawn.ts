import { ecoAsset } from '../assets'
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
} from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

const bloomAsset = ecoAsset('dandelion-bloom')
const puffAsset = ecoAsset('dandelion')
const sproutAsset = ecoAsset('sprout')

const isPlant = (world: EcoWorld) => (other: EcoEntity) => world.has(other, 'plant')

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
    const rising = entity.age < 1.6

    entity.vx += (world.wind - entity.vx) * Math.min(1, dt * 0.8)
    entity.vy += ((rising ? -unit * 0.9 : unit * 0.55) - entity.vy) * Math.min(1, dt * 1.2)
    entity.vy += Math.sin(world.time * 2.2 + entity.id) * unit * 0.8 * dt
    entity.tilt = Math.sin(world.time * 1.8 + entity.id) * 14
    integrate(entity, dt)

    if (entity.x < -unit * 2 || entity.x > world.width + unit * 2 || entity.age > 24) {
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

const isBunnyFood = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'plant') && other.state !== 'grow' && (other.data.burn ?? 0) <= 0

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
  tags: ['bunny', 'burnable'],
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
    const fire = world.nearest(entity, (other) => world.has(other, 'fire'), unit * 4.5)
    const threat = hawk ?? fire

    if (threat) {
      entity.facing = threat.x > entity.x ? -1 : 1
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      walk(entity, world, dt, unit * 3.8)
      hop(entity, dt, unit * 1.1, 9)

      if (entity.t > 2 && !threat) {
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

      if (entity.t > 2) {
        world.kill(plant)
        entity.targetId = null
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1

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

      hop(entity, dt, unit * 0.8, 7)

      if (walkToward(entity, world, plant.x, unit * 1.7, dt) < unit * 0.6) {
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
      const plant = world.nearest(entity, isBunnyFood(world), unit * 26)

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

function releaseCarry(hawk: EcoEntity, world: EcoWorld) {
  hawk.targetId = null
  hawk.data.zBoost = 0
  world.setAsset(hawk, hawkSoar)
  world.setState(hawk, 'climb')
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
  tags: ['hawk'],
  tick(entity, world, dt) {
    const unit = world.unit

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
        prey.data.ghost = 1
        world.kill(prey)
        entity.data.hunger = 0
        releaseCarry(entity, world)
      }
      return
    }

    if (entity.state === 'dive' || entity.state === 'swoop') {
      world.setAsset(entity, entity.state === 'dive' ? hawkDive : hawkSoar)
      const prey = world.byId(entity.targetId)

      if (!prey || prey.state === 'carried' || prey.state === 'drop' || entity.t > 6) {
        entity.targetId = null
        world.setState(entity, 'climb')
        return
      }

      const preyY =
        prey.anchor === 'bottom' ? prey.y - world.heightOf(prey) * 0.4 - prey.lift : prey.y
      const gap = steer(entity, prey.x, preyY, unit * (entity.state === 'dive' ? 9 : 6.5), dt, 4)
      integrate(entity, dt)
      faceTravel(entity)
      entity.tilt = entity.state === 'dive' ? 0 : entity.tilt * 0.9

      if (gap < unit * 1.3) {
        entity.targetId = null

        if (world.has(prey, 'balloon')) {
          world.setState(prey, 'popped')
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

    if ((entity.data.hunger ?? 0) > 1 && chance(0.8, dt)) {
      const prey = world.nearest(
        entity,
        (other) => world.has(other, 'bunny') && other.state !== 'carried' && other.state !== 'drop',
        Math.max(unit * 45, world.height),
      )

      if (prey) {
        entity.targetId = prey.id
        world.setState(entity, 'dive')
      }
    }
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

export const dawnSpecies = { balloon, bunny, dandelion, hawk, seed }
