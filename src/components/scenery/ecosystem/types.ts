import type { SpawnParticles } from '../spawnables'

export type EcoLayer = 'back' | 'front'

export type EcoAnchor = 'bottom' | 'center'

export type EcoIdle =
  | 'bob'
  | 'buzz'
  | 'flap'
  | 'flicker'
  | 'glow'
  | 'none'
  | 'sway'
  | 'trot'
  | 'undulate'
  | 'wave'

export type EcoTag =
  | 'balloon'
  | 'bee'
  | 'bird'
  | 'building'
  | 'bunny'
  | 'burnable'
  | 'butterfly'
  | 'caterpillar'
  | 'cat'
  | 'cloud'
  | 'dragon'
  | 'fire'
  | 'fireball'
  | 'firefly'
  | 'fuel'
  | 'hawk'
  | 'insect'
  | 'knight'
  | 'lantern'
  | 'plant'
  | 'target'
  | 'unicorn'

export type EcoEntity = {
  age: number
  anchor: EcoAnchor
  aspect: number
  asset: string
  countAs: string | null
  data: Record<string, number>
  dying: boolean
  facing: 1 | -1
  fx: string
  hp: number
  id: number
  idle: EcoIdle
  lift: number
  removed: boolean
  scale: number
  size: number
  species: string
  state: string
  t: number
  targetId: number | null
  tilt: number
  user: boolean
  vx: number
  vy: number
  x: number
  y: number
}

export type EcoSpawnOptions = {
  countAs?: string | null
  data?: Record<string, number>
  facing?: 1 | -1
  size?: number
  state?: string
  user?: boolean
  vx?: number
  vy?: number
  x?: number
  y?: number
}

export type EcoWorld = {
  readonly entities: readonly EcoEntity[]
  readonly groundY: number
  readonly height: number
  readonly skyBottom: number
  readonly skyTop: number
  readonly time: number
  readonly unit: number
  readonly waterY: number
  readonly width: number
  readonly wind: number
  byId(id: number | null): EcoEntity | null
  canBreed(): boolean
  count(test: (entity: EcoEntity) => boolean): number
  has(entity: EcoEntity, tag: EcoTag): boolean
  hasSpecies(species: string): boolean
  heightOf(entity: EcoEntity): number
  kill(entity: EcoEntity): void
  nearest(
    from: { x: number; y: number },
    test: (entity: EcoEntity) => boolean,
    maxDistance?: number,
  ): EcoEntity | null
  remove(entity: EcoEntity): void
  setAsset(entity: EcoEntity, asset: string): void
  setState(entity: EcoEntity, state: string): void
  spawn(species: string, options?: EcoSpawnOptions): EcoEntity | null
  widthOf(entity: EcoEntity): number
  within(x: number, y: number, radius: number, test: (entity: EcoEntity) => boolean): EcoEntity[]
}

export type EcoSpecies = {
  anchor: EcoAnchor
  asset: string | (() => string)
  burnTime?: number
  countAs?: string | null
  hp?: number
  idle?: EcoIdle
  init?: (entity: EcoEntity, world: EcoWorld) => void
  layer: EcoLayer
  particles?: SpawnParticles
  rest?: (entity: EcoEntity, world: EcoWorld) => void
  size: readonly [number, number]
  state?: string
  style?: (entity: EcoEntity, world: EcoWorld) => Record<string, string>
  tags: readonly EcoTag[]
  tick: (entity: EcoEntity, world: EcoWorld, dt: number) => void
}

export type EcoSpeciesMap = Record<string, EcoSpecies>

export type EcoEntityView = {
  anchor: EcoAnchor
  asset: string
  dying: boolean
  fuel: boolean
  id: number
  idle: EcoIdle
  layer: EcoLayer
  particles?: SpawnParticles
  rain: boolean
  size: number
  species: string
}

export type EcoSnapshot = {
  counts: Readonly<Record<string, number>>
  entities: readonly EcoEntityView[]
  scene: string
}
