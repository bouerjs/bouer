const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const rollup = require('rollup');
const terser = require('terser');
const builds = require('./config').builds;

Object.keys(builds).filter(key => {
  const config = builds[key];
  const output = config.output;

  const fileNameDev = output.file;
  const fileNameProd = fileNameDev.replace('.js', '.min.js');
  const isProd = process.argv[2] === '--prod';

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({
      output: [{
        code
      }]
    }) => {
      writeFile(fileNameDev, code);

      if (!isProd) return;
      terser.minify(code, {
        toplevel: true,
        output: {
          ascii_only: true
        },
        compress: {
          pure_funcs: ['makeMap']
        }
      }).then(terserOutput => {
        return writeFile(fileNameProd, terserOutput.code, true);
      });
    })
    .catch(err => {
      console.error(err);
    });
});

function writeFile(dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report(extra) {
      const colored = `\x1b[1m\x1b[34m${
        ((path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      }\x1b[39m\x1b[22m`;
      const instance = new Date();
      const date = instance.toJSON().split('T')[0];
      const time = instance.toLocaleTimeString('pt');
      console.log(`[${ date } ${ time }] ${colored}`);
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