import React from 'react'

import { persistentMenuSceneStorageKey } from './menuHeroScenery'
import { defaultMenuScene, menuSceneLoadingTokens } from './menuSceneLoadingTokens'

export const InitMenuScene: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    var storageKey = '${persistentMenuSceneStorageKey}';
    var defaultScene = '${defaultMenuScene}';
    var sceneTokens = ${JSON.stringify(menuSceneLoadingTokens)};

    function sceneIsValid(scene) {
      return Boolean(scene && sceneTokens[scene]);
    }

    function readCookie(name) {
      var pairs = document.cookie ? document.cookie.split(';') : [];

      for (var i = 0; i < pairs.length; i += 1) {
        var pair = pairs[i].trim();
        var separatorIndex = pair.indexOf('=');

        if (separatorIndex === -1) {
          continue;
        }

        if (pair.slice(0, separatorIndex) === name) {
          return decodeURIComponent(pair.slice(separatorIndex + 1));
        }
      }

      return null;
    }

    function writeCookie(scene) {
      document.cookie = storageKey + '=' + encodeURIComponent(scene) + '; Max-Age=31536000; Path=/; SameSite=Lax';
    }

    function readStorage() {
      try {
        return window.localStorage.getItem(storageKey);
      } catch (error) {
        return null;
      }
    }

    function writeStorage(scene) {
      try {
        window.localStorage.setItem(storageKey, scene);
      } catch (error) {}
    }

    function applyScene(scene) {
      var tokens = sceneTokens[scene] || sceneTokens[defaultScene];
      var root = document.documentElement;

      root.setAttribute('data-menu-scene', scene);
      root.style.setProperty('--route-loading-background', tokens.background);
      root.style.setProperty('--route-loading-sky', tokens.sky);
      root.style.setProperty('--route-loading-sky-mobile', tokens.skyMobile);
      root.style.setProperty('--route-loading-meadow', tokens.meadow);
      root.style.setProperty('--route-loading-overlay', tokens.overlay);
      root.style.setProperty('--route-loading-banner-bg', tokens.bannerBackground);
      root.style.setProperty('--route-loading-banner-color', tokens.bannerColor);

      preloadImage(window.matchMedia('(max-width: 767px)').matches ? tokens.skyMobile : tokens.sky);
      preloadImage(tokens.meadow);
    }

    function getUrlFromCssValue(cssValue) {
      var match = /^url\\(["']?(.*?)["']?\\)$/.exec(cssValue || '');
      return match ? match[1] : null;
    }

    function preloadImage(cssValue) {
      var href = getUrlFromCssValue(cssValue);

      if (!href || document.querySelector('link[data-menu-scene-preload="' + href + '"]')) {
        return;
      }

      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      link.setAttribute('data-menu-scene-preload', href);
      document.head.appendChild(link);
    }

    var storedScene = readStorage();
    var cookieScene = readCookie(storageKey);
    var sceneToSet = sceneIsValid(storedScene)
      ? storedScene
      : sceneIsValid(cookieScene)
        ? cookieScene
        : defaultScene;

    writeStorage(sceneToSet);
    writeCookie(sceneToSet);
    applyScene(sceneToSet);
  })();
  `,
      }}
      id="menu-scene-script"
    />
  )
}
