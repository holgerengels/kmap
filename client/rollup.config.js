import { createSpaConfig } from '@open-wc/building-rollup';
import replace from '@rollup/plugin-replace'
import sourcemaps from 'rollup-plugin-sourcemaps';
import copy from 'rollup-plugin-copy';
const { generateSW } = require('rollup-plugin-workbox');
import merge from 'deepmerge';
import commonjs from "@rollup/plugin-commonjs";

const baseConfig = createSpaConfig({

  developmentMode: process.env.ROLLUP_WATCH === 'true',
  injectServiceWorker: true,

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
});

export default merge(baseConfig, {
  input: './index.html',
  plugins: [
    commonjs(),
    sourcemaps(),
    replace({
      'process.env.NODE_ENV': 'development',
    }),
    generateSW({
      mode: 'development',
      swDest: './sw.js',
      globDirectory: './',
      globPatterns: ['**/*.{html,js,css,png,svg,woff2}'],
      globIgnores: ["**\/node_modules\/**\/*", "**\/test\/**\/*"],
      navigateFallback: '/app/index.html',
      navigateFallbackDenylist: [/geogebra.html/],
      inlineWorkboxRuntime: false,
      skipWaiting: true,
      cleanupOutdatedCaches: true,
      runtimeCaching: [{
        urlPattern: /data/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'data',
          broadcastUpdate: {
            channelName: 'data',
            options: {},
          }
        },
      }, {
        urlPattern: /tests/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'tests',
          broadcastUpdate: {
            channelName: 'tests',
            options: {},
          }
        },
      }, {
        urlPattern: /subjects/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'subjects',
        },
      }],
    }, function render({ swDest, count, size }) {
      console.log(
        '📦', swDest,
        '#️⃣', count,
        '🐘', size,
      );
    }),
    copy({
      targets: [
        {src: 'icons/*', dest: 'dist/icons'},
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
  ],
});


// {
//         urlPattern: /[^.]*/,
//         handler: 'NetworkOnly',
//       },
