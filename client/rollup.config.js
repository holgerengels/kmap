import cpy from 'rollup-plugin-cpy';
import createDefaultConfig from '@open-wc/building-rollup/modern-config';

const config = createDefaultConfig({ input: './index.html' });

export default [
  {
    ...config,
    plugins: [
      ...config.plugins,
      cpy([
        { files: '*.png', dest: 'dist' },
        { files: 'manifest.json', dest: 'dist' },
        { files: 'browserconfig.xml', dest: 'dist' },
        { files: 'geogebra.html', dest: 'dist' },
      ]),
    ],
  }
];
