export const http = (input: RequestInfo, init?: RequestInit) => fetch(input, init);

export const code = (len?: number, prefix?: string, sufix?: string) => {
  const alpha = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerAlt = false, out = '';
  for (let i = 0; i < (len || 8); i++) {
    let pos = Math.floor(Math.random() * alpha.length);
    out += lowerAlt ? alpha[pos].toLowerCase() : alpha[pos];
    lowerAlt = !lowerAlt;
  }
  return ((prefix || "") + out + (sufix || ""));
}

export const isNull = (input: any) => {
  return (typeof input === 'undefined') || (input === undefined || input === null);
}

export const isObject = (input: any) => {
  return (typeof input === 'object') && (String(input) === '[object Object]');
}

export const isNode = (input: any) => {
  return (input instanceof Node);
}

export const isFilledObj = (input: any) => {
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

export const isPrimitive = (input: any): boolean => {
  return (
    typeof input === 'string' ||
    typeof input === 'number' ||
    typeof input === 'symbol' ||
    typeof input === 'boolean'
  )
}

export const isString = (input: any) => {
  return (typeof input !== 'undefined') && (typeof input === 'string');
}

export const isEmptyObject = (input: any) => {
  if (!input || !isObject(input)) return true;
  return Object.keys(input).length === 0;
}

export const isFunction = (input: any) => {
  return typeof input === 'function';
}

export const trim = (value: string) => {
  return value ? value.trim() : value;
}

export const toLower = (str: string) => {
  return str.toLowerCase();
}

export const toUpper = (str: string) => {
  return str.toUpperCase;
}

export const toStr = (input: any) => {
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

export const objectDesign = (obj: object, options: object) => {
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

export const defineProperty = <TObject>(object: TObject, property: string, descriptor: PropertyDescriptor) => {
  Object.defineProperty(object, property, descriptor);
  return object;
}

export const transferProperty = <TSourceObject, TDestinationObject>(dest: TSourceObject, src: TDestinationObject, name: string) => {
  defineProperty(dest, name, getDescriptor(src, name) as PropertyDescriptor);
}

export const getDescriptor = <TObject>(obj: TObject, prop: string) => {
  return Object.getOwnPropertyDescriptor(obj, prop);
}

export const findAttribute = (element: Element, attributesToCheck: Array<string>, removeIfFound: boolean = false): Attr | null => {
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

export const forEach = <TArray>(iterable: TArray[], callback?: (item: TArray, index: number) => void, context?: object) => {
  for (let index = 0; index < iterable.length; index++) {
    if (isFunction(callback))
      callback!.call(context, iterable[index], index)
  }
}

export const toArray = <TArray>(array: TArray[], callback?: (item: TArray, index: number) => void, context?: object) => {
  if (!array) return [];
  array = [].slice.call(array);

  if (isFunction(callback))
    forEach(array, callback, context);

  return array;
}

export const createEl = <TKey extends keyof HTMLElementTagNameMap>(
  elName: TKey,
  callback?: (element: HTMLElementTagNameMap[TKey], dom: Document) => void) => {
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

export const chain = (message: string, buitMessage?: string) => {
  let builtMessageJoint: string = (message + (isNull(buitMessage) ? '' : '\n\t'));
  return {
    chain: (message: string) => chain(message, builtMessageJoint),
    buid: () => builtMessageJoint
  }
}

export const mapper = (source: object, destination: object) => {
  forEach(Object.keys(source), key => {
    const sourceAsAny = source as any;
    const destinationAsAny = destination as any;
    const sourceValue = sourceAsAny[key];

    if (key in destinationAsAny) {
      if (isObject(sourceValue))
        return mapper(sourceValue, destinationAsAny[key]);
      return destinationAsAny[key] = sourceValue;
    }

    transferProperty(destination, source, key);
  });
}

/**
 * Used to Bind the `isConnected` property of a node to another
 * in order to avoid binding cleanup where the element is not in the DOM
 */
export const connectNode = (node: Node, nodeToConnectWith: Node) => {
  defineProperty(node, 'isConnected', { get: () => nodeToConnectWith.isConnected });
  return node;
}

export const urlResolver = (url: string) => {
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
    anchor: anchor,
    origin: ''
  };

  $return.origin = $return.protocol + '://' + $return.host;
  return $return;
}

export const urlCombine = (base: string, ...parts: string[]) => {
  let baseSplitted = base.split(/\/\//)
  let protocol = baseSplitted[0] + '//';
  let baseUrl = baseSplitted[1].split(/\//);
  let remain: string[] = [];

  forEach(baseUrl, p => trim(p) ? remain.push(p) : null);
  forEach(parts, part => forEach(part.split(/\//),
    p => trim(p) ? remain.push(p) : null));

  return protocol + remain.join('/')
}

export const buildError = (error: any, options?: {}) => {
  error.stack = '';
  return error;
}

export const DOM = document;
export const GLOBAL = globalThis;
export const anchor = createEl('a').build();
export const taskRunner = setInterval;
