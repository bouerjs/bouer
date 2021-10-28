import { Constants } from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import IoC from "../../shared/helpers/IoC";
import {
  connectNode,
  createAnyEl,
  defineProperty,
  findAttribute,
  forEach,
  http,
  isFunction,
  isNull,
  isObject,
  toStr,
  transferProperty,
  trim,
  urlCombine
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import dynamic from "../../types/dynamic";
import Binder from "../binder/Binder";
import Watch from "../binder/Watch";
import CommentHandler from "../CommentHandler";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import Evaluator from "../Evaluator";
import EventHandler from "../event/EventHandler";
import ReactiveEvent from "../event/ReactiveEvent";
import Bouer from "../instance/Bouer";
import Interceptor from "../interceptor/Interceptor";
import Reactive from "../reactive/Reactive";
import Routing from "../routing/Routing";
import DataStore from "../store/DataStore";
import Compiler from "./Compiler";

export default class Directive {
  private bouer: Bouer;
  private binder: Binder;
  private evaluator: Evaluator;
  private delimiter: DelimiterHandler;
  private comment: CommentHandler;
  private compiler: Compiler;
  private eventHandler: EventHandler;

  constructor(bouer: Bouer, compiler: Compiler) {
    this.bouer = bouer;
    this.compiler = compiler;

    this.evaluator = IoC.Resolve('Evaluator')!;
    this.delimiter = IoC.Resolve('DelimiterHandler')!;
    this.comment = IoC.Resolve('CommentHandler')!;
    this.binder = IoC.Resolve('Binder')!;
    this.eventHandler = IoC.Resolve('EventHandler')!;
  }

  // Helper functions
  toOwnerNode(node: Node) {
    return (node as any).ownerElement || node.parentNode;
  }

  errorMsgEmptyNode = (node: Node) => new SyntaxError("Expected an expression in “" + node.nodeName +
    "” and got an <empty string>.");
  errorMsgNodeValue = (node: Node) => new SyntaxError("Expected an expression in “" + node.nodeName +
    "” and got “" + (node.nodeValue ?? '') + "”.");

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

      ReactiveEvent.once('AfterGet', event => {
        event.onemit = reactive => {
          // Avoiding multiple binding in the same property
          if (reactives.findIndex(item => item.reactive.propertyName == reactive.propertyName) !== -1)
            return;
          reactives.push({ attr: attr, reactive: reactive });
        }

        this.evaluator.exec({
          data: data,
          expression: attr.value,
        });
      });

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
      return Logger.error(new SyntaxError("Expected a valid “for” expression in “" + nodeName + "” and got “" + nodeValue + "”."
        + "\nValid: e-for=\"item of items\"."));

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
        Logger.error(new SyntaxError("Invalid filter-value in “" + nodeName + "” with “" + nodeValue + "” expression."));
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
          Logger.error(new SyntaxError("Invalid filter-keys in “" + nodeName + "” with “" + nodeValue + "” expression, " +
            "at least one filter-key to be provided."));
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
      let forExpression = filters[0].replace(/\(|\)/g, '');
      filters.shift();

      let forSeparator = ' of ';
      let forParts = forExpression.split(forSeparator);
      if (!(forParts.length > 1))
        forParts = forExpression.split(forSeparator = ' in ');

      let leftHand = forParts[0];
      let rightHand = forParts[1];
      let leftHandParts = leftHand.split(',').map(x => trim(x));
      // Preparing variables declaration
      // Example: let item; | let item, index=0;
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
                Logger.error(new SyntaxError("Invalid “" + nodeName + "” filter expression “" + nodeValue +
                  "”, at least a filter-value and filter-keys, or a filter-function must be provided"));
              } else {
                listCopy = filter(listCopy, filterConfigParts);
              }
            }

            // applying order:
            let orderConfig = findFilter('order');
            if (orderConfig) {
              const orderConfigParts = orderConfig.split(':').map(item => trim(item));
              if (orderConfigParts.length == 1) {
                Logger.error(new SyntaxError("Invalid “" + nodeName + "” order  expression “" + nodeValue +
                  "”, at least the order type must be provided"));
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
      return Logger.error(new TypeError("Expected a valid Object Literal expression in “"
        + node.nodeName + "” and got “" + nodeValue + "”."));

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
      new TypeError("Invalid value, expected an Object/Object Literal in “" + node.nodeName
        + "” and got “" + (node.nodeValue ?? '') + "”.");

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
      return Logger.error(new SyntaxError("The “data” attribute cannot contain delimiter."));

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
        return Logger.error(new TypeError("Expected a valid Object Literal expression in “" + node.nodeName +
          "” and got “" + nodeValue + "”."));

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

  put(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node) as Element;
    let nodeValue = trim(node.nodeValue ?? '');
    let exec = () => { };

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node),
        "Direct <empty string> injection value is allowed, only with a delimiter.");

    const delimiters = this.delimiter.run(nodeValue);
    ownerElement.removeAttribute(node.nodeName);

    if (delimiters.length !== 0)
      this.binder.create({
        data: data,
        node: connectNode(node, ownerElement),
        fields: delimiters,
        onChange: () => exec()
      });

    (exec = () => {
      ownerElement.innerHTML = '';
      nodeValue = trim(node.nodeValue ?? '');
      if (nodeValue === '') return;

      const componentElement = createAnyEl(nodeValue)
        .appendTo(ownerElement)
        .build();

      IoC.Resolve<ComponentHandler>('ComponentHandler')!
        .order(componentElement, data);
    })();
  }

  req(node: Node, data: object) {
    const ownerElement = this.toOwnerNode(node) as Element;
    const nodeName = node.nodeName;
    const localDataStore: dynamic = {};
    let nodeValue = trim(node.nodeValue ?? '');
    let exec = () => { };

    if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
      return Logger.error(new SyntaxError("Expected a valid “for” expression in “" + nodeName
        + "” and got “" + nodeValue + "”." + "\nValid: e-req=\"item of [url]\"."));

    // If it's list request type, connect ownerNode
    if (nodeValue.includes(' of '))
      connectNode(ownerElement, ownerElement.parentNode!);

    connectNode(node, ownerElement);
    const delimiters = this.delimiter.run(nodeValue);

    if (delimiters.length !== 0)
      this.binder.create({
        data: data,
        node: node,
        fields: delimiters,
        eReplace: false,
        onChange: () => exec()
      });

    ownerElement.removeAttribute(node.nodeName);

    const subcribeEvent = (eventName: string) => {
      const attr = (ownerElement.attributes as any)[Constants.on + eventName];
      if (attr) this.eventHandler.handle(attr, data);

      return {
        emit: (args: any[]) => {
          this.eventHandler.emit({
            attachedNode: ownerElement,
            eventName: eventName,
            arguments: args,
          })
        }
      };
    }

    const interceptor = IoC.Resolve<Interceptor>('Interceptor')!;
    const requestEvent = subcribeEvent(Constants.events.request);
    const responseEvent = subcribeEvent(Constants.events.response);
    const failEvent = subcribeEvent(Constants.events.fail);
    const doneEvent = subcribeEvent(Constants.events.done);

    (exec = () => {
      nodeValue = trim(node.nodeValue || "");
      const filters = nodeValue.split('|').map(item => trim(item));
      let reqExpression = filters[0].replace(/\(|\)/g, '');
      filters.shift();

      let reqSeparator = ' of ';
      let reqParts = reqExpression.split(reqSeparator);
      if (!(reqParts.length > 1))
        reqParts = reqExpression.split(reqSeparator = ' as ');

      const mReqSeparator: any = trim(reqSeparator);
      let dataKey = node.nodeName.split(':')[1];
      dataKey = dataKey ? dataKey.replace(/\[|\]/g, '') : '';

      requestEvent.emit([]);

      interceptor.run('req', {
        http: http,
        type: mReqSeparator,
        path: reqParts[1].replace(/\[|\]/g, ''),
        success: (response: { data: any, [key: string]: any }) => {
          if (!response)
            return Logger.error(new TypeError("the “success” parameter must be an object containing " +
              "“data” property. Example: { data: {} | [] }"));

          if (!("data" in response))
            return Logger.error(new SyntaxError("the “success” parameter must be contain the “data” " +
              "property. Example: { data: {} | [] }"));

          if ((mReqSeparator === 'of' && !Array.isArray(response.data)))
            return Logger.error(new TypeError("Using e-ref=\"... “of” ...\" the response must be a " +
              "list of items, and got “" + typeof response.data + "”."));

          if ((mReqSeparator === 'as' && !(typeof response.data === 'object')))
            return Logger.error(new TypeError("Using e-ref=\"... “as” ...\" the response must be a list " +
              "of items, and got “" + typeof response.data + "”."));

          Reactive.transform(response);

          responseEvent.emit([response]);

          // Handle Content Insert/Update
          if (!('data' in localDataStore)) {
            // Store the data
            localDataStore.data = undefined;
            transferProperty(localDataStore, response, 'data');
          } else {
            // Update de local data
            return localDataStore.data = response.data;
          }

          if (dataKey) DataStore.set('req', dataKey, response);

          switch (mReqSeparator) {
            case 'as':
              // Removing the: “(...)”  “,”  and getting only the variable
              const variable = trim(reqParts[0].split(',')[0].replace(/\(|\)/g, ''));
              return this.compiler.compile({
                el: ownerElement,
                data: Extend.obj({ [variable]: response.data }, data),
                onDone: (_, inData) => {
                  subcribeEvent(Constants.events.compile)
                    .emit([inData]);
                }
              });
            case 'of':
              const forDirectiveContent = nodeValue.replace(reqParts[1], '_response_');
              ownerElement.setAttribute(Constants.for, forDirectiveContent);

              return this.compiler.compile({
                el: ownerElement,
                data: Extend.obj({ _response_: response.data }, data),
                onDone: (_, inData) => {
                  subcribeEvent(Constants.events.compile)
                    .emit([inData]);
                }
              });
          }
        },
        fail: (error) => failEvent.emit([error]),
        done: () => doneEvent.emit([])
      });
    })();
  }

  wait(node: Node) {
    const ownerElement = this.toOwnerNode(node);
    const nodeValue = trim(node.nodeValue ?? '');
    const hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
    const dataStore = IoC.Resolve<DataStore>('DataStore')!;

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (hasDelimiter)
      return Logger.error(this.errorMsgNodeValue(node));

    ownerElement.removeAttribute(node.nodeName);
    const mWait = dataStore.wait[nodeValue];

    if (mWait) {
      mWait.nodes.push(ownerElement);
      // No data exposed yet
      if (!mWait.data) return;

      // Compile all the waiting nodes
      return forEach(mWait.nodes, nodeWaiting => {
        this.compiler.compile({
          el: nodeWaiting,
          data: Reactive.transform(mWait.data)
        });
      });
    }

    return dataStore.wait[nodeValue] = { nodes: [ownerElement] };
  }

  skeleton(node: Node, data: object) {
    Logger.warn('e-skeleton not implemented yet.');
  }
}
