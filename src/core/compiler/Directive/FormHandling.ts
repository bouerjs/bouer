import RenderContext from '../../../definitions/types/RenderContext';
import { $default, ifNullReturn, isObject, toOwnerNode } from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import Evaluator from '../../Evaluator';
import ReactiveEvent from '../../reactive/ReactiveEvent';
import FormHandler from '../../form/FormHandler';
import Compiler from '../Compiler';
import ReactivePropertyDescriptor from '../../reactive/Reactive';

export function $formHandling(opitons: {
  node: Node,
  evaluator: Evaluator,
  context: RenderContext,
  compiler: Compiler,
  data: object
}) {
  const {
    node,
    context,
    evaluator,
    data
  } = opitons;

  const ownerNode = toOwnerNode(node); // The Form that needs to be initialized
  const nodeName = node.nodeName;
  const nodeValue = ifNullReturn(node.nodeValue, '');

  const errorInvalidValue = (node: Node) => ('Invalid value, expected an Object/Object Literal in “'
    + nodeName + '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');

  if (nodeValue === '')
    return Logger.error(errorInvalidValue(node));

  let formEntryDataSource = $default();

  const reactiveEvent = ReactiveEvent.on('AfterGet', (descriptor: ReactivePropertyDescriptor<any, any>) => {
    formEntryDataSource = descriptor.source;
  });

  const entryForm = evaluator.exec({
    data: data,
    code: nodeValue,
    context: context
  });

  reactiveEvent.off();

  if (!isObject(entryForm))
    return Logger.error(errorInvalidValue(node));

  const formHandler = entryForm instanceof FormHandler
    // Return the FormHandler
    ? entryForm
    // Create a new annonymous FormHandler
    : new FormHandler(entryForm.schema, entryForm.builderOptions);

  // Removing the form directive
  ownerNode.removeAttribute(node.nodeName);

  if (formEntryDataSource) {
    delete formEntryDataSource[nodeValue];
    formEntryDataSource[nodeValue] = formHandler;
  }

  return formHandler.init({
    element: ownerNode,
    context: context,
    bouer: opitons.compiler.bouer,
    data: data,
  });
}