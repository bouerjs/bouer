import { startWith } from "./Utils";

export const Constants = {
  ignore: 'e-ignore',

  build: 'e-build',
  array: 'e-array',

  if: 'e-if',
  elseif: 'e-else-if',
  else: 'e-else',
  show: 'e-show',

  req: 'e-req',
  tmp: 'e-tmp',
  fill: 'e-fill',
  for: 'e-for',
  use: 'e-use',
  id: 'e-id',
  order: 'e-order',
  filter: 'e-filter',

  data: 'data',
  def: 'e-def',
  wait: 'wait-data',

  toggle: 'e-toggle',
  content: 'e-content',
  bind: 'e-bind',
  property: 'e-',

  anm: 'e-anm',
  skeleton: 'e-skeleton',

  route: 'route-view',
  href: ':href',
  ihref: '!href',

  entry: 'e-entry',
  component: ':name',

  on: 'on:',

  tagContent: 'content',

  check: function (node: Node, cmd: string) {
    return startWith(node.nodeName, cmd);
  },

  isConstant: function (value: string) {
    return (Object.keys(this).map(key => (this as any)[key] as string).indexOf(value) !== -1)
  }
}
