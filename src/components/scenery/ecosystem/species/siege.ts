import type { SpawnParticles } from '../../spawnables'
import { ecoAsset } from '../assets'
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
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

const fireballGravity = 9
const arrowGravity = 4

const sparkleTrail: SpawnParticles = {
  asset: ecoAsset('unicorn-sparkle'),
  count: 5,
  effect: 'sparkles',
}

const isHazardTarget = (world: EcoWorld) => (other: EcoEntity) =>
  (world.has(other, 'burnable') || world.has(other, 'target')) && onGround(other, world)

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

function hurt(dragon: EcoEntity) {
  dragon.hp -= 1
  dragon.data.hurt = 0.45
  dragon.fx = 'hurt'
}

const cottageSpecies = (assets: readonly string[]): EcoSpecies => ({
  anchor: 'bottom',
  asset: () => pick(assets),
  burnTime: 5,
  countAs: 'cottage',
  layer: 'front',
  size: [3.2, 4],
  state: 'stand',
  tags: ['building', 'fuel', 'target'],
  tick() {},
})

const pennant: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('pennant'),
  burnTime: 2.6,
  idle: 'wave',
  layer: 'front',
  size: [3, 3.8],
  state: 'stand',
  tags: ['fuel', 'target'],
  tick() {},
}

const dragonVariants = [
  { asset: ecoAsset('dragon-eastern-red'), idle: 'undulate', size: [7, 9] },
  { asset: ecoAsset('dragon-eastern-jade'), idle: 'undulate', size: [7, 9] },
  { asset: ecoAsset('dragon-western-ember'), idle: 'flap', size: [5, 6.4] },
  { asset: ecoAsset('dragon-western-frost'), idle: 'flap', size: [5, 6.4] },
  { asset: ecoAsset('dragon-western-emerald'), idle: 'flap', size: [5, 6.4] },
] as const

const dragon: EcoSpecies = {
  anchor: 'center',
  asset: () => pick(dragonVariants).asset,
  hp: 3,
  init(entity, world) {
    const variant =
      dragonVariants.find((entry) => entry.asset === entity.asset) ?? dragonVariants[0]

    entity.idle = variant.idle
    entity.size = between(variant.size[0], variant.size[1])
    entity.data.cool = between(1.5, 3)
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.36)
  },
  layer: 'front',
  size: [5, 6.4],
  state: 'patrol',
  tags: ['dragon'],
  tick(entity, world, dt) {
    const unit = world.unit

    if ((entity.data.hurt ?? 0) > 0) {
      entity.data.hurt = (entity.data.hurt ?? 0) - dt

      if ((entity.data.hurt ?? 0) <= 0 && entity.state !== 'falling') {
        entity.fx = ''
      }
    }

    if (entity.hp <= 0 && entity.state !== 'falling') {
      entity.fx = 'hurt'
      world.setState(entity, 'falling')
    }

    if (entity.state === 'falling') {
      entity.vy += unit * 9 * dt
      entity.vx *= 0.99
      entity.tilt += dt * 80
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
        world.kill(entity)
      }
      return
    }

    if (entity.state === 'aim') {
      const target = world.byId(entity.targetId)
      entity.vx *= 0.92
      entity.vy *= 0.92
      integrate(entity, dt)

      if (!target) {
        world.setState(entity, 'patrol')
        return
      }

      entity.facing = target.x >= entity.x ? 1 : -1

      if (entity.t > 0.7) {
        const width = world.widthOf(entity)
        const mouthX = entity.x + entity.facing * width * 0.44
        const mouthY = entity.y - world.heightOf(entity) * 0.18
        const seconds = clamp(Math.abs(target.x - mouthX) / (unit * 7), 0.9, 2)
        const launch = ballistic(
          mouthX,
          mouthY,
          target.x,
          world.groundY,
          seconds,
          fireballGravity * unit,
        )

        world.spawn('fireball', { ...launch, x: mouthX, y: mouthY })
        entity.targetId = null
        entity.data.cool = between(4, 7)
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'swoop') {
      steer(entity, entity.data.swoopX ?? entity.x, world.groundY - unit * 4.5, unit * 6, dt, 2)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 18)
      keepInSky(entity, world, world.skyTop, world.groundY - unit * 3.5)

      if (entity.t > 3.4) {
        world.setState(entity, 'patrol')
      }
      return
    }

    wander(entity, world, dt, unit * 2.6, world.skyTop + unit, world.height * 0.4, 1.4)
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
          Math.abs(other.x - entity.x) < unit * 30,
      )

      if (targets.length > 0) {
        entity.targetId = pick(targets).id
        world.setState(entity, 'aim')
        return
      }

      entity.data.cool = between(1, 2)
    }

    if (chance(0.05, dt)) {
      entity.data.swoopX = between(world.width * 0.1, world.width * 0.9)
      world.setState(entity, 'swoop')
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
  tags: ['fireball'],
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
      return
    }

    const blocker = world.nearest(
      entity,
      (other) => world.has(other, 'knight') && other.state === 'guard',
      unit * 2.6,
    )

    if (blocker && Math.random() < 0.75) {
      blocker.fx = 'block'
      blocker.data.block = 0.5
      world.kill(entity)
      return
    }

    for (const other of world.within(entity.x, world.groundY, unit * 1.9, isHazardTarget(world))) {
      if (world.has(other, 'fuel')) {
        other.data.burn = Math.max(other.data.burn ?? 0, 0.01)
      } else if (world.has(other, 'knight') && other.hp > 1) {
        other.hp -= 1
        other.fx = 'hurt'
        other.data.block = 0.45
      } else {
        world.kill(other)
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

const knight: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('knight'),
  hp: 2,
  idle: 'trot',
  layer: 'front',
  size: [2.8, 3.4],
  state: 'march',
  tags: ['knight', 'target'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.data.cool = (entity.data.cool ?? 0) - dt

    if ((entity.data.block ?? 0) > 0) {
      entity.data.block = (entity.data.block ?? 0) - dt

      if ((entity.data.block ?? 0) <= 0 && entity.fx === 'hurt') {
        entity.fx = ''
      }
    }

    if (entity.state === 'strike') {
      const progress = Math.min(1, entity.t / 0.6)
      entity.lift = Math.sin(Math.PI * progress) * unit * 1.8

      if (progress > 0.45 && !(entity.data.struck ?? 0)) {
        entity.data.struck = 1
        const foe = world.nearest(
          { x: entity.x, y: entity.y - entity.lift - world.heightOf(entity) },
          (other) => world.has(other, 'dragon') && other.state !== 'falling',
          unit * 4.2,
        )

        if (foe) {
          hurt(foe)
        }
      }

      if (progress >= 1) {
        entity.lift = 0
        world.setState(entity, 'march')
      }
      return
    }

    const incoming = incomingFireball(entity, world, 2.6)

    if (incoming) {
      entity.facing = incoming.x >= entity.x ? 1 : -1
      settle(entity, dt)
      entity.fx = (entity.data.block ?? 0) > 0 ? 'block' : 'guard'
      world.setState(entity, 'guard')
      return
    }

    if (entity.state === 'guard') {
      entity.fx = (entity.data.block ?? 0) > 0 ? 'block' : 'guard'

      if (entity.t > 0.5) {
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

    walk(entity, world, dt, unit * 0.9)

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

    const lowDragon = world.nearest(
      entity,
      (other) =>
        world.has(other, 'dragon') &&
        other.state !== 'falling' &&
        other.y > world.groundY - unit * 8 &&
        Math.abs(other.x - entity.x) < unit * 3.5,
    )

    if (lowDragon && (entity.data.cool ?? 0) <= 0) {
      entity.data.cool = 2.5
      entity.data.struck = 0
      entity.facing = lowDragon.x >= entity.x ? 1 : -1
      world.setState(entity, 'strike')
    }
  },
}

const archer: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('archer'),
  init(entity) {
    entity.data.cool = between(0.5, 1.5)
  },
  layer: 'front',
  size: [2.6, 3.2],
  state: 'patrol',
  tags: ['burnable', 'target'],
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
        let aimX = foe.x
        let aimY = foe.y

        for (let pass = 0; pass < 3; pass += 1) {
          const seconds = Math.hypot(aimX - originX, aimY - originY) / speed
          aimX = foe.x + foe.vx * seconds
          aimY = foe.y + foe.vy * seconds
        }

        const seconds = Math.hypot(aimX - originX, aimY - originY) / speed
        const launch = ballistic(originX, originY, aimX, aimY, seconds, arrowGravity * unit)

        world.spawn('arrow', { ...launch, x: originX, y: originY })
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
        (other) => world.has(other, 'dragon') && other.state !== 'falling',
        unit * 45,
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
  tags: [],
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
      (other) => world.has(other, 'dragon') && other.state !== 'falling',
      unit * 5,
    )

    if (foe && Math.hypot(foe.x - entity.x, foe.y - entity.y) < world.widthOf(foe) * 0.46) {
      hurt(foe)
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

const unicorn: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('unicorn'),
  layer: 'front',
  particles: sparkleTrail,
  size: [4.2, 5.2],
  state: 'gallop',
  tags: ['unicorn', 'target'],
  tick(entity, world, dt) {
    const unit = world.unit
    const incoming = incomingFireball(entity, world, 5)

    if (incoming) {
      entity.facing = incoming.x >= entity.x ? -1 : 1
      world.setState(entity, 'panic')
    }

    const panicking = entity.state === 'panic'
    walk(entity, world, dt, unit * (panicking ? 4.4 : 2.1))
    hop(entity, dt, unit * (panicking ? 0.55 : 0.35), panicking ? 12 : 8)

    if (panicking && entity.t > 2.4) {
      world.setState(entity, 'gallop')
    } else if (!panicking && chance(0.05, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    for (const fire of world.within(entity.x, world.groundY, unit * 1.3, isFireOrBurning(world))) {
      if (world.has(fire, 'fire')) {
        world.kill(fire)
      } else {
        fire.data.burn = 0
      }
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
  tags: ['burnable', 'target'],
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

export const siegeSpecies = (cottageAssets: readonly string[]) => ({
  archer,
  arrow,
  cottage: cottageSpecies(cottageAssets),
  dragon,
  fireball,
  'frog-prince': frogPrince,
  knight,
  pennant,
  unicorn,
})
