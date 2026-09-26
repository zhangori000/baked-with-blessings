const aspectByAsset: Record<string, number> = {
  '/flowers/daisy-medium.svg': 1,
  '/flowers/pink-daisy-wildflower.svg': 2,
  '/flowers/poppy.svg': 1,
  '/flowers/rose.svg': 1,
  '/flowers/tulip.svg': 1.3,
  '/flowers/white-wildflower.svg': 1.67,
  '/sceneries/fairy-castle-house-wide.svg': 0.84,
  '/sceneries/fairy-castle-house.svg': 1.1,
}

const viewBoxes: Record<string, readonly [number, number]> = {
  archer: [82, 92],
  arrow: [120, 20],
  balloon: [88, 118],
  bee: [92, 58],
  bird: [86, 62],
  boat: [158, 92],
  bunny: [100, 70],
  butterfly: [82, 72],
  'cat-crouch': [116, 54],
  'cat-sleep': [92, 62],
  cat: [112, 70],
  caterpillar: [96, 48],
  cocoon: [48, 98],
  'dandelion-bloom': [74, 118],
  'dandelion-seed': [38, 58],
  dandelion: [74, 118],
  'dragon-eastern-jade': [192, 68],
  'dragon-eastern-red': [192, 68],
  'dragon-western-ember': [158, 98],
  'dragon-western-emerald': [158, 98],
  'dragon-western-frost': [158, 98],
  egg: [60, 54],
  fire: [58, 70],
  fireball: [112, 42],
  firefly: [72, 72],
  'frog-prince': [82, 72],
  'hawk-dive': [104, 94],
  hawk: [138, 72],
  knight: [76, 86],
  lantern: [72, 92],
  moth: [82, 74],
  pennant: [88, 96],
  puff: [76, 50],
  sprout: [44, 58],
  unicorn: [132, 82],
}

for (const [name, [width, height]] of Object.entries(viewBoxes)) {
  aspectByAsset[`/spawnables/${name}.svg`] = height / width
}

export const ecoAsset = (name: string) => `/spawnables/${name}.svg`

export const aspectOf = (asset: string) => aspectByAsset[asset] ?? 1
