import CustomDirective from '../../../definitions/types/CustomDirective';
import RenderContext from '../../../definitions/types/RenderContext';
import { ifNullReturn, toOwnerNode } from '../../../shared/helpers/Utils';
import Binder from '../../binder/Binder';
import DelimiterHandler from '../../DelimiterHandler';
import Evaluator from '../../Evaluator';

export function custom(opitons: {
  node: Node,
  binder: Binder,
  evaluator: Evaluator,
  delimiter: DelimiterHandler,
  customDirectives: CustomDirective,
  context: RenderContext,
  data: object
}): boolean {
  const {
    node,
    binder,
    delimiter,
    customDirectives: $custom,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeName = node.nodeName;
  const nodeValue = ifNullReturn(node.nodeValue, '');
  const delimiters = delimiter.run(nodeValue);
  const $CustomDirective = $custom[nodeName];

  const bindConfig = binder.create({
    data: data,
    node: node,
    fields: delimiters,
    replaceable: false,
    context: context,
    onBind: $CustomDirective.onBind,
    onUpdate: $CustomDirective.onUpdate,
    onUnbind: $CustomDirective.onUnbind
  });

  if (ifNullReturn($CustomDirective.removable, true))
    ownerNode.removeAttribute(nodeName);

  const modifiers = nodeName.split('.');
  modifiers.shift();
  // my-custom-dir:arg.mod1.mod2
  const argument = (nodeName.split(':')[1] || '').split('.')[0];

  bindConfig.modifiers = modifiers;
  bindConfig.argument = argument;

  if (typeof $CustomDirective.onBind === 'function')
    return ifNullReturn($CustomDirective.onBind(node, bindConfig), false);

  return false;
}