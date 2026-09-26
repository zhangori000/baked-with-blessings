import { ecoAsset } from '../assets'
import { between, chance, onGround, pick } from '../behaviors'
import type { EcoEntity, EcoSpecies, EcoWorld } from '../types'

type CloudDesign = { maxWidth: number; minWidth: number; src: string }

export const cloudSpecies = (designs: readonly CloudDesign[]): EcoSpecies => ({
  anchor: 'center',
  asset: () => pick(designs).src,
  countAs: 'cloud',
  init(entity, world) {
    const design = designs.find((entry) => entry.src === entity.asset) ?? designs[0]

    entity.size = design ? between(design.minWidth, design.maxWidth) * 0.8 : 12
    entity.facing = 1
    entity.data.direction = Math.random() < 0.5 ? -1 : 1
    entity.data.speed = between(0.22, 0.5)
    entity.data.nextRain = between(3, 8)
    entity.y = between(world.skyTop, world.height * 0.26)
  },
  layer: 'back',
  size: [10, 14],
  state: 'drift',
  style: (entity, world) => ({
    '--eco-rain': `${Math.max(0, Math.round(world.groundY - entity.y))}px`,
  }),
  tags: ['cloud'],
  tick(entity, world, dt) {
    const half = world.widthOf(entity) / 2

    entity.x += (entity.data.direction ?? 1) * (entity.data.speed ?? 0.3) * world.unit * dt

    if (entity.x > world.width + half) {
      entity.x = -half
    } else if (entity.x < -half) {
      entity.x = world.width + half
    }

    if (entity.state === 'drift' && entity.t > (entity.data.nextRain ?? 8)) {
      world.setState(entity, 'rain')
      entity.data.rainFor = between(5, 8)
      return
    }

    if (entity.state !== 'rain') {
      return
    }

    const reach = half * 0.62

    for (const other of world.entities) {
      if (other.dying || Math.abs(other.x - entity.x) > reach || other.anchor !== 'bottom') {
        continue
      }

      if (world.has(other, 'plant')) {
        other.data.water = 3
      }

      if ((other.data.burn ?? 0) > 0) {
        other.data.burn = 0
      }

      if (world.has(other, 'fire')) {
        world.kill(other)
      }
    }

    if (entity.t > (entity.data.rainFor ?? 6)) {
      world.setState(entity, 'drift')
      entity.data.nextRain = between(12, 24)
    }
  },
})

const sproutAsset = ecoAsset('sprout')

const isPlant = (world: EcoWorld) => (other: EcoEntity) => world.has(other, 'plant')

export function spreadPlant(entity: EcoEntity, world: EcoWorld, limit = 30, reach = 5.5) {
  if (!world.canBreed() || world.count(isPlant(world)) >= limit) {
    return false
  }

  const x = entity.x + pick([-1, 1]) * between(2, reach) * world.unit

  if (x < world.unit || x > world.width - world.unit) {
    return false
  }

  if (world.nearest({ x, y: world.groundY }, isPlant(world), world.unit * 1.7)) {
    return false
  }

  return Boolean(world.spawn(entity.species, { x, state: 'grow' }))
}

export const flowerSpecies = (assets: readonly string[]): EcoSpecies => ({
  anchor: 'bottom',
  asset: () => pick(assets),
  burnTime: 2.2,
  countAs: 'flower',
  idle: 'sway',
  init(entity, world) {
    entity.data.variant = Math.max(0, assets.indexOf(entity.asset))
    entity.data.nectar = 1

    if (entity.state === 'grow') {
      entity.data.growth = 0
      entity.scale = 0.45
      world.setAsset(entity, sproutAsset)
    }
  },
  layer: 'front',
  rest(entity, world) {
    entity.scale = 1
    entity.data.growth = 1
    world.setAsset(entity, assets[entity.data.variant ?? 0] ?? assets[0]!)
    world.setState(entity, 'bloom')
  },
  size: [1.9, 2.6],
  state: 'grow',
  tags: ['plant', 'fuel'],
  tick(entity, world, dt) {
    entity.data.water = Math.max(0, (entity.data.water ?? 0) - dt)
    const watered = (entity.data.water ?? 0) > 0

    if (entity.state === 'grow') {
      const rate = (entity.user ? 1 / 3.2 : 1 / 11) * (watered ? 2.6 : 1)
      const growth = Math.min(1, (entity.data.growth ?? 0) + dt * rate)

      entity.data.growth = growth
      entity.scale = 0.45 + 0.55 * growth
      world.setAsset(
        entity,
        growth < 0.45 ? sproutAsset : (assets[entity.data.variant ?? 0] ?? assets[0]!),
      )

      if (growth >= 1) {
        world.setState(entity, 'bloom')
      }
      return
    }

    entity.data.nectar = Math.min(1, (entity.data.nectar ?? 1) + dt * 0.1)

    if (
      (entity.data.pollinated ?? 0) > 0 &&
      entity.t > 3 &&
      chance(watered ? 0.6 : 0.25, dt) &&
      spreadPlant(entity, world)
    ) {
      entity.data.pollinated = 0
    }

    if (!entity.user && entity.age > 100 && chance(0.02, dt)) {
      world.kill(entity)
    }
  },
})

export const fireSpecies: EcoSpecies = {
  anchor: 'bottom',
  asset: ecoAsset('fire'),
  countAs: null,
  idle: 'flicker',
  init(entity) {
    entity.data.life = between(7, 11)
    entity.data.spread = 0.5
    entity.scale = 0.4
  },
  layer: 'front',
  size: [1.8, 2.4],
  state: 'burn',
  tags: ['fire'],
  tick(entity, world, dt) {
    entity.scale = Math.min(1, 0.4 + entity.age * 1.6)
    entity.data.life = (entity.data.life ?? 8) - dt

    if ((entity.data.life ?? 0) <= 0) {
      world.kill(entity)
      return
    }

    entity.data.spread = (entity.data.spread ?? 0.6) - dt

    if ((entity.data.spread ?? 0) > 0) {
      return
    }

    entity.data.spread = 0.6
    const unit = world.unit

    for (const other of world.within(entity.x, world.groundY, unit * 3.4, () => true)) {
      if (other === entity || world.has(other, 'fire')) {
        continue
      }

      if (world.has(other, 'fuel') && (other.data.burn ?? 0) <= 0 && Math.random() < 0.35) {
        other.data.burn = 0.01
      } else if (
        world.has(other, 'burnable') &&
        Math.abs(other.x - entity.x) < unit * 1.5 &&
        onGround(other, world)
      ) {
        world.kill(other)
      }
    }
  },
}
