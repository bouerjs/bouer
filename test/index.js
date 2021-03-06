import 'jsdom';
import 'jsdom-global/register';
import 'regenerator-runtime/runtime';
import Bouer from '../src/index';
import Compiler from '../src/core/compiler/Compiler';
import {
  $CreateEl
} from '../src/shared/helpers/Utils';
const { promisify } = require('util');

const sleep = promisify(setTimeout);

function toHtml(strContent) {
  return $CreateEl('body', el => el.innerHTML = strContent)
    .child();
}

function nextTick(cb, seconds = 10) {
  let interval = 0;
  const timer = setInterval(() => {
    if (seconds <= interval++)
      setInterval(timer);
    cb();
  }, 1000);
}

export {
  Bouer,
  Compiler,

  nextTick,
  toHtml,
  sleep,
};