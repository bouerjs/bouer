import Bouer, { Compiler, IoC } from '../../..';
import dynamic from '../../../definitions/types/Dynamic';
import RenderContext from '../../../definitions/types/RenderContext';
import Extend from '../../../shared/helpers/Extend';
import Prop from '../../../shared/helpers/Prop';
import {
  errorMsgEmptyNode,
  errorMsgNodeValue,
  forEach,
  ifNullReturn,
  isObject,
  toOwnerNode,
  trim
} from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import DelimiterHandler from '../../DelimiterHandler';
import Evaluator from '../../Evaluator';
import ReactiveEvent from '../../event/ReactiveEvent';
import Reactive from '../../reactive/Reactive';
import DataStore from '../../store/DataStore';

export function $data(opitons: {
  node: Node,
  bouer: Bouer,
  compiler: Compiler,
  delimiter: DelimiterHandler,
  evaluator: Evaluator,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    bouer,
    delimiter,
    context,
    evaluator,
    compiler,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error('The “data” attribute cannot contain delimiter.');

  ownerNode.removeAttribute(node.nodeName);

  let inputData: dynamic = {};
  const mData = Extend.obj(data, { $data: data });
  const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
    if (!(descriptor.propName in inputData))
      inputData[descriptor.propName] = undefined;
    Prop.set(inputData, descriptor.propName, descriptor);
  });

  // If data value is empty gets the main scope value
  if (nodeValue === '')
    inputData = Extend.obj(bouer.data);
  else {
    // Other wise, compiles the object provided
    const mInputData = evaluator.exec({
      data: mData,
      code: nodeValue,
      context: context
    });

    if (!isObject(mInputData))
      return Logger.error('Expected a valid Object Literal expression in “' + node.nodeName +
        '” and got “' + nodeValue + '”.');

    // Adding all non-existing properties
    forEach(Object.keys(mInputData), key => {
      if (!(key in inputData))
        inputData[key] = mInputData[key];
    });
  }

  ReactiveEvent.off('AfterGet', reactiveEvent.callback);

  let dataKey = node.nodeName.split(':')[1];
  if (dataKey) {
    dataKey = dataKey.replace(/\[|\]/g, '');
    IoC.app(bouer).resolve(DataStore)!.set('data', dataKey, inputData);
  }

  Reactive.transform({
    context: context,
    data: inputData
  });

  return compiler.compile({
    data: inputData,
    el: ownerNode,
    context: context,
  });
}

export function $def(opitons: {
  node: Node,
  bouer: Bouer,
  delimiter: DelimiterHandler,
  evaluator: Evaluator,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    bouer,
    delimiter,
    context,
    evaluator,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));

  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));

  const inputData: dynamic = {};
  const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
    if (!(descriptor.propName in inputData))
      inputData[descriptor.propName] = undefined;
    Prop.set(inputData, descriptor.propName, descriptor);
  });

  const mInputData = evaluator.exec({
    data: data,
    code: nodeValue,
    context: context
  });

  if (!isObject(mInputData))
    return Logger.error('Expected a valid Object Literal expression in “' + node.nodeName +
      '” and got “' + nodeValue + '”.');

  // Adding all non-existing properties
  forEach(Object.keys(mInputData), key => {
    if (!(key in inputData))
      inputData[key] = mInputData[key];
  });

  ReactiveEvent.off('AfterGet', reactiveEvent.callback);

  bouer.set(inputData, data);
  ownerNode.removeAttribute(node.nodeName);
}

export function $wait(options: {
  node: Node,
  bouer: Bouer,
  compiler: Compiler,
  delimiter: DelimiterHandler,
  context: RenderContext
}) {
  const { node, bouer, delimiter, compiler, context } = options;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));

  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));

  ownerNode.removeAttribute(node.nodeName);
  const dataStore = IoC.app(bouer).resolve(DataStore)!;
  const mWait = dataStore.wait[nodeValue];

  if (mWait) {
    mWait.nodes.push(ownerNode);
    // No data exposed yet
    if (!mWait.data) return;
    // Compile all the waiting nodes
    forEach(mWait.nodes, (nodeWaiting) => {
      compiler.compile({
        el: nodeWaiting as Element,
        context: mWait.context,
        data: Reactive.transform({
          context: mWait.context,
          data: mWait.data!
        }),
      });
    });

    if (ifNullReturn(mWait.once, false))
      delete dataStore.wait[nodeValue];
  }

  return dataStore.wait[nodeValue] = { nodes: [ownerNode], context: context };
}