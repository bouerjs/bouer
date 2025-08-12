import { IoC } from '../../..';
import RenderContext from '../../../definitions/types/RenderContext';
import Bouer from '../../../instance/Bouer';
import Constants from '../../../shared/helpers/Constants';
import {
  errorMsgEmptyNode,
  errorMsgNodeValue,
  forEach,
  ifNullReturn,
  isObject,
  toOwnerNode,
  trim,
  urlCombine
} from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import Binder from '../../binder/Binder';
import DelimiterHandler from '../../DelimiterHandler';
import Evaluator from '../../Evaluator';
import Routing from '../../routing/Routing';

const constsValues = Object.values(Constants);

export function $bind(opitons: {
  node: Node,
  binder: Binder,
  delimiter: DelimiterHandler,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    binder,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));

  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));

  binder.create({
    node: node,
    fields: [{ field: nodeValue, expression: nodeValue, pipes: [] }],
    context: context,
    data: data
  });

  ownerNode.removeAttribute(node.nodeName);
}

export function $text(opitons: {
  node: Node,
}) {
  const {
    node,
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));

  ownerNode.textContent = nodeValue;
  ownerNode.removeAttribute(node.nodeName);
}

export function $property(opitons: {
  node: Node,
  binder: Binder,
  delimiter: DelimiterHandler,
  evaluator: Evaluator,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    binder,
    delimiter,
    context,
    evaluator,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node) as Element;
  const nodeName = node.nodeName;
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  let execute = (obj: object) => { };

  const errorInvalidValue = (node: Node) => ('Invalid value, expected an Object/Object Literal in “'
    + nodeName + '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');

  if (constsValues.includes(node.nodeName))
    return;

  if (nodeValue === '')
    return Logger.error(errorInvalidValue(node));

  if (delimiter.run(nodeValue).length !== 0) return;

  const inputData = evaluator.exec({
    data: data,
    code: nodeValue,
    context: context
  });

  if (!isObject(inputData))
    return Logger.error(errorInvalidValue(node));

  binder.create({
    data: data,
    node: node,
    context: context,
    isReplaceProperty: false,
    fields: [{ expression: nodeValue, field: nodeValue, pipes: [] }],
    onUpdate: () => execute(evaluator.exec({
      data: data,
      code: nodeValue,
      context: context
    }))
  });

  ownerNode.removeAttribute(node.nodeName);

  (execute = (obj: any) => {
    const attrNameToSet = node.nodeName.substring(Constants.property.length);
    let attr = (ownerNode.attributes as any)[attrNameToSet] as Attr;
    if (!attr) {
      (ownerNode.setAttribute(attrNameToSet, ''));
      attr = (ownerNode.attributes as any)[attrNameToSet] as Attr;
    }

    forEach(Object.keys(obj), key => {
      /* if has a falsy value remove the key */
      if (!obj[key]) return attr.value = trim(attr.value.replace(key, ''));
      attr.value = (attr.value.includes(key) ? attr.value : trim(attr.value + ' ' + key));
    });

    if (attr.value === '')
      return ownerNode.removeAttribute(attrNameToSet);
  })(inputData);
}

export function $href(opitons: {
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
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));

  const usehash = ifNullReturn(bouer.config.usehash, true);
  const routeToSet = urlCombine((usehash ? '#' : ''), nodeValue);

  ownerNode.setAttribute('href', routeToSet);
  const href = ownerNode.attributes['href'] as Attr;
  const delimiters = delimiter.run(nodeValue);

  if (delimiters.length !== 0)
    binder.create({
      data: data,
      node: href,
      context: context,
      fields: delimiters
    });

  ownerNode.removeAttribute(node.nodeName);

  (ownerNode as HTMLAnchorElement)
    .addEventListener('click', event => {
      event.preventDefault();

      IoC.app(bouer).resolve(Routing)!
        .navigate(href.value);
    }, false);
}