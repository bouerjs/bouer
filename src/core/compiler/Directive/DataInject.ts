import dynamic from '../../../definitions/types/Dynamic';
import RenderContext from '../../../definitions/types/RenderContext';
import Extend from '../../../shared/helpers/Extend';
import Property from '../../../shared/helpers/Property';
import {
  $internal,
  errorMsgEmptyNode,
  errorMsgNodeValue,
  filter,
  ifNullReturn,
  isObject,
  toOwnerNode,
  trim
} from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import DelimiterHandler from '../../DelimiterHandler';
import Evaluator from '../../Evaluator';
import ReactiveEvent from '../../reactive/ReactiveEvent';
import { $reactive } from '../../reactive/Reactive';
import DataStore from '../../store/DataStore';
import Compiler, { CompilationHooks } from '../Compiler';
import Bouer from '../../../instance/Bouer';
import IoC from '../../../shared/helpers/IoCContainer';

export function $data(opitons: {
  node: Node,
  bouer: Bouer,
  compiler: Compiler,
  delimiter: DelimiterHandler,
  evaluator: Evaluator,
  context: RenderContext,
  data: object,
  compilationHooks: CompilationHooks
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
  const mData = Extend.obj(data, { $data: data, $scope: data });
  const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
    if (!(descriptor.$name in inputData))
      inputData[descriptor.$name] = undefined;
    Property.set(inputData, descriptor.$name, descriptor);
  });

  // If data value is empty gets the main scope value
  if (nodeValue === '')
    inputData = Extend.obj(data);
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
    filter(Object.keys(mInputData), key => {
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

  $reactive({
    context: context,
    data: inputData
  });

  // Signinng the element with it's data
  IoC.app(bouer).resolve(DataStore)!.addNodeData(ownerNode, inputData);

  return compiler.compile({
    data: inputData,
    el: ownerNode,
    context: context,
    afterCompile: opitons.compilationHooks.afterCompile,
    beforeCompile: opitons.compilationHooks.beforeCompile
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
    if (!(descriptor.$name in inputData))
      inputData[descriptor.$name] = undefined;
    Property.set(inputData, descriptor.$name, descriptor);
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
  filter(Object.keys(mInputData), key => {
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
  context: RenderContext,
  compilationHooks: CompilationHooks
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
    filter(mWait.nodes, (nodeWaiting) => {
      const $data = $reactive({ context: mWait.context, data: mWait.data! });
      dataStore.addNodeData(nodeWaiting, $data);
      compiler.compile({
        el: nodeWaiting,
        context: mWait.context,
        data: $data,
        beforeCompile: options.compilationHooks.beforeCompile,
        afterCompile: options.compilationHooks.afterCompile,
      });
    });

    if (ifNullReturn(mWait.once, false))
      delete dataStore.wait[nodeValue];
  }

  return dataStore.wait[nodeValue] = { nodes: [ownerNode], context: context };
}

export class DataProp<T, Constraint = 'required' | 'optional'> {
  public value?: T;
  public constraint: Constraint;
  constructor(
    value: T | undefined,
    type: Constraint
  ) {
    $internal(this);
    this.value = value;
    this.constraint = type;
  }

  static required<T>() {
    return new DataProp<T>(undefined as any, 'required') as T
  }

  static optional<T>(value?: T) {
    return new DataProp<T>(value, 'optional') as T | undefined
  }
}

const prop = Object.assign(
  /** Default function represent optional Property */
  function optional<T>(value?: T) {
    return DataProp.optional<T>(value);
  },
  {
    /** Optional Property, not expected in data directive */
    optional: DataProp.optional,
    /** Required Property, expected in data directive */
    required: DataProp.required
  }
);

export { prop };