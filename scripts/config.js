const rollupConfigs = require('path');
const version = require('../package.json').version;
const typescript = require('@rollup/plugin-typescript');
const buble = require('@rollup/plugin-buble');
const cleanup = require('rollup-plugin-cleanup');
const babel = require('@rollup/plugin-babel').babel;

const resolve = (p1, p2) => rollupConfigs.resolve(p1, p2);
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
    extra: {
      transpile: false
    },
    input: resolve('src', 'instance/Bouer.ts'),
    output: {
      file: outputName('bouer.js'),
    }
  },
  'cjs-common-js': {
    input: resolve('src', 'index.ts'),
    output: {
      file: outputName('bouer.common.js'),
      exports: "named"
    }
  },
  'es-browser-esm': {
    input: resolve('src', 'index.ts'),
    output: {
      file: outputName('bouer.esm.js'),
      exports: "named"
    }
  },
}

const rollupConfigBuilder = (key, config) => {
  const format = key.split('-')[0];

  config.output.name = 'Bouer';
  config.output.format = format;
  config.output.banner = banner;
  config.output.indent = false;

  const extra = config.extra;
  delete config.extra;

  const rollupConfig = {
    input: config.input,
    output: config.output,
    plugins: [
      cleanup({
        comments: false,
      }),
      babel({
        exclude: ["node_modules/**"],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
      }),
      typescript({
        lib: ["es5", "es6", "dom"],
        target: "es5"
      })
    ],
    onwarn: (message, logger) => {
      if (!/Circular/.test(message)) {
        logger(message);
      }
    }
  };

  if (extra && extra.transpile !== false)
    rollupConfig.plugins.push(buble());

  return rollupConfig;
}

Object.keys(builds).filter(key => {
  builds[key] = rollupConfigBuilder(key, builds[key]);
})

module.exports = {
  builds
};