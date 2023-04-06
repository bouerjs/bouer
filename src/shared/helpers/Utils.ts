
// Quotes “'+  +'”

import dynamic from '../../definitions/types/Dynamic';
import Logger from '../logger/Logger';
import Prop from './Prop';

export function webRequest(url: string, options?: {
  body?: any;
  headers?: object;
  method?: string;
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
    const initAsAny = (options || {}) as any;
    const value = initAsAny[key];
    if (value) return value;
    return mDefault;
  };

  const headers = getOption('headers', {});
  const method = getOption('method', 'get');
  const body = getOption('body', undefined);
  const xhr = createXhr(method);

  type IResponse = {
    url: string,
    ok: boolean,
    status: number,
    statusText: string,
    headers: object,
    json(): Promise<object>,
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

export function forEach<T>(
  iterable: T[],
  callback?: (item: T, index: number) => void,
  context?: object
) {
  for (let index = 0; index < iterable.length; index++) {
    if (isFunction(callback))
      callback!.call(context, iterable[index], index);
  }
}

export function where<T>(
  iterable: T[],
  callback?: (item: T, index: number) => any,
  context?: object
) {
  const out: T[] = [];
  for (let index = 0; index < iterable.length; index++) {
    const item = iterable[index];
    if (isFunction(callback) && callback!.call(context, item, index)) {
      out.push(item);
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

export function getRootElement(el: Element) {
  return (el as any).root || el;
}

export function copyObject<TObject extends dynamic>(object: TObject) {
  const out: dynamic = Object.create(object.__proto__);
  forEach(Object.keys(object), key => out[key] = object[key]);
  return out as TObject;
}

export const WIN = window;
export const DOM = document;
export const anchor = $CreateEl('a').build();