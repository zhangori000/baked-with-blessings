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
  controlBuffs?: EcoControlBuff[]
  controlCast?: EcoControlCast
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

export type EcoEffect = {
  amount?: number
  id?: number
  key?: EcoControlAbilityKey
  name?: string
  text?: string
  tone?: 'heal' | 'heavy' | 'normal' | 'resist' | 'strong'
  type: 'banner' | 'damage' | 'heal' | 'shake' | 'vfx'
  vfx?: EcoControlAbility['vfx']
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

export type EcoTelegraph = {
  angle?: number
  range: number
  shape: 'circle' | 'cone' | 'ellipse' | 'line' | 'self'
  width?: number
}

export type EcoControlCastPhase = 'active' | 'recovery' | 'windup'

export type EcoControlCast = {
  activeStarted: boolean
  elapsed: number
  endX: number
  endY: number
  hitIds: Set<number>
  key: EcoControlAbilityKey
  phase: EcoControlCastPhase
  phaseElapsed: number
  queuedKey: EcoControlAbilityKey | null
  releaseRequested: boolean
  startX: number
  startY: number
}

export type EcoControlBuff = {
  expiresAt: number
  icon: string
  name: string
  startedAt: number
}

export type EcoControlAbilityContext = {
  activeProgress: number
  cast: EcoControlCast
  phaseProgress: number
}

export type EcoControlAbility = {
  active?: number
  archetype?: string
  asset?: string | ((entity: EcoEntity) => string | undefined)
  charge?: { max: number; min?: number }
  cooldown: number
  description: string
  dash?: number
  icon?: string
  key: EcoControlAbilityKey
  name: string
  recovery?: number
  run?(entity: EcoEntity, world: EcoWorld, context: EcoControlAbilityContext): void
  telegraph?: EcoTelegraph
  tick?: (entity: EcoEntity, world: EcoWorld, context: EcoControlAbilityContext, dt: number) => void
  ultimate?: boolean
  vfx?: 'bite' | 'buff' | 'charge' | 'heal' | 'ink' | 'shockwave' | 'slash' | 'water'
  windup?: number
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
  damage(attacker: EcoEntity | null, target: EcoEntity, amount: number, fromX?: number): number
  effect(effect: EcoEffect): void
  gainControlResource(entity: EcoEntity, amount: number): void
  heal(entity: EcoEntity, amount: number): number
  addControlBuff(entity: EcoEntity, name: string, icon: string, seconds: number): void
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
  releaseControlAbility(key: EcoControlAbilityKey): boolean
  resetTally(key: string): void
  setAsset(entity: EcoEntity, asset: string): void
  shake(amount?: number): void
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
  buffs: readonly EcoControlBuffView[]
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

export type EcoControlBuffView = {
  icon: string
  name: string
  progress: number
}

export type EcoControlAbilityView = {
  archetype?: string
  chargeProgress: number
  chargeable: boolean
  cooldown: number
  cooldownLeft: number
  description: string
  icon?: string
  locked: boolean
  key: EcoControlAbilityKey
  name: string
  readyFlash: boolean
  resourceFill: number
  ultimate: boolean
}

export type EcoControlEntityView = {
  abilities: readonly EcoControlAbilityView[]
  buffs: readonly EcoControlBuffView[]
  castKey: EcoControlAbilityKey | null
  castPhase: EcoControlCastPhase | null
  followCursor: boolean
  health: number
  healthMax: number
  id: number
  label: string
  move: EcoControlMove
  resource: number
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
