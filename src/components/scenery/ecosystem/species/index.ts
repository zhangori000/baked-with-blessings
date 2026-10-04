import {
  menuCloudSpawnDesignsByScene,
  menuSpawnedAccentSourcesByScene,
  type SceneTone,
} from '../../menuHeroScenery'
import type { EcoSpeciesMap } from '../types'
import { blossomSpecies } from './blossom'
import { dawnSpecies } from './dawn'
import { meadowSpecies } from './meadow'
import { nightSpecies } from './night'
import { prehistoricSpecies } from './prehistoric'
import { underseaSpecies } from './undersea'
import { cloudSpecies, fireSpecies, flowerSpecies } from './shared'
import { siegeSpecies } from './siege'

const buildBySceneTone: Partial<Record<SceneTone, () => EcoSpeciesMap>> = {
  blossom: () => ({
    ...blossomSpecies,
    cloud: cloudSpecies(menuCloudSpawnDesignsByScene.blossom),
    fire: fireSpecies,
  }),
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
  moonlit: () => ({
    ...nightSpecies,
    cloud: cloudSpecies(menuCloudSpawnDesignsByScene.moonlit),
    fire: fireSpecies,
    flower: flowerSpecies(menuSpawnedAccentSourcesByScene.moonlit),
  }),
  prehistoric: () => ({
    ...prehistoricSpecies,
    cloud: cloudSpecies(menuCloudSpawnDesignsByScene.prehistoric),
    fire: fireSpecies,
  }),
  undersea: () => ({
    ...underseaSpecies,
    fire: fireSpecies,
  }),
}

export const hasEcosystem = (sceneTone: SceneTone) => sceneTone in buildBySceneTone

export const ecosystemSpecies = (sceneTone: SceneTone): EcoSpeciesMap | null =>
  buildBySceneTone[sceneTone]?.() ?? null
