import type { SpawnParticles } from '../../spawnables'
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
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

registerViewBoxes({
  ballista: [126, 82],
  bolt: [128, 24],
  'duel-beam-dark': [144, 18],
  'duel-beam-good': [144, 18],
  'fire-lance': [144, 22],
  'frost-nova': [104, 104],
  'green-flame': [58, 70],
  'ice-wall': [86, 96],
  prince: [76, 88],
  princess: [78, 96],
  'shield-bubble': [124, 112],
  'spell-impact': [72, 72],
  treasure: [96, 78],
  'treasure-empty': [96, 78],
  'vine-snare': [116, 74],
  wizard: [82, 98],
  'wizard-archmage': [82, 98],
  'wizard-archmage-cast': [82, 98],
  'wizard-cast': [64, 64],
  'wizard-druid': [82, 98],
  'wizard-druid-cast': [82, 98],
  'wizard-frost': [82, 98],
  'wizard-frost-cast': [82, 98],
  'wizard-pyromancer': [82, 98],
  'wizard-pyromancer-cast': [82, 98],
  'wizard-raise': [82, 98],
  'wizard-storm': [82, 98],
  'wizard-storm-cast': [82, 98],
  'dark-lord': [92, 104],
  'dark-lord-cast': [92, 104],
})

const fireballGravity = 9
const arrowGravity = 4
const boltGravity = 3

const treasureAsset = ecoAsset('treasure')
const treasureEmptyAsset = ecoAsset('treasure-empty')
const darkLordAsset = ecoAsset('dark-lord')
const darkLordCastAsset = ecoAsset('dark-lord-cast')

const sparkleTrail: SpawnParticles = {
  asset: ecoAsset('unicorn-sparkle'),
  count: 5,
  effect: 'sparkles',
}

const isHazardTarget = (world: EcoWorld) => (other: EcoEntity) =>
  (world.has(other, 'burnable') || world.has(other, 'target')) && onGround(other, world)

const isDragon = (world: EcoWorld) => (other: EcoEntity) =>
  world.has(other, 'dragon') && other.state !== 'falling'

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

function hurt(dragon: EcoEntity, world: EcoWorld, amount = 1, wake = false) {
  dragon.hp -= amount
  dragon.data.hurt = 0.45
  dragon.fx = 'hurt'

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
    '--siege-fizzle': (entity.data.fizzleUntil ?? 0) > world.time ? '1' : '0',
    '--siege-shield': shielded(entity, world) ? '1' : '0',
  }),
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
    entity.data.angry = Math.max(0, (entity.data.angry ?? 0) - dt)

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

    if (entity.state === 'frozen') {
      entity.fx = 'frozen'
      entity.data.cool = Math.max(entity.data.cool ?? 0, 1.2)
      entity.vx *= 0.975
      entity.vy += unit * 1.8 * dt
      entity.vy = Math.min(entity.vy, unit * 1.6)
      integrate(entity, dt)
      entity.y = Math.min(entity.y, world.groundY - unit * 3.8)
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
      entity.y = Math.min(entity.y, world.groundY - unit * 3.2)
      entity.tilt = Math.sin(world.time * 2 + entity.id) * 3

      if (entity.t > (entity.data.rootFor ?? 3.2)) {
        entity.fx = ''
        entity.data.angry = 4
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'sleep') {
      const hoard = world.byId(entity.targetId)

      if (!hoard || !world.has(hoard, 'treasure') || (entity.data.angry ?? 0) > 0) {
        entity.targetId = null
        entity.data.cool = 0.4
        world.setState(entity, 'patrol')
        return
      }

      entity.x += (hoard.x + unit * 0.35 - entity.x) * Math.min(1, dt * 4)
      entity.y += (world.groundY - unit * 2.1 - entity.y) * Math.min(1, dt * 4)
      entity.vx = 0
      entity.vy = 0
      entity.tilt = Math.sin(world.time * 1.4 + entity.id) * 3
      entity.fx = ''
      hoard.data.looted = 1

      if (entity.t > (entity.data.sleepFor ?? 15)) {
        entity.targetId = null
        entity.data.angry = 5
        entity.data.cool = 0.25
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'hoard') {
      const hoard = world.byId(entity.targetId)

      if (!hoard || !world.has(hoard, 'treasure') || (hoard.data.burn ?? 0) > 0) {
        entity.targetId = null
        world.setState(entity, 'patrol')
        return
      }

      steer(entity, hoard.x + unit * 0.4, world.groundY - unit * 2.4, unit * 7.5, dt, 2.8)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 18)
      keepInSky(entity, world, world.skyTop, world.groundY - unit * 1.8)

      if (Math.hypot(entity.x - hoard.x, entity.y - (world.groundY - unit * 2.4)) < unit * 1.8) {
        entity.data.sleepFor = between(13, 21)
        entity.vx = 0
        entity.vy = 0
        entity.tilt = 0
        entity.facing = -1
        hoard.data.looted = 1
        world.setState(entity, 'sleep')
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

    const treasure = world.nearest(
      entity,
      (other) =>
        world.has(other, 'treasure') &&
        (other.data.burn ?? 0) <= 0 &&
        !world.nearest(
          other,
          (dragonOther) =>
            dragonOther !== entity &&
            world.has(dragonOther, 'dragon') &&
            dragonOther.state === 'sleep' &&
            dragonOther.targetId === other.id,
          unit * 5,
        ),
      Math.max(world.width, unit * 55),
    )

    if (treasure && (entity.data.angry ?? 0) <= 0) {
      entity.targetId = treasure.id
      world.setState(entity, 'hoard')
      return
    }

    wander(
      entity,
      world,
      dt,
      unit * ((entity.data.angry ?? 0) > 0 ? 3.8 : 2.6),
      world.skyTop + unit,
      world.height * 0.4,
      1.4,
    )
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
          !world.has(other, 'treasure') &&
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

    if (blocker && Math.random() < 0.75) {
      blocker.fx = 'block'
      blocker.data.block = 0.5
      world.kill(entity)
      return
    }

    for (const other of world.within(entity.x, world.groundY, unit * 1.9, isHazardTarget(world))) {
      if (other.species === 'wizard' && Math.random() < 0.9) {
        const direction = entity.x >= other.x ? -1 : 1

        spawnCast(world, other.x, other.y - world.heightOf(other) * 0.55, 2.4, 'blink', 0.55)
        other.x = clamp(other.x + direction * unit * between(8, 12), unit, world.width - unit)
        other.facing = direction === 1 ? -1 : 1
        other.fx = 'blink'
        other.lift = unit * 0.25
        other.data.blinkCool = between(5, 8)
        other.data.blinkFx = 0.75
        world.setAsset(other, wizardTypeFor(other).asset)
        world.setState(other, 'wander')
        spawnCast(world, other.x, other.y - world.heightOf(other) * 0.55, 2.6, 'blink', 0.65)
      } else if (world.has(other, 'fuel')) {
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
          unit * 4.8,
        )

        if (foe) {
          hurt(foe, world, foe.state === 'sleep' ? 2 : 1, foe.state === 'sleep')
        } else {
          const lord = world.nearest(
            { x: entity.x, y: entity.y - entity.lift - world.heightOf(entity) },
            isDarkLord,
            unit * 4.2,
          )

          if (lord) {
            hitDarkLord(lord, world, 1, entity.x)
          }
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

    const lord = world.nearest(entity, isDarkLord, unit * 5.8)

    if (lord && (entity.data.cool ?? 0) <= 0) {
      entity.data.cool = 2.4
      entity.data.struck = 0
      entity.facing = lord.x >= entity.x ? 1 : -1
      world.setState(entity, 'strike')
      return
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

const prince: EcoSpecies = {
  ...knight,
  asset: ecoAsset('prince'),
  countAs: 'frog-prince',
  size: [2.7, 3.3],
  tags: ['knight', 'prince', 'target'],
  tick(entity, world, dt) {
    if (entity.fx === 'sparkle' && entity.age > 1.4) {
      entity.fx = ''
    }

    knight.tick(entity, world, dt)
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
        const { aimX, aimY, seconds } = leadTarget(foe, originX, originY, speed)
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
        (other) => isDarkLord(other) || (world.has(other, 'dragon') && other.state !== 'falling'),
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

    const foe = world.nearest(entity, isDragonOrLord(world), unit * 5)

    if (foe && Math.hypot(foe.x - entity.x, foe.y - entity.y) < world.widthOf(foe) * 0.46) {
      hurtDragonOrLord(foe, world, 1, false, entity.x)
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
  tags: ['projectile'],
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

    const foe = world.nearest(entity, isDragonOrLord(world), unit * 5.6)

    if (foe && Math.hypot(foe.x - entity.x, foe.y - entity.y) < world.widthOf(foe) * 0.5) {
      hurtDragonOrLord(
        foe,
        world,
        1,
        foe.state === 'sleep' && (entity.data.magic ?? 0) <= 0,
        entity.x,
      )

      if ((entity.data.knock ?? 0) > 0) {
        foe.vx += Math.sign(entity.vx || 1) * unit * 4.2
        foe.vy -= unit * 1.5
      }

      if ((entity.data.lightning ?? 0) > 0 && (entity.data.chain ?? 0) > 0) {
        const next = world.nearest(
          foe,
          (other) => other !== foe && world.has(other, 'dragon') && other.state !== 'falling',
          unit * 26,
        )

        if (next) {
          const speed = unit * 22
          const seconds = Math.max(0.18, Math.hypot(next.x - foe.x, next.y - foe.y) / speed)
          const launch = ballistic(foe.x, foe.y, next.x, next.y, seconds, 0)

          world.spawn('bolt', {
            ...launch,
            data: { chain: (entity.data.chain ?? 1) - 1, lightning: 1, magic: 1 },
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

const princess: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('princess'),
  idle: 'trot',
  init(entity) {
    entity.data.seekCool = between(0.2, 1)
  },
  layer: 'front',
  size: [2.5, 3.1],
  state: 'stroll',
  tags: ['princess', 'target', 'burnable'],
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
          entity.x = cottage.x
          entity.scale = 0.2
          entity.lift = unit * 0.35
          entity.fx = 'hidden'
          world.setState(entity, 'hidden')
        }
        return
      }

      entity.x = cottage.x
      entity.y = cottage.y
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
    strength: 1.1,
  },
  {
    asset: ecoAsset('wizard-pyromancer'),
    castAsset: ecoAsset('wizard-pyromancer-cast'),
    code: 1,
    glow: 'rgba(255, 166, 94, 0.98)',
    rune: 'rgba(255, 217, 102, 0.86)',
    strength: 1.18,
  },
  {
    asset: ecoAsset('wizard-frost'),
    castAsset: ecoAsset('wizard-frost-cast'),
    code: 2,
    glow: 'rgba(216, 244, 255, 0.98)',
    rune: 'rgba(143, 210, 230, 0.84)',
    strength: 1.05,
  },
  {
    asset: ecoAsset('wizard-druid'),
    castAsset: ecoAsset('wizard-druid-cast'),
    code: 3,
    glow: 'rgba(168, 218, 130, 0.95)',
    rune: 'rgba(119, 170, 82, 0.84)',
    strength: 1.0,
  },
  {
    asset: ecoAsset('wizard-storm'),
    castAsset: ecoAsset('wizard-storm-cast'),
    code: 4,
    glow: 'rgba(216, 191, 255, 0.98)',
    rune: 'rgba(170, 132, 218, 0.86)',
    strength: 1.22,
  },
] as const

const wizardSpellStates = [
  'shield',
  'lightning',
  'frost',
  'rain',
  'blink',
  'fire-lance',
  'ice-wall',
  'vine',
  'heal',
  'storm',
  'duel',
] as const

const isWizardCasting = (state: string) => wizardSpellStates.some((spell) => spell === state)

const wizardTypeFor = (entity: EcoEntity) =>
  wizardTypes.find((entry) => entry.code === (entity.data.wizardType ?? 0)) ?? wizardTypes[0]

const wizardTypeFromAsset = (asset: string) =>
  wizardTypes.find((entry) => entry.asset === asset || entry.castAsset === asset) ?? wizardTypes[0]

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

function hitDarkLord(entity: EcoEntity, world: EcoWorld, amount = 1, sourceX = entity.x) {
  if (entity.dying || entity.removed || entity.species !== 'dark-lord') {
    return
  }

  entity.hp -= amount
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
    entity.x = clamp(
      entity.x + direction * world.unit * between(7, 12),
      world.unit,
      world.width - world.unit,
    )
    entity.facing = direction === 1 ? -1 : 1
    spawnImpact(world, entity.x, entity.y - world.heightOf(entity) * 0.46, 3.2, 'smoke', 0.72)
  }
}

function hurtDragonOrLord(
  foe: EcoEntity,
  world: EcoWorld,
  amount = 1,
  wake = false,
  sourceX = foe.x,
) {
  if (world.has(foe, 'dragon')) {
    hurt(foe, world, amount, wake)
  } else if (foe.species === 'dark-lord') {
    hitDarkLord(foe, world, amount, sourceX)
  }
}

const isDarkLord = (other: EcoEntity) => other.species === 'dark-lord'

const isDragonOrLord = (world: EcoWorld) => (other: EcoEntity) =>
  isDragon(world)(other) || isDarkLord(other)

function releaseDuelWizards(world: EcoWorld, lord: EcoEntity | null) {
  for (const other of world.entities) {
    if (
      other.species === 'wizard' &&
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
      other.species === 'wizard' &&
      other.state === 'duel' &&
      other.targetId === lord.id &&
      !other.dying &&
      !other.removed,
  )
  const good = challengers.reduce((sum, other) => sum + wizardTypeFor(other).strength, 0)
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

    if (foe && isDragonOrLord(world)(foe)) {
      entity.facing = foe.x >= entity.x ? 1 : -1
      const speed = unit * 24
      const seconds = Math.max(0.24, Math.hypot(foe.x - origin.x, foe.y - origin.y) / speed)
      const launch = ballistic(origin.x, origin.y, foe.x, foe.y, seconds, 0)

      world.spawn('bolt', {
        ...launch,
        data: { chain: 1, lightning: 1, magic: 1 },
        size: 2.8,
        x: origin.x,
        y: origin.y,
      })
      spawnCast(world, origin.x, origin.y, 2.2, 'lightning', 0.65)
      spawnImpact(world, foe.x, foe.y, 2.4, 'lightning', 0.42)
    }
  } else if (entity.state === 'storm') {
    const foes = world.entities
      .filter((other) => !other.dying && !other.removed && isDragonOrLord(world)(other))
      .slice(0, 4)

    for (const foe of foes) {
      spawnBeam(world, 'duel-beam-good', origin, bodyPoint(foe, world), 0.22)
      spawnImpact(world, foe.x, foe.y - world.heightOf(foe) * 0.2, 2.7, 'lightning', 0.5)
      hurtDragonOrLord(foe, world, 1, foe.state === 'sleep', entity.x)
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
    const fromX = entity.x
    const landing =
      threat && world.has(threat, 'fireball') ? landingX(threat, world, fireballGravity) : entity.x
    const direction = landing >= entity.x ? -1 : 1

    spawnCast(world, entity.x, entity.y - world.heightOf(entity) * 0.55, 2.5, 'blink', 0.55)
    entity.x = clamp(entity.x + direction * unit * between(9, 13), unit, world.width - unit)
    entity.facing = direction === 1 ? -1 : 1
    entity.lift = unit * 0.25
    spawnCast(world, entity.x, entity.y - world.heightOf(entity) * 0.55, 2.7, 'blink', 0.65)

    if (Math.abs(entity.x - fromX) < unit * 2) {
      entity.x = clamp(entity.x - direction * unit * between(5, 8), unit, world.width - unit)
    }
  }
}

const wizard: EcoSpecies = {
  anchor: 'bottom',
  asset: () => pick(wizardTypes).asset,
  hp: 2,
  idle: 'sway',
  init(entity) {
    const type = wizardTypeFromAsset(entity.asset)

    entity.data.wizardType = type.code
    entity.data.book = Math.floor(between(0, 3))
    entity.data.blinkCool = between(1, 2)
    entity.data.frostCool = between(2.5, 4)
    entity.data.lightningCool = between(1.2, 2.2)
    entity.data.rainCool = between(0.6, 1.4)
    entity.data.shieldCool = between(0.3, 1)
    entity.data.specialCool = between(1.4, 2.6)
    entity.data.spellCool = between(0.4, 1)
  },
  layer: 'front',
  size: [2.6, 3.2],
  state: 'wander',
  style: (entity) => {
    const type = wizardTypeFor(entity)

    return {
      '--wizard-glow': type.glow,
      '--wizard-rune': type.rune,
    }
  },
  tags: ['wizard', 'target', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    const type = wizardTypeFor(entity)

    entity.data.blinkCool = (entity.data.blinkCool ?? 0) - dt
    entity.data.frostCool = (entity.data.frostCool ?? 0) - dt
    entity.data.lightningCool = (entity.data.lightningCool ?? 0) - dt
    entity.data.rainCool = (entity.data.rainCool ?? 0) - dt
    entity.data.shieldCool = (entity.data.shieldCool ?? 0) - dt
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
      const foe = world.nearest(entity, isDragon(world), Math.max(unit * 56, world.width))

      if (foe) {
        const book = entity.data.book ?? 0
        entity.data.book = book + 1

        if (type.code === 1 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(4.8, 7)
          startWizardSpell(entity, world, 'fire-lance', foe, between(2.4, 3.2))
          return
        }

        if (type.code === 2 && (entity.data.frostCool ?? 0) <= 0) {
          entity.data.frostCool = between(9, 13)
          startWizardSpell(entity, world, 'frost', foe, between(2.6, 3.8))
          return
        }

        if (type.code === 3 && (foe.state === 'sleep' || foe.y > world.groundY - unit * 8)) {
          entity.data.specialCool = between(7, 10)
          startWizardSpell(entity, world, 'vine', foe, between(2.7, 3.8))
          return
        }

        if (type.code === 4 && (entity.data.specialCool ?? 0) <= 0) {
          entity.data.specialCool = between(6, 9)
          startWizardSpell(entity, world, 'storm', foe, between(2.7, 3.8))
          return
        }

        if ((book % 3 === 0 || foe.state === 'swoop') && (entity.data.frostCool ?? 0) <= 0) {
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
  size: [3, 3.7],
  state: 'stalk',
  tags: ['dark-lord', 'burnable'],
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

          if (entity.state === 'curse') {
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

    const wizardTarget = world.nearest(entity, (other) => other.species === 'wizard', unit * 28)

    if (wizardTarget && (entity.data.spellCool ?? 0) <= 0) {
      startDarkSpell(entity, world, 'duel', wizardTarget, 2.4)
      return
    }

    const victim = world.nearest(
      entity,
      (other) =>
        world.has(other, 'knight') ||
        world.has(other, 'prince') ||
        world.has(other, 'princess') ||
        world.has(other, 'unicorn'),
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
  tags: ['fuel', 'target'],
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
          data: { knock: 1 },
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

const treasure: EcoSpecies = {
  anchor: 'bottom',
  asset: treasureAsset,
  burnTime: 5.4,
  idle: 'glow',
  layer: 'front',
  size: [2.7, 3.4],
  state: 'gleam',
  tags: ['treasure', 'fuel', 'target'],
  tick(entity, world) {
    const looted = world.nearest(
      entity,
      (other) =>
        world.has(other, 'dragon') && other.state === 'sleep' && other.targetId === entity.id,
      world.unit * 6,
    )

    if (looted) {
      entity.fx = 'looted'
      world.setAsset(entity, treasureEmptyAsset)
    } else {
      entity.fx = ''
      entity.data.looted = 0
      world.setAsset(entity, treasureAsset)
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
  tags: [],
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
  tags: [],
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
  tags: [],
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
  tags: [],
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
  tags: [],
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
  size: [3, 4],
  state: 'snare',
  tags: [],
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
  tags: ['fire'],
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
  archer,
  arrow,
  ballista,
  bolt,
  cottage: cottageSpecies(cottageAssets),
  'dark-lord': darkLord,
  dragon,
  'duel-beam-dark': beamEffect(ecoAsset('duel-beam-dark')),
  'duel-beam-good': beamEffect(ecoAsset('duel-beam-good')),
  'fire-lance': beamEffect(ecoAsset('fire-lance')),
  fireball,
  'frost-nova': frostNova,
  'frog-prince': frogPrince,
  'green-flame': greenFlame,
  'ice-wall': iceWall,
  knight,
  pennant,
  prince,
  princess,
  'spell-impact': spellImpact,
  treasure,
  unicorn,
  'vine-snare': vineSnare,
  wizard,
  'wizard-cast': wizardCast,
})
