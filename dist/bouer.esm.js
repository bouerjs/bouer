/*!
 * Bouer.js v3.3.0
 * Copyright Easy.js 2018-2020 | 2021-2026 Afonso Matumona
 * Released under the MIT License.
 */
var Logger = (function Logger() {
  const prefix = '[Bouer]';
  return {
    log(l) {
      console.log(prefix, l);
    },
    error(e) {
      console.error(prefix, e);
    },
    warn(w) {
      console.warn(prefix, w);
    },
    info(i) {
      console.info(prefix, i);
    }
  };
})();
class ReactiveEvent {
  static on(eventName, callback) {
    if (isNull(this.events[eventName]))
      this.events[eventName] = [];
    this.events[eventName].push(callback);
    return {
      eventName: eventName,
      callback: callback,
      off: () => ReactiveEvent.off(eventName, callback)
    };
  }
  static off(eventName, callback) {
    const events = this.events[eventName] || [];
    events.splice(events.indexOf(callback), 1);
    return true;
  }
  static once(eventName, callback) {
    const event = {};
    const mEvent = ReactiveEvent.on(eventName, (descriptor) => {
      if (event.onemit)
        event.onemit(descriptor);
    });
    try {
      callback(event);
    } catch (error) {
      Logger.error(buildError(error));
    } finally {
      ReactiveEvent.off(eventName, mEvent.callback);
    }
  }
  static emit(eventName, descriptor) {
    try {
      forEach((this.events[eventName] || []), evt => evt(descriptor));
    } catch (error) {
      Logger.error(buildError(error));
    }
  }
}
ReactiveEvent.events = {};
class Computed {
  constructor(entryValue) {
    this.entryValue = entryValue;
    this.context = undefined; // To avoid errors
  }
  configure() {
    if (this.$get || this.$set)
      return {
        get: this.$get,
        set: this.$set
      };
    const entryValue = this.entryValue;
    const isFunctionEntry = typeof entryValue === 'function';
    const value = isFunctionEntry ?
      entryValue.call(this.context) :
      entryValue;
    if (isNull(value))
      throw new Error('Invalid value used as return in property ' + this.propName + ': “function $computed(){...}” | “new Computed(...)”.');
    const isExplicit = isObject(value) && (('get' in value) || ('set' in value));
    this.$get = ((isExplicit && 'get' in value) ? value.get : (function() {
      return isFunctionEntry ? entryValue.call(this) : value;
    })).bind(this.context);
    this.$set = ((isExplicit && 'set' in value) ? value.set : (function(v) {})).bind(this.context);
    return {
      get: this.$get,
      set: this.$set
    };
  }
  __(options) {
    this.context = options.context;
    this.propName = options.propName;
    this.srcObject = options.propSource;
  }
  get() {
    return this.configure().get();
  }
  set(value) {
    this.configure().set(value);
  }
}
var Prop = (function Prop() {
  return {
    /**
     * Sets a property to an object
     * @param {object} obj the object to set the property
     * @param {string} propName the property name to be set
     * @param {object} descriptor the descriptor of the object
     * @returns the object with the new property
     */
    set(obj, propName, descriptor) {
      const _obj = obj;
      // If the property is not defined
      if (!(propName in _obj))
        _obj[propName] = undefined;
      return Object.defineProperty(obj, propName, descriptor);
    },
    /**
     * Retrieves the descriptor of an property
     * @param {object} obj the object where the descriptor will be retrieved
     * @param {string} propName the property name
     * @returns the property descriptor or undefined
     */
    descriptor(obj, propName) {
      return Object.getOwnPropertyDescriptor(obj, propName);
    },
    /**
     * Makes a deep copy of a property from an object to another
     * @param {object} destination the destination object
     * @param {object} source the source object
     * @param {string} propName the property to be transfered
     */
    transfer(destination, source, propName) {
      const setter = (prop) => {
        const descriptor = this.descriptor(source, prop);
        this.set(destination, propName, descriptor);
      };
      if (Array.isArray(propName)) {
        propName.forEach(prop => setter(prop));
        return;
      }
      setter(propName);
    }
  };
})();
class Watch {
  /**
   * Default constructor
   * @param {object} descriptor the reactive descriptor instance
   * @param {Function} callback the callback that will be called on change
   * @param {object?} options watch options where the node and onDestroy function are provided
   */
  constructor(descriptor, callback, options) {
    /**
     * Destroys/Stop the watching process
     */
    this.destroy = () => {
      const watchIndex = this.descriptor.watches.indexOf(this);
      if (watchIndex !== -1)
        this.descriptor.watches.splice(watchIndex, 1);
      (this.onDestroy || (() => {}))();
    };
    this.descriptor = descriptor;
    this.property = descriptor.propName;
    this.callback = callback;
    if (options) {
      this.node = options.node;
      this.onDestroy = options.onDestroy;
    }
  }
}
class Reactive {
  /**
   * Default constructor
   * @param {object} options the options of the reactive instance
   */
  constructor(options) {
    this._IRT_ = true;
    this.watches = [];
    this.get = (function get() {
      ReactiveEvent.emit('BeforeGet', this);
      const value = this.propValue;
      ReactiveEvent.emit('AfterGet', this);
      return value;
    }).bind(this);
    this.set = (function set(value) {
      if (this.propValue === value || (Number.isNaN(this.propValue) && Number.isNaN(value)))
        return;
      this.propValueOld = this.propValue;
      ReactiveEvent.emit('BeforeSet', this);
      if (isObject(value) || Array.isArray(value)) {
        // Checking the type
        if (this.propValue != null && (typeof this.propValue) !== (typeof value))
          return Logger.error(('Cannot set “' + (typeof value) + '” in “' +
            this.propName + '” property.'));
        // Checking if the value is null
        if (isNull(this.propValue))
          return;
        // Transform if it is not an html element
        if (this.propValue instanceof Node)
          this.propValue = value;
        else
          Reactive.transform({
            data: value,
            descriptor: this,
            context: this.context
          });
        if (Array.isArray(value))
          this.propValue = value;
        mapper(value, this.propValue);
      } else {
        this.propValue = value;
      }
      ReactiveEvent.emit('AfterSet', this);
      this.notify();
    }).bind(this);
    this.propName = options.propName;
    this.propSource = options.srcObject;
    this.context = options.context;
    // Setting the value of the property
    this.baseDescriptor = Prop.descriptor(this.propSource, this.propName);
    this.propValue = this.baseDescriptor.value;
    const propValue = this.propValue;
    const isFn = typeof propValue === 'function';
    // If the value is a function, we bind it to the context
    if (isFn)
      this.propValue = propValue.bind(this.context);
    const isComputed = isFn && propValue.name === '$computed' ||
      propValue instanceof Computed;
    if (isComputed) {
      this.computed = isObject(propValue)
        // If the value is an object, we assume it's a computed object
        ?
        propValue
        // If the value is a function, we assume it's a computed function
        :
        new Computed(propValue);
      // Adding the context
      this.computed.__({
        context: this.context,
        propName: this.propName,
        propSource: this.propSource
      });
      this.propValueOld = this.propValue;
      this.propValue = undefined;
      // PropValue interceptor
      Prop.set(this, 'propValue', {
        get: () => {
          return fnCallResolver(this.computed.get());
        },
        set: (v) => {
          if (isNull(this.computed.set))
            return;
          fnCallResolver(this.computed.set(v));
        },
      });
    }
  }
  /**
   * Force onChange callback calling
   */
  notify() {
    const isObj = isObject(this.propValue);
    // Running all the watches
    forEach(this.watches, w => {
      // Remapping the binding from the parents to the children properties
      const reactiveEvent = isObj ? ReactiveEvent.on('AfterGet', descriptor => {
        if (w.property === descriptor.propName)
          return;
        const parentWatch = w;
        // If it's already bound, ignore
        if (descriptor.watches.indexOf(parentWatch) != -1)
          return;
        // Assotiating the child property with the parent watch
        descriptor.watches.push(w);
      }) : {
        off: () => {}
      };
      w.callback.call(this.context, this.propValue, this.propValueOld);
      reactiveEvent.off();
    });
  }
  /**
   * Subscribe an event that should be performed on property value change
   * @param {Function} callback the callback function that will be called
   * @param {Node?} node the node that should be attached (Optional)
   * @returns A watch instance object
   */
  onChange(callback, node) {
    const w = new Watch(this, callback, {
      node: node
    });
    this.watches.push(w);
    return w;
  }
}
/**
 * Tranform a Object Litertal to a an Object with reactive properties
 * @param {object} options the options for object transformation
 * @returns the object transformed
 */
Reactive.transform = (options) => {
  const context = options.context;
  let tranformedData = new WeakSet();
  const executer = (data, descriptor, keys) => {
    if (Array.isArray(data)) {
      if (descriptor == null) {
        Logger.warn('Cannot transform this array to a reactive one because no reactive object was provided');
        return data;
      }
      // Checking if the array has already been transformed
      if (tranformedData.has(data))
        return data;
      tranformedData.add(data);
      const REACTIVE_ARRAY_METHODS = ['push', 'pop', 'unshift', 'shift', 'splice'];
      const inputArray = data;
      const reference = {}; // Using clousure to cache the array methods
      Object.setPrototypeOf(inputArray, Object.create(Array.prototype));
      const prototype = Object.getPrototypeOf(inputArray);
      forEach(REACTIVE_ARRAY_METHODS, method => {
        // cache original method
        reference[method] = inputArray[method].bind(inputArray);
        // changing to the reactive one
        prototype[method] = function reactive() {
          const oldArrayValue = inputArray.slice();
          const args = [].slice.call(arguments);
          switch (method) {
            case 'push':
            case 'unshift':
              forEach(toArray(args), (arg) => {
                if (!isObject(arg) && !Array.isArray(arg))
                  return;
                executer(arg);
              });
          }
          const result = reference[method].apply(inputArray, args);
          forEach(descriptor.watches, watch => watch.callback.call(context, inputArray, oldArrayValue, {
            method: method,
            args: args
          }));
          return result;
        };
      });
      return inputArray;
    }
    if (!isObject(data))
      return data;
    // Checking if the array has already been transformed
    if (tranformedData.has(data))
      return data;
    tranformedData.add(data);
    forEach(keys || Object.keys(data), key => {
      const mInputObject = data;
      // Already a reactive property, do nothing
      if (!('value' in Prop.descriptor(data, key)))
        return;
      const propValue = mInputObject[key];
      if ((propValue instanceof Object) && ((propValue._IRT_) || (propValue instanceof Node)))
        return;
      const descriptor = new Reactive({
        propName: key,
        srcObject: data,
        context: context
      });
      Prop.set(data, key, descriptor);
      // If the value is a computed object, do nothing
      if (isObject(propValue) && propValue instanceof Computed)
        return;
      if (Array.isArray(propValue)) {
        executer(propValue, descriptor); // Transform the array to a reactive one
        forEach(propValue, (item) => executer(item));
      } else if (isObject(propValue))
        executer(propValue);
    });
    return data;
  };
  executer(options.data, options.descriptor, options.keys);
  tranformedData = new WeakSet();
  return options.data;
};
class Ref {
  constructor(value) {
    this._IRT_ = true;
    this.value = value;
    this.name = undefined;
    this.context = undefined;
  }
  get() {
    return this.value;
  }
  set(value) {
    this.value = value;
  }
  __(...args) {
    if (args.length == 0)
      return;
    this.name = args[0];
    this.context = args[1];
    if (this.name == undefined || this.context == undefined)
      return;
    Reactive.transform({
      context: this.context,
      keys: ['value'],
      data: this
    });
  }
}
// Quotes “'+  +'”
function webRequest(url, options) {
  if (!url)
    return Promise.reject(new Error('Invalid Url'));
  const createXhr = (method) => {
    if (DOM.documentMode && (!method.match(/^(get|post)$/i) || !WIN.XMLHttpRequest)) {
      return new WIN.ActiveXObject('Microsoft.XMLHTTP');
    } else if (WIN.XMLHttpRequest) {
      return new WIN.XMLHttpRequest();
    }
    throw new Error('This browser does not support XMLHttpRequest.');
  };
  const getOption = (key, mDefault) => {
    const mOptions = (options || {});
    const value = mOptions[key];
    if (value)
      return value;
    return mDefault;
  };
  const headers = getOption('headers', {});
  const method = getOption('method', 'get');
  const body = getOption('body', undefined);
  const beforeSend = getOption('body', (xhr) => {});
  const xhr = createXhr(method);
  return new Promise((resolve, reject) => {
    const createResponse = (mFunction, ok, status, xhr, response) => {
      mFunction({
        url: url,
        ok: ok,
        status: status,
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

function code(len, prefix, sufix) {
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

function isNull(input) {
  return (typeof input === 'undefined') || (input === undefined || input === null);
}

function isObject(input) {
  return (typeof input === 'object') && (String(input) === '[object Object]');
}

function isFilledObj(input) {
  if (isEmptyObject(input))
    return false;
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

function isPrimitive(input) {
  return (typeof input === 'string' ||
    typeof input === 'number' ||
    typeof input === 'symbol' ||
    typeof input === 'boolean');
}

function isString(input) {
  return (typeof input !== 'undefined') && (typeof input === 'string');
}

function isEmptyObject(input) {
  if (!input || !isObject(input))
    return true;
  return Object.keys(input).length === 0;
}

function isFunction(input) {
  return typeof input === 'function';
}

function isRef(input) {
  return input instanceof Ref && typeof input.__ === 'function';
}

function isComputed(input) {
  return input instanceof Computed && typeof input.__ === 'function';
}

function ifNullReturn(v, _return) {
  return isNull(v) ? _return : v;
}

function ifNullStop(el) {
  if (isNull(el))
    throw new Error('Application is not initialized');
  return el;
}

function trim(value) {
  return value ? value.trim() : value;
}

function startWith(value, pattern) {
  return (value.substring(0, pattern.length) === pattern);
}

function toLower(str) {
  return str.toLowerCase();
}

function toPascalCase(value) {
  return value[0].toUpperCase() + value.substring(1);
}

function toStr(input) {
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

function forEach(iterable, callback, context) {
  for (let i = 0; i < iterable.length; i++) {
    callback.call(context, iterable[i], i);
  }
}

function where(iterable, callback, context) {
  const out = [];
  for (let i = 0; i < iterable.length; i++) {
    if (callback.call(context, iterable[i], i)) {
      out.push(iterable[i]);
    }
  }
  return out;
}

function findOneBy(iterable, callback, context) {
  for (let i = 0; i < iterable.length; i++) {
    if (callback.call(context, iterable[i], i)) {
      return iterable[i];
    }
  }
  return null;
}

function toArray(array) {
  if (!array)
    return [];
  return [].slice.call(array);
}

function createComment(id, content) {
  const comment = DOM.createComment(content || ' e ');
  comment.id = id || code(8);
  return comment;
}

function createEl(elName, callback) {
  const el = DOM.createElement(elName);
  if (isFunction(callback))
    callback(el, DOM);
  const returnObj = {
    appendTo: (target) => {
      target.appendChild(el);
      return returnObj;
    },
    build: () => el,
    child: () => el.children[0],
    children: () => [].slice.call(el.childNodes),
  };
  return returnObj;
}

function removeEl(el) {
  const parent = el.parentNode;
  if (parent)
    parent.removeChild(el);
}

function mapper(source, destination) {
  let map = new WeakSet();

  function walker(source, destination) {
    if (map.has(source))
      return;
    map.add(source);
    forEach(Object.keys(source), key => {
      const sourceValue = source[key];
      // If the key already in the destination, set
      if ((key in destination)) {
        // If the source value is an object
        if (isObject(sourceValue)) {
          return walker(sourceValue, destination[key]);
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

function urlResolver(url) {
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

function urlCombine(base, ...parts) {
  const baseSplitted = base.split(/\/\//);
  const protocol = baseSplitted.length > 1 ? (baseSplitted[0] + '//') : '';
  const uriRemain = protocol === '' ? baseSplitted[0] : baseSplitted[1];
  const uriRemainParts = uriRemain.split(/\//);
  const partsToJoin = [];
  forEach(uriRemainParts, p => trim(p) ? partsToJoin.push(p) : null);
  forEach(parts, part => forEach(part.split(/\//), p => trim(p) ? partsToJoin.push(p) : null));
  return protocol + partsToJoin.join('/');
}
/**
 * Relative path resolver
 * @param { string } relative the path of the actual path
 * @param { string } path the actual path
 * @returns { string } path with ./resolved-path
 */
function pathResolver(relative, path) {
  const isCurrentDir = (v) => v.substring(0, 2) === './';
  const isParentDir = (v) => v.substring(0, 3) === '../';
  const toDirPath = (v) => {
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
  parts.push((function pathLookUp(value) {
    if (!isParentDir(value))
      return value;
    parts.pop();
    return pathLookUp(value.substring(3));
  })(path));
  return parts.join('/');
}

function buildError(error) {
  if (!error)
    return 'Unknown Error';
  error.stack = '';
  return error;
}

function $default(input, ...remains) {
  return input;
}

function fnCallResolver(fn, cb) {
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
      if (typeof cb === 'function')
        cb(value);
      return value;
    });
  }
  cb(fnValue);
  return fnValue;
}

function findAttribute(element, attrs, removeIfFound = false) {
  let res = null;
  if (!element)
    return null;
  for (let i = 0; i < attrs.length; i++)
    if (res = element.attributes[attrs[i]])
      break;
  if (!isNull(res) && removeIfFound)
    element.removeAttribute(res.name);
  return res;
}

function findDirective(node, name) {
  const attributes = node.attributes || [];
  return attributes.getNamedItem(name) ||
    toArray(attributes).find((attr) => (attr.name === name || startWith(attr.name, name + ':')));
}

function getRootElement(el) {
  return el.root || el;
}

function setData(context, inputData, targetObject) {
  if (isNull(targetObject))
    targetObject = context.data;
  if (!isObject(inputData)) {
    Logger.error('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".');
    return targetObject;
  }
  if (isObject(targetObject) && targetObject == null) {
    Logger.error('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".');
    return inputData;
  }
  // Transforming the input
  Reactive.transform({
    data: inputData,
    context: context
  });
  // Transfering the properties
  forEach(Object.keys(inputData), key => {
    let source;
    let destination;
    ReactiveEvent.once('AfterGet', evt => {
      evt.onemit = descriptor => source = descriptor;
      Prop.descriptor(inputData, key).get();
    });
    ReactiveEvent.once('AfterGet', evt => {
      evt.onemit = descriptor => destination = descriptor;
      const desc = Prop.descriptor(targetObject, key);
      if (desc && isFunction(desc.get))
        desc.get();
    });
    Prop.transfer(targetObject, inputData, key);
    if (!destination || !source)
      return;
    // Adding the previous watches to the property that is being set
    forEach(destination.watches, watch => {
      if (source.watches.indexOf(watch) === -1)
        source.watches.push(watch);
    });
    // Notifying the bounds and watches
    source.notify();
  });
  return targetObject;
}

function $computed(entryValue) {
  return new Computed(entryValue);
}

function toOwnerNode(node) {
  return node.ownerElement || node.parentNode;
}

function errorMsgEmptyNode(node) {
  return ('Expected an expression in “' + node.nodeName +
    '” and got an <empty string>.');
}

function errorMsgNodeValue(node) {
  return ('Expected an expression in “' + node.nodeName +
    '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
}
const WIN = window;
const DOM = document;
const ANCHOR = createEl('a').build();
class DelimiterHandler {
  constructor(bouer, delimiters) {
    this.delimiters = [];
    this.bouer = bouer;
    this.delimiters = delimiters;
  }
  add(item) {
    this.delimiters.push(item);
  }
  remove(name) {
    const index = this.delimiters.findIndex(item => item.name === name);
    this.delimiters.splice(index, 1);
  }
  run(content) {
    if (isNull(content) || trim(content) === '')
      return [];
    let mDelimiter = null;
    const checkContent = (text, flag) => {
      const center = '([\\S\\s]*?)';
      for (let i = 0; i < this.delimiters.length; i++) {
        const item = this.delimiters[i];
        const result = text.match(new RegExp(item.delimiter.open + center + item.delimiter.close, flag || ''));
        if (result) {
          mDelimiter = item;
          return result;
        }
      }
    };
    const result = checkContent(content, 'g');
    if (!result)
      return [];
    return result.map(item => {
      const matches = checkContent(item);
      const delimiterField = matches[0];
      const delimiterExpression = matches[1];
      // Composing the expression: price | currency:$ -> [ price, currency:$ ]
      const expressionComposed = delimiterExpression.trim().split(' | ').map(e => trim(e));
      // Extracting the field only
      const expression = expressionComposed.shift();
      // Builing the pipes structure
      const pipes = expressionComposed.map(e => {
        // currency:$ -> currency [ $ ]
        const args = e.split(':');
        const fn = args.shift();
        return {
          fn: fn,
          args: args
        };
      });
      return {
        field: delimiterField,
        expression: trim(expression),
        delimiter: mDelimiter,
        pipes: pipes
      };
    });
  }
  shorthand(attrName) {
    if (isNull(attrName) || trim(attrName) === '')
      return null;
    const match = attrName.match(new RegExp('{([\\w{$,-}]*?)}'));
    if (!match)
      return null;
    return this.run('{{' + trim(match[1]) + '}}')[0];
  }
}
var Extend = (function Extend() {
  const obj = (...args) => {
    const out = {};
    forEach(args, arg => {
      if (isNull(arg))
        return;
      forEach(Object.keys(arg), key => {
        Prop.transfer(out, arg, key);
      });
    });
    return out;
  };
  const mixin = (out, ...args) => {
    // Props to mix with out object
    const props = obj.apply({}, args);
    forEach(Object.keys(props), key => {
      const hasOwnProp = key in out;
      Prop.transfer(out, props, key);
      if (hasOwnProp) {
        const mOut = out;
        mOut[key] = $default(mOut[key]);
      }
    });
    return out;
  };
  const array = (...args) => {
    const out = [];
    forEach(args, arg => {
      if (isNull(arg))
        return;
      if (!Array.isArray(arg))
        return out.push(arg);
      forEach(Object.keys(arg), (key) => {
        const value = arg[key];
        if (isNull(value))
          return;
        if (Array.isArray(value))
                    [].push.apply(out, value);
        else
          out.push(value);
      });
    });
    return out;
  };
  const matcher = (t1, t2) => {
    const exec = (src, dst) => {
      forEach(Object.keys(src), key => {
        if (key in dst)
          return;
        const hasOwnProp = key in src;
        Prop.transfer(dst, src, key);
        if (hasOwnProp) {
          src[key] = $default(src[key]);
        }
      });
    };
    exec(t1, t2);
    exec(t2, t1);
  };
  return {
    /**
     * Combines different object into a new one
     * @param {object} args Objects to be combined
     * @returns A new object having the properties of all the objects
     */
    obj,
    /**
     * Adds properties to the first object provided
     * @param {object} out the object that should be added all the properties from the other one
     * @param {object} args the objects where the properties should be extracted from
     * @returns the first object with all the new properties added on
     */
    mixin,
    /**
     * Combines different arrays into a new one
     * @param {object} args arrays to be combined
     * @returns a new arrat having the items of all the arrays
     */
    array,
    /**
     * transfers the props of first object to the second and the seconds to the first
     * @param {object} t1 the first object
     * @param {object} t2 the second object
     */
    matcher,
  };
})();
class Evaluator {
  constructor(bouer) {
    this.bouer = bouer;
  }
  eval(code, context) {
    // Executing the expression
    try {
      Function(code).call(context || this.bouer);
    } catch (error) {
      Logger.error(buildError(error));
    }
  }
  exec(opts) {
    const dataToUse = Extend.obj((this.bouer.globalData || {}), (opts.aditional || {}), (opts.data || {}), {
      $root: this.bouer.data,
      $mixin: Extend.mixin
    });
    delete opts.data;
    opts.data = dataToUse;
    return Evaluator.run(opts);
  }
  static run(opts) {
    try {
      return new Function('var d$=arguments[0].d;return (function(){var r$;with(d$){' +
          (opts.returnable === false ? '' : 'r$=') + opts.code + '}return r$;}).apply(this, arguments[0].a)')
        .call(opts.context, {
          d: opts.data || {},
          a: opts.args
        });
    } catch (error) {
      Logger.error(buildError(error));
    }
  }
}
const Constants = {
  skip: 'e-skip',
  if: 'e-if',
  elseif: 'e-else-if',
  else: 'e-else',
  show: 'e-show',
  req: 'e-req',
  for: 'e-for',
  form: {
    property: 'e-form',
    schema: 'e-schema',
    build: 'e-build',
    abuild: 'e-build:array',
    array: 'e-array',
  },
  data: 'data',
  def: 'e-def',
  wait: 'wait-data',
  text: 'e-text',
  bind: 'e-bind',
  property: 'e-',
  skeleton: 'e-skeleton',
  route: 'route-view',
  href: ':href',
  entry: 'e-entry',
  on: 'on:',
  silent: '--s',
  slot: 'slot',
  ref: 'ref',
  put: 'e-put',
  builtInEvents: {
    add: 'add',
    compile: 'compile',
    request: 'request',
    response: 'response',
    fail: 'fail',
    done: 'done',
  },
  check(node, cmd) {
    if (node.nodeName in {
        [this.form.schema]: 1,
        'e-build': 1,
        'e-build:array': 1,
        'e-array': 1
      })
      return false;
    return startWith(node.nodeName, cmd);
  }
};
class Skeleton {
  constructor(bouer) {
    this._IRT_ = true;
    this.backgroudColor = '';
    this.waveColor = '';
    this.defaultBackgroudColor = '#E2E2E2';
    this.defaultWaveColor = '#ffffff5d';
    this.identifier = 'bouer';
    this.numberOfItems = 1;
    this.reset();
    this.bouer = bouer;
    this.style = createEl('style', el => el.id = this.identifier).build();
  }
  reset() {
    this.backgroudColor = this.defaultBackgroudColor;
    this.waveColor = this.defaultWaveColor;
  }
  init(color) {
    if (!this.style)
      return;
    if (!DOM.getElementById(this.identifier))
      DOM.head.appendChild(this.style);
    if (!this.style.sheet)
      return;
    for (let i = 0; i < this.style.sheet.cssRules.length; i++)
      this.style.sheet.deleteRule(i);
    if (color) {
      this.backgroudColor = color.background || this.defaultBackgroudColor;
      this.waveColor = color.wave || this.defaultWaveColor;
      this.numberOfItems = color.numberOfItems || this.numberOfItems;
    } else {
      this.reset();
    }
    const dir = Constants.skeleton;
    const bgc = this.backgroudColor;
    const wvc = this.waveColor;
    const rules = [
            '[--s]{ display: none!important; }',
            '[' + dir + '] { background-color: ' + bgc + '!important; position: relative!important; overflow: hidden; }',
            '[' + dir + '],[' + dir + '] * { color: transparent!important; }',
            '[' + dir + ']::before, [' + dir + ']::after { content: ""; position: absolute; top: 0; left: 0; right: 0; ' +
                'bottom: 0; display: block; }',
            '[' + dir + ']::before { background-color: ' + bgc + '!important; z-index: 1;}',
            '[' + dir + ']::after { transform: translateX(-100%); background: linear-gradient(90deg, transparent, ' + wvc +
                ', transparent); animation: loading 1.5s infinite; z-index: 2; }',
            '@keyframes loading { 100% { transform: translateX(100%); } }',
            '@-webkit-keyframes loading { 100% { transform: translateX(100%); } }'
        ];
    forEach(rules, rule => this.style.sheet.insertRule(rule));
    this.style.innerText = rules.join(' ');
  }
  insertItems(node) {
    const parentNode = node.parentElement || node.parentNode;
    const mNode = node;
    if (parentNode == null)
      return;
    if (this.numberOfItems <= 1)
      return;
    if (!mNode.hasAttribute('e-skeleton') && isNull(mNode.querySelector('[e-skeleton]')))
      return;
    const uid = code(6);
    node.setAttribute('skeleton-clone-code', uid);
    for (let i = 0; i < (this.numberOfItems - 1); i++) {
      const cloned = node.cloneNode(true);
      cloned.setAttribute('skeleton-cloned', uid);
      parentNode.insertBefore(cloned, node);
    }
  }
  clearItems(node) {
    const mNode = node;
    const container = (node.parentElement || node.parentNode);
    const uid = mNode.getAttribute('skeleton-clone-code');
    if (!uid)
      return;
    mNode.removeAttribute('skeleton-clone-code');
    forEach([].slice.call(container.querySelectorAll('[skeleton-cloned="' + uid + '"]')), node => {
      container.removeChild(node);
    });
  }
  clear(id) {
    id = (id ? ('="' + id + '"') : '');
    const appEl = ifNullStop(this.bouer.el);
    const skeletons = toArray(appEl.querySelectorAll('[' + Constants.skeleton + id + ']'));
    forEach(skeletons, (el) => el.removeAttribute(Constants.skeleton));
  }
}
/**
 * It's a **Service Provider** container with all the services that will be used in the application.
 */
var IoC = (function IoC() {
  let bouerId = 1;
  const globalApp = {
    isDestroyed: false
  };
  const serviceCollection = new WeakMap();
  const add = (app, ctor, params, isSingleton) => {
    if (app.isDestroyed)
      throw new Error('Application already disposed.');
    if (!serviceCollection.has(app))
      serviceCollection.set(app, new WeakMap());
    const collection = serviceCollection.get(app);
    collection.set(ctor, {
      ctor: ctor,
      isSingleton: ifNullReturn(isSingleton, false),
      args: params
    });
  };
  const resolve = (app, clazz) => {
    if (app.isDestroyed)
      throw new Error('Application already disposed.');
    const collection = serviceCollection.get(app);
    if (!collection)
      return null;
    const service = collection.get(clazz);
    if (service == null)
      return null;
    if (service.isSingleton) {
      if (service.instance)
        return service.instance;
      // Otherwise, creates the singleton instance
      return service.instance = newInstance(clazz, service.args, app);
    }
    return newInstance(clazz, service.args, app);
  };
  /**
   * Creates a new instance of a class provided
   * @param clazz the class that the new instance should be created
   * @param params the parameter list that will be injected in the constructor
   * @returns new intance of the class provided
   */
  const newInstance = (clazz, params, app) => {
    const paramsToProvide = [];
    const mParams = params || [];
    const data = {
      __ctor0: clazz
    };
    // Looping all the provided params of the class constructor
    forEach(mParams, (paramValue, index) => {
      // Creating a unique name for the argument
      const paramName = '__arg' + index;
      const paramValueAsAny = paramValue;
      // If the param is a class
      // eslint-disable-next-line no-prototype-builtins
      if (paramValue && paramValueAsAny.hasOwnProperty('prototype')) {
        if (app) {
          const paramInstance = resolve(app, paramValueAsAny);
          if (!isNull(paramValueAsAny)) {
            paramValue = paramInstance;
          } else {
            Logger.warn('Could not create an instance of ' + paramValueAsAny.name || paramValueAsAny +
              '. Make sure it is added as a service in IoC[.app].add(Service).');
          }
        } else {
          paramValue = null;
        }
      }
      // Setting the param name and value
      data[paramName] = paramValue;
      // Adding the unique name
      paramsToProvide.push(paramName);
    });
    // Creating a new instance according to above process
    return Evaluator.run({
      code: 'new __ctor0(' + paramsToProvide.join(',') + ')',
      data: data,
      returnable: true
    });
  };
  const clear = (app) => {
    return serviceCollection.delete(app);
  };
  return {
    /**
     * Adds a service to generic app
     * @param ctor the service that should be resolved future on
     * @param params the parameter that needs to be resolved every time the service is requested.
     * @param isSingleton mark the service as singleton to avoid creating an instance whenever it's requested
     */
    add(ctor, params, isSingleton) {
      return add(globalApp, ctor, (params || []), isSingleton);
    },
    /**
     * Resolves the Service with all it's dependencies
     * @param ctor the class the needs to be resolved
     * @returns the instance of the class resolved
     */
    resolve(ctor) {
      return resolve(globalApp, ctor);
    },
    /**
     * Defines the bouer app containing all the services that needs to be provided in this app
     * @param app the bouer instance
     * @returns all the available methods to perform
     */
    app(app) {
      return {
        /**
         * Adds a service to be provided in whole the app
         * @param ctor the service that should be resolved future on
         * @param params the parameter that needs to be resolved every time the service is requested.
         * @param isSingleton mark the service as singleton to avoid creating an instance whenever it's requested
         */
        add(ctor, params, isSingleton) {
          return add(app, ctor, (params || []), isSingleton);
        },
        /**
         * Resolves the Service with all it's dependencies
         * @param ctor the class the needs to be resolved
         * @returns the instance of the class resolved
         */
        resolve(ctor) {
          return resolve(app, ctor);
        },
        /**
         * Dispose all the added service of the current app
         */
        clear() {
          clear(app);
        }
      };
    },
    /**
     * Creates a new instance of a class provided
     * @param ctor the class that the new instance should be created
     * @param params the parameter list that will be injected in the constructor
     * @param app used to auto instantiate a parameter (DI Service), Optional if there isn't or
     *  we do not want to instantiate
     * @returns new intance of the class provided
     */
    new(ctor, params, app) {
      if (ctor instanceof Bouer) {
        Logger.error('Cannot create an instance of Bouer using IoC');
        return null;
      }
      return newInstance(ctor, (params || []), app);
    },
    /**
     * Generates a unique Id for the application
     * @returns The next integer from the last one generated
     */
    newId() {
      return bouerId++;
    }
  };
})();
var Task = (function Task() {
  return {
    run(callback, milliseconds) {
      const timerId = setInterval(() => {
        callback(() => clearInterval(timerId));
      }, milliseconds || 10);
    }
  };
})();
class FormSchema {
  constructor(options) {
    this.path = '';
    this.init(options);
    this.schema = $default();
    this.parent = options.scopeData.$form;
  }
  static isBuild(currentNode) {
    const cform = Constants.form;
    const attributes = currentNode.attributes;
    return (cform.build in attributes || cform.abuild in attributes) &&
      !currentNode.$$buildAddedInScope;
  }
  init(options) {
    const {
      currentNode,
      scopeData
    } = options;
    const cform = Constants.form;
    const attributes = currentNode.attributes;
    const node = currentNode;
    // Mark the element as already build
    node.$$buildAddedInScope = true;
    // Get the build value
    const attrBuild = findAttribute(node, [cform.build, cform.abuild]);
    if (attrBuild == null)
      return;
    let buildValue = attrBuild.nodeValue;
    // Check if the element is an array type
    if ((cform.array in attributes || cform.abuild in attributes)) {
      //Retrieve the actual index of the current element
      const parentElement = node.parentElement;
      const elements = Extend.array(toArray(parentElement.querySelectorAll(`*>[e-build\\:array="${attrBuild.value}"]`)), toArray(parentElement.querySelectorAll(`*>[e-build="${attrBuild.value}"][e-array]`)));
      buildValue += '[' + elements.indexOf(node) + ']';
    }
    const parent = this.parent = scopeData.$build;
    const parentPath = parent ? parent.path : '';
    // Build the path the path
    this.path = [parentPath, buildValue].filter(_ => _).join('.');
  }
  toPath(child) {
    // Build the path the path
    return [this.path, child].filter(_ => _).join('.');
  }
  get(child) {
    if (child == null || child == '')
      return undefined;
    return this.schema[child];
  }
}
class Routing {
  constructor(bouer) {
    this._IRT_ = true;
    this.routeView = null;
    this.activeAnchors = [];
    // Store `href` value of the <base /> tag
    this.base = null;
    this.bouer = bouer;
  }
  setRouteView(routeView) {
    if (!routeView || this.routeView)
      return;
    this.routeView = routeView;
    if (this.defaultPage)
      this.navigate(DOM.location.href);
    // Listening to the page navigation
    WIN.addEventListener('popstate', evt => {
      evt.preventDefault();
      this.navigate(((evt.state || {}).url || location.href), {
        setURL: false
      });
    });
  }
  /** Initialize the routing the instance */
  init() {
    const base = DOM.head.querySelector('base');
    if (base) {
      const baseHref = base.attributes.getNamedItem('href');
      if (!baseHref)
        return Logger.error('The href="/" attribute is required in base element.');
      this.base = baseHref.value;
    } else {
      this.base = '/';
    }
    const routeView = ifNullStop(this.bouer.el).querySelector('[route-view]');
    this.setRouteView(routeView);
  }
  /**
   * Navigates to a certain page without reloading all the page
   * @param {string} route the route to navigate to
   * @param {object?} options navigation options
   */
  navigate(route, options) {
    if (!this.routeView)
      return;
    if (isNull(route))
      return Logger.error('Invalid url provided to the navigation method.');
    route = trim(route);
    const resolver = urlResolver(route);
    const usehash = ifNullReturn(this.bouer.config.usehash, true);
    let navigatoTo = (usehash ? resolver.hash : resolver.pathname).split('?')[0];
    options = options || {};
    // In case of: /about/me/, remove the last forward slash
    if (navigatoTo[navigatoTo.length - 1] === '/')
      navigatoTo = navigatoTo.substring(0, navigatoTo.length - 1);
    const page = this.toPage(navigatoTo);
    this.clear();
    if (!page)
      return; // Page Not Found or Page Not Defined
    // If it's not found and the url matches .html do nothing
    if (!page && route.endsWith('.html'))
      return;
    const componentElement = createEl(page.name, el => {
        el.setAttribute('data', isObject(options.data) ? '$navigate' : '$data');
      }).appendTo(this.routeView)
      .build();
    // Document info configuration
    DOM.title = page.title || DOM.title;
    if (ifNullReturn(options.setURL, true))
      this.pushState(resolver.href, DOM.title);
    const routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route);
    IoC.app(this.bouer).resolve(ComponentHandler)
      .order({
        componentElement: componentElement,
        context: this.bouer,
        data: options.data,
        onComponentLoad: () => {
          this.markActiveAnchorsWithRoute(routeToSet);
        },
        onComponentFail: () => {}
      });
  }
  pushState(url, title) {
    url = urlResolver(url).href;
    if (DOM.location.href === url)
      return;
    WIN.history.pushState({
      url,
      title
    }, (title || ''), url);
  }
  popState(times) {
    if (isNull(times))
      times = -1;
    WIN.history.go(times);
  }
  toPage(url) {
    // Default Page
    if (url === '' || url === '/' ||
      url === '/' + urlCombine((this.base, 'index.html'))) {
      return this.defaultPage;
    }
    // Search for the right page
    return IoC.app(this.bouer).resolve(ComponentHandler)
      .find(component => {
        if (!component.route)
          return false;
        const routeRegExp = component.route.replace(/{(.*?)}/gi, '[\\S\\s]{1,}');
        if (Array.isArray(new RegExp('^' + routeRegExp + '$', 'i').exec(url)))
          return true;
        return false;
      }) || this.notFoundPage;
  }
  markActiveAnchorsWithRoute(route) {
    const className = this.bouer.config.activeClassName || 'active-link';
    const appEl = ifNullStop(this.bouer.el);
    const anchors = appEl.querySelectorAll('a');
    if (isNull(route))
      return;
    // Removing the active mark
    forEach(this.activeAnchors, anchor => anchor.classList.remove(className));
    // Removing the active mark
    forEach([].slice.call(appEl.querySelectorAll('a.' + className)), (anchor) => anchor.classList.remove(className));
    this.activeAnchors = [];
    // Adding the className and storing all the active anchors
    forEach(toArray(anchors), (anchor) => {
      if (anchor.href.split('?')[0] !== route.split('?')[0])
        return;
      anchor.classList.add(className);
      this.activeAnchors.push(anchor);
    });
  }
  markActiveAnchor(anchor) {
    const className = this.bouer.config.activeClassName || 'active-link';
    if (isNull(anchor))
      return;
    forEach(this.activeAnchors, anchor => anchor.classList.remove(className));
    forEach([].slice.call(ifNullStop(this.bouer.el).querySelectorAll('a.' + className)), (anchor) => anchor.classList.remove(className));
    anchor.classList.add(className);
    this.activeAnchors = [anchor];
  }
  clear() {
    this.routeView.innerHTML = '';
  }
  /**
   * Allow to configure the `Default Page` and `NotFound Page`
   * @param {Component|IComponentOptions} component the component to be checked
   */
  configure(component) {
    if (component.isDefault === true && !isNull(this.defaultPage))
      return Logger.warn('There are multiple “Default Page” provided, check the “' + component.route + '” route.');
    if (component.isNotFound === true && !isNull(this.notFoundPage))
      return Logger.warn('There are multiple “NotFound Page” provided, check the “' + component.route + '” route.');
    if (component.isDefault === true)
      this.defaultPage = component;
    if (component.isNotFound === true)
      this.notFoundPage = component;
  }
}
class DataStore {
  constructor() {
    this._IRT_ = true;
    this.wait = {};
    this.data = {};
    this.req = {};
    this.element = {
      data: new WeakMap(),
      keys: new Array()
    };
  }
  set(key, dataKey, data) {
    if (key === 'wait')
      return Logger.warn('Only “get” is allowed for type of data');
    this[key][dataKey] = data;
  }
  get(key, dataKey, once) {
    const result = this[key][dataKey];
    if (once === true)
      this.unset(key, dataKey);
    return result;
  }
  unset(key, dataKey) {
    delete this[key][dataKey];
  }
  getNodeData(element, defaultData) {
    var _a;
    if (!this.element.data.has(element))
      return defaultData;
    return (_a = this.element.data.get(element)) !== null && _a !== void 0 ? _a : defaultData;
  }
  addNodeData(element, data) {
    this.element.data.set(element, data);
    this.element.keys.push(element);
  }
  unlinkNodeData() {
    forEach(this.element.keys, (el) => {
      const isUnlinked = !el.isConnected || (el.isActive || (() => {
        return false;
      }))();
      if (!isUnlinked)
        return;
      this.element.data.delete(el);
    });
  }
}
class Middleware {
  constructor(bouer) {
    this._IRT_ = true;
    this.middlewareConfigContainer = {};
    this.run = (directive, runnable) => {
      const middlewares = this.middlewareConfigContainer[directive];
      if (!middlewares) {
        return (runnable.default || (() => {})).call(this.bouer);
      }
      let index = 0;
      let middleware = middlewares[index];
      while (middleware != null) {
        let isNext = false;
        const middlewareAction = middleware[runnable.type];
        if (middlewareAction) {
          runnable.action((config, cbs) => {
            Promise.resolve(middlewareAction.call(this.bouer, config, () => {
              isNext = true;
            })).then(value => {
              if (!isNext)
                cbs.success(value);
              cbs.done();
            }).catch(error => {
              if (!isNext)
                cbs.fail(error);
              cbs.done();
            });
          });
        } else {
          // Run default config
          (runnable.default || (() => {}))();
        }
        if (isNext == false)
          break;
        middleware = middlewares[++index];
      }
    };
    this.subscribe = (directive, actions) => {
      if (!this.middlewareConfigContainer[directive])
        this.middlewareConfigContainer[directive] = [];
      const middleware = {};
      actions.call(this.bouer, onBind => middleware.onBind = onBind, onUpdate => middleware.onUpdate = onUpdate, onUnbind => middleware.onUnbind = onUnbind);
      this.middlewareConfigContainer[directive].push(middleware);
    };
    this.has = (directive) => {
      const middlewares = this.middlewareConfigContainer[directive];
      if (!middlewares)
        return false;
      return middlewares.length > 0;
    };
    this.bouer = bouer;
  }
}
class Binder {
  constructor(bouer, evaluator) {
    this.binds = [];
    this.DEFAULT_BINDER_PROPERTIES = {
      text: 'value',
      number: 'valueAsNumber',
      checkbox: 'checked',
      radio: 'value',
      contenteditable: 'textContent',
    };
    this.bouer = bouer;
    this.evaluator = evaluator;
    this.cleanup();
  }
  create(options) {
    const {
      node,
      data,
      fields,
      replaceable: isReplaceProperty,
      context
    } = options;
    const originalValue = ifNullReturn(node.nodeValue, '');
    const originalName = node.nodeName;
    const ownerNode = node.ownerElement || node.parentNode;
    const middleware = IoC.app(this.bouer).resolve(Middleware);
    const onBind = options.onBind || $default;
    const onUpdate = options.onUpdate || $default;
    const onUnbind = options.onUnbind || $default;
    const isActive = ownerNode.isActive;
    const bindingHooks = {
      onBind,
      onUnbind,
      onUpdate
    };
    // Clousure cache property settings
    const propertyBindConfig = {
      node: node,
      data: data,
      nodeName: originalName,
      nodeValue: originalValue,
      fields: fields,
      parent: ownerNode,
      value: ''
    };
    // Middleware that runs before the bind or update is made
    const $RunDirectiveMiddlewares = (type) => {
      // Running the hooks
      bindingHooks[type](node, propertyBindConfig);
      middleware.run(originalName, {
        type: type,
        action: middleware => {
          middleware({
            binder: propertyBindConfig,
            detail: {}
          }, {
            success() {},
            fail() {},
            done() {}
          });
        },
      });
    };
    const $BindOneWay = () => {
      // One-Way Data Binding
      let nodeToBind = node;
      // If definable property e-[?]=""..." Ex: e-src => src
      if (
        // If: [e-]src === [e-]
        originalName.substring(0, Constants.property.length) === Constants.property &&
        // And isn't replaceable
        isNull(isReplaceProperty)) {
        // Original bound property name e-src => src
        propertyBindConfig.nodeName = originalName.substring(Constants.property.length);
        // Set the new attr
        ownerNode.setAttribute(propertyBindConfig.nodeName, originalValue);
        // Retrieve the new attr set
        nodeToBind = ownerNode.attributes[propertyBindConfig.nodeName];
        // Removing the e-[?] attr
        ownerNode.removeAttribute(node.nodeName);
      }
      // Property value setter
      const setter = () => {
        let valueToSet = propertyBindConfig.nodeValue;
        let isHtml = false;
        // Looping all the fields to be setted
        forEach(fields, (field) => {
          // Retrieving the delimiter used in this field
          const delimiter = field.delimiter;
          // Mark isHtml as true if it's a HTML delimiter type
          if (delimiter && delimiter.name === 'html')
            isHtml = true;
          // Evaluate the expression from the delimiter
          let evaluetedValue = this.evaluator.exec({
            data: data,
            code: field.expression,
            context: context,
          });
          evaluetedValue = isRef(evaluetedValue) || isComputed(evaluetedValue) ? evaluetedValue.get() : evaluetedValue;
          evaluetedValue = isNull(evaluetedValue) ? '' : evaluetedValue;
          evaluetedValue = this.applyPipes(evaluetedValue, field);
          // Replacing each field with the specific value
          valueToSet = valueToSet.replace(field.field, toStr(evaluetedValue));
          if (delimiter && typeof delimiter.onUpdate === 'function')
            valueToSet = delimiter.onUpdate(valueToSet, node, data);
        });
        propertyBindConfig.value = valueToSet;
        if (!isHtml)
          return (nodeToBind.nodeValue = valueToSet);
        const htmlSnippets = createEl('div', el => el.innerHTML = valueToSet)
          .children();
        ownerNode.innerHTML = '';
        forEach(htmlSnippets, (snippetNode) => {
          ownerNode.appendChild(snippetNode);
          snippetNode.isActive = isActive;
          IoC.app(this.bouer).resolve(Compiler).compile({
            el: snippetNode,
            data: data,
            context: context,
          });
        }, this);
      };
      ReactiveEvent.once('AfterGet', (event) => {
        event.onemit = (descriptor) => {
          const watch = descriptor.onChange(() => {
            setter();
            $RunDirectiveMiddlewares('onUpdate');
          }, node);
          watch.onDestroy = () => {
            $RunDirectiveMiddlewares('onUnbind');
          };
          this.binds.push({
            isConnected: isActive,
            watch: watch,
          });
        };
        setter();
      });
      propertyBindConfig.node = nodeToBind;
      $RunDirectiveMiddlewares('onBind');
      return propertyBindConfig;
    };
    const $BindTwoWay = () => {
      let propertyNameToBind = '';
      let binderTarget = ownerNode.type;
      // Changing the target to the binding, as it is contenteditable element type
      if (ownerNode.hasAttribute('contenteditable'))
        binderTarget = 'contenteditable';
      // If the 'type' property has not valid value, target the name of the node. Example: value
      binderTarget = binderTarget || ownerNode.localName;
      // If the original name is e-bind, load the default binding value by the target
      if (Constants.bind === originalName)
        propertyNameToBind = this.DEFAULT_BINDER_PROPERTIES[binderTarget] || 'value';
      else
        propertyNameToBind = originalName.split(':')[1]; // e-bind:value -> value
      const isSelect = ownerNode instanceof HTMLSelectElement;
      const isSelectMultiple = isSelect && ownerNode.multiple === true;
      // Finding the :value 'binding model' for the node that is being bound
      const modelAttribute = findAttribute(ownerNode, [':value'], true);
      const dataBindModel = modelAttribute ? modelAttribute.value : '\'' + ownerNode.value + '\'';
      const dataBindProperty = trim(originalValue);
      let boundPropertyValue;
      let boundModelValue;
      const bindingDirection = {
        fromDataToInput: (value) => {
          value = isRef(value) || isComputed(value) ? value.get() : value;
          // Normal Property Set
          if (!Array.isArray(boundPropertyValue)) {
            // In case of radio button we need to check if the value is the same to check it
            if (binderTarget === 'radio')
              return (ownerNode.checked =
                ownerNode[propertyNameToBind] == value);
            // Default Binding
            const _valueToSet = isObject(value) ? toStr(value) : isNull(value) ? '' : value;
            const _valueSet = ownerNode[propertyNameToBind];
            if (_valueToSet === _valueSet)
              return;
            return ownerNode[propertyNameToBind] = _valueToSet;
          }
          // Array Set
          boundModelValue =
            boundModelValue ||
            this.evaluator.exec({
              data: data,
              code: dataBindModel,
              context: context,
            });
          // select-multiple handling
          if (isSelectMultiple) {
            return forEach(toArray(ownerNode.options), (option) => {
              option.selected =
                boundPropertyValue.indexOf(trim(option.value)) !== -1;
            });
          }
          // checkboxes, radio, etc
          if (boundPropertyValue.indexOf(boundModelValue) === -1) {
            switch (typeof ownerNode[propertyNameToBind]) {
              case 'boolean':
                ownerNode[propertyNameToBind] = false;
                break;
              case 'number':
                ownerNode[propertyNameToBind] = 0;
                break;
              default:
                ownerNode[propertyNameToBind] = '';
                break;
            }
          }
        },
        fromInputToData: (value) => {
          // Normal Property Set
          if (!Array.isArray(boundPropertyValue)) {
            // Check Ref<?>
            if (isRef(boundPropertyValue) || isComputed(boundPropertyValue)) {
              return boundPropertyValue.set(value);
            }
            // Default Binding
            return this.evaluator.exec({
              returnable: false,
              context: context,
              data: Extend.obj(data, {
                $vl: value
              }),
              code: dataBindProperty + '=$vl',
            });
          }
          // Array Set
          boundModelValue =
            boundModelValue ||
            this.evaluator.exec({
              data: data,
              code: dataBindModel,
              context: context,
            });
          // select-multiple handling
          if (isSelectMultiple) {
            const optionCollection = [];
            forEach(toArray(ownerNode.options), (option) => {
              if (option.selected === true)
                optionCollection.push(trim(option.value));
            });
            boundPropertyValue.splice(0, boundPropertyValue.length);
            return boundPropertyValue.push.apply(boundPropertyValue, optionCollection);
          }
          if (value)
            boundPropertyValue.push(boundModelValue);
          else
            boundPropertyValue.splice(boundPropertyValue.indexOf(boundModelValue), 1);
        },
      };
      const setter = (direction, value) => {
        if (isSelect &&
          !isSelectMultiple &&
          Array.isArray(boundPropertyValue) &&
          !dataBindModel) {
          return Logger.error('Since it\'s a <select> array binding, it expects the “multiple” attribute in' +
            ' order to bind the multiple values.');
        }
        // Array Binding
        if (!isSelectMultiple &&
          Array.isArray(boundPropertyValue) &&
          !dataBindModel) {
          return Logger.error('Since it\'s an array binding it expects a model but it has not been defined' +
            ', provide a model as it follows: value="String-Model" or :value="Object-Model".');
        }
        return bindingDirection[direction](value);
      };
      // Subscribing the bind to the property
      ReactiveEvent.once('AfterGet', (evt) => {
        const getValue = () => this.evaluator.exec({
          data: data,
          code: dataBindProperty,
          context: context,
        });
        // Adding the event on emittion
        evt.onemit = (descriptor) => {
          this.binds.push({
            isConnected: isActive,
            watch: descriptor.onChange(() => {
              const value = getValue();
              setter('fromDataToInput', value);
              $RunDirectiveMiddlewares('onUpdate');
            }, node),
          });
        };
        // calling the main event
        boundPropertyValue = getValue();
      });
      $RunDirectiveMiddlewares('onBind');
      // Running the first value setting: { } -> Element
      setter('fromDataToInput', boundPropertyValue);
      // Adding custom listeners according to the node name
      const listeners = ['input', 'propertychange', 'change'];
      if (listeners.indexOf(ownerNode.localName) === -1)
        listeners.push(ownerNode.localName);
      // Applying the events
      forEach(listeners, (listener) => {
        if (listener === 'change' && ownerNode.localName !== 'select')
          return;
        // Adding the event to listen to the element change event
        ownerNode.addEventListener(listener, () => setter('fromInputToData', ownerNode[propertyNameToBind]), false);
      });
      // Removing the e-bind attr from the node
      ownerNode.removeAttribute(node.nodeName);
      return propertyBindConfig; // Stop Two-Way Data Binding Process
    };
    // Apply TwoWay if: e-bind
    if (originalName.substring(0, Constants.bind.length) === Constants.bind)
      return $BindTwoWay();
    // Apply OneWay if any other type of binding
    return $BindOneWay();
  }
  remove(boundNode, boundAttrName, boundPropName) {
    this.binds = where(this.binds, (bind) => {
      const node = bind.watch.node;
      if ((node.ownerElement || node.parentElement) !== boundNode)
        return true;
      if (isNull(boundAttrName))
        return bind.watch.destroy();
      if (node.nodeName === boundAttrName &&
        (boundPropName === bind.watch.property || isNull(boundPropName)))
        return bind.watch.destroy();
      return true;
    });
  }
  onPropertyChange(propertyName, callback, targetObject) {
    let mWatch;
    ReactiveEvent.once('AfterGet', (event) => {
      event.onemit = (descriptor) => (mWatch = descriptor.onChange(callback));
      $default(targetObject[propertyName]);
    });
    return mWatch;
  }
  onPropertyInScopeChange(watchable) {
    const watches = [];
    ReactiveEvent.once('AfterGet', (evt) => {
      evt.onemit = (descriptor) => {
        // Using scope watch avoid listen to the same property twice
        if (watches.find((w) => w.property === descriptor.propName &&
            w.descriptor.propSource === descriptor.propSource))
          return;
        // Execution handler
        let isExecuting = false;
        watches.push(descriptor.onChange(() => {
          if (isExecuting)
            return;
          isExecuting = true;
          watchable.call(this.bouer, this.bouer);
          isExecuting = false;
        }));
      };
      watchable.call(this.bouer, this.bouer);
    });
    return {
      watches: watches,
      destroy: () => forEach(watches, w => w.destroy())
    };
  }
  applyPipes(value, field) {
    let $value = value;
    if (isNull($value) || trim($value + '') === '')
      return $value;
    forEach(field.pipes || [], pipe => {
      const args = pipe.args.slice().map(a => {
        return this.evaluator.exec({
          code: a,
          context: this.bouer,
          returnable: true,
          data: this.bouer.data
        });
      });
      const fn = this.bouer.pipes[pipe.fn];
      if (typeof fn !== 'function')
        return Logger.error('Pipe “' + pipe.fn + '” not defined');
      const processed = fn.apply(null, [$value, ...args]);
      if (isNull(processed))
        return Logger.error('Pipe function “' + pipe.fn + '” cannot return null | undefined | void');
      if (processed instanceof Promise)
        return Logger.error('Pipe function “' + pipe.fn + '” cannot return a Promise');
      $value = processed;
    });
    return $value;
  }
  /** Creates a process to unbind properties that is not connected to the DOM anymone */
  cleanup() {
    const autoUnbind = ifNullReturn(this.bouer.config.autoUnbind, true);
    if (autoUnbind == false)
      return;
    Task.run(() => {
      this.binds = where(this.binds, (bind) => {
        if (bind.isConnected())
          return true;
        bind.watch.destroy();
      });
    });
  }
}
class EventHandler {
  constructor(bouer, evaluator) {
    this._IRT_ = true;
    this.$events = {};
    this.input = createEl('input').build();
    this.bouer = bouer;
    this.evaluator = evaluator;
    this.cleanup();
  }
  compile(node, data, context) {
    const ownerNode = (node.ownerElement || node.parentNode);
    const nodeName = node.nodeName;
    if (isNull(ownerNode))
      return Logger.error('Invalid ParentElement of “' + nodeName + '”');
    // <button on:submit.once.stop="times++"/>
    const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    const eventNameWithModifiers = nodeName.substring(Constants.on.length);
    const allModifiers = eventNameWithModifiers.split('.');
    const eventName = allModifiers[0];
    allModifiers.shift();
    if (nodeValue === '')
      return Logger.error('Expected an expression in the “' + nodeName + '” and got an <empty string>.');
    ownerNode.removeAttribute(nodeName);
    const callback = (evt) => {
      // Calling the modifiers
      const availableModifiersFunction = {
        'prevent': 'preventDefault',
        'stop': 'stopPropagation'
      };
      forEach(allModifiers, modifier => {
        const modifierFunctionName = availableModifiersFunction[modifier];
        if (evt[modifierFunctionName])
          evt[modifierFunctionName]();
      });
      const mArguments = [evt];
      const isResultFunction = this.evaluator.exec({
        data: data,
        code: nodeValue,
        args: mArguments,
        aditional: {
          event: evt
        },
        context: context
      });
      if (isFunction(isResultFunction)) {
        try {
          fnCallResolver(isResultFunction.apply(context, mArguments));
        } catch (error) {
          Logger.error(buildError(error));
        }
      }
    };
    const modifiersObject = {};
    const addEventListenerOptions = ['capture', 'once', 'passive'];
    forEach(allModifiers, md => {
      md = md.toLocaleLowerCase();
      if (addEventListenerOptions.indexOf(md) !== -1) {
        modifiersObject[md] = true;
      }
    });
    if (!('on' + eventName in this.input))
      this.on({
        context: context,
        eventName: eventName,
        callback: callback,
        modifiers: modifiersObject,
        attachedNode: ownerNode
      });
    else
      ownerNode.addEventListener(eventName, callback, modifiersObject);
  }
  on(options) {
    const instance = this;
    const {
      eventName,
      callback,
      context,
      attachedNode,
      modifiers
    } = options;
    const iEventSubCallback = (evt) => callback.apply(context || this.bouer, [evt]);
    const event = {
      eventName: eventName,
      attachedNode: attachedNode,
      modifiers: modifiers,
      callback: iEventSubCallback,
      destroy: () => instance.off({
        callback: iEventSubCallback,
        attachedNode,
        eventName,
      }),
      emit: options => this.emit({
        eventName: eventName,
        attachedNode: attachedNode,
        init: (options || {}).init,
        once: (options || {}).once,
      })
    };
    if (!this.$events[eventName])
      this.$events[eventName] = [];
    this.$events[eventName].push(event);
    return event;
  }
  off(options) {
    const {
      eventName,
      callback,
      attachedNode
    } = options;
    if (!this.$events[eventName])
      return;
    this.$events[eventName] = where(this.$events[eventName], evt => {
      const isEqual = (evt.eventName === eventName && callback == evt.callback);
      if (attachedNode && (evt.attachedNode === attachedNode) && isEqual)
        return false;
      // In this case remove all
      const isRemoveAll = (evt.eventName === eventName &&
        evt.attachedNode === attachedNode &&
        isNull(callback));
      if (isRemoveAll)
        return;
      return !isEqual;
    });
  }
  emit(options) {
    const {
      eventName,
      init,
      once,
      attachedNode
    } = options;
    const events = this.$events[eventName];
    if (!events)
      return;
    const emitter = (node, callback) => {
      node.addEventListener(eventName, callback, {
        once: true
      });
      node.dispatchEvent(new CustomEvent(eventName, init));
      node.removeEventListener(eventName, callback);
    };
    this.$events[eventName] = where(events, evt => {
      const node = evt.attachedNode;
      const isOnceEvent = ifNullReturn((evt.modifiers || {}).once, false) || ifNullReturn(once, false);
      // If a node was provided, just dispatch the events in this node
      if (attachedNode) {
        if (node !== attachedNode)
          return true;
        emitter(node, evt.callback);
        return !isOnceEvent;
      }
      // Otherwise, if this events has a node, dispatch the node event
      if (node) {
        emitter(node, evt.callback);
        return !isOnceEvent;
      }
      // Otherwise, dispatch the event
      fnCallResolver(evt.callback.call(this.bouer, new CustomEvent(eventName, init)));
      return !isOnceEvent;
    });
  }
  cleanup() {
    const autoOffEvent = ifNullReturn(this.bouer.config.autoOffEvent, true);
    if (autoOffEvent == false)
      return;
    Task.run(() => {
      forEach(Object.keys(this.$events), key => {
        this.$events[key] = where(this.$events[key], event => {
          var _a;
          if ((event.modifiers || {}).autodestroy === false)
            return true;
          if (!event.attachedNode)
            return true;
          const isActive = (_a = event.attachedNode.isActive) !== null && _a !== void 0 ? _a : (() => event.attachedNode.isConnected);
          if (isActive())
            return true;
        });
      });
    });
  }
}
const constsValues = Object.values(Constants);

function $bind(opitons) {
  const {
    node,
    binder,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = ifNullReturn(node.nodeValue, '');
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));
  binder.create({
    node: node,
    fields: [{
      field: nodeValue,
      expression: nodeValue,
      pipes: []
    }],
    context: context,
    data: data
  });
  ownerNode.removeAttribute(node.nodeName);
}

function $text(opitons) {
  const {
    node,
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = ifNullReturn(node.nodeValue, '');
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  ownerNode.textContent = nodeValue;
  ownerNode.removeAttribute(node.nodeName);
}

function $property(opitons) {
  const {
    node,
    binder,
    delimiter,
    context,
    evaluator,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeName = node.nodeName;
  const nodeValue = ifNullReturn(node.nodeValue, '');
  let execute = (obj) => {};
  const errorInvalidValue = (node) => ('Invalid value, expected an Object/Object Literal in “' +
    nodeName + '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
  if (constsValues.includes(node.nodeName))
    return;
  if (nodeValue === '')
    return Logger.error(errorInvalidValue(node));
  if (delimiter.run(nodeValue).length !== 0)
    return;
  const inputData = evaluator.exec({
    data: data,
    code: nodeValue,
    context: context
  });
  if (!isObject(inputData))
    return Logger.error(errorInvalidValue(node));
  binder.create({
    data: data,
    node: node,
    context: context,
    replaceable: false,
    fields: [{
      expression: nodeValue,
      field: nodeValue,
      pipes: []
    }],
    onUpdate: () => execute(evaluator.exec({
      data: data,
      code: nodeValue,
      context: context
    }))
  });
  ownerNode.removeAttribute(node.nodeName);
  (execute = (obj) => {
    const attrNameToSet = node.nodeName.substring(Constants.property.length);
    let attr = ownerNode.attributes[attrNameToSet];
    if (!attr) {
      (ownerNode.setAttribute(attrNameToSet, ''));
      attr = ownerNode.attributes[attrNameToSet];
    }
    forEach(Object.keys(obj), key => {
      /* if has a falsy value remove the key */
      if (!obj[key])
        return attr.value = trim(attr.value.replace(key, ''));
      attr.value = (attr.value.includes(key) ? attr.value : trim(attr.value + ' ' + key));
    });
    if (attr.value === '')
      return ownerNode.removeAttribute(attrNameToSet);
  })(inputData);
}

function $href(opitons) {
  const {
    node,
    bouer,
    binder,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  const usehash = ifNullReturn(bouer.config.usehash, true);
  const routeToSet = urlCombine((usehash ? '#' : ''), nodeValue);
  ownerNode.setAttribute('href', routeToSet);
  const href = ownerNode.attributes['href'];
  const delimiters = delimiter.run(nodeValue);
  if (delimiters.length !== 0)
    binder.create({
      data: data,
      node: href,
      context: context,
      fields: delimiters
    });
  ownerNode.removeAttribute(node.nodeName);
  ownerNode
    .addEventListener('click', event => {
      event.preventDefault();
      IoC.app(bouer).resolve(Routing)
        .navigate(href.value);
    }, false);
}

function $entry(opitons) {
  const {
    node,
    bouer,
    delimiter,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));
  ownerNode.removeAttribute(node.nodeName);
  IoC.app(bouer).resolve(ComponentHandler)
    .prepare([
      {
        name: nodeValue,
        template: ownerNode.outerHTML,
        data: data
        }
    ]);
}

function $put(opitons) {
  const {
    node,
    bouer,
    binder,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  let nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  let execute = () => {};
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node) + ' Direct <empty string> injection value is not allowed.');
  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error('Expected an expression with no delimiter in “' + node.nodeName +
      '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
  binder.create({
    data: data,
    node: node,
    fields: [{
      expression: nodeValue,
      field: nodeValue,
      pipes: []
    }],
    context: context,
    replaceable: false,
    onUpdate: () => execute()
  });
  ownerNode.removeAttribute(node.nodeName);
  (execute = () => {
    ownerNode.innerHTML = '';
    nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '')
      return;
    const componentElement = createEl(nodeValue)
      .appendTo(ownerNode)
      .build();
    IoC.app(bouer).resolve(ComponentHandler)
      .order({
        componentElement: componentElement,
        context: context,
        data: data,
        onComponentLoad: () => {},
        onComponentFail: () => {},
        compilationHooks: opitons.compilationHooks
      });
  })();
}

function $if(opitons) {
  const {
    node,
    binder,
    evaluator,
    compiler,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const container = ownerNode.parentElement;
  if (!container)
    return;
  const conditions = [];
  const isActive = container.isActive;
  const comment = createComment();
  const nodeName = node.nodeName;
  let execute = () => {};
  if (nodeName === Constants.elseif || nodeName === Constants.else)
    return;
  let currentEl = ownerNode;
  const reactives = [];
  // Inserting the comment ref
  container.insertBefore(comment, currentEl);
  do { // Searching for 'e-else-if' and 'e-else' to complete the conditional chain
    if (currentEl == null)
      break;
    const attr = findAttribute(currentEl, ['e-if', 'e-else-if', 'e-else']);
    if (!attr)
      break;
    currentEl.isActive = container.isActive;
    const firstCondition = conditions[0]; // if it already got an 'if',
    if (attr.name === 'e-if' && firstCondition && (attr.name === firstCondition.attr.name))
      break;
    if ((attr.nodeName !== 'e-else') && (trim(ifNullReturn(attr.nodeValue, '')) === ''))
      return Logger.error(errorMsgEmptyNode(attr));
    if (delimiter.run(ifNullReturn(attr.nodeValue, '')).length !== 0)
      return Logger.error(errorMsgNodeValue(attr));
    conditions.push({
      attr: attr,
      node: currentEl
    });
    if (attr.nodeName === 'e-else') {
      currentEl.removeAttribute(attr.nodeName);
      break;
    }
    // Listening to the property get only if the callback function is defined
    ReactiveEvent.once('AfterGet', event => {
      event.onemit = descriptor => {
        // Avoiding multiple binding in the same property
        if (reactives.findIndex(item => item.descriptor.propName == descriptor.propName) !== -1)
          return;
        reactives.push({
          attr: attr,
          descriptor: descriptor
        });
      };
      evaluator.exec({
        data: data,
        code: attr.value,
        context: context,
      });
    });
    currentEl.removeAttribute(attr.nodeName);
  } while (currentEl = currentEl.nextElementSibling);
  forEach(reactives, item => {
    binder.binds.push({
      // Binder is connected if at least one of the chain and the comment is still connected
      isConnected: isActive,
      watch: item.descriptor.onChange(() => execute(), item.attr)
    });
  });
  (execute = () => {
    forEach(conditions, chainItem => {
      const element = getRootElement(chainItem.node);
      if (!element.parentElement)
        return;
      container.removeChild(element);
    });
    const conditionalExpression = conditions.map((item, index) => {
      const $value = item.attr.value;
      switch (item.attr.name) {
        case Constants.if:
          return 'if(' + $value + '){ __cb(' + index + '); }';
        case Constants.elseif:
          return 'else if(' + $value + '){ __cb(' + index + '); }';
        case Constants.else:
          return 'else{ __cb(' + index + '); }';
      }
    }).join(' ');
    evaluator.exec({
      data: data,
      returnable: false,
      code: conditionalExpression,
      context: context,
      aditional: {
        __cb: (chainIndex) => {
          const {
            node: mElement
          } = conditions[chainIndex];
          const element = getRootElement(mElement);
          container.insertBefore(element, comment);
          compiler.compile({
            el: element,
            data: data,
            context: context,
            beforeCompile: opitons.compilationHooks.beforeCompile,
            afterCompile: opitons.compilationHooks.afterCompile,
          });
        }
      }
    });
  })();
}

function $show(opitons) {
  const {
    node,
    binder,
    evaluator,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  let execute = (el) => {};
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));
  const bindResult = binder.create({
    data: data,
    node: node,
    fields: [{
      expression: nodeValue,
      field: nodeValue,
      pipes: []
    }],
    context: context,
    onUpdate: () => execute(ownerNode)
  });
  (execute = (element) => {
    element.style.display = evaluator.exec({
      data: data,
      code: nodeValue,
      context: context,
    }) ? '' : 'none';
  })(ownerNode);
  ownerNode.removeAttribute(bindResult.node.nodeName);
}

function custom(opitons) {
  const {
    node,
    binder,
    delimiter,
    customDirectives: $custom,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeName = node.nodeName;
  const nodeValue = ifNullReturn(node.nodeValue, '');
  const delimiters = delimiter.run(nodeValue);
  const $CustomDirective = $custom[nodeName];
  const bindConfig = binder.create({
    data: data,
    node: node,
    fields: delimiters,
    replaceable: false,
    context: context,
    onBind: $CustomDirective.onBind,
    onUpdate: $CustomDirective.onUpdate,
    onUnbind: $CustomDirective.onUnbind
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

function $data(opitons) {
  const {
    node,
    bouer,
    delimiter,
    context,
    evaluator,
    compiler,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error('The “data” attribute cannot contain delimiter.');
  ownerNode.removeAttribute(node.nodeName);
  let inputData = {};
  const mData = Extend.obj(data, {
    $data: data,
    $scope: data
  });
  const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
    if (!(descriptor.propName in inputData))
      inputData[descriptor.propName] = undefined;
    Prop.set(inputData, descriptor.propName, descriptor);
  });
  // If data value is empty gets the main scope value
  if (nodeValue === '')
    inputData = Extend.obj(data);
  else {
    // Other wise, compiles the object provided
    const mInputData = evaluator.exec({
      data: mData,
      code: nodeValue,
      context: context
    });
    if (!isObject(mInputData))
      return Logger.error('Expected a valid Object Literal expression in “' + node.nodeName +
        '” and got “' + nodeValue + '”.');
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
    IoC.app(bouer).resolve(DataStore).set('data', dataKey, inputData);
  }
  Reactive.transform({
    context: context,
    data: inputData
  });
  // Signinng the element with it's data
  IoC.app(bouer).resolve(DataStore).addNodeData(ownerNode, inputData);
  return compiler.compile({
    data: inputData,
    el: ownerNode,
    context: context,
    afterCompile: opitons.compilationHooks.afterCompile,
    beforeCompile: opitons.compilationHooks.beforeCompile
  });
}

function $def(opitons) {
  const {
    node,
    bouer,
    delimiter,
    context,
    evaluator,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));
  const inputData = {};
  const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
    if (!(descriptor.propName in inputData))
      inputData[descriptor.propName] = undefined;
    Prop.set(inputData, descriptor.propName, descriptor);
  });
  const mInputData = evaluator.exec({
    data: data,
    code: nodeValue,
    context: context
  });
  if (!isObject(mInputData))
    return Logger.error('Expected a valid Object Literal expression in “' + node.nodeName +
      '” and got “' + nodeValue + '”.');
  // Adding all non-existing properties
  forEach(Object.keys(mInputData), key => {
    if (!(key in inputData))
      inputData[key] = mInputData[key];
  });
  ReactiveEvent.off('AfterGet', reactiveEvent.callback);
  bouer.set(inputData, data);
  ownerNode.removeAttribute(node.nodeName);
}

function $wait(options) {
  const {
    node,
    bouer,
    delimiter,
    compiler,
    context
  } = options;
  const ownerNode = toOwnerNode(node);
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  if (delimiter.run(nodeValue).length !== 0)
    return Logger.error(errorMsgNodeValue(node));
  ownerNode.removeAttribute(node.nodeName);
  const dataStore = IoC.app(bouer).resolve(DataStore);
  const mWait = dataStore.wait[nodeValue];
  if (mWait) {
    mWait.nodes.push(ownerNode);
    // No data exposed yet
    if (!mWait.data)
      return;
    // Compile all the waiting nodes
    forEach(mWait.nodes, (nodeWaiting) => {
      compiler.compile({
        el: nodeWaiting,
        context: mWait.context,
        data: Reactive.transform({
          context: mWait.context,
          data: mWait.data
        }),
        beforeCompile: options.compilationHooks.beforeCompile,
        afterCompile: options.compilationHooks.afterCompile,
      });
    });
    if (ifNullReturn(mWait.once, false))
      delete dataStore.wait[nodeValue];
  }
  return dataStore.wait[nodeValue] = {
    nodes: [ownerNode],
    context: context
  };
}

function $req(opitons) {
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
  const ownerNode = toOwnerNode(node);
  const container = toOwnerNode(ownerNode);
  const nodeName = node.nodeName;
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
    return Logger.error(('Expected a valid “for” expression in “' + nodeName +
      '” and got “' + nodeValue + '”.' + '\nValid: e-req="item of url".'));
  if (ownerNode.hasAttribute('skeleton-cloned'))
    return;
  const delimiters = delimiter.run(nodeValue);
  const localDataStore = {};
  const dataKey = (node.nodeName.split(':')[1] || '').replace(/\[|\]/g, '');
  const comment = createComment(undefined, 'request-' + (dataKey || code(6)));
  let onInsertOrUpdate = () => {};
  let onUpdate = () => {};
  let binderConfig = {
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
  const skeleton = IoC.app(bouer).resolve(Skeleton);
  // Only insert if the type is `of
  if (nodeValue.includes(' of '))
    skeleton.insertItems(ownerNode);
  if (delimiters.length !== 0)
    binderConfig = binder.create({
      data: data,
      node: node,
      fields: delimiters,
      context: context,
      replaceable: false,
      onUpdate: () => onUpdate()
    });
  ownerNode.removeAttribute(node.nodeName);
  const subcribeEvent = (eventName) => {
    const attr = ownerNode.attributes.getNamedItem(Constants.on + eventName);
    if (attr)
      eventHandler.compile(attr, data, context);
    return {
      emit: (detailObj) => {
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
  const builder = (expression) => {
    const filters = expression.split('|').map(item => trim(item));
    // Removing and retrieving the Request Expression
    const reqExpression = filters.shift().replace(/\(|\)/g, '');
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
  const isValidResponse = (response, requestType) => {
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
  const middleware = IoC.app(bouer).resolve(Middleware);
  if (!middleware.has('req'))
    return Logger.error('There is no “req” middleware provided for the “e-req” directive requests.');
  const createMiddlewareContext = (expObject) => {
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
    const responseHandler = (response) => {
      if (!isValidResponse(response, expObject.type))
        return;
      Reactive.transform({
        context: context,
        data: response
      });
      if (dataKey)
        IoC.app(bouer).resolve(DataStore).set('req', dataKey, response);
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
        data[variable] = response.data;
        return compiler.compile({
          el: ownerNode,
          data: Reactive.transform({
            context: context,
            data: data
          }),
          context: context,
          beforeCompile: opitons.compilationHooks.beforeCompile,
          afterCompile: opitons.compilationHooks.afterCompile
        });
      }
      if (expObject.type === 'of') {
        skeleton.clearItems(ownerNode);
        const resUniqueName = code(8, 'res');
        const forDirectiveContent = expObject.expression.replace(expObject.path, resUniqueName);
        const mData = Extend.obj({
          [resUniqueName]: response.data
        }, data);
        ownerNode.setAttribute(Constants.for, Extend.array([forDirectiveContent], expObject.filters).join(' | '));
        Prop.set(mData, resUniqueName, Prop.descriptor(response, 'data'));
        return compiler.compile({
          el: ownerNode,
          data: mData,
          context: context,
          beforeCompile: opitons.compilationHooks.beforeCompile,
          afterCompile: opitons.compilationHooks.afterCompile
        });
      }
    };
    subcribeEvent(Constants.builtInEvents.request).emit();
    middleware.run('req', {
      type: 'onBind',
      action(middlewareRequest) {
        middlewareRequest(createMiddlewareContext(expObject), {
          success: (response) => {
            responseHandler(response);
          },
          fail: (error) => subcribeEvent(Constants.builtInEvents.fail).emit({
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
          success: (response) => {
            if (!isValidResponse(response, expObject.type))
              return;
            localDataStore.data = response.data;
          },
          fail: (error) => subcribeEvent(Constants.builtInEvents.fail).emit({
            error: error
          }),
          done: () => subcribeEvent(Constants.builtInEvents.done).emit()
        });
      }
    });
  };
}

function $for(opitons) {
  const {
    node,
    binder,
    evaluator,
    compiler,
    eventHandler,
    delimiter,
    context,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node);
  const isActive = ownerNode.isActive;
  const container = ownerNode.parentElement;
  if (!container)
    return;
  if (ownerNode.hasAttribute('skeleton-cloned'))
    return;
  const comment = createComment();
  const nodeName = node.nodeName;
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  let listedItemsHandler = [];
  let hasWhereFilter = false;
  let hasOrderFilter = false;
  let execute = () => {};
  if (nodeValue === '')
    return Logger.error(errorMsgEmptyNode(node));
  if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
    return Logger.error('Expected a valid “for” expression in “' +
      nodeName + '” and got “' + nodeValue +
      '”.' + '\nValid: e-for="item of items".');
  // Binding the e-for if got delimiters
  const delimiters = delimiter.run(nodeValue);
  if (delimiters.length !== 0)
    binder.create({
      node: node,
      data: data,
      fields: delimiters,
      replaceable: true,
      context: context,
      onUpdate: () => execute()
    });
  ownerNode.removeAttribute(nodeName);
  // Replacing the comment reference
  container.replaceChild(comment, ownerNode);
  // Cloning the element
  const forItem = ownerNode;
  // Filters the list of items
  const $Where = (list, filterConfigParts) => {
    hasWhereFilter = true;
    const wKeys = filterConfigParts[2];
    let wValue = filterConfigParts[1];
    if (isNull(wValue) || wValue === '') {
      Logger.error('Invalid where-value in “' + nodeName + '” with “' + node.nodeValue + '” expression.');
      return list;
    }
    wValue = evaluator.exec({
      data: data,
      code: wValue,
      context: context
    });
    // where:filterFunction
    if (typeof wValue === 'function') {
      list = wValue(list);
    } else {
      // where:search:name?
      if ((isNull(wKeys) || wKeys === '') && isObject(list[0] || '')) {
        Logger.error(('Invalid where-keys in “' + nodeName + '” with “' + node.nodeValue + '” expression, ' +
          'at least one where-key to be provided when using list of object.'));
        return list;
      }
      const newListCopy = [];
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
        if (isValid)
          newListCopy.push(item);
      });
      list = newListCopy;
    }
    return list;
  };
  // Order the list of items
  const $Order = (list, type, prop) => {
    hasOrderFilter = true;
    if (!type)
      type = 'asc';
    return list.sort((a, b) => {
      const comparison = (asc, desc) => {
        if (isNull(asc) || isNull(desc))
          return 0;
        switch (toLower(type)) {
          case 'asc':
            return asc ? 1 : -1;
          case 'desc':
            return desc ? -1 : 1;
          default:
            Logger.error('The “' + type + '” order type is invalid: “' + node.nodeValue +
              '”. Available types are: “asc”  for order ascendent and “desc” for order descendent.');
            return 0;
        }
      };
      if (!prop)
        return comparison(a > b, b < a);
      return comparison(a[prop] > b[prop], b[prop] < a[prop]);
    });
  };
  // Prepare the item before to insert
  const $PrepareForItem = (item, index) => {
    expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
    const leftHandParts = expObj.leftHandParts;
    const sourceValue = expObj.sourceValue;
    const isForOf = expObj.isForOf;
    const forData = Extend.obj(data);
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
  const $InsertForItem = (options) => {
    // Preparing the data to be inserted
    const forData = $PrepareForItem(options.item, options.index);
    // Inserting in the DOM
    const forClonedItem = container.insertBefore(forItem.cloneNode(true), options.reference || comment);
    // Compiling the inserted data
    compiler.compile({
      el: forClonedItem,
      data: forData,
      context: context,
      beforeCompile: opitons.compilationHooks.beforeCompile,
      afterCompile: opitons.compilationHooks.afterCompile,
      onComponentLoad: el => eventHandler.emit({
        eventName: Constants.builtInEvents.add,
        attachedNode: el,
        once: true
      }),
    });
    // Updating the handler
    listedItemsHandler.splice(options.index, 0, {
      el: forClonedItem,
      data: forData
    });
    return forClonedItem;
  };
  // Builds the expression to an object
  const $ExpressionBuilder = (expression) => {
    const filters = expression.split('|').map(item => trim(item));
    const forExpression = filters[0];
    filters.shift();
    // for types:
    // e-for='item of items',  e-for='(item, index) of items'
    // e-for='key in object', e-for='(key, value) in object'
    // e-for='(key, value, index) in object'
    let forSeparator = ' of ';
    let forParts = forExpression.split(forSeparator);
    if (!(forParts.length > 1))
      forParts = forExpression.split(forSeparator = ' in ');
    const leftHand = forParts[0].replace(/\(|\)/g, '');
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
  const $OnArrayChanges = (detail) => {
    if (hasWhereFilter || hasOrderFilter)
      return execute(); // Reorganize re-insert all the items
    detail = detail || {};
    const method = detail.method;
    const args = detail.args;
    const mListedItems = listedItemsHandler;
    const reOrganizeIndexes = () => {
      // In case of unshift re-organize the indexes
      // Was wrapped into a promise in case of large amount of data
      return Promise.resolve((array) => {
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
      case 'pop':
      case 'shift': { // First or Last item removal handler
        const item = mListedItems[method]();
        if (isNull(item))
          return;
        removeEl(getRootElement(item.el));
        if (method === 'pop')
          return;
        return reOrganizeIndexes();
      }
      case 'splice': { // Indexed removal handler
        let index = args[0];
        const deleteCount = args[1];
        const removedItems = mListedItems.splice(index, deleteCount);
        forEach(removedItems, (item) => removeEl(getRootElement(item.el)));
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
      case 'push':
      case 'unshift': { // Addition handler
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
          if (isUnshift)
            reference = ref;
        });
        if (isUnshift)
          reOrganizeIndexes();
        return;
      }
      default:
        return execute();
    }
  };
  const applyWhere = (listCopy, config) => {
    const parts = config.split(':').map(item => trim(item));
    if (parts.length == 1) {
      Logger.error(('Invalid “' + nodeName + '” where expression “' + node.nodeValue +
        '”, at least a where-value and where-keys, or a filter-function must be provided'));
    } else {
      return $Where(listCopy, parts);
    }
  };
  const reactivePropertyEvent = ReactiveEvent.on('AfterGet', descriptor => {
    binder.binds.push({
      isConnected: isActive,
      watch: descriptor.onChange((_n, _o, detail) => $OnArrayChanges(detail), node)
    });
  });
  let expObj = $ExpressionBuilder(node.nodeValue);
  const filters = expObj.filters;
  const findFilter = (fName) => filters.filter(item => item.substring(0, fName.length) === fName);
  const whereFilterConfigs = findFilter('where');
  // Applying the filter before rendering the items
  forEach(whereFilterConfigs, config => applyWhere(expObj.sourceValue, config));
  reactivePropertyEvent.off();
  (execute = () => {
    expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
    const iterable = expObj.iterableExpression;
    const orderFilterConfigs = findFilter('order');
    // Cleaning the existing items
    forEach(listedItemsHandler, item => {
      const element = getRootElement(item.el);
      if (!element.parentElement)
        return;
      container.removeChild(element);
    });
    listedItemsHandler = [];
    evaluator.exec({
      data: data,
      returnable: false,
      context: context,
      code: 'var __e = __each, __fl = __filters, __f = __for; ' +
        '__f(__fl(' + iterable + '), function($$itm, $$idx) { __e($$itm, $$idx); })',
      aditional: {
        __for: forEach,
        __each: (item, index) => $InsertForItem({
          index,
          item
        }),
        __filters: (list) => {
          let listCopy = Extend.array(list);
          // applying where:
          forEach(whereFilterConfigs, config => listCopy = applyWhere(listCopy, config));
          // applying order:
          const applyOrder = (config) => {
            const parts = config.split(':').map(item => trim(item));
            if (parts.length == 1) {
              Logger.error(('Invalid “' + nodeName + '” order  expression “' + node.nodeValue +
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

function $skeleton(opitons) {
  var _a;
  const {
    node,
    bouer
  } = opitons;
  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));
  if (nodeValue !== '')
    return;
  const ownerNode = toOwnerNode(node);
  ownerNode.removeAttribute(node.nodeName);
  const uid = ownerNode.getAttribute('skeleton-clone-code');
  if (!uid)
    return;
  ownerNode.removeAttribute('skeleton-clone-code');
  forEach([].slice.call((_a = bouer.el) === null || _a === void 0 ? void 0 : _a.querySelectorAll('[="' + uid + '"]')), (el) => {
    (el.parentElement || el.parentNode).removeChild(el);
  });
}

function $skip(options) {
  const {
    node
  } = options;
  node.nodeValue = 'true';
}
const Validator = (function() {
  const invalidInputClass = 'is-invalid';

  function innerValidateRequired(fieldInfo) {
    var _a;
    const errorList = [];
    const {
      field,
      name,
      value,
      type
    } = fieldInfo;
    const required = (_a = fieldInfo.required) !== null && _a !== void 0 ? _a : false;
    const isValidValue = () => {
      return required == true ? (value != null && (value + '').trim() != '') : true;
    };
    const addError = (error, clear) => {
      if (clear === true)
        errorList.splice(0, errorList.length);
      errorList.push(error);
      field.classList.add(invalidInputClass);
    };
    if (!isValidValue()) {
      addError({
        rule: 'required',
        message: `The field ${name} is required.`,
        field: field,
        value: value
      });
    }
    return {
      errors: errorList,
      isValidValue,
      addError
    };
  }

  function innerValidateCheck(fieldInfo, isValidValue, addError) {
    const {
      field,
      name,
      value,
      check
    } = fieldInfo;
    // Check validation
    if (check != null && check.indexOf(value) < 0) {
      addError({
        rule: 'check',
        message: `The field ${name} with value ${value} does not match the required options.`,
        field: field,
        value: value
      });
      field.classList.add(invalidInputClass);
    }
  }

  function innerValidateFunction(fieldInfo, addError) {
    if (!fieldInfo.fn)
      return;
    const {
      name,
      field,
      value,
      fn
    } = fieldInfo;
    const result = fn(fieldInfo);
    const {
      valid,
      message,
      override
    } = typeof result == 'object' ? result : {
      valid: result,
      message: `The field ${name} does not have the expected value.`,
      override: false
    };
    const clearPreviousError = valid == false && override == true;
    if (!valid) {
      field.classList.add(invalidInputClass);
      addError({
        rule: 'function',
        message: message,
        field: field,
        value: value
      }, clearPreviousError);
      field.classList.add(invalidInputClass);
    }
  }

  function validateString(fieldInfo) {
    const {
      field,
      pattern,
      name,
      value,
      length
    } = fieldInfo;
    const {
      min,
      max
    } = typeof length == 'object' ? length : {
      min: 0,
      max: length
    };
    const {
      errors,
      isValidValue,
      addError
    } = innerValidateRequired(fieldInfo);
    // Minimum length validation
    if (min != null && isValidValue() && value.length < min) {
      addError({
        rule: 'length:min',
        message: `The field ${name} should have at least ${min} characters. Current length: ${value.length}.`,
        field: field,
        value: value
      });
    }
    // Maximum length validation
    if (max != null && isValidValue() && value.length > max) {
      addError({
        rule: 'length:max',
        message: `The field ${name} should have at most ${max} characters. Current length: ${value.length}.`,
        field: field,
        value: value
      });
    }
    // Regex validation
    if (pattern != null && isValidValue()) {
      const validator = {
        'date': () => {
          return value.match(
            // eslint-disable-next-line max-len
            /^(?:\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])|(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/\d{4}|(?:0[1-9]|[12]\d|3[01])\/(?:0[1-9]|1[0-2])\/\d{4})$/);
        },
        'date-time': () => {
          return value.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[T ]([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d{1,3})?Z?$/);
        },
        'email': () => {
          return value.match(/^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]{3,}\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/);
        },
        'regex': () => {
          return value.match(new RegExp(pattern));
        }
      };
      // Validates the pattern as named pattern, otherwise, validate the the pattern as regex
      const isValidPattern = (validator[pattern] || validator['regex'])();
      if (!isValidPattern) {
        addError({
          rule: 'regex',
          message: `The field ${name} does not match the ${(pattern in validator) ? pattern : 'regex'} pattern.`,
          field: field,
          value: value
        });
      }
    }
    // Check validation
    innerValidateCheck(fieldInfo, isValidValue, addError);
    // Function validation
    innerValidateFunction(fieldInfo, addError);
    return errors;
  }

  function validateNumber(fieldInfo) {
    let {
      name,
      value,
      length,
      field
    } = fieldInfo;
    const {
      min,
      max
    } = typeof length == 'object' ? length : {
      min: 0,
      max: length
    };
    const {
      errors,
      isValidValue,
      addError
    } = innerValidateRequired(fieldInfo);
    // is value a valid number
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.exec(value)) {
      addError({
        rule: 'number',
        message: `The field ${name} should have a number value.`,
        field: field,
        value: value
      });
    } else {
      value = value * 1; // Convert to the presented number
    }
    // Minimum validation
    if (min != null && value < min) {
      addError({
        rule: 'length:min',
        message: `The field ${name} should be greater than or equal to ${min}.`,
        field: field,
        value: value
      });
    }
    // Maximum validation
    if (max != null && value > max) {
      addError({
        rule: 'length:max',
        message: `The field ${name} should be less than or equal to ${max}.`,
        field: field,
        value: value
      });
    }
    // Check validation
    innerValidateCheck(fieldInfo, isValidValue, addError);
    // Function validation
    innerValidateFunction(fieldInfo, addError);
    return errors;
  }

  function validateBoolean(fieldInfo) {
    let {
      name,
      value,
      field
    } = fieldInfo;
    const {
      errors,
      isValidValue,
      addError
    } = innerValidateRequired(fieldInfo);
    // is value a valid number
    if (!isValidValue() && !/^(TRUE|True|true|1|FALSE|False|false|0)?$/.exec(value)) {
      addError({
        rule: 'boolean',
        message: `The field ${name} should be a boolean. Current value: ${value}`,
        field: field,
        value: value
      });
    } else {
      value = ['true', '1'].indexOf(value.toLowerCase()) > -1 ? true : false; // Convert to the presented boolean value
    }
    // Function validation
    innerValidateFunction(fieldInfo, addError);
    return errors;
  }

  function validate(fieldInfo) {
    const type = fieldInfo.type = fieldInfo.type || 'string';
    switch (type) {
      case 'string':
        return validateString(fieldInfo);
      case 'number':
        return validateNumber(fieldInfo);
      case 'boolean':
        return validateBoolean(fieldInfo);
      default:
        return [];
    }
  }
  return class FormValidator {
    static validate(fieldInfo) {
      return validate(fieldInfo);
    }
  };
})();
class FieldSchema {
  constructor(options) {
    this.errors = [];
    this.field = undefined;
    this.name = undefined;
    this.type = undefined;
    this.value = undefined;
    Object.assign(this, options || {});
  }
  init(options) {
    Object.assign(this, options);
    return this;
  }
  isValid() {
    const errors = Validator.validate(this);
    return (this.errors = errors).length === 0;
  }
  validate() {
    return this.isValid();
  }
}
class SchemaBuilder {
  constructor(context, compiler, evaluator) {
    this._IRT_ = true;
    this.schemas = [];
    this.context = context;
    this.compiler = compiler;
    this.evaluator = evaluator;
    this.schema = {};
  }
  build(entry) {
    const data = entry.data;
    const $schema = this.schema = entry.schema;
    const compiler = this.compiler;
    const evaluator = this.evaluator;
    const rootElement = entry.element;
    const options = entry.options || {};
    const buildType = options.type || 'REACTIVE';
    const isReactive = buildType === 'REACTIVE';
    // Remove `[ ]` and `,` and return an array of the names provided
    const mNames = (options.names || '[name]').replace(/\[|\]/g, '').split(',');
    const mValues = (options.values || '[value]').replace(/\[|\]/g, '').split(',');
    // Elements that skipped on serialization process
    const escapes = {
      BUTTON: true
    };
    const checkables = {
      checkbox: true,
      radio: true
    };
    const formLayerSchema = new WeakMap();
    const trySetBuilderInFormSchema = (currentScope, $schema) => {
      const formSchema = currentScope.$form;
      if (!formSchema || formSchema.schema)
        return;
      formSchema.schema = $schema;
    };
    const getValue = (el, fieldName) => {
      if (fieldName in el)
        return el[fieldName];
      return el.getAttribute(fieldName) || el.innerText;
    };
    const getFieldValue = (el) => {
      let val = undefined;
      mValues.find((field) => (val = getValue(el, field)) ? true : false);
      return val;
    };
    const getFieldStructure = (schema, fieldName, el, scopeData) => {
      const field = findAttribute(el, [Constants.form.schema], true);
      const codeFieldInfo = schema[fieldName] || {};
      if (field == null)
        return codeFieldInfo;
      const htmlFieldInfo = evaluator.exec({
        data: scopeData,
        context: this.context,
        code: field.value,
        returnable: true
      }) || {};
      if (!isEmptyObject(htmlFieldInfo) && !isEmptyObject(codeFieldInfo)) {
        Logger.warn(`WARNING in <${toLower(el.tagName)} name="${fieldName}" />: You cannot ` +
          `use both \`schema\` attribute “e-schema” and \`schema\` code at the same time.`);
      }
      return Extend.obj(htmlFieldInfo, codeFieldInfo);
    };
    // Use the up array to map the layers and check what layer the compiler is
    const findParentBuildElement = function(el) {
      const parentElement = el.parentElement;
      if (parentElement == rootElement || parentElement == null)
        return rootElement;
      const isBuild = parentElement.hasAttribute(Constants.form.build) ||
        parentElement.hasAttribute(Constants.form.abuild);
      if (isBuild)
        return parentElement;
      return findParentBuildElement(parentElement);
    };
    const processInput = (options) => {
      const {
        el: input,
        schema,
        scopeData
      } = options;
      const attr = findAttribute(input, mNames);
      // Checking if the element has the names on it
      if (!attr)
        return;
      const attrName = attr.value;
      const type = findAttribute(input, ['type']);
      const typeName = (!type || toLower(type.value) == 'text') ? 'string' : toLower(type.value);
      // If is escapable, stop
      if (escapes[input.tagName] === true)
        return;
      // If it's is checkable and it's not selected, stop
      if ((input instanceof HTMLInputElement) && (checkables[input.type] === true && input.checked === false))
        return;
      // Retrieving the value if it needs to be build as arry property
      const isArray = findAttribute(input, ['e-array']) != null;
      // if it is not an array built type, just set the value
      // Form Field
      const $fieldSchema = new FieldSchema(getFieldStructure(schema, attrName, input, scopeData)).init({
        field: input,
        name: attrName,
        type: isArray ? 'array' : typeName
      });
      $fieldSchema.form = scopeData.$form;
      // Assigning the value of element if there is not a
      if (isNull($fieldSchema.value))
        $fieldSchema.value = getFieldValue(input);
      // Transforming the value and errors to reactive
      Reactive.transform({
        context: this.context,
        data: $fieldSchema,
        keys: ['value', 'errors']
      });
      if (!Constants.check(input, 'e-bind'))
        input.setAttribute('e-bind', 'value');
      compiler.compile({
        context: this.context,
        data: $fieldSchema,
        el: input
      });
      // Adding the element a list to be easier to validate
      this.schemas.push($fieldSchema);
      // Setting the element prop in the schema
      // if it is not an array built type, just set the value
      if (!isArray) {
        // Field Info Set
        if (attrName in schema)
          delete schema[attrName];
        schema[attrName] = $fieldSchema;
      } else {
        // Getting the value from if exists, otherwise set default value as empty array
        const $oldValue = (schema[attrName] || []);
        schema[attrName] = $oldValue.concat($schema);
      }
      if (isReactive) {
        Reactive.transform({
          context: this.context,
          data: schema,
          keys: [attrName]
        }); // Setting the property to reactive
      }
    };
    const getSchema = (options) => {
      const currentElement = options.el;
      const currentScopeData = options.scopeData;
      const parentBuild = findParentBuildElement(currentElement);
      const currentSchema = formLayerSchema.get(parentBuild);
      trySetBuilderInFormSchema(currentScopeData, currentSchema);
      return currentSchema;
    };
    const setSchema = (options) => {
      const currentElement = options.el;
      const currentScopeData = options.scopeData;
      const currentParentBuild = findParentBuildElement(currentElement);
      const currentSchema = formLayerSchema.get(currentParentBuild);
      // Finding e-build property
      const attrBuild = findAttribute(currentElement, [
                Constants.form.build,
                Constants.form.abuild,
            ]);
      if (!attrBuild)
        return currentSchema;
      const attrValue = attrBuild.value;
      const attrName = attrBuild.name;
      // Retrieving the value if it needs to be build as arry property
      const isArray = attrName === 'e-build:array' || findAttribute(currentElement, ['e-array']) != null;
      let $$schema = {};
      let currentSchemaValue = currentSchema[attrValue];
      // Setting the element prop in the schema
      // if it is not an array built type, just set the value
      if (!isArray) {
        // if there is already a value, do nothing
        if (currentSchemaValue) {
          $$schema = currentSchemaValue;
        }
        // Field Info Set
        currentSchema[attrValue] = $$schema;
      } else {
        const values = currentSchemaValue;
        // Check if there is already a value and the first element is a FieldSchema
        if (values && values.length > 0) {
          $$schema = values[values.length - 1];
        } else {
          // Getting the value from if exists, otherwise set default value as empty array
          const $oldValue = (currentSchema[attrValue] || []);
          currentSchema[attrValue] = $oldValue.concat($$schema);
        }
      }
      if (isReactive) {
        Reactive.transform({
          context: this.context,
          data: currentSchema,
          keys: [attrValue]
        }); // Setting the property to reactive
      }
      formLayerSchema.set(currentElement, $$schema);
      trySetBuilderInFormSchema(currentScopeData, currentSchema);
    };
    // Clearing the Schemas, in case of FormBuilder re-use
    this.schemas = [];
    // Initializing the Schema Layer
    formLayerSchema.set(rootElement, $schema);
    if (isReactive) {
      const arrayElements = Extend.array(toArray(rootElement.querySelectorAll('[e-build\\:array]')), toArray(rootElement.querySelectorAll('[e-array]')));
      forEach(arrayElements, (el) => {
        const attr = findAttribute(el, ['e-build:array', 'e-build']);
        if (!attr)
          return;
        const varName = code(3, '_');
        el.setAttribute('e-for', `${varName} of $form.parent.get('${attr.value}')`);
      });
    }
    compiler.compile({
      context: this.context,
      data: data,
      el: rootElement,
      beforeCompile: (element, scopeData) => {
        if (!(element instanceof Element))
          return;
        setSchema({
          el: element,
          scopeData: scopeData
        });
      },
      afterCompile: (element, scopeData) => {
        if (!(element instanceof Element))
          return;
        processInput({
          el: element,
          schema: getSchema({
            el: element,
            scopeData: scopeData
          }),
          scopeData: scopeData
        });
      }
    });
    return this;
  }
  toObject() {
    return (function walker(schema, $obj) {
      for (const key in schema) {
        const property = schema[key];
        if (property instanceof FieldSchema) {
          Prop.set($obj, key, {
            enumerable: true,
            get() {
              return property.value;
            },
            set(v) {
              property.value = v;
            }
          });
          $obj[key] = property.value;
        } else if (property instanceof Array) {
          $obj[key] = property.map((item) => walker(item, {}));
        } else if (typeof property == 'object') {
          $obj[key] = walker(property, {});
        }
      }
      return $obj;
    })(this.schema, {});
  }
}
class FormHandler {
  constructor(schema, builderOptions) {
    this._IRT_ = true;
    this.schemas = [];
    // Assigning an empty object if formObject is not provided
    this.schema = schema || {};
    this.builderOptions = builderOptions || {};
    this.evaluator = $default();
    this.formElement = $default();
  }
  resolveElement(el) {
    let element = el;
    // If it's not a HTML Element, just return
    if ((element instanceof Element))
      return element;
    // If it's a string try to get the element
    else if (typeof element === 'string') {
      try {
        if (!(element = DOM.querySelector(element))) {
          Logger.error('Element with "' + element + '" selector not found.');
          return undefined;
        }
      } catch (error) {
        // Unknown error
        Logger.error(buildError(error));
        return undefined;
      }
    }
    // If the element is not
    if (isNull(element))
      throw Logger.error('Invalid element provided at “' + element + '”.');
    return element;
  }
  init(options) {
    const {
      element,
      context,
      data,
      bouer
    } = options;
    this.bouer = bouer;
    this.context = context;
    this.formElement = this.resolveElement(element);
    this.schemas = [];
    const compiler = IoC.app(bouer).resolve(Compiler);
    const evaluator = this.evaluator = IoC.app(bouer).resolve(Evaluator);
    const $builder = this.$builder = new SchemaBuilder(this.context, compiler, evaluator);
    $builder.build({
      element: this.formElement,
      schema: this.schema,
      options: this.builderOptions,
      data: Extend.obj(data, {
        $form: new FormSchema({
          currentNode: this.formElement,
          scopeData: data
        })
      }),
    });
    this.schemas = $builder.schemas;
    return this;
  }
  get(path) {
    if (path == null || path == '')
      return undefined;
    if (this.evaluator == null) {
      Logger.error('FormHandler is not initialized');
      return undefined;
    }
    return this.evaluator.exec({
      returnable: true,
      context: this.context,
      data: this.schema,
      code: path,
    });
  }
  set(path, value) {
    const field = this.get(path);
    if (field == null)
      return;
    field.value = value;
  }
  validate() {
    let isValid = true;
    for (const field of this.schemas) {
      if (!field.isValid())
        isValid = false;
    }
    return isValid;
  }
  toObject() {
    if (this.$builder == null) {
      Logger.error('SchemaBuilder is not initialized.');
      return {};
    }
    return this.$builder.toObject();
  }
}

function $form(opitons) {
  const {
    node,
    context,
    evaluator,
    data
  } = opitons;
  const ownerNode = toOwnerNode(node); // The Form that needs to be initialized
  const nodeName = node.nodeName;
  const nodeValue = ifNullReturn(node.nodeValue, '');
  const errorInvalidValue = (node) => ('Invalid value, expected an Object/Object Literal in “' +
    nodeName + '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
  if (nodeValue === '')
    return Logger.error(errorInvalidValue(node));
  let formEntryDataSource = $default();
  const reactiveEvent = ReactiveEvent.on('AfterGet', (descriptor) => {
    formEntryDataSource = descriptor.propSource;
  });
  const entryForm = evaluator.exec({
    data: data,
    code: nodeValue,
    context: context
  });
  reactiveEvent.off();
  if (!isObject(entryForm))
    return Logger.error(errorInvalidValue(node));
  const formHandler = entryForm instanceof FormHandler
    // Return the FormHandler
    ?
    entryForm
    // Create a new annonymous FormHandler
    :
    new FormHandler(entryForm.schema);
  // Removing the form directive
  ownerNode.removeAttribute(node.nodeName);
  if (formEntryDataSource) {
    delete formEntryDataSource[nodeValue];
    formEntryDataSource[nodeValue] = formHandler;
  }
  return formHandler.init({
    element: ownerNode,
    context: context,
    bouer: opitons.compiler.bouer,
    data: data,
  });
}
class Directive {
  constructor(compiler, customDirective, compilerContext) {
    this._IRT_ = true;
    this.customDirectives = {};
    this.compiler = compiler;
    this.context = compilerContext;
    this.bouer = compiler.bouer;
    this.customDirectives = customDirective;
    this.evaluator = IoC.app(this.bouer).resolve(Evaluator);
    this.delimiter = IoC.app(this.bouer).resolve(DelimiterHandler);
    this.binder = IoC.app(this.bouer).resolve(Binder);
    this.eventHandler = IoC.app(this.bouer).resolve(EventHandler);
  }
  // Directives
  skip(node) {
    return $skip({
      node: node
    });
  }
  if (node, data, compilationHooks) {
    return $if({
      binder: this.binder,
      compiler: this.compiler,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      data: data,
      node: node,
      compilationHooks: compilationHooks
    });
  }
  show(node, data) {
    return $show({
      binder: this.binder,
      evaluator: this.evaluator,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      data: data
    });
  }
  for (node, data, compilationHooks) {
    return $for({
      binder: this.binder,
      compiler: this.compiler,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      eventHandler: this.eventHandler,
      data: data,
      node: node,
      compilationHooks: compilationHooks
    });
  }
  def(node, data) {
    return $def({
      bouer: this.bouer,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      data: data,
      node: node
    });
  }
  text(node) {
    return $text({
      node: node
    });
  }
  bind(node, data) {
    return $bind({
      binder: this.binder,
      context: this.context,
      delimiter: this.delimiter,
      data: data,
      node: node
    });
  }
  property(node, data) {
    return $property({
      binder: this.binder,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      node: node,
      data: data
    });
  }
  data(node, data, compilationHooks) {
    return $data({
      bouer: this.bouer,
      compiler: this.compiler,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      context: this.context,
      node: node,
      data: data,
      compilationHooks: compilationHooks
    });
  }
  href(node, data) {
    return $href({
      bouer: this.bouer,
      binder: this.binder,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      data: data
    });
  }
  entry(node, data) {
    return $entry({
      bouer: this.bouer,
      delimiter: this.delimiter,
      node: node,
      data: data
    });
  }
  put(node, data, compilationHooks) {
    return $put({
      bouer: this.bouer,
      binder: this.binder,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      data: data,
      compilationHooks: compilationHooks
    });
  }
  req(node, data, compilationHooks) {
    return $req({
      bouer: this.bouer,
      compiler: this.compiler,
      delimiter: this.delimiter,
      context: this.context,
      eventHandler: this.eventHandler,
      binder: this.binder,
      node: node,
      data: data,
      compilationHooks: compilationHooks
    });
  }
  wait(node, compilationHooks) {
    return $wait({
      bouer: this.bouer,
      compiler: this.compiler,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      compilationHooks: compilationHooks
    });
  }
  custom(node, data) {
    return custom({
      binder: this.binder,
      evaluator: this.evaluator,
      delimiter: this.delimiter,
      context: this.context,
      customDirectives: this.customDirectives,
      node: node,
      data: data,
    });
  }
  form(node, data) {
    return $form({
      evaluator: this.evaluator,
      context: this.context,
      compiler: this.compiler,
      node: node,
      data: data
    });
  }
  skeleton(node) {
    return $skeleton({
      node: node,
      bouer: this.bouer
    });
  }
}
class Compiler {
  constructor(bouer, binder, delimiterHandler, eventHandler, componentHandler, directives) {
    this._IRT_ = true;
    this.NODES_TO_IGNORE_IN_COMPILATION = {
      'SCRIPT': 1,
      '#comment': 8
    };
    this.bouer = bouer;
    this.directives = directives !== null && directives !== void 0 ? directives : {};
    this.binder = binder;
    this.delimiter = delimiterHandler;
    this.eventHandler = eventHandler;
    this.component = componentHandler;
    this.dataStore = IoC.app(bouer).resolve(DataStore);
  }
  /**
   * Compiles an html element
   * @param {string} options the options of the compilation process
   * @returns the element compiled
   */
  compile(options) {
    var _a;
    const rootElement = options.el;
    const context = options.context || this.bouer;
    const data = (options.data || this.bouer.data);
    const routing = IoC.app(this.bouer).resolve(Routing);
    const directivesToIgnore = options.directivesToIgnore || [];
    const beforeCompile = options.beforeCompile || $default;
    const afterCompile = options.afterCompile || $default;
    const onComponentLoad = options.onComponentLoad || $default;
    const getElementData = (node, defaultData) => {
      if (!(node instanceof Element))
        return defaultData;
      return this.dataStore.getNodeData(node, defaultData);
    };
    if (!rootElement)
      return Logger.error('Invalid element provided to the compiler.');
    const iNode = rootElement;
    const isActive = iNode.isActive = (_a = iNode.isActive) !== null && _a !== void 0 ? _a : (() => rootElement.isConnected);
    if (!this.analize(rootElement.outerHTML))
      return rootElement;
    const directive = new Directive(this, this.directives || {}, context);
    const loadingComponents = [];
    fnCallResolver(beforeCompile.call(context, rootElement, data));
    const walker = (currentNode, scopeData) => {
      if (currentNode.nodeName in this.NODES_TO_IGNORE_IN_COMPILATION)
        return;
      // Intercept Directive by node
      if (directivesToIgnore.indexOf(currentNode.nodeName) >= 0)
        return;
      // First Element Attributes compilation
      if (currentNode instanceof Element) {
        const attributes = currentNode.attributes;
        // e-skip directive
        if (Constants.skip in attributes)
          return directive.skip(currentNode);
        // Intercept Directive in the Element
        if (findOneBy(directivesToIgnore, (dir) => dir in attributes))
          return;
        // e-def="{...}" directive
        if (Constants.def in attributes)
          directive.def(findDirective(currentNode, Constants.def), scopeData);
        // e-entry="..." directive | <component />
        if (Constants.entry in attributes)
          directive.entry(findDirective(currentNode, Constants.entry), scopeData);
        // wait-data="..." directive
        if (Constants.wait in attributes)
          return directive.wait(findDirective(currentNode, Constants.wait), {
            beforeCompile: beforeCompile,
            afterCompile: afterCompile
          });
        // e-form directive
        if (Constants.form.property in attributes)
          return directive.form(findDirective(currentNode, Constants.form.property), scopeData);
        if (FormSchema.isBuild(currentNode)) {
          return walker(currentNode, Extend.obj(scopeData, {
            $form: new FormSchema({
              currentNode,
              scopeData
            })
          }));
        }
        // e-for="..." directive
        if (Constants.for in attributes)
          return directive.for(findDirective(currentNode, Constants.for), scopeData, {
            beforeCompile: beforeCompile,
            afterCompile: afterCompile
          });
        // <component />
        if (this.component.check(currentNode.localName)) {
          return loadingComponents.push(new Promise((resolver, reject) => {
            this.component.order({
              directivesToIgnore: directivesToIgnore,
              context: context,
              componentElement: currentNode,
              data: scopeData,
              compilationHooks: {
                beforeCompile: beforeCompile,
                afterCompile: afterCompile,
              },
              onComponentLoad(component) {
                resolver(component);
              },
              onComponentFail() {
                reject(currentNode);
              },
            });
          }));
        }
        // e-if="..." directive
        if (Constants.if in attributes)
          return directive.if(findDirective(currentNode, Constants.if), scopeData, {
            beforeCompile: beforeCompile,
            afterCompile: afterCompile
          });
        // e-else-if="..." or e-else directive
        if ((Constants.elseif in attributes) || (Constants.else in attributes))
          Logger.warn('The “' + Constants.elseif + '” or “' + Constants.else +
            '” requires an element with “' + Constants.if+'” above.');
        // e-show="..." directive
        if (Constants.show in attributes)
          directive.show(findDirective(currentNode, Constants.show), scopeData);
        // e-req="..." | e-req:[id]="..."  directive
        let reqNode = null;
        if ((reqNode = findDirective(currentNode, Constants.req)))
          return directive.req(reqNode, scopeData, {
            beforeCompile: beforeCompile,
            afterCompile: afterCompile
          });
        // data="..." | data:[id]="..." directive
        let dataNode = null;
        if ((dataNode = findDirective(currentNode, Constants.data)))
          return directive.data(dataNode, scopeData, {
            beforeCompile: beforeCompile,
            afterCompile: afterCompile
          });
        // put="..." directive
        if (Constants.put in attributes)
          return directive.put(findDirective(currentNode, Constants.put), scopeData, {
            beforeCompile: beforeCompile,
            afterCompile: afterCompile
          });
        // route-view node
        if (routing.routeView === currentNode)
          return;
        // Looping the attributes
        forEach(toArray(attributes), (attr) => walker(attr, scopeData));
      }
      // :href="..." or !href="..." directive
      if (Constants.check(currentNode, Constants.href))
        return directive.href(currentNode, scopeData);
      // e-text="..." directive
      if (Constants.check(currentNode, Constants.text))
        return directive.text(currentNode);
      // e-bind:[?]="..." directive
      if (Constants.check(currentNode, Constants.bind))
        return directive.bind(currentNode, scopeData);
      // Custom directive
      let isCustomDirective = false;
      if (isCustomDirective = Object.keys(directive.customDirectives).find(name => Constants.check(currentNode, name)) != null)
        if (directive.custom(currentNode, scopeData))
          return;
      // e-[?]="..." directive
      if (Constants.check(currentNode, Constants.property) && !isCustomDirective)
        directive.property(currentNode, scopeData);
      // e-skeleton directive
      if (Constants.check(currentNode, Constants.skeleton))
        directive.skeleton(currentNode);
      // Event handler
      // on:[?]="..." directive
      if (Constants.check(currentNode, Constants.on))
        return this.eventHandler.compile(currentNode, scopeData, context);
      // ShortHand directive: {title}
      let delimiterField;
      if (delimiterField = this.delimiter.shorthand(currentNode.nodeName)) {
        const element = (currentNode.ownerElement || currentNode.parentNode);
        const attrName = 'e-' + delimiterField.expression;
        element.setAttribute(attrName, delimiterField.field);
        const attr = element.attributes.getNamedItem(attrName);
        attr.isActive = isActive;
        element.attributes.removeNamedItem(currentNode.nodeName);
        return this.binder.create({
          node: attr,
          fields: [delimiterField],
          context: context,
          data: scopeData
        });
      }
      // Property binding
      let delimitersFields;
      if (isString(currentNode.nodeValue) && (delimitersFields = this.delimiter.run(currentNode.nodeValue)) &&
        delimitersFields.length !== 0) {
        this.binder.create({
          node: currentNode,
          fields: delimitersFields,
          context: context,
          data: scopeData
        });
      }
      const dataToUse = getElementData(currentNode, scopeData);
      forEach(toArray(currentNode.childNodes), (childNode) => {
        childNode.isActive = isActive;
        fnCallResolver( // Before Compile the element...
          beforeCompile.call(context, childNode, dataToUse));
        // Executing...
        walker(childNode, dataToUse);
        fnCallResolver( // After Compile the element...
          afterCompile.call(context, childNode, dataToUse));
      });
    };
    walker(rootElement, getElementData(rootElement, data));
    fnCallResolver( // After Compile the element...
      afterCompile.call(context, rootElement, data));
    if (rootElement.hasAttribute && rootElement.hasAttribute(Constants.silent))
      rootElement.removeAttribute(Constants.silent);
    const onCompilationFinished = () => {
      this.eventHandler.emit({
        eventName: Constants.builtInEvents.compile,
        attachedNode: rootElement,
        once: true,
        init: {
          detail: data
        }
      });
      const dt = data;
      fnCallResolver(onComponentLoad.call(context, rootElement, dt));
    };
    if (loadingComponents.length == 0)
      onCompilationFinished();
    else
      Promise.all(loadingComponents)
      .then(() => onCompilationFinished())
      .catch(() => onCompilationFinished());
    return rootElement;
  }
  analize(htmlSnippet) {
    const tagRegexRule = '<([a-z0-9-_]{1,}|/[a-z0-9-_]{1,})((.|\n|\r)*?)>';
    // Removing unnecessary verification
    const htmlForParser = htmlSnippet
      .replace(/<script((.|\n|\r)*?)<\/script>/gm, '<script></script>')
      .replace(/<style((.|\n|\r)*?)<\/style>/gm, '<style></style>')
      .replace(/<pre((.|\n|\r)*?)<\/pre>/gm, '<pre></pre>')
      .replace(/<code((.|\n|\r)*?)<\/code>/gm, '<code></code>')
      .replace(/<svg((.|\n|\r)*?)<\/svg>/gm, '<svg></svg>')
      .replace(/<!--((.|\n|\r)*?)-->/gm, '')
      .replace(/&nbsp;/g, '&#160;');
    const indentChar = '  ';
    const history = [];
    const tagsTree = [];
    let indentNumber = 0;
    let message = '';
    let isValid = true;
    // Getting the tags
    const tagElements = htmlForParser.match(new RegExp(tagRegexRule, 'ig')) || [];
    const selfCloseTags = new Set([
            'area', 'base', 'br', 'col', 'embed',
            'hr', 'img', 'input', 'link', 'meta',
            'param', 'source', 'track', 'wbr'
        ]);
    for (let i = 0; i < tagElements.length; i++) {
      const tagElement = tagElements[i];
      const match = tagElement.match(new RegExp(tagRegexRule, 'i'));
      const tagName = toLower(match[1]);
      const isClosing = tagElement[1] === '/';
      history.push({
        tag: tagElement,
        ident: isClosing ? indentNumber : ++indentNumber,
      });
      if (selfCloseTags.has(tagName))
        continue;
      tagsTree.push({
        name: tagName,
        tag: tagElement
      });
      // In case of closing
      if (isClosing) {
        indentNumber--;
        // Keep building the tree
        if (!isValid)
          continue;
        const closingTag = tagsTree.pop();
        const openningTag = tagsTree.pop();
        if (!openningTag || openningTag.name !== closingTag.name.substring(1)) {
          indentNumber++;
          message = 'Syntax Error: Unexpected token, the openning tag `' + (openningTag.tag || 'NoToken') +
            '` does not match with closing tag: `' + closingTag.tag + '`:\n\n';
          isValid = false;
          history.push(history[history.length - 1]);
          history[history.length - 2] = {
            tag: '<====================== Line Error ======================',
            ident: indentNumber + 1
          };
          const lastOne = history[history.length - 1];
          lastOne.ident--; // reducing the ident
          indentNumber = lastOne.ident - 1;
        }
        continue;
      }
    }
    if (!isValid) {
      Logger.error(message +
        history.map((h, i) => ((i + 1) + '').padStart(3, ' ') + ' | ' +
          Array(h.ident)
          .fill(indentChar)
          .join('') + h.tag)
        .join('\n'));
    }
    return isValid;
  }
}
class UriHandler {
  constructor(url) {
    this._IRT_ = true;
    this.url = url || DOM.location.href;
  }
  params(urlPattern) {
    const mParams = {};
    if (urlPattern && isString(urlPattern)) {
      const urlWithQueryParamsIgnored = this.url.split('?')[0];
      const urlPartsReversed = urlWithQueryParamsIgnored.split('/').reverse();
      if (urlPartsReversed[0] === '')
        urlPartsReversed.shift();
      const urlPatternReversed = urlPattern.split('/').reverse();
      forEach(urlPatternReversed, (value, index) => {
        const valueExec = RegExp('{([\\S\\s]*?)}', 'ig').exec(value);
        if (Array.isArray(valueExec))
          mParams[valueExec[1]] = urlPartsReversed[index];
      });
    }
    // Building from query string
    const queryStr = this.url.split('?')[1];
    if (!queryStr)
      return mParams;
    const keys = queryStr.split('&');
    forEach(keys, key => {
      const pair = key.split('=');
      mParams[pair[0]] = (pair[1] || '').split('#')[0];
    });
    return mParams;
  }
  add(params) {
    const mParams = [];
    forEach(Object.keys(params), key => {
      mParams.push(key + '=' + params[key]);
    });
    const joined = mParams.join('&');
    return (this.url.includes('?')) ? '&' + joined : '?' + joined;
  }
  remove(param) {
    return param;
  }
}
class Component {
  /**
   * Default constructor
   * @param {string|object} optionsOrPath the path of the component or the compponent options
   */
  constructor(optionsOrPath, assets) {
    this._IRT_ = true;
    /** Indicates if the component is destroyed or not */
    this.isDestroyed = false;
    /** The children of the component */
    this.children = [];
    /** All the assets attached to the component */
    this.assets = [];
    /** Store temporarily this component UI orders */
    this.events = [];
    let _name = undefined;
    let _path = undefined;
    let _data = undefined;
    if (isObject(optionsOrPath)) {
      _name = optionsOrPath.name;
      _path = optionsOrPath.path;
      _data = optionsOrPath.data;
      Object.assign(this, optionsOrPath);
    } else {
      _path = optionsOrPath;
    }
    this.name = _name || '';
    this.path = _path || '';
    this.data = Reactive.transform({
      context: this,
      data: _data || {}
    });
    // Store the content to avoid showing it unnecessary
    const template = {
      value: (optionsOrPath || {}).template || ''
    };
    Prop.set(this, 'template', {
      get: () => template.value,
      set: (v) => template.value = v
    });
    ComponentHandler.prepareAssets(this, assets || []);
  }
  /**
   * The data that should be exported from the `<script>` tag to the root element
   * @param {object} data the data to export
   */
  export (data, props) {
    if (!isObject(data))
      return Logger.error('Invalid object for component.export(...), only "Object Literal" is allowed.');
    const isDataAComponent = (data instanceof Component);
    let nonExportableFields = null;
    if (isDataAComponent)
      nonExportableFields = new Set([
                'name',
                'path',
                'title',
                'route',
                'template',
                'data',
                'keepAlive',
                'prefetch',
                'children',
                'restrictions',
                'isDefault',
                'isNotFound',
                'requested',
                'created',
                'beforeMount',
                'mounted',
                'beforeLoad',
                'loaded',
                'beforeDestroy',
                'destroyed',
                'blocked',
                'failed'
            ]);
    return forEach(props || Object.keys(data), key => {
      if (nonExportableFields && nonExportableFields.has(key))
        return;
      this.data[key] = data[key];
      Prop.transfer(this.data, data, key);
    });
  }
  /**
   * Destroys the component
   */
  destroy() {
    if (!this.el)
      return false;
    if (this.isDestroyed && this.bouer && this.bouer.isDestroyed)
      return;
    if (!this.keepAlive)
      this.isDestroyed = true;
    const handler = IoC.app(this.bouer).resolve(ComponentHandler);
    handler.emit(this, 'beforeDestroy');
    const container = this.el.parentElement;
    if (container)
      container.removeChild(this.el);
    handler.emit(this, 'destroyed');
    // Destroying all the events attached to the this instance
    forEach(this.events, evt => this.off(evt.eventName, evt.callback));
    this.events = [];
    const components = handler.activeComponents;
    components.splice(components.indexOf(this), 1);
  }
  /**
   * Maps the parameters of the route in the component `route` and returns as an object
   */
  params() {
    return new UriHandler().params(this.route);
  }
  /**
   * Add an Event listener to the component
   * @param {string} eventName the event to be added
   * @param {Function} callback the callback function of the event
   */
  on(eventName, callback) {
    const instanceHooksSet = new Set([
            'created', 'beforeMount', 'mounted', 'beforeLoad', 'loaded', 'beforeDestroy', 'destroyed'
        ]);
    const registerHooksSet = new Set([
            'requested', 'blocked', 'failed'
        ]);
    if (registerHooksSet.has(eventName))
      Logger.warn('The “' + eventName + '” Event is called before the component is mounted, to be dispatched' +
        'it needs to be on registration object: { ' + eventName + ': function(){ ... }, ... }.');
    const evt = IoC.app(this.bouer).resolve(EventHandler).on({
      eventName,
      callback: callback,
      attachedNode: this.el,
      context: this,
      modifiers: {
        once: instanceHooksSet.has(eventName),
        autodestroy: false
      },
    });
    this.events.push(evt);
    return evt;
  }
  /**
   * Removes an Event listener to the component
   * @param {string} eventName the event to be added
   * @param {Function} callback the callback function of the event
   */
  off(eventName, callback) {
    IoC.app(this.bouer).resolve(EventHandler).off({
      eventName,
      callback: callback,
      attachedNode: this.el,
    });
    this.events = where(this.events, evt => !(evt.eventName == eventName && evt.callback == callback));
  }
  /**
   * Sets data into a target object, by default is the `component.data`
   * @param {object} inputData the data the should be setted
   * @param {object?} targetObject the target were the inputData
   * @returns the object with the data setted
   */
  set(inputData, targetObject) {
    const result = setData(this, inputData, targetObject);
    forEach(Object.keys(inputData), key => Prop.transfer(this, inputData, key));
    return result;
  }
}
class ComponentHandler {
  constructor(bouer, delimiterHandler, eventHandler, evaluator, routing) {
    this._IRT_ = true;
    // Handle all the components web requests to avoid multiple requests
    this.requests = {};
    this.components = {};
    // Avoids adding multiple styles of the same component if it's already in use
    this.stylesController = {};
    this.activeComponents = [];
    this.bouer = bouer;
    this.delimiter = delimiterHandler;
    this.eventHandler = eventHandler;
    this.evaluator = evaluator;
    this.rounting = routing;
  }
  check(nodeName) {
    return (nodeName in this.components);
  }
  request(path, response) {
    if (!isNull(this.requests[path]))
      return this.requests[path].push(response);
    this.requests[path] = [response];
    const baseElement = DOM.head.querySelector('base');
    const resolver = baseElement !== null && baseElement !== void 0 ? baseElement : urlResolver('/');
    // Building the URL according to the main path
    const componentPath = urlCombine(resolver.baseURI, path.replace(resolver.baseURI, ''));
    webRequest(componentPath, {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.text();
      })
      .then(content => {
        forEach(this.requests[path], (request) => {
          request.success(content, path);
        });
        delete this.requests[path];
      })
      .catch(error => {
        if (!baseElement)
          Logger.warn('It seems like you are not using the “<base href="/base/components/path/" />” ' +
            'element, try to add as the first child into “<head></head>” element.');
        forEach(this.requests[path], (request) => request.fail(error, path));
        delete this.requests[path];
      });
  }
  prepare(components, parent) {
    forEach(components, (entry) => {
      const isComponentClass = (entry.prototype instanceof Component);
      let component = entry;
      if (isComponentClass) {
        // Resolve the instance of the class
        component = IoC.app(this.bouer).resolve(entry) || IoC.new(entry);
        component.clazz = entry;
      }
      // In case of no-named-component, creates a name
      if (isNull(component.name) || !component.name) {
        // Generate a random name
        component.name = toLower(code(8, 'templ' + '-component-'));
        // But, if the component has a path, generate a beautiful name for it
        if (!isNull(component.path) || !component.path) {
          const pathSplitted = component.path.toLowerCase().split('/');
          let componentName = pathSplitted[pathSplitted.length - 1].replace('.html', '') || Component.name;
          // If the component name already exists generate a new one
          if (this.components[componentName]) {
            componentName = toLower(code(8, componentName + '-component-'));
          }
          component.name = componentName;
        }
      }
      // Normalize the name
      component.name = component.name.toLowerCase();
      let parentRoute = '';
      if (this.components[component.name])
        return Logger.warn('The component name “' + component.name + '” is already define, ' +
          'try changing the “component.name” property.');
      if (!isNull(parent)) {
        /** TODO: Inherit the parent info */
        parentRoute = parent.route || '';
      }
      if (!isNull(component.route)) { // Completing the route
        component.route = '/' + urlCombine(parentRoute, component.route);
      }
      if (Array.isArray(component.children))
        this.prepare(component.children, component);
      IoC.app(this.bouer).resolve(Routing)
        .configure(this.components[component.name] = component);
      const getContent = (path) => {
        if (!path)
          return;
        this.request(component.path, {
          success: content => {
            component.template = content;
          },
          fail: error => {
            Logger.error(buildError(error));
          }
        });
      };
      if (!isNull(component.prefetch)) {
        if (component.prefetch === true)
          return getContent(component.path);
        return;
      }
      if (!(component.prefetch = ifNullReturn(this.bouer.config.prefetch, true)))
        return;
      return getContent(component.path);
    });
  }
  order(options) {
    const {
      componentElement,
      data,
      context,
      onComponentLoad
    } = options;
    const $name = toLower(componentElement.nodeName);
    const component = this.components[$name];
    const onComponentFail = options.onComponentFail || $default;
    if (!component) {
      onComponentFail(componentElement);
      return Logger.error('No component with name “' + $name + '” registered.');
    }
    const mainExecutionWrapper = () => {
      const resolveComponentInstance = (c) => {
        let mComponent;
        if ((c instanceof Component) && c.clazz)
          mComponent = IoC.app(this.bouer).resolve(c.clazz) || IoC.new(c.clazz);
        else if (c instanceof Component)
          mComponent = structuredClone(c);
        else
          mComponent = new Component(c);
        if (mComponent.keepAlive === true)
          this.components[$name] = mComponent;
        mComponent.template = c.template;
        mComponent.bouer = this.bouer;
        mComponent.parent = context;
        return mComponent;
      };
      const isGroupableComponent = !component.template && !component.path;
      if (component.template || isGroupableComponent)
        return this.insert({
          componentElement: componentElement,
          component: resolveComponentInstance(component),
          directiveToIgnore: options.directivesToIgnore,
          data: data,
          onComponentLoad: onComponentLoad,
          onComponentFail: onComponentFail,
          compilationHooks: options.compilationHooks
        });
      if (!component.path) {
        onComponentFail(componentElement);
        return Logger.error('Expected a valid value in `path` or `template` got invalid value at “' + $name + '” component.');
      }
      this.addEvent('requested', componentElement, component, this.bouer)
        .emit();
      // Make component request or Add
      this.request(component.path, {
        success: content => {
          component.template = content;
          this.insert({
            componentElement: componentElement,
            component: resolveComponentInstance(component),
            data: data,
            onComponentLoad: onComponentLoad,
            onComponentFail: onComponentFail,
            directiveToIgnore: options.directivesToIgnore,
            compilationHooks: options.compilationHooks
          });
        },
        fail: (error) => {
          Logger.error('Failed to request <' + $name + '/> component with path “' +
            component.path + '”.');
          Logger.error(buildError(error));
          this.addEvent('failed', componentElement, component, this.bouer).emit();
          onComponentFail(componentElement);
        }
      });
    };
    // Checking the restrictions
    if (component.restrictions && component.restrictions.length > 0) {
      const blockedRestrictions = [];
      const restrictions = component.restrictions.map(restriction => {
        const restrictionResult = restriction.call(this.bouer, component);
        if (restrictionResult === false)
          blockedRestrictions.push(restriction);
        else if (restrictionResult instanceof Promise)
          restrictionResult
          .then(value => {
            if (value === false)
              blockedRestrictions.push(restriction);
          })
          .catch(() => blockedRestrictions.push(restriction));
        return restrictionResult;
      });
      const blockedEvent = this.addEvent('blocked', componentElement, component, this.bouer);
      const emitFailEvent = () => blockedEvent.emit({
        detail: {
          component: component.name,
          message: 'Component “' + component.name + '” blocked by restriction(s)',
          blocks: blockedRestrictions
        }
      });
      return Promise.all(restrictions)
        .then(restrictionValues => {
          if (restrictionValues.every(value => value == true))
            mainExecutionWrapper();
          else {
            onComponentFail(componentElement);
            emitFailEvent();
          }
        })
        .catch(() => emitFailEvent());
    }
    return mainExecutionWrapper();
  }
  find(predicate) {
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (predicate(component))
        return component;
    }
    return null;
  }
  /**
   * Subscribe the hooks of the instance
   * @param { Key } eventName the event name to be added
   * @param { Element } element the element to attach the event
   * @param { any } component the component object
   * @param { object } context the context of the compilation process
   */
  addEvent(eventName, element, component, context) {
    const callback = component[eventName];
    if (typeof callback === 'function')
      this.eventHandler.on({
        eventName,
        callback: evt => callback.call(context || component, evt),
        attachedNode: element,
        modifiers: {
          once: true
        },
        context: context || component
      });
    const emitter = (init) => {
      this.eventHandler.emit({
        attachedNode: element,
        once: true,
        eventName,
        init
      });
      this.eventHandler.emit({
        eventName: 'component:' + eventName,
        init: {
          detail: {
            component: component
          }
        }
      });
    };
    return {
      emit: (init) => emitter(init)
    };
  }
  insert(options) {
    var _a, _b;
    const componentElement = options.componentElement;
    const component = options.component;
    const data = options.data;
    const onComponentLoad = options.onComponentLoad || $default;
    const onComponentFail = options.onComponentFail || $default;
    const directivesToIgnore = options.directiveToIgnore;
    const beforeCompile = ((_a = options.compilationHooks) === null || _a === void 0 ? void 0 : _a.beforeCompile) || $default;
    const afterCompile = ((_b = options.compilationHooks) === null || _b === void 0 ? void 0 : _b.afterCompile) || $default;
    const $name = toLower(componentElement.nodeName);
    const container = componentElement.parentElement;
    const compiler = IoC.app(this.bouer).resolve(Compiler);
    const context = component.parent;
    if (!container) {
      return onComponentFail(componentElement);
    }
    if (isNull(component.template)) {
      onComponentFail(componentElement);
      return Logger.error('The <' + $name + '/> component is not ready yet to be inserted.');
    }
    if (!compiler.analize(component.template)) {
      return onComponentFail(componentElement);
    }
    // Adding the component to the active component list if it is not added
    if (this.activeComponents.indexOf(component) < 0)
      this.activeComponents.push(component);
    const slotContainer = createEl('SlotContainer', el => {
      el.innerHTML = componentElement.innerHTML;
      componentElement.innerHTML = '';
    }).build();
    const isKeepAlive = componentElement.hasAttribute('keep-alive') || ifNullReturn(component.keepAlive, false);
    // Component Creation
    if (isKeepAlive === false || isNull(component.el)) {
      createEl('body', htmlSnippet => {
        // If both .path and .template are invalid, it means that it's a groupable component
        const template = !component.path && !component.template ? '<div></div>' : component.template;
        htmlSnippet.innerHTML = template;
        forEach([].slice.call(htmlSnippet.children), (asset) => {
          if (['SCRIPT', 'LINK', 'STYLE'].indexOf(asset.nodeName) === -1)
            return;
          component.assets.push(asset);
          htmlSnippet.removeChild(asset);
        });
        if (htmlSnippet.children.length === 0)
          return Logger.error(('The component <' + $name + '/> seems to be empty or it ' +
            'has not a root element. Example: <div></div>, to be included.'));
        if (htmlSnippet.children.length > 1)
          return Logger.error(('The component <' + $name + '/> seems to have multiple ' +
            'root element, it must have only one root.'));
        component.el = htmlSnippet.children[0];
      });
    }
    const mainComponentElement = component.el;
    if (isNull(mainComponentElement))
      return onComponentFail(componentElement);
    // Handling Slots
    if (slotContainer.childNodes.length > 0) {
      const hasSkippedParent = (child) => {
        if (child.hasAttribute(Constants.skip))
          return true;
        const parent = child.parentElement;
        if (parent == null)
          return false;
        return hasSkippedParent(parent);
      };
      // # slot[default]
      const slotContainerChildren = toArray(slotContainer.children);
      const slotDefaults = toArray(mainComponentElement.querySelectorAll('slot[default]'));
      // Looping all the slots defaults target
      forEach(slotDefaults, (slotTarget) => {
        if (hasSkippedParent(slotTarget))
          return;
        const slotTargetContainer = slotTarget.parentElement;
        // Adding the children
        forEach(slotContainerChildren, (child) => {
          slotTargetContainer.insertBefore(child.cloneNode(true), slotTarget);
        });
        // Removing the targets
        slotTargetContainer.removeChild(slotTarget);
      });
      // # div[slot='name'] || slot[slot=name]
      const slotNamed = toArray(mainComponentElement.querySelectorAll('slot[name]'));
      // Looping all the slots defaults target
      forEach(slotNamed, (slotTarget) => {
        if (hasSkippedParent(slotTarget))
          return;
        const slotTargetContainer = slotTarget.parentElement;
        const slotName = slotTarget.getAttribute('name');
        // Adding the children
        forEach(slotContainerChildren, (child) => {
          if ( // slot[slot='name']
            child.nodeName.toLowerCase() == 'slot' &&
            child.getAttribute('slot') == slotName) {
            // Adding the children
            forEach(toArray(child.childNodes), (child) => {
              slotTargetContainer.insertBefore(child.cloneNode(true), slotTarget);
            });
          }
          if ( // div[slot='name']
            child.nodeName.toLowerCase() != 'slot' &&
            child.getAttribute('slot') == slotName) {
            const inserted = slotTargetContainer.insertBefore(child.cloneNode(true), slotTarget);
            inserted.removeAttribute('slot');
          }
        });
        // Removing the target
        slotTargetContainer.removeChild(slotTarget);
      });
    }
    // Transforming all unknown variables to reactive
    forEach(Object.keys(component), propName => {
      let prop = component[propName];
      // If it's a computed property, wrap it in a ref
      if (!isNull(prop) && isComputed(prop))
        prop = component[propName] = new Ref(prop);
      if (!isNull(prop) && isRef(prop))
        prop.__(propName, component);
    });
    // Adding the listeners
    const createdEvent = this.addEvent('created', mainComponentElement, component);
    const beforeMountEvent = this.addEvent('beforeMount', mainComponentElement, component);
    const mountedEvent = this.addEvent('mounted', mainComponentElement, component);
    const beforeLoadEvent = this.addEvent('beforeLoad', mainComponentElement, component);
    const loadedEvent = this.addEvent('loaded', mainComponentElement, component);
    this.addEvent('beforeDestroy', mainComponentElement, component);
    this.addEvent('destroyed', mainComponentElement, component);
    const scriptsAssets = where(component.assets, asset => asset.nodeName === 'SCRIPT');
    const initializer = component.init;
    if (isFunction(initializer))
      fnCallResolver(initializer.call(component));
    const processDataAttr = (attr) => {
      // Listening to all the reactive properties
      const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
        if (!(descriptor.propName in inputData))
          inputData[descriptor.propName] = undefined;
        Prop.set(inputData, descriptor.propName, descriptor);
      });
      let inputData = {};
      if (attr.value.trim() === '') {
        reactiveEvent.off();
        // Data to apply: {...Bouer.data, ...component.data}
        return Extend.obj(data, component.data);
      }
      // Otherwise, compiles the object provided
      const dataAttrValue = IoC.app(this.bouer).resolve(Evaluator)
        .exec({
          data: Extend.obj(data, {
            $data: data,
            $scope: data,
            $navigate: data
          }),
          code: attr.value,
          context: context !== null && context !== void 0 ? context : this.bouer
        });
      if (!isObject(dataAttrValue))
        Logger.error('Expected a valid Object Literal expression in “' + attr.nodeName +
          '” and got “' + attr.value + '”.');
      else {
        // Adding all non-existing properties
        forEach(Object.keys(dataAttrValue), key => {
          if (!(key in inputData))
            inputData[key] = dataAttrValue[key];
        });
      }
      reactiveEvent.off();
      return Extend.obj(Reactive.transform({
        context: component,
        data: inputData
      }), component.data);
    };
    const compile = (scriptContent) => {
      try {
        let dataToUse = {};
        let dataAttr = null;
        // If the attr is `data`, prepare and inject the value into component `data`
        if (dataAttr = findDirective(componentElement, Constants.data)) {
          const attr = dataAttr;
          if (this.delimiter.run(attr.value).length !== 0) {
            Logger.error(('The “data” attribute cannot contain delimiter, source element: ' + '<' + $name + '/>.'));
          } else {
            dataToUse = processDataAttr(attr);
            // Signinng the element with it's data
            IoC.app(this.bouer).resolve(DataStore).addNodeData(mainComponentElement, dataToUse);
          }
          componentElement.removeAttribute(attr.name);
        } else {
          dataToUse = component.data;
        }
        // Executing the mixed scripts
        IoC.app(this.bouer).resolve(Evaluator)
          .eval((scriptContent || ''), component);
        createdEvent.emit();
        // tranfering the attributes
        forEach(toArray(componentElement.attributes), (attr) => {
          // if the attr is the class, transfer the items to the root element
          if (attr.nodeName === 'class')
            return componentElement.classList.forEach(cls => {
              mainComponentElement.classList.add(cls);
            });
          if (Constants.silent == attr.name)
            return;
          // sets the attr to the root element
          mainComponentElement.setAttribute(attr.name, attr.value);
        });
        beforeMountEvent.emit();
        // Attaching the root element to the component element
        if (!('root' in componentElement))
          Prop.set(componentElement, 'root', {
            value: mainComponentElement
          });
        // Mouting the element
        container.replaceChild(mainComponentElement, componentElement);
        mountedEvent.emit();
        const rootClassList = {};
        // Retrieving all the classes of the root element
        mainComponentElement.classList.forEach(key => rootClassList[key] = true);
        // Changing each selector to avoid conflits
        const changeSelector = (style, styleId) => {
          const rules = [];
          const isStyle = (style.nodeName === 'STYLE');
          if (!style.sheet)
            return;
          const cssRules = style.sheet.cssRules;
          for (let i = 0; i < cssRules.length; i++) {
            const rule = cssRules.item(i);
            if (!rule)
              continue;
            const mRule = rule;
            // .item .title, .item .desc
            const ruleText = mRule.selectorText;
            if (ruleText) {
              const classStyleId = '.' + styleId;
              /**
               * From: [.item .title, .item .desc]
               *
               * To: [
               *  .item.e-A1bcD .title,
               *  .e-A1bcD .item .title,
               *  .item.e-A1bcD .desc
               *  .e-A1bcD .item .desc
               * ]
               */
              mRule.selectorText = ruleText.split(',')
                .flatMap(($selector) => {
                  const $selectors = $selector.split(' ');
                  $selectors[0] = $selectors[0] + classStyleId;
                  return [$selectors.join(' '), classStyleId + ' ' + $selector];
                })
                .join(',');
            }
            // Adds the cssText only if the element is <style>
            if (isStyle)
              rules.push(mRule.cssText);
          }
          if (isStyle)
            style.innerText = rules.join(' ');
        };
        const stylesAssets = where(component.assets, asset => asset.nodeName !== 'SCRIPT');
        const styleAttrName = 'component-style';
        // Configuring the styles
        forEach(stylesAssets, asset => {
          const mStyle = asset.cloneNode(true);
          if (mStyle instanceof HTMLLinkElement) {
            const path = component.path[0] === '/' ? component.path.substring(1) : component.path;
            mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
            mStyle.rel = 'stylesheet';
          }
          // Checking if this component already have styles added
          if (this.stylesController[$name]) {
            const controller = this.stylesController[$name];
            if (controller.elements.indexOf(mainComponentElement) > -1)
              return;
            controller.elements.push(mainComponentElement);
            return forEach(controller.styles, $style => {
              mainComponentElement.classList.add($style.getAttribute(styleAttrName));
            });
          }
          const styleId = code(8, 'e-');
          mStyle.setAttribute(styleAttrName, styleId);
          if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
            mStyle.onload = evt => changeSelector(evt.target, styleId);
          this.stylesController[$name] = {
            styles: [DOM.head.appendChild(mStyle)],
            elements: [mainComponentElement]
          };
          if (!mStyle.hasAttribute('scoped'))
            return;
          mainComponentElement.classList.add(styleId);
          if (mStyle instanceof HTMLStyleElement)
            return changeSelector(mStyle, styleId);
        });
        beforeLoadEvent.emit();
        // Compiling the rootElement
        compiler.compile({
          el: mainComponentElement,
          context: component,
          data: Reactive.transform({
            context: component,
            data: dataToUse
          }),
          directivesToIgnore: directivesToIgnore,
          beforeCompile: beforeCompile,
          afterCompile: afterCompile,
          onComponentLoad: () => {
            onComponentLoad(component);
            loadedEvent.emit();
            if (!this.rounting.routeView) {
              const routeView = mainComponentElement.hasAttribute('route-vew') ?
                mainComponentElement : mainComponentElement.querySelector('[route-view]');
              if (routeView)
                this.rounting.setRouteView(routeView);
            }
          }
        });
        const autoComponentDestroy = ifNullReturn(this.bouer.config.autoComponentDestroy, true);
        if (autoComponentDestroy === false)
          return;
        // Listening the component to be destroyed
        Task.run(stopTask => {
          if (component.el.isConnected)
            return;
          if (this.bouer.isDestroyed)
            return stopTask();
          component.destroy();
          stopTask();
          const stylesController = this.stylesController[component.name];
          if (!stylesController)
            return;
          const index = stylesController.elements.indexOf(component.el);
          stylesController.elements.splice(index, 1);
          if (stylesController.elements.length > 0 || container.isConnected)
            return;
          // No elements using the style
          forEach(stylesController.styles, style => forEach(toArray(DOM.head.children), item => {
            if (item === style)
              return DOM.head.removeChild(style);
          }));
          delete this.stylesController[component.name];
        });
      } catch (error) {
        Logger.error('Error in <' + $name + '/> component.');
        Logger.error(buildError(error));
        onComponentFail(componentElement);
      }
    };
    if (scriptsAssets.length === 0)
      return compile();
    const localScriptsContent = [];
    const onlineScriptsContent = [];
    const onlineScriptsUrls = [];
    const webRequestChecker = {};
    // Grouping the online scripts and collecting the online url
    forEach(scriptsAssets, (script) => {
      if (script.src == '' || script.innerHTML)
        localScriptsContent.push(script.innerHTML);
      else {
        const path = component.path[0] === '/' ? component.path.substring(1) : component.path;
        script.src = pathResolver(path, script.getAttribute('src') || '');
        onlineScriptsUrls.push(script.src);
      }
    });
    // No online scripts detected
    if (onlineScriptsUrls.length == 0)
      return compile(localScriptsContent.join('\n\n'));
    // Load the online scripts and run it
    return forEach(onlineScriptsUrls, (url, index) => {
      webRequestChecker[url] = true;
      // Getting script content from a web request
      webRequest(url, {
        headers: {
          'Content-Type': 'text/plain'
        }
      }).then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.text();
      }).then(text => {
        delete webRequestChecker[url];
        // Adding the scripts according to the defined order
        onlineScriptsContent[index] = text;
        // if there are not web requests compile the element
        if (Object.keys(webRequestChecker).length === 0)
          return compile(Extend.array(onlineScriptsContent, localScriptsContent).join('\n\n'));
      }).catch(error => {
        error.stack = '';
        Logger.error(('Error loading the <script src=\'' + url + '\'></script> in ' +
          '<' + $name + '/> component, remove it in order to be compiled.'));
        Logger.error(error);
        onComponentFail(componentElement);
      });
    });
  }
  /**
   * Adds assets to the component
   * @param {string|object} assets the list of assets to be included
   */
  static prepareAssets(component, assets) {
    const $Assets = [];
    const assetsTypeMapper = {
      js: 'script',
      css: 'link',
      scss: 'link',
      sass: 'link',
      less: 'link',
      styl: 'link',
      style: 'link',
    };
    const isValidAssetSrc = (src, index) => {
      const isValid = (src || trim(src)) ? true : false;
      if (!isValid)
        Logger.error('Invalid asset “src”, in assets[' + index + '].src');
      return isValid;
    };
    const assetTypeGetter = (src, index) => {
      const srcSplitted = src.split('.');
      const type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];
      if (!type)
        return Logger.error('Couldn\'t find out what type of asset it is, provide ' +
          'the “type” explicitly at assets[' + index + '].type');
      return type;
    };
    forEach(assets, (asset, index) => {
      let src = '';
      let type = '';
      let scoped = true;
      if (typeof asset === 'string') { // String type
        if (!isValidAssetSrc(asset, index))
          return;
        type = assetTypeGetter(trim(src = asset.replace(/\.less|\.s[ac]ss|\.styl/i, '.css')), index);
      } else { // Object Type
        if (!isValidAssetSrc(trim(src = asset.src.replace(/\.less|\.s[ac]ss\.styl/i, '.css')), index))
          return;
        if (!asset.type) {
          if (!(type = assetTypeGetter(src, index)))
            return;
        } else {
          type = assetsTypeMapper[toLower(asset.type)] || asset.type;
        }
        scoped = ifNullReturn(asset.scoped, true);
      }
      const isRelativePathImport = src[0] === '.';
      if (isRelativePathImport && (!component.path || isNull(component.path))) {
        Logger.warn('Component with no `path` cannot use imported assets, check component: ' + component.path);
        return;
      }
      if (isRelativePathImport) {
        const pathSections = component.path.split('/').slice(0, -1);
        if (pathSections[0] === '')
          pathSections.shift();
        src = pathSections.join('/') + src.substring(1, src.length);
      }
      const $Asset = createEl(type, el => {
        if (ifNullReturn(scoped, true))
          el.setAttribute('scoped', 'true');
        switch (toLower(type)) {
          case 'script':
            el.setAttribute('src', src);
            break;
          case 'link':
            el.setAttribute('href', src);
            el.setAttribute('rel', 'stylesheet');
            el.setAttribute('type', 'text/css');
            break;
          default:
            el.setAttribute('src', src);
            break;
        }
      }).build();
      $Assets.push($Asset);
    });
    component.assets.splice(0, component.assets.length);
    component.assets.push.apply(component.assets, $Assets);
  }
  /**
   * Dispatch an event of the component
   * @param {string} eventName the event name
   * @param {object?} init the CustomEventInit object where we can provid the event detail
   */
  emit(component, eventName, init) {
    IoC.app(this.bouer).resolve(EventHandler).emit({
      eventName: eventName,
      attachedNode: component.el,
      init: init
    });
  }
}
class ViewChild {
  /**
   * Retrieves the actives components matching the a provided expression
   * @param {Bouer} bouer the app instance
   * @param {Function} expression the expression function to match the required component
   * @returns a list of components matching the expression
   */
  static by(bouer, expression) {
    // Retrieving the active component
    const activeComponents = IoC.app(bouer).resolve(ComponentHandler)
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, expression);
  }
  /**
   * Retrieves the active component matching the component element or the root element id
   * @param {Bouer} bouer the app instance
   * @param {string} id the id o the component
   * @returns The Component or null
   */
  static byId(bouer, id) {
    // Retrieving the active component
    const activeComponents = IoC.app(bouer).resolve(ComponentHandler)
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, c => (c.el && getRootElement(c.el).id == id))[0];
  }
  /**
   * Retrieves the actives components matching the component name
   * @param {Bouer} bouer the app instance
   * @param {string} name the component name
   * @returns a list of components matching the name
   */
  static byName(bouer, name) {
    // Retrieving the active component
    const activeComponents = IoC.app(bouer).resolve(ComponentHandler)
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, c => c.name.toLowerCase() == (name || '').toLowerCase());
  }
}
var version = '3.3.0';
class Bouer {
  /**
   * Default constructor
   * @param {string} selector the selector of the element to be controlled by the instance
   * @param {object?} options the options to the instance
   */
  constructor(selector, options) {
    /** The name of the instance */
    // Ignore Reactive Transformation
    this._IRT_ = true;
    this.name = 'Bouer';
    this.version = version;
    /** Unique Id of the instance */
    this.__id__ = IoC.newId();
    /**
     * Gets all the elemens having the `ref` attribute
     * @returns an object having all the elements with the `ref attribute value` defined as the key.
     */
    this.refs = {};
    /** Provides the status of the app */
    this.isDestroyed = false;
    /** Provides state of the app, if it is already initialized */
    this.isInitialized = false;
    const $options = (options || {});
    this.options = $options;
    this.config = $options.config || {};
    this.deps = $options.deps || {};
    this.pipes = $options.pipes || {};
    forEach(Object.keys(this.deps), key => {
      const deps = this.deps;
      const value = deps[key];
      deps[key] = typeof value === 'function' ? value.bind(this) : value;
    });
    const app = this;
    const delimiters = $options.delimiters || [];
    // Adding Dependency Injection Services
    IoC.app(this).add(DataStore, [], true);
    IoC.app(this).add(Evaluator, [this]);
    IoC.app(this).add(Middleware, [this], true);
    IoC.app(this).add(Binder, [this, Evaluator], true);
    IoC.app(this).add(EventHandler, [this, Evaluator], true);
    IoC.app(this).add(ComponentHandler, [
            this, DelimiterHandler, EventHandler, Evaluator, Routing
        ], true);
    IoC.app(this).add(Skeleton, [this], true);
    IoC.app(this).add(Routing, [this], true);
    IoC.app(this).add(DelimiterHandler, [this, delimiters], true);
    IoC.app(this).add(Compiler, [
            this, Binder, DelimiterHandler, EventHandler, ComponentHandler, $options.directives
        ], true);
    const dataStore = IoC.app(this).resolve(DataStore);
    const middleware = IoC.app(this).resolve(Middleware);
    const componentHandler = IoC.app(this).resolve(ComponentHandler);
    const compiler = IoC.app(this).resolve(Compiler);
    const skeleton = IoC.app(this).resolve(Skeleton);
    const delimiter = IoC.app(this).resolve(DelimiterHandler);
    // Register the middleware
    if (typeof $options.middleware === 'function')
      $options.middleware.call(this, middleware.subscribe, this);
    // Transform the data properties into a reative
    this.data = Reactive.transform({
      data: $options.data || {},
      context: this
    });
    this.globalData = Reactive.transform({
      data: $options.globalData || {},
      context: this
    });
    delimiters.push.apply(delimiters, [
      {
        name: 'html',
        delimiter: {
          open: '{{:html ',
          close: '}}'
        }
      },
      {
        name: 'common',
        delimiter: {
          open: '{{',
          close: '}}'
        }
      },
        ]);
    this.$routing = IoC.app(this).resolve(Routing);
    this.$delimiters = {
      add: delimiter.add,
      remove: delimiter.remove,
      get: () => delimiter.delimiters.slice()
    };
    this.$data = {
      get: key => key ? dataStore.data[key] : null,
      set: (key, data, toReactive) => {
        if (key in dataStore.data)
          return Logger.warn('There is already a data stored with this key “' + key + '”.');
        if (ifNullReturn(toReactive, false) === true)
          Reactive.transform({
            context: app,
            data: data
          });
        return IoC.app(this).resolve(DataStore).set('data', key, data);
      },
      unset: key => delete dataStore.data[key]
    };
    this.$req = {
      get: key => key ? dataStore.req[key] : undefined,
      unset: key => delete dataStore.req[key],
    };
    this.$wait = {
      get: (key) => {
        if (!key)
          return undefined;
        const waitedData = dataStore.wait[key];
        if (!waitedData)
          return undefined;
        if (ifNullReturn(waitedData.once, true))
          this.$wait.unset(key);
        return waitedData.data;
      },
      set: (key, data, once) => {
        if (!(key in dataStore.wait))
          return dataStore.wait[key] = {
            data: data,
            nodes: [],
            once: ifNullReturn(once, false),
            context: app
          };
        const mWait = dataStore.wait[key];
        mWait.data = data;
        forEach(mWait.nodes, nodeWaiting => {
          if (!nodeWaiting)
            return;
          compiler.compile({
            el: nodeWaiting,
            context: mWait.context,
            data: Reactive.transform({
              context: mWait.context,
              data: mWait.data
            }),
          });
        });
        if (ifNullReturn(once, false))
          this.$wait.unset(key);
      },
      unset: key => delete dataStore.wait[key],
    };
    this.$skeleton = {
      clear: id => skeleton.clear(id),
      set: color => skeleton.init(color)
    };
    this.$components = {
      add: component => componentHandler.prepare([component]),
      get: name => componentHandler.components[name],
      viewBy: (expression) => ViewChild.by(this, expression),
      viewByName: (componentName) => ViewChild.byName(this, componentName),
      viewById: (componentId) => ViewChild.byId(this, componentId),
    };
    Prop.set(this, 'refs', {
      get: () => {
        const mRefs = {};
        forEach(toArray(ifNullStop(this.el).querySelectorAll('[' + Constants.ref + ']')), (ref) => {
          const mRef = ref.attributes[Constants.ref];
          const value = trim(mRef.value) || ref.name || '';
          if (value === '')
            return Logger.error('Expected an expression in “' + ref.name +
              '” or at least “name” attribute to combine with “' + ref.name + '”.');
          if (value in mRefs) {
            Logger.warn('The key “' + value + '” in “' + ref.name + '” is taken, choose another key.');
            return Logger.warn(ref);
          }
          mRefs[value] = ref;
        });
        return mRefs;
      }
    });
    // Registering all the components
    componentHandler.prepare($options.components || []);
    if (!isNull(selector) && trim(selector) !== '')
      this.init(selector);
  }
  /**
   * Creates a factory instance of Bouer
   * @param {object?} options the options to the instance
   * @returns Bouer instance
   */
  static create(options) {
    options = (options || {});
    options.config = (options.config || {});
    (options.config || {}).autoUnbind = false;
    (options.config || {}).autoOffEvent = false;
    (options.config || {}).autoComponentDestroy = false;
    return new Bouer('', options);
  }
  /**
   * Initialize create application
   * @param {string} selector the selector of the element to be controlled by the instance
   */
  init(selector) {
    if (this.isInitialized)
      return this;
    if (isNull(selector) || trim(selector) === '')
      throw Logger.error(new Error('Invalid selector provided to the instance.'));
    const app = this;
    const el = DOM.querySelector(selector);
    if (!(this.el = el))
      throw Logger.error(new SyntaxError('Element with selector “' + selector + '” not found.'));
    const options = this.options || {};
    const binder = IoC.app(this).resolve(Binder);
    const eventHandler = IoC.app(this).resolve(EventHandler);
    const routing = IoC.app(this).resolve(Routing);
    const skeleton = IoC.app(this).resolve(Skeleton);
    const compiler = IoC.app(this).resolve(Compiler);
    const dataStore = IoC.app(this).resolve(DataStore);
    forEach([options.beforeLoad, options.loaded, options.beforeDestroy, options.destroyed], hook => {
      if (typeof hook !== 'function')
        return;
      eventHandler.on({
        eventName: hook.name,
        callback: hook,
        attachedNode: el,
        modifiers: {
          once: true
        },
        context: app
      });
    });
    eventHandler.emit({
      eventName: 'beforeLoad',
      attachedNode: el
    });
    // Enabling this configs for listeners
    (options.config || {}).autoUnbind = true;
    (options.config || {}).autoOffEvent = true;
    (options.config || {}).autoComponentDestroy = true;
    routing.init();
    skeleton.init((options.config || {}).skeleton);
    binder.cleanup();
    eventHandler.cleanup();
    this.isInitialized = true;
    // compile the app
    compiler.compile({
      el: this.el,
      data: this.data,
      context: this,
      onComponentLoad: () => eventHandler.emit({
        eventName: 'loaded',
        attachedNode: el
      })
    });
    WIN.addEventListener('beforeunload', () => {
      if (this.isDestroyed)
        return;
      eventHandler.emit({
        eventName: 'beforeDestroy',
        attachedNode: el
      });
      this.destroy();
    }, {
      once: true
    });
    Task.run(stopTask => {
      if (this.isDestroyed)
        return stopTask();
      if (el.isConnected)
        return;
      dataStore.unlinkNodeData();
      eventHandler.emit({
        eventName: 'beforeDestroy',
        attachedNode: el
      });
      this.destroy();
      stopTask();
    });
    if (!DOM.head.querySelector('link[rel~="icon"]')) {
      createEl('link', (favicon) => {
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
      }).appendTo(DOM.head);
    }
    return this;
  }
  /**
   * Sets data into a target object, by default is the `bouer.data`
   * @param {object} inputData the data the should be setted
   * @param {object?} targetObject the target were the inputData
   * @returns the object with the data setted
   */
  set(inputData, targetObject) {
    return setData(this, inputData, targetObject);
  }
  /**
   * Compiles a `HTML snippet` to an `Object Literal`
   * @param {string} input the input element
   * @param {object?} options the options of the compilation
   * @returns the Object Compiled from the HTML
   */
  toJsObj(input, options) {
    const formHandler = new FormHandler({}, Extend.obj({}, {
      type: 'STATIC'
    }, options)).init({
      bouer: this,
      context: this,
      data: this.data,
      element: input,
    });
    return formHandler.toObject();
  }
  /**
   * Provides the possibility to watch a property change
   * @param {string} propertyName the property to watch
   * @param {Function} callback the function that should be called when the property change
   * @param {object} targetObject the target object having the property to watch
   * @returns the watch object having the method to destroy the watch
   */
  watch(propertyName, callback, targetObject) {
    return IoC.app(this).resolve(Binder).onPropertyChange(propertyName, callback, (targetObject || this.data));
  }
  /**
   * Watch all reactive properties in the provided scope.
   * @param {Function} watchableScope the function that should be called when the any reactive property change
   * @returns an object having all the watches and the method to destroy watches at once
   */
  react(watchableScope) {
    return IoC.app(this).resolve(Binder)
      .onPropertyInScopeChange(watchableScope);
  }
  /**
   * Add an Event Listener to the instance or to an object
   * @param {string} eventName the event name to be listening
   * @param {Function} callback the callback that should be fired
   * @param {Node} attachedNode A node to attach the event
   * @param {object} modifiers An object having all the event modifier
   * @returns The event added
   */
  on(eventName, callback, options) {
    return IoC.app(this).resolve(EventHandler).
    on({
      eventName,
      callback: callback,
      attachedNode: (options || {}).attachedNode,
      modifiers: (options || {}).modifiers,
      context: this
    });
  }
  /**
   * Removes an Event Listener from the instance or from object
   * @param {string} eventName the event name to be listening
   * @param {Function} callback the callback that should be fired
   * @param {Node} attachedNode A node to attach the event
   */
  off(eventName, callback, attachedNode) {
    return IoC.app(this).resolve(EventHandler).
    off({
      eventName,
      callback: callback,
      attachedNode
    });
  }
  /**
   * Removes the bind from an element
   * @param {Node} boundNode the node having the bind
   * @param {string} boundAttrName the bound attribute name
   * @param {string} boundPropName the bound property name
   */
  unbind(boundNode, boundAttrName, boundPropName) {
    return IoC.app(this).resolve(Binder).
    remove(boundNode, boundPropName, boundAttrName);
  }
  /**
   * Dispatch an event
   * @param {string} eventName the event name
   * @param {object} options options for the emission
   */
  emit(eventName, options) {
    const mOptions = options || {};
    mOptions.init = ifNullReturn(mOptions.init, {});
    mOptions.init.detail = ifNullReturn(mOptions.init.detail, {});
    Extend.matcher(mOptions.data || {}, mOptions.init.detail || {});
    return IoC.app(this).resolve(EventHandler).emit({
      eventName: eventName,
      attachedNode: mOptions.element,
      init: mOptions.init,
      once: mOptions.once
    });
  }
  /**
   * Limits sequential execution to a single one acording to the milliseconds provided
   * @param {Function} callback the callback that should be performed the execution
   * @param {number} wait milliseconds to the be waited before the single execution
   * @returns executable function
   */
  lazy(callback, wait) {
    const _this = this;
    let timeout;
    wait = isNull(wait) ? 500 : wait;
    const immediate = arguments[2];
    return function executable() {
      const args = [].slice.call(arguments);
      const callNow = immediate && !timeout;
      const later = () => {
        timeout = null;
        if (!immediate)
          callback.apply(_this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow)
        callback.apply(_this, args);
    };
  }
  /**
   * Compiles an html element
   * @param {string} options the options of the compilation process
   * @returns the element compiled
   */
  compile(options) {
    return IoC.app(this).resolve(Compiler).
    compile({
      el: options.el,
      data: options.data,
      context: options.context || this,
      onComponentLoad: options.onDone
    });
  }
  /**
   * Destroys the application
   */
  destroy() {
    const el = this.el;
    const $Events = IoC.app(this).resolve(EventHandler).$events;
    const destroyedEvents = ($Events['destroyed'] || []).concat(($Events['component:destroyed'] || []));
    this.emit('destroyed', {
      element: this.el
    });
    // Dispatching all the destroy events
    forEach(destroyedEvents, es => es.emit({
      once: true
    }));
    $Events['destroyed'] = [];
    $Events['component:destroyed'] = [];
    if (el.tagName == 'BODY')
      el.innerHTML = '';
    else if (DOM.contains(el))
      el.parentElement.removeChild(el);
    this.isDestroyed = true;
    this.isInitialized = false;
    IoC.app(this).clear();
  }
}
export {
  $computed,
  $default,
  ANCHOR,
  Compiler,
  Component,
  Computed,
  DOM,
  Extend,
  FieldSchema,
  FormHandler,
  FormSchema,
  IoC,
  Prop,
  Reactive,
  Ref,
  Routing,
  ViewChild,
  WIN,
  Watch,
  buildError,
  code,
  createComment,
  createEl,
  Bouer as
  default,
  errorMsgEmptyNode,
  errorMsgNodeValue,
  findAttribute,
  findDirective,
  findOneBy,
  fnCallResolver,
  forEach,
  getRootElement,
  ifNullReturn,
  ifNullStop,
  isComputed,
  isEmptyObject,
  isFilledObj,
  isFunction,
  isNull,
  isObject,
  isPrimitive,
  isRef,
  isString,
  mapper,
  pathResolver,
  removeEl,
  setData,
  startWith,
  toArray,
  toLower,
  toOwnerNode,
  toPascalCase,
  toStr,
  trim,
  urlCombine,
  urlResolver,
  webRequest,
  where
};