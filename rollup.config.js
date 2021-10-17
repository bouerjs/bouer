// rollup.config.js
const path = require('path');
const typescript = require('@rollup/plugin-typescript');
const terser = require('rollup-plugin-terser').terser;
const cleanup = require('rollup-plugin-cleanup');
const version = require('./package.json').version;

const banner =
  '/*!\n' +
  ` * Bouer.js v${version}\n` +
  ` * Copyright Easy.js 2018-2020 | 2021-${new Date().getFullYear()} Afonso Matumona\n` +
  ' * Released under the MIT License.\n' +
  ' */'

const buildConfig = input => {
  return {
    format: 'umd',
    banner: banner,
    name: 'Bouer',
    ...input
  }
}

export default {
  input: path.resolve('src', 'Bouer.ts'),
  output: [
    buildConfig({ // Development
      file: path.resolve('dist', 'bouer.js'),
    }),
    buildConfig({ // Production
      file: path.resolve('dist', 'bouer.min.js'),
      plugins: [terser({
        format: {
          comments: false
        }
      })]
    })
  ],
  plugins: [
    cleanup({ comments: false }),
    typescript({
      lib: ["es5", "es6", "dom"],
      target: "es5"
    })
  ],
};
