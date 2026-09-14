// scripts/config.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import typescript from '@rollup/plugin-typescript';
import { babel } from '@rollup/plugin-babel';

// Create require helper to read JSON safely in ESM
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

// Derive __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolve = (p1, p2) => path.resolve(p1, p2);
const outputName = name => resolve('dist', name);

const banner =
  '/*!\n' +
  ` * Bouer.js v${version}\n` +
  ` * Copyright Easy.js 2018-2020 | 2021-${new Date().getFullYear()} Afonso Matumona\n` +
  ' * Released under the MIT License.\n' +
  ' */';

/**
 * Build Format
 * { 'format-buildName': { ... } }
 * Eg: umd-browser
 */

const builds = {
  'umd-browser': {
    input: resolve('src', 'instance/Bouer.ts'),
    output: {
      file: outputName('bouer.js')
    }
  },

  'cjs-common-js': {
    input: resolve('src', 'index.ts'),
    output: {
      file: outputName('bouer.common.js'),
      exports: 'named'
    }
  },

  'es-browser-esm': {
    input: resolve('src', 'index.ts'),
    output: {
      file: outputName('bouer.esm.js'),
      exports: 'named'
    }
  }
};

const rollupConfigBuilder = (key, config) => {
  const keySplitted = key.split('-');
  const format = keySplitted.shift();

  config.output.name = 'Bouer';
  config.output.format = format;
  config.output.banner = banner;
  config.output.indent = false;

  delete config.extra;

  const rollupConfig = {
    input: config.input,
    output: config.output,

    plugins: [
      babel({
        exclude: ['node_modules/**'],
        babelHelpers: 'bundled'
      }),
      typescript({
        tsconfig: 'tsconfig.json'
      })
    ],

    onwarn: (message, logger) => {
      if (!/Circular/.test(message)) {
        logger(message);
      }
    }
  };

  return rollupConfig;
};

Object.keys(builds).forEach(key => {
  builds[key] = rollupConfigBuilder(key, builds[key]);
});

export {
  builds,
  version
};