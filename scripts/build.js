const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const rollup = require('rollup');
const { minify } = require('terser');
const builds = require('./config').builds;
const indent = require('js-beautify');

let clearConsole = false;
let numberOfGenerations = 0;
const buildKeys = Object.keys(builds);

buildKeys.filter(key => {
  const config = builds[key];
  const output = config.output;

  const fileNameDev = output.file;
  const fileNameProd = fileNameDev.replace('.js', '.min.js');
  const isProd = process.argv[2] === '--prod';
  const isDev = process.argv[2] === '--dev';

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  if (isDev) {
    console.clear();
    const watcher = rollup.watch(config);

    watcher.on('event', event => {
      const bundle = event.result;
      const date = new Date().toJSON().replace('T', ' ').replace('Z', '');
      const prefix = `[${date}]`;

      switch (event.code) {
        case 'BUNDLE_START':

          // Console clear
          if (clearConsole) {
            clearConsole = false;
            console.clear();
          }

          console.info(`${prefix} ⚒️  Generating file -> ${event.output[0]}`);
          break;
        case 'FATAL':
          console.error(`${prefix} ☠️ Fatal Error:`, event.error);
          process.exit(1);
          break;
        case 'ERROR':
          console.error(`${prefix} 😵 Error:`, event.error);
          break;
        case 'BUNDLE_END':
          bundle.generate(output)
            .then(({ output: [{ code }] }) => writeFile(fileNameDev, beautify(code)))
            .finally(() => {
              bundle.close();

              // Console clear
              numberOfGenerations++;
              if (buildKeys.length == numberOfGenerations) {
                clearConsole = true;
                numberOfGenerations = 0;

                console.log(`${prefix} ⏳ Waiting for a file to change to rebuild...`);
              }
            });
          break;
      }
    });

    return;
  }

  rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({
      output: [{ code }]
    }) => {
      writeFile(fileNameDev, beautify(code));

      if (!isProd) return;
      minify(code).then(terserOutput => {
        return writeFile(fileNameProd, terserOutput.code, true);
      });
    })
    .catch(err => {
      console.error(err);
    });
});

function beautify(code) {
  return indent.js(code, {
    'indent_size': '2',
    'indent_char': ' ',
    'max_preserve_newlines': '1',
    'preserve_newlines': true,
    'keep_array_indentation': true,
    'break_chained_methods': false,
    'indent_scripts': 'normal',
    'brace_style': 'collapse',
    'space_before_conditional': true,
    'unescape_strings': false,
    'jslint_happy': false,
    'end_with_newline': false,
    'wrap_line_length': '0',
    'indent_inner_html': false,
    'comma_first': false,
    'e4x': false,
    'indent_empty_lines': false
  });
}

function writeFile(dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report(extra) {
      const content = ((path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''));
      const colored = `\x1b[1m\x1b[34m${content}\x1b[39m\x1b[22m`;
      console.log(`[${new Date().toJSON().replace('T', ' ').replace('Z', '')}] ✅ Completed: ${colored}`);
      resolve();
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err);
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err);
          report(' (gzipped: ' + getSize(zipped) + ')');
        });
      } else {
        report();
      }
    });
  });
}

function getSize(code) {
  return (code.length / 1024).toFixed(2) + 'kb';
}