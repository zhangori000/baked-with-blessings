import type { EcoEntity, EcoWorld } from './types'

export const between = (min: number, max: number) => min + Math.random() * (max - min)

export const chance = (probabilityPerSecond: number, dt: number) =>
  Math.random() < 1 - Math.exp(-probabilityPerSecond * dt)

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!

export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

export function steer(
  entity: EcoEntity,
  targetX: number,
  targetY: number,
  speed: number,
  dt: number,
  agility = 4,
) {
  const dx = targetX - entity.x
  const dy = targetY - entity.y
  const gap = Math.hypot(dx, dy) || 1
  const arriving = gap < speed * 0.4
  const blend = arriving ? 1 : Math.min(1, agility * dt)
  const pace = Math.min(speed, gap / Math.max(dt, 0.001))

  entity.vx += ((dx / gap) * pace - entity.vx) * blend
  entity.vy += ((dy / gap) * pace - entity.vy) * blend

  return gap
}

export function flee(
  entity: EcoEntity,
  from: { x: number; y: number },
  speed: number,
  dt: number,
  agility = 5,
) {
  const dx = entity.x - from.x
  const dy = entity.y - from.y
  const gap = Math.hypot(dx, dy) || 1

  return steer(entity, entity.x + (dx / gap) * 200, entity.y + (dy / gap) * 200, speed, dt, agility)
}

export function integrate(entity: EcoEntity, dt: number) {
  entity.x += entity.vx * dt
  entity.y += entity.vy * dt
}

export function faceTravel(entity: EcoEntity, threshold = 4) {
  if (entity.vx > threshold) {
    entity.facing = 1
  } else if (entity.vx < -threshold) {
    entity.facing = -1
  }
}

export function keepInSky(
  entity: EcoEntity,
  world: EcoWorld,
  top = world.skyTop,
  bottom = world.skyBottom,
) {
  entity.x = clamp(entity.x, 0, world.width)
  entity.y = clamp(entity.y, top, bottom)
}

export function wander(
  entity: EcoEntity,
  world: EcoWorld,
  dt: number,
  speed: number,
  top: number,
  bottom: number,
  agility = 2,
) {
  const hasGoal = entity.data.goalX !== undefined && entity.data.goalY !== undefined
  const reached =
    hasGoal &&
    Math.hypot((entity.data.goalX ?? 0) - entity.x, (entity.data.goalY ?? 0) - entity.y) <
      world.unit * 1.2

  if (!hasGoal || reached || (entity.data.goalAt ?? 0) < world.time) {
    entity.data.goalX = between(world.width * 0.04, world.width * 0.96)
    entity.data.goalY = between(top, Math.max(top + 1, bottom))
    entity.data.goalAt = world.time + between(4, 9)
  }

  steer(entity, entity.data.goalX ?? entity.x, entity.data.goalY ?? entity.y, speed, dt, agility)
}

export function groundLine(entity: EcoEntity, world: EcoWorld) {
  return world.groundY + (entity.data.depth ?? 0)
}

export function walk(entity: EcoEntity, world: EcoWorld, dt: number, speed: number) {
  const margin = world.unit * 1.2

  entity.x += entity.facing * speed * dt
  entity.y = groundLine(entity, world)

  if (entity.x < margin) {
    entity.x = margin
    entity.facing = 1
  } else if (entity.x > world.width - margin) {
    entity.x = world.width - margin
    entity.facing = -1
  }
}

export function walkToward(
  entity: EcoEntity,
  world: EcoWorld,
  targetX: number,
  speed: number,
  dt: number,
) {
  const dx = targetX - entity.x

  entity.facing = dx >= 0 ? 1 : -1
  entity.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt)
  entity.y = groundLine(entity, world)

  return Math.abs(dx)
}

export function hop(entity: EcoEntity, dt: number, height: number, rate: number) {
  entity.data.hop = (entity.data.hop ?? 0) + dt * rate
  entity.lift = Math.abs(Math.sin(entity.data.hop)) * height
}

export function settle(entity: EcoEntity, dt: number) {
  entity.lift = Math.max(0, entity.lift - dt * 40)
  entity.data.hop = 0
}

export function tiltToVelocity(entity: EcoEntity, limit = 35) {
  const angle = (Math.atan2(entity.vy, Math.abs(entity.vx) + 0.001) * 180) / Math.PI
  entity.tilt = clamp(angle, -limit, limit)
}

export function headOf(target: EcoEntity, world: EcoWorld) {
  return { x: target.x, y: target.y - world.heightOf(target) * 0.82 }
}

export function onGround(target: EcoEntity, world: EcoWorld) {
  return target.anchor === 'bottom'
    ? target.lift < world.unit * 1.2
    : target.y > world.groundY - world.unit * 2.4
}

export function ballistic(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  seconds: number,
  gravity: number,
) {
  return {
    vx: (toX - fromX) / seconds,
    vy: (toY - fromY - 0.5 * gravity * seconds * seconds) / seconds,
  }
}
