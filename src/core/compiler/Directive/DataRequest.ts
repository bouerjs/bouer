import { IoC } from '../../..';
import IBinderConfig from '../../../definitions/interfaces/IBinderConfig';
import dynamic from '../../../definitions/types/Dynamic';
import RenderContext from '../../../definitions/types/RenderContext';
import Bouer from '../../../instance/Bouer';
import Constants from '../../../shared/helpers/Constants';
import Extend from '../../../shared/helpers/Extend';
import Prop from '../../../shared/helpers/Prop';
import { code, createComment, ifNullReturn, toOwnerNode, trim } from '../../../shared/helpers/Utils';
import Logger from '../../../shared/logger/Logger';
import Binder from '../../binder/Binder';
import DelimiterHandler from '../../DelimiterHandler';
import EventHandler from '../../event/EventHandler';
import IMiddlewareResult from '../../middleware/IMiddlewareResult';
import Middleware from '../../middleware/Middleware';
import Reactive from '../../reactive/Reactive';
import Skeleton from '../../Skeleton';
import DataStore from '../../store/DataStore';
import Compiler from '../Compiler';

export function $req(opitons: {
  node: Node,
  bouer: Bouer,
  compiler: Compiler,
  delimiter: DelimiterHandler,
  context: RenderContext,
  eventHandler: EventHandler,
  binder: Binder,
  data: object
}) {
  const {
    node,
    bouer,
    delimiter,
    context,
    compiler,
    binder,
    eventHandler,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node) as Element;
  const container = toOwnerNode(ownerNode) as Element;
  const nodeName = node.nodeName;
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
    return Logger.error(('Expected a valid “for” expression in “' + nodeName
      + '” and got “' + nodeValue + '”.' + '\nValid: e-req="item of url".'));

  if (ownerNode.hasAttribute('skeleton-cloned'))
    return;

  const delimiters = delimiter.run(nodeValue);
  const localDataStore: dynamic = {};
  const dataKey = (node.nodeName.split(':')[1] || '').replace(/\[|\]/g, '');
  const comment = createComment(undefined, 'request-' + (dataKey || code(6)));

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

  const skeleton = IoC.app(bouer).resolve(Skeleton)!;

  // Only insert if the type is `of
  if (nodeValue.includes(' of '))
    skeleton.insertItems(ownerNode);

  if (delimiters.length !== 0)
    binderConfig = binder.create({
      data: data,
      node: node,
      fields: delimiters,
      context: context,
      isReplaceProperty: false,
      onUpdate: () => onUpdate()
    });

  ownerNode.removeAttribute(node.nodeName);

  const subcribeEvent = (eventName: string) => {
    const attr = ownerNode.attributes.getNamedItem(Constants.on + eventName);
    if (attr) eventHandler.compile(attr, data, context);

    return {
      emit: (detailObj?: dynamic) => {
        eventHandler.emit({
          attachedNode: ownerNode,
          eventName: eventName,
          init: {
            detail: detailObj
          },
        });
      }
    };
  };

  type ExpressionType = {
    filters: string[],
    type: string,
    expression: string,
    variables: string,
    path: string
  };

  const builder = (expression: string): ExpressionType => {
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

  const isValidResponse = (response: IMiddlewareResult, requestType: string) => {
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

  const middleware = IoC.app(bouer).resolve(Middleware)!;

  if (!middleware.has('req'))
    return Logger.error('There is no “req” middleware provided for the “e-req” directive requests.');

  const createMiddlewareContext = (expObject: ExpressionType) => {
    return {
      binder: binderConfig,
      detail: {
        requestType: expObject.type,
        requestPath: expObject.path,
        reponseData: localDataStore
      }
    };
  };

  (onInsertOrUpdate = () => {
    const expObject = builder(trim(node.nodeValue || ''));
    const responseHandler = (response: IMiddlewareResult) => {
      if (!isValidResponse(response, expObject.type))
        return;

      Reactive.transform({
        context: context,
        data: response
      });

      if (dataKey) IoC.app(bouer).resolve(DataStore)!.set('req', dataKey, response);

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
        return compiler.compile({
          el: ownerNode,
          data: Reactive.transform({ context: context, data: data }),
          context: context
        });
      }

      if (expObject.type === 'of') {
        skeleton.clearItems(ownerNode);

        const resUniqueName = code(8, 'res');
        const forDirectiveContent = expObject.expression.replace(expObject.path, resUniqueName);
        const mData = Extend.obj({ [resUniqueName]: response.data }, data);
        ownerNode.setAttribute(
          Constants.for,
          Extend.array([forDirectiveContent], expObject.filters).join(' | ')
        );

        Prop.set(mData, resUniqueName, Prop.descriptor(response, 'data')!);
        return compiler.compile({
          el: ownerNode,
          data: mData,
          context: context
        });
      }
    };

    subcribeEvent(Constants.builtInEvents.request).emit();

    middleware.run('req', {
      type: 'onBind',
      action(middlewareRequest) {
        middlewareRequest(createMiddlewareContext(expObject), {
          success: (response: IMiddlewareResult) => {
            responseHandler(response);
          },
          fail: (error: any) => subcribeEvent(Constants.builtInEvents.fail).emit({
            error: error
          }),
          done: () => subcribeEvent(Constants.builtInEvents.done).emit()
        });
      }
    });
  })();

  onUpdate = () => {
    const expObject = builder(trim(node.nodeValue || ''));
    middleware.run('req', {
      type: 'onUpdate',
      default: () => onInsertOrUpdate(),
      action(middlewareRequest) {
        middlewareRequest(createMiddlewareContext(expObject), {
          success: (response: IMiddlewareResult) => {
            if (!isValidResponse(response, expObject.type))
              return;

            localDataStore.data = response.data;
          },
          fail: (error: any) => subcribeEvent(Constants.builtInEvents.fail).emit({
            error: error
          }),
          done: () => subcribeEvent(Constants.builtInEvents.done).emit()
        });
      }
    });
  };
}