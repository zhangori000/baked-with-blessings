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
  pick,
  settle,
  steer,
  tiltToVelocity,
  walk,
  walkToward,
  wander,
} from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoSpeciesMap, EcoWorld } from '../types'
import { shootingStar } from './night'

registerViewBoxes({
  'baby-brachiosaurus': [100, 92],
  'baby-stegosaurus': [98, 62],
  'baby-triceratops': [96, 62],
  'dino-ash': [280, 160],
  'dino-egg-crack': [88, 66],
  'dino-nest': [88, 66],
  'dino-scrap': [64, 38],
  compy: [82, 48],
  'lava-bomb': [54, 54],
  meganeura: [118, 78],
  pterodactyl: [154, 92],
  'pterodactyl-dive': [142, 110],
  raptor: [120, 76],
  'raptor-leap': [124, 82],
  stegosaurus: [154, 94],
  'stegosaurus-swing': [164, 94],
  trex: [164, 104],
  'trex-chomp': [166, 104],
  'trex-moss': [164, 104],
  'trex-roar': [164, 112],
  'trex-russet': [164, 104],
  triceratops: [150, 94],
  'triceratops-charge': [154, 88],
  volcano: [122, 108],
  'volcano-erupt': [126, 132],
})

const fernAssets = ['/flowers/prehistoric-fern.svg', '/flowers/prehistoric-horsetail.svg'] as const
const trexAssets = [ecoAsset('trex'), ecoAsset('trex-russet'), ecoAsset('trex-moss')] as const
const trexRoarAsset = ecoAsset('trex-roar')
const trexChompAsset = ecoAsset('trex-chomp')
const triceratopsAsset = ecoAsset('triceratops')
const triceratopsChargeAsset = ecoAsset('triceratops-charge')
const brachiosaurusAsset = ecoAsset('brachiosaurus')
const stegosaurusAsset = ecoAsset('stegosaurus')
const stegosaurusSwingAsset = ecoAsset('stegosaurus-swing')
const raptorAsset = ecoAsset('raptor')
const raptorLeapAsset = ecoAsset('raptor-leap')
const pterodactylAsset = ecoAsset('pterodactyl')
const pterodactylDiveAsset = ecoAsset('pterodactyl-dive')
const nestAsset = ecoAsset('dino-nest')
const crackedNestAsset = ecoAsset('dino-egg-crack')
const volcanoAsset = ecoAsset('volcano')
const volcanoEruptAsset = ecoAsset('volcano-erupt')
const babyBySpecies: Record<string, string> = {
  brachiosaurus: ecoAsset('baby-brachiosaurus'),
  stegosaurus: ecoAsset('baby-stegosaurus'),
  triceratops: ecoAsset('baby-triceratops'),
}
const herbivoreSpecies = ['triceratops', 'stegosaurus', 'brachiosaurus'] as const

const living = (entity: EcoEntity) => !entity.dying && !entity.removed
const isFern = (other: EcoEntity) => other.species === 'fern' && other.state !== 'grow'
const isHerbivore = (other: EcoEntity) => herbivoreSpecies.includes(other.species as never)
const isBabyHerbivore = (other: EcoEntity) => isHerbivore(other) && (other.data.baby ?? 0) > 0
const isAdultHerbivore = (other: EcoEntity) => isHerbivore(other) && (other.data.baby ?? 0) <= 0
const isEgg = (other: EcoEntity) => other.species === 'dino-nest'
const isRaptor = (other: EcoEntity) => other.species === 'raptor'
const isTrex = (other: EcoEntity) => other.species === 'trex'
function clearTimedFx(entity: EcoEntity, dt: number) {
  if ((entity.data.hurt ?? 0) > 0) {
    entity.data.hurt = (entity.data.hurt ?? 0) - dt

    if ((entity.data.hurt ?? 0) <= 0 && entity.fx === 'hurt') {
      entity.fx = ''
    }
  }

  if ((entity.data.scatter ?? 0) > 0) {
    entity.data.scatter = (entity.data.scatter ?? 0) - dt
  }

  if ((entity.data.shake ?? 0) > 0) {
    entity.data.shake = (entity.data.shake ?? 0) - dt

    if ((entity.data.shake ?? 0) <= 0 && entity.fx === 'dazed') {
      entity.fx = ''
    }
  }
}

function face(entity: EcoEntity, targetX: number) {
  entity.facing = targetX >= entity.x ? 1 : -1
}

function groundFlee(
  entity: EcoEntity,
  world: EcoWorld,
  from: { x: number; y: number },
  dt: number,
) {
  entity.facing = from.x >= entity.x ? -1 : 1
  walk(entity, world, dt, world.unit * 4.2)
  hop(entity, dt, world.unit * 0.55, 8)
}

function nearestFire(entity: EcoEntity, world: EcoWorld, reach = 5) {
  return world.nearest(entity, (other) => world.has(other, 'fire'), world.unit * reach)
}

function damage(entity: EcoEntity, world: EcoWorld, amount = 1, fromX = entity.x) {
  if (!living(entity)) {
    return
  }

  if (entity.species === 'brachiosaurus' && amount < 6) {
    entity.fx = 'dazed'
    entity.data.shake = 0.45
    world.tally('brachio-shrug')
    return
  }

  entity.hp -= amount
  entity.fx = 'hurt'
  entity.data.hurt = 0.45
  entity.vx += (entity.x >= fromX ? 1 : -1) * world.unit * 1.8

  if (entity.hp > 0) {
    return
  }

  if (entity.species === 'trex') {
    entity.targetId = null
    world.setAsset(entity, trexAssets[entity.data.variant ?? 0] ?? trexAssets[0])
    world.setState(entity, 'limp')
    world.tally('trex-downed')
    return
  }

  world.kill(entity)
}

function burnNearby(entity: EcoEntity, world: EcoWorld, radius: number, amount = 8) {
  for (const other of world.within(entity.x, world.groundY, radius, (entry) => entry !== entity)) {
    if (world.has(other, 'fire')) {
      continue
    }

    if (world.has(other, 'fuel')) {
      other.data.burn = Math.max(other.data.burn ?? 0, 0.2)
    }

    if (world.has(other, 'burnable') || other.species === 'brachiosaurus') {
      damage(other, world, amount, entity.x)
      world.tally('lava-hit')
    }
  }
}

function eatFern(plant: EcoEntity, world: EcoWorld) {
  plant.targetId = null
  plant.data.growth = 0
  plant.data.nibbled = 1
  plant.scale = 0.42
  world.setState(plant, 'grow')
}

function layNest(entity: EcoEntity, world: EcoWorld, chancePerSecond: number, dt: number) {
  if (
    (entity.data.meals ?? 0) < 3 ||
    (entity.data.nestAt ?? 0) > world.time ||
    !world.canBreed() ||
    !chance(chancePerSecond, dt)
  ) {
    return
  }

  entity.data.meals = 0
  entity.data.nestAt = world.time + between(24, 38)
  world.spawn('dino-nest', {
    x: clamp(
      entity.x - entity.facing * between(1.1, 2.4) * world.unit,
      world.unit,
      world.width - world.unit,
    ),
  })
  world.tally('eggs-laid')
}

function graze(entity: EcoEntity, world: EcoWorld, dt: number, speed: number) {
  const unit = world.unit
  const fire = nearestFire(entity, world, 5.8)

  if (fire) {
    entity.targetId = null
    world.setState(entity, 'flee')
    groundFlee(entity, world, fire, dt)
    return true
  }

  if (entity.state === 'eat') {
    settle(entity, dt)
    const plant = world.byId(entity.targetId)

    if (!plant || !isFern(plant)) {
      entity.targetId = null
      world.setState(entity, 'graze')
      return true
    }

    if (entity.t > between(1.4, 2.4)) {
      eatFern(plant, world)
      entity.data.hunger = 0
      entity.data.meals = (entity.data.meals ?? 0) + 1
      entity.targetId = null
      world.setState(entity, 'graze')
    }

    return true
  }

  if (entity.state === 'seek') {
    const plant = world.byId(entity.targetId)

    if (!plant || !isFern(plant)) {
      entity.targetId = null
      world.setState(entity, 'graze')
      return true
    }

    if (walkToward(entity, world, plant.x, unit * speed, dt) < unit * 0.85) {
      world.setState(entity, 'eat')
    }

    return true
  }

  if (entity.state === 'flee') {
    if (entity.t > 1.8 && !fire) {
      world.setState(entity, 'graze')
    }

    return false
  }

  entity.data.hunger = (entity.data.hunger ?? 0) + dt / 9

  if ((entity.data.hunger ?? 0) > 1) {
    const plant = world.nearest(entity, isFern, unit * 28)

    if (plant) {
      entity.targetId = plant.id
      world.setState(entity, 'seek')
      return true
    }
  }

  walk(entity, world, dt, unit * speed * 0.42)
  settle(entity, dt)

  if (chance(0.12, dt)) {
    entity.facing = entity.facing === 1 ? -1 : 1
  }

  return false
}

function handleBaby(entity: EcoEntity, world: EcoWorld, dt: number, adultAsset: string) {
  if ((entity.data.baby ?? 0) <= 0) {
    return false
  }

  entity.scale = Math.min(0.95, entity.scale + dt * 0.008)

  if (entity.age > (entity.data.growAt ?? 54)) {
    entity.data.baby = 0
    entity.scale = 1
    entity.hp = entity.species === 'brachiosaurus' ? 10 : 4
    world.setAsset(entity, adultAsset)
    world.setState(entity, 'graze')
    world.tally('eggs-hatched')
    return false
  }

  const unit = world.unit
  const threat = world.nearest(
    entity,
    (other) => isTrex(other) || isRaptor(other) || world.has(other, 'fire'),
    unit * 12,
  )
  const shelter = world.nearest(
    entity,
    (other) => other !== entity && (other.species === 'brachiosaurus' || isAdultHerbivore(other)),
    unit * 18,
  )

  if (threat) {
    if (shelter) {
      face(entity, shelter.x)
      walkToward(
        entity,
        world,
        clamp(shelter.x - shelter.facing * unit * 1.4, unit, world.width - unit),
        unit * 2.4,
        dt,
      )
      hop(entity, dt, unit * 0.35, 7)
      world.setState(entity, 'hide')
    } else {
      world.setState(entity, 'flee')
      groundFlee(entity, world, threat, dt)
    }

    return true
  }

  if (entity.state === 'hide' && entity.t > 1.5) {
    world.setState(entity, 'graze')
  }

  graze(entity, world, dt, 1.25)
  return true
}

function packCount(entity: EcoEntity, world: EcoWorld, radius = 12) {
  return world.count(
    (other) => other.species === 'raptor' && Math.abs(other.x - entity.x) < world.unit * radius,
  )
}

function groundPredatorTarget(entity: EcoEntity, world: EcoWorld, pack = 1) {
  const unit = world.unit

  return (
    world.nearest(entity, isEgg, unit * 22) ??
    world.nearest(entity, (other) => other.species === 'compy', unit * 20) ??
    world.nearest(entity, isBabyHerbivore, unit * 24) ??
    (pack >= 3
      ? world.nearest(
          entity,
          (other) =>
            (other.species === 'triceratops' || other.species === 'stegosaurus') &&
            (other.data.baby ?? 0) <= 0,
          unit * 24,
        )
      : null)
  )
}

const fern: EcoSpecies = {
  anchor: 'bottom',
  asset: () => pick(fernAssets),
  burnTime: 2,
  countAs: 'fern',
  idle: 'sway',
  init(entity) {
    if (entity.state === 'grow') {
      entity.data.growth = entity.data.growth ?? 0
      entity.scale = 0.42 + (entity.data.growth ?? 0) * 0.58
    } else {
      entity.data.growth = 1
    }
  },
  layer: 'front',
  rest(entity) {
    entity.data.growth = 1
    entity.scale = 1
    entity.state = 'ripe'
  },
  size: [2.2, 3],
  state: 'grow',
  tags: ['plant', 'fuel'],
  tick(entity, world, dt) {
    entity.data.water = Math.max(0, (entity.data.water ?? 0) - dt)
    const watered = (entity.data.water ?? 0) > 0

    if (entity.state === 'grow') {
      const growth = Math.min(
        1,
        (entity.data.growth ?? 0) + dt * (entity.user ? 0.34 : 0.08) * (watered ? 2.4 : 1),
      )

      entity.data.growth = growth
      entity.scale = 0.42 + growth * 0.58

      if (growth >= 1) {
        world.setState(entity, 'ripe')
      }

      return
    }

    if (
      world.canBreed() &&
      entity.t > 5 &&
      chance(watered ? 0.09 : 0.035, dt) &&
      !world.nearest(
        entity,
        (other) => other.species === 'fern' && other !== entity,
        world.unit * 3,
      )
    ) {
      world.spawn('fern', {
        x: clamp(
          entity.x + pick([-1, 1]) * between(2.2, 6.5) * world.unit,
          world.unit,
          world.width - world.unit,
        ),
      })
    }
  },
}

const trex: EcoSpecies = {
  anchor: 'bottom',
  asset: () => pick(trexAssets),
  hp: 6,
  init(entity) {
    entity.data.variant = Math.max(0, trexAssets.indexOf(entity.asset))
    entity.data.hunger = between(0.35, 0.9)
    entity.data.roarAt = between(3, 7)
  },
  layer: 'front',
  size: [5.8, 7.2],
  state: 'prowl',
  tags: ['predator', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)

    if (entity.state === 'limp') {
      entity.facing = entity.facing || (entity.x < world.width / 2 ? -1 : 1)
      walk(entity, world, dt, unit * 1.7)
      entity.tilt = Math.sin(entity.t * 5) * 5

      if (entity.x < unit * 1.3 || entity.x > world.width - unit * 1.3 || entity.t > 7) {
        world.kill(entity)
      }

      return
    }

    const fire = nearestFire(entity, world, 5.4)

    if (fire && entity.state !== 'flee') {
      entity.targetId = null
      world.setAsset(entity, trexAssets[entity.data.variant ?? 0] ?? trexAssets[0])
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      if (fire) {
        groundFlee(entity, world, fire, dt)
      } else {
        walk(entity, world, dt, unit * 2.4)
      }

      if (entity.t > 2.4 && !fire) {
        world.setState(entity, 'prowl')
      }

      return
    }

    if (entity.state === 'roar') {
      settle(entity, dt)
      world.setAsset(entity, trexRoarAsset)

      if (entity.t < 0.22 && (entity.data.roared ?? 0) <= 0) {
        entity.data.roared = 1
        world.tally('trex-roar')

        for (const other of world.within(
          entity.x,
          entity.y,
          unit * 18,
          (entry) => entry !== entity,
        )) {
          if (other.species === 'compy' || other.species === 'raptor') {
            other.data.scatter = 2.8
            other.data.avoidX = entity.x
            other.targetId = null
            world.setState(other, other.species === 'compy' ? 'scatter' : 'flee')
          } else if (other.species === 'pterodactyl') {
            other.data.scatter = 3.2
            other.data.avoidX = entity.x
            other.targetId = null
            world.setState(other, 'takeoff')
          }
        }
      }

      if (entity.t > 1.25) {
        entity.data.roared = 0
        entity.data.roarAt = world.time + between(12, 20)
        world.setAsset(entity, trexAssets[entity.data.variant ?? 0] ?? trexAssets[0])
        world.setState(entity, 'prowl')
      }

      return
    }

    if (entity.state === 'chomp') {
      settle(entity, dt)
      world.setAsset(entity, trexChompAsset)

      if (entity.t > 0.52) {
        const prey = world.byId(entity.targetId)

        if (prey && Math.abs(prey.x - entity.x) < unit * 2.4 && prey.species !== 'brachiosaurus') {
          world.kill(prey)
          world.spawn('dino-scrap', { countAs: null, x: prey.x })
          world.tally('trex-kill')
          entity.data.hunger = 0
        }

        entity.targetId = null
        world.setAsset(entity, trexAssets[entity.data.variant ?? 0] ?? trexAssets[0])
        world.setState(entity, 'prowl')
      }

      return
    }

    if (entity.state === 'charge' || entity.state === 'stalk') {
      const prey = world.byId(entity.targetId)

      if (!prey || prey.species === 'brachiosaurus' || entity.t > 8) {
        entity.targetId = null
        world.setAsset(entity, trexAssets[entity.data.variant ?? 0] ?? trexAssets[0])
        world.setState(entity, 'prowl')
        return
      }

      face(entity, prey.x)
      const gap = walkToward(
        entity,
        world,
        prey.x,
        unit * (entity.state === 'charge' ? 4.5 : 2.3),
        dt,
      )
      hop(entity, dt, unit * 0.28, entity.state === 'charge' ? 6 : 3)

      if (gap < unit * 2.2) {
        world.setState(entity, 'chomp')
      } else if (entity.state === 'stalk' && entity.t > 1.4) {
        world.setState(entity, 'charge')
      }

      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 8
    const nearbyPrey = world.nearest(
      entity,
      (other) =>
        isBabyHerbivore(other) ||
        other.species === 'compy' ||
        other.species === 'raptor' ||
        (isAdultHerbivore(other) && other.species !== 'brachiosaurus'),
      unit * 18,
    )

    if ((entity.data.roarAt ?? 0) < world.time && nearbyPrey && chance(0.7, dt)) {
      entity.targetId = null
      world.setState(entity, 'roar')
      return
    }

    if ((entity.data.hunger ?? 0) > 1 && chance(0.7, dt)) {
      const prey =
        world.nearest(entity, isBabyHerbivore, unit * 34) ??
        world.nearest(
          entity,
          (other) => other.species === 'compy' || other.species === 'raptor',
          unit * 26,
        ) ??
        world.nearest(
          entity,
          (other) => isAdultHerbivore(other) && other.species !== 'brachiosaurus',
          unit * 30,
        )

      if (prey) {
        entity.targetId = prey.id
        world.setState(entity, 'stalk')
        return
      }
    }

    walk(entity, world, dt, unit * 1.05)
    settle(entity, dt)

    if (chance(0.08, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const triceratops: EcoSpecies = {
  anchor: 'bottom',
  asset: triceratopsAsset,
  hp: 4,
  init(entity, world) {
    entity.data.hunger = between(0.1, 0.7)

    if ((entity.data.baby ?? 0) > 0) {
      entity.scale = 0.54
      entity.hp = 2
      entity.data.growAt = between(44, 64)
      world.setAsset(entity, babyBySpecies.triceratops)
    }
  },
  layer: 'front',
  size: [4.6, 5.7],
  state: 'graze',
  tags: ['prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)

    if (handleBaby(entity, world, dt, triceratopsAsset)) {
      return
    }

    if (entity.state === 'charge') {
      const target = world.byId(entity.targetId)
      world.setAsset(entity, triceratopsChargeAsset)

      if (!target || entity.t > 3.2) {
        entity.targetId = null
        world.setAsset(entity, triceratopsAsset)
        world.setState(entity, 'graze')
        return
      }

      face(entity, target.x)
      const gap = walkToward(entity, world, target.x, unit * 5.4, dt)
      hop(entity, dt, unit * 0.25, 5)

      if (gap < unit * 1.7) {
        damage(target, world, target.species === 'trex' ? 1 : 2, entity.x)
        target.vx += entity.facing * unit * 5
        entity.data.meals = Math.max(0, (entity.data.meals ?? 0) - 1)
        entity.targetId = null
        world.tally('triceratops-charge')
        world.setAsset(entity, triceratopsAsset)
        world.setState(entity, 'graze')
      }

      return
    }

    const threat = world.nearest(
      entity,
      (other) =>
        other.species === 'trex' || (other.species === 'raptor' && packCount(other, world) >= 2),
      unit * 13,
    )

    if (threat && (entity.data.chargeAt ?? 0) < world.time) {
      entity.data.chargeAt = world.time + between(4.5, 7)
      entity.targetId = threat.id
      world.setState(entity, 'charge')
      return
    }

    graze(entity, world, dt, 1.55)
    layNest(entity, world, 0.18, dt)
  },
}

const brachiosaurus: EcoSpecies = {
  anchor: 'bottom',
  asset: brachiosaurusAsset,
  hp: 10,
  init(entity, world) {
    entity.data.hunger = between(0.1, 0.6)

    if ((entity.data.baby ?? 0) > 0) {
      entity.scale = 0.5
      entity.hp = 3
      entity.data.growAt = between(58, 78)
      world.setAsset(entity, babyBySpecies.brachiosaurus)
    }
  },
  layer: 'front',
  size: [6.8, 8.4],
  state: 'browse',
  tags: ['prey'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)

    if (handleBaby(entity, world, dt, brachiosaurusAsset)) {
      return
    }

    const fire = nearestFire(entity, world, 4.5)

    if (fire) {
      groundFlee(entity, world, fire, dt)
      return
    }

    if (entity.state === 'stomp') {
      settle(entity, dt)

      if (entity.t > 0.35 && (entity.data.stomped ?? 0) <= 0) {
        entity.data.stomped = 1
        world.tally('brachio-stomp')

        for (const other of world.within(
          entity.x,
          entity.y,
          unit * 7.5,
          (entry) => entry !== entity,
        )) {
          if (other.species === 'compy' || other.species === 'raptor') {
            other.fx = 'dazed'
            other.data.shake = 1
            other.data.avoidX = entity.x
            world.setState(other, 'flee')
          } else if (other.species === 'meganeura') {
            other.vy -= unit * 4
            other.data.scatter = 1.2
          }
        }
      }

      if (entity.t > 0.9) {
        entity.data.stomped = 0
        world.setState(entity, 'browse')
      }

      return
    }

    const small = world.nearest(
      entity,
      (other) => other.species === 'raptor' || other.species === 'compy',
      unit * 5.5,
    )

    if (small && (entity.data.stompAt ?? 0) < world.time) {
      entity.data.stompAt = world.time + between(5, 8)
      world.setState(entity, 'stomp')
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 12

    if ((entity.data.hunger ?? 0) > 1.05) {
      const plant = world.nearest(entity, isFern, unit * 16)

      if (plant && Math.abs(plant.x - entity.x) < unit * 3.2) {
        eatFern(plant, world)
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1
      } else if (plant) {
        walkToward(entity, world, plant.x, unit * 0.78, dt)
        return
      }
    }

    walk(entity, world, dt, unit * 0.34)
    entity.tilt = Math.sin(world.time * 0.8 + entity.id) * 1.2

    if (chance(0.04, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }

    layNest(entity, world, 0.1, dt)
  },
}

const stegosaurus: EcoSpecies = {
  anchor: 'bottom',
  asset: stegosaurusAsset,
  hp: 4,
  init(entity, world) {
    entity.data.hunger = between(0.1, 0.7)

    if ((entity.data.baby ?? 0) > 0) {
      entity.scale = 0.56
      entity.hp = 2
      entity.data.growAt = between(46, 66)
      world.setAsset(entity, babyBySpecies.stegosaurus)
    }
  },
  layer: 'front',
  size: [4.8, 5.9],
  state: 'graze',
  tags: ['prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)

    if (handleBaby(entity, world, dt, stegosaurusAsset)) {
      return
    }

    if (entity.state === 'swing') {
      settle(entity, dt)
      world.setAsset(entity, stegosaurusSwingAsset)

      if (entity.t > 0.35 && (entity.data.swung ?? 0) <= 0) {
        entity.data.swung = 1
        const target = world.byId(entity.targetId)

        if (target && Math.abs(target.x - entity.x) < unit * 3.6) {
          damage(target, world, target.species === 'trex' ? 1 : 2, entity.x)
          world.tally('stego-tail-hit')
        }
      }

      if (entity.t > 0.9) {
        entity.data.swung = 0
        entity.targetId = null
        world.setAsset(entity, stegosaurusAsset)
        world.setState(entity, 'graze')
      }

      return
    }

    const behind = world.nearest(
      entity,
      (other) =>
        (other.species === 'trex' || other.species === 'raptor') &&
        Math.sign(other.x - entity.x || entity.facing) !== entity.facing,
      unit * 4.2,
    )

    if (behind && (entity.data.swingAt ?? 0) < world.time) {
      entity.data.swingAt = world.time + between(3.8, 6.2)
      entity.targetId = behind.id
      world.setState(entity, 'swing')
      return
    }

    graze(entity, world, dt, 1.35)
    layNest(entity, world, 0.15, dt)
  },
}

const raptor: EcoSpecies = {
  anchor: 'bottom',
  asset: raptorAsset,
  hp: 2,
  init(entity) {
    entity.data.hunger = between(0.35, 0.9)
  },
  layer: 'front',
  size: [2.8, 3.5],
  state: 'prowl',
  tags: ['predator', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)
    const fire = nearestFire(entity, world, 5)
    const rex = world.nearest(entity, isTrex, unit * 13)

    if ((entity.data.scatter ?? 0) > 0 || fire || (rex && rex.state === 'roar')) {
      entity.targetId = null
      world.setAsset(entity, raptorAsset)
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      groundFlee(
        entity,
        world,
        fire ?? rex ?? { x: entity.data.avoidX ?? entity.x - entity.facing, y: entity.y },
        dt,
      )

      if (entity.t > 2.5 && !fire && (entity.data.scatter ?? 0) <= 0) {
        world.setState(entity, 'prowl')
      }

      return
    }

    if (entity.state === 'leap') {
      world.setAsset(entity, raptorLeapAsset)
      const target = world.byId(entity.targetId)

      if (!target || entity.t > 2.2) {
        entity.targetId = null
        world.setAsset(entity, raptorAsset)
        world.setState(entity, 'prowl')
        return
      }

      face(entity, target.x)
      const gap = walkToward(entity, world, target.x, unit * 5.3, dt)
      hop(entity, dt, unit * 1.1, 8)

      if (gap < unit * 1.25) {
        if (target.species === 'dino-nest') {
          world.kill(target)
          world.tally('eggs-stolen')
        } else if (isBabyHerbivore(target) || target.species === 'compy') {
          world.kill(target)
          world.tally('raptor-kill')
          entity.data.hunger = 0
        } else {
          damage(target, world, 1, entity.x)
          world.tally('raptor-pack-hit')
          entity.data.hunger = 0.2
        }

        entity.targetId = null
        world.setAsset(entity, raptorAsset)
        world.setState(entity, 'prowl')
      }

      return
    }

    if (entity.state === 'flank') {
      const target = world.byId(entity.targetId)

      if (!target || entity.t > 5) {
        entity.targetId = null
        world.setState(entity, 'prowl')
        return
      }

      const offset = (entity.id % 2 === 0 ? -1 : 1) * unit * 2.2
      face(entity, target.x + offset)

      if (walkToward(entity, world, target.x + offset, unit * 3.2, dt) < unit * 2.3) {
        world.setState(entity, 'leap')
      }

      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 7
    const pack = packCount(entity, world)

    if ((entity.data.hunger ?? 0) > 0.95 && chance(0.65, dt)) {
      const target = groundPredatorTarget(entity, world, pack)

      if (target) {
        entity.targetId = target.id
        world.setState(entity, pack >= 2 ? 'flank' : 'leap')
        return
      }
    }

    walk(entity, world, dt, unit * 1.8)
    hop(entity, dt, unit * 0.35, 4)

    if (chance(0.12, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const pterodactyl: EcoSpecies = {
  anchor: 'center',
  asset: pterodactylAsset,
  idle: 'flap',
  init(entity, world) {
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.35)
    entity.data.hunger = between(0.2, 0.85)
  },
  layer: 'front',
  size: [4.2, 5.4],
  state: 'soar',
  tags: ['predator', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)
    const volcanoThreat = world.nearest(
      entity,
      (other) => other.species === 'volcano' && other.state === 'erupt',
      unit * 20,
    )

    if ((entity.data.scatter ?? 0) > 0 || volcanoThreat) {
      entity.targetId = null
      world.setAsset(entity, pterodactylAsset)
      world.setState(entity, 'takeoff')
    }

    if (entity.state === 'takeoff') {
      const awayX = entity.data.avoidX ?? volcanoThreat?.x ?? world.width / 2
      steer(
        entity,
        clamp(entity.x + (entity.x >= awayX ? 1 : -1) * unit * 16, unit, world.width - unit),
        world.skyTop + unit * 2,
        unit * 7,
        dt,
        4,
      )
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 25)
      keepInSky(entity, world)

      if (entity.t > 2.2 && !volcanoThreat && (entity.data.scatter ?? 0) <= 0) {
        world.setState(entity, 'soar')
      }

      return
    }

    if (entity.state === 'dive') {
      const target = world.byId(entity.targetId)
      world.setAsset(entity, pterodactylDiveAsset)

      if (!target || entity.t > 4) {
        entity.targetId = null
        world.setAsset(entity, pterodactylAsset)
        world.setState(entity, 'soar')
        return
      }

      const aimY = target.anchor === 'bottom' ? target.y - world.heightOf(target) * 0.4 : target.y
      const gap = steer(entity, target.x, aimY, unit * 8, dt, 4)
      integrate(entity, dt)
      faceTravel(entity)
      tiltToVelocity(entity, 40)

      if (gap < unit * 1.3) {
        if (target.species === 'dino-nest') {
          world.kill(target)
          world.tally('eggs-stolen')
        } else {
          world.kill(target)
          world.tally(target.species === 'meganeura' ? 'ptero-dragonfly' : 'ptero-compy')
        }

        entity.targetId = null
        entity.data.hunger = 0
        world.setAsset(entity, pterodactylAsset)
        world.setState(entity, 'takeoff')
      }

      return
    }

    if (entity.state === 'perch') {
      steer(
        entity,
        entity.data.perchX ?? entity.x,
        entity.data.perchY ?? entity.y,
        unit * 2.2,
        dt,
        3,
      )
      integrate(entity, dt)
      faceTravel(entity)
      entity.lift = Math.sin(entity.t * 2) * unit * 0.08

      if (entity.t > between(2.8, 4.2)) {
        world.setState(entity, 'soar')
      }

      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 6
    wander(entity, world, dt, unit * 3.4, world.skyTop + unit, world.skyBottom, 2.2)
    integrate(entity, dt)
    faceTravel(entity)
    tiltToVelocity(entity, 18)
    keepInSky(entity, world)

    if ((entity.data.hunger ?? 0) > 0.85 && chance(0.75, dt)) {
      const target =
        world.nearest(entity, (other) => other.species === 'meganeura', unit * 28) ??
        world.nearest(entity, (other) => other.species === 'compy', unit * 22) ??
        world.nearest(entity, isEgg, unit * 22)

      if (target) {
        entity.targetId = target.id
        world.setState(entity, 'dive')
        return
      }
    }

    if (chance(0.03, dt)) {
      entity.data.perchX = clamp(entity.x + between(-4, 4) * unit, unit, world.width - unit)
      entity.data.perchY = clamp(
        world.groundY - unit * between(7, 11),
        world.skyTop + unit,
        world.skyBottom,
      )
      world.setState(entity, 'perch')
    }
  },
}

const compy: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('compy'),
  init(entity) {
    entity.data.hunger = between(0.25, 0.85)
  },
  layer: 'front',
  size: [1.3, 1.8],
  state: 'skitter',
  tags: ['prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)
    const threat = world.nearest(
      entity,
      (other) =>
        other.species === 'trex' ||
        other.species === 'raptor' ||
        other.species === 'triceratops' ||
        other.species === 'stegosaurus' ||
        other.species === 'brachiosaurus' ||
        world.has(other, 'fire'),
      unit * 8,
    )

    if (threat || (entity.data.scatter ?? 0) > 0) {
      entity.targetId = null
      world.setState(entity, 'scatter')
    }

    if (entity.state === 'scatter') {
      groundFlee(
        entity,
        world,
        threat ?? { x: entity.data.avoidX ?? entity.x - entity.facing, y: entity.y },
        dt,
      )

      if (entity.t > 1.8 && !threat && (entity.data.scatter ?? 0) <= 0) {
        world.setState(entity, 'skitter')
      }

      return
    }

    if (entity.state === 'eat') {
      settle(entity, dt)
      const food = world.byId(entity.targetId)

      if (!food) {
        entity.targetId = null
        world.setState(entity, 'skitter')
        return
      }

      if (entity.t > 0.9) {
        world.kill(food)
        world.tally(food.species === 'dino-nest' ? 'eggs-stolen' : 'compy-meal')
        entity.data.hunger = 0
        entity.targetId = null
        world.setState(entity, 'skitter')
      }

      return
    }

    if (entity.state === 'seek') {
      const food = world.byId(entity.targetId)

      if (!food) {
        entity.targetId = null
        world.setState(entity, 'skitter')
        return
      }

      if (walkToward(entity, world, food.x, unit * 3.6, dt) < unit * 0.8) {
        world.setState(entity, 'eat')
      }

      hop(entity, dt, unit * 0.4, 10)
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 5

    if ((entity.data.hunger ?? 0) > 0.75 && chance(0.9, dt)) {
      const food =
        world.nearest(entity, (other) => other.species === 'dino-scrap', unit * 20) ??
        world.nearest(entity, (other) => other.species === 'meganeura', unit * 13) ??
        world.nearest(entity, isEgg, unit * 12)

      if (food) {
        entity.targetId = food.id
        world.setState(entity, 'seek')
        return
      }
    }

    walk(entity, world, dt, unit * 2.1)
    hop(entity, dt, unit * 0.32, 7)

    if (chance(0.18, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const meganeura: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('meganeura'),
  idle: 'buzz',
  init(entity, world) {
    entity.y = between(world.groundY - world.unit * 9, world.groundY - world.unit * 3.5)
    entity.data.breedAt = world.time + between(20, 34)
  },
  layer: 'front',
  size: [1.8, 2.5],
  state: 'zip',
  tags: ['insect', 'prey', 'burnable'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)
    const threat = world.nearest(
      entity,
      (other) =>
        other.species === 'compy' || other.species === 'pterodactyl' || world.has(other, 'fire'),
      unit * 7,
    )

    if (threat || (entity.data.scatter ?? 0) > 0) {
      steer(
        entity,
        clamp(
          entity.x +
            (entity.x >= (threat?.x ?? entity.data.avoidX ?? entity.x) ? 1 : -1) * unit * 8,
          unit,
          world.width - unit,
        ),
        clamp(entity.y - unit * 2, world.skyTop + unit, world.groundY - unit * 2),
        unit * 6,
        dt,
        6,
      )
    } else {
      const plant = world.nearest(entity, isFern, unit * 24)

      if (plant && chance(0.35, dt)) {
        entity.data.goalX = plant.x + between(-3, 3) * unit
        entity.data.goalY = plant.y - between(2.5, 7) * unit
        entity.data.goalAt = world.time + between(1.8, 3.2)
      }

      wander(entity, world, dt, unit * 4.4, world.groundY - unit * 10, world.groundY - unit * 2, 5)
    }

    integrate(entity, dt)
    faceTravel(entity)
    tiltToVelocity(entity, 28)
    keepInSky(entity, world, world.skyTop + unit, world.groundY - unit * 1.4)

    if (
      world.canBreed() &&
      (entity.data.breedAt ?? 0) < world.time &&
      world.nearest(entity, isFern, unit * 7)
    ) {
      entity.data.breedAt = world.time + between(28, 46)
      world.spawn('meganeura', {
        countAs: null,
        x: clamp(entity.x + between(-1.5, 1.5) * unit, unit, world.width - unit),
        y: clamp(entity.y + between(-1, 1) * unit, world.skyTop + unit, world.groundY - unit * 2),
      })
      world.tally('dragonfly-birth')
    }
  },
}

const dinoNest: EcoSpecies = {
  anchor: 'bottom',
  asset: nestAsset,
  countAs: 'dino-nest',
  init(entity) {
    entity.data.hatchAt = entity.data.hatchAt ?? between(28, 44)
  },
  layer: 'front',
  size: [2.3, 3],
  state: 'warm',
  tags: ['prey'],
  tick(entity, world, _dt) {
    const predator = world.nearest(
      entity,
      (other) =>
        other.species === 'raptor' || other.species === 'compy' || other.species === 'pterodactyl',
      world.unit * 5,
    )

    if (predator) {
      entity.fx = 'wobble'
    } else if (entity.fx === 'wobble') {
      entity.fx = ''
    }

    const hatchAt = (entity.data.hatchAt ?? 36) / ((entity.data.warm ?? 0) > 0 ? 2.7 : 1)

    if (entity.t > hatchAt * 0.72) {
      world.setAsset(entity, crackedNestAsset)
      world.setState(entity, 'crack')
    }

    if (entity.t <= hatchAt) {
      return
    }

    const species = pick(herbivoreSpecies)

    world.spawn(species, {
      data: { baby: 1 },
      x: clamp(entity.x + between(-1.2, 1.2) * world.unit, world.unit, world.width - world.unit),
    })
    world.tally('eggs-hatched')
    world.kill(entity)
  },
}

const dinoScrap: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('dino-scrap'),
  countAs: null,
  init(entity) {
    entity.data.life = between(10, 18)
  },
  layer: 'front',
  size: [1.3, 1.9],
  state: 'scrap',
  tags: ['prey'],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 12) - dt

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}

function launchLava(world: EcoWorld, volcano: EcoEntity) {
  const unit = world.unit
  const startX = volcano.x + between(-0.35, 0.35) * world.widthOf(volcano)
  const startY = volcano.y - world.heightOf(volcano) * 0.88
  const targetX = clamp(volcano.x + between(-12, 12) * unit, unit, world.width - unit)
  const arc = ballistic(startX, startY, targetX, world.groundY, between(1.2, 2.1), unit * 18)

  world.spawn('lava-bomb', {
    countAs: null,
    data: { gravity: unit * 18 },
    vx: arc.vx,
    vy: arc.vy,
    x: startX,
    y: startY,
  })
}

const volcano: EcoSpecies = {
  anchor: 'bottom',
  asset: volcanoAsset,
  countAs: 'volcano',
  init(entity) {
    entity.data.next = between(8, 14)
  },
  layer: 'front',
  size: [4.8, 6.2],
  state: 'smolder',
  tags: [],
  tick(entity, world, dt) {
    if (entity.state === 'rumble') {
      entity.fx = 'dazed'

      if (entity.t > 1.6) {
        entity.fx = ''
        world.setAsset(entity, volcanoEruptAsset)
        world.setState(entity, 'erupt')
      }

      return
    }

    if (entity.state === 'erupt') {
      if ((entity.data.burst ?? 0) <= 0) {
        entity.data.burst = 1
        world.tally('volcano-eruption')

        for (let index = 0; index < 5; index += 1) {
          launchLava(world, entity)
        }
      }

      if (entity.t > 1.15) {
        entity.data.burst = 0
        entity.data.next = between(12, 22)
        world.setAsset(entity, volcanoAsset)
        world.setState(entity, 'smolder')
      }

      return
    }

    entity.data.next = (entity.data.next ?? 10) - dt

    if ((entity.data.next ?? 0) <= 0) {
      world.setState(entity, 'rumble')
    }
  },
}

const lavaBomb: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('lava-bomb'),
  countAs: null,
  init(entity) {
    entity.data.life = 5
  },
  layer: 'front',
  size: [1.1, 1.8],
  state: 'fall',
  tags: ['projectile'],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 4) - dt
    entity.vy += (entity.data.gravity ?? world.unit * 18) * dt
    integrate(entity, dt)
    tiltToVelocity(entity, 80)

    if (entity.y < world.groundY && (entity.data.life ?? 0) > 0) {
      return
    }

    const fire = world.spawn('fire', {
      countAs: null,
      x: clamp(entity.x, world.unit, world.width - world.unit),
    })

    if (fire) {
      fire.data.life = (entity.data.mega ?? 0) > 0 ? between(10, 16) : between(6, 10)
      fire.size *= (entity.data.mega ?? 0) > 0 ? 1.3 : 1
    }

    burnNearby(
      entity,
      world,
      world.unit * ((entity.data.mega ?? 0) > 0 ? 4.2 : 2.4),
      (entity.data.mega ?? 0) > 0 ? 10 : 7,
    )
    world.remove(entity)
  },
}

const dinoAsh: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('dino-ash'),
  countAs: null,
  init(entity) {
    entity.data.opacity = 1
  },
  layer: 'back',
  size: [28, 34],
  state: 'spread',
  style: (entity) => ({
    '--prehistoric-ash-opacity': `${Math.max(0, entity.data.opacity ?? 1)}`,
  }),
  tags: [],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 10) - dt
    entity.data.opacity = clamp((entity.data.life ?? 0) / 10, 0, 1)
    entity.x = world.width / 2
    entity.y = world.height * 0.28

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}

const dinoImpact: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('impact'),
  countAs: null,
  init(entity, world) {
    entity.data.life = 6
    entity.data.flash = 1
    entity.size = clamp(world.width / world.unit / 6.8, 18, 30)
    entity.data.zBoost = world.height * 5
  },
  layer: 'front',
  size: [18, 30],
  state: 'flash',
  style: (entity, world) => ({
    '--impact-flash-size': `${Math.max(world.width, world.height) * 3.2}px`,
    '--impact-ring-size': `${Math.max(world.width, world.height) * 2}px`,
    '--impact-shake': `${Math.max(9, world.unit * 0.9)}px`,
    '--prehistoric-impact-opacity': `${Math.max(0, (entity.data.life ?? 0) / 6)}`,
  }),
  tags: ['asteroid'],
  tick(entity, world, dt) {
    if ((entity.data.dust ?? 0) <= 0) {
      entity.data.dust = 1
      world.spawn('dino-ash', {
        countAs: null,
        data: { life: 9, zBoost: 9000 },
        size: Math.max(28, world.width / world.unit),
        x: world.width / 2,
        y: world.height * 0.3,
      })

      for (let index = 0; index < 8; index += 1) {
        const fire = world.spawn('fire', {
          countAs: null,
          x: clamp(entity.x + between(-16, 16) * world.unit, world.unit, world.width - world.unit),
        })

        if (fire) {
          fire.data.life = between(8, 14)
          fire.size *= 1.2
        }
      }
    }

    entity.y = world.groundY + world.unit * 0.2
    entity.data.life = (entity.data.life ?? 6) - dt

    if (entity.t > 0.62 && entity.state === 'flash') {
      world.setState(entity, 'crater')
    }

    if (entity.t > 6) {
      world.remove(entity)
    }
  },
}

export const prehistoricSpecies: EcoSpeciesMap = {
  'dino-impact': dinoImpact,
  'dino-ash': dinoAsh,
  'dino-nest': dinoNest,
  'dino-scrap': dinoScrap,
  brachiosaurus,
  compy,
  fern,
  'lava-bomb': lavaBomb,
  meganeura,
  pterodactyl,
  raptor,
  'shooting-star': shootingStar,
  stegosaurus,
  trex,
  triceratops,
  volcano,
}
