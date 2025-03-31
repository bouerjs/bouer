import INode from '../../../definitions/interfaces/INode';
import RenderContext from '../../../definitions/types/RenderContext';
import Constants from '../../../shared/helpers/Constants';
import {
  createComment,
  errorMsgEmptyNode,
  errorMsgNodeValue,
  findAttribute,
  forEach, getRootElement,
  ifNullReturn,
  toOwnerNode,
  trim
} from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import Binder from '../../binder/Binder';
import DelimiterHandler from '../../DelimiterHandler';
import Evaluator from '../../Evaluator';
import ReactiveEvent from '../../event/ReactiveEvent';
import Reactive from '../../reactive/Reactive';
import Compiler from '../Compiler';

export function $if(opitons: {
  node: Node,
  binder: Binder,
  evaluator: Evaluator,
  compiler: Compiler,
  delimiter: DelimiterHandler,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    binder,
    evaluator,
    compiler,
    delimiter,
    context,
    data
  } = opitons;

  const ownerNode = toOwnerNode(node) as Element;
  const container = ownerNode.parentElement;

  if (!container) return;

  const conditions: { attr: Attr, node: Element }[] = [];
  const isActive = (container as INode).isActive!;
  const comment = createComment();
  const nodeName = node.nodeName;
  let execute = () => { };


  if (nodeName === Constants.elseif || nodeName === Constants.else) return;

  let currentEl: Element | null = ownerNode;
  const reactives: { attr: Attr, descriptor: Reactive<any, any> }[] = [];

  // Inserting the comment ref
  container.insertBefore(comment, currentEl);

  do { // Searching for 'e-else-if' and 'e-else' to complete the conditional chain
    if (currentEl == null) break;

    const attr = findAttribute(currentEl, ['e-if', 'e-else-if', 'e-else']);
    if (!attr) break;

    (currentEl as INode).isActive = (container as INode).isActive;

    const firstCondition = conditions[0]; // if it already got an 'if',
    if (attr.name === 'e-if' && firstCondition && (attr.name === firstCondition.attr.name))
      break;

    if ((attr.nodeName !== 'e-else') && (trim(ifNullReturn(attr.nodeValue, '')) === ''))
      return Logger.error(errorMsgEmptyNode(attr));

    if (delimiter.run(ifNullReturn(attr.nodeValue, '')).length !== 0)
      return Logger.error(errorMsgNodeValue(attr));

    conditions.push({ attr: attr, node: currentEl });

    if (attr.nodeName === 'e-else') {
      currentEl.removeAttribute(attr.nodeName);
      break;
    }

    // Listening to the property get only if the callback function is defined
    ReactiveEvent.once('AfterGet', event => {
      event.onemit = descriptor => {
        // Avoiding multiple binding in the same property
        if (reactives.findIndex(item => item.descriptor.propName == descriptor.propName) !== -1)
          return;
        reactives.push({ attr: attr, descriptor: descriptor });
      };

      evaluator.exec({
        data: data,
        code: attr.value,
        context: context,
      });
    });

    currentEl.removeAttribute(attr.nodeName);
  } while (currentEl = currentEl.nextElementSibling);

  forEach(reactives, item => {
    binder.binds.push({
      // Binder is connected if at least one of the chain and the comment is still connected
      isConnected: isActive,
      watch: item.descriptor.onChange(() => execute(), item.attr)
    });
  });

  (execute = () => {
    forEach(conditions, chainItem => {
      const element = getRootElement(chainItem.node);
      if (!element.parentElement) return;
      container.removeChild(element);
    });

    const conditionalExpression = conditions.map((item, index) => {
      const $value = item.attr.value;
      switch (item.attr.name) {
        case Constants.if: return 'if(' + $value + '){ __cb(' + index + '); }';
        case Constants.elseif: return 'else if(' + $value + '){ __cb(' + index + '); }';
        case Constants.else: return 'else{ __cb(' + index + '); }';
      }
    }).join(' ');

    evaluator.exec({
      data: data,
      isReturn: false,
      code: conditionalExpression,
      context: context,
      aditional: {
        __cb: (chainIndex: number) => {
          const { node: mElement } = conditions[chainIndex];
          const element = getRootElement(mElement);
          container.insertBefore(element, comment);

          compiler.compile({
            el: element,
            data: data,
            context: context
          });
        }
      }
    });
  })();
}

export function $show(opitons: {
  node: Node,
  binder: Binder,
  evaluator: Evaluator,
  delimiter: DelimiterHandler,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    binder,
    evaluator,
    delimiter,
    context,
    data
  } = opitons;

  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  let execute = (el: HTMLElement) => { };

  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));

  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));

  const bindResult = binder.create({
    data: data,
    node: node,
    fields: [{ expression: nodeValue, field: nodeValue, pipes: [] }],
    context: context,
    onUpdate: () => execute(ownerNode)
  });

  (execute = (element: HTMLElement) => {
    element.style.display = evaluator.exec({
      data: data,
      code: nodeValue,
      context: context,
    }) ? '' : 'none';
  })(ownerNode);

  ownerNode.removeAttribute(bindResult.node.nodeName);
}