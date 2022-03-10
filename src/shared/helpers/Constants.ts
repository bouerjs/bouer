import { startWith } from './Utils';

const Constants = {
  skip: 'e-skip',

  build: 'e-build',
  array: 'e-array',

  if: 'e-if',
  elseif: 'e-else-if',
  else: 'e-else',
  show: 'e-show',

  req: 'e-req',
  for: 'e-for',

  data: 'data',
  def: 'e-def',
  wait: 'wait-data',

  text: 'e-text',
  bind: 'e-bind',
  property: 'e-',

  skeleton: 'e-skeleton',

  route: 'route-view',
  href: ':href',

  entry: 'e-entry',

  on: 'on:',

  silent: '--s',
  slot: 'slot',
  ref: 'ref',
  put: 'e-put',

  builtInEvents: {
    add: 'add',
    compile: 'compile',
    request: 'request',
    response: 'response',
    fail: 'fail',
    done: 'done',
  },

  check(node: Node, cmd: string) {
    return startWith(node.nodeName, cmd);
  },

  isConstant(value: string) {
    return (Object.keys(this).map(key => (this as any)[key] as string).indexOf(value) !== -1);
  }
};

export default Constants;