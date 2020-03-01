import { createDefaultConfig } from '@open-wc/building-rollup';
import cpy from 'rollup-plugin-cpy';
const indexHTML = require('rollup-plugin-index-html');
const { generateSW } = require('rollup-plugin-workbox');
import deepmerge from 'deepmerge';

// if you need to support IE11 use "modern-and-legacy-config" instead.
// import { createCompatibilityConfig } from '@open-wc/building-rollup';
// export default createCompatibilityConfig({ input: './index.html' });

const config = createDefaultConfig({
  input: './index.html',
  extensions: ['.js', '.mjs', '.ts'],
  plugins: {
    workbox: false,
    indexHTML: false,
  },
});

export default deepmerge(config, {
  plugins: [
    indexHTML({
      polyfills: {
        customPolyfills: [
          {
            name: 'event-target',
            test: "EventTarget === undefined || EventTarget.constructor === undefined",
            path: require.resolve('event-target/min.js'),
          },
          {
            name: 'resize-observer',
            test: "ResizeObserver === undefined",
            path: require.resolve('resize-observer-polyfill/dist/ResizeObserver.js'),
          },
        ],
      },
    }),
    cpy([
      { files: 'favicon.ico', dest: 'dist' },
      { files: '*.png', dest: 'dist' },
      { files: 'manifest.json', dest: 'dist' },
      { files: 'browserconfig.xml', dest: 'dist' },
      { files: 'geogebra.html', dest: 'dist' },
    ]),
    generateSW({
      swDest: 'dist/sw.js',
      globDirectory: 'dist/',
      globPatterns: ['**/*.{html,js,css,png}'],
      navigateFallback: '/',
      navigateFallbackDenylist: [/geogebra.html/],
    }),
  ],
});
