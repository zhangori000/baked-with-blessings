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
  'koi-pond': [220, 90],
  'koi-dragon': [260, 140],
  foxfire: [36, 44],
  kappa: [106, 94],
  'kappa-spilled': [106, 94],
  monk: [130, 140],
  'monk-charge': [130, 140],
  ninja: [130, 125],
  oni: [160, 140],
  'oni-blue': [160, 140],
  sakura: [128, 150],
  'sakura-petal': [30, 18],
  'sakura-sapling': [64, 92],
  samurai: [150, 140],
  sheep: [312, 310],
  'sheep-curious': [680, 480],
  'sheep-grin': [680, 480],
  'sheep-sleepy': [680, 480],
  shuriken: [48, 48],
  sumo: [156, 160],
  'sumo-charge': [156, 160],
  'sumo-shove': [156, 160],
  'sumo-tsuppari': [156, 160],
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
const koiPondAsset = ecoAsset('koi-pond')
const koiDragonAsset = ecoAsset('koi-dragon')
const kappaAsset = ecoAsset('kappa')
const kappaSpilledAsset = ecoAsset('kappa-spilled')
const foxfireAsset = ecoAsset('foxfire')
const sumoAsset = ecoAsset('sumo')
const sumoChargeAsset = ecoAsset('sumo-charge')
const sumoShoveAsset = ecoAsset('sumo-shove')
const sumoTsuppariAsset = ecoAsset('sumo-tsuppari')
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

    if ((entity.data.hurt ?? 0) <= 0 && (entity.fx === 'hurt' || entity.fx === 'fed')) {
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

function hurt(entity: EcoEntity, world: EcoWorld, amount = 1, attacker?: EcoEntity) {
  if (!living(entity)) {
    return
  }

  if (world.has(entity, 'torii')) {
    if (attacker && world.edge(attacker, entity) < 1) {
      entity.hp -= amount * world.edge(attacker, entity)
      entity.fx = 'hurt'
      entity.data.hurt = 0.35

      if (entity.hp <= 0) {
        breakGate(entity, world)
      }
    } else {
      breakGate(entity, world)
    }
    return
  }

  entity.hp -= amount * (attacker ? world.edge(attacker, entity) : 1)
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

function isBeamTarget(entity: EcoEntity, world: EcoWorld) {
  return (
    living(entity) &&
    (world.has(entity, 'torii') || world.has(entity, 'oni') || entity.species === 'koi-dragon')
  )
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
      world.has(other, 'lantern') || other.species === 'foxfire' || other.species === 'koi-dragon',
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
  strongVs: ['koi-pond'],
  tags: ['sakura', 'plant', 'fuel'],
  weakTo: ['sheep', 'oni', 'fire'],
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
  strongVs: ['spirit'],
  tags: ['torii', 'building', 'target'],
  weakTo: ['oni', 'monk'],
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
  size: [3.6, 4.4],
  state: 'meditate',
  strongVs: ['oni', 'torii'],
  tags: ['monk', 'target'],
  weakTo: ['ninja'],
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
  strongVs: ['oni', 'torii'],
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
          hurt(target, world, target.species === 'koi-dragon' ? 2 : 4, entity)
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
  size: [5.2, 6.2],
  state: 'lumber',
  strongVs: ['torii', 'sheep', 'koi-pond'],
  tags: ['oni', 'predator', 'target'],
  weakTo: ['monk', 'samurai', 'lantern', 'foxfire', 'koi-dragon', 'sumo'],
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
        } else if (target.species === 'koi-pond') {
          target.data.fish = Math.max(0, (target.data.fish ?? 4) - 2)
          hurt(target, world, 1.4, entity)
        } else {
          hurt(target, world, 2, entity)
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
        other.species === 'koi-pond',
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
  size: [4, 4.8],
  state: 'patrol',
  strongVs: ['ninja', 'oni'],
  tags: ['samurai', 'target'],
  weakTo: ['monk', 'kappa', 'sumo'],
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
        hurt(target, world, world.has(target, 'oni') ? 1 : 2, entity)
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
        world.has(other, 'fox') ||
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
  size: [3.2, 4],
  state: 'hidden',
  strongVs: ['monk', 'sumo'],
  tags: ['ninja', 'target'],
  weakTo: ['samurai', 'lantern', 'kappa'],
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
        (other) =>
          world.has(other, 'samurai') ||
          world.has(other, 'monk') ||
          other.species === 'sumo' ||
          other.species === 'kappa' ||
          other.species === 'koi-dragon',
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
  strongVs: ['monk', 'lantern', 'kappa', 'sumo', 'koi-dragon'],
  tags: ['projectile', 'shuriken'],
  weakTo: ['samurai'],
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
        other.species === 'kappa' ||
        other.species === 'sumo' ||
        other.species === 'koi-dragon' ||
        world.has(other, 'lantern'),
      world.unit * 1.5,
    )

    if (!hit) {
      return
    }

    if (hit.species === 'kappa') {
      spillKappa(hit, world, entity)
    } else if (hit.species === 'sumo') {
      hit.fx = 'hurt'
      world.setState(hit, 'trip')
      hurt(hit, world, 1, entity)
    } else if (world.has(hit, 'lantern')) {
      world.kill(hit)
    } else {
      hurt(hit, world, 1, entity)
    }

    world.remove(entity)
  },
}

function koiFullness(entity: EcoEntity) {
  return clamp((entity.data.fish ?? 5) / 6, 0, 1)
}

function feedKoi(pond: EcoEntity, world: EcoWorld, amount = 1) {
  if (!living(pond) || pond.state === 'empty') {
    return
  }

  pond.data.fed = (pond.data.fed ?? 0) + amount
  pond.data.fish = Math.min(6, (pond.data.fish ?? 4) + amount * 0.35)
  pond.fx = 'fed'
  pond.data.hurt = 0.45

  const gate = world.nearest(
    pond,
    (other) => world.has(other, 'torii') && other.state !== 'collapse',
    world.unit * 26,
  )
  const need = gate ? 5 : 7

  if (
    (pond.data.fed ?? 0) >= need &&
    world.canBreed() &&
    world.count((other) => other.species === 'koi-dragon') < 4
  ) {
    pond.data.fed = 0
    pond.data.fish = Math.max(2, (pond.data.fish ?? 5) - 1.5)
    world.spawn('koi-dragon', {
      data: { ascendFromY: pond.y, gateId: gate?.id ?? 0, life: between(18, 26) },
      facing: Math.random() < 0.5 ? -1 : 1,
      state: 'ascend',
      x: pond.x,
      y: pond.y - world.unit * 0.8,
    })
    world.setState(pond, 'ripen')
  }
}

function spillKappa(entity: EcoEntity, world: EcoWorld, from?: EcoEntity) {
  if (!living(entity) || entity.state === 'spilled') {
    return
  }

  entity.targetId = null
  entity.fx = 'hurt'
  entity.data.water = 0
  entity.data.recover = between(2.2, 3.6)
  entity.facing = from ? (from.x >= entity.x ? -1 : 1) : entity.facing === 1 ? -1 : 1
  world.setAsset(entity, kappaSpilledAsset)
  world.setState(entity, 'spilled')
}

function shoveTarget(entity: EcoEntity, target: EcoEntity, world: EcoWorld, amount = 1.2) {
  target.vx += entity.facing * world.unit * 5.4
  target.x = clamp(
    target.x + entity.facing * world.unit * 0.9,
    world.unit,
    world.width - world.unit,
  )
  target.fx = 'hurt'

  if (target.species === 'kappa') {
    spillKappa(target, world, entity)
  } else {
    hurt(target, world, amount, entity)
  }
}

const koiPond: EcoSpecies = {
  anchor: 'bottom',
  asset: koiPondAsset,
  hp: 4,
  idle: 'bob',
  init(entity) {
    entity.data.fish = between(3.5, 5.5)
    entity.data.fed = 0
  },
  layer: 'front',
  size: [5.8, 6.8],
  state: 'ripple',
  strongVs: ['sakura', 'foxfire'],
  style: (entity) => ({
    '--blossom-koi-fullness': `${koiFullness(entity).toFixed(2)}`,
  }),
  tags: ['plant', 'target'],
  weakTo: ['kappa', 'oni', 'ninja'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.state === 'empty') {
      entity.data.fish = Math.min(3, (entity.data.fish ?? 0) + dt * 0.14)

      if ((entity.data.fish ?? 0) >= 1.2) {
        world.setState(entity, 'ripple')
      }
      return
    }

    if (entity.state === 'ripen' && entity.t > 1.2) {
      world.setState(entity, 'ripple')
    }

    const unit = world.unit
    const petal = world.nearest(
      entity,
      (other) => other.species === 'sakura-petal' && other.y > world.groundY - unit * 8,
      unit * 8,
    )

    if (petal) {
      world.remove(petal)
      feedKoi(entity, world, 0.65)
    }

    const spirit = world.nearest(entity, (other) => other.species === 'foxfire', unit * 7)

    if (spirit && chance(0.7, dt)) {
      world.remove(spirit)
      feedKoi(entity, world, 1.4)
    }

    const kappa = world.nearest(
      entity,
      (other) => other.species === 'kappa' && other.state !== 'spilled',
      unit * 5.2,
    )

    if (kappa && chance(0.45, dt)) {
      entity.data.fish = Math.max(0, (entity.data.fish ?? 4) - 0.35)
      entity.fx = 'hurt'
      entity.data.hurt = 0.35
    }

    if ((entity.data.fish ?? 0) <= 0.25) {
      entity.fx = ''
      entity.data.fed = 0
      world.setState(entity, 'empty')
    }
  },
}

const koiDragon: EcoSpecies = {
  anchor: 'center',
  asset: koiDragonAsset,
  hp: 3,
  idle: 'undulate',
  init(entity, world) {
    entity.data.life = entity.data.life ?? between(18, 26)
    if (entity.data.ascendFromY) {
      entity.data.ascendStartY = entity.data.ascendFromY
      entity.data.ascendTargetY = clamp(
        entity.data.ascendFromY - world.unit * 5.2,
        world.skyTop + world.unit,
        world.groundY - world.unit * 5,
      )
      entity.y = entity.data.ascendStartY
    } else {
      entity.y = clamp(entity.y, world.skyTop + world.unit, world.groundY - world.unit * 5)
    }
  },
  layer: 'front',
  size: [5.4, 6.8],
  state: 'soar',
  strongVs: ['oni', 'kappa', 'torii', 'spirit'],
  tags: ['dragon', 'target'],
  weakTo: ['monk', 'samurai', 'shuriken'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.hp <= 0 || entity.age > (entity.data.life ?? 22)) {
      world.kill(entity)
      return
    }

    const unit = world.unit

    if (entity.data.ascendFromY && entity.t < 1.18) {
      const progress = clamp(entity.t / 1.18, 0, 1)
      const ease = 1 - (1 - progress) * (1 - progress)
      const startY = entity.data.ascendStartY ?? entity.y
      const targetY = entity.data.ascendTargetY ?? entity.y - unit * 4.5

      entity.y = startY + (targetY - startY) * ease
      entity.lift = Math.sin(progress * Math.PI) * unit * 0.9
      entity.tilt = (entity.facing === 1 ? -1 : 1) * (18 - progress * 18)

      if (progress >= 1) {
        entity.data.ascendFromY = 0
        entity.lift = 0
        entity.tilt = 0
        world.setState(entity, 'soar')
      }
      return
    }

    const ruin = world.nearest(entity, (other) => other.species === 'gate-ruin', unit * 42)

    if (ruin) {
      entity.targetId = ruin.id
      const gap = steer(entity, ruin.x, ruin.y - unit * 3.2, unit * 5.6, dt, 3.4)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 16)
      keepInSky(entity, world, world.skyTop + unit, world.groundY - unit * 3.4)
      world.setState(entity, 'mend')

      if (gap < unit * 2.2 && world.canBreed()) {
        world.spawn('torii', { x: ruin.x, y: ruin.y })
        world.kill(ruin)
        entity.data.life = Math.max(entity.age + 4, (entity.data.life ?? 22) - 3)
      }
      return
    }

    const target = world.nearest(
      entity,
      (other) => world.has(other, 'oni') || other.species === 'kappa',
      Math.max(unit * 36, world.width * 0.7),
    )

    if (target && chance(0.75, dt)) {
      entity.targetId = target.id
      world.setState(entity, 'strike')
    }

    if (entity.state === 'strike') {
      const strikeTarget = world.byId(entity.targetId)

      if (!strikeTarget || entity.t > 4.2) {
        entity.targetId = null
        world.setState(entity, 'soar')
        return
      }

      const gap = steer(
        entity,
        strikeTarget.x,
        strikeTarget.y - world.heightOf(strikeTarget) * 0.55,
        unit * 7.2,
        dt,
        4,
      )
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 20)

      if (gap < unit * 2) {
        if (strikeTarget.species === 'kappa') {
          spillKappa(strikeTarget, world, entity)
        } else {
          hurt(strikeTarget, world, 2.2, entity)
        }
        entity.targetId = null
        world.setState(entity, 'soar')
      }
      return
    }

    wander(entity, world, dt, unit * 3.4, world.skyTop + unit * 1.2, world.groundY - unit * 4, 2)
    integrate(entity, dt)
    faceTravel(entity)
    tiltToVelocity(entity, 14)
    keepInSky(entity, world, world.skyTop + unit, world.groundY - unit * 3)
  },
}

const kappa: EcoSpecies = {
  anchor: 'bottom',
  asset: kappaAsset,
  hp: 3,
  idle: 'trot',
  init(entity) {
    entity.data.hunger = between(0.25, 0.9)
    entity.data.water = 1
  },
  layer: 'front',
  size: [3.2, 4.1],
  state: 'prowl',
  strongVs: ['samurai', 'koi-pond', 'sheep', 'ninja'],
  tags: ['predator', 'prey', 'target'],
  weakTo: ['monk', 'lantern', 'shuriken', 'sumo', 'koi-dragon'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.hp <= 0) {
      world.kill(entity)
      return
    }

    const unit = world.unit
    const spillThreat = world.nearest(
      entity,
      (other) =>
        world.has(other, 'lantern') ||
        other.species === 'koi-dragon' ||
        (world.has(other, 'monk') && other.state === 'charge') ||
        other.species === 'sumo',
      unit * 8,
    )

    if (
      spillThreat &&
      entity.state !== 'spilled' &&
      chance(spillThreat.species === 'sumo' ? 0.35 : 1.4, dt)
    ) {
      spillKappa(entity, world, spillThreat)
      return
    }

    if (entity.state === 'spilled') {
      world.setAsset(entity, kappaSpilledAsset)
      entity.data.water = Math.min(1, (entity.data.water ?? 0) + dt / (entity.data.recover ?? 3))
      walk(entity, world, dt, unit * 2.4)
      hop(entity, dt, unit * 0.16, 5)

      if ((entity.data.water ?? 0) >= 1 && entity.t > 1.1) {
        entity.fx = ''
        world.setAsset(entity, kappaAsset)
        world.setState(entity, 'prowl')
      }
      return
    }

    if (entity.state === 'splash') {
      world.setAsset(entity, kappaAsset)
      const target = world.byId(entity.targetId)
      settle(entity, dt)

      if (target) {
        entity.facing = target.x >= entity.x ? 1 : -1
      }

      if (target && entity.t > 0.3 && !entity.data.hit) {
        entity.data.hit = 1

        if (target.species === 'koi-pond') {
          target.data.fish = Math.max(0, (target.data.fish ?? 4) - 1.4)
          target.fx = 'hurt'
          target.data.hurt = 0.4
        } else if (world.has(target, 'sheep')) {
          world.kill(target)
        } else {
          hurt(target, world, 1.4, entity)
        }
      }

      if (entity.t > 0.9) {
        entity.data.hit = 0
        entity.targetId = null
        entity.data.hunger = 0
        world.setState(entity, 'prowl')
      }
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 8

    const target = world.nearest(
      entity,
      (other) =>
        other.species === 'koi-pond' ||
        world.has(other, 'samurai') ||
        world.has(other, 'sheep') ||
        (world.has(other, 'ninja') && other.state === 'hidden'),
      Math.max(unit * 34, world.width * 0.7),
    )

    if (target && ((entity.data.hunger ?? 0) > 0.65 || target.species !== 'koi-pond')) {
      entity.targetId = target.id
      const gap = walkToward(entity, world, target.x, unit * 1.4, dt)
      hop(entity, dt, unit * 0.2, 5)

      if (gap < unit * 2) {
        entity.data.hit = 0
        world.setState(entity, 'splash')
      }
      return
    }

    world.setAsset(entity, kappaAsset)
    walk(entity, world, dt, unit * 0.82)
    hop(entity, dt, unit * 0.08, 3)

    if (chance(0.07, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const sumo: EcoSpecies = {
  anchor: 'bottom',
  asset: sumoAsset,
  hp: 4,
  idle: 'trot',
  init(entity) {
    entity.data.cool = between(0.4, 1.5)
  },
  layer: 'front',
  size: [4.4, 5.2],
  state: 'patrol',
  strongVs: ['oni', 'samurai', 'kappa'],
  tags: ['target'],
  weakTo: ['ninja', 'shuriken', 'monk'],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.hp <= 0) {
      world.kill(entity)
      return
    }

    const unit = world.unit
    const trickster = world.nearest(
      entity,
      (other) => world.has(other, 'ninja') && other.state !== 'smoke',
      unit * 5.8,
    )

    if (
      trickster &&
      entity.state !== 'trip' &&
      chance(trickster.state === 'hidden' ? 0.95 : 0.45, dt)
    ) {
      entity.facing = trickster.x >= entity.x ? -1 : 1
      entity.targetId = null
      entity.fx = 'hurt'
      world.setState(entity, 'trip')
      return
    }

    if (entity.state === 'trip') {
      world.setAsset(entity, sumoAsset)
      settle(entity, dt)

      if (entity.t > 1.15) {
        entity.fx = ''
        entity.data.cool = between(1.2, 2.3)
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'shove') {
      world.setAsset(entity, entity.t < 0.38 ? sumoTsuppariAsset : sumoShoveAsset)
      const target = world.byId(entity.targetId)
      settle(entity, dt)

      if (target) {
        entity.facing = target.x >= entity.x ? 1 : -1
      }

      if (target && entity.t > 0.22 && !entity.data.hit) {
        entity.data.hit = 1
        shoveTarget(entity, target, world, target.species === 'kappa' ? 0.7 : 1.1)
      }

      if (entity.t > 0.72) {
        entity.data.hit = 0
        entity.targetId = null
        entity.data.cool = between(1.2, 2.4)
        world.setAsset(entity, sumoAsset)
        world.setState(entity, 'patrol')
      }
      return
    }

    if (entity.state === 'charge') {
      world.setAsset(entity, sumoChargeAsset)
      const target = world.byId(entity.targetId)

      if (!target || entity.t > 2.4) {
        entity.targetId = null
        world.setState(entity, 'patrol')
        return
      }

      const gap = walkToward(entity, world, target.x, unit * 1.3, dt)
      hop(entity, dt, unit * 0.35, 6)

      if (gap < unit * 2.2) {
        entity.data.hit = 0
        world.setState(entity, 'shove')
      }
      return
    }

    world.setAsset(entity, sumoAsset)
    entity.data.cool = (entity.data.cool ?? 0) - dt

    const target = world.nearest(
      entity,
      (other) =>
        world.has(other, 'oni') ||
        other.species === 'kappa' ||
        (world.has(other, 'samurai') && (entity.data.cool ?? 0) <= -2),
      Math.max(unit * 38, world.width * 0.75),
    )

    if (target && (entity.data.cool ?? 0) <= 0) {
      entity.targetId = target.id
      world.setState(entity, 'charge')
      return
    }

    const pond = world.nearest(entity, (other) => other.species === 'koi-pond', unit * 16)

    if (pond && chance(0.18, dt)) {
      walkToward(entity, world, pond.x + entity.facing * unit * 3, unit * 2, dt)
      return
    }

    walk(entity, world, dt, unit * 0.7)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
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
  strongVs: ['oni', 'ninja'],
  tags: ['lantern'],
  weakTo: ['shuriken'],
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
  strongVs: ['sakura'],
  tags: ['sheep', 'prey', 'burnable', 'target'],
  weakTo: ['oni'],
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
  foxfire,
  'gate-ruin': gateRuin,
  'ki-beam': kiBeam,
  kappa,
  'koi-dragon': koiDragon,
  'koi-pond': koiPond,
  monk,
  ninja,
  oni,
  sakura,
  'sakura-petal': sakuraPetal,
  samurai,
  sheep,
  shuriken,
  sumo,
  torii,
}
