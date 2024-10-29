import dynamic from '../../../definitions/types/Dynamic';
import RenderContext from '../../../definitions/types/RenderContext';
import Constants from '../../../shared/helpers/Constants';
import Extend from '../../../shared/helpers/Extend';
import {
  createComment,
  errorMsgEmptyNode,
  forEach,
  getRootElement,
  ifNullReturn,
  isNull,
  isObject,
  removeEl,
  toLower,
  toOwnerNode,
  toStr,
  trim
} from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import Binder from '../../binder/Binder';
import DelimiterHandler from '../../DelimiterHandler';
import Evaluator from '../../Evaluator';
import EventHandler from '../../event/EventHandler';
import ReactiveEvent from '../../event/ReactiveEvent';
import Reactive from '../../reactive/Reactive';
import Compiler from '../Compiler';

export function $for(opitons: {
  node: Node,
  binder: Binder,
  evaluator: Evaluator,
  compiler: Compiler,
  eventHandler: EventHandler,
  delimiter: DelimiterHandler,
  context: RenderContext,
  data: object
}) {
  const {
    node,
    binder,
    evaluator,
    compiler,
    eventHandler,
    delimiter,
    context,
    data
  } = opitons; {

    const ownerNode = toOwnerNode(node) as Element;
    const container = ownerNode.parentElement;

    if (!container) return;

    if (ownerNode.hasAttribute('skeleton-cloned'))
      return;

    type ListedItemsHandler = {
      el: Element,
      data: dynamic
    };
    type ExpressionType = {
      type: string,
      filters: string[],
      isForOf: boolean,
      leftHand: string,
      rightHand: string,
      sourceValue: any,
      leftHandParts: string[],
      iterableExpression: string
    };

    const comment = createComment();
    const nodeName = node.nodeName;
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

    let listedItemsHandler: ListedItemsHandler[] = [];
    let hasWhereFilter = false;
    let hasOrderFilter = false;
    let execute = () => { };

    if (nodeValue === '')
      return Logger.error(errorMsgEmptyNode(node));

    if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
      return Logger.error('Expected a valid “for” expression in “'
        + nodeName + '” and got “' + nodeValue +
        '”.' + '\nValid: e-for="item of items".');

    // Binding the e-for if got delimiters
    const delimiters = delimiter.run(nodeValue);
    if (delimiters.length !== 0)
      binder.create({
        node: node,
        data: data,
        fields: delimiters,
        isReplaceProperty: true,
        context: context,
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

      wValue = evaluator.exec({ data: data, code: wValue, context: context });

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
            isValid = toStr(item).toLowerCase().includes(wValue.toLowerCase());
          } else {
            const keysList = wKeys.split(',').map(m => trim(m));
            for (let i = 0; i < keysList.length; i++) {
              const prop = keysList[i];
              const propValue = evaluator.exec({
                data: item,
                code: prop,
                context: context
              });

              if (toStr(propValue).toLowerCase().includes(wValue.toLowerCase())) {
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
        context: context
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
      compiler.compile({
        el: forClonedItem,
        data: forData,
        context: context,
        onDone: el => eventHandler.emit({
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
    const $ExpressionBuilder = (expression: string): ExpressionType => {
      const filters = expression.split('|').map(item => trim(item));
      const forExpression = filters[0].replace(/\(|\)/g, '');
      filters.shift();

      // for types:
      // e-for='item of items',  e-for='(item, index) of items'
      // e-for='key in object', e-for='(key, value) in object'
      // e-for='(key, value, index) in object'

      let forSeparator = ' of ';
      let forParts = forExpression.split(forSeparator);
      if (!(forParts.length > 1))
        forParts = forExpression.split(forSeparator = ' in ');

      const leftHand = forParts[0];
      const rightHand = forParts[1];
      const leftHandParts = leftHand.split(',').map(x => trim(x));

      const isForOf = trim(forSeparator) === 'of';
      const iterable = isForOf ? rightHand : 'Object.keys(' + rightHand + ')';
      const sourceValue = evaluator.exec({
        data: data,
        code: rightHand,
        context: context
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
          if (isNull(item)) return;
          removeEl(getRootElement(item.el));

          if (method === 'pop') return;
          return reOrganizeIndexes();
        }
        case 'splice': { // Indexed removal handler
          let index = args[0] as number;
          const deleteCount = args[1] as number;

          const removedItems = mListedItems.splice(index, deleteCount);
          forEach(removedItems, (item: any) => removeEl(getRootElement(item.el)));

          expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));

          const leftHandParts = expObj.leftHandParts;
          const indexOrValue = leftHandParts[1] || '_index_or_value';
          const insertArgs = [].slice.call(args, 2);

          // Adding the items to the dom
          forEach(insertArgs, item => {
            index++;
            $InsertForItem({
              // Getting the next reference
              reference: getRootElement(listedItemsHandler[index].el) || comment,
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
          const element = (listedItemsHandler[0] || {}).el || comment;

          let indexRef = isUnshift ? 0 : mListedItems.length;
          let reference = isUnshift ? getRootElement(element) : comment;

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

    const applyWhere = (listCopy: any[], config: string) => {
      const parts = config.split(':').map(item => trim(item));

      if (parts.length == 1) {
        Logger.error(('Invalid “' + nodeName + '” where expression “' + nodeValue +
          '”, at least a where-value and where-keys, or a filter-function must be provided'));
      } else {
        return $Where(listCopy, parts);
      }
    };

    const reactivePropertyEvent = ReactiveEvent.on('AfterGet',
      descriptor => {
        binder.binds.push({
          isConnected: () => comment.isConnected,
          watch: descriptor.onChange((_n, _o, detail) =>
            $OnArrayChanges(detail), node)
        });
      });
    let expObj: ExpressionType | null = $ExpressionBuilder(nodeValue);

    const filters = expObj!.filters;
    const findFilter = (fName: string) => filters.filter(item => item.substring(0, fName.length) === fName);
    const whereFilterConfigs = findFilter('where');

    // Applying the filter before rendering the items
    forEach(whereFilterConfigs, config => applyWhere(expObj!.sourceValue, config));

    reactivePropertyEvent.off();

    (execute = () => {
      expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
      const iterable = expObj.iterableExpression;
      const orderFilterConfigs = findFilter('order');

      // Cleaning the existing items
      forEach(listedItemsHandler, item => {
        const element = getRootElement(item.el);
        if (!element.parentElement) return;
        container.removeChild(element);
      });
      listedItemsHandler = [];

      evaluator.exec({
        data: data,
        isReturn: false,
        context: context,
        code: 'var __e = __each, __fl = __filters, __f = __for; ' +
          '__f(__fl(' + iterable + '), function($$itm, $$idx) { __e($$itm, $$idx); })',
        aditional: {
          __for: forEach,
          __each: (item: any, index: number) => $InsertForItem({ index, item }),
          __filters: (list: any[]) => {
            let listCopy = Extend.array(list);
            // applying where:
            forEach(whereFilterConfigs, config => listCopy = applyWhere(listCopy, config)!);

            // applying order:
            const applyOrder = (config: string) => {
              const parts = config.split(':').map(item => trim(item));
              if (parts.length == 1) {
                Logger.error(('Invalid “' + nodeName + '” order  expression “' + nodeValue +
                  '”, at least the order type must be provided'));
              } else {
                listCopy = $Order(listCopy, parts[1], parts[2]);
              }
            };

            forEach(orderFilterConfigs, config => applyOrder(config));

            return listCopy;
          }
        }
      });

      expObj = null;
    })();
  }
}