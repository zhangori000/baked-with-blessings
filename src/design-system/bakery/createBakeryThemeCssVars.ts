import type { BakeryCSSVars, BakeryTheme } from './tokens'

const cssTokenName = (value: string) => value.replaceAll('.', '-')

export const createBakeryThemeCssVars = (theme: BakeryTheme): BakeryCSSVars => {
  const vars: BakeryCSSVars = {
    '--bakery-active-scene': theme.activeScene,
    '--bakery-color-action-bg': theme.color.actionBg,
    '--bakery-color-action-fg': theme.color.actionFg,
    '--bakery-color-bg': theme.color.bg,
    '--bakery-color-bg-primary': theme.color.bgPrimary,
    '--bakery-color-bg-secondary': theme.color.bgSecondary,
    '--bakery-color-border': theme.color.border,
    '--bakery-color-fg': theme.color.fg,
    '--bakery-color-fg-muted': theme.color.fgMuted,
    '--bakery-color-panel-border': theme.color.panelBorder,
    '--bakery-color-panel-fill': theme.color.panelFill,
    '--bakery-footer-bg': theme.scene.color.footerBg,
    '--bakery-footer-border': theme.scene.color.footerBorder,
    '--bakery-footer-fg': theme.scene.color.footerFg,
    '--bakery-footer-link-bg': theme.scene.color.footerLinkBg,
    '--bakery-footer-link-border': theme.scene.color.footerBorder,
    '--bakery-footer-link-color': theme.scene.color.footerFg,
    '--bakery-footer-muted': theme.scene.color.footerMuted,
    '--bakery-footer-panel-bg': theme.scene.color.footerPanelBg,
    '--bakery-footer-panel-shadow': theme.primitive.shadow.surfaceInset,
    '--scene-action-aura': theme.scene.color.actionAura,
    '--scene-background': theme.scene.color.background,
    '--scene-flower-bob-duration': theme.scene.motion.decorativeBob,
    '--scene-flower-center': theme.scene.color.flowerCenter,
    '--scene-flower-glow': theme.scene.color.flowerGlow,
    '--scene-flower-petal': theme.scene.color.flowerPetal,
    '--scene-flower-rail-height': theme.scene.layout.flowerRailHeight,
    '--scene-flower-seam': theme.scene.layout.flowerSeam,
    '--scene-hero-copy-max-width': theme.scene.layout.heroCopyMaxWidth,
    '--scene-meadow': theme.scene.color.meadow,
    '--scene-meadow-height': theme.scene.layout.meadowHeight,
    '--scene-meadow-shadow': theme.scene.color.meadowShadow,
    '--scene-muted-text': theme.scene.color.mutedText,
    '--scene-panel-border': theme.scene.color.panelBorder,
    '--scene-panel-fill': theme.scene.color.panelFill,
    '--scene-panel-min-height': theme.scene.layout.panelMinHeight,
    '--scene-text': theme.scene.color.text,
  }

  for (const [key, value] of Object.entries(theme.primitive.space)) {
    vars[`--bakery-space-${cssTokenName(key)}`] = value
  }

  for (const [key, value] of Object.entries(theme.primitive.radius)) {
    vars[`--bakery-radius-${key}`] = value
  }

  for (const [key, value] of Object.entries(theme.primitive.shadow)) {
    vars[`--bakery-shadow-${key}`] = value
  }

  for (const [key, value] of Object.entries(theme.primitive.motion)) {
    vars[`--bakery-motion-${key}`] = value
  }

  return vars
}
