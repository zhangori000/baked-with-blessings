import { ecoAsset, registerViewBoxes } from '../assets'
import {
  between,
  chance,
  clamp,
  faceTravel,
  flee,
  integrate,
  keepInSky,
  steer,
  tiltToVelocity,
  wander,
} from '../behaviors'
import { asteroidStarCount } from '../../spawnables'
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

registerViewBoxes({
  asteroid: [170, 96],
  bat: [112, 70],
  impact: [260, 180],
  'lily-frog': [96, 76],
  'lily-pad': [118, 48],
  owl: [112, 84],
  'shooting-star': [200, 40],
  swan: [140, 96],
})

const isLantern = (world: EcoWorld) => (other: EcoEntity) => world.has(other, 'lantern')
const isMoth = (other: EcoEntity) => other.species === 'moth'
const isFirefly = (other: EcoEntity) => other.species === 'firefly'
const isBat = (other: EcoEntity) => other.species === 'bat'
const isOwl = (other: EcoEntity) => other.species === 'owl'
const isBoat = (other: EcoEntity) => other.species === 'boat'
const isFrog = (other: EcoEntity) => other.species === 'lily-frog'
const isSwan = (other: EcoEntity) => other.species === 'swan'
const isPad = (other: EcoEntity) => other.species === 'lily-pad'
const isLowPrey = (world: EcoWorld) => (other: EcoEntity) =>
  (isMoth(other) || isFirefly(other)) && other.y > world.waterY - world.unit * 12

function eatIfClose(hunter: EcoEntity, prey: EcoEntity, world: EcoWorld, reach = 1.7) {
  const gap = Math.hypot(prey.x - hunter.x, prey.y - hunter.y)

  if (gap < world.unit * reach + world.widthOf(prey) * 0.35) {
    world.kill(prey)
    hunter.targetId = null
    return true
  }

  return false
}

function starTilt(entity: EcoEntity) {
  entity.tilt = clamp(
    (Math.atan2(entity.vy, Math.max(1, Math.abs(entity.vx))) * 180) / Math.PI,
    -8,
    42,
  )
}

function triggerImpact(entity: EcoEntity, world: EcoWorld) {
  const impact = world.spawn('impact', {
    countAs: null,
    data: { siteX: clamp(entity.x, 0, world.width) },
    x: clamp(entity.x, world.unit * 2, world.width - world.unit * 2),
    y: world.waterY + world.unit * 0.5,
  })

  if (impact) {
    impact.data.zBoost = world.height * 4
  }

  for (const other of [...world.entities]) {
    if (other === impact || other === entity || other.dying || other.removed) {
      continue
    }

    world.kill(other)
  }

  world.remove(entity)
}

function ensurePad(entity: EcoEntity, world: EcoWorld) {
  if (!world.nearest(entity, isPad, world.unit * 2.5)) {
    world.spawn('lily-pad', {
      countAs: null,
      x: clamp(entity.x + between(-0.4, 0.4) * world.unit, world.unit, world.width - world.unit),
      y: world.waterY + world.unit * 0.15,
    })
  }
}

const boat: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('boat'),
  init(entity, world) {
    entity.data.next = between(1.5, 3)
    entity.y = world.waterY
  },
  layer: 'front',
  size: [5.6, 6.8],
  state: 'row',
  tags: [],
  tick(entity, world, dt) {
    const unit = world.unit
    const margin = world.width * 0.1

    entity.y = world.waterY
    entity.x += entity.facing * unit * 0.45 * dt
    entity.lift = (Math.sin(world.time * 1.4 + entity.id) + 1) * unit * 0.06
    entity.tilt = Math.sin(world.time * 1.1 + entity.id) * 2

    if (entity.x < margin) {
      entity.facing = 1
    } else if (entity.x > world.width - margin) {
      entity.facing = -1
    }

    entity.data.next = (entity.data.next ?? 5) - dt

    if ((entity.data.next ?? 0) > 0) {
      return
    }

    entity.data.next = between(5, 9)

    if (world.count((other) => other.species === 'lantern' && !other.user) < 18) {
      world.spawn('lantern', {
        countAs: null,
        data: { free: 1 },
        x: entity.x + entity.facing * world.widthOf(entity) * 0.34,
        y: entity.y - world.heightOf(entity) * 0.8,
      })
    }
  },
}

const lantern: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('lantern'),
  idle: 'glow',
  init(entity, world) {
    entity.data.leaveAt = between(34, 46)
    entity.data.hoverY = between(world.skyTop + world.unit * 2, world.height * 0.45)

    if (entity.user) {
      entity.y = world.groundY - world.unit
    } else {
      entity.size *= 0.8
    }
  },
  layer: 'front',
  rest(entity) {
    entity.y = entity.data.hoverY ?? entity.y
  },
  size: [2.2, 2.8],
  state: 'rise',
  tags: ['lantern'],
  tick(entity, world, dt) {
    const unit = world.unit
    const sway = Math.sin(world.time * 0.7 + entity.id) * unit * 0.3

    if ((entity.data.free ?? 0) > 0) {
      const leaving = entity.age > (entity.data.leaveAt ?? 40)
      entity.vy += ((leaving ? -unit * 0.9 : -unit * 0.32) - entity.vy) * Math.min(1, dt)
      entity.vx = world.wind * 0.25 + sway
      integrate(entity, dt)

      if (entity.y < -unit * 4) {
        world.remove(entity)
      }
      return
    }

    const goal = entity.data.hoverY ?? world.height * 0.3
    entity.vy += ((goal - entity.y) * 0.5 - entity.vy) * Math.min(1, dt * 1.5)
    entity.vx = sway
    integrate(entity, dt)
  },
}

const shootingStar: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('shooting-star'),
  countAs: 'shooting-star',
  init(entity, world) {
    const launched = world.tally('shooting-star')
    entity.data.turnAt = between(0.36, 0.62)
    entity.data.life = between(1.15, 1.55)
    entity.data.asteroid = launched >= asteroidStarCount ? 1 : 0

    if (entity.data.asteroid) {
      world.resetTally('shooting-star')
    }
    entity.x = between(-world.width * 0.12, world.width * 0.42)
    entity.y = between(world.skyTop + world.unit, Math.min(world.height * 0.24, world.skyBottom))
    entity.vx = world.width * between(0.52, 0.68)
    entity.vy = world.height * between(0.1, 0.17)
    entity.size = between(5.4, 7.2)
    entity.facing = 1
    starTilt(entity)
  },
  layer: 'front',
  rest(entity) {
    entity.data.opacity = 0.9
  },
  size: [5.4, 7.2],
  state: 'shoot',
  style: (entity) => ({
    '--night-star-opacity': `${entity.data.opacity ?? 1}`,
  }),
  tags: ['star'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'asteroid') {
      const impactX =
        entity.data.impactX ?? clamp(entity.x + world.width * 0.22, unit, world.width - unit)
      const impactY = world.waterY + unit * 0.4
      steer(entity, impactX, impactY, unit * 18, dt, 1.6)
      entity.vy += unit * 20 * dt
      integrate(entity, dt)
      const approach = clamp(entity.y / Math.max(1, impactY), 0, 1)
      entity.size = 5.5 + approach * (entity.data.asteroidMax ?? 8)
      entity.scale = 1 + approach * 0.3
      tiltToVelocity(entity, 82)
      entity.data.opacity = 1

      if (entity.y >= impactY || entity.x < -unit * 10 || entity.x > world.width + unit * 10) {
        triggerImpact(entity, world)
      }
      return
    }

    if ((entity.data.asteroid ?? 0) > 0 && entity.t > (entity.data.turnAt ?? 0.5)) {
      world.setAsset(entity, ecoAsset('asteroid'))
      world.setState(entity, 'asteroid')
      entity.data.impactX = clamp(
        entity.x + between(0.16, 0.34) * world.width,
        unit,
        world.width - unit,
      )
      entity.vx *= 0.42
      entity.vy = unit * between(8, 12)
      entity.size = 5
      entity.scale = 1
      entity.data.asteroidMax = between(7, 9)
      entity.data.opacity = 1
      return
    }

    integrate(entity, dt)
    starTilt(entity)
    const life = entity.data.life ?? 1.4
    const fadeIn = clamp(entity.t / 0.08, 0, 1)
    const fadeOut = clamp((life - entity.t) / 0.32, 0, 1)
    entity.data.opacity = Math.min(fadeIn, fadeOut)

    if (
      entity.t > life ||
      entity.x > world.width + world.widthOf(entity) ||
      entity.y > world.height * 0.48
    ) {
      world.remove(entity)
    }
  },
}

const impact: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('impact'),
  countAs: null,
  init(entity, world) {
    entity.data.life = 4.8
    entity.data.flash = 1
    entity.size = clamp(world.width / world.unit / 8, 14, 24)
    entity.data.zBoost = world.height * 4
  },
  layer: 'front',
  size: [14, 24],
  state: 'flash',
  style: (entity, world) => ({
    '--impact-flash-size': `${Math.max(world.width, world.height) * 2.7}px`,
    '--impact-ring-size': `${Math.max(world.width, world.height) * 1.7}px`,
    '--impact-shake': `${Math.max(7, world.unit * 0.7)}px`,
  }),
  tags: ['asteroid'],
  tick(entity, world) {
    entity.y = world.waterY + world.unit * 0.6

    if (entity.t > 0.62 && entity.state === 'flash') {
      world.setState(entity, 'crater')
    }

    if (entity.t > (entity.data.life ?? 4.8)) {
      world.remove(entity)
    }
  },
}

const moth: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('moth'),
  idle: 'flap',
  init(entity) {
    entity.data.angle = between(0, Math.PI * 2)
    entity.data.radius = between(1.4, 2.6)
    entity.data.spin = (Math.random() < 0.5 ? -1 : 1) * between(1.8, 2.8)
  },
  layer: 'front',
  size: [1.9, 2.4],
  state: 'orbit',
  tags: ['insect', 'prey'],
  tick(entity, world, dt) {
    const unit = world.unit
    let light = world.byId(entity.targetId)

    if (!light || entity.t > (entity.data.switchAt ?? 8)) {
      light = world.nearest(entity, isLantern(world), unit * 40)
      entity.targetId = light?.id ?? null
      entity.data.switchAt = between(6, 12)
      entity.t = 0
    }

    if (light) {
      entity.data.angle = (entity.data.angle ?? 0) + dt * (entity.data.spin ?? 2)
      const radius = (entity.data.radius ?? 2) * unit
      const angle = entity.data.angle ?? 0

      steer(
        entity,
        light.x + Math.cos(angle) * radius,
        light.y + Math.sin(angle) * radius * 0.7,
        unit * 5,
        dt,
        6,
      )
    } else {
      wander(entity, world, dt, unit * 2.2, world.skyTop, world.groundY - unit * 2)
    }

    integrate(entity, dt)
    faceTravel(entity)
    keepInSky(entity, world, 0, world.groundY - unit)
  },
}

const coupling = 1.5

const firefly: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('firefly'),
  init(entity, world) {
    entity.data.phase = between(0, Math.PI * 2)
    entity.data.frequency = (Math.PI * 2) / between(1.7, 2.1)
    entity.y = between(world.groundY - world.unit * 9, world.groundY - world.unit)
  },
  layer: 'front',
  size: [1.2, 1.6],
  state: 'drift',
  style: (entity) => ({
    '--eco-glow': Math.pow(Math.max(0, Math.cos(entity.data.phase ?? 0)), 3).toFixed(2),
  }),
  tags: ['firefly', 'insect', 'prey'],
  tick(entity, world, dt) {
    const unit = world.unit
    const phase = entity.data.phase ?? 0
    let pull = 0
    let neighbours = 0

    entity.data.croak = Math.max(0, (entity.data.croak ?? 0) - dt)
    entity.fx = (entity.data.croak ?? 0) > 0 ? 'chorus' : ''

    for (const other of world.entities) {
      if (other === entity || other.species !== 'firefly' || other.dying) {
        continue
      }

      if (Math.hypot(other.x - entity.x, other.y - entity.y) < unit * 16) {
        pull += Math.sin((other.data.phase ?? 0) - phase)
        neighbours += 1
      }
    }

    const drift = neighbours > 0 ? (coupling * pull) / neighbours : 0
    const croakBoost = (entity.data.croak ?? 0) > 0 ? 2.2 : 1
    entity.data.phase =
      (phase + ((entity.data.frequency ?? 3) * croakBoost + drift) * dt) % (Math.PI * 2)

    wander(entity, world, dt, unit * 0.8, world.groundY - unit * 9, world.groundY - unit, 1)
    integrate(entity, dt)
    faceTravel(entity, 2)
    keepInSky(entity, world, world.skyTop, world.groundY - unit * 0.5)
  },
}

const owl: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('owl'),
  idle: 'flap',
  init(entity, world) {
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.32)
    entity.data.cool = between(1.4, 3)
  },
  layer: 'front',
  size: [3.4, 4.4],
  state: 'glide',
  tags: ['owl', 'predator'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'hoot') {
      entity.vx *= 0.9
      entity.vy *= 0.9
      entity.lift = Math.sin(entity.t * 7) * unit * 0.16
      integrate(entity, dt)

      if (entity.t > 1.35) {
        entity.lift = 0
        world.setState(entity, 'glide')
      }
      return
    }

    if (entity.state === 'swoop') {
      const target = world.byId(entity.targetId)

      if (!target) {
        world.setState(entity, 'glide')
        return
      }

      steer(entity, target.x, target.y, unit * 10, dt, 3.2)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 38)

      if (eatIfClose(entity, target, world, isBat(target) ? 1.9 : 1.55) || entity.t > 3.2) {
        entity.data.cool = between(2.5, 4.5)
        entity.data.goalX = clamp(entity.x + entity.facing * unit * 8, 0, world.width)
        entity.data.goalY = between(world.skyTop + unit, world.height * 0.34)
        entity.data.goalAt = world.time + between(3, 5)
        world.setState(entity, 'glide')
      }
      return
    }

    const ceiling = world.height * 0.42
    const climbing = entity.y > ceiling

    wander(
      entity,
      world,
      dt,
      unit * (climbing ? 4.5 : 2),
      world.skyTop + unit,
      world.height * 0.38,
      climbing ? 2.4 : 1.2,
    )
    integrate(entity, dt)
    faceTravel(entity)
    tiltToVelocity(entity, climbing ? 30 : 14)
    keepInSky(entity, world, world.skyTop, Math.max(ceiling, Math.min(entity.y, world.groundY)))
    entity.lift = Math.sin(world.time * 2 + entity.id) * unit * 0.1
    entity.data.cool = (entity.data.cool ?? 0) - dt

    if (chance(0.03, dt)) {
      world.setState(entity, 'hoot')
      return
    }

    if ((entity.data.cool ?? 0) > 0) {
      return
    }

    const mothTarget = world.nearest(entity, isMoth, Math.max(world.width, world.height) * 0.7)
    const batTarget = world.nearest(entity, isBat, unit * 24)
    const target = batTarget && Math.random() < 0.24 ? batTarget : (mothTarget ?? batTarget)

    if (target) {
      entity.targetId = target.id
      world.setState(entity, 'swoop')
    } else {
      entity.data.cool = between(1, 2)
    }
  },
}

const bat: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('bat'),
  idle: 'flap',
  init(entity, world) {
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.48)
    entity.data.goalAt = 0
  },
  layer: 'front',
  size: [2.2, 3],
  state: 'flutter',
  tags: ['bat', 'predator'],
  tick(entity, world, dt) {
    const unit = world.unit
    const owlThreat = world.nearest(entity, isOwl, unit * 20)

    if (owlThreat) {
      world.setState(entity, 'flee')
      flee(entity, owlThreat, unit * 7.6, dt, 7)
      entity.vy += Math.sin(world.time * 14 + entity.id) * unit * dt * 2
    } else {
      const prey = world.nearest(entity, (other) => isMoth(other) || isFirefly(other), unit * 20)

      if (prey) {
        world.setState(entity, 'hunt')
        entity.targetId = prey.id
        steer(entity, prey.x, prey.y, unit * 6.4, dt, 4.6)
        eatIfClose(entity, prey, world, 1.25)
      } else {
        world.setState(entity, 'flutter')

        if ((entity.data.goalAt ?? 0) < world.time) {
          entity.data.goalX = between(world.width * 0.05, world.width * 0.95)
          entity.data.goalY = between(world.skyTop + unit, world.groundY - unit * 4)
          entity.data.goalAt = world.time + between(0.55, 1.35)
        }

        steer(
          entity,
          entity.data.goalX ?? entity.x,
          entity.data.goalY ?? entity.y,
          unit * between(3.2, 5),
          dt,
          5,
        )
      }
    }

    entity.vx += Math.sin(world.time * 9 + entity.id) * unit * dt * 1.4
    entity.vy += Math.cos(world.time * 11 + entity.id) * unit * dt * 1.1
    integrate(entity, dt)
    faceTravel(entity, 1)
    tiltToVelocity(entity, 26)
    keepInSky(entity, world, world.skyTop, world.groundY - unit * 2)
  },
}

const swan: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('swan'),
  idle: 'bob',
  init(entity, world) {
    entity.y = world.waterY
    entity.data.nextDip = between(4, 9)
  },
  layer: 'front',
  size: [4.2, 5.3],
  state: 'glide',
  tags: ['swan'],
  tick(entity, world, dt) {
    const unit = world.unit
    const margin = unit * 2
    entity.y = world.waterY + unit * 0.12

    if (entity.state === 'takeoff') {
      entity.lift = Math.min(unit * 5.5, entity.lift + unit * 5.2 * dt)
      entity.x += entity.facing * unit * 2.1 * dt
      entity.tilt = -8 * entity.facing

      if (entity.t > 1.1) {
        world.setState(entity, 'circle')
      }
      return
    }

    if (entity.state === 'circle') {
      entity.lift = unit * (4.2 + Math.sin(world.time * 3.2 + entity.id) * 0.8)
      entity.x += entity.facing * unit * 1.9 * dt
      entity.tilt = Math.sin(world.time * 2.4 + entity.id) * 9

      if (entity.x < margin) {
        entity.facing = 1
      } else if (entity.x > world.width - margin) {
        entity.facing = -1
      }

      if (entity.t > 4.3) {
        world.setState(entity, 'land')
      }
      return
    }

    if (entity.state === 'land') {
      entity.lift = Math.max(0, entity.lift - unit * 4.2 * dt)
      entity.tilt *= 0.9

      if (entity.lift <= unit * 0.1) {
        entity.lift = 0
        world.setState(entity, 'glide')
      }
      return
    }

    const jumpingFrog = world.nearest(
      entity,
      (other) => isFrog(other) && other.state === 'hop',
      unit * 9,
    )
    const closeBoat = world.nearest(entity, isBoat, world.widthOf(entity) * 0.8)

    if (jumpingFrog || closeBoat) {
      entity.facing = (jumpingFrog ?? closeBoat)!.x >= entity.x ? -1 : 1
      world.setState(entity, 'takeoff')
      return
    }

    if (entity.state === 'dip') {
      entity.vx *= 0.92
      entity.x += entity.vx * dt
      entity.lift = Math.sin(entity.t * 5) * unit * 0.04

      if (entity.t > 1.5) {
        entity.data.nextDip = between(5, 10)
        world.setState(entity, 'glide')
      }
      return
    }

    const boatFriend = world.nearest(entity, isBoat, Math.max(world.width, unit * 44))

    if (boatFriend) {
      const followX = clamp(
        boatFriend.x - boatFriend.facing * unit * 8,
        margin,
        world.width - margin,
      )
      const gap = followX - entity.x
      entity.facing = gap >= 0 ? 1 : -1
      entity.vx += (clamp(gap, -unit * 2, unit * 2) * 0.35 - entity.vx) * Math.min(1, dt * 1.6)
    } else {
      entity.vx += (entity.facing * unit * 0.28 - entity.vx) * Math.min(1, dt)
    }

    entity.x += entity.vx * dt
    entity.lift = Math.sin(world.time * 1.6 + entity.id) * unit * 0.07
    entity.tilt = Math.sin(world.time * 1.1 + entity.id) * 2

    if (entity.x < margin) {
      entity.x = margin
      entity.facing = 1
    } else if (entity.x > world.width - margin) {
      entity.x = world.width - margin
      entity.facing = -1
    }

    entity.data.nextDip = (entity.data.nextDip ?? 6) - dt

    if ((entity.data.nextDip ?? 0) <= 0) {
      world.setState(entity, 'dip')
    }
  },
}

const lilyPad: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('lily-pad'),
  countAs: null,
  init(entity, world) {
    entity.y = world.waterY + world.unit * 0.22
    entity.data.life = entity.user ? 80 : between(42, 72)
  },
  layer: 'front',
  size: [3.2, 4.4],
  state: 'float',
  tags: ['plant'],
  tick(entity, world, dt) {
    entity.y = world.waterY + world.unit * 0.22
    entity.lift = Math.sin(world.time * 1.1 + entity.id) * world.unit * 0.035
    entity.tilt = Math.sin(world.time * 0.8 + entity.id) * 2
    entity.data.life = (entity.data.life ?? 55) - dt

    if (
      !entity.user &&
      (entity.data.life ?? 0) <= 0 &&
      !world.nearest(entity, isFrog, world.unit * 2.3)
    ) {
      world.remove(entity)
    }
  },
}

const lilyFrog: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('lily-frog'),
  idle: 'bob',
  init(entity, world) {
    entity.y = world.waterY
    entity.data.nextHop = between(3.5, 7)
    entity.data.nextCroak = between(1.5, 4.5)
    ensurePad(entity, world)
  },
  layer: 'front',
  rest(entity, world) {
    entity.y = world.waterY
    entity.lift = 0
  },
  size: [2.6, 3.4],
  state: 'sit',
  style: (entity) => ({
    '--frog-tongue': `${entity.data.tongue ?? 0}rem`,
    '--frog-tongue-angle': `${entity.data.tongueAngle ?? 0}deg`,
  }),
  tags: ['frog', 'predator'],
  tick(entity, world, dt) {
    const unit = world.unit
    entity.y = world.waterY - unit * 0.1

    if (entity.state === 'hop') {
      const p = clamp(entity.t / (entity.data.hopFor ?? 0.9), 0, 1)
      const start = entity.data.startX ?? entity.x
      const target = entity.data.targetX ?? entity.x
      entity.x = start + (target - start) * p
      entity.lift = Math.sin(p * Math.PI) * unit * 2.1
      entity.facing = target >= start ? 1 : -1

      if (p >= 1) {
        entity.lift = 0
        ensurePad(entity, world)
        entity.data.nextHop = between(4, 8)
        world.setState(entity, 'sit')
      }
      return
    }

    if (entity.state === 'snap') {
      const prey = world.byId(entity.targetId)

      if (prey) {
        const dx = prey.x - entity.x
        const dy = prey.y - (entity.y - world.heightOf(entity) * 0.56)
        entity.facing = dx >= 0 ? 1 : -1
        entity.data.tongue = clamp(Math.hypot(dx, dy) / unit, 0, 13)
        entity.data.tongueAngle = clamp((Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI, -70, 28)

        if (entity.t > 0.18) {
          eatIfClose(entity, prey, world, 2.1)
        }
      }

      if (entity.t > 0.44) {
        entity.data.tongue = 0
        world.setState(entity, 'sit')
      }
      return
    }

    if (entity.state === 'croak') {
      entity.fx = 'croak'
      entity.data.tongue = 0
      entity.lift = Math.sin(entity.t * 10) * unit * 0.05

      for (const fireflyEntity of world.within(entity.x, entity.y, unit * 30, isFirefly)) {
        fireflyEntity.data.phase = 0
        fireflyEntity.data.croak = Math.max(fireflyEntity.data.croak ?? 0, 1.2)
      }

      if (entity.t > 1.1) {
        entity.fx = ''
        entity.lift = 0
        entity.data.nextCroak = between(6, 12)
        world.setState(entity, 'sit')
      }
      return
    }

    ensurePad(entity, world)
    entity.data.nextHop = (entity.data.nextHop ?? 5) - dt
    entity.data.nextCroak = (entity.data.nextCroak ?? 4) - dt
    entity.lift = Math.sin(world.time * 1.4 + entity.id) * unit * 0.04

    const prey = world.nearest(entity, isLowPrey(world), unit * 16)

    if (prey && chance(1.4, dt)) {
      entity.targetId = prey.id
      world.setState(entity, 'snap')
      return
    }

    if ((entity.data.nextCroak ?? 0) <= 0) {
      world.setState(entity, 'croak')
      return
    }

    if ((entity.data.nextHop ?? 0) <= 0) {
      const nearSwan = world.nearest(entity, isSwan, unit * 10)
      const away = nearSwan ? (nearSwan.x >= entity.x ? -1 : 1) : Math.random() < 0.5 ? -1 : 1
      entity.data.startX = entity.x
      entity.data.targetX = clamp(
        entity.x + away * between(4, 9) * unit,
        unit * 2,
        world.width - unit * 2,
      )
      entity.data.hopFor = between(0.72, 1.05)
      ensurePad({ ...entity, x: entity.data.targetX ?? entity.x } as EcoEntity, world)
      world.setState(entity, 'hop')
    }
  },
}

export const nightSpecies = {
  bat,
  boat,
  firefly,
  impact,
  lantern,
  'lily-frog': lilyFrog,
  'lily-pad': lilyPad,
  moth,
  owl,
  'shooting-star': shootingStar,
  swan,
}
