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
  | 'asteroid'
  | 'balloon'
  | 'bat'
  | 'beam'
  | 'bear'
  | 'bee'
  | 'beehive'
  | 'bird'
  | 'boulder'
  | 'building'
  | 'bunny'
  | 'burnable'
  | 'butterfly'
  | 'carrot'
  | 'cat'
  | 'caterpillar'
  | 'cloud'
  | 'dragon'
  | 'dark-lord'
  | 'fire'
  | 'fireball'
  | 'firefly'
  | 'fox'
  | 'frog'
  | 'fuel'
  | 'hawk'
  | 'hedgehog'
  | 'insect'
  | 'knight'
  | 'lantern'
  | 'monk'
  | 'mouse'
  | 'ninja'
  | 'oni'
  | 'owl'
  | 'plant'
  | 'predator'
  | 'prey'
  | 'prince'
  | 'princess'
  | 'projectile'
  | 'sakura'
  | 'samurai'
  | 'scarecrow'
  | 'sheep'
  | 'shuriken'
  | 'spirit'
  | 'star'
  | 'swan'
  | 'tanuki'
  | 'target'
  | 'torii'
  | 'treasure'
  | 'unicorn'
  | 'villager'
  | 'wizard'

export type EcoMatchup = 'even' | 'strong' | 'weak'

export type EcoEntity = {
  age: number
  anchor: EcoAnchor
  aspect: number
  asset: string
  countAs: string | null
  controlResetAsset: string
  data: Record<string, number>
  dying: boolean
  facing: 1 | -1
  fx: string
  hp: number
  id: number
  idle: EcoIdle
  lift: number
  maxHp: number
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

export type EcoControlMove = 'fly' | 'ground' | 'swim'

export type EcoControlAbilityKey = 'q' | 'w' | 'e' | 'r'

export type EcoControlAbility = {
  cooldown: number
  description: string
  icon?: string
  key: EcoControlAbilityKey
  name: string
  run(entity: EcoEntity, world: EcoWorld): void
}

export type EcoControls = {
  abilities: readonly EcoControlAbility[]
  idleState?: string
  move: EcoControlMove
  moveState?: string
  speed: number
}

export type EcoControlInput = {
  cursorX?: number
  cursorY?: number
  followCursor: boolean
  x: number
  y: number
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
  matchup(attacker: EcoEntity, defender: EcoEntity): EcoMatchup
  edge(attacker: EcoEntity, defender: EcoEntity): number
  nearest(
    from: { x: number; y: number },
    test: (entity: EcoEntity) => boolean,
    maxDistance?: number,
  ): EcoEntity | null
  remove(entity: EcoEntity): void
  resetTally(key: string): void
  setAsset(entity: EcoEntity, asset: string): void
  setState(entity: EcoEntity, state: string): void
  spawn(species: string, options?: EcoSpawnOptions): EcoEntity | null
  tally(key: string, delta?: number): number
  widthOf(entity: EcoEntity): number
  within(x: number, y: number, radius: number, test: (entity: EcoEntity) => boolean): EcoEntity[]
}

export type EcoSpecies = {
  anchor: EcoAnchor
  asset: string | (() => string)
  burnTime?: number
  countAs?: string | null
  controls?: EcoControls
  hp?: number
  idle?: EcoIdle
  init?: (entity: EcoEntity, world: EcoWorld) => void
  layer: EcoLayer
  particles?: SpawnParticles
  rest?: (entity: EcoEntity, world: EcoWorld) => void
  size: readonly [number, number]
  state?: string
  strongVs?: readonly string[]
  weakTo?: readonly string[]
  style?: (entity: EcoEntity, world: EcoWorld) => Record<string, string>
  tags: readonly EcoTag[]
  tick: (entity: EcoEntity, world: EcoWorld, dt: number) => void
}

export type EcoSpeciesMap = Record<string, EcoSpecies>

export type EcoEntityView = {
  anchor: EcoAnchor
  aspect: number
  asset: string
  controllable: boolean
  controlled: boolean
  dying: boolean
  fuel: boolean
  health: number
  healthMax: number
  id: number
  idle: EcoIdle
  layer: EcoLayer
  label: string
  particles?: SpawnParticles
  rain: boolean
  selected: boolean
  size: number
  species: string
  strong: readonly string[]
  weak: readonly string[]
}

export type EcoControlAbilityView = {
  cooldown: number
  cooldownLeft: number
  description: string
  icon?: string
  key: EcoControlAbilityKey
  name: string
}

export type EcoControlEntityView = {
  abilities: readonly EcoControlAbilityView[]
  followCursor: boolean
  health: number
  healthMax: number
  id: number
  label: string
  move: EcoControlMove
  species: string
}

export type EcoSelectionView = {
  health: number
  healthMax: number
  id: number
  label: string
  strong: readonly string[]
  weak: readonly string[]
}

export type EcoSnapshot = {
  controlled: EcoControlEntityView | null
  counts: Readonly<Record<string, number>>
  entities: readonly EcoEntityView[]
  scene: string
  selected: EcoSelectionView | null
  tallies: Readonly<Record<string, number>>
  toast: string
}
