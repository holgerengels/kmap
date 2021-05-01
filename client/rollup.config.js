import { createSpaConfig } from '@open-wc/building-rollup';
//import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy';
const { generateSW } = require('rollup-plugin-workbox');
import merge from 'deepmerge';

// use createBasicConfig to do regular JS to JS bundling
// import { createBasicConfig } from '@open-wc/building-rollup';

const baseConfig = createSpaConfig({

  developmentMode: process.env.ROLLUP_WATCH === 'true',
  injectServiceWorker: false,

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
  plugins: [
    /*
    replace({
      'process.env.DEPLOY_SERVER': JSON.stringify(process.env.DEPLOY_SERVER || 'http://127.0.0.1:8081/server/'),
      'process.env.DEPLOY_CLIENT': JSON.stringify(process.env.DEPLOY_CLIENT || 'http://127.0.0.1:8080/app/'),
    }),
    */
    copy({
      targets: [
        {src: 'src/icons/*', dest: 'dist'},
        {src: 'fonts/*', dest: 'dist/fonts'},
        {src: 'favicon.ico', dest: 'dist'},
        {src: 'robots.txt', dest: 'dist'},
        {src: '*.css', dest: 'dist'},
        {src: 'manifest.json', dest: 'dist'},
        {src: 'browserconfig.xml', dest: 'dist'},
        {src: 'geogebra.html', dest: 'dist'},
      ],
      flatten: false,
    }),
    generateSW({
      swDest: 'dist/sw.js',
      globDirectory: 'dist/',
      globPatterns: ['**/*.{html,js,css,png,svg,woff2}'],
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/geogebra.html/],
      runtimeCaching: [{
        urlPattern: /data/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'maps',
          broadcastUpdate: {
            channelName: 'maps',
          }
        },
      }, {
        urlPattern: /tests/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'tests',
          broadcastUpdate: {
            channelName: 'tests',
          }
        },
      }, {
        urlPattern: /subjects/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'subjects',
        },
      }],
    }),
  ],
});
