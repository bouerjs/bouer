import { Constants } from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import IoC from "../../shared/helpers/IoC";
import {
  connectNode,
  defineProperty,
  findAttribute,
  forEach,
  isFunction,
  isNull,
  isObject,
  toStr,
  trim,
  urlCombine
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import { dynamic } from "../../types/dynamic";
import Binder from "../binder/Binder";
import Watch from "../binder/Watch";
import CommentHandler from "../CommentHandler";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import Evalutator from "../Evaluator";
import ReactiveEvent from "../event/ReactiveEvent";
import Bouer from "../instance/Bouer";
import Reactive from "../reactive/Reactive";
import Routing from "../routing/Routing";
import DataStore from "../store/DataStore";
import Compiler from "./Compiler";

export default class Directive {
  private bouer: Bouer;
  private binder: Binder;
  private evaluator: Evalutator;
  private delimiter: DelimiterHandler;
  private comment: CommentHandler;
  private compiler: Compiler;

  constructor(bouer: Bouer, compiler: Compiler) {
    this.bouer = bouer;
    this.compiler = compiler;

    this.evaluator = IoC.Resolve('Evalutator')!;
    this.delimiter = IoC.Resolve('DelimiterHandler')!;
    this.comment = IoC.Resolve('CommentHandler')!;
    this.binder = IoC.Resolve('Binder')!;
  }

  // Helper functions
  toOwnerNode(node: Node) {
    return (node as any).ownerElement || node.parentNode;
  }

  errorMsgEmptyNode = (node: Node) => "Expected an expression in “" + node.nodeName +
    "” and got an <empty string>.";
  errorMsgNodeValue = (node: Node) => "Expected an expression in “" + node.nodeName +
    "” and got “" + (node.nodeValue ?? '') + "”.";

  // Directives
  ignore(node: Element) {
    node.nodeValue = 'true';
  }

  if(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node) as Element;
    const container = ownerElement.parentElement;
    const conditions: { node: Attr, element: Element }[] = [];
    const comment = this.comment.create();
    const nodeName = node.nodeName;
    let exec = () => { };

    if (!container) return;

    if (nodeName === Constants.elseif || nodeName === Constants.else) return;

    let currentEl: Element | null = ownerElement;
    let reactives: { attr: Attr, reactive: Reactive<any, any> }[] = [];

    do { // Searching for 'e-else-if' and 'e-else' to complete the conditional chain
      if (currentEl == null) break;

      const attr = findAttribute(currentEl, ['e-if', 'e-else-if', 'e-else']);
      if (!attr) break;

      if ((attr.nodeName !== 'e-else') && (trim(attr.nodeValue ?? '') === ''))
        return Logger.error(this.errorMsgEmptyNode(attr));

      if (this.delimiter.run(attr.nodeValue ?? '').length !== 0)
        return Logger.error(this.errorMsgNodeValue(attr));

      conditions.push({ node: attr, element: currentEl });

      connectNode(currentEl, container);
      connectNode(attr, container);

      if (attr.nodeName === ('e-else')) {
        currentEl.removeAttribute(attr.nodeName); break;
      }

      // Listening to the property get only if the callback function is defined
      const reactiveEvent = ReactiveEvent.on('BeforeGet', reactive => {
        // Avoiding multiple binding in the same property
        if (reactives.findIndex(item => item.reactive.propertyName == reactive.propertyName) !== -1)
          return;
        reactives.push({ attr: attr, reactive: reactive });
      });

      this.evaluator.exec({
        data: data,
        expression: attr.value,
      })

      if (reactiveEvent) ReactiveEvent.off('BeforeGet', reactiveEvent.callback);

      currentEl.removeAttribute(attr.nodeName);
    } while (currentEl = currentEl.nextElementSibling);

    forEach(reactives, item =>
      this.binder.binds.push(item.reactive.watch(() => exec(), item.attr)));

    (exec = () => {
      forEach(conditions, chainItem => {
        if (chainItem.element.parentElement) {
          if (comment.isConnected)
            container.removeChild(chainItem.element);
          else
            container.replaceChild(comment, chainItem.element);
        }
      });

      const conditionalExpression = conditions.map((item, index) => {
        const $value = item.node.value;
        switch (item.node.name) {
          case Constants.if: return "if(" + $value + "){ _cb(" + index + "); }"
          case Constants.elseif: return "else if(" + $value + "){ _cb(" + index + "); }"
          case Constants.else: return "else{ _cb(" + index + "); }"
        }
      }).join(" ");

      this.evaluator.exec({
        data: data,
        isReturn: false,
        expression: conditionalExpression,
        aditional: {
          _cb: (chainIndex: number) => {
            const { element } = conditions[chainIndex];
            container.replaceChild(element, comment);
            this.compiler.compile({
              el: element,
              data: data
            })
          }
        }
      });
    })();
  }

  show(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node);
    const nodeValue = trim(node.nodeValue ?? '');
    const hasDelimiter = this.delimiter.run(nodeValue).length !== 0;

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (hasDelimiter)
      return Logger.error(this.errorMsgNodeValue(node));

    const exec = (element: HTMLElement) => {
      const value = this.evaluator.exec({
        expression: nodeValue,
        data: data
      });

      element.style.display = value ? '' : 'none';
    }

    connectNode(node, ownerElement);
    const bindResult = this.binder.create({
      data: data,
      node: node,
      fields: [{ expression: nodeValue, field: nodeValue }],
      onChange: () => exec(ownerElement)
    });

    exec(ownerElement);

    ownerElement.removeAttribute(bindResult.boundNode.nodeName);
  }

  for(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node) as Element;
    const container = ownerElement.parentElement;
    const comment = this.comment.create();
    const nodeName = node.nodeName;
    let nodeValue = trim(node.nodeValue ?? '');
    let listedItems: Element[] = [];
    let exec = () => { };

    if (!container) return;

    if (nodeValue === '')
    return Logger.error(this.errorMsgEmptyNode(node));

    if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
      return Logger.error("Expected a valid “for” expression in “" + nodeName + "” and got “" + nodeValue + "”."
      + "\nValid: e-for=\"item of items\".");

    // Binding the e-for if got delimiters
    const delimiters = this.delimiter.run(nodeValue);
    if (delimiters.length !== 0)
      this.binder.create({
        data: data,
        fields: delimiters,
        eReplace: true,
        node: node,
        onChange: () => exec()
      });

    ownerElement.removeAttribute(nodeName);
    const forItem = ownerElement.cloneNode(true);
    container.replaceChild(comment, ownerElement);

    connectNode(forItem, comment);
    connectNode(node, comment);

    const filter = (list: any[], filterConfigParts: string[]) => {
      let filterValue = filterConfigParts[1];
      let filterKeys = filterConfigParts[2];

      if (isNull(filterValue) || filterValue === '') {
        Logger.error("Invalid filter-value in “" + nodeName + "” with “" + nodeValue + "” expression.");
        return list;
      }

      filterValue = this.evaluator.exec({
        data: data,
        expression: filterValue
      });

      // filter:myFilter
      if (typeof filterValue === 'function') {
        list = (filterValue as Function)(list);
      } else {
        // filter:search:name
        if (isNull(filterKeys) || filterKeys === '') {
          Logger.error("Invalid filter-keys in “" + nodeName + "” with “" + nodeValue + "” expression, " +
            "at least one filter-key to be provided.");
          return list;
        }

        let newListCopy: any[] = [];
        forEach(list, item => {
          for (const prop of filterKeys.split(',').map(m => trim(m))) {
            let propValue = this.evaluator.exec({ data: item, expression: prop });
            if (!toStr(propValue).includes(filterValue)) break;
            newListCopy.push(item);
          }
        });
        list = newListCopy;
      }

      return list;
    }

    const order = (list: any[], type: string, prop: string | null) => {
      if (!type) type = 'asc';
      return list.sort(function (a, b) {
        const comparison = function (asc: boolean | null, desc: boolean | null) {
          if (isNull(asc) || isNull(desc)) return 0;
          switch (type.toLowerCase()) {
            case 'asc': return asc ? 1 : -1;
            case 'desc': return desc ? -1 : 1;
            default: Logger.log("The “" + type + "” order type is invalid: “" + nodeValue +
              "”. Available types are: “asc”  for order ascendent and “desc” for order descendent.");
              return 0;
          }
        }
        if (!prop) return comparison(a > b, b < a);
        return comparison(a[prop] > b[prop], b[prop] < a[prop]);
      });
    }

    const reactivePropertyEvent = ReactiveEvent.on('AfterGet',
      reactive => this.binder.binds.push(reactive.watch(() => exec(), node)));

    const reactiveArrayEvent = ReactiveEvent.on('AfterArrayChanges', () => exec());

    // Creating a fake reactive prop and fake Watch to destroy AfterArrayChanges Event
    this.binder.binds.push(
      // Watch instance
      new Watch(
        // Reactive instance for the Watch
        new Reactive({
          propertyName: '_',
          sourceObject: { _: [] }
        }),

        // Watch Callback
        () => { },

        // Watch Instance Options
        {
          node: node,
          onDestroy: () => ReactiveEvent.off('AfterArrayChanges', reactiveArrayEvent.callback)
        }
      )
    );

    (exec = () => {
      // updating the nodeValue
      nodeValue = trim(node.nodeValue ?? '');

      const filters = nodeValue.split('|').map(item => trim(item));
      let forExpression = filters[0].replace('(', '').replace(')', '');
      filters.shift();

      let forSeparator = ' of ';
      let forParts = forExpression.split(forSeparator);
      if (forParts.length === 0) {
        forSeparator = ' in ';
        forParts = forExpression.split(forSeparator);
      }

      let leftHand = forParts[0];
      let rightHand = forParts[1];
      let leftHandParts = leftHand.split(',').map(x => trim(x));
      // Preparing variables declaration
      // Eg.: let item; | let item, index=0;
      let leftHandDeclaration = 'let ' + leftHand + (leftHand.includes(',') ? '=0' : '') + ';';

      const hasIndex = leftHandParts.length > 1;
      forExpression = [(hasIndex ? leftHandParts[0] : leftHand), '_flt(' + rightHand + ')']
        .join(forSeparator);

      // Cleaning the
      forEach(listedItems, item => {
        if (!item.parentElement) return;
        container.removeChild(item);
      });
      listedItems = [];

      this.evaluator.exec({
        data: data,
        isReturn: false,
        expression: leftHandDeclaration +
          'for(' + forExpression + '){ ' + ' _each(' + leftHand + (hasIndex ? '++' : '') + ')}',
        aditional: {
          _each: (item: any, index: any) => {
            let forData: any = Extend.obj(data);
            forData[leftHandParts[0]] = item;
            if (hasIndex) forData[leftHandParts[1]] = index;

            let clonedItem = container.insertBefore(forItem.cloneNode(true) as Element, comment);
            this.compiler.compile({
              el: clonedItem,
              data: forData
            });

            listedItems.push(clonedItem);
          },
          _flt: (list: any[]) => {
            let listCopy = Extend.array(list);

            const findFilter = (fName: string) =>
              filters.find(item => item.substr(0, fName.length) === fName);

            // applying filter:
            let filterConfig = findFilter('filter');
            if (filterConfig) {
              const filterConfigParts = filterConfig.split(':').map(item => trim(item));

              if (filterConfigParts.length == 1) {
                Logger.error("Invalid “" + nodeName + "” filter expression “" + nodeValue +
                  "”, at least a filter-value and filter-keys, or a filter-function must be provided");
              } else {
                listCopy = filter(listCopy, filterConfigParts);
              }
            }

            // applying order:
            let orderConfig = findFilter('order');
            if (orderConfig) {
              const orderConfigParts = orderConfig.split(':').map(item => trim(item));
              if (orderConfigParts.length == 1) {
                Logger.error("Invalid “" + nodeName + "” order  expression “" + nodeValue +
                  "”, at least the order type must be provided");
              } else {
                listCopy = order(listCopy, orderConfigParts[1], orderConfigParts[2]);
              }
            }

            return listCopy;
          }
        }
      });
    })();

    ReactiveEvent.off('AfterGet', reactivePropertyEvent.callback);
  }

  def(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node);
    const nodeValue = trim(node.nodeValue ?? '');
    const hasDelimiter = this.delimiter.run(nodeValue).length !== 0;

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (hasDelimiter)
      return Logger.error(this.errorMsgNodeValue(node));

    let inputData = this.evaluator.exec({
      data: data,
      expression: nodeValue
    });

    if (!isObject(inputData))
      return Logger.error("Expected a valid Object Literal expression in “" + node.nodeName + "” and got “" + nodeValue + "”.");

    this.bouer.setData(inputData, data);
    ownerElement.removeAttribute(node.nodeName);
  }

  content(node: Node) {
    const ownerElement = this.toOwnerNode(node);
    const nodeValue = trim(node.nodeValue ?? '');

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    ownerElement.innerText = nodeValue;
    ownerElement.removeAttribute(node.nodeName);
  }

  bind(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node);
    const nodeValue = trim(node.nodeValue ?? '');
    const hasDelimiter = this.delimiter.run(nodeValue).length !== 0;

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (hasDelimiter)
      return Logger.error(this.errorMsgNodeValue(node));

    this.binder.create({
      node: connectNode(node, ownerElement),
      fields: [{ field: nodeValue, expression: nodeValue }],
      data: data
    });

    ownerElement.removeAttribute(node.nodeName);
  }

  property(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node) as Element;
    const nodeValue = trim(node.nodeValue ?? '');
    const hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
    let exec = (obj: object) => { };

    const errorInvalidValue = (node: Node) =>
      "Invalid value, expected an Object/Object Literal in “" + node.nodeName
      + "” and got “" + (node.nodeValue ?? '') + "”.";

    if (nodeValue === '')
      return Logger.error(errorInvalidValue(node));

    if (hasDelimiter) return;

    let inputData = this.evaluator.exec({
      data: data,
      expression: nodeValue
    });

    if (!isObject(inputData))
      return Logger.error(errorInvalidValue(node));

    this.binder.create({
      data: data,
      node: connectNode(node, ownerElement),
      eReplace: false,
      fields: [{ expression: nodeValue, field: nodeValue }],
      onChange: () => exec(this.evaluator.exec({
        data: data,
        expression: nodeValue
      }))
    });

    ownerElement.removeAttribute(node.nodeName);

    (exec = (obj: any) => {
      const attrNameToSet = node.nodeName.substr(Constants.property.length);
      let attr = (ownerElement.attributes as any)[attrNameToSet] as Attr;
      if (!attr) {
        (ownerElement.setAttribute(attrNameToSet, ''));
        attr = (ownerElement.attributes as any)[attrNameToSet] as Attr;
      }

      forEach(Object.keys(obj), key => {
        /* if has a falsy value remove the key */
        if (!obj[key]) return attr.value = trim(attr.value.replace(key, ''))
        attr.value = (attr.value.includes(key) ? attr.value : trim(attr.value + ' ' + key))
      });

      if (attr.value === '')
        return ownerElement.removeAttribute(attrNameToSet);
    })(inputData);
  }

  data(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node);
    const nodeValue = trim(node.nodeValue ?? '');
    const hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
    let inputData: dynamic = {};

    if (hasDelimiter)
      return Logger.error("The “data” attribute cannot contain delimiter.");

    ownerElement.removeAttribute(node.nodeName);

    const mData = Extend.obj(data, { $this: data });
    const reactiveEvent = ReactiveEvent.on('AfterGet', reactive => {
      inputData[reactive.propertyName] = undefined;
      defineProperty(inputData, reactive.propertyName, reactive);
    });

    // If data value is empty gets the main scope value
    if (nodeValue === '')
      inputData = Extend.obj(this.bouer.data);
    else {
      // Other wise, compiles the object provided
      const mInputData = this.evaluator.exec({ data: mData, expression: nodeValue });

      if (!isObject(mInputData))
        return Logger.error("Expected a valid Object Literal expression in “" + node.nodeName +
          "” and got “" + nodeValue + "”.");

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
      DataStore.set('data', dataKey, inputData);
    }

    Reactive.transform(inputData);
    return this.compiler.compile({
      data: inputData,
      el: ownerElement
    });
  }

  href(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node);
    const nodeName = node.nodeName;
    let nodeValue = trim(node.nodeValue ?? '');

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    ownerElement.removeAttribute(node.nodeName);

    const usehash = (this.bouer.config || {}).usehash ?? true;
    const routeToSet = urlCombine((usehash ? '#' : ''), nodeValue);

    ownerElement.setAttribute('href', routeToSet);
    const href = ownerElement.attributes['href'] as Attr;
    const delimiters = this.delimiter.run(nodeValue);

    if (delimiters.length !== 0)
      this.binder.create({
        data: data,
        node: connectNode(href, ownerElement),
        fields: delimiters
      });

    (ownerElement as HTMLAnchorElement)
      .addEventListener('click', event => {
        event.preventDefault();

        IoC.Resolve<Routing>('Routing')!
          .navigate(href.value);
      }, false);

    (href as any).markable = nodeName[0] === ':';
  }

  entry(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node) as Element;
    const nodeValue = trim(node.nodeValue ?? '');
    const hasDelimiter = this.delimiter.run(nodeValue).length !== 0;

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (hasDelimiter)
      return Logger.error(this.errorMsgNodeValue(node));

    ownerElement.removeAttribute(node.nodeName);
    IoC.Resolve<ComponentHandler>('ComponentHandler')!
      .prepare([
        {
          name: nodeValue,
          template: ownerElement.outerHTML,
          data: data
        }
      ]);
  }

  req(node: Node, data: object) {
    Logger.info(node, data);
  }

  skeleton(node: Node, data: object) {
    Logger.warn('e-skeleton not implemented yet.');
  }

  wait(node: Node, data: object) {

    Logger.warn('wait-data not implemented yet.');

  }
}
