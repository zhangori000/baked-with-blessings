import { ecoAsset, registerAssetScales, registerViewBoxes } from '../assets'
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
import { asteroidStarCount } from '../../spawnables'
import type {
  EcoControlAbility,
  EcoControlAbilityContext,
  EcoEntity,
  EcoSpecies,
  EcoSpeciesMap,
  EcoWorld,
} from '../types'

registerViewBoxes({
  'araucaria-tree': [118, 188],
  'araucaria-tree-charred': [118, 188],
  'araucaria-tree-thin': [118, 188],
  'baby-brachiosaurus': [114, 118],
  'baby-stegosaurus': [108, 70],
  'baby-triceratops': [108, 72],
  'dino-ash': [320, 190],
  'dino-asteroid': [170, 96],
  'dino-bite-burst': [96, 70],
  'dino-dust': [132, 58],
  'dino-egg-crack': [88, 66],
  'dino-eruption': [260, 260],
  'dino-feather-puff': [106, 72],
  'dino-leaf-flutter': [92, 94],
  'dino-shooting-star': [220, 44],
  'dino-shooting-star-icon': [88, 52],
  'dino-nest': [88, 66],
  'dino-scrap': [70, 42],
  'dino-tail-streak': [150, 56],
  'cooled-lava': [280, 70],
  impact: [260, 180],
  'lava-flank-left': [220, 270],
  'lava-flank-right': [220, 270],
  'lava-flow': [280, 78],
  'lava-ground-sheet': [360, 86],
  'lava-bomb': [60, 60],
  meganeura: [122, 78],
  pterodactyl: [200, 110],
  'pterodactyl-dive': [200, 110],
  quetzalcoatlus: [250, 230],
  'quetzalcoatlus-flight': [380, 160],
  stegosaurus: [168, 104],
  'stegosaurus-swing': [178, 104],
  triceratops: [168, 98],
  'triceratops-charge': [172, 92],
  volcano: [122, 108],
  'volcano-erupt': [126, 132],
  brachiosaurus: [260, 210],
  'brachiosaurus-browse': [260, 210],
  'dino-meat-bit': [40, 30],
  ...Object.fromEntries(
    ['trex', 'trex-moss', 'trex-russet'].flatMap((name) =>
      ['', '-chomp', '-clamp', '-feed', '-tear'].map((pose) => [
        `${name}${pose}`,
        [232, 170] as const,
      ]),
    ),
  ),
})

registerAssetScales({ 'quetzalcoatlus-flight': 1.35 })

const fernAssets = ['/flowers/prehistoric-fern.svg', '/flowers/prehistoric-horsetail.svg'] as const
const trexVariants = ['trex', 'trex-russet', 'trex-moss'] as const
const trexAssets = trexVariants.map((name) => ecoAsset(name))
const trexPose = (entity: EcoEntity, pose?: 'chomp' | 'clamp' | 'feed' | 'tear') => {
  const name = trexVariants[entity.data.variant ?? 0] ?? trexVariants[0]

  return ecoAsset(pose ? `${name}-${pose}` : name)
}
const triceratopsAsset = ecoAsset('triceratops')
const triceratopsChargeAsset = ecoAsset('triceratops-charge')
const brachiosaurusAsset = ecoAsset('brachiosaurus')
const brachiosaurusBrowseAsset = ecoAsset('brachiosaurus-browse')
const stegosaurusAsset = ecoAsset('stegosaurus')
const stegosaurusSwingAsset = ecoAsset('stegosaurus-swing')
const pterodactylAsset = ecoAsset('pterodactyl')
const pterodactylDiveAsset = ecoAsset('pterodactyl-dive')
const quetzalcoatlusAsset = ecoAsset('quetzalcoatlus')
const quetzalcoatlusFlightAsset = ecoAsset('quetzalcoatlus-flight')
const nestAsset = ecoAsset('dino-nest')
const crackedNestAsset = ecoAsset('dino-egg-crack')
const treeAsset = ecoAsset('araucaria-tree')
const treeCharredAsset = ecoAsset('araucaria-tree-charred')
const treeThinAsset = ecoAsset('araucaria-tree-thin')
const volcanoAsset = ecoAsset('volcano')
const volcanoEruptAsset = ecoAsset('volcano-erupt')
const dinoShootingStarAsset = ecoAsset('dino-shooting-star')
const dinoAsteroidAsset = ecoAsset('dino-asteroid')
const dinoEruptionAsset = ecoAsset('dino-eruption')
const lavaFlankLeftAsset = ecoAsset('lava-flank-left')
const lavaFlankRightAsset = ecoAsset('lava-flank-right')
const lavaFlowAsset = ecoAsset('lava-flow')
const lavaGroundSheetAsset = ecoAsset('lava-ground-sheet')
const cooledLavaAsset = ecoAsset('cooled-lava')
const dustAsset = ecoAsset('dino-dust')
const biteBurstAsset = ecoAsset('dino-bite-burst')
const featherPuffAsset = ecoAsset('dino-feather-puff')
const leafFlutterAsset = ecoAsset('dino-leaf-flutter')
const tailStreakAsset = ecoAsset('dino-tail-streak')
const babyBySpecies: Record<string, string> = {
  brachiosaurus: ecoAsset('baby-brachiosaurus'),
  stegosaurus: ecoAsset('baby-stegosaurus'),
  triceratops: ecoAsset('baby-triceratops'),
}
const herbivoreSpecies = ['triceratops', 'stegosaurus', 'brachiosaurus'] as const

const living = (entity: EcoEntity) => !entity.dying && !entity.removed
const isFern = (other: EcoEntity) => other.species === 'fern' && other.state !== 'grow'
const isTree = (other: EcoEntity) =>
  other.species === 'araucaria-tree' && other.state !== 'regrow' && (other.data.foliage ?? 1) > 0.2
const isHerbivore = (other: EcoEntity) => herbivoreSpecies.includes(other.species as never)
const isBabyHerbivore = (other: EcoEntity) => isHerbivore(other) && (other.data.baby ?? 0) > 0
const isAdultHerbivore = (other: EcoEntity) => isHerbivore(other) && (other.data.baby ?? 0) <= 0
const isEgg = (other: EcoEntity) => other.species === 'dino-nest'
const isTrex = (other: EcoEntity) => other.species === 'trex'
const isSmallQuetzPrey = (other: EcoEntity) =>
  other.species === 'meganeura' || other.species === 'dino-nest' || isBabyHerbivore(other)

function spawnEffect(
  world: EcoWorld,
  species: string,
  x: number,
  y: number,
  size?: number,
  data: Record<string, number> = {},
) {
  return world.spawn(species, { countAs: null, data, size, x, y })
}

function spawnBrachioLeaves(world: EcoWorld, x: number, y: number, facing = 1) {
  for (let i = 0; i < 3; i += 1) {
    const leaf = spawnEffect(
      world,
      'dino-leaf-flutter',
      x + facing * world.unit * (0.25 + i * 0.18),
      y,
      1.15,
      {
        grow: -0.1,
        life: 1 + i * 0.18,
      },
    )

    if (leaf) {
      leaf.vx = facing * world.unit * between(0.15, 0.65)
      leaf.vy = world.unit * between(0.7, 1.5)
      leaf.tilt = between(-18, 18)
      leaf.data.spin = between(-52, 52)
    }
  }
}

function backdropRect(world: EcoWorld, x: number, y: number, width: number, height: number) {
  const mobile = world.width <= 767 || world.height > world.width * 1.25
  const fit = mobile ? 0.86 : 1
  const left = mobile ? x * fit - 190.4 : x
  const top = mobile ? y * fit + 188.4 : y
  const view = mobile ? { width: 430, height: 860 } : { width: 1200, height: 600 }
  const scale = Math.max(world.width / view.width, world.height / view.height)
  const offsetX = (world.width - view.width * scale) / 2

  return {
    width: width * fit * scale,
    x: (left + (width * fit) / 2) * scale + offsetX,
    y: (top + (height * fit) / 2) * scale,
  }
}

function craterPoint(world: EcoWorld) {
  const mobile = world.width <= 767 || world.height > world.width * 1.25
  const view = mobile
    ? { width: 430, height: 860, x: 96, y: 340 }
    : { width: 1200, height: 600, x: 333, y: 176 }
  const scale = Math.max(world.width / view.width, world.height / view.height)
  const offsetX = (world.width - view.width * scale) / 2
  const x = clamp(view.x * scale + offsetX, world.unit * 1.5, world.width - world.unit * 1.5)
  const y = clamp(view.y * scale, world.skyTop + world.unit, world.groundY - world.unit * 3)

  return { x, y, scale }
}

function clearTimedFx(entity: EcoEntity, dt: number) {
  entity.data.attackTimer = Math.max(0, (entity.data.attackTimer ?? 0) - dt)

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
  return world.nearest(
    entity,
    (other) => world.has(other, 'fire') && other.state !== 'cooled',
    world.unit * reach,
  )
}

function heal(entity: EcoEntity, amount: number) {
  entity.hp = Math.min(entity.maxHp, entity.hp + amount)
}

function damage(
  entity: EcoEntity,
  world: EcoWorld,
  amount = 1,
  fromX = entity.x,
  attacker?: EcoEntity,
) {
  if (!living(entity)) {
    return 0
  }

  const edge = attacker ? world.edge(attacker, entity) : 1
  const block =
    (entity.data.controlBlockUntil ?? 0) > world.time ? (entity.data.controlBlock ?? 0.5) : 1
  const adjusted = Math.max(0.2, amount * edge * block)

  if (attacker) {
    spawnEffect(
      world,
      edge > 1 ? 'dino-bite-burst' : 'dino-dust',
      entity.x,
      entity.anchor === 'bottom' ? entity.y - world.heightOf(entity) * 0.45 : entity.y,
      edge > 1 ? 2.3 : 1.8,
    )
  }

  if (entity.species === 'brachiosaurus' && adjusted < 5.5) {
    entity.fx = 'dazed'
    entity.data.shake = 0.45
    world.tally('brachio-shrug')
    return 0
  }

  entity.hp -= adjusted
  entity.fx = 'hurt'
  entity.data.hurt = 0.45
  entity.data.hitFlash = world.time
  entity.data.hitStopUntil = world.time + 0.07
  entity.vx += (entity.x >= fromX ? 1 : -1) * world.unit * Math.min(4.8, 1.6 + adjusted * 0.62)
  if (attacker) {
    attacker.data.hitStopUntil = world.time + 0.05
  }
  if (adjusted >= 1.8 || edge > 1) {
    world.effect({ amount: edge > 1 ? 0.75 : 0.45, type: 'shake', x: 0, y: 0 })
  }
  world.effect({
    amount: adjusted,
    text: `${Math.max(1, Math.round(adjusted))}${edge > 1 ? '!' : ''}`,
    tone: edge > 1 ? 'strong' : edge < 1 ? 'resist' : adjusted >= 2 ? 'heavy' : 'normal',
    type: 'damage',
    x: entity.x,
    y: entity.y - world.heightOf(entity) * (entity.anchor === 'center' ? 0.3 : 0.66),
  })
  world.gainControlResource(entity, adjusted * 5)

  if (attacker && (attacker.data.frenzyUntil ?? 0) > world.time) {
    heal(attacker, adjusted * 0.28)
  }

  if (attacker) {
    attacker.data.attackTimer = Math.max(attacker.data.attackTimer ?? 0, 0.5)
    attacker.data.attackKind =
      attacker.species === 'trex'
        ? attacker.state === 'chomp'
          ? 1
          : 2
        : attacker.species === 'triceratops'
          ? 3
          : attacker.species === 'brachiosaurus'
            ? attacker.state === 'stomp' || attacker.state === 'quake'
              ? 4
              : 2
            : attacker.species === 'pterodactyl'
              ? attacker.state === 'dive'
                ? 5
                : 6
              : attacker.species === 'quetzalcoatlus'
                ? attacker.state === 'stab' || attacker.state === 'gulp'
                  ? 1
                  : attacker.state === 'launch' || attacker.state === 'thermal-dive'
                    ? 5
                    : 6
                : 7
    world.gainControlResource(attacker, adjusted * 25)
  }

  if (entity.hp > 0) {
    return adjusted
  }

  if (entity.species === 'trex') {
    entity.targetId = null
    entity.data.carcassId = 0
    world.setAsset(entity, trexPose(entity))
    spawnEffect(world, 'dino-dust', entity.x, entity.y, 3.2)
    world.kill(entity)
    world.tally('trex-downed')
    return adjusted
  }

  world.kill(entity)
  return adjusted
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

function controlAction(
  entity: EcoEntity,
  world: EcoWorld,
  state: string,
  seconds: number,
  asset?: string,
  fx?: string,
) {
  entity.data.controlActionUntil = world.time + seconds
  entity.controlResetAsset = entity.controlResetAsset || entity.asset
  entity.targetId = null

  if (asset) {
    world.setAsset(entity, asset)
  }

  if (fx) {
    entity.fx = fx
    entity.data.controlFxUntil = world.time + seconds
  }

  world.setState(entity, state)
}

function isControlTarget(entity: EcoEntity, other: EcoEntity) {
  return (
    other !== entity &&
    living(other) &&
    other.maxHp > 1 &&
    other.species !== 'dino-carcass' &&
    !worldlessEffectSpecies.has(other.species)
  )
}

const worldlessEffectSpecies = new Set([
  'dino-ash',
  'dino-bite-burst',
  'dino-dust',
  'dino-feather-puff',
  'dino-impact',
  'dino-leaf-flutter',
  'dino-meat-bit',
  'dino-scrap',
  'dino-tail-streak',
  'eruption',
  'lava-bomb',
  'lava-flow',
  'lava-flank-left',
  'lava-flank-right',
  'lava-ground-sheet',
  'shooting-star',
  'volcano',
])

function frontTarget(entity: EcoEntity, world: EcoWorld, reach: number, vertical = 4.5) {
  const x = entity.x + entity.facing * reach * 0.5

  return world.nearest(
    { x, y: entity.y },
    (other) =>
      isControlTarget(entity, other) &&
      Math.sign(other.x - entity.x || entity.facing) === entity.facing &&
      Math.abs(other.y - entity.y) < world.unit * vertical,
    reach,
  )
}

function areaTargets(entity: EcoEntity, world: EcoWorld, radius: number) {
  return world.within(entity.x, entity.y, radius, (other) => isControlTarget(entity, other))
}

function shove(from: EcoEntity, target: EcoEntity, world: EcoWorld, force: number) {
  target.vx += (target.x >= from.x ? 1 : -1) * world.unit * force
  target.data.avoidX = from.x
}

function eatNearbyCarcass(entity: EcoEntity, world: EcoWorld) {
  const carcass = world.nearest(
    entity,
    (other) => other.species === 'dino-carcass' && (other.data.meat ?? 0) > 0,
    world.unit * 5,
  )

  if (!carcass) {
    return false
  }

  face(entity, carcass.x)
  carcass.data.meat = Math.max(0, (carcass.data.meat ?? 1) - 0.25)
  carcass.data.shake = 0.35
  heal(entity, 2.4)
  controlAction(entity, world, 'feed', 0.85, trexPose(entity, 'feed'))
  spawnEffect(world, 'dino-meat-bit', trexMouth(entity, world).x, trexMouth(entity, world).y, 1)
  world.tally('trex-feed')
  return true
}

function eatFern(plant: EcoEntity, world: EcoWorld) {
  plant.targetId = null
  plant.data.growth = 0
  plant.data.nibbled = 1
  plant.scale = 0.42
  world.setState(plant, 'grow')
}

function eatTreeFoliage(tree: EcoEntity, world: EcoWorld) {
  tree.data.foliage = Math.max(0, (tree.data.foliage ?? 1) - between(0.28, 0.42))
  tree.data.regrowAt = world.time + between(12, 20)
  tree.fx = 'nibbled'

  if ((tree.data.foliage ?? 0) <= 0.38) {
    world.setAsset(tree, treeThinAsset)
    world.setState(tree, 'regrow')
  }
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

function nestPredator(entity: EcoEntity, world: EcoWorld, radius: number) {
  const nest = world.nearest(entity, isEgg, radius)

  if (!nest) {
    return null
  }

  return world.nearest(
    nest,
    (other) => other.species === 'trex' || other.species === 'pterodactyl',
    world.unit * 7,
  )
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
    if (entity.data.avoidX !== undefined) {
      entity.facing = entity.x >= entity.data.avoidX ? 1 : -1
      walk(entity, world, dt, unit * speed * 1.3)
      hop(entity, dt, unit * 0.3, 7)
    }

    if (entity.t > 1.8 && !fire) {
      delete entity.data.avoidX
      settle(entity, dt)
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
    entity.maxHp = entity.hp
    world.setAsset(entity, adultAsset)
    world.setState(entity, 'graze')
    world.tally('eggs-hatched')
    return false
  }

  const unit = world.unit
  const threat = world.nearest(
    entity,
    (other) => isTrex(other) || world.has(other, 'fire'),
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

const araucariaTree: EcoSpecies = {
  anchor: 'bottom',
  asset: treeAsset,
  burnTime: 4.5,
  countAs: 'araucaria-tree',
  idle: 'sway',
  init(entity) {
    entity.data.foliage = entity.data.foliage ?? 1
    entity.data.regrowAt = entity.data.regrowAt ?? 0
  },
  layer: 'front',
  rest(entity) {
    entity.data.foliage = 1
    entity.scale = 1
    entity.state = 'ripe'
  },
  size: [9.6, 11.2],
  state: 'ripe',
  style: (entity) => ({
    '--prehistoric-tree-foliage': `${clamp(entity.data.foliage ?? 1, 0.25, 1)}`,
  }),
  tags: ['plant', 'fuel', 'burnable'],
  tick(entity, world, dt) {
    if ((entity.data.burn ?? 0) > 0) {
      world.setAsset(entity, treeCharredAsset)
    }

    if ((entity.data.foliage ?? 1) >= 1 && entity.fx === 'nibbled') {
      entity.fx = ''
    }

    if (entity.state === 'regrow') {
      const ready = (entity.data.regrowAt ?? 0) < world.time
      entity.data.foliage = Math.min(1, (entity.data.foliage ?? 0.25) + dt * (ready ? 0.12 : 0.025))

      if ((entity.data.foliage ?? 0) >= 0.88) {
        entity.data.foliage = 1
        entity.fx = ''
        world.setAsset(entity, treeAsset)
        world.setState(entity, 'ripe')
      }
    }

    if (
      world.canBreed() &&
      entity.t > 9 &&
      (entity.data.foliage ?? 1) > 0.85 &&
      chance(0.012, dt) &&
      !world.nearest(
        entity,
        (other) => other.species === 'araucaria-tree' && other !== entity,
        world.unit * 10,
      )
    ) {
      world.spawn('araucaria-tree', {
        x: clamp(
          entity.x + pick([-1, 1]) * between(7, 14) * world.unit,
          world.unit * 2,
          world.width - world.unit * 2,
        ),
      })
    }
  },
}

function trexMouth(entity: EcoEntity, world: EcoWorld, low = false) {
  return {
    x: entity.x + entity.facing * world.widthOf(entity) * (low ? 0.4 : 0.46),
    y: entity.y - entity.lift - world.heightOf(entity) * (low ? 0.36 : 0.62),
  }
}

function trexReset(entity: EcoEntity, world: EcoWorld, state = 'prowl') {
  entity.targetId = null
  entity.data.snapped = 0
  entity.data.carcassId = 0
  world.setAsset(entity, trexPose(entity))
  world.setState(entity, state)
}

function makeCarcass(prey: EcoEntity, world: EcoWorld, holder: EcoEntity) {
  const groundLift =
    prey.anchor === 'bottom'
      ? prey.lift
      : Math.max(0, world.groundY - prey.y - world.heightOf(prey) * 0.5)
  const carcass = world.spawn('dino-carcass', {
    countAs: null,
    data: { holder: holder.id, meat: 1 },
    facing: prey.facing,
    size: prey.size,
    state: 'held',
    x: prey.x,
  })

  if (!carcass) {
    return null
  }

  world.setAsset(carcass, prey.asset)
  carcass.scale = prey.scale
  carcass.lift = groundLift
  world.remove(prey)
  world.tally('trex-kill')

  return carcass
}

function trexBite(entity: EcoEntity, prey: EcoEntity, world: EcoWorld) {
  const mouth = trexMouth(entity, world)
  const preyY = prey.anchor === 'bottom' ? prey.y - world.heightOf(prey) * 0.55 : prey.y

  spawnEffect(world, 'dino-bite-burst', (mouth.x + prey.x) / 2, (mouth.y + preyY) / 2, 2.8)
  world.tally('trex-bite')

  if (prey.species === 'dino-nest') {
    spawnEffect(world, 'dino-dust', prey.x, prey.y, 1.8)
    world.kill(prey)
    world.tally('eggs-stolen')
    entity.data.hunger = Math.max(0, (entity.data.hunger ?? 0) - 0.7)
    return null
  }

  if (prey.species === 'pterodactyl' || prey.species === 'meganeura') {
    spawnEffect(world, 'dino-feather-puff', prey.x, prey.y, 2.2)
  }

  const lethal =
    isBabyHerbivore(prey) || prey.species === 'pterodactyl' || prey.species === 'meganeura'

  if (!lethal) {
    damage(prey, world, prey.species === 'brachiosaurus' ? 4 : 2.2, entity.x, entity)
  }

  if (lethal || prey.dying || prey.hp <= 0) {
    return makeCarcass(prey, world, entity)
  }

  prey.data.avoidX = entity.x
  prey.data.shake = 0.5
  prey.vx += entity.facing * world.unit * 2.4
  world.setState(prey, prey.species === 'pterodactyl' ? 'takeoff' : 'flee')

  return null
}

function trexPrey(entity: EcoEntity, world: EcoWorld) {
  const unit = world.unit
  const starving = (entity.data.hunger ?? 0) > 1.8

  return (
    world.nearest(entity, isBabyHerbivore, unit * 44) ??
    world.nearest(entity, isEgg, unit * 30) ??
    world.nearest(
      entity,
      (other) => isAdultHerbivore(other) && world.matchup(entity, other) === 'strong',
      unit * 64,
    ) ??
    (starving ? world.nearest(entity, isAdultHerbivore, unit * 44) : null)
  )
}

type DinoAbilityConfig = {
  active?: number
  amount?: number | ((target: EcoEntity) => number)
  archetype?: string
  asset?: string | ((entity: EcoEntity) => string)
  buff?: { block?: number; icon: string; name: string; seconds: number; speed?: number }
  charge?: { max: number; min?: number }
  cooldown: number
  dash?: number
  description: string
  heal?: number | ((entity: EcoEntity, world: EcoWorld) => number)
  icon?: string
  key: 'q' | 'w' | 'e' | 'r'
  name: string
  radius?: number
  recovery?: number
  shape: 'circle' | 'cone' | 'ellipse' | 'line' | 'self'
  state?: string
  target?: 'area' | 'front'
  ultimate?: boolean
  vfx?: EcoControlAbility['vfx']
  width?: number
  windup?: number
  onRun?: (entity: EcoEntity, world: EcoWorld, context: EcoControlAbilityContext) => void
  onHit?: (entity: EcoEntity, target: EcoEntity, world: EcoWorld) => void
}

function dinoAbility(config: DinoAbilityConfig): EcoControlAbility {
  const range = config.radius ?? config.dash ?? 5
  const width = config.width ?? (config.shape === 'line' ? 2.6 : range)
  const windup = Math.max(
    config.windup ?? 0.22,
    config.key === 'r' ? 0.45 : config.key === 'q' ? 0.25 : 0,
  )

  return {
    active: config.active ?? 0.26,
    archetype: config.archetype,
    charge: config.charge,
    cooldown: config.cooldown,
    dash: config.dash,
    description: config.description,
    icon: config.icon,
    key: config.key,
    name: config.name,
    recovery: config.recovery ?? 0.28,
    telegraph: { range, shape: config.shape, width },
    ultimate: config.ultimate,
    vfx: config.vfx,
    windup,
    run(entity, world, context) {
      const asset = typeof config.asset === 'function' ? config.asset(entity) : config.asset

      controlAction(
        entity,
        world,
        config.state ?? entity.state,
        (config.active ?? 0.26) + 0.18,
        asset,
        config.vfx,
      )

      if (config.buff) {
        if (config.buff.block !== undefined) {
          entity.data.controlBlockUntil = world.time + config.buff.seconds
          entity.data.controlBlock = config.buff.block
        }

        if (config.buff.speed !== undefined) {
          entity.data.controlSpeedUntil = world.time + config.buff.seconds
          entity.data.controlSpeed = config.buff.speed
        }

        world.addControlBuff(entity, config.buff.name, config.buff.icon, config.buff.seconds)
      }

      if (config.heal !== undefined) {
        const amount = typeof config.heal === 'function' ? config.heal(entity, world) : config.heal

        world.heal(entity, amount)
      }

      if (config.vfx === 'shockwave' || config.ultimate) {
        world.shake(config.ultimate ? 0.9 : 0.42)
      }

      config.onRun?.(entity, world, context)
    },
    tick(entity, world, context) {
      if (config.amount === undefined) {
        return
      }

      const targets =
        config.target === 'front'
          ? [frontTarget(entity, world, world.unit * range, width)].filter(Boolean)
          : areaTargets(entity, world, world.unit * range)

      for (const target of targets) {
        if (!target || context.cast.hitIds.has(target.id)) {
          continue
        }

        if (
          config.shape === 'line' &&
          Math.sign(target.x - entity.x || entity.facing) !== entity.facing
        ) {
          continue
        }

        context.cast.hitIds.add(target.id)
        if (config.archetype?.includes('Basic')) {
          const comboKey = `combo-${config.key}`
          const lastAt = entity.data[`${comboKey}-at`] ?? 0
          const nextStep = lastAt + 1.2 > world.time ? ((entity.data[comboKey] ?? 0) % 3) + 1 : 1
          entity.data[comboKey] = nextStep
          entity.data[`${comboKey}-at`] = world.time
          if (nextStep === 3) {
            world.effect({
              text: 'Combo!',
              tone: 'heavy',
              type: 'banner',
              x: entity.x,
              y: entity.y - world.heightOf(entity),
            })
          }
        }

        const charge = clamp(entity.data.controlCharge ?? 1, 0.35, 1)
        const comboStep = config.archetype?.includes('Basic')
          ? (entity.data[`combo-${config.key}`] ?? 1)
          : 1
        const baseAmount =
          typeof config.amount === 'function' ? config.amount(target) : config.amount
        const amount =
          baseAmount * (config.charge ? 0.7 + charge * 0.75 : 1) * (comboStep === 3 ? 1.45 : 1)

        damage(target, world, amount, entity.x, entity)
        shove(entity, target, world, config.ultimate ? 5.2 : 3.2)
        config.onHit?.(entity, target, world)
      }
    },
  }
}

const trexControls = {
  abilities: [
    dinoAbility({
      active: 0.32,
      amount: (target) => (target.species === 'triceratops' ? 2.7 : 3.2),
      archetype: 'Basic 3-hit bite',
      asset: (entity) => trexPose(entity, 'chomp'),
      cooldown: 0.72,
      dash: 1.4,
      description: 'Fast jaw snap basic attack; every third bite hits harder.',
      icon: 'bite',
      key: 'q',
      name: 'Bone bite',
      radius: 5.8,
      shape: 'line',
      state: 'chomp',
      target: 'front',
      vfx: 'bite',
      width: 5.8,
      windup: 0.16,
      onRun(entity, world) {
        eatNearbyCarcass(entity, world)
        world.tally('trex-bite')
      },
      onHit(entity, target, world) {
        spawnEffect(
          world,
          'dino-bite-burst',
          target.x,
          target.y - world.heightOf(target) * 0.4,
          2.6,
        )
        if ((entity.data.lastBiteAt ?? 0) + 1.5 > world.time) {
          world.effect({
            text: 'Combo!',
            tone: 'heavy',
            type: 'banner',
            x: entity.x,
            y: entity.y - world.heightOf(entity),
          })
        }
        entity.data.lastBiteAt = world.time
      },
    }),
    dinoAbility({
      amount: 1.45,
      archetype: 'Hold to charge',
      asset: (entity) => trexPose(entity, 'clamp'),
      charge: { max: 1.15, min: 0.22 },
      cooldown: 3.2,
      description: 'Hold to brace the skull and shove with a short shoulder-check.',
      icon: 'charge',
      key: 'w',
      name: 'Shoulder check',
      radius: 5.6,
      shape: 'line',
      state: 'charge',
      target: 'front',
      vfx: 'charge',
      width: 5.2,
      windup: 0.45,
      onRun(entity, world) {
        spawnEffect(world, 'dino-dust', entity.x + entity.facing * world.unit * 2, entity.y, 3.2)
        world.tally('trex-swat')
      },
    }),
    dinoAbility({
      active: 0.34,
      archetype: 'Intimidation shout',
      asset: (entity) => trexPose(entity),
      cooldown: 3.8,
      description: 'Roar from the mouth in a short cone so smaller creatures flinch and back off.',
      icon: 'roar',
      key: 'e',
      name: 'Tyrant roar',
      radius: 6.4,
      shape: 'cone',
      state: 'prowl',
      vfx: 'shockwave',
      width: 5.2,
      windup: 0.36,
      onRun(entity, world) {
        const mouth = trexMouth(entity, world)
        for (const target of world.within(
          mouth.x,
          mouth.y,
          world.unit * 6.4,
          (other) => other !== entity && living(other),
        )) {
          if (
            target.species === 'dino-nest' ||
            target.species === 'araucaria-tree' ||
            target.species === 'fern'
          ) {
            continue
          }
          if (
            Math.sign(target.x - entity.x || entity.facing) !== entity.facing ||
            Math.abs(target.y - entity.y) > world.unit * 4
          ) {
            continue
          }
          if (world.matchup(entity, target) === 'strong' || isBabyHerbivore(target)) {
            target.data.avoidX = entity.x
            target.data.scatter = 1.8
            target.data.shake = 0.65
            target.targetId = null
            world.setState(target, target.anchor === 'center' ? 'takeoff' : 'flee')
          }
        }
      },
    }),
    dinoAbility({
      amount: 3.1,
      asset: (entity) => trexPose(entity, 'clamp'),
      buff: { icon: '⚡', name: 'Frenzy', seconds: 5.2, speed: 1.42 },
      cooldown: 3,
      description: 'Final Smash: clamp with the jaws and shake the target like prey.',
      icon: 'bite',
      key: 'r',
      name: 'Head-shake rip',
      radius: 6.2,
      shape: 'line',
      state: 'shake',
      target: 'front',
      ultimate: true,
      vfx: 'bite',
      width: 5.4,
      windup: 0.18,
      onRun(entity, world) {
        entity.data.frenzyUntil = world.time + 5.2
      },
      onHit(entity, target, world) {
        target.data.shake = 1.2
        spawnEffect(world, 'dino-bite-burst', target.x, target.y - world.heightOf(target) * 0.45, 3)
        world.heal(entity, 0.8)
      },
    }),
  ],
  idleState: 'prowl',
  move: 'ground',
  moveState: 'prowl',
  speed: 13,
} as const

const triceratopsControls = {
  abilities: [
    dinoAbility({
      active: 0.24,
      amount: (target) => (target.species === 'trex' ? 1.65 : 1.2),
      archetype: 'Basic 3-hit horn',
      asset: triceratopsChargeAsset,
      cooldown: 0.78,
      dash: 1.2,
      description: 'Quick horn basic attack; every third jab hits harder.',
      icon: 'horn',
      key: 'q',
      name: 'Horn gore',
      shape: 'line',
      state: 'charge',
      target: 'front',
      vfx: 'charge',
      width: 4.8,
      windup: 0.14,
      onRun(entity, world) {
        spawnEffect(world, 'dino-dust', entity.x, entity.y, 2.8)
        world.tally('triceratops-charge')
      },
    }),
    dinoAbility({
      archetype: 'Frill intimidation',
      buff: { block: 0.34, icon: '◆', name: 'Frill', seconds: 4 },
      cooldown: 6.5,
      description: 'Flash the frill so smaller predators hesitate and back off.',
      icon: 'frill',
      key: 'w',
      name: 'Frill flare',
      radius: 8,
      shape: 'self',
      state: 'graze',
      vfx: 'shockwave',
      windup: 0.18,
      onRun(entity, world) {
        for (const target of areaTargets(entity, world, world.unit * 8)) {
          if (target.species === 'trex' || target.size > entity.size * 1.2) {
            continue
          }
          target.data.avoidX = entity.x
          target.data.scatter = 1.8
          target.targetId = null
          world.setState(target, target.anchor === 'center' ? 'takeoff' : 'flee')
        }
      },
    }),
    dinoAbility({
      amount: (target) => (target.species === 'trex' ? 2.6 : 1.85),
      archetype: 'Hold to charge',
      asset: triceratopsChargeAsset,
      charge: { max: 1.2, min: 0.25 },
      cooldown: 3.4,
      dash: 2.8,
      description: 'Hook under a target with the horns and toss it upward.',
      icon: 'headbutt',
      key: 'e',
      name: 'Horn toss',
      radius: 5.4,
      shape: 'line',
      state: 'charge',
      target: 'area',
      vfx: 'charge',
      width: 4,
      windup: 0.45,
      onHit(_entity, target) {
        target.vy -= 9
        target.lift = Math.max(target.lift, 1.6)
      },
    }),
    dinoAbility({
      active: 0.62,
      amount: 2.05,
      archetype: 'Herd-call Final Smash',
      asset: triceratopsChargeAsset,
      buff: { icon: '⚡', name: 'Herd', seconds: 3.4, speed: 1.35 },
      cooldown: 3,
      dash: 7.2,
      description: 'Final Smash: bellow for the herd and surge forward behind their rumble.',
      icon: 'herd',
      key: 'r',
      name: 'Herd call',
      shape: 'line',
      state: 'charge',
      target: 'area',
      ultimate: true,
      vfx: 'charge',
      width: 5.2,
      windup: 0.42,
    }),
  ],
  idleState: 'graze',
  move: 'ground',
  moveState: 'graze',
  speed: 13.5,
} as const

const stegosaurusControls = {
  abilities: [
    dinoAbility({
      amount: (target) => (target.species === 'trex' ? 2.3 : 1.65),
      archetype: 'Basic 3-hit tail',
      asset: stegosaurusSwingAsset,
      cooldown: 0.78,
      description: 'Fast thagomizer basic attack; every third spike swing hits harder.',
      icon: 'thagomizer',
      key: 'q',
      name: 'Thagomizer',
      radius: 5.6,
      shape: 'cone',
      state: 'swing',
      target: 'area',
      vfx: 'slash',
      width: 6,
      windup: 0.16,
      onRun(entity, world) {
        spawnEffect(
          world,
          'dino-tail-streak',
          entity.x - entity.facing * world.unit * 2.2,
          entity.y - world.heightOf(entity) * 0.38,
          3.4,
        )
      },
    }),
    dinoAbility({
      archetype: 'Plate intimidation',
      buff: { block: 0.24, icon: '◆', name: 'Flush', seconds: 3.6 },
      cooldown: 6.5,
      description: 'Flush the plates warm red to warn predators off.',
      icon: 'plate',
      key: 'w',
      name: 'Plate flush',
      radius: 7,
      shape: 'self',
      state: 'plate-flush',
      vfx: 'shockwave',
      windup: 0.18,
      onRun(entity, world) {
        for (const target of areaTargets(entity, world, world.unit * 7)) {
          if (world.matchup(target, entity) === 'strong') {
            continue
          }
          target.data.avoidX = entity.x
          target.data.scatter = 1.2
          target.targetId = null
        }
      },
    }),
    dinoAbility({
      archetype: 'Sidestep pivot',
      asset: stegosaurusSwingAsset,
      cooldown: 3.8,
      dash: -2.4,
      description: 'Step sideways, pivot the hips and line up the thagomizer.',
      icon: 'pivot',
      key: 'e',
      name: 'Sidestep pivot',
      radius: 4,
      shape: 'line',
      state: 'sidestep',
      vfx: 'charge',
      windup: 0.32,
      onRun(entity, world) {
        entity.facing *= -1
        entity.data.controlSpeedUntil = world.time + 1.4
        entity.data.controlSpeed = 1.25
        spawnEffect(world, 'dino-dust', entity.x, entity.y, 2)
      },
    }),
    dinoAbility({
      amount: 1.9,
      archetype: 'Low-brace Final Smash',
      asset: stegosaurusSwingAsset,
      buff: { block: 0.58, icon: '◆', name: 'Brace', seconds: 3.2 },
      charge: { max: 1.25, min: 0.28 },
      cooldown: 3,
      description: 'Final Smash: crouch low, armor the flank and punish anything close.',
      icon: 'rush',
      key: 'r',
      name: 'Low brace',
      radius: 5.2,
      shape: 'line',
      state: 'brace',
      target: 'area',
      ultimate: true,
      vfx: 'charge',
      width: 5,
    }),
  ],
  idleState: 'graze',
  move: 'ground',
  moveState: 'graze',
  speed: 10,
} as const

const brachiosaurusControls = {
  abilities: [
    dinoAbility({
      amount: 2.1,
      archetype: 'Basic 3-hit neck sweep',
      asset: brachiosaurusAsset,
      cooldown: 0.82,
      description: 'Swing the long neck down from height; every third head-butt hits harder.',
      icon: 'headbutt',
      key: 'q',
      name: 'Neck sweep',
      radius: 8,
      shape: 'cone',
      state: 'neck',
      target: 'area',
      vfx: 'charge',
      width: 8,
      windup: 0.18,
    }),
    dinoAbility({
      amount: 2.35,
      archetype: 'Hold to charge ellipse',
      asset: brachiosaurusAsset,
      charge: { max: 1.35, min: 0.32 },
      cooldown: 5,
      description: 'Hold a rearing stomp, then slam a big elliptical quake.',
      icon: 'quake',
      key: 'w',
      name: 'Stomp quake',
      radius: 10,
      shape: 'ellipse',
      state: 'quake',
      target: 'area',
      vfx: 'shockwave',
      width: 6.5,
      windup: 0.55,
      onHit(_entity, target) {
        target.data.shake = 0.7
      },
    }),
    dinoAbility({
      active: 3.35,
      asset: brachiosaurusBrowseAsset,
      archetype: 'Browse heal',
      cooldown: 4.2,
      description: 'Lean into a tree or fern, browse leaves and heal.',
      icon: 'neck',
      key: 'e',
      name: 'Lean browse',
      radius: 7,
      shape: 'line',
      state: 'tree-eat',
      vfx: 'heal',
      windup: 0.34,
      onRun(entity, world) {
        const tree = world.nearest(entity, isTree, world.unit * 14)
        if (tree) {
          face(entity, tree.x)
          eatTreeFoliage(tree, world)
          spawnBrachioLeaves(
            world,
            tree.x - entity.facing * world.widthOf(tree) * 0.16,
            entity.y - world.heightOf(entity) * 0.72,
            entity.facing,
          )
          world.heal(entity, 3.2)
          world.tally('brachio-tree-browse')
          return
        }
        const fern = world.nearest(entity, isFern, world.unit * 7)
        if (fern) {
          eatFern(fern, world)
          world.heal(entity, 1.4)
        }
      },
    }),
    dinoAbility({
      amount: 1.65,
      archetype: 'Ultimate buff',
      asset: brachiosaurusAsset,
      buff: { block: 0.55, icon: '◆', name: 'Body block', seconds: 4, speed: 1.3 },
      cooldown: 3,
      dash: 4.2,
      description: 'Final Smash: use sheer size to body-block and shove through enemies.',
      icon: 'shield',
      key: 'r',
      name: 'Body block',
      radius: 7.5,
      shape: 'line',
      state: 'browse',
      target: 'area',
      ultimate: true,
      vfx: 'charge',
      width: 7,
    }),
  ],
  idleState: 'browse',
  move: 'ground',
  moveState: 'browse',
  speed: 8.5,
} as const

const pterodactylControls = {
  abilities: [
    dinoAbility({
      amount: 1.05,
      archetype: 'Close wing buffet',
      asset: pterodactylAsset,
      cooldown: 0,
      dash: 2.4,
      description: 'Swoop close, flare both wings, and buffet prey with the body.',
      icon: 'gust',
      key: 'q',
      name: 'Wing buffet',
      radius: 5.8,
      shape: 'cone',
      state: 'gust',
      target: 'area',
      vfx: 'shockwave',
      width: 5.8,
      windup: 0.16,
      onHit(entity, target, world) {
        target.vx += entity.facing * world.unit * 3.6
        target.vy -= world.unit * 1.4
      },
    }),
    dinoAbility({
      active: 0.54,
      amount: (target) => (target.species === 'dino-nest' ? 3 : 1.8),
      asset: pterodactylDiveAsset,
      archetype: 'Hold diagonal dive-bomb',
      charge: { max: 1.2, min: 0.24 },
      cooldown: 0,
      dash: 9.8,
      description: 'Fold the wings high, hold a long diagonal line, then dive-bomb through it.',
      icon: 'dive',
      key: 'w',
      name: 'Dive-bomb',
      radius: 14,
      shape: 'line',
      state: 'dive',
      target: 'area',
      vfx: 'charge',
      width: 4.8,
      windup: 0.38,
      onHit(_entity, target, world) {
        spawnEffect(world, 'dino-feather-puff', target.x, target.y, 3.2)
      },
    }),
    dinoAbility({
      amount: (target) =>
        target.species === 'meganeura' || target.species === 'dino-nest' ? 1.4 : 0.9,
      archetype: 'Talon snatch',
      asset: pterodactylAsset,
      cooldown: 0,
      dash: 6.2,
      description: 'Hook prey with the talons during a close swoop and pop it upward.',
      icon: 'claw',
      key: 'e',
      name: 'Talon snatch',
      radius: 7.2,
      shape: 'line',
      state: 'spiral',
      target: 'front',
      vfx: 'slash',
      width: 4.2,
      onHit(_entity, target, world) {
        target.lift = Math.max(target.lift, world.unit * 1.1)
        target.vy -= world.unit * 4.2
        target.data.scatter = 0.5
      },
    }),
    dinoAbility({
      asset: pterodactylAsset,
      archetype: 'Final Smash figure-eight',
      buff: { icon: '⚡', name: 'Thermal', seconds: 4.5, speed: 1.7 },
      cooldown: 3,
      description: 'Final Smash: loop a figure-eight sky path and rake everything below.',
      icon: 'thermal',
      key: 'r',
      name: 'Sky rake',
      radius: 16,
      shape: 'circle',
      state: 'figure',
      target: 'area',
      ultimate: true,
      vfx: 'charge',
      onRun(entity, world) {
        entity.vy -= world.unit * 4
        spawnEffect(world, 'dino-feather-puff', entity.x, entity.y, 4)
      },
    }),
  ],
  idleState: 'soar',
  move: 'fly',
  moveState: 'soar',
  speed: 20,
} as const

const quetzalcoatlusControls = {
  abilities: [
    dinoAbility({
      active: 0.28,
      amount: (target) => (isSmallQuetzPrey(target) ? 1.75 : 1.05),
      archetype: 'Basic 3-hit beak string',
      asset: quetzalcoatlusAsset,
      cooldown: 0,
      dash: 1.1,
      description: 'Fast long-reach jab with the giant beak; the third hit can lift small prey.',
      icon: 'beak',
      key: 'q',
      name: 'Beak stab',
      radius: 8.6,
      shape: 'line',
      state: 'stab',
      target: 'front',
      vfx: 'bite',
      width: 3.8,
      windup: 0.12,
      onHit(entity, target, world) {
        if ((entity.data['combo-q'] ?? 1) === 3 && isSmallQuetzPrey(target)) {
          target.lift = Math.max(target.lift, world.unit * 1.4)
          target.vy -= world.unit * 4.6
          target.data.shake = 0.55
        }
      },
    }),
    dinoAbility({
      active: 0.44,
      amount: 1.45,
      archetype: 'Hold quad-launch',
      asset: quetzalcoatlusFlightAsset,
      charge: { max: 1.25, min: 0.24 },
      cooldown: 0,
      dash: 2.2,
      description: 'Hold to crouch onto folded wings, then vault skyward and slam down.',
      icon: 'launch',
      key: 'w',
      name: 'Quad-launch',
      radius: 8.2,
      shape: 'ellipse',
      state: 'launch',
      target: 'area',
      vfx: 'charge',
      width: 5.4,
      windup: 0.46,
      onRun(entity, world) {
        const charge = clamp(entity.data.controlCharge ?? 1, 0.35, 1)
        entity.lift = Math.max(entity.lift, world.unit * (2.4 + charge * 6.8))
        entity.vy = -world.unit * (2.8 + charge * 5)
        entity.data.flightPoseUntil = world.time + 1.15
        spawnEffect(world, 'dino-dust', entity.x, entity.y, 3.3)
      },
      onHit(_entity, target, world) {
        target.lift = Math.max(target.lift, world.unit * 0.8)
        target.vy -= world.unit * 2.4
        target.data.shake = 0.6
      },
    }),
    dinoAbility({
      active: 0.36,
      amount: (target) => (isSmallQuetzPrey(target) ? 1.35 : 0.85),
      archetype: 'Terrestrial stalk gulp',
      asset: quetzalcoatlusAsset,
      cooldown: 0,
      dash: 3.4,
      description: 'Stride on all fours, snatch a small animal or egg, and swallow it whole.',
      icon: 'gulp',
      key: 'e',
      name: 'Stalk & gulp',
      radius: 7.4,
      shape: 'line',
      state: 'gulp',
      target: 'front',
      vfx: 'bite',
      width: 4.2,
      windup: 0.24,
      onHit(entity, target, world) {
        if (isSmallQuetzPrey(target)) {
          spawnEffect(
            world,
            'dino-feather-puff',
            target.x,
            target.y - world.heightOf(target) * 0.35,
            2.4,
          )
          world.kill(target)
          world.heal(entity, 0.7)
          entity.data.gulpUntil = world.time + 0.9
          world.tally('quetzalcoatlus-gulp')
        }
      },
    }),
    dinoAbility({
      active: 0.7,
      amount: 2.35,
      archetype: 'Thermal Final Smash',
      asset: quetzalcoatlusFlightAsset,
      buff: { icon: '⚡', name: 'Thermal', seconds: 3.8, speed: 1.45 },
      cooldown: 3,
      dash: 9.4,
      description: 'Final Smash: spiral up on a thermal, then cast a huge diving shadow.',
      icon: 'thermal',
      key: 'r',
      name: 'Thermal dive',
      radius: 15,
      shape: 'ellipse',
      state: 'thermal-dive',
      target: 'area',
      ultimate: true,
      vfx: 'shockwave',
      width: 7.8,
      windup: 0.55,
      onRun(entity, world) {
        entity.lift = Math.max(entity.lift, world.unit * 7.2)
        entity.data.flightPoseUntil = world.time + 2.8
        spawnEffect(
          world,
          'dino-feather-puff',
          entity.x,
          entity.y - world.heightOf(entity) * 0.5,
          4.8,
        )
      },
    }),
  ],
  idleState: 'strut',
  move: 'ground',
  moveState: 'strut',
  speed: 11.5,
} as const

const meganeuraControls = {
  abilities: [
    dinoAbility({
      amount: 0.8,
      archetype: 'Basic 3-hit dart',
      cooldown: 0.55,
      dash: 3.4,
      description: 'Tiny fast basic dart; every third jab stings harder.',
      icon: 'dart',
      key: 'q',
      name: 'Dart',
      radius: 4.5,
      shape: 'line',
      state: 'zip',
      target: 'front',
      vfx: 'charge',
      width: 3,
    }),
    dinoAbility({
      amount: 0.55,
      archetype: 'Hold to pester',
      charge: { max: 1, min: 0.2 },
      cooldown: 4.2,
      description: 'Hold a buzzing windup, then pester a T. rex into a stumble.',
      icon: 'pester',
      key: 'w',
      name: 'Pester',
      radius: 9,
      shape: 'circle',
      state: 'zip',
      target: 'area',
      vfx: 'shockwave',
      onHit(_entity, target, world) {
        if (target.species === 'trex') {
          target.fx = 'dazed'
          target.data.shake = 1.1
          target.data.scatter = 1.4
          target.targetId = null
          world.tally('dragonfly-pester')
        }
      },
    }),
    dinoAbility({
      archetype: 'Long range feint',
      buff: { icon: '⚡', name: 'Feint', seconds: 2.5, speed: 1.9 },
      cooldown: 5,
      dash: -3.2,
      description: 'Flick backward and leave a distracting shimmer trail.',
      icon: 'feint',
      key: 'e',
      name: 'Wing feint',
      radius: 4,
      shape: 'self',
      state: 'zip',
      vfx: 'buff',
    }),
    dinoAbility({
      archetype: 'Ultimate summon',
      cooldown: 3,
      description: 'Ultimate: call another giant dragonfly from the ferns.',
      icon: 'swarm',
      key: 'r',
      name: 'Swarm call',
      radius: 4,
      shape: 'self',
      state: 'zip',
      ultimate: true,
      vfx: 'buff',
      onRun(entity, world) {
        if (world.canBreed()) {
          world.spawn('meganeura', {
            countAs: null,
            x: clamp(entity.x + between(-2, 2) * world.unit, world.unit, world.width - world.unit),
            y: clamp(
              entity.y + between(-1, 1) * world.unit,
              world.skyTop + world.unit,
              world.groundY - world.unit * 2,
            ),
          })
        }
        spawnEffect(world, 'dino-feather-puff', entity.x, entity.y, 2.2)
      },
    }),
  ],
  idleState: 'zip',
  move: 'fly',
  moveState: 'zip',
  speed: 22,
} as const

const trex: EcoSpecies = {
  anchor: 'bottom',
  asset: () => pick(trexAssets),
  controls: trexControls,
  hp: 9,
  init(entity) {
    entity.data.variant = Math.max(0, trexAssets.indexOf(entity.asset))
    entity.data.hunger = between(0.6, 1.1)
  },
  layer: 'front',
  size: [8, 8.8],
  state: 'prowl',
  strongVs: ['brachiosaurus', 'pterodactyl', 'quetzalcoatlus', 'dino-nest'],
  tags: ['predator', 'burnable'],
  weakTo: ['triceratops', 'stegosaurus', 'meganeura'],
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
      trexReset(entity, world, 'flee')
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

    if (entity.state === 'shake') {
      settle(entity, dt)
      world.setAsset(entity, trexPose(entity, 'clamp'))
      const carcass = world.byId(entity.data.carcassId ?? null)

      if (!carcass) {
        trexReset(entity, world)
        return
      }

      if (entity.t > 1.25) {
        world.setState(carcass, 'drop')
        entity.targetId = carcass.id
        world.setState(entity, 'feed')
      }

      return
    }

    if (entity.state === 'feed') {
      const carcass = world.byId(entity.targetId)

      if (!carcass || carcass.state === 'held' || entity.t > 9) {
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1
        trexReset(entity, world)
        return
      }

      const side = entity.x <= carcass.x ? -1 : 1
      const goal = clamp(carcass.x + side * world.widthOf(entity) * 0.36, unit, world.width - unit)

      if (Math.abs(goal - entity.x) > unit * 0.4 && carcass.state !== 'down') {
        walkToward(entity, world, goal, unit * 2, dt)
        face(entity, carcass.x)
        return
      }

      face(entity, carcass.x)
      settle(entity, dt)
      const phase = Math.floor(entity.t / 0.7)
      const tearing = phase % 2 === 1
      world.setAsset(entity, trexPose(entity, tearing ? 'tear' : 'feed'))

      if (tearing && (entity.data.tore ?? -1) !== phase) {
        entity.data.tore = phase
        const mouth = trexMouth(entity, world)
        carcass.data.meat = (carcass.data.meat ?? 1) - 0.2 * clamp(7 / carcass.size, 0.5, 2)
        carcass.data.shake = 0.3
        world.tally('trex-feed')

        for (let index = 0; index < 2; index += 1) {
          world.spawn('dino-meat-bit', {
            countAs: null,
            vx: -entity.facing * unit * between(0.6, 2.6),
            vy: -unit * between(5, 8.5),
            x: mouth.x,
            y: mouth.y,
          })
        }
      }

      return
    }

    if (entity.state === 'swat') {
      settle(entity, dt)
      const bug = world.byId(entity.targetId)
      world.setAsset(entity, trexPose(entity, entity.t % 0.5 < 0.26 ? 'chomp' : 'clamp'))

      if (bug) {
        face(entity, bug.x)
      }

      if (entity.t > 0.55 && (entity.data.snapped ?? 0) <= 0) {
        entity.data.snapped = 1
        const mouth = trexMouth(entity, world)

        if (
          bug &&
          Math.hypot(bug.x - mouth.x, bug.y - mouth.y) < unit * 2.2 &&
          Math.random() < 0.35
        ) {
          spawnEffect(world, 'dino-bite-burst', bug.x, bug.y, 1.6)
          world.kill(bug)
          world.tally('trex-swat')
        } else if (bug) {
          bug.data.scatter = 1.4
          bug.data.avoidX = mouth.x
          world.tally('dragonfly-pester')
        }
      }

      if (entity.t > 1.4) {
        trexReset(entity, world)
      }

      return
    }

    if (entity.state === 'chomp') {
      settle(entity, dt)
      const prey = world.byId(entity.targetId)

      if (entity.t < 0.3) {
        world.setAsset(entity, trexPose(entity, 'chomp'))

        if (prey) {
          face(entity, prey.x)
        }

        return
      }

      world.setAsset(entity, trexPose(entity, 'clamp'))

      if ((entity.data.snapped ?? 0) <= 0) {
        entity.data.snapped = 1
        const mouth = trexMouth(entity, world)
        const reach = world.widthOf(entity) * 0.22 + (prey ? world.widthOf(prey) * 0.5 : 0)

        if (prey && Math.abs(prey.x - mouth.x) < reach) {
          const carcass = trexBite(entity, prey, world)

          if (carcass) {
            entity.data.carcassId = carcass.id
            entity.data.hunger = Math.max(0, (entity.data.hunger ?? 0) - 0.4)
            world.setState(entity, 'shake')
            return
          }
        } else {
          spawnEffect(world, 'dino-dust', mouth.x, entity.y, 1.6)
        }
      }

      if (entity.t > 0.78) {
        trexReset(entity, world)
      }

      return
    }

    const pest = world.nearest(
      trexMouth(entity, world),
      (other) => other.species === 'meganeura',
      unit * 3.6,
    )

    if (pest && (entity.data.swatAt ?? 0) < world.time) {
      entity.data.swatAt = world.time + between(2.4, 4.2)
      entity.data.snapped = 0
      entity.targetId = pest.id
      world.setState(entity, 'swat')
      return
    }

    const flier = world.nearest(
      trexMouth(entity, world),
      (other) => other.species === 'pterodactyl' && other.state === 'dive',
      unit * 3.4,
    )

    if (flier) {
      entity.targetId = flier.id
      world.setState(entity, 'chomp')
      return
    }

    if (entity.state === 'charge' || entity.state === 'stalk') {
      const prey = world.byId(entity.targetId)

      if (!prey || entity.t > 9) {
        trexReset(entity, world)
        return
      }

      const side = entity.x <= prey.x ? -1 : 1
      const goal = prey.x + side * (world.widthOf(entity) * 0.4 + world.widthOf(prey) * 0.18)
      const gap = walkToward(
        entity,
        world,
        clamp(goal, unit, world.width - unit),
        unit * (entity.state === 'charge' ? 4.6 : 2.2),
        dt,
      )
      face(entity, prey.x)
      hop(entity, dt, unit * 0.28, entity.state === 'charge' ? 6 : 3)

      if (gap < unit * 0.9 || Math.abs(prey.x - trexMouth(entity, world).x) < unit * 0.8) {
        entity.data.snapped = 0
        world.setState(entity, 'chomp')
      } else if (entity.state === 'stalk' && entity.t > 1.4) {
        world.setState(entity, 'charge')
      }

      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 8

    if ((entity.data.hunger ?? 0) > 1 && chance(0.7, dt)) {
      const prey = trexPrey(entity, world)

      if (prey) {
        entity.targetId = prey.id
        world.setState(entity, 'stalk')
        return
      }
    }

    world.setAsset(entity, trexPose(entity))
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
  controls: triceratopsControls,
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
  size: [5.6, 6.2],
  state: 'graze',
  strongVs: ['trex', 'quetzalcoatlus'],
  tags: ['prey', 'burnable'],
  weakTo: ['brachiosaurus'],
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
        damage(target, world, target.species === 'trex' ? 2.2 : 2, entity.x, entity)
        target.vx += entity.facing * unit * 5 * world.edge(entity, target)
        spawnEffect(world, 'dino-dust', target.x, target.y, 2.4)
        entity.data.meals = Math.max(0, (entity.data.meals ?? 0) - 1)
        entity.targetId = null
        world.tally('triceratops-charge')
        world.setAsset(entity, triceratopsAsset)
        world.setState(entity, 'graze')
      }

      return
    }

    const guarding = nestPredator(entity, world, unit * 12)
    const threat = guarding ?? world.nearest(entity, (other) => other.species === 'trex', unit * 13)

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

const isGrazerRival = (other: EcoEntity) =>
  (other.species === 'triceratops' || other.species === 'stegosaurus') &&
  (other.data.baby ?? 0) <= 0

function brachioBrowseX(entity: EcoEntity, tree: EcoEntity, world: EcoWorld) {
  const side = entity.x <= tree.x ? -1 : 1

  return clamp(
    tree.x + side * (world.widthOf(entity) * 0.44 + world.widthOf(tree) * 0.16),
    world.unit,
    world.width - world.unit,
  )
}

const brachiosaurus: EcoSpecies = {
  anchor: 'bottom',
  asset: brachiosaurusAsset,
  controls: brachiosaurusControls,
  hp: 10,
  init(entity, world) {
    entity.data.hunger = between(0.6, 1.1)

    if ((entity.data.baby ?? 0) > 0) {
      entity.scale = 0.5
      entity.hp = 3
      entity.data.growAt = between(58, 78)
      world.setAsset(entity, babyBySpecies.brachiosaurus)
    }
  },
  layer: 'front',
  size: [12.6, 13.8],
  state: 'browse',
  strongVs: ['triceratops', 'stegosaurus'],
  tags: ['prey'],
  weakTo: ['trex', 'quetzalcoatlus'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)

    if (handleBaby(entity, world, dt, brachiosaurusAsset)) {
      return
    }

    const fire = nearestFire(entity, world, 4.5)

    if (fire) {
      entity.targetId = null
      entity.data.zBoost = 0
      world.setAsset(entity, brachiosaurusAsset)
      world.setState(entity, 'flee')
      groundFlee(entity, world, fire, dt)
      return
    }

    const hunter = world.nearest(
      entity,
      (other) =>
        isTrex(other) &&
        other.targetId === entity.id &&
        (other.state === 'stalk' || other.state === 'charge'),
      unit * 16,
    )

    if (hunter && entity.state !== 'flee' && entity.state !== 'stomp') {
      entity.targetId = null
      entity.data.zBoost = 0
      entity.data.avoidX = hunter.x
      world.setAsset(entity, brachiosaurusAsset)
      world.setState(entity, 'flee')
    }

    if (entity.state === 'flee') {
      entity.facing = entity.x >= (entity.data.avoidX ?? entity.x) ? 1 : -1
      walk(entity, world, dt, unit * 1.5)
      entity.tilt = Math.sin(entity.t * 4) * 1.5

      if (entity.t > 2.8) {
        delete entity.data.avoidX
        world.setState(entity, 'browse')
      }

      return
    }

    if (entity.state === 'stomp') {
      settle(entity, dt)

      if (entity.t > 0.35 && (entity.data.stomped ?? 0) <= 0) {
        entity.data.stomped = 1
        world.tally('brachio-stomp')
        spawnEffect(world, 'dino-dust', entity.x + entity.facing * unit * 2, entity.y, 3.4)

        for (const other of world.within(
          entity.x,
          entity.y,
          unit * 8,
          (entry) => entry !== entity,
        )) {
          if (isGrazerRival(other) || other.species === 'trex' || other.species === 'pterodactyl') {
            damage(other, world, 1.4, entity.x, entity)
            other.vx += (other.x >= entity.x ? 1 : -1) * unit * 4
            other.data.avoidX = entity.x
            other.targetId = null
            world.setState(other, other.anchor === 'center' ? 'takeoff' : 'flee')
          } else if (other.species === 'meganeura') {
            other.vy -= unit * 4
            other.data.scatter = 1.2
          }
        }
      }

      if (entity.t > 0.9) {
        entity.data.stomped = 0
        world.setState(entity, entity.targetId ? 'tree-eat' : 'browse')
      }

      return
    }

    const guarding = nestPredator(entity, world, unit * 13)
    const rival =
      guarding ??
      world.nearest(entity, isGrazerRival, unit * (entity.state === 'tree-eat' ? 7 : 4.5))

    if (rival && (entity.data.stompAt ?? 0) < world.time) {
      entity.data.stompAt = world.time + between(5, 8)
      face(entity, rival.x)
      world.setAsset(entity, brachiosaurusAsset)
      world.setState(entity, 'stomp')
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 12

    if (entity.state === 'tree-eat') {
      const tree = world.byId(entity.targetId)
      settle(entity, dt)

      if (!tree || !isTree(tree)) {
        entity.targetId = null
        entity.data.zBoost = 0
        world.setAsset(entity, brachiosaurusAsset)
        world.setState(entity, 'browse')
        return
      }

      world.setAsset(entity, brachiosaurusBrowseAsset)
      entity.data.zBoost = Math.max(0, tree.y - entity.y) + 1
      face(entity, tree.x)

      if (entity.t > 1.2 && (entity.data.browsed ?? 0) <= 0) {
        entity.data.browsed = 1
        eatTreeFoliage(tree, world)
        spawnBrachioLeaves(
          world,
          tree.x - entity.facing * world.widthOf(tree) * 0.16,
          entity.y - world.heightOf(entity) * 0.72,
          entity.facing,
        )
        entity.data.hunger = 0
        entity.data.meals = (entity.data.meals ?? 0) + 1
        world.tally('brachio-tree-browse')
      }

      if (entity.t > 4.2) {
        entity.data.browsed = 0
        entity.data.zBoost = 0
        entity.targetId = null
        world.setAsset(entity, brachiosaurusAsset)
        world.setState(entity, 'browse')
      }

      return
    }

    if (entity.state === 'tree-seek') {
      const tree = world.byId(entity.targetId)

      if (!tree || !isTree(tree)) {
        entity.targetId = null
        world.setState(entity, 'browse')
        return
      }

      if (
        walkToward(entity, world, brachioBrowseX(entity, tree, world), unit * 0.9, dt) <
        unit * 0.4
      ) {
        world.setState(entity, 'tree-eat')
      }

      return
    }

    if ((entity.data.hunger ?? 0) > 1.05) {
      const tree = world.nearest(entity, isTree, unit * 40)

      if (tree) {
        entity.targetId = tree.id
        world.setState(entity, 'tree-seek')
        return
      }

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
  controls: stegosaurusControls,
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
  size: [5.8, 6.4],
  state: 'graze',
  strongVs: ['trex'],
  tags: ['prey', 'burnable'],
  weakTo: ['brachiosaurus'],
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
          damage(target, world, target.species === 'trex' ? 2.1 : 2, entity.x, entity)
          spawnEffect(
            world,
            'dino-tail-streak',
            entity.x - entity.facing * unit * 2,
            entity.y - world.heightOf(entity) * 0.42,
            3,
          )
          target.vx += entity.facing * unit * 4 * world.edge(entity, target)
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

    const guarding = nestPredator(entity, world, unit * 11)
    const behind =
      guarding ??
      world.nearest(
        entity,
        (other) =>
          other.species === 'trex' &&
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

function quetzTakeWing(entity: EcoEntity, world: EcoWorld) {
  world.setAsset(entity, quetzalcoatlusFlightAsset)
}

function quetzLand(entity: EcoEntity, world: EcoWorld) {
  entity.lift = 0
  entity.tilt = 0
  world.setAsset(entity, quetzalcoatlusAsset)
}

function quetzCruiseLift(entity: EcoEntity, world: EcoWorld) {
  const span = Math.max(world.unit * 6, world.groundY - world.skyTop - world.unit * 4)
  return span * (0.45 + ((entity.id * 37) % 30) / 100)
}

const quetzalcoatlus: EcoSpecies = {
  anchor: 'bottom',
  asset: quetzalcoatlusAsset,
  controls: quetzalcoatlusControls,
  hp: 5.8,
  init(entity, world) {
    entity.data.hunger = between(0.2, 0.75)
    entity.data.soarAt = world.time + between(5, 10)

    if (Math.random() < 0.5) {
      quetzTakeWing(entity, world)
      entity.lift = quetzCruiseLift(entity, world)
      entity.data.soarUntil = world.time + between(8, 14)
      world.setState(entity, 'soar')
    }
  },
  layer: 'front',
  size: [5, 5.6],
  state: 'strut',
  strongVs: ['pterodactyl', 'meganeura', 'dino-nest'],
  tags: ['predator', 'burnable'],
  weakTo: ['trex', 'triceratops'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)

    const trexThreat = world.nearest(entity, (other) => other.species === 'trex', unit * 10)

    if (
      trexThreat &&
      entity.state !== 'launch' &&
      entity.state !== 'soar' &&
      entity.state !== 'glide-down'
    ) {
      entity.data.avoidX = trexThreat.x
      quetzTakeWing(entity, world)
      world.setState(entity, 'launch')
    }

    if (entity.state === 'stab' || entity.state === 'gulp') {
      settle(entity, dt)
      world.setAsset(entity, quetzalcoatlusAsset)
      if (entity.t > 0.82) {
        entity.targetId = null
        world.setState(entity, 'strut')
      }
      return
    }

    if (entity.state === 'launch') {
      quetzTakeWing(entity, world)
      entity.lift += unit * dt * 6.5
      walk(entity, world, dt, unit * 3.2)
      if (entity.t > 1.1) {
        entity.data.soarUntil = world.time + between(9, 15)
        world.setState(entity, 'soar')
      }
      return
    }

    if (entity.state === 'soar' || entity.state === 'thermal-dive') {
      quetzTakeWing(entity, world)
      const cruise = quetzCruiseLift(entity, world)
      entity.lift += (cruise - entity.lift) * Math.min(1, dt * 0.8)
      entity.lift += Math.sin(world.time * 0.9 + entity.id) * unit * dt * 0.6
      const awayX = entity.data.avoidX
      const goalX =
        awayX !== undefined && trexThreat
          ? entity.x + (entity.x >= awayX ? 1 : -1) * unit * 10
          : (entity.data.glideGoalX ?? entity.x)
      if (
        entity.data.glideGoalX === undefined ||
        Math.abs(entity.x - (entity.data.glideGoalX ?? entity.x)) < unit * 2
      ) {
        entity.data.glideGoalX = between(unit * 4, world.width - unit * 4)
      }
      walkToward(entity, world, clamp(goalX, unit * 2, world.width - unit * 2), unit * 4.2, dt)
      entity.tilt = Math.sin(world.time * 0.7 + entity.id) * 4
      if (world.time > (entity.data.soarUntil ?? 0) && !trexThreat) {
        world.setState(entity, 'glide-down')
      }
      return
    }

    if (entity.state === 'glide-down') {
      quetzTakeWing(entity, world)
      entity.lift = Math.max(0, entity.lift - unit * dt * 3.4)
      walk(entity, world, dt, unit * 3)
      entity.tilt = 6
      if (entity.lift <= 0) {
        quetzLand(entity, world)
        entity.data.soarAt = world.time + between(7, 13)
        world.setState(entity, 'strut')
      }
      return
    }

    const prey = world.nearest(
      entity,
      (other) => living(other) && isSmallQuetzPrey(other),
      unit * 17,
    )

    if (prey && chance(0.72, dt)) {
      entity.targetId = prey.id
      face(entity, prey.x)
      const gap = walkToward(
        entity,
        world,
        clamp(prey.x, unit, world.width - unit),
        unit * 2.35,
        dt,
      )
      if (gap < unit * 1.4 || Math.abs(prey.x - entity.x) < unit * 3.8) {
        world.setState(
          entity,
          prey.species === 'dino-nest' || isBabyHerbivore(prey) ? 'gulp' : 'stab',
        )
      }
      return
    }

    entity.data.hunger = (entity.data.hunger ?? 0) + dt / 8
    world.setAsset(entity, quetzalcoatlusAsset)
    walk(entity, world, dt, unit * 0.95)
    settle(entity, dt)

    if ((entity.data.soarAt ?? 0) < world.time && chance(0.5, dt)) {
      quetzTakeWing(entity, world)
      world.setState(entity, 'launch')
      return
    }

    if (chance(0.07, dt)) {
      entity.facing = entity.facing === 1 ? -1 : 1
    }
  },
}

const pterodactyl: EcoSpecies = {
  anchor: 'center',
  asset: pterodactylAsset,
  controls: pterodactylControls,
  idle: 'flap',
  init(entity, world) {
    entity.y = between(world.skyTop + world.unit * 2, world.height * 0.35)
    entity.data.hunger = between(0.2, 0.85)
  },
  layer: 'front',
  size: [3.6, 4.4],
  state: 'soar',
  strongVs: ['meganeura', 'dino-nest'],
  tags: ['predator', 'burnable'],
  weakTo: ['trex', 'quetzalcoatlus'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)
    const volcanoThreat = world.nearest(
      entity,
      (other) =>
        (other.species === 'eruption' && other.state !== 'cool') ||
        (other.species === 'volcano' && other.state === 'erupt'),
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
        } else if (world.matchup(entity, target) === 'weak') {
          damage(target, world, 0.7, entity.x, entity)
          entity.data.avoidX = target.x
          world.setState(entity, 'takeoff')
        } else {
          world.kill(target)
          world.tally('ptero-dragonfly')
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

const meganeura: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('meganeura'),
  controls: meganeuraControls,
  idle: 'buzz',
  init(entity, world) {
    entity.y = between(world.skyTop + world.unit * 1.5, world.groundY - world.unit * 3.5)
    entity.data.breedAt = world.time + between(20, 34)
  },
  layer: 'front',
  size: [1.05, 1.2],
  state: 'zip',
  strongVs: ['trex'],
  tags: ['insect', 'prey', 'burnable'],
  weakTo: ['pterodactyl'],
  tick(entity, world, dt) {
    const unit = world.unit
    clearTimedFx(entity, dt)
    const threat = world.nearest(
      entity,
      (other) => other.species === 'pterodactyl' || world.has(other, 'fire'),
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
      entity.data.hunger = (entity.data.hunger ?? 0) + dt / 8
      const rex = world.nearest(entity, isTrex, unit * 16)
      let hunting = false

      if (rex && (entity.data.hunger ?? 0) > 0.9 && chance(0.5, dt)) {
        hunting = true
        const head = trexMouth(rex, world)
        entity.data.goalX = head.x + between(-1.4, 1.4) * unit
        entity.data.goalY = head.y + between(-1.2, 0.6) * unit
        entity.data.goalAt = world.time + between(1.4, 2.4)

        if (Math.hypot(head.x - entity.x, head.y - entity.y) < unit * 1.6) {
          entity.data.hunger = 0
          world.tally('dragonfly-pester')
        }
      }

      const plant = hunting ? null : world.nearest(entity, isFern, unit * 24)

      if (plant && chance(0.35, dt)) {
        entity.data.goalX = plant.x + between(-3, 3) * unit
        entity.data.goalY = plant.y - between(2.5, 7) * unit
        entity.data.goalAt = world.time + between(1.8, 3.2)
      }

      wander(
        entity,
        world,
        dt,
        unit * (hunting ? 5.4 : 4.4),
        hunting || plant ? world.groundY - unit * 10 : world.skyTop + unit * 1.5,
        world.groundY - unit * 2,
        5,
      )
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
  style: (entity) => ({
    '--dino-hatch-progress': `${clamp(entity.data.hatchProgress ?? 0, 0, 1)}`,
  }),
  tags: ['prey'],
  tick(entity, world, _dt) {
    const predator = world.nearest(
      entity,
      (other) => other.species === 'trex' || other.species === 'pterodactyl',
      world.unit * 5,
    )

    if (predator) {
      entity.fx = 'wobble'
    } else if (entity.fx === 'wobble') {
      entity.fx = ''
    }

    const hatchAt = (entity.data.hatchAt ?? 36) / ((entity.data.warm ?? 0) > 0 ? 2.7 : 1)
    entity.data.hatchProgress = clamp(entity.t / hatchAt, 0, 1)

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

const dinoCarcass: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('dino-scrap'),
  countAs: null,
  init(entity) {
    entity.data.meat = entity.data.meat ?? 1
    entity.data.life = between(22, 30)
  },
  layer: 'front',
  size: [3, 4],
  state: 'down',
  style: (entity) => ({
    '--dino-carcass-meat': `${clamp(entity.data.meat ?? 1, 0, 1)}`,
  }),
  tags: [],
  tick(entity, world, dt) {
    clearTimedFx(entity, dt)

    if (entity.state === 'held') {
      const holder = world.byId(entity.data.holder ?? null)

      if (!holder || holder.state !== 'shake') {
        world.setState(entity, 'drop')
        return
      }

      const mouth = trexMouth(holder, world)
      const height = world.heightOf(entity)
      const small = height < world.heightOf(holder) * 0.5
      entity.facing = holder.facing === 1 ? -1 : 1
      entity.x = mouth.x + holder.facing * (small ? 0 : world.widthOf(entity) * 0.3)
      entity.y = world.groundY + (entity.data.depth ?? 0)
      entity.lift = small ? Math.max(0, world.groundY - mouth.y - height * 0.55) : 0
      entity.tilt = Math.sin(holder.t * 26) * (small ? 24 : 5)
      return
    }

    if (entity.state === 'drop') {
      entity.lift = Math.max(0, entity.lift - dt * world.unit * 26)
      entity.tilt *= 0.85

      if (entity.lift <= 0) {
        entity.tilt = 0
        spawnEffect(world, 'dino-dust', entity.x, entity.y, 2)
        world.setState(entity, 'down')
      }

      return
    }

    entity.data.life = (entity.data.life ?? 24) - dt

    if ((entity.data.meat ?? 1) <= 0 || (entity.data.life ?? 0) <= 0) {
      world.spawn('dino-scrap', { countAs: null, x: entity.x })
      world.remove(entity)
    }
  },
}

const dinoMeatBit: EcoSpecies = {
  anchor: 'center',
  asset: ecoAsset('dino-meat-bit'),
  countAs: null,
  init(entity) {
    entity.data.spin = between(-540, 540)
  },
  layer: 'front',
  size: [0.75, 1.05],
  state: 'fly',
  tags: [],
  tick(entity, world, dt) {
    entity.vy += world.unit * 26 * dt
    integrate(entity, dt)
    entity.tilt += (entity.data.spin ?? 0) * dt

    if (entity.y >= world.groundY - world.unit * 0.2 || entity.t > 2) {
      world.remove(entity)
    }
  },
}

const transientSprite = (
  asset: string,
  size: readonly [number, number],
  state = 'burst',
  layer: 'front' | 'back' = 'front',
): EcoSpecies => ({
  anchor: 'center',
  asset,
  countAs: null,
  init(entity) {
    entity.data.life = entity.data.life ?? between(0.45, 0.9)
  },
  layer,
  size,
  state,
  tags: [],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 0.6) - dt
    entity.scale += dt * (entity.data.grow ?? 0.35)
    entity.data.opacity = clamp((entity.data.life ?? 0) / 0.8, 0, 1)

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
})

const dinoDust = transientSprite(dustAsset, [1.8, 3.2], 'dust')
const dinoBiteBurst = transientSprite(biteBurstAsset, [1.3, 2.5], 'burst')
const dinoFeatherPuff = transientSprite(featherPuffAsset, [1.4, 2.4], 'feathers')
const dinoLeafFlutter: EcoSpecies = {
  anchor: 'center',
  asset: leafFlutterAsset,
  countAs: null,
  init(entity) {
    entity.data.life = entity.data.life ?? between(0.8, 1.3)
  },
  layer: 'front',
  size: [1.1, 1.4],
  state: 'flutter',
  tags: [],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 1) - dt
    entity.data.opacity = clamp((entity.data.life ?? 0) / 0.8, 0, 1)
    entity.vy += world.unit * 1.2 * dt
    entity.x += Math.sin(world.time * 7 + entity.id) * world.unit * 0.12 * dt
    integrate(entity, dt)
    entity.tilt += (entity.data.spin ?? 0) * dt

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}
const dinoTailStreak = transientSprite(tailStreakAsset, [2.8, 4.2], 'streak')

const lavaFlow: EcoSpecies = {
  anchor: 'center',
  asset: lavaFlowAsset,
  countAs: null,
  init(entity) {
    entity.data.life = entity.data.life ?? between(8, 12)
    entity.data.coolAt = entity.data.coolAt ?? between(4.5, 6.5)
    entity.tilt = entity.data.tilt ?? between(-8, 8)
  },
  layer: 'front',
  size: [8, 18],
  state: 'flow',
  tags: ['fire', 'projectile'],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 10) - dt

    if (entity.state !== 'cooled') {
      if (entity.data.goalX !== undefined && entity.data.goalY !== undefined) {
        steer(
          entity,
          entity.data.goalX,
          entity.data.goalY,
          entity.data.speed ?? world.unit * 14,
          dt,
          3.5,
        )
        integrate(entity, dt)
      } else {
        entity.x += (entity.data.drift ?? 0) * dt
      }

      burnNearby(entity, world, world.unit * (entity.data.radius ?? 4.6), 9)

      if (entity.t > (entity.data.coolAt ?? 5)) {
        world.setAsset(entity, cooledLavaAsset)
        world.setState(entity, 'cooled')
      }
    }

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}

const lavaFlank = (asset: string): EcoSpecies => ({
  anchor: 'center',
  asset,
  countAs: null,
  init(entity) {
    entity.data.coolAt = entity.data.coolAt ?? 6.8
    entity.data.life = entity.data.life ?? entity.data.coolAt + 3.4
    entity.data.progress = 0
  },
  layer: 'front',
  size: [8, 13],
  state: 'flow',
  style: (entity) => ({
    '--prehistoric-lava-progress': `${clamp(entity.data.progress ?? 1, 0, 1)}`,
  }),
  tags: ['fire', 'projectile'],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 10) - dt
    entity.data.progress = Math.min(1, (entity.data.progress ?? 0) + dt * 0.5)

    if (entity.state !== 'cooled') {
      burnNearby(entity, world, world.unit * 3.8, 8)

      if (entity.t > (entity.data.coolAt ?? 6.8)) {
        world.setState(entity, 'cooled')
      }
    }

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
})

const lavaFlankLeft = lavaFlank(lavaFlankLeftAsset)
const lavaFlankRight = lavaFlank(lavaFlankRightAsset)

function burnGroundSheet(entity: EcoEntity, world: EcoWorld) {
  const width = world.widthOf(entity) * clamp(entity.data.progress ?? 1, 0, 1)
  const left = entity.x - world.widthOf(entity) * 0.5
  const right = left + width
  const top = entity.y - world.heightOf(entity) * 0.65
  const bottom = entity.y + world.heightOf(entity) * 0.45

  for (const other of world.within(
    entity.x,
    entity.y,
    world.widthOf(entity) * 0.56,
    (entry) => entry !== entity,
  )) {
    if (world.has(other, 'fire')) {
      continue
    }

    if (other.x < left || other.x > right || other.y < top || other.y > bottom + world.unit * 4) {
      continue
    }

    if (world.has(other, 'fuel')) {
      other.data.burn = Math.max(other.data.burn ?? 0, 0.2)
    }

    if (world.has(other, 'burnable') || other.species === 'brachiosaurus') {
      damage(other, world, 9, entity.x)
      world.tally('lava-hit')
    }
  }
}

const lavaGroundSheet: EcoSpecies = {
  anchor: 'center',
  asset: lavaGroundSheetAsset,
  countAs: null,
  init(entity) {
    entity.data.coolAt = entity.data.coolAt ?? 7.2
    entity.data.life = entity.data.life ?? entity.data.coolAt + 3.4
    entity.data.progress = 0
    entity.tilt = between(-1.5, 1.5)
  },
  layer: 'front',
  size: [15, 24],
  state: 'flow',
  style: (entity) => ({
    '--prehistoric-lava-progress': `${clamp(entity.data.progress ?? 1, 0, 1)}`,
  }),
  tags: ['fire', 'projectile'],
  tick(entity, world, dt) {
    entity.data.life = (entity.data.life ?? 11) - dt
    entity.data.progress = Math.min(
      1,
      (entity.data.progress ?? 0) + dt * (entity.data.rate ?? 0.22),
    )

    if (entity.state !== 'cooled') {
      burnGroundSheet(entity, world)

      if (entity.t > (entity.data.coolAt ?? 7.2)) {
        world.setState(entity, 'cooled')
      }
    }

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}

function launchBackdropLava(world: EcoWorld, x: number, y: number, mega = 1) {
  const unit = world.unit
  const targetX = clamp(x + between(-22, 28) * unit, unit, world.width - unit)
  const targetY = world.groundY - between(0.2, 1.8) * unit
  const arc = ballistic(
    x + between(-1.8, 1.8) * unit,
    y,
    targetX,
    targetY,
    between(1.0, 1.9),
    unit * 20,
  )

  world.spawn('lava-bomb', {
    countAs: null,
    data: { gravity: unit * 20, mega },
    vx: arc.vx,
    vy: arc.vy,
    x,
    y,
  })
}

function spawnLavaRiver(world: EcoWorld, x: number, y: number, index: number) {
  const unit = world.unit
  const mobile = world.width <= 767 || world.height > world.width * 1.25

  if (index === 1 || index === 2) {
    const rect =
      index === 1
        ? backdropRect(world, 160, 170, 188, 188)
        : backdropRect(world, 316, 170, 190, 188)
    const flow = world.spawn(index === 1 ? 'lava-flank-left' : 'lava-flank-right', {
      countAs: null,
      data: {
        coolAt: between(6.5, 8.2),
      },
      facing: 1,
      size: rect.width / unit,
      x: rect.x,
      y: rect.y,
    })

    if (flow) {
      flow.data.zBoost = -70
    }

    return
  }

  if (index > 5) {
    return
  }

  const baseX = clamp(x - unit * (mobile ? 5.4 : 9.2), unit * -1, world.width - unit)
  const width = Math.min(world.width * (mobile ? 0.72 : 0.52), unit * (mobile ? 22 : 30))
  const xOffset = (index - 3) * unit * (mobile ? 2.6 : 4.2)
  const sheet = world.spawn('lava-ground-sheet', {
    countAs: null,
    facing: 1,
    data: {
      coolAt: between(7, 9),
      rate: between(0.18, 0.27),
    },
    size: (width * between(0.7, 1)) / unit,
    x: clamp(baseX + width * 0.42 + xOffset, unit, world.width - unit),
    y: world.groundY - unit * between(mobile ? 4.6 : 3.9, mobile ? 5.8 : 5.1),
  })

  if (sheet) {
    sheet.data.zBoost = 110 + index
  }
}

const eruption: EcoSpecies = {
  anchor: 'center',
  asset: dinoEruptionAsset,
  countAs: 'eruption',
  init(entity, world) {
    const crater = craterPoint(world)
    entity.x = crater.x
    entity.y = crater.y
    entity.size = clamp(world.width / world.unit / 5.8, 9, 15)
    entity.data.craterX = crater.x
    entity.data.craterY = crater.y
    entity.data.burst = 0
    entity.data.river = 0
    entity.data.life = 12
    entity.data.zBoost = 500
  },
  layer: 'front',
  size: [9, 15],
  state: 'rumble',
  tags: ['fire'],
  tick(entity, world, dt) {
    const unit = world.unit
    const crater = craterPoint(world)
    entity.x = crater.x
    entity.y = crater.y
    entity.data.life = (entity.data.life ?? 12) - dt

    for (const other of world.within(
      entity.x,
      world.groundY,
      unit * 26,
      (entry) => entry !== entity,
    )) {
      if (
        other.species === 'dino-nest' ||
        other.species === 'araucaria-tree' ||
        other.species === 'fern' ||
        world.has(other, 'projectile')
      ) {
        continue
      }

      if (entity.state === 'rumble' || entity.t < 3.5) {
        other.data.avoidX = entity.x
        other.targetId = null
        world.setState(other, other.species === 'pterodactyl' ? 'takeoff' : 'flee')
      }
    }

    if (entity.state === 'rumble') {
      if ((entity.data.rumbled ?? 0) <= 0) {
        entity.data.rumbled = 1
        spawnEffect(world, 'dino-dust', entity.x, world.groundY - unit * 2, 4.2, { life: 1.2 })
      }

      if (entity.t > 1.2) {
        world.setState(entity, 'erupt')
      }

      return
    }

    if (entity.state === 'erupt') {
      if ((entity.data.burst ?? 0) <= 0) {
        entity.data.burst = 1
        world.tally('volcano-eruption')

        for (let index = 0; index < 9; index += 1) {
          world.spawn('dino-ash', {
            countAs: null,
            data: {
              driftX: between(-0.55, 0.35) * unit,
              driftY: -between(0.35, 0.9) * unit,
              life: between(6.5, 9.5),
              zBoost: 8500,
            },
            size: between(6.8, 13.5),
            x: entity.x + between(-3.8, 3.8) * unit,
            y: entity.y - between(1.2, 8) * unit,
          })
        }

        for (let index = 0; index < 12; index += 1) {
          launchBackdropLava(world, entity.x, entity.y, 1)
        }
      }

      if (entity.t > 0.55 && (entity.data.river ?? 0) < 8) {
        entity.data.river = (entity.data.river ?? 0) + 1
        spawnLavaRiver(world, entity.x, entity.y, entity.data.river)
      }

      if (entity.t > 5.8) {
        world.setState(entity, 'cool')
      }

      return
    }

    if (entity.state === 'cool') {
      entity.scale = Math.max(0.7, entity.scale - dt * 0.05)

      if ((entity.data.life ?? 0) <= 0) {
        world.remove(entity)
      }
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
    entity.data.life = entity.data.life ?? between(6, 9)
  },
  layer: 'back',
  size: [6, 14],
  state: 'spread',
  style: (entity) => ({
    '--prehistoric-ash-opacity': `${Math.max(0, entity.data.opacity ?? 1)}`,
  }),
  tags: [],
  tick(entity, world, dt) {
    const life = entity.data.life ?? 8
    entity.data.life = life - dt
    entity.data.opacity = clamp((entity.data.life ?? 0) / 8, 0, 0.92)
    entity.x += (entity.data.driftX ?? world.wind * 0.04) * dt
    entity.y += (entity.data.driftY ?? -world.unit * 0.28) * dt
    entity.scale += dt * 0.025

    if ((entity.data.life ?? 0) <= 0) {
      world.remove(entity)
    }
  },
}

function dinoStarTilt(entity: EcoEntity) {
  entity.tilt = clamp(
    (Math.atan2(entity.vy, Math.max(1, Math.abs(entity.vx))) * 180) / Math.PI,
    -8,
    42,
  )
}

function launchDinoStar(entity: EcoEntity, world: EcoWorld) {
  entity.x = between(-world.width * 0.12, world.width * 0.42)
  entity.y = between(world.skyTop + world.unit, Math.min(world.height * 0.24, world.skyBottom))
  entity.vx = world.width * between(0.52, 0.68)
  entity.vy = world.height * between(0.1, 0.17)
  entity.data.life = between(1.15, 1.55)
  entity.data.opacity = 0
  dinoStarTilt(entity)
}

function triggerDinoImpact(entity: EcoEntity, world: EcoWorld) {
  const impact = world.spawn('dino-impact', {
    countAs: null,
    data: { siteX: clamp(entity.x, 0, world.width) },
    x: clamp(entity.x, world.unit * 2, world.width - world.unit * 2),
    y: world.groundY + world.unit * 0.5,
  })

  if (impact) {
    impact.data.zBoost = world.height * 4
  }

  for (const other of [...world.entities]) {
    if (other === impact || other === entity || other.dying || other.removed) {
      continue
    }

    if (other.species === 'dino-nest') {
      other.data.warm = 1
      other.data.hatchAt = Math.min(other.data.hatchAt ?? 36, 12)
      other.fx = 'wobble'
      continue
    }

    if (other.species === 'araucaria-tree' || other.species === 'fern') {
      other.data.burn = Math.max(other.data.burn ?? 0, 0.4)
      continue
    }

    world.kill(other)
  }

  world.remove(entity)
}

const dinoShootingStar: EcoSpecies = {
  anchor: 'center',
  asset: dinoShootingStarAsset,
  countAs: 'shooting-star',
  init(entity, world) {
    const launched = world.tally('shooting-star')
    entity.data.turnAt = between(0.36, 0.62)
    entity.data.asteroid = launched >= asteroidStarCount ? 1 : 0

    if (entity.data.asteroid) {
      world.resetTally('shooting-star')
    }

    entity.size = between(7, 9.4)
    entity.facing = 1
    launchDinoStar(entity, world)
  },
  layer: 'front',
  rest(entity) {
    entity.data.opacity = 0.9
  },
  size: [7, 9.4],
  state: 'shoot',
  style: (entity) => ({
    '--dino-star-opacity': `${entity.data.opacity ?? 1}`,
  }),
  tags: ['star'],
  tick(entity, world, dt) {
    const unit = world.unit

    if (entity.state === 'asteroid') {
      const impactX =
        entity.data.impactX ?? clamp(entity.x + world.width * 0.22, unit, world.width - unit)
      const impactY = world.groundY + unit * 0.4
      steer(entity, impactX, impactY, unit * 18, dt, 1.6)
      entity.vy += unit * 20 * dt
      integrate(entity, dt)
      const approach = clamp(entity.y / Math.max(1, impactY), 0, 1)
      entity.size = 5.5 + approach * (entity.data.asteroidMax ?? 8)
      entity.scale = 1 + approach * 0.3
      tiltToVelocity(entity, 82)
      entity.data.opacity = 1

      for (const other of world.within(
        entity.x,
        entity.y,
        unit * 30,
        (entry) => entry !== entity,
      )) {
        if (other.species === 'pterodactyl') {
          other.data.avoidX = entity.x
          world.setState(other, 'takeoff')
        } else if (other.anchor === 'bottom' && other.species !== 'dino-nest') {
          other.fx = 'dazed'
          other.data.shake = Math.max(other.data.shake ?? 0, 0.35)
        }
      }

      if (entity.y >= impactY || entity.x < -unit * 10 || entity.x > world.width + unit * 10) {
        triggerDinoImpact(entity, world)
      }

      return
    }

    if ((entity.data.asteroid ?? 0) > 0 && entity.t > (entity.data.turnAt ?? 0.5)) {
      world.setAsset(entity, dinoAsteroidAsset)
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

    if (entity.state === 'wait') {
      entity.data.opacity = 0

      if (entity.t > (entity.data.waitFor ?? 5)) {
        launchDinoStar(entity, world)
        world.setAsset(entity, dinoShootingStarAsset)
        world.setState(entity, 'shoot')
      }

      return
    }

    integrate(entity, dt)
    dinoStarTilt(entity)
    const life = entity.data.life ?? 1.4
    const fadeIn = clamp(entity.t / 0.08, 0, 1)
    const fadeOut = clamp((life - entity.t) / 0.32, 0, 1)
    entity.data.opacity = Math.min(fadeIn, fadeOut)

    if (
      entity.t > life ||
      entity.x > world.width + world.widthOf(entity) ||
      entity.y > world.height * 0.48
    ) {
      entity.data.opacity = 0
      entity.data.waitFor = between(4, 7.5)
      world.setState(entity, 'wait')
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

      for (let index = 0; index < 12; index += 1) {
        world.spawn('dino-ash', {
          countAs: null,
          data: {
            driftX: between(-0.8, 0.8) * world.unit,
            driftY: -between(0.15, 0.55) * world.unit,
            life: between(7.5, 10),
            zBoost: 9000,
          },
          size: between(8, 16),
          x: clamp(entity.x + between(-18, 18) * world.unit, world.unit, world.width - world.unit),
          y: world.height * between(0.18, 0.42),
        })
      }

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
  'araucaria-tree': araucariaTree,
  'cooled-lava': lavaFlow,
  'dino-bite-burst': dinoBiteBurst,
  'dino-carcass': dinoCarcass,
  'dino-impact': dinoImpact,
  'dino-ash': dinoAsh,
  'dino-dust': dinoDust,
  'dino-feather-puff': dinoFeatherPuff,
  'dino-leaf-flutter': dinoLeafFlutter,
  'dino-meat-bit': dinoMeatBit,
  'dino-nest': dinoNest,
  'dino-scrap': dinoScrap,
  'dino-tail-streak': dinoTailStreak,
  brachiosaurus,
  eruption,
  fern,
  'lava-flank-left': lavaFlankLeft,
  'lava-flank-right': lavaFlankRight,
  'lava-flow': lavaFlow,
  'lava-bomb': lavaBomb,
  'lava-ground-sheet': lavaGroundSheet,
  meganeura,
  pterodactyl,
  quetzalcoatlus,
  'shooting-star': dinoShootingStar,
  stegosaurus,
  trex,
  triceratops,
  volcano,
}
