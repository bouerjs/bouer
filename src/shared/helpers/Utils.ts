
/* Quotes “"+  +"” */
/* From: \\"" (.*?) "\\" to: “" $1 "” */
import { dynamic } from "../../types/dynamic";
import Logger from "../logger/Logger";

export function http(input: RequestInfo, init?: RequestInit) { return fetch(input, init) }

export function code(len?: number, prefix?: string, sufix?: string) {
  const alpha = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerAlt = false, out = '';
  for (let i = 0; i < (len || 8); i++) {
    let pos = Math.floor(Math.random() * alpha.length);
    out += lowerAlt ? alpha[pos].toLowerCase() : alpha[pos];
    lowerAlt = !lowerAlt;
  }
  return ((prefix || "") + out + (sufix || ""));
}

export function isNull(input: any) {
  return (typeof input === 'undefined') || (input === undefined || input === null);
}

export function isObject(input: any) {
  return (typeof input === 'object') && (String(input) === '[object Object]');
}

export function isNode(input: any) {
  return (input instanceof Node);
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
  )
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

export function trim(value: string) {
  return value ? value.trim() : value;
}

export function startWith(value: string, pattern: string) {
  return (value.substr(0, pattern.length) === pattern);
}

export function toLower(str: string) {
  return str.toLowerCase();
}

export function toUpper(str: string) {
  return str.toUpperCase;
}

export function toStr(input: any) {
  if (isPrimitive(input)) {
    return String(input);
  } else if (isObject(input)) {
    return JSON.stringify(input);
  } else if (isFunction(input.toString)) {
    return input.toString();
  } else {
    return String(input);
  }
}

export function objectDesign(obj: object, options: object) {
  obj = obj || {};
  options = options || {};

  forEach(Object.keys(options), key => {
    const mObj = obj as any;
    const sKey = key as string;
    if (isNull(mObj[sKey]))
      transferProperty(obj, options, sKey);
  });
  return obj;
}

export function defineProperty<TObject>(object: TObject, property: string, descriptor: PropertyDescriptor) {
  Object.defineProperty(object, property, descriptor);
  return object;
}

export function transferProperty<TSourceObject, TDestinationObject>(dest: TSourceObject, src: TDestinationObject, name: string) {
  defineProperty(dest, name, getDescriptor(src, name) as PropertyDescriptor);
}

export function getDescriptor<TObject>(obj: TObject, prop: string) {
  return Object.getOwnPropertyDescriptor(obj, prop);
}

export function findAttribute(element: Element, attributesToCheck: Array<string>, removeIfFound: boolean = false): Attr | null {
  let res: Attr | null = null;

  if (!element) return null;

  for (const attrName of attributesToCheck) {
    const flexibleName: any = attrName;
    if (res = element.attributes[flexibleName])
      break;
  }

  if (!isNull(res) && removeIfFound)
    element.removeAttribute(res!.name);

  return res;
}

export function forEach<TArray>(iterable: TArray[], callback?: (item: TArray, index: number) => void, context?: object) {
  for (let index = 0; index < iterable.length; index++) {
    if (isFunction(callback))
      callback!.call(context, iterable[index], index)
  }
}

export function toArray<TArray>(array: TArray[], callback?: (item: TArray, index: number) => void, context?: object) {
  if (!array) return [];
  array = [].slice.call(array);

  if (isFunction(callback))
    forEach(array, callback, context);

  return array;
}



export function createAnyEl(elName: string,
  callback?: (element: HTMLElement, dom: Document) => void) {
  const el = DOM.createElement(elName);
  if (isFunction(callback)) callback!(el, DOM);

  const returnObj = {
    appendTo: (target: Element) => {
      target.appendChild(el);
      return returnObj;
    },
    build: () => el
  }
  return returnObj;
}

export function createEl<TKey extends keyof HTMLElementTagNameMap>(
  elName: TKey,
  callback?: (element: HTMLElementTagNameMap[TKey], dom: Document) => void) {
  const el = DOM.createElement(elName);
  if (isFunction(callback)) callback!(el, DOM);

  const returnObj = {
    appendTo: (target: Element) => {
      target.appendChild(el);
      return returnObj;
    },
    build: () => el
  }
  return returnObj;
}

export function mapper(source: dynamic, destination: dynamic) {
  forEach(Object.keys(source), key => {
    const sourceValue = source[key];

    if (key in destination) {
      if (isObject(sourceValue))
        return mapper(sourceValue, destination[key]);
      return destination[key] = sourceValue;
    }

    transferProperty(destination, source, key);
  });
}

/**
 * Used to Bind the `isConnected` property of a node to another
 * in order to avoid binding cleanup where the element is not in the DOM
 */
export function connectNode(node: Node, nodeToConnectWith: Node) {
  defineProperty(node, 'isConnected', { get: () => nodeToConnectWith.isConnected });
  return node;
}

export function urlResolver(url: string) {
  let href = url;
  // Support: IE 9-11 only, /* doc.documentMode is only available on IE */
  if ('documentMode' in DOM) {
    anchor.setAttribute('href', href);
    href = anchor.href;
  }

  anchor.setAttribute('href', href);
  let hostname = anchor.hostname;
  const ipv6InBrackets = anchor.hostname === '[::1]'

  if (!ipv6InBrackets && hostname.indexOf(':') > -1)
    hostname = '[' + hostname + ']';

  let $return = {
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

  return protocol + partsToJoin.join('/')
}

export function buildError(error: any, options?: dynamic) {
  error.stack = '';
  return error;
}

export function optionsResolver<TOptions>(options: dynamic, fakeInstance: TOptions, source: string) {
  forEach(Object.keys(options), key => {
    if (!(key in fakeInstance)) {
      delete options[key]
      Logger.warn("Unknown “" + key + "” property provided in “" + source + "” options, " +
        "consider removing it to make this message disappear.")
    }
  });
}

export const DOM = document;
export const GLOBAL = globalThis;
export const anchor = createEl('a').build();
export const taskRunner = setInterval;
