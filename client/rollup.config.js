import cpy from 'rollup-plugin-cpy';
import createDefaultConfig from '@open-wc/building-rollup';
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
    generateSW({
      swDest: 'dist/sw.js',
      globDirectory: 'dist/',
      navigateFallback: '/',
    }),
    /*
    injectManifest({
      swSrc: 'dist/sw.js',
      swDest: 'dist/sw.js',
      globDirectory: 'dist/',
    }),
     */
    cpy([
      { files: 'favicon.ico', dest: 'dist' },
      { files: '*.png', dest: 'dist' },
      { files: 'manifest.json', dest: 'dist' },
      { files: 'browserconfig.xml', dest: 'dist' },
      { files: 'geogebra.html', dest: 'dist' },
    ]),
  ],
});
