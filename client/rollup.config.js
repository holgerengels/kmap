import { createSpaConfig } from '@open-wc/building-rollup';
import copy from 'rollup-plugin-copy';
const { generateSW } = require('rollup-plugin-workbox');
import merge from 'deepmerge';

// use createBasicConfig to do regular JS to JS bundling
// import { createBasicConfig } from '@open-wc/building-rollup';

const baseConfig = createSpaConfig({

  developmentMode: process.env.ROLLUP_WATCH === 'true',
  injectServiceWorker: false,

  /*
  babel: {
    plugins: [
      [
        require.resolve('babel-plugin-template-html-minifier'),
        {
          modules: {
            'cool-html': ['html'],
          },
          htmlMinifier: {
            removeComments: false,
          },
        },
      ],
    ],
  },
   */

  polyfillsLoader: {
    polyfills: {
      dynamicImport: true,
      resizeObserver: true,
      custom: [
        {
          name: 'event-target',
          test: "true || !('EventTarget' in window) || !('constructor' in window.EventTarget.prototype)",
          path: require.resolve('event-target/min.js'),
          minify: true,
        },
      ],
    },
  },
});

export default merge(baseConfig, {
  input: './index.html',
  /*
  output: {
    sourcemap: true,
  },
   */
  plugins: [
    copy({
      targets: [
        {src: 'favicon.ico', dest: 'dist'},
        {src: '*.png', dest: 'dist'},
        {src: '*.svg', dest: 'dist'},
        {src: 'manifest.json', dest: 'dist'},
        {src: 'browserconfig.xml', dest: 'dist'},
        {src: 'geogebra.html', dest: 'dist'},
      ],
      flatten: false
    }),
    generateSW({
      swDest: 'dist/sw.js',
      globDirectory: 'dist/',
      globPatterns: ['**/*.{html,js,css,png,svg}'],
      navigateFallback: '/',
      navigateFallbackDenylist: [/geogebra.html/],
    }),
  ],
});
