import type { CSSProperties } from 'react'

import type { BakeryRadiusToken, BakeryShadowToken, BakerySpaceToken } from './tokens'

export type BakeryColorRole =
  | 'actionBg'
  | 'actionFg'
  | 'bg'
  | 'bgPrimary'
  | 'bgSecondary'
  | 'border'
  | 'fg'
  | 'fgMuted'
  | 'footerBg'
  | 'footerBorder'
  | 'footerFg'
  | 'footerLinkBg'
  | 'footerMuted'
  | 'footerPanelBg'
  | 'panelBorder'
  | 'panelFill'
  | 'sceneActionAura'
  | 'sceneBackground'
  | 'sceneFlowerCenter'
  | 'sceneFlowerGlow'
  | 'sceneFlowerPetal'
  | 'sceneHeroMuted'
  | 'sceneHeroText'
  | 'sceneHeroTitle'
  | 'sceneMeadow'
  | 'scenePanel'
  | 'scenePanelBorder'
  | 'sceneText'

export type BakeryStyleProps = {
  alignItems?: CSSProperties['alignItems']
  background?: BakeryColorRole
  color?: BakeryColorRole
  display?: CSSProperties['display']
  flexDirection?: CSSProperties['flexDirection']
  gap?: BakerySpaceToken
  justifyContent?: CSSProperties['justifyContent']
  margin?: BakerySpaceToken
  marginBottom?: BakerySpaceToken
  marginTop?: BakerySpaceToken
  padding?: BakerySpaceToken
  paddingX?: BakerySpaceToken
  paddingY?: BakerySpaceToken
  radius?: BakeryRadiusToken
  shadow?: BakeryShadowToken
}

const colorRoleCssVar: Record<BakeryColorRole, string> = {
  actionBg: '--bakery-color-action-bg',
  actionFg: '--bakery-color-action-fg',
  bg: '--bakery-color-bg',
  bgPrimary: '--bakery-color-bg-primary',
  bgSecondary: '--bakery-color-bg-secondary',
  border: '--bakery-color-border',
  fg: '--bakery-color-fg',
  fgMuted: '--bakery-color-fg-muted',
  footerBg: '--bakery-footer-bg',
  footerBorder: '--bakery-footer-border',
  footerFg: '--bakery-footer-fg',
  footerLinkBg: '--bakery-footer-link-bg',
  footerMuted: '--bakery-footer-muted',
  footerPanelBg: '--bakery-footer-panel-bg',
  panelBorder: '--bakery-color-panel-border',
  panelFill: '--bakery-color-panel-fill',
  sceneActionAura: '--scene-action-aura',
  sceneBackground: '--scene-background',
  sceneFlowerCenter: '--scene-flower-center',
  sceneFlowerGlow: '--scene-flower-glow',
  sceneFlowerPetal: '--scene-flower-petal',
  sceneHeroMuted: '--scene-hero-muted',
  sceneHeroText: '--scene-hero-text',
  sceneHeroTitle: '--scene-hero-title',
  sceneMeadow: '--scene-meadow',
  scenePanel: '--scene-panel-fill',
  scenePanelBorder: '--scene-panel-border',
  sceneText: '--scene-text',
}

export const getBakeryColorVar = (role: BakeryColorRole) => `var(${colorRoleCssVar[role]})`

const cssTokenName = (token: string) => String(token).replaceAll('.', '-')

const getBackgroundClass = (role: BakeryColorRole) => `bakery-bg-${role}`
const getColorClass = (role: BakeryColorRole) => `bakery-color-${role}`
const getSpaceClass = (prop: string, token: BakerySpaceToken) =>
  `bakery-${prop}-${cssTokenName(token)}`
const getRadiusClass = (token: BakeryRadiusToken) => `bakery-radius-${token}`
const getShadowClass = (token: BakeryShadowToken) => `bakery-shadow-${token}`

export const bakeryStaticStyleClassMaps = {
  background: getBackgroundClass,
  color: getColorClass,
  gap: (token: BakerySpaceToken) => getSpaceClass('gap', token),
  margin: (token: BakerySpaceToken) => getSpaceClass('m', token),
  marginBottom: (token: BakerySpaceToken) => getSpaceClass('mb', token),
  marginTop: (token: BakerySpaceToken) => getSpaceClass('mt', token),
  padding: (token: BakerySpaceToken) => getSpaceClass('p', token),
  paddingX: (token: BakerySpaceToken) => getSpaceClass('px', token),
  paddingY: (token: BakerySpaceToken) => getSpaceClass('py', token),
  radius: getRadiusClass,
  shadow: getShadowClass,
} as const

export const getBakeryStyles = (
  styleProps: BakeryStyleProps,
  inlineStyle?: CSSProperties,
): { className: string; style: CSSProperties } => {
  const style: CSSProperties = { ...inlineStyle }
  const classNames: string[] = []

  if (styleProps.background) {
    classNames.push(bakeryStaticStyleClassMaps.background(styleProps.background))
  }

  if (styleProps.color) {
    classNames.push(bakeryStaticStyleClassMaps.color(styleProps.color))
  }

  if (styleProps.gap) classNames.push(bakeryStaticStyleClassMaps.gap(styleProps.gap))
  if (styleProps.margin) classNames.push(bakeryStaticStyleClassMaps.margin(styleProps.margin))
  if (styleProps.marginBottom) {
    classNames.push(bakeryStaticStyleClassMaps.marginBottom(styleProps.marginBottom))
  }
  if (styleProps.marginTop)
    classNames.push(bakeryStaticStyleClassMaps.marginTop(styleProps.marginTop))
  if (styleProps.padding) classNames.push(bakeryStaticStyleClassMaps.padding(styleProps.padding))
  if (styleProps.paddingX) classNames.push(bakeryStaticStyleClassMaps.paddingX(styleProps.paddingX))
  if (styleProps.paddingY) classNames.push(bakeryStaticStyleClassMaps.paddingY(styleProps.paddingY))
  if (styleProps.radius) classNames.push(bakeryStaticStyleClassMaps.radius(styleProps.radius))
  if (styleProps.shadow) classNames.push(bakeryStaticStyleClassMaps.shadow(styleProps.shadow))

  if (styleProps.alignItems) style.alignItems = styleProps.alignItems
  if (styleProps.display) style.display = styleProps.display
  if (styleProps.flexDirection) style.flexDirection = styleProps.flexDirection
  if (styleProps.justifyContent) style.justifyContent = styleProps.justifyContent

  return {
    className: classNames.join(' '),
    style,
  }
}
