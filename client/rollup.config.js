import createDefaultConfig from '@open-wc/building-rollup/modern-config';
import cpy from 'rollup-plugin-cpy';
import deepmerge from 'deepmerge';
const { injectManifest, generateSW } = require('rollup-plugin-workbox');

// if you need to support IE11 use "modern-and-legacy-config" instead.
// import { createCompatibilityConfig } from '@open-wc/building-rollup';
// export default createCompatibilityConfig({ input: './index.html' });

const config = createDefaultConfig({
  input: './index.html',
  plugins: {
    workbox: false,
  },
});

export default deepmerge(config, {
  plugins: [
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
      navigateFallbackBlacklist: [/geogebra.html/],
    }),
  ],
});
