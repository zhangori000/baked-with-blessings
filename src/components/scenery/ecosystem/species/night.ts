import { ecoAsset } from '../assets'
import { between, faceTravel, integrate, keepInSky, steer, wander } from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

const isLantern = (world: EcoWorld) => (other: EcoEntity) => world.has(other, 'lantern')

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
  tags: [],
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
  tags: ['firefly'],
  tick(entity, world, dt) {
    const unit = world.unit
    const phase = entity.data.phase ?? 0
    let pull = 0
    let neighbours = 0

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
    entity.data.phase = (phase + ((entity.data.frequency ?? 3) + drift) * dt) % (Math.PI * 2)

    wander(entity, world, dt, unit * 0.8, world.groundY - unit * 9, world.groundY - unit, 1)
    integrate(entity, dt)
    faceTravel(entity, 2)
    keepInSky(entity, world, world.skyTop, world.groundY - unit * 0.5)
  },
}

export const nightSpecies = { boat, firefly, lantern, moth }
