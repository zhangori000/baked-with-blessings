import {
  menuCloudSpawnDesignsByScene,
  menuSpawnedAccentSourcesByScene,
  type SceneTone,
} from '../../menuHeroScenery'
import type { EcoSpeciesMap } from '../types'
import { dawnSpecies } from './dawn'
import { meadowSpecies } from './meadow'
import { nightSpecies } from './night'
import { cloudSpecies, fireSpecies, flowerSpecies } from './shared'
import { siegeSpecies } from './siege'

const buildBySceneTone: Partial<Record<SceneTone, () => EcoSpeciesMap>> = {
  classic: () => ({
    ...meadowSpecies,
    cloud: cloudSpecies(menuCloudSpawnDesignsByScene.classic),
    fire: fireSpecies,
    flower: flowerSpecies(menuSpawnedAccentSourcesByScene.classic),
  }),
  dawn: () => ({
    ...dawnSpecies,
    butterfly: meadowSpecies.butterfly,
    cloud: cloudSpecies(menuCloudSpawnDesignsByScene.dawn),
    fire: fireSpecies,
    flower: flowerSpecies(menuSpawnedAccentSourcesByScene.dawn),
  }),
  'fairy-castle': () => ({
    ...siegeSpecies(menuSpawnedAccentSourcesByScene['fairy-castle']),
    cloud: cloudSpecies(menuCloudSpawnDesignsByScene['fairy-castle']),
    fire: fireSpecies,
  }),
  moonlit: () => ({ ...nightSpecies }),
}

export const hasEcosystem = (sceneTone: SceneTone) => sceneTone in buildBySceneTone

export const ecosystemSpecies = (sceneTone: SceneTone): EcoSpeciesMap | null =>
  buildBySceneTone[sceneTone]?.() ?? null
