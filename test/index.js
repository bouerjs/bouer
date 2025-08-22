import 'jsdom';
import 'jsdom-global/register';
import 'regenerator-runtime/runtime';

import Bouer, {
  IoC,
  Compiler,
  Computed,
  createEl,
  $computed,

  Component,
  ViewChild

} from '../src/index';

import { promisify } from 'util';

const sleep = promisify(setTimeout);

function toHtml(strContent) {
  return createEl('body', el => el.innerHTML = strContent)
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
  Computed,
  Component,
  ViewChild,

  $computed,
  nextTick,
  toHtml,
  sleep,

  IoC,
};