
// Quotes “'+  +'”

import ReactiveEvent from '../../core/event/ReactiveEvent';
import Computed, { EntryType } from '../../core/reactive/Computed';
import Reactive from '../../core/reactive/Reactive';
import Ref from '../../core/reactive/Ref';
import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import Logger from '../logger/Logger';
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

export function isRef(input: any) {
  return input instanceof Ref && typeof input.__ === 'function';
}

export function isComputed(input: any) {
  return input instanceof Computed && typeof input.__ === 'function';
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
export function toPascalCase(value: string) {
  return value[0].toUpperCase() + value.substring(1);
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

export function findOneBy<T, C = {}>(
  iterable: T[],
  callback: (this: typeof context, item: T, index: number) => any,
  context?: C
) {
  for (let i = 0; i < iterable.length; i++) {
    if (callback.call(context, iterable[i], i)) {
      return iterable[i];
    }
  }
  return null;
}

export function toArray(array: any) {
  if (!array) return [];
  return [].slice.call(array);
}

export function createComment(id?: string, content?: string) {
  const comment = DOM.createComment(content || ' e ');
  (comment as any).id = id || code(8);
  return comment;
}

export function createEl<Key extends string>(
  elName: Key,
  callback?: (
    element: Key extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[Key]
      : HTMLElement,
    dom: Document
  ) => void
) {
  type ElType = (Key extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[Key] : HTMLElement);
  const el = DOM.createElement(elName);
  if (isFunction(callback)) callback!(el as ElType, DOM);

  const returnObj = {
    appendTo: (target: Element) => {
      target.appendChild(el);
      return returnObj;
    },
    build: () => el as ElType,
    child: () => el.children[0] as Element,
    children: () => [].slice.call(el.childNodes) as Element[],
  };
  return returnObj;
}

export function removeEl(el: Element) {
  const parent = el.parentNode;
  if (parent) parent.removeChild(el);
}

export function mapper(source: dynamic, destination: dynamic) {
  let map = new WeakSet();

  function walker(source: any, destination: any) {
    if (map.has(source)) return;

    map.add(source);
    forEach(Object.keys(source), key => {
      const sourceValue = source[key];

      // If the key already in the destination, set
      if ((key in destination)) {
        // If the source value is an object
        if (isObject(sourceValue)) {
          return walker(sourceValue as any, destination[key]);
        }
        // Set the value directly to allow reactive
        return destination[key] = sourceValue;
      }

      Prop.transfer(destination, source, key);
    });
  }

  walker(source, destination);
  map = new WeakSet();
}

export function urlResolver(url: string) {
  let href = url;
  // Support: IE 9-11 only, /* doc.documentMode is only available on IE */
  if ('documentMode' in DOM) {
    ANCHOR.setAttribute('href', href);
    href = ANCHOR.href;
  }

  ANCHOR.href = href;
  let hostname = ANCHOR.hostname;
  const ipv6InBrackets = ANCHOR.hostname === '[::1]';

  if (!ipv6InBrackets && hostname.indexOf(':') > -1)
    hostname = '[' + hostname + ']';

  const $return = {
    href: ANCHOR.href,
    baseURI: ANCHOR.baseURI,
    protocol: ANCHOR.protocol ? ANCHOR.protocol.replace(/:$/, '') : '',
    host: ANCHOR.host,
    search: ANCHOR.search ? ANCHOR.search.replace(/^\?/, '') : '',
    hash: ANCHOR.hash ? ANCHOR.hash.replace(/^#/, '') : '',
    hostname: hostname,
    port: ANCHOR.port,
    pathname: (ANCHOR.pathname.charAt(0) === '/') ? ANCHOR.pathname : '/' + ANCHOR.pathname,
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
export function pathResolver(relative: string, path: string): string {
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

export function $default(input?: any, ...remains: any): any {
  return input;
}

export function fnCallResolver(fn?: any, cb?: (v: any) => any) {
  let fnValue = fn;

  if (isNull(fnValue))
    return fnValue;

  cb = cb || $default;

  if (typeof fnValue === 'function')
    fnValue = fn();

  if (!(fnValue instanceof Promise))
    return fnValue;

  if (fnValue instanceof Promise) {
    fnValue.then(value => {
      if (typeof cb === 'function') cb(value);
      return value;
    });
  }

  cb(fnValue);
  return fnValue;
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

export function setData<
  InData extends dynamic,
  Data extends dynamic,
  OutData extends InData & Data
>(
  context: RenderContext,
  inputData: InData,
  targetObject?: Data
): OutData {
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
      Prop.descriptor(inputData, key as keyof InData)!.get!();
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

  return (targetObject! as any) as OutData;
}

export function $computed<Type, Context = any>(
  entryValue: EntryType<Type, Context>
) {
  return new Computed<Type, Context>(entryValue);
}

export function toOwnerNode(node: Node) {
  return (node as any).ownerElement || node.parentNode;
}

export function errorMsgEmptyNode(node: Node) {
  return ('Expected an expression in “' + node.nodeName +
    '” and got an <empty string>.');
}

export function errorMsgNodeValue(node: Node) {
  return ('Expected an expression in “' + node.nodeName +
    '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
}

export const WIN = window;
export const DOM = document;
export const ANCHOR = createEl('a').build();