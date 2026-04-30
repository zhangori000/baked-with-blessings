export type CloudSpawnPercentRange = {
  leftMaxPercent: number
  leftMinPercent: number
  topMaxPercent: number
  topMinPercent: number
}

export const uniformCloudSpawnRange: CloudSpawnPercentRange = {
  leftMinPercent: 5,
  leftMaxPercent: 95,
  topMinPercent: 2,
  topMaxPercent: 50,
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

export const buildCloudSpawnPosition = (range: CloudSpawnPercentRange = uniformCloudSpawnRange) => ({
  left: `${randomBetween(range.leftMinPercent, range.leftMaxPercent).toFixed(2)}%`,
  top: `${randomBetween(range.topMinPercent, range.topMaxPercent).toFixed(2)}%`,
})
