import Bouer, { IoC, RenderContext } from '../../..';
import {
  createAnyEl,
  errorMsgEmptyNode,
  errorMsgNodeValue,
  ifNullReturn,
  toOwnerNode, trim
} from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import Binder from '../../binder/Binder';
import ComponentHandler from '../../component/ComponentHandler';
import DelimiterHandler from '../../DelimiterHandler';

export function $entry(opitons: {
  node: Node,
  bouer: Bouer,
  delimiter: DelimiterHandler,
  data: object
}) {
  const {
    node,
    bouer,
    delimiter,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node) as Element;
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));

  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));

  ownerNode.removeAttribute(node.nodeName);
  IoC.app(bouer).resolve(ComponentHandler)!
    .prepare([
      {
        name: nodeValue,
        template: ownerNode.outerHTML,
        data: data
      }
    ]);
}

export function $put(opitons: {
  node: Node,
  bouer: Bouer,
  binder: Binder,
  delimiter: DelimiterHandler,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    bouer,
    binder,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node) as Element;
  let nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  let execute = () => { };

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node) + ' Direct <empty string> injection value is not allowed.');

  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error('Expected an expression with no delimiter in “' + node.nodeName +
      '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');

  binder.create({
    data: data,
    node: node,
    isConnected: () => ownerNode.isConnected,
    fields: [{ expression: nodeValue, field: nodeValue }],
    context: context,
    isReplaceProperty: false,
    onUpdate: () => execute()
  });

  ownerNode.removeAttribute(node.nodeName);

  (execute = () => {
    ownerNode.innerHTML = '';
    nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '') return;

    const componentElement = createAnyEl(nodeValue)
      .appendTo(ownerNode)
      .build();

    IoC.app(bouer).resolve(ComponentHandler)!
      .order(componentElement, data);
  })();
}