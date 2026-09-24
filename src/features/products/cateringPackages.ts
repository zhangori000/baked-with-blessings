export const BUNDLES_CATEGORY_SLUG = 'catering'
export const CATERING_PACKAGES_CATEGORY_SLUG = 'catering-packages'
export const CATERING_FLAVOR_CATEGORY_SLUG = 'cookies'

const PACKAGE_STEP_CANDIDATES = [12, 10, 6, 5, 4, 3, 2]
const MIN_STEPS_PER_PACKAGE = 3

const greatestCommonDivisor = (left: number, right: number): number =>
  right === 0 ? left : greatestCommonDivisor(right, left % right)

export const resolveCateringStep = (capacity: number, groupCapacities: number[] = []) => {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    return 1
  }

  const groupDivisor = groupCapacities
    .filter((value) => Number.isInteger(value) && value > 0)
    .reduce((divisor, value) => greatestCommonDivisor(divisor, value), capacity)

  if (groupDivisor > 1 && capacity / groupDivisor >= MIN_STEPS_PER_PACKAGE) {
    return groupDivisor
  }

  return (
    PACKAGE_STEP_CANDIDATES.find(
      (step) => capacity % step === 0 && capacity / step >= MIN_STEPS_PER_PACKAGE,
    ) ?? 1
  )
}
