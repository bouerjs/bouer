import Bouer, {
  IoC,
  Compiler,
  Computed,
  $computed,
  Component,
  ViewChild,
  $form,
  $inert,
  $field,
  prop
} from '../src/index';
import { createEl } from '../src/shared/helpers/Utils';

import { setTimeout as sleep } from 'node:timers/promises';

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

  IoC,
  prop,

  $computed,
  nextTick,
  toHtml,
  sleep,
  $form,
  $inert,
  $field,
};