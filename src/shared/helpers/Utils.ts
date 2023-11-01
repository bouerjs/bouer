
// Quotes “'+  +'”

import ReactiveEvent from '../../core/event/ReactiveEvent';
import Reactive from '../../core/reactive/Reactive';
import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import Logger from '../logger/Logger';
import Constants from './Constants';
import Extend from './Extend';
import Prop from './Prop';

export function webRequest(url: string, options?: {
  body?: any;
  headers?: object;
  method?: string;
  beforeSend?: (xhr: XMLHttpRequest) => void;
}) {
  if (!url) return Promise.reject(new Error('Invalid Url'));

  const createXhr = (method: string) => {
    if ((DOM as any).documentMode && (!method.match(/^(get|post)$/i) || !WIN.XMLHttpRequest)) {
      return new (WIN as any).ActiveXObject('Microsoft.XMLHTTP');
    } else if (WIN.XMLHttpRequest) {
      return new WIN.XMLHttpRequest();
    }
    throw new Error('This browser does not support XMLHttpRequest.');
  };

  const getOption = (key: string, mDefault: any) => {
    const mOptions = (options || {}) as dynamic;
    const value = mOptions[key];
    if (value) return value;
    return mDefault;
  };

  const headers = getOption('headers', {});
  const method = getOption('method', 'get');
  const body = getOption('body', undefined);
  const beforeSend = getOption('body', (xhr: XMLHttpRequest) => { });
  const xhr = createXhr(method);

  interface IResponse extends Response {
    url: string,
    ok: boolean,
    status: number,
    statusText: string,
    json(): Promise<any>,
    text(): Promise<string>
  }

  return new Promise<IResponse>((resolve, reject) => {
    const createResponse = (
      mFunction: Function,
      ok: boolean, status: number,
      xhr: any, response: any) => {
      mFunction({
        url: url, ok: ok, status: status,
        statusText: xhr.statusText || '',
        headers: xhr.getAllResponseHeaders(),
        json: () => Promise.resolve(JSON.stringify(response)),
        text: () => Promise.resolve(response)
      });
    };

    xhr.open(method, url, true);

    forEach(Object.keys(headers), key => {
      xhr.setRequestHeader(key, headers[key]);
    });

    xhr.onload = () => {
      const response = ('response' in xhr) ? xhr.response : xhr.responseText;
      let status = xhr.status === 1223 ? 204 : xhr.status;

      if (status === 0)
        status = response ? 200 : urlResolver(url).protocol === 'file' ? 404 : 0;
      createResponse(resolve, (status >= 200 && status < 400), status, xhr, response);
    };

    xhr.onerror = () => {
      createResponse(reject, false, xhr.status, xhr, '');
    };

    xhr.onabort = () => {
      createResponse(reject, false, xhr.status, xhr, '');
    };

    xhr.ontimeout = () => {
      createResponse(reject, false, xhr.status, xhr, '');
    };

    beforeSend(xhr);

    xhr.send(body);
  });
}

export function code(len?: number, prefix?: string, sufix?: string) {
  const alpha = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let out = '';
  let lowerAlt = false;
  for (let i = 0; i < (len || 8); i++) {
    const pos = Math.floor(Math.random() * alpha.length);
    out += lowerAlt ? toLower(alpha[pos]) : alpha[pos];
    lowerAlt = !lowerAlt;
  }
  return ((prefix || '') + out + (sufix || ''));
}

export function isNull(input: any) {
  return (typeof input === 'undefined') || (input === undefined || input === null);
}

export function isObject(input: any) {
  return (typeof input === 'object') && (String(input) === '[object Object]');
}

export function isFilledObj(input: any) {
  if (isEmptyObject(input)) return false;

  let oneFilledField = false;
  const arrayObject = Object.keys(input);

  for (let index = 0; index < arrayObject.length; index++) {
    if (!isNull(arrayObject[index])) {
      oneFilledField = true;
      break;
    }
  }

  return oneFilledField;
}

export function isPrimitive(input: any): boolean {
  return (
    typeof input === 'string' ||
    typeof input === 'number' ||
    typeof input === 'symbol' ||
    typeof input === 'boolean'
  );
}

export function isString(input: any) {
  return (typeof input !== 'undefined') && (typeof input === 'string');
}

export function isEmptyObject(input: any) {
  if (!input || !isObject(input)) return true;
  return Object.keys(input).length === 0;
}

export function isFunction(input: any) {
  return typeof input === 'function';
}

export function ifNullReturn<T>(v: any, _return: T) {
  return isNull(v) ? _return : v;
}

export function ifNullStop(el: Element | undefined | null) {
  if (isNull(el))
    throw new Error('Application is not initialized');
  return el!;
}

export function trim(value: string) {
  return value ? value.trim() : value;
}

export function startWith(value: string, pattern: string) {
  return (value.substring(0, pattern.length) === pattern);
}

export function toLower(str: string) {
  return str.toLowerCase();
}

export function toStr(input: any) {
  if (isPrimitive(input)) {
    return String(input);
  } else if (isObject(input) || Array.isArray(input)) {
    return JSON.stringify(input);
  } else if (isFunction(input.toString)) {
    return input.toString();
  } else {
    return String(input);
  }
}

export function forEach<T, C = {}>(
  iterable: T[],
  callback: (this: typeof context, item: T, index: number) => void,
  context?: C
) {
  for (let i = 0; i < iterable.length; i++) {
    callback.call(context, iterable[i], i);
  }
}

export function where<T, C = {}>(
  iterable: T[],
  callback: (this: typeof context, item: T, index: number) => any,
  context?: C
) {
  const out: T[] = [];
  for (let i = 0; i < iterable.length; i++) {
    if (callback.call(context, iterable[i], i)) {
      out.push(iterable[i]);
    }
  }
  return out;
}

export function toArray(array: any) {
  if (!array) return [];
  return [].slice.call(array);
}

export function $CreateComment(id?: string, content?: string) {
  const comment = DOM.createComment(content || ' e ');
  (comment as any).id = id || code(8);
  return comment;
}

export function $CreateAnyEl(
  elName: string,
  callback?: (element: HTMLElement, dom: Document) => void
) {
  return $CreateEl(elName as any, callback);
}

export function $CreateEl<Key extends keyof HTMLElementTagNameMap>(
  elName: Key,
  callback?: (element: HTMLElementTagNameMap[Key], dom: Document) => void
) {
  const el = DOM.createElement(elName);
  if (isFunction(callback)) callback!(el, DOM);

  const returnObj = {
    appendTo: (target: Element) => {
      target.appendChild(el);
      return returnObj;
    },
    build: () => el,
    child: () => el.children[0] as Element,
    children: () => [].slice.call(el.childNodes) as Element[],
  };
  return returnObj;
}

export function $RemoveEl(el: Element) {
  const parent = el.parentNode;
  if (parent) parent.removeChild(el);
}

export function mapper(source: dynamic, destination: dynamic) {
  forEach(Object.keys(source), key => {
    const sourceValue = source[key];

    if (key in destination) {
      if (isObject(sourceValue))
        return mapper(sourceValue as any, destination[key]);
      return destination[key] = sourceValue;
    }

    Prop.transfer(destination, source, key);
  });
}

export function urlResolver(url: string) {
  let href = url;
  // Support: IE 9-11 only, /* doc.documentMode is only available on IE */
  if ('documentMode' in DOM) {
    anchor.setAttribute('href', href);
    href = anchor.href;
  }

  anchor.href = href;
  let hostname = anchor.hostname;
  const ipv6InBrackets = anchor.hostname === '[::1]';

  if (!ipv6InBrackets && hostname.indexOf(':') > -1)
    hostname = '[' + hostname + ']';

  const $return = {
    href: anchor.href,
    baseURI: anchor.baseURI,
    protocol: anchor.protocol ? anchor.protocol.replace(/:$/, '') : '',
    host: anchor.host,
    search: anchor.search ? anchor.search.replace(/^\?/, '') : '',
    hash: anchor.hash ? anchor.hash.replace(/^#/, '') : '',
    hostname: hostname,
    port: anchor.port,
    pathname: (anchor.pathname.charAt(0) === '/') ? anchor.pathname : '/' + anchor.pathname,
    origin: ''
  };

  $return.origin = $return.protocol + '://' + $return.host;
  return $return;
}

export function urlCombine(base: string, ...parts: string[]) {
  const baseSplitted = base.split(/\/\//);
  const protocol = baseSplitted.length > 1 ? (baseSplitted[0] + '//') : '';
  const uriRemain = protocol === '' ? baseSplitted[0] : baseSplitted[1];
  const uriRemainParts = uriRemain.split(/\//);
  const partsToJoin: string[] = [];

  forEach(uriRemainParts, p => trim(p) ? partsToJoin.push(p) : null);
  forEach(parts, part => forEach(part.split(/\//),
    p => trim(p) ? partsToJoin.push(p) : null));

  return protocol + partsToJoin.join('/');
}

/**
 * Relative path resolver
 * @param { string } relative the path of the actual path
 * @param { string } path the actual path
 * @returns { string } path with ./resolved-path
 */
export function pathResolver(relative: string, path: string) {
  const isCurrentDir = (v: string) => v.substring(0, 2) === './';
  const isParentDir = (v: string) => v.substring(0, 3) === '../';

  const toDirPath = (v: string) => {
    const values = v.split('/');

    if (/\.html$|\.css$|\.js$/gi.test(v))
      values.pop();
    return {
      relative: values.join('/'),
      parts: values
    };
  };

  if (isCurrentDir(path))
    return toDirPath(relative).relative + path.substring(1);

  if (!isParentDir(path))
    return path;

  const parts = toDirPath(relative).parts;
  parts.push((function pathLookUp(value: string): string {
    if (!isParentDir(value))
      return value;

    parts.pop();
    return pathLookUp(value.substring(3));
  })(path));

  return parts.join('/');
}

export function buildError(error: any) {
  if (!error) return 'Unknown Error';
  error.stack = '';
  return error;
}

export function fnEmpty(input?: any) {
  return input;
}

export function fnCall(fn?: any) {
  if (fn instanceof Promise)
    fn.then(result => {
      if (isFunction(result))
        result.call();
      else if (result instanceof Promise)
        result.then();
    }).catch(err => Logger.error(err));
  return fn;
}

export function findAttribute(
  element: Element,
  attrs: string[],
  removeIfFound: boolean = false
): Attr | null {
  let res: Attr | null = null;

  if (!element) return null;

  for (let i = 0; i < attrs.length; i++)
    if (res = element.attributes[attrs[i] as any])
      break;

  if (!isNull(res) && removeIfFound)
    element.removeAttribute(res!.name);

  return res;
}

export function findDirective(
  node: Node,
  name: string
): Attr | null {
  const attributes = (node as any).attributes || [];
  return attributes.getNamedItem(name) ||
    toArray(attributes).find((attr: Attr) =>
      (attr.name === name || startWith(attr.name, name + ':')));
}

export function getRootElement(el: Element): Element {
  return (el as any).root || el;
}

export function copyObject<TObject extends dynamic>(object: TObject) {
  const out: dynamic = Object.create(object.__proto__);
  forEach(Object.keys(object), key => out[key] = object[key]);
  return out as TObject;
}

export function setData<
  InputData extends dynamic, TargetObject extends dynamic, DataResult extends InputData & TargetObject
>(
  context: RenderContext,
  inputData: InputData,
  targetObject?: TargetObject
): DataResult {
  if (isNull(targetObject))
    targetObject = context.data as any;

  if (!isObject(inputData)) {
    Logger.error('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".');
    return targetObject as any;
  }

  if (isObject(targetObject) && targetObject == null) {
    Logger.error('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".');
    return inputData as any;
  }

  // Transforming the input
  Reactive.transform({
    data: inputData,
    context: context
  });

  // Transfering the properties
  forEach(Object.keys(inputData), key => {
    let source: Reactive<any, any> | undefined;
    let destination: Reactive<any, any> | undefined;

    ReactiveEvent.once('AfterGet', evt => {
      evt.onemit = descriptor => source = descriptor;
      Prop.descriptor(inputData, key as keyof InputData)!.get!();
    });

    ReactiveEvent.once('AfterGet', evt => {
      evt.onemit = descriptor => destination = descriptor;
      const desc = Prop.descriptor(targetObject as {}, key as never);
      if (desc && isFunction(desc.get)) desc.get!();
    });

    Prop.transfer(targetObject as {}, inputData, key as never);

    if (!destination || !source) return;
    // Adding the previous watches to the property that is being set
    forEach(destination.watches, watch => {
      if (source!.watches.indexOf(watch) === -1)
        source!.watches.push(watch);
    });

    // Notifying the bounds and watches
    source.notify();
  });

  return (targetObject! as any) as DataResult;
}

export function htmlToJsObj(input: string | HTMLElement,
  options?: {
    /**
    * attributes that tells the compiler to lookup to the element, e.g: [name],[data-name].
    * * Note: The definition order matters.
    */
    names?: string,
    /**
    * attributes that tells the compiler where it going to get the value, e.g: [value],[data-value].
    * * Note: The definition order matters.
    */
    values?: string
  },
  onSet?: (
    builtObject: object, propName: string, value: any, element: Element
  ) => void
): object | null {
  let element: Element | undefined = undefined;
  // If it's not a HTML Element, just return
  if ((input instanceof HTMLElement))
    element = input;
  // If it's a string try to get the element
  else if (typeof input === 'string') {
    try {
      const $el = DOM.querySelector(input);
      if (!$el) {
        Logger.error('Element with "' + input + '" selector Not Found.');
        return null;
      }
      element = $el;
    } catch (error) {
      // Unknown error
      Logger.error(buildError(error));
      return null;
    }
  }

  // If the element is not
  if (isNull(element))
    throw Logger.error('Invalid element provided at app.toJsObj(> "' + input + '" <).');

  options = options || {};

  // Remove `[ ]` and `,` and return an array of the names provided
  const mNames = (options.names || '[name]').replace(/\[|\]/g, '').split(',');
  const mValues = (options.values || '[value]').replace(/\[|\]/g, '').split(',');

  const getValue = (el: Element, fieldName: string) => {
    if (fieldName in el) return (el as any)[fieldName];
    return el.getAttribute(fieldName) || (el as any).innerText;
  };

  const tryGetValue = (el: Element) => {
    let val: string | number | boolean | undefined | null = undefined;
    mValues.find((field: string) => (val = getValue(el, field)) ? true : false);
    return val;
  };

  const objBuilder = (element: Element) => {
    const builtObject: dynamic = {};

    // Elements that skipped on serialization process
    const escapes: dynamic = { BUTTON: true };
    const checkables: dynamic = { checkbox: true, radio: true };

    (function walker(el: Element) {
      const attr = findAttribute(el, mNames);
      if (attr) {
        const propName = attr.value;

        if (escapes[el.tagName] === true) return;

        if ((el instanceof HTMLInputElement) && (checkables[el.type] === true && el.checked === false))
          return;

        const propOldValue = builtObject[propName];
        const isBuildAsArray = el.hasAttribute(Constants.array);
        const value = tryGetValue(el);

        if (value !== '') {
          if (isBuildAsArray) {
            (propOldValue) ?
              // Add item to the array
              builtObject[propName] = Extend.array(propOldValue, value) :
              // Set the new value
              builtObject[propName] = [value];
          } else {
            (propOldValue) ?
              // Spread and add properties
              builtObject[propName] = Extend.array(propOldValue, value) :
              // Set the new value
              builtObject[propName] = value;
          }
        }

        // Calling on set function
        if (isFunction(onSet))
          fnCall(onSet!(builtObject, propName, value, el));
      }

      forEach(toArray(el.children), (child: Element) => {
        if (!findAttribute(child, [Constants.build]))
          walker(child);
      });
    })(element);

    return builtObject;
  };

  const builtObject = objBuilder(element!);
  const builds = toArray(element!.querySelectorAll(`[${Constants.build}]`));

  forEach(builds, (buildElement: Element) => {
    // Getting the e-build attr value
    const buildPath = getValue(buildElement, Constants.build) as string;
    const isBuildAsArray = buildElement.hasAttribute(Constants.array);
    const builtObjValue = objBuilder(buildElement);

    // If the object is empty (has all fields with `null` value)
    if (!isFilledObj(builtObjValue)) return;

    (function objStructurer(remainPath, lastLayer) {
      const splittedPath = remainPath.split('.');
      const leadElement = splittedPath[0];

      // Remove the lead element of the array
      splittedPath.shift();

      const objPropertyValue = lastLayer[leadElement];

      if (isNull(objPropertyValue))
        lastLayer[leadElement] = {};

      // If it's the last element of the array
      if (splittedPath.length === 0) {
        if (isBuildAsArray) {
          // Handle Array
          if (isObject(objPropertyValue) && !isEmptyObject(objPropertyValue)) {
            lastLayer[leadElement] = [Extend.obj(objPropertyValue, builtObjValue)];
          } else if (Array.isArray(objPropertyValue)) {
            objPropertyValue.push(builtObjValue);
          } else {
            lastLayer[leadElement] = [builtObjValue];
          }
        } else {
          isNull(objPropertyValue) ?
            // Set the new property
            lastLayer[leadElement] = builtObjValue :
            // Spread and add the new fields into the object
            lastLayer[leadElement] = Extend.obj(objPropertyValue, builtObjValue);
        }
        if (isFunction(onSet))
          fnCall(onSet!(lastLayer, leadElement, builtObjValue, buildElement));

        return;
      }

      if (Array.isArray(objPropertyValue)) {
        return forEach(objPropertyValue, item => {
          objStructurer(splittedPath.join('.'), item);
        });
      }

      objStructurer(splittedPath.join('.'), lastLayer[leadElement]);
    })(buildPath, builtObject);
  });

  return builtObject;
}

export const WIN = window;
export const DOM = document;
export const anchor = $CreateEl('a').build();