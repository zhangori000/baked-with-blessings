import 'server-only'

import { cookies } from 'next/headers'

import { menuSceneTones, persistentMenuSceneStorageKey, type SceneTone } from './menuHeroScenery'

const isSceneTone = (value: string): value is SceneTone =>
  menuSceneTones.includes(value as SceneTone)

export const getMenuSceneToneFromCookies = async (
  fallback: SceneTone = 'dawn',
): Promise<SceneTone> => {
  const cookieStore = await cookies()
  const storedTone = cookieStore.get(persistentMenuSceneStorageKey)?.value

  return storedTone && isSceneTone(storedTone) ? storedTone : fallback
}
