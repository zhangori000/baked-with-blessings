import { ecoAsset, registerViewBoxes } from '../assets'
import {
  between,
  chance,
  clamp,
  faceTravel,
  hop,
  integrate,
  keepInSky,
  pick,
  settle,
  steer,
  tiltToVelocity,
  walk,
  walkToward,
  wander,
} from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoSpeciesMap, EcoWorld } from '../types'

registerViewBoxes({
  beam: [300, 76],
  chochin: [66, 86],
  crane: [132, 66],
  foxfire: [36, 44],
  kitsune: [120, 76],
  monk: [88, 104],
  'monk-charge': [112, 112],
  ninja: [82, 88],
  oni: [128, 112],
  'oni-blue': [128, 112],
  sakura: [128, 150],
  'sakura-petal': [30, 18],
  'sakura-sapling': [64, 92],
  samurai: [112, 108],
  sheep: [312, 310],
  'sheep-curious': [680, 480],
  'sheep-grin': [680, 480],
  'sheep-sleepy': [680, 480],
  shuriken: [48, 48],
  tanuki: [112, 76],
  'tanuki-teapot': [96, 72],
  torii: [92, 96],
  'torii-broken': [104, 92],
})

const sakuraBloomAsset = ecoAsset('sakura')
const sakuraSaplingAsset = ecoAsset('sakura-sapling')
const sakuraPetalAsset = ecoAsset('sakura-petal')
const toriiAsset = ecoAsset('torii')
const toriiBrokenAsset = ecoAsset('torii-broken')
const monkAsset = ecoAsset('monk')
const monkChargeAsset = ecoAsset('monk-charge')
const beamAsset = ecoAsset('beam')
const samuraiAsset = ecoAsset('samurai')
const oniAssets = [ecoAsset('oni'), ecoAsset('oni-blue')]
const ninjaAsset = ecoAsset('ninja')
const shurikenAsset = ecoAsset('shuriken')
const kitsuneAsset = ecoAsset('kitsune')
const foxfireAsset = ecoAsset('foxfire')
const tanukiAsset = ecoAsset('tanuki')
const tanukiTeapotAsset = ecoAsset('tanuki-teapot')
const craneAsset = ecoAsset('crane')
const chochinAsset = ecoAsset('chochin')
const sheepAssets = [
  ecoAsset('sheep'),
  ecoAsset('sheep-curious'),
  ecoAsset('sheep-grin'),
  ecoAsset('sheep-sleepy'),
]

const living = (entity: EcoEntity) => !entity.dying && !entity.removed
function clearTimedFx(entity: EcoEntity, dt: number) {
  if ((entity.data.hurt ?? 0) > 0) {
    entity.data.hurt = (entity.data.hurt ?? 0) - dt

    if ((entity.data.hurt ?? 0) <= 0 && entity.fx === 'hurt') {
      entity.fx = ''
    }
  }

  if ((entity.data.pop ?? 0) > 0) {
    entity.data.pop = (entity.data.pop ?? 0) - dt

    if ((entity.data.pop ?? 0) <= 0 && entity.fx === 'pop') {
      entity.fx = ''
    }
  }
}

function hurt(entity: EcoEntity, world: EcoWorld, amount = 1) {
  if (!living(entity)) {
    return
  }

  if (world.has(entity, 'torii')) {
    breakGate(entity, world)
    return
  }

  if (world.has(entity, 'tanuki') && entity.state !== 'teapot') {
    transformTanuki(entity, world)
    return
  }

  entity.hp -= amount
  entity.fx = 'hurt'
  entity.data.hurt = 0.35

  if (entity.hp <= 0) {
    world.kill(entity)
  }
}

function toriiRuins(world: EcoWorld) {
  return world.count((other) => other.species === 'gate-ruin')
}

function leakSpirit(x: number, world: EcoWorld) {
  if (!world.canBreed() || world.count((other) => other.species === 'foxfire') >= 18) {
    return
  }

  world.spawn('foxfire', {
    countAs: null,
    data: { life: between(5, 8) },
    x: clamp(x + between(-1.2, 1.2) * world.unit, world.unit, world.width - world.unit),
    y: world.groundY - between(3, 5) * world.unit,
  })
}

function breakGate(gate: EcoEntity, world: EcoWorld) {
  if (!living(gate) || gate.data.broken) {
    return
  }

  gate.data.broken = 1
  gate.fx = 'hurt'
  gate.hp = 0
  world.setAsset(gate, toriiBrokenAsset)
  world.setState(gate, 'collapse')

  for (const craneEntity of world.entities) {
    if (craneEntity.species === 'crane' && craneEntity.targetId === gate.id) {
      craneEntity.targetId = null
      craneEntity.fx = ''
      world.setState(craneEntity, 'fly')
    }
  }

  if (world.canBreed() && world.count((other) => other.species === 'oni') < 14) {
    world.spawn('oni', {
      data: { escaped: 1 },
      facing: Math.random() < 0.5 ? -1 : 1,
      x: clamp(gate.x + between(-1.1, 1.1) * world.unit, world.unit, world.width - world.unit),
      y: gate.y,
    })
  }

  if (world.canBreed() && toriiRuins(world) < 10) {
    world.spawn('gate-ruin', {
      countAs: null,
      data: { life: between(18, 28) },
      x: gate.x,
      y: gate.y,
    })
  }

  leakSpirit(gate.x, world)
  leakSpirit(gate.x, world)
}

function transformTanuki(entity: EcoEntity, world: EcoWorld) {
  entity.hp = Math.max(entity.hp, 2)
  entity.fx = 'pop'
  entity.data.pop = 0.7
  entity.vx = 0
  entity.vy = 0
  entity.lift = 0
  world.setAsset(entity, tanukiTeapotAsset)
  world.setState(entity, 'teapot')
}

function isBeamTarget(entity: EcoEntity, world: EcoWorld) {
  return living(entity) && (world.has(entity, 'torii') || world.has(entity, 'oni'))
}

function beamTargetFrom(entity: EcoEntity, world: EcoWorld) {
  const unit = world.unit
  const forward = world.entities
    .filter(
      (other) =>
        other !== entity &&
        isBeamTarget(other, world) &&
        Math.sign(other.x - entity.x || entity.facing) === entity.facing &&
        Math.abs(other.x - entity.x) > unit * 1.8,
    )
    .sort((a, b) => Math.abs(a.x - entity.x) - Math.abs(b.x - entity.x))[0]

  if (forward) {
    return forward
  }

  return world.nearest(
    entity,
    (other) => isBeamTarget(other, world),
    Math.max(world.width, unit * 50),
  )
}

function beamOrigin(entity: EcoEntity, world: EcoWorld) {
  return {
    x: entity.x + entity.facing * world.widthOf(entity) * 0.38,
    y: entity.y - entity.lift - world.heightOf(entity) * 0.46,
  }
}

function beamAim(target: EcoEntity, world: EcoWorld) {
  return {
    x: target.x,
    y: target.y - world.heightOf(target) * (world.has(target, 'torii') ? 0.52 : 0.58),
  }
}

function launchBeam(entity: EcoEntity, target: EcoEntity, world: EcoWorld) {
  const origin = beamOrigin(entity, world)
  const aim = beamAim(target, world)
  const dx = aim.x - origin.x
  const dy = aim.y - origin.y
  const length = Math.max(world.unit * 8, Math.hypot(dx, dy))
  const facing = dx >= 0 ? 1 : -1

  world.spawn('ki-beam', {
    countAs: null,
    data: {
      angle: (Math.atan2(dy, Math.abs(dx) || 1) * 180) / Math.PI,
      life: 1,
      targetId: target.id,
      zBoost: 5000,
    },
    facing,
    size: length / world.unit,
    x: origin.x + dx * 0.5,
    y: origin.y + dy * 0.5,
  })
}

function nearestLight(entity: EcoEntity, world: EcoWorld, reach: number) {
  return world.nearest(
    entity,
    (other) =>
      world.has(other, 'lantern') || other.species === 'foxfire' || world.has(other, 'fox'),
    reach,
  )
}

function nearestThreat(entity: EcoEntity, world: EcoWorld, reach: number) {
  return world.nearest(
    entity,
    (other) => world.has(other, 'oni') || world.has(other, 'beam') || world.has(other, 'shuriken'),
    reach,
  )
}

const sakura: EcoSpecies = {
  anchor: 'bottom',
  asset: sakuraSaplingAsset,
  burnTime: 5,
  idle: 'sway',
  init(entity) {
    entity.data.growth = entity.state === 'grow' ? 0 : 1
    entity.scale = entity.state === 'grow' ? 0.55 : 1
  },
  layer: 'front',
  rest(entity, world) {
    entity.scale = 1
    entity.data.growth = 1
    world.setAsset(entity, sakuraBloomAsset)
    world.setState(entity, 'bloom')
  },
  size: [3.7, 4.8],
  state: 'grow',
  tags: ['sakura', 'plant', 'fuel'],
  tick(entity, world, dt) {
    entity.data.water = Math.max(0, (entity.data.water ?? 0) - dt)
    const watered = (entity.data.water ?? 0) > 0

    if (entity.state === 'grow') {
      const rate = (entity.user ? 1 / 4 : 1 / 10) * (watered ? 2.8 : 1)
      const growth = Math.min(1, (entity.data.growth ?? 0) + dt * rate)

      entity.data.growth = growth
      entity.scale = 0.42 + growth * 0.58
      world.setAsset(entity, growth < 0.42 ? sakuraSaplingAsset : sakuraBloomAsset)

      if (growth >= 1) {
        world.setState(entity, 'bloom')
      }
      return
    }

    if (
      world.canBreed() &&
      world.count((other) => other.species === 'sakura-petal') < 34 &&
      chance(watered ? 1.2 : 0.55, dt)
    ) {
      world.spawn('sakura-petal', {
        countAs: null,
        vx: world.wind * between(0.35, 0.9),
        vy: world.unit * between(0.2, 0.8),
        x: entity.x + between(-1.8, 1.8) * world.unit,
        y: entity.y - world.heightOf(entity) * between(0.72, 0.95),
      })
    }
  },
}

const sakuraPetal: EcoSpecies = {
  anchor: 'center',
  asset: sakuraPetalAsset,
  countAs: null,
  layer: 'front',
  size: [0.55, 0.85],
  state: 'drift',
  tags: [],
  tick(entity, world, dt) {
    entity.vx += (world.wind * 0.55 - entity.vx) * Math.min(1, dt * 0.6)
    entity.vy += (world.unit * 0.9 - entity.vy) * Math.min(1, dt * 0.8)
    entity.vx += Math.sin(world.time * 1.4 + entity.id) * world.unit * 0.2 * dt
    entity.tilt = Math.sin(world.time * 2.1 + entity.id) * 38
    integrate(entity, dt)

    if (
      entity.y > world.groundY + world.unit * 0.6 ||
      entity.age > 12 ||
      entity.x < -20 ||
      entity.x > world.width + 20
    ) {
      world.remove(entity)
    }
  },
}

const torii: EcoSpecies = {
  anchor: 'bottom',
  asset: toriiAsset,
  hp: 3,
  layer: 'front',
  size: [4.6, 5.6],
  state: 'stand',
  tags: ['torii', 'building', 'target'],
  tick(entity, world) {
    if (entity.state === 'collapse' && entity.t > 0.58) {
      world.kill(entity)
    }
  },
}

const gateRuin: EcoSpecies = {
  anchor: 'bottom',
  asset: toriiBrokenAsset,
  countAs: null,
  layer: 'front',
  size: [4.6, 5.6],
  state: 'ruin',
  tags: ['spirit'],
  tick(entity, world) {
    if (entity.age > (entity.data.life ?? 24)) {
      world.kill(entity)
    }
  },
}

const monk: EcoSpecies = {
  anchor: 'bottom',
  asset: monkAsset,
  hp: 3,
  init(entity) {
    entity.data.cool = between(1, 2.5)
  },
  layer: 'front',
  size: [3.7, 4.4],
  state: 'meditate',
  tags: ['monk', 'target'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.hp <= 0) {
      world.kill(entity)
      return
    }

    if (entity.state === 'charge') {
      world.setAsset(entity, monkChargeAsset)
      entity.lift = world.unit * (0.3 + Math.sin(entity.t * 9) * 0.08)
      const target = world.byId(entity.targetId)

      if (!target || !isBeamTarget(target, world)) {
        entity.targetId = null
        world.setAsset(entity, monkAsset)
        world.setState(entity, 'meditate')
        return
      }

      entity.facing = target.x >= entity.x ? 1 : -1

      if (entity.t > 0.82 && !entity.data.fired) {
        entity.data.fired = 1
        launchBeam(entity, target, world)
      }

      if (entity.t > 1.75) {
        entity.data.cool = between(4, 6)
        entity.data.fired = 0
        world.setAsset(entity, monkAsset)
        world.setState(entity, 'recover')
      }
      return
    }

    if (entity.state === 'recover') {
      entity.lift = Math.max(0, entity.lift - world.unit * dt)

      if (entity.t > 0.8) {
        world.setState(entity, 'meditate')
      }
      return
    }

    entity.lift = world.unit * (0.24 + Math.sin(world.time * 2.1 + entity.id) * 0.12)
    entity.data.cool = (entity.data.cool ?? 0) - dt

    if ((entity.data.cool ?? 0) <= 0) {
      const target = beamTargetFrom(entity, world)

      if (target) {
        entity.targetId = target.id
        entity.facing = target.x >= entity.x ? 1 : -1
        entity.data.fired = 0
        world.setState(entity, 'charge')
      } else {
        entity.data.cool = 1.2
      }
    }
  },
}

const kiBeam: EcoSpecies = {
  anchor: 'center',
  asset: beamAsset,
  countAs: null,
  layer: 'front',
  size: [8, 8],
  state: 'blast',
  style: (entity) => ({
    '--blossom-beam-alpha': `${clamp(1 - Math.max(0, entity.t - 0.78) / 0.22, 0, 1)}`,
  }),
  tags: ['beam', 'projectile'],
  tick(entity, world) {
    entity.tilt = entity.data.angle ?? 0

    if (entity.t > 0.18 && !entity.data.hit) {
      entity.data.hit = 1
      const target = world.byId(entity.data.targetId ?? null)

      if (target && isBeamTarget(target, world)) {
        if (world.has(target, 'torii')) {
          breakGate(target, world)
        } else {
          hurt(target, world, 4)
        }
      }
    }

    if (entity.t > 0.78) {
      world.setState(entity, 'fade')
    }

    if (entity.t > (entity.data.life ?? 1)) {
      world.remove(entity)
    }
  },
}

const oni: EcoSpecies = {
  anchor: 'bottom',
  asset: () => pick(oniAssets),
  hp: 3,
  idle: 'trot',
  init(entity) {
    entity.data.cool = between(0.3, 1)
  },
  layer: 'front',
  size: [4.8, 5.8],
  state: 'lumber',
  tags: ['oni', 'predator', 'target'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.hp <= 0) {
      world.kill(entity)
      return
    }

    const unit = world.unit
    const fear = nearestLight(entity, world, unit * 12)

    if (fear && entity.state !== 'smash') {
      entity.facing = fear.x >= entity.x ? -1 : 1
      walk(entity, world, dt, unit * 2.4)
      hop(entity, dt, unit * 0.25, 6)
      world.setState(entity, 'flee')
      return
    }

    if (entity.state === 'smash') {
      const target = world.byId(entity.targetId)
      settle(entity, dt)

      if (!target) {
        entity.targetId = null
        world.setState(entity, 'lumber')
        return
      }

      entity.facing = target.x >= entity.x ? 1 : -1

      if (entity.t > 0.42 && !entity.data.hit) {
        entity.data.hit = 1

        if (world.has(target, 'torii')) {
          breakGate(target, world)
        } else if (world.has(target, 'sheep')) {
          world.kill(target)
        } else {
          hurt(target, world, 2)
        }
      }

      if (entity.t > 0.9) {
        entity.data.hit = 0
        entity.targetId = null
        world.setState(entity, 'lumber')
      }
      return
    }

    const target = world.nearest(
      entity,
      (other) =>
        (world.has(other, 'torii') && other.state !== 'collapse') ||
        world.has(other, 'sheep') ||
        (world.has(other, 'tanuki') && other.state !== 'teapot'),
      Math.max(world.width, unit * 45),
    )

    if (target) {
      entity.targetId = target.id
      const gap = walkToward(entity, world, target.x, unit * 1.15, dt)
      hop(entity, dt, unit * 0.12, 3.5)

      if (gap < unit * 2.1) {
        entity.data.hit = 0
        world.setState(entity, 'smash')
      }
      return
    }

    walk(entity, world, dt, unit * 0.8)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const samurai: EcoSpecies = {
  anchor: 'bottom',
  asset: samuraiAsset,
  hp: 3,
  idle: 'trot',
  init(entity) {
    entity.data.cool = between(0.5, 1.5)
    entity.data.bowCool = between(2, 5)
  },
  layer: 'front',
  size: [3.8, 4.6],
  state: 'patrol',
  tags: ['samurai', 'target'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.hp <= 0) {
      world.kill(entity)
      return
    }

    const unit = world.unit
    const incoming = world.nearest(entity, (other) => world.has(other, 'shuriken'), unit * 7)

    if (incoming && entity.state !== 'slash' && entity.state !== 'dash') {
      entity.facing = incoming.x >= entity.x ? 1 : -1
      entity.fx = 'guard'
      world.setState(entity, 'guard')
    }

    if (entity.state === 'guard') {
      settle(entity, dt)

      if (entity.t > 0.62) {
        entity.fx = ''
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'bow') {
      settle(entity, dt)

      if (entity.t > 0.95) {
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'slash') {
      const target = world.byId(entity.targetId)
      settle(entity, dt)

      if (target) {
        entity.facing = target.x >= entity.x ? 1 : -1
      }

      if (target && entity.t > 0.18 && !entity.data.hit) {
        entity.data.hit = 1
        hurt(target, world, world.has(target, 'oni') ? 1 : 2)
      }

      if (entity.t > 0.52) {
        entity.data.hit = 0
        entity.targetId = null
        entity.data.cool = between(0.7, 1.2)
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'dash') {
      const target = world.byId(entity.targetId)

      if (!target) {
        entity.targetId = null
        world.setState(entity, 'patrol')
        return
      }

      const gap = walkToward(entity, world, target.x, unit * 5.2, dt)
      hop(entity, dt, unit * 0.28, 8)

      if (gap < unit * 1.8) {
        entity.data.hit = 0
        world.setState(entity, 'slash')
      } else if (entity.t > 1.4) {
        entity.targetId = null
        world.setState(entity, 'patrol')
      }
      return
    }

    entity.data.cool = (entity.data.cool ?? 0) - dt
    entity.data.bowCool = (entity.data.bowCool ?? 0) - dt

    const monkEntity = world.nearest(entity, (other) => world.has(other, 'monk'), unit * 5.5)

    if (monkEntity && (entity.data.bowCool ?? 0) <= 0) {
      entity.facing = monkEntity.x >= entity.x ? 1 : -1
      entity.data.bowCool = between(8, 12)
      world.setState(entity, 'bow')
      return
    }

    const target = world.nearest(
      entity,
      (other) =>
        world.has(other, 'oni') ||
        (world.has(other, 'ninja') && (other.state !== 'hidden' || other.fx === 'revealed')),
      Math.max(world.width, unit * 45),
    )

    if (target && (entity.data.cool ?? 0) <= 0) {
      entity.targetId = target.id
      world.setState(entity, 'dash')
      return
    }

    walk(entity, world, dt, unit * 0.75)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const ninja: EcoSpecies = {
  anchor: 'bottom',
  asset: ninjaAsset,
  hp: 1,
  init(entity) {
    entity.data.cool = between(1, 2.2)
  },
  layer: 'front',
  size: [3.1, 3.8],
  state: 'hidden',
  tags: ['ninja', 'target'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.hp <= 0) {
      world.kill(entity)
      return
    }

    const unit = world.unit
    const light = world.nearest(entity, (other) => world.has(other, 'lantern'), unit * 10)
    const samuraiNear = world.nearest(entity, (other) => world.has(other, 'samurai'), unit * 6)

    if (entity.state === 'smoke') {
      entity.lift = Math.sin(Math.min(1, entity.t / 0.45) * Math.PI) * unit * 0.9

      if (entity.t > 0.45) {
        entity.x = clamp(between(world.width * 0.08, world.width * 0.92), unit, world.width - unit)
        entity.lift = 0
        entity.targetId = null
        entity.data.cool = between(1.1, 2.5)
        entity.fx = light ? 'revealed' : ''
        world.setState(entity, light ? 'revealed' : 'hidden')
      }
      return
    }

    if (light) {
      entity.fx = 'revealed'

      if (entity.state === 'hidden') {
        world.setState(entity, 'revealed')
      }
    } else if (entity.fx === 'revealed') {
      entity.fx = ''

      if (entity.state === 'revealed') {
        world.setState(entity, 'hidden')
      }
    }

    if (samuraiNear && light && entity.state !== 'throw') {
      world.setState(entity, 'smoke')
      entity.fx = 'smoke'
      return
    }

    if (entity.state === 'throw') {
      const target = world.byId(entity.targetId)

      if (!target) {
        world.setState(entity, light ? 'revealed' : 'hidden')
        return
      }

      entity.facing = target.x >= entity.x ? 1 : -1

      if (entity.t > 0.42 && !entity.data.threw) {
        entity.data.threw = 1
        const startX = entity.x + entity.facing * world.widthOf(entity) * 0.34
        const startY = entity.y - world.heightOf(entity) * 0.58
        const aimY = target.y - world.heightOf(target) * 0.62
        const dx = target.x - startX
        const dy = aimY - startY
        const speed = unit * 9.5
        const gap = Math.hypot(dx, dy) || 1

        world.spawn('shuriken', {
          countAs: null,
          vx: (dx / gap) * speed,
          vy: (dy / gap) * speed,
          x: startX,
          y: startY,
        })
      }

      if (entity.t > 0.8) {
        entity.data.cool = between(2.6, 4.4)
        entity.data.threw = 0
        world.setState(entity, light ? 'revealed' : 'hidden')
      }
      return
    }

    entity.data.cool = (entity.data.cool ?? 0) - dt
    walk(entity, world, dt, unit * 0.55)

    if (chance(0.06, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    if ((entity.data.cool ?? 0) <= 0) {
      const target = world.nearest(
        entity,
        (other) => world.has(other, 'samurai') || world.has(other, 'monk'),
        Math.max(world.width, unit * 42),
      )

      if (target) {
        entity.targetId = target.id
        entity.data.threw = 0
        world.setState(entity, 'throw')
      } else {
        entity.data.cool = 1.3
      }
    }
  },
}

const shuriken: EcoSpecies = {
  anchor: 'center',
  asset: shurikenAsset,
  countAs: null,
  layer: 'front',
  size: [0.9, 1.15],
  state: 'fly',
  tags: ['projectile', 'shuriken'],
  tick(entity, world, dt) {
    integrate(entity, dt)
    entity.tilt += dt * 720

    if (entity.x < -world.unit * 2 || entity.x > world.width + world.unit * 2 || entity.age > 4) {
      world.remove(entity)
      return
    }

    const blocker = world.nearest(
      entity,
      (other) => world.has(other, 'samurai') && other.state === 'guard',
      world.unit * 2.6,
    )

    if (blocker) {
      blocker.fx = 'block'
      blocker.data.hurt = 0.25
      world.remove(entity)
      return
    }

    const hit = world.nearest(
      entity,
      (other) =>
        world.has(other, 'samurai') ||
        world.has(other, 'monk') ||
        world.has(other, 'lantern') ||
        world.has(other, 'tanuki'),
      world.unit * 1.5,
    )

    if (!hit) {
      return
    }

    if (world.has(hit, 'lantern')) {
      world.kill(hit)
    } else {
      hurt(hit, world, 1)
    }

    world.remove(entity)
  },
}

const kitsune: EcoSpecies = {
  anchor: 'bottom',
  asset: kitsuneAsset,
  idle: 'trot',
  init(entity) {
    entity.data.cool = between(0.5, 1.5)
  },
  layer: 'front',
  particles: { asset: foxfireAsset, count: 3, effect: 'sparkles' },
  size: [3.5, 4.5],
  state: 'trot',
  tags: ['fox', 'spirit'],
  tick(entity, world, dt) {
    const unit = world.unit
    const ruin = world.nearest(entity, (other) => other.species === 'gate-ruin', unit * 56)

    if (ruin) {
      entity.targetId = ruin.id
      const gap = walkToward(entity, world, ruin.x, unit * 1.8, dt)
      hop(entity, dt, unit * 0.18, 5)
      world.setState(entity, 'restore')

      if (
        gap < unit * 1.8 &&
        entity.t > 0.9 &&
        world.canBreed() &&
        world.count((other) => world.has(other, 'torii')) < 12
      ) {
        world.spawn('torii', { x: ruin.x, y: ruin.y })
        world.kill(ruin)
        entity.targetId = null
        entity.data.cool = between(3, 5)
        world.setState(entity, 'trot')
      }
      return
    }

    if (entity.state === 'restore') {
      world.setState(entity, 'trot')
    }

    walk(entity, world, dt, unit * 0.9)
    hop(entity, dt, unit * 0.14, 5)
    entity.data.cool = (entity.data.cool ?? 0) - dt

    if (chance(0.06, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    if ((entity.data.cool ?? 0) <= 0) {
      leakSpirit(entity.x + entity.facing * unit, world)
      entity.data.cool = between(4, 8)
    }
  },
}

const foxfire: EcoSpecies = {
  anchor: 'center',
  asset: foxfireAsset,
  countAs: null,
  idle: 'glow',
  init(entity) {
    entity.data.life = entity.data.life ?? between(8, 12)
  },
  layer: 'front',
  size: [1.1, 1.6],
  state: 'float',
  tags: ['spirit'],
  tick(entity, world, dt) {
    wander(
      entity,
      world,
      dt,
      world.unit * 1.4,
      world.groundY - world.unit * 7,
      world.groundY - world.unit * 2.5,
      1.4,
    )
    integrate(entity, dt)
    keepInSky(entity, world, world.skyTop, world.groundY - world.unit * 1.8)
    entity.lift = Math.sin(world.time * 2.4 + entity.id) * world.unit * 0.16

    if (entity.age > (entity.data.life ?? 10)) {
      world.remove(entity)
    }
  },
}

const tanuki: EcoSpecies = {
  anchor: 'bottom',
  asset: tanukiAsset,
  hp: 2,
  idle: 'trot',
  init(entity) {
    entity.data.rest = between(2, 5)
  },
  layer: 'front',
  size: [3.2, 4],
  state: 'wander',
  tags: ['tanuki', 'prey', 'target'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.state === 'teapot') {
      entity.hp = Math.max(entity.hp, 2)
      settle(entity, dt)

      if (entity.t > 2.3) {
        world.setAsset(entity, tanukiAsset)
        world.setState(entity, 'wander')
      }
      return
    }

    const threat = nearestThreat(entity, world, world.unit * 6.4)

    if (threat) {
      transformTanuki(entity, world)
      return
    }

    const tree = world.nearest(
      entity,
      (other) =>
        world.has(other, 'sakura') && other.state === 'bloom' && (other.data.burn ?? 0) <= 0,
      world.unit * 18,
    )

    if (entity.state === 'nap') {
      settle(entity, dt)

      if (!tree || entity.t > 6) {
        world.setState(entity, 'wander')
      }
      return
    }

    if (tree && (entity.data.rest ?? 0) <= 0) {
      const targetX = tree.x + entity.facing * world.unit * 1.5
      const gap = walkToward(entity, world, targetX, world.unit * 1.1, dt)

      if (gap < world.unit * 0.8) {
        entity.data.rest = between(6, 10)
        world.setState(entity, 'nap')
      }
      return
    }

    entity.data.rest = (entity.data.rest ?? 0) - dt
    walk(entity, world, dt, world.unit * 0.8)
    hop(entity, dt, world.unit * 0.1, 3)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const crane: EcoSpecies = {
  anchor: 'center',
  asset: craneAsset,
  idle: 'flap',
  init(entity, world) {
    entity.y = between(world.skyTop + world.unit, world.groundY - world.unit * 7)
    entity.facing = Math.random() < 0.5 ? -1 : 1
    entity.vx = entity.facing * world.unit * between(1.4, 2.1)
  },
  layer: 'front',
  size: [3.8, 4.8],
  state: 'fly',
  tags: ['bird'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'perch') {
      const gate = world.byId(entity.targetId)

      if (!gate || gate.state === 'collapse' || gate.fx === 'hurt') {
        entity.targetId = null
        entity.fx = ''
        entity.vx = entity.facing * unit * 1.8
        world.setState(entity, 'fly')
        return
      }

      entity.x = gate.x
      entity.y = gate.y - world.heightOf(gate) - unit * 0.25
      entity.lift = Math.sin(world.time * 2 + entity.id) * unit * 0.08

      if (entity.t > (entity.data.perchFor ?? 9)) {
        entity.fx = ''
        entity.targetId = null
        entity.vx = entity.facing * unit * 1.8
        entity.data.perchCool = world.time + between(6, 10)
        world.setState(entity, 'fly')
      }
      return
    }

    if (entity.state === 'approach') {
      const gate = world.byId(entity.targetId)

      if (!gate || gate.state === 'collapse' || entity.t > 14) {
        entity.targetId = null
        entity.vx = entity.facing * unit * 1.8
        entity.vy = 0
        entity.data.perchCool = world.time + between(6, 10)
        world.setState(entity, 'fly')
        return
      }

      const gap = steer(
        entity,
        gate.x,
        gate.y - world.heightOf(gate) - unit * 0.4,
        unit * 3.4,
        dt,
        2,
      )
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 18)

      if (gap < unit * 1.1) {
        entity.vx = 0
        entity.vy = 0
        entity.data.perchFor = between(7, 12)
        entity.fx = 'perched'
        entity.tilt = 0
        world.setState(entity, 'perch')
      }
      return
    }

    const gate =
      world.time > (entity.data.perchCool ?? 0)
        ? world.nearest(
            entity,
            (other) =>
              world.has(other, 'torii') &&
              other.state !== 'collapse' &&
              Math.abs(other.x - entity.x) < unit * 18,
          )
        : null

    if (gate && chance(0.4, dt)) {
      entity.targetId = gate.id
      world.setState(entity, 'approach')
      return
    }

    entity.x += entity.vx * dt
    entity.y += Math.sin(world.time * 1.1 + entity.id) * unit * 0.22 * dt
    entity.facing = entity.vx >= 0 ? 1 : -1

    if (entity.x < -unit * 5) {
      entity.x = world.width + unit * 5
    } else if (entity.x > world.width + unit * 5) {
      entity.x = -unit * 5
    }

    const low = world.groundY - unit * 5
    entity.tilt *= 0.9
    entity.y =
      entity.y > low
        ? entity.y - Math.min(entity.y - low, unit * 2 * dt)
        : Math.max(entity.y, world.skyTop + unit)
  },
}

const chochin: EcoSpecies = {
  anchor: 'center',
  asset: chochinAsset,
  hp: 1,
  idle: 'glow',
  init(entity, world) {
    entity.y = world.groundY - between(4.5, 6.5) * world.unit
  },
  layer: 'front',
  size: [2.3, 3.1],
  state: 'float',
  tags: ['lantern'],
  tick(entity, world, dt) {
    wander(
      entity,
      world,
      dt,
      world.unit * 0.9,
      world.groundY - world.unit * 7.5,
      world.groundY - world.unit * 3.4,
      1.3,
    )
    integrate(entity, dt)
    entity.lift = Math.sin(world.time * 2.3 + entity.id) * world.unit * 0.16
    keepInSky(entity, world, world.skyTop + world.unit, world.groundY - world.unit * 2.7)
  },
}

const sheep: EcoSpecies = {
  anchor: 'bottom',
  asset: () => pick(sheepAssets),
  burnTime: 2.5,
  idle: 'trot',
  layer: 'front',
  size: [3.2, 4],
  state: 'graze',
  tags: ['sheep', 'prey', 'burnable', 'target'],
  tick(entity, world, dt) {
    const unit = world.unit
    const threat = world.nearest(entity, (other) => world.has(other, 'oni'), unit * 12)

    if (threat) {
      entity.facing = threat.x >= entity.x ? -1 : 1
      walk(entity, world, dt, unit * 2.7)
      hop(entity, dt, unit * 0.45, 7)
      world.setState(entity, 'flee')
      return
    }

    const tree = world.nearest(
      entity,
      (other) =>
        world.has(other, 'sakura') && other.state === 'bloom' && (other.data.burn ?? 0) <= 0,
      unit * 14,
    )

    if (entity.state === 'sleep') {
      settle(entity, dt)

      if (!tree || entity.t > (entity.data.sleepFor ?? 8)) {
        world.setState(entity, 'graze')
      }
      return
    }

    if (tree && chance(0.18, dt)) {
      const shadeX = clamp(tree.x + between(-1.8, 1.8) * unit, unit, world.width - unit)

      if (walkToward(entity, world, shadeX, unit * 0.95, dt) < unit * 0.7) {
        entity.data.sleepFor = between(6, 10)
        world.setState(entity, 'sleep')
      }
      return
    }

    if (entity.state === 'flee' && entity.t > 1.4) {
      world.setState(entity, 'graze')
    }

    walk(entity, world, dt, unit * 0.7)
    hop(entity, dt, unit * 0.12, 3.5)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

export const blossomSpecies: EcoSpeciesMap = {
  chochin,
  crane,
  foxfire,
  'gate-ruin': gateRuin,
  'ki-beam': kiBeam,
  kitsune,
  monk,
  ninja,
  oni,
  sakura,
  'sakura-petal': sakuraPetal,
  samurai,
  sheep,
  shuriken,
  tanuki,
  torii,
}
