export const defaultMenuScene = 'classic'

export const menuSceneLoadingTokens = {
  blossom: {
    background: '#f7edf2',
    bannerBackground: 'rgba(255, 250, 252, 0.9)',
    bannerColor: '#513047',
    meadow: "url('/sceneries/blossom-grass-mound.svg')",
    overlay: 'linear-gradient(180deg, rgba(255, 246, 251, 0.16) 0%, rgba(255, 228, 238, 0.2) 100%)',
    sky: "url('/sceneries/blossom-breeze-sky.svg')",
    skyMobile: "url('/sceneries/blossom-breeze-sky-mobile-experimental.svg')",
  },
  classic: {
    background: '#fff8f2',
    bannerBackground: 'rgba(255, 253, 246, 0.9)',
    bannerColor: '#172415',
    meadow: "url('/sceneries/classic-meadow.svg')",
    overlay:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(245, 239, 218, 0.16) 100%)',
    sky: "url('/sceneries/classic-sky.svg')",
    skyMobile: "url('/sceneries/classic-sky-mobile-experimental.svg')",
  },
  dawn: {
    background: '#fbefe0',
    bannerBackground: 'rgba(255, 248, 231, 0.9)',
    bannerColor: '#3e4414',
    meadow: "url('/sceneries/brown-anime-rolling-meadow.svg')",
    overlay: 'linear-gradient(180deg, rgba(255, 226, 139, 0.14) 0%, rgba(241, 194, 83, 0.16) 100%)',
    sky: "url('/sceneries/brown-anime-gradient-sky.svg')",
    skyMobile: "url('/sceneries/brown-anime-gradient-sky-mobile-experimental.svg')",
  },
  'fairy-castle': {
    background: '#dce2d7',
    bannerBackground: 'rgba(250, 246, 226, 0.9)',
    bannerColor: '#293923',
    meadow: "url('/sceneries/transparent-meadow.svg')",
    overlay:
      'linear-gradient(180deg, rgba(239, 244, 231, 0.02) 0%, rgba(152, 174, 126, 0.16) 100%)',
    sky: "url('/sceneries/fairy-castle.svg')",
    skyMobile: "url('/sceneries/fairy-castle-mobile-experimental.svg')",
  },
  moonlit: {
    background: '#17264b',
    bannerBackground: 'rgba(248, 241, 200, 0.9)',
    bannerColor: '#17264b',
    meadow: "url('/sceneries/moonlit-purple-meadow.svg')",
    overlay: 'linear-gradient(180deg, rgba(15, 28, 68, 0.14) 0%, rgba(61, 44, 112, 0.22) 100%)',
    sky: "url('/sceneries/moonlit-purple-sky.svg')",
    skyMobile: "url('/sceneries/moonlit-purple-sky-mobile-experimental.svg')",
  },
  'under-tree': {
    background: '#e7f0d8',
    bannerBackground: 'rgba(250, 255, 241, 0.9)',
    bannerColor: '#31451c',
    meadow: "url('/sceneries/girl-under-tree-meadow.svg')",
    overlay: 'linear-gradient(180deg, rgba(218, 242, 182, 0.1) 0%, rgba(143, 188, 97, 0.16) 100%)',
    sky: "url('/sceneries/girl-under-tree-sky.svg')",
    skyMobile: "url('/sceneries/girl-under-tree-sky-mobile-experimental.svg')",
  },
} as const
