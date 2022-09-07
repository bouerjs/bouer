import IBinderConfig from '../../definitions/interfaces/IBinderConfig';
import RenderContext from '../../definitions/types/RenderContext';
import CustomDirective from '../../definitions/types/CustomDirective';
import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';
import Constants from '../../shared/helpers/Constants';
import Extend from '../../shared/helpers/Extend';
import ServiceProvider from '../../shared/helpers/ServiceProvider';
import {
  code,
  $CreateAnyEl,
  findAttribute,
  forEach,
  isNull,
  isObject,
  $RemoveEl,
  toLower,
  toStr,
  trim,
  urlCombine,
  $CreateComment,
  ifNullReturn
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Binder from '../binder/Binder';
import ComponentHandler from '../component/ComponentHandler';
import DelimiterHandler from '../DelimiterHandler';
import Evaluator from '../Evaluator';
import EventHandler from '../event/EventHandler';
import ReactiveEvent from '../event/ReactiveEvent';
import Middleware from '../middleware/Middleware';
import Reactive from '../reactive/Reactive';
import Routing from '../routing/Routing';
import DataStore from '../store/DataStore';
import Compiler from './Compiler';
import Base from '../Base';
import Prop from '../../shared/helpers/Prop';
import MiddlewareResult from '../middleware/MiddlewareResult';

export default class Directive extends Base {
  bouer: Bouer;
  binder: Binder;
  evaluator: Evaluator;
  compiler: Compiler;
  eventHandler: EventHandler;
  delimiter: DelimiterHandler;
  $custom: CustomDirective = {};
  context: RenderContext;
  serviceProvider: ServiceProvider;

  constructor(
    customDirective: CustomDirective,
    compiler: Compiler,
    compilerContext: RenderContext
  ) {
    super();

    this.compiler = compiler;
    this.context = compilerContext;
    this.bouer = compiler.bouer;
    this.$custom = customDirective;

    this.serviceProvider = new ServiceProvider(this.bouer);

    this.evaluator = this.serviceProvider.get('Evaluator')!;
    this.delimiter = this.serviceProvider.get('DelimiterHandler')!;
    this.binder = this.serviceProvider.get('Binder')!;
    this.eventHandler = this.serviceProvider.get('EventHandler')!;
  }

  // Helper functions
  toOwnerNode(node: Node) {
    return (node as any).ownerElement || node.parentNode;
  }

  errorMsgEmptyNode = (node: Node) => ('Expected an expression in “' + node.nodeName +
    '” and got an <empty string>.');
  errorMsgNodeValue = (node: Node) => ('Expected an expression in “' + node.nodeName +
    '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');

  // Directives
  skip(node: Element) {
    node.nodeValue = 'true';
  }

  if(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node) as Element;
    const container = ownerNode.parentElement;

    if (!container) return;

    const conditions: { attr: Attr, node: Element }[] = [];
    const comment = $CreateComment();
    const nodeName = node.nodeName;
    let execute = () => { };

    if (nodeName === Constants.elseif || nodeName === Constants.else) return;

    let currentEl: Element | null = ownerNode;
    const reactives: { attr: Attr, reactive: Reactive<any, any> }[] = [];

    do { // Searching for 'e-else-if' and 'e-else' to complete the conditional chain
      if (currentEl == null) break;

      const attr = findAttribute(currentEl, ['e-if', 'e-else-if', 'e-else']);
      if (!attr) break;

      const firstCondition = conditions[0]; // if it already got an 'if',
      if (attr.name === 'e-if' && firstCondition && (attr.name === firstCondition.attr.name))
        break;

      if ((attr.nodeName !== 'e-else') && (trim(ifNullReturn(attr.nodeValue, '')) === ''))
        return Logger.error(this.errorMsgEmptyNode(attr));

      if (this.delimiter.run(ifNullReturn(attr.nodeValue, '')).length !== 0)
        return Logger.error(this.errorMsgNodeValue(attr));

      conditions.push({ attr: attr, node: currentEl });

      if (attr.nodeName === ('e-else')) {
        currentEl.removeAttribute(attr.nodeName);
        break;
      }

      // Listening to the property get only if the callback function is defined
      ReactiveEvent.once('AfterGet', event => {
        event.onemit = reactive => {
          // Avoiding multiple binding in the same property
          if (reactives.findIndex(item => item.reactive.propName == reactive.propName) !== -1)
            return;
          reactives.push({ attr: attr, reactive: reactive });
        };

        this.evaluator.exec({
          data: data,
          code: attr.value,
          context: this.context,
        });
      });

      currentEl.removeAttribute(attr.nodeName);
    } while (currentEl = currentEl.nextElementSibling);

    const isChainConnected = () => !isNull(Extend.array(
      conditions.map(x => x.node),
      comment as any
    ).find(el => el.isConnected));

    forEach(reactives, item => {
      this.binder.binds.push({
        // Binder is connected if at least one of the chain and the comment is still connected
        isConnected: isChainConnected,
        watch: item.reactive.onChange(() => execute(), item.attr)
      });
    });

    (execute = () => {
      forEach(conditions, chainItem => {
        if (!chainItem.node.parentElement) return;

        if (comment.isConnected)
          container.removeChild(chainItem.node);
        else
          container.replaceChild(comment, chainItem.node);
      });

      const conditionalExpression = conditions.map((item, index) => {
        const $value = item.attr.value;
        switch (item.attr.name) {
          case Constants.if: return 'if(' + $value + '){ __cb(' + index + '); }';
          case Constants.elseif: return 'else if(' + $value + '){ __cb(' + index + '); }';
          case Constants.else: return 'else{ __cb(' + index + '); }';
        }
      }).join(' ');

      this.evaluator.exec({
        data: data,
        isReturn: false,
        code: conditionalExpression,
        context: this.context,
        aditional: {
          __cb: (chainIndex: number) => {
            const { node: element } = conditions[chainIndex];
            container.replaceChild(element, comment);
            this.compiler.compile({
              el: element,
              data: data,
              context: this.context,
              isConnected: isChainConnected
            });
          }
        }
      });
    })();
  }

  show(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node);
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    let execute = (el: HTMLElement) => { };

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));

    const bindResult = this.binder.create({
      data: data,
      node: node,
      isConnected: () => ownerNode.isConnected,
      fields: [{ expression: nodeValue, field: nodeValue }],
      context: this.context,
      onUpdate: () => execute(ownerNode)
    });

    (execute = (element: HTMLElement) => {
      element.style.display = this.evaluator.exec({
        data: data,
        code: nodeValue,
        context: this.context,
      }) ? '' : 'none';
    })(ownerNode);

    ownerNode.removeAttribute(bindResult.node.nodeName);
  }

  for(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node) as Element;
    const container = ownerNode.parentElement;

    if (!container) return;

    type ListedItemsHandler = {
      el: Element,
      data: dynamic
    };
    type ExpObject = {
      type: string,
      filters: string[],
      isForOf: boolean,
      leftHand: string,
      rightHand: string,
      sourceValue: any,
      leftHandParts: string[],
      iterableExpression: string
    };

    const comment = $CreateComment();
    const nodeName = node.nodeName;
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    let listedItemsHandler: ListedItemsHandler[] = [];
    let hasWhereFilter = false;
    let hasOrderFilter = false;
    let execute = () => { };

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
      return Logger.error('Expected a valid “for” expression in “' + nodeName + '” and got “' + nodeValue + '”.'
        + '\nValid: e-for="item of items".');

    // Binding the e-for if got delimiters
    const delimiters = this.delimiter.run(nodeValue);
    if (delimiters.length !== 0)
      this.binder.create({
        node: node,
        data: data,
        fields: delimiters,
        isReplaceProperty: true,
        context: this.context,
        isConnected: () => comment.isConnected,
        onUpdate: () => execute()
      });

    ownerNode.removeAttribute(nodeName);

    // Cloning the element
    const forItem = ownerNode.cloneNode(true);
    // Replacing the comment reference
    container.replaceChild(comment, ownerNode);

    // Filters the list of items
    const $Where = (list: any[], filterConfigParts: string[]) => {
      hasWhereFilter = true;
      const wKeys = filterConfigParts[2];
      let wValue = filterConfigParts[1];

      if (isNull(wValue) || wValue === '') {
        Logger.error('Invalid where-value in “' + nodeName + '” with “' + nodeValue + '” expression.');
        return list;
      }

      wValue = this.evaluator.exec({ data: data, code: wValue, context: this.context });

      // where:filterFunction
      if (typeof wValue === 'function') {
        list = (wValue as Function)(list);
      } else {
        // where:search:name?
        if ((isNull(wKeys) || wKeys === '') && isObject(list[0] || '')) {
          Logger.error(('Invalid where-keys in “' + nodeName + '” with “' + nodeValue + '” expression, ' +
            'at least one where-key to be provided when using list of object.'));
          return list;
        }

        const newListCopy: any[] = [];
        forEach(list, item => {
          let isValid = false;
          if (isNull(wKeys)) {
            isValid = toStr(item).includes(wValue);
          } else {
            for (const prop of wKeys.split(',').map(m => trim(m))) {
              const propValue = this.evaluator.exec({
                data: item,
                code: prop,
                context: this.context
              });

              if (toStr(propValue).includes(wValue)) {
                isValid = true;
                break;
              }
            }
          }
          if (isValid) newListCopy.push(item);
        });
        list = newListCopy;
      }

      return list;
    };

    // Order the list of items
    const $Order = (list: any[], type: string, prop: string | null) => {
      hasOrderFilter = true;
      if (!type) type = 'asc';
      return list.sort((a, b) => {
        const comparison = (asc: boolean | null, desc: boolean | null) => {
          if (isNull(asc) || isNull(desc)) return 0;
          switch (toLower(type)) {
            case 'asc': return asc ? 1 : -1;
            case 'desc': return desc ? -1 : 1;
            default: Logger.log('The “' + type + '” order type is invalid: “' + nodeValue +
              '”. Available types are: “asc”  for order ascendent and “desc” for order descendent.');
              return 0;
          }
        };

        if (!prop) return comparison(a > b, b < a);
        return comparison(a[prop] > b[prop], b[prop] < a[prop]);
      });
    };

    // Prepare the item before to insert
    const $PrepareForItem = (item: any, index: number) => {
      expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));

      const leftHandParts = expObj.leftHandParts;
      const sourceValue = expObj.sourceValue;
      const isForOf = expObj.isForOf;

      const forData: dynamic = Extend.obj(data);
      const itemKey = leftHandParts[0];
      const indexOrValue = leftHandParts[1] || '_index_or_value';
      const mIndex = leftHandParts[2] || '_for_in_index';

      forData[itemKey] = item;
      forData[indexOrValue] = isForOf ? index : sourceValue[item];
      forData[mIndex] = index;

      return Reactive.transform({
        data: forData,
        context: this.context
      });
    };

    // Inserts an element in the DOM
    const $InsertForItem = (options: {
      item: any,
      index: number,
      deleteCount?: number,
      reference?: Element | Comment
    }) => {
      // Preparing the data to be inserted
      const forData = $PrepareForItem(options.item, options.index);

      // Inserting in the DOM
      const forClonedItem = container.insertBefore(
        forItem.cloneNode(true) as Element,
        options.reference || comment
      );

      // Compiling the inserted data
      this.compiler.compile({
        el: forClonedItem,
        data: forData,
        context: this.context,
        onDone: el => this.eventHandler.emit({
          eventName: Constants.builtInEvents.add,
          attachedNode: el,
          once: true
        })
      });

      // Updating the handler
      listedItemsHandler.splice(options.index, 0, {
        el: forClonedItem,
        data: forData
      });
      return forClonedItem;
    };

    // Builds the expression to an object
    const $ExpressionBuilder = (expression: string): ExpObject => {
      const filters = expression.split('|').map(item => trim(item));
      const forExpression = filters[0].replace(/\(|\)/g, '');
      filters.shift();

      // for types:
      // e-for="item of items",  e-for="(item, index) of items"
      // e-for="key in object", e-for="(key, value) in object"
      // e-for="(key, value, index) in object"

      let forSeparator = ' of ';
      let forParts = forExpression.split(forSeparator);
      if (!(forParts.length > 1))
        forParts = forExpression.split(forSeparator = ' in ');

      const leftHand = forParts[0];
      const rightHand = forParts[1];
      const leftHandParts = leftHand.split(',').map(x => trim(x));

      const isForOf = trim(forSeparator) === 'of';
      const iterable = isForOf ? rightHand : 'Object.keys(' + rightHand + ')';
      const sourceValue = this.evaluator.exec({
        data: data,
        code: rightHand,
        context: this.context
      });

      return {
        filters: filters,
        type: forSeparator,
        leftHand: leftHand,
        rightHand: rightHand,
        sourceValue: sourceValue,
        leftHandParts: leftHandParts,
        iterableExpression: iterable,
        isForOf: trim(forSeparator) === 'of',
      };
    };

    // Handler the UI when the Array changes
    const $OnArrayChanges = (detail?: dynamic) => {
      if (hasWhereFilter || hasOrderFilter)
        return execute(); // Reorganize re-insert all the items

      detail = detail || {};
      const method = detail.method;
      const args = detail.args;
      const mListedItems = (listedItemsHandler as any);

      const reOrganizeIndexes = () => {
        // In case of unshift re-organize the indexes
        // Was wrapped into a promise in case of large amount of data
        return Promise.resolve((array: ListedItemsHandler[]) => {
          expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
          const leftHandParts = expObj.leftHandParts;
          const indexOrValue = leftHandParts[1] || '_index_or_value';

          if (indexOrValue === '_index_or_value')
            return;

          forEach(array, (item, index) => {
            item.data[indexOrValue] = index;
          });
        }).then(mCaller => mCaller(listedItemsHandler));
      };

      switch (method) {
        case 'pop': case 'shift': { // First or Last item removal handler
          const item = mListedItems[method]();
          if (!item) return;
          $RemoveEl(item.el);

          if (method === 'pop') return;
          return reOrganizeIndexes();
        }
        case 'splice': { // Indexed removal handler
          let index = args[0] as number;
          const deleteCount = args[1] as number;

          const removedItems = mListedItems.splice(index, deleteCount);
          forEach(removedItems, (item: any) => $RemoveEl(item.el));

          expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));

          const leftHandParts = expObj.leftHandParts;
          const indexOrValue = leftHandParts[1] || '_index_or_value';
          const insertArgs = [].slice.call(args, 2);

          // Adding the items to the dom
          forEach(insertArgs, item => {
            index++;
            $InsertForItem({
              // Getting the next reference
              reference: listedItemsHandler[index].el || comment,
              index: index,
              item,
            });
          });

          if (indexOrValue === '_index_or_value')
            return;

          // Fixing the index value
          for (; index < listedItemsHandler.length; index++) {
            const item = listedItemsHandler[index].data;
            if (typeof item[indexOrValue] === 'number')
              item[indexOrValue] = index;
          }
          return;
        }
        case 'push': case 'unshift': { // Addition handler
          // Gets the last item as default
          const isUnshift = method == 'unshift';

          let indexRef = isUnshift ? 0 : mListedItems.length;
          let reference = isUnshift ? listedItemsHandler[0].el : comment;

          // Adding the items to the dom
          forEach([].slice.call(args), item => {
            const ref = $InsertForItem({
              index: indexRef++,
              reference,
              item,
            });
            if (isUnshift) reference = ref;
          });

          if (isUnshift)
            reOrganizeIndexes();
          return;
        }
        default: return execute();
      }
    };

    const applyWhere = (listCopy: any[], filterConfig: string) => {
      const whereConfigParts = filterConfig.split(':').map(item => trim(item));

      if (whereConfigParts.length == 1) {
        Logger.error(('Invalid “' + nodeName + '” where expression “' + nodeValue +
          '”, at least a where-value and where-keys, or a filter-function must be provided'));
      } else {
        return $Where(listCopy, whereConfigParts);
      }
    };

    const reactivePropertyEvent = ReactiveEvent.on('AfterGet',
      reactive => {
        this.binder.binds.push({
          isConnected: () => comment.isConnected,
          watch: reactive.onChange((_n, _o, detail) =>
            $OnArrayChanges(detail), node)
        });
      });
    let expObj: ExpObject | null = $ExpressionBuilder(nodeValue);

    const filters = expObj!.filters;
    const findFilter = (fName: string) => filters.filter(item => item.substring(0, fName.length) === fName);
    const whereConfigs = findFilter('where');

    for (const whereConfig of whereConfigs)
      applyWhere(expObj!.sourceValue, whereConfig);

    reactivePropertyEvent.off();

    (execute = () => {
      expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
      const iterable = expObj.iterableExpression;
      const orderConfigs = findFilter('order');

      // Cleaning the existing items
      forEach(listedItemsHandler, item => {
        if (!item.el.parentElement) return;
        container.removeChild(item.el);
      });
      listedItemsHandler = [];

      this.evaluator.exec({
        data: data,
        isReturn: false,
        context: this.context,
        code: 'var __e = __each, __fl = __filters, __f = __for; ' +
          '__f(__fl(' + iterable + '), function($$itm, $$idx) { __e($$itm, $$idx); })',
        aditional: {
          __for: forEach,
          __each: (item: any, index: number) => $InsertForItem({ index, item }),
          __filters: (list: any[]) => {
            let listCopy = Extend.array(list);
            // applying where:
            for (const filterConfig of whereConfigs) {
              listCopy = applyWhere(listCopy, filterConfig)!;
            }

            // applying order:
            const applyOrder = (orderConfig: string) => {
              const orderConfigParts = orderConfig.split(':').map(item => trim(item));
              if (orderConfigParts.length == 1) {
                Logger.error(('Invalid “' + nodeName + '” order  expression “' + nodeValue +
                  '”, at least the order type must be provided'));
              } else {
                listCopy = $Order(listCopy, orderConfigParts[1], orderConfigParts[2]);
              }
            };

            for (const orderConfig of orderConfigs) {
              applyOrder(orderConfig);
            }

            return listCopy;
          }
        }
      });

      expObj = null;
    })();
  }

  def(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node);
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));

    const inputData: dynamic = {};
    const reactiveEvent = ReactiveEvent.on('AfterGet', reactive => {
      if (!(reactive.propName in inputData))
        inputData[reactive.propName] = undefined;
      Prop.set(inputData, reactive.propName, reactive);
    });

    const mInputData = this.evaluator.exec({
      data: data,
      code: nodeValue,
      context: this.context
    });

    if (!isObject(mInputData))
      return Logger.error(('Expected a valid Object Literal expression in “' + node.nodeName +
        '” and got “' + nodeValue + '”.'));

    // Adding all non-existing properties
    forEach(Object.keys(mInputData), key => {
      if (!(key in inputData))
        inputData[key] = mInputData[key];
    });

    ReactiveEvent.off('AfterGet', reactiveEvent.callback);

    this.bouer.set(inputData, data);
    ownerNode.removeAttribute(node.nodeName);
  }

  text(node: Node) {
    const ownerNode = this.toOwnerNode(node);
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    ownerNode.textContent = nodeValue;
    ownerNode.removeAttribute(node.nodeName);
  }

  bind(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node);
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));

    this.binder.create({
      node: node,
      isConnected: () => ownerNode.isConnected,
      fields: [{ field: nodeValue, expression: nodeValue }],
      context: this.context,
      data: data
    });

    ownerNode.removeAttribute(node.nodeName);
  }

  property(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node) as Element;
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    let execute = (obj: object) => { };

    const errorInvalidValue = (node: Node) => ('Invalid value, expected an Object/Object Literal in “'
      + node.nodeName + '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');

    if (nodeValue === '')
      return Logger.error(errorInvalidValue(node));

    if (this.delimiter.run(nodeValue).length !== 0) return;

    const inputData = this.evaluator.exec({
      data: data,
      code: nodeValue,
      context: this.context
    });

    if (!isObject(inputData))
      return Logger.error(errorInvalidValue(node));

    this.binder.create({
      data: data,
      node: node,
      isReplaceProperty: false,
      context: this.context,
      fields: [{ expression: nodeValue, field: nodeValue }],
      isConnected: () => ownerNode.isConnected,
      onUpdate: () => execute(this.evaluator.exec({
        data: data,
        code: nodeValue,
        context: this.context
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

  data(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node);
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error('The “data” attribute cannot contain delimiter.');

    ownerNode.removeAttribute(node.nodeName);

    let inputData: dynamic = {};
    const mData = Extend.obj(data, { $data: data });
    const reactiveEvent = ReactiveEvent.on('AfterGet', reactive => {
      if (!(reactive.propName in inputData))
        inputData[reactive.propName] = undefined;
      Prop.set(inputData, reactive.propName, reactive);
    });

    // If data value is empty gets the main scope value
    if (nodeValue === '')
      inputData = Extend.obj(this.bouer.data);
    else {
      // Other wise, compiles the object provided
      const mInputData = this.evaluator.exec({
        data: mData,
        code: nodeValue,
        context: this.context
      });

      if (!isObject(mInputData))
        return Logger.error(('Expected a valid Object Literal expression in “' + node.nodeName +
          '” and got “' + nodeValue + '”.'));

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
      this.serviceProvider.get<DataStore>('DataStore')!.set('data', dataKey, inputData);
    }

    Reactive.transform({
      context: this.context,
      data: inputData
    });
    return this.compiler.compile({
      data: inputData,
      el: ownerNode,
      context: this.context,
    });
  }

  href(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node);
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    ownerNode.removeAttribute(node.nodeName);

    const usehash = ifNullReturn(this.bouer.config.usehash, true);
    const routeToSet = urlCombine((usehash ? '#' : ''), nodeValue);

    ownerNode.setAttribute('href', routeToSet);
    const href = ownerNode.attributes['href'] as Attr;
    const delimiters = this.delimiter.run(nodeValue);

    if (delimiters.length !== 0)
      this.binder.create({
        data: data,
        node: href,
        isConnected: () => ownerNode.isConnected,
        context: this.context,
        fields: delimiters
      });

    (ownerNode as HTMLAnchorElement)
      .addEventListener('click', event => {
        event.preventDefault();

        this.serviceProvider.get<Routing>('Routing')!
          .navigate(href.value);
      }, false);
  }

  entry(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node) as Element;
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));

    ownerNode.removeAttribute(node.nodeName);
    this.serviceProvider.get<ComponentHandler>('ComponentHandler')!
      .prepare([
        {
          name: nodeValue,
          template: ownerNode.outerHTML,
          data: data
        }
      ]);
  }

  put(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node) as Element;
    let nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    let execute = () => { };

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node),
        'Direct <empty string> injection value is not allowed.');

    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error('Expected an expression with no delimiter in “' + node.nodeName +
        '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');

    this.binder.create({
      data: data,
      node: node,
      isConnected: () => ownerNode.isConnected,
      fields: [{ expression: nodeValue, field: nodeValue }],
      context: this.context,
      isReplaceProperty: false,
      onUpdate: () => execute()
    });

    ownerNode.removeAttribute(node.nodeName);

    (execute = () => {
      ownerNode.innerHTML = '';
      nodeValue = trim(ifNullReturn(node.nodeValue, ''));
      if (nodeValue === '') return;

      const componentElement = $CreateAnyEl(nodeValue)
        .appendTo(ownerNode)
        .build();

      this.serviceProvider.get<ComponentHandler>('ComponentHandler')!
        .order(componentElement, data);
    })();
  }

  req(node: Node, data: object) {
    const ownerNode = this.toOwnerNode(node) as Element;
    const container = this.toOwnerNode(ownerNode) as Element;
    const nodeName = node.nodeName;
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
      return Logger.error(('Expected a valid “for” expression in “' + nodeName
        + '” and got “' + nodeValue + '”.' + '\nValid: e-req="item of url".'));

    const delimiters = this.delimiter.run(nodeValue);
    const localDataStore: dynamic = {};
    const dataKey = (node.nodeName.split(':')[1] || '').replace(/\[|\]/g, '');
    const comment = $CreateComment(undefined, 'request-' + (dataKey || code(6)));

    let onInsertOrUpdate = () => { };
    let onUpdate = () => { };

    let binderConfig: IBinderConfig = {
      node: node,
      data: data,
      nodeName: nodeName,
      nodeValue: nodeValue,
      fields: delimiters,
      parent: ownerNode,
      value: nodeValue,
    };

    // Inserting the comment node
    container.insertBefore(comment, ownerNode);

    if (delimiters.length !== 0)
      binderConfig = this.binder.create({
        data: data,
        node: node,
        fields: delimiters,
        context: this.context,
        isReplaceProperty: false,
        isConnected: () => comment.isConnected,
        onUpdate: () => onUpdate()
      });

    ownerNode.removeAttribute(node.nodeName);
    // Mutating the `isConnected` property of the e-req node
    Prop.set(ownerNode, 'isConnected', { get: () => comment.isConnected });

    const subcribeEvent = (eventName: string) => {
      const attr = ownerNode.attributes.getNamedItem(Constants.on + eventName);
      if (attr) this.eventHandler.compile(attr, data, this.context);

      return {
        emit: (detailObj?: dynamic) => {
          this.eventHandler.emit({
            attachedNode: ownerNode,
            eventName: eventName,
            init: {
              detail: detailObj
            },
          });
        }
      };
    };

    type ExpObject = {
      filters: string[],
      type: string,
      expression: string,
      variables: string,
      path: string
    };

    const builder = (expression: string): ExpObject => {
      const filters = expression.split('|').map(item => trim(item));
      // Removing and retrieving the Request Expression
      const reqExpression = filters.shift()!.replace(/\(|\)/g, '');

      let reqSeparator = ' of ';
      let reqParts = reqExpression.split(reqSeparator);
      if (!(reqParts.length > 1))
        reqParts = reqExpression.split(reqSeparator = ' as ');

      return {
        filters: filters,
        type: trim(reqSeparator),
        expression: trim(reqExpression),
        variables: trim(reqParts[0]),
        path: trim(reqParts[1])
      };
    };

    const isValidResponse = (response: MiddlewareResult, requestType: string) => {
      if (!response) {
        Logger.error(('the return must be an object containing “data” property. ' +
          'Example: { data: {} | [] }'));
        return false;
      }

      if (!('data' in response)) {
        Logger.error(('the return must contain the “data” property. Example: { data: {} | [] }'));
        return false;
      }

      if ((requestType === 'of' && !Array.isArray(response.data))) {
        Logger.error(('Using e-req="... “of” ..." the response must be a list of items, and got ' +
          '“' + typeof response.data + '”.'));
        return false;
      }

      if ((requestType === 'as' && !(typeof response.data === 'object'))) {
        Logger.error(('Using e-req="... “as” ..." the response must be a list of items, and got ' +
          '“' + typeof response.data + '”.'));
        return false;
      }

      return true;
    };

    const middleware = this.serviceProvider.get<Middleware>('Middleware')!;

    if (!middleware.has('req'))
      return Logger.error('There is no “req” middleware provided for the “e-req” directive requests.');

    (onInsertOrUpdate = () => {
      const expObject = builder(trim(node.nodeValue || ''));
      const responseHandler = (response: MiddlewareResult) => {
        if (!isValidResponse(response, expObject.type))
          return;

        Reactive.transform({
          context: this.context,
          data: response
        });

        if (dataKey) this.serviceProvider.get<DataStore>('DataStore')!.set('req', dataKey, response);

        subcribeEvent(Constants.builtInEvents.response).emit({
          response: response
        });

        // Handle Content Insert/Update
        if (!('data' in localDataStore)) {
          // Store the data
          localDataStore.data = undefined;
          Prop.transfer(localDataStore, response, 'data');
        } else {
          // Update de local data
          return localDataStore.data = response.data;
        }

        if (expObject.type === 'as') {
          // Removing the: “(...)”  “,”  and getting only the variable
          const variable = trim(expObject.variables.split(',')[0].replace(/\(|\)/g, ''));

          if (variable in data)
            return Logger.error('There is already a “' + variable + '” defined in the current scope. ' +
              'Provide another variable name in order to continue.');

          (data as any)[variable] = response.data;
          return this.compiler.compile({
            el: ownerNode,
            data: Reactive.transform({ context: this.context, data: data }),
            context: this.context,
            isConnected: () => comment.isConnected
          });
        }

        if (expObject.type === 'of') {
          const resUniqueName = code(8, 'res');
          const forDirectiveContent = expObject.expression.replace(expObject.path, resUniqueName);
          const mData = Extend.obj({ [resUniqueName]: response.data }, data);
          ownerNode.setAttribute(Constants.for, forDirectiveContent);

          Prop.set(mData, resUniqueName, Prop.descriptor(response, 'data')!);
          return this.compiler.compile({
            el: ownerNode,
            data: mData,
            context: this.context,
            isConnected: () => comment.isConnected
          });
        }
      };

      subcribeEvent(Constants.builtInEvents.request).emit();

      middleware.run('req', {
        type: 'onBind',
        action: middlewareRequest => {
          const context = {
            binder: binderConfig,
            detail: {
              requestType: expObject.type,
              requestPath: expObject.path,
              reponseData: localDataStore
            }
          };

          const cbs = {
            success: (response: MiddlewareResult) => {
              responseHandler(response);
            },
            fail: (error: any) => subcribeEvent(Constants.builtInEvents.fail).emit({
              error: error
            }),
            done: () => subcribeEvent(Constants.builtInEvents.done).emit()
          };

          middlewareRequest(context, cbs);
        }
      });
    })();

    onUpdate = () => {
      const expObject = builder(trim(node.nodeValue || ''));
      middleware.run('req', {
        type: 'onUpdate',
        default: () => onInsertOrUpdate(),
        action: middlewareRequest => {
          const context = {
            binder: binderConfig,
            detail: {
              requestType: expObject.type,
              requestPath: expObject.path,
              reponseData: localDataStore
            }
          };

          const cbs = {
            success: (response: MiddlewareResult) => {
              if (!isValidResponse(response, expObject.type))
                return;

              localDataStore.data = response.data;
            },
            fail: (error: any) => subcribeEvent(Constants.builtInEvents.fail).emit({
              error: error
            }),
            done: () => subcribeEvent(Constants.builtInEvents.done).emit()
          };

          middlewareRequest(context, cbs);
        }
      });
    };
  }

  wait(node: Node) {
    const ownerNode = this.toOwnerNode(node);
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));

    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));

    ownerNode.removeAttribute(node.nodeName);
    const dataStore = this.serviceProvider.get<DataStore>('DataStore')!;
    const mWait = dataStore.wait[nodeValue];

    if (mWait) {
      mWait.nodes.push(ownerNode);
      // No data exposed yet
      if (!mWait.data) return;
      // Compile all the waiting nodes
      forEach(mWait.nodes, (nodeWaiting) => {
        this.compiler.compile({
          el: nodeWaiting,
          context: mWait.context,
          data: Reactive.transform({
            context: mWait.context,
            data: mWait.data as dynamic
          }),
        });
      });

      if (ifNullReturn(mWait.once, false))
        delete dataStore.wait[nodeValue];
    }

    return dataStore.wait[nodeValue] = { nodes: [ownerNode], context: this.context };
  }

  custom(node: Node, data: object): boolean {
    const ownerNode = this.toOwnerNode(node);
    const nodeName = node.nodeName;
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    const delimiters = this.delimiter.run(nodeValue);
    const $CustomDirective = this.$custom[nodeName];

    const bindConfig = this.binder.create({
      data: data,
      node: node,
      fields: delimiters,
      isReplaceProperty: false,
      context: this.context,
      isConnected: () => ownerNode.isConnected,
      onUpdate: () => {
        if (typeof $CustomDirective.onUpdate === 'function')
          $CustomDirective.onUpdate(node, bindConfig);
      }
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

  skeleton(node: Node) {
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    if (nodeValue !== '') return;

    const ownerNode = this.toOwnerNode(node);
    ownerNode.removeAttribute(node.nodeName);
  }
}