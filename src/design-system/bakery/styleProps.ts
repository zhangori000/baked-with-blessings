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
  | 'sceneMeadow'
  | 'scenePanel'
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
  sceneMeadow: '--scene-meadow',
  scenePanel: '--scene-panel-fill',
  sceneText: '--scene-text',
}

export const getBakeryColorVar = (role: BakeryColorRole) => `var(${colorRoleCssVar[role]})`

const getSpaceVar = (token: BakerySpaceToken) =>
  `var(--bakery-space-${String(token).replaceAll('.', '-')})`

const getRadiusVar = (token: BakeryRadiusToken) => `var(--bakery-radius-${token})`

const getShadowVar = (token: BakeryShadowToken) => `var(--bakery-shadow-${token})`

export const getBakeryStyles = (
  styleProps: BakeryStyleProps,
  inlineStyle?: CSSProperties,
): { className: string; style: CSSProperties } => {
  const style: CSSProperties = { ...inlineStyle }

  if (styleProps.alignItems) style.alignItems = styleProps.alignItems
  if (styleProps.background) style.background = getBakeryColorVar(styleProps.background)
  if (styleProps.color) style.color = getBakeryColorVar(styleProps.color)
  if (styleProps.display) style.display = styleProps.display
  if (styleProps.flexDirection) style.flexDirection = styleProps.flexDirection
  if (styleProps.gap) style.gap = getSpaceVar(styleProps.gap)
  if (styleProps.justifyContent) style.justifyContent = styleProps.justifyContent
  if (styleProps.margin) style.margin = getSpaceVar(styleProps.margin)
  if (styleProps.marginBottom) style.marginBottom = getSpaceVar(styleProps.marginBottom)
  if (styleProps.marginTop) style.marginTop = getSpaceVar(styleProps.marginTop)
  if (styleProps.padding) style.padding = getSpaceVar(styleProps.padding)
  if (styleProps.paddingX) {
    style.paddingLeft = getSpaceVar(styleProps.paddingX)
    style.paddingRight = getSpaceVar(styleProps.paddingX)
  }
  if (styleProps.paddingY) {
    style.paddingBottom = getSpaceVar(styleProps.paddingY)
    style.paddingTop = getSpaceVar(styleProps.paddingY)
  }
  if (styleProps.radius) style.borderRadius = getRadiusVar(styleProps.radius)
  if (styleProps.shadow) style.boxShadow = getShadowVar(styleProps.shadow)

  return {
    className: '',
    style,
  }
}
