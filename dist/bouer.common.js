/*!
 * Bouer.js v3.1.0
 * Copyright Easy.js 2018-2020 | 2021-2024 Afonso Matumona
 * Released under the MIT License.
 */
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});
var Logger = (function Logger() {
  var prefix = '[Bouer]';
  return {
    log: function(l) {
      console.log.apply(null, [prefix].concat(Error(l)));
    },
    error: function(e) {
      console.error.apply(null, [prefix].concat(Error(e)));
    },
    warn: function(w) {
      console.warn.apply(null, [prefix].concat(Error(w)));
    },
    info: function(i) {
      console.info.apply(null, [prefix].concat(Error(i)));
    }
  };
})();
var ReactiveEvent = /** @class */ (function() {
  function ReactiveEvent() {}
  ReactiveEvent.on = function(eventName, callback) {
    if (isNull(this.events[eventName]))
      this.events[eventName] = [];
    this.events[eventName].push(callback);
    return {
      eventName: eventName,
      callback: callback,
      off: function() {
        return ReactiveEvent.off(eventName, callback);
      }
    };
  };
  ReactiveEvent.off = function(eventName, callback) {
    var events = this.events[eventName] || [];
    events.splice(events.indexOf(callback), 1);
    return true;
  };
  ReactiveEvent.once = function(eventName, callback) {
    var event = {};
    var mEvent = ReactiveEvent.on(eventName, function(descriptor) {
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
  };
  ReactiveEvent.emit = function(eventName, descriptor) {
    try {
      forEach((this.events[eventName] || []), function(evt) {
        return evt(descriptor);
      });
    } catch (error) {
      Logger.error(buildError(error));
    }
  };
  ReactiveEvent.events = {};
  return ReactiveEvent;
}());
var Prop = (function Prop() {
  return {
    /**
     * Sets a property to an object
     * @param {object} obj the object to set the property
     * @param {string} propName the property name to be set
     * @param {object} descriptor the descriptor of the object
     * @returns the object with the new property
     */
    set: function(obj, propName, descriptor) {
      return Object.defineProperty(obj, propName, descriptor);
    },
    /**
     * Retrieves the descriptor of an property
     * @param {object} obj the object where the descriptor will be retrieved
     * @param {string} propName the property name
     * @returns the property descriptor or undefined
     */
    descriptor: function(obj, propName) {
      return Object.getOwnPropertyDescriptor(obj, propName);
    },
    /**
     * Makes a deep copy of a property from an object to another
     * @param {object} destination the destination object
     * @param {object} source the source object
     * @param {string} propName the property to be transfered
     */
    transfer: function(destination, source, propName) {
      var descriptor = this.descriptor(source, propName);
      var mDst = destination;
      if (!(propName in destination))
        mDst[propName] = undefined;
      this.set(destination, propName, descriptor);
    }
  };
})();
var Watch = /** @class */ (function() {
  /**
   * Default constructor
   * @param {object} descriptor the reactive descriptor instance
   * @param {Function} callback the callback that will be called on change
   * @param {object?} options watch options where the node and onDestroy function are provided
   */
  function Watch(descriptor, callback, options) {
    var _this = this;
    /**
     * Destroys/Stop the watching process
     */
    this.destroy = function() {
      var watchIndex = _this.descriptor.watches.indexOf(_this);
      if (watchIndex !== -1)
        _this.descriptor.watches.splice(watchIndex, 1);
      (_this.onDestroy || (function() {}))();
    };
    this.descriptor = descriptor;
    this.property = descriptor.propName;
    this.callback = callback;
    if (options) {
      this.node = options.node;
      this.onDestroy = options.onDestroy;
    }
  }
  return Watch;
}());
var Reactive = /** @class */ (function() {
  /**
   * Default constructor
   * @param {object} options the options of the reactive instance
   */
  function Reactive(options) {
    var _this = this;
    this._IRT_ = true;
    this.watches = [];
    this.fnComputed = null;
    this.get = function() {
      var computedGet = _this.computed().get;
      ReactiveEvent.emit('BeforeGet', _this);
      _this.propValue = _this.isComputed ?
        fnCall(computedGet.call(_this.context)) : _this.propValue;
      var value = _this.propValue;
      ReactiveEvent.emit('AfterGet', _this);
      return value;
    };
    this.set = function(value) {
      if (_this.propValue === value || (Number.isNaN(_this.propValue) && Number.isNaN(value)))
        return;
      var computedSet = _this.computed().set;
      if (_this.isComputed && computedSet)
        fnCall(computedSet.call(_this.context, value));
      else if (_this.isComputed && isNull(computedSet))
        return;
      _this.propValueOld = _this.propValue;
      ReactiveEvent.emit('BeforeSet', _this);
      if (isObject(value) || Array.isArray(value)) {
        if ((typeof _this.propValue) !== (typeof value))
          return Logger.error(('Cannot set “' + (typeof value) + '” in “' +
            _this.propName + '” property.'));
        if (Array.isArray(value)) {
          Reactive.transform({
            data: value,
            descriptor: _this,
            context: _this.context
          });
          var propValue = _this.propValue;
          propValue.splice(0, propValue.length);
          propValue.push.apply(propValue, value);
        } else if (isObject(value)) {
          if ((value instanceof Node)) // If some html element
            _this.propValue = value;
          else {
            Reactive.transform({
              data: value,
              context: _this.context
            });
            if (!isNull(_this.propValue))
              mapper(value, _this.propValue);
            else
              _this.propValue = value;
          }
        }
      } else {
        _this.propValue = value;
      }
      ReactiveEvent.emit('AfterSet', _this);
      _this.notify();
    };
    this.propName = options.propName;
    this.propSource = options.srcObject;
    this.context = options.context;
    // Setting the value of the property
    this.baseDescriptor = Prop.descriptor(this.propSource, this.propName);
    this.propValue = this.baseDescriptor.value;
    this.isComputed = typeof this.propValue === 'function' && this.propValue.name === '$computed';
    if (this.isComputed) {
      this.fnComputed = this.propValue;
      this.propValue = undefined;
    }
    if (typeof this.propValue === 'function' && !this.isComputed)
      this.propValue = this.propValue.bind(this.context);
  }
  Reactive.prototype.computed = function() {
    if (!this.isComputed)
      return {
        get: function() {},
        set: function(v) {}
      };
    var computedResult = this.fnComputed.call(this.context);
    if (isNull(computedResult))
      throw new Error('Invalid value used as return in “function $computed(){...}”.');
    var isNotInferred = isObject(computedResult) || isFunction(computedResult);
    return {
      get: (isNotInferred && 'get' in computedResult) ? computedResult.get : (function() {
        return computedResult;
      }),
      set: (isNotInferred && 'set' in computedResult) ? computedResult.set : undefined
    };
  };
  /**
   * Force onChange callback calling
   */
  Reactive.prototype.notify = function() {
    var _this = this;
    // Running all the watches
    forEach(this.watches, function(w) {
      return w.callback.call(_this.context, _this.propValue, _this.propValueOld);
    });
  };
  /**
   * Subscribe an event that should be performed on property value change
   * @param {Function} callback the callback function that will be called
   * @param {Node?} node the node that should be attached (Optional)
   * @returns A watch instance object
   */
  Reactive.prototype.onChange = function(callback, node) {
    var w = new Watch(this, callback, {
      node: node
    });
    this.watches.push(w);
    return w;
  };
  /**
   * Tranform a Object Litertal to a an Object with reactive properties
   * @param {object} options the options for object transformation
   * @returns the object transformed
   */
  Reactive.transform = function(options) {
    var context = options.context;
    var executer = function(data, visiting, visited, descriptor, keys) {
      if (Array.isArray(data)) {
        if (descriptor == null) {
          Logger.warn('Cannot transform this array to a reactive one because no reactive object was provided');
          return data;
        }
        if (visiting.indexOf(data) !== -1)
          return data;
        visiting.push(data);
        var REACTIVE_ARRAY_METHODS = ['push', 'pop', 'unshift', 'shift', 'splice'];
        var inputArray_1 = data;
        var reference_1 = {}; // Using clousure to cache the array methods
        Object.setPrototypeOf(inputArray_1, Object.create(Array.prototype));
        var prototype_1 = Object.getPrototypeOf(inputArray_1);
        forEach(REACTIVE_ARRAY_METHODS, function(method) {
          // cache original method
          reference_1[method] = inputArray_1[method].bind(inputArray_1);
          // changing to the reactive one
          prototype_1[method] = function reactive() {
            var oldArrayValue = inputArray_1.slice();
            var args = [].slice.call(arguments);
            switch (method) {
              case 'push':
              case 'unshift':
                forEach(toArray(args), function(arg) {
                  if (!isObject(arg) && !Array.isArray(arg))
                    return;
                  executer(arg, visiting, visited);
                });
            }
            var result = reference_1[method].apply(inputArray_1, args);
            forEach(descriptor.watches, function(watch) {
              return watch.callback.call(context, inputArray_1, oldArrayValue, {
                method: method,
                args: args
              });
            });
            return result;
          };
        });
        return inputArray_1;
      }
      if (!isObject(data))
        return data;
      if (visiting.indexOf(data) !== -1)
        return data;
      visiting.push(data);
      forEach(keys || Object.keys(data), function(key) {
        var mInputObject = data;
        // Already a reactive property, do nothing
        if (!('value' in Prop.descriptor(data, key)))
          return;
        var propValue = mInputObject[key];
        if ((propValue instanceof Object) && ((propValue._IRT_) || (propValue instanceof Node)))
          return;
        var descriptor = new Reactive({
          propName: key,
          srcObject: data,
          context: context
        });
        Prop.set(data, key, descriptor);
        if (Array.isArray(propValue)) {
          executer(propValue, visiting, visited, descriptor); // Transform the array to a reactive one
          forEach(propValue, function(item) {
            return executer(item, visiting, visited);
          });
        } else if (isObject(propValue))
          executer(propValue, visiting, visited);
      });
      visiting.splice(visiting.indexOf(data), 1);
      visited.push(data);
      return data;
    };
    return executer(options.data, [], [], options.descriptor);
  };
  return Reactive;
}());
var Constants = {
  skip: 'e-skip',
  build: 'e-build',
  array: 'e-array',
  if: 'e-if',
  elseif: 'e-else-if',
  else: 'e-else',
  show: 'e-show',
  req: 'e-req',
  for: 'e-for',
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
  check: function(node, cmd) {
    return startWith(node.nodeName, cmd);
  },
  isConstant: function(value) {
    var _this = this;
    return (Object.keys(this).map(function(key) {
      return _this[key];
    }).indexOf(value) !== -1);
  }
};
var Extend = (function Extend() {
  var obj = function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var out = {};
    forEach(args, function(arg) {
      if (isNull(arg))
        return;
      forEach(Object.keys(arg), function(key) {
        Prop.transfer(out, arg, key);
      });
    });
    return out;
  };
  var mixin = function(out) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    // Props to mix with out object
    var props = obj.apply({}, args);
    forEach(Object.keys(props), function(key) {
      var hasOwnProp = key in out;
      Prop.transfer(out, props, key);
      if (hasOwnProp) {
        var mOut = out;
        mOut[key] = fnEmpty(mOut[key]);
      }
    });
    return out;
  };
  var array = function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var out = [];
    forEach(args, function(arg) {
      if (isNull(arg))
        return;
      if (!Array.isArray(arg))
        return out.push(arg);
      forEach(Object.keys(arg), function(key) {
        var value = arg[key];
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
  return {
    /**
     * Combines different object into a new one
     * @param {object} args Objects to be combined
     * @returns A new object having the properties of all the objects
     */
    obj: obj,
    /**
     * Adds properties to the first object provided
     * @param {object} out the object that should be added all the properties from the other one
     * @param {object} args the objects where the properties should be extracted from
     * @returns the first object with all the new properties added on
     */
    mixin: mixin,
    /**
     * Combines different arrays into a new one
     * @param {object} args arrays to be combined
     * @returns a new arrat having the items of all the arrays
     */
    array: array
  };
})();
// Quotes “'+  +'”
function webRequest(url, options) {
  if (!url)
    return Promise.reject(new Error('Invalid Url'));
  var createXhr = function(method) {
    if (DOM.documentMode && (!method.match(/^(get|post)$/i) || !WIN.XMLHttpRequest)) {
      return new WIN.ActiveXObject('Microsoft.XMLHTTP');
    } else if (WIN.XMLHttpRequest) {
      return new WIN.XMLHttpRequest();
    }
    throw new Error('This browser does not support XMLHttpRequest.');
  };
  var getOption = function(key, mDefault) {
    var mOptions = (options || {});
    var value = mOptions[key];
    if (value)
      return value;
    return mDefault;
  };
  var headers = getOption('headers', {});
  var method = getOption('method', 'get');
  var body = getOption('body', undefined);
  var beforeSend = getOption('body', function(xhr) {});
  var xhr = createXhr(method);
  return new Promise(function(resolve, reject) {
    var createResponse = function(mFunction, ok, status, xhr, response) {
      mFunction({
        url: url,
        ok: ok,
        status: status,
        statusText: xhr.statusText || '',
        headers: xhr.getAllResponseHeaders(),
        json: function() {
          return Promise.resolve(JSON.stringify(response));
        },
        text: function() {
          return Promise.resolve(response);
        }
      });
    };
    xhr.open(method, url, true);
    forEach(Object.keys(headers), function(key) {
      xhr.setRequestHeader(key, headers[key]);
    });
    xhr.onload = function() {
      var response = ('response' in xhr) ? xhr.response : xhr.responseText;
      var status = xhr.status === 1223 ? 204 : xhr.status;
      if (status === 0)
        status = response ? 200 : urlResolver(url).protocol === 'file' ? 404 : 0;
      createResponse(resolve, (status >= 200 && status < 400), status, xhr, response);
    };
    xhr.onerror = function() {
      createResponse(reject, false, xhr.status, xhr, '');
    };
    xhr.onabort = function() {
      createResponse(reject, false, xhr.status, xhr, '');
    };
    xhr.ontimeout = function() {
      createResponse(reject, false, xhr.status, xhr, '');
    };
    beforeSend(xhr);
    xhr.send(body);
  });
}

function code(len, prefix, sufix) {
  var alpha = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var out = '';
  var lowerAlt = false;
  for (var i = 0; i < (len || 8); i++) {
    var pos = Math.floor(Math.random() * alpha.length);
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
  var oneFilledField = false;
  var arrayObject = Object.keys(input);
  for (var index = 0; index < arrayObject.length; index++) {
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
  for (var i = 0; i < iterable.length; i++) {
    callback.call(context, iterable[i], i);
  }
}

function where(iterable, callback, context) {
  var out = [];
  for (var i = 0; i < iterable.length; i++) {
    if (callback.call(context, iterable[i], i)) {
      out.push(iterable[i]);
    }
  }
  return out;
}

function toArray(array) {
  if (!array)
    return [];
  return [].slice.call(array);
}

function createComment(id, content) {
  var comment = DOM.createComment(content || ' e ');
  comment.id = id || code(8);
  return comment;
}

function createAnyEl(elName, callback) {
  return createEl(elName, callback);
}

function createEl(elName, callback) {
  var el = DOM.createElement(elName);
  if (isFunction(callback))
    callback(el, DOM);
  var returnObj = {
    appendTo: function(target) {
      target.appendChild(el);
      return returnObj;
    },
    build: function() {
      return el;
    },
    child: function() {
      return el.children[0];
    },
    children: function() {
      return [].slice.call(el.childNodes);
    },
  };
  return returnObj;
}

function removeEl(el) {
  var parent = el.parentNode;
  if (parent)
    parent.removeChild(el);
}

function mapper(source, destination) {
  forEach(Object.keys(source), function(key) {
    var sourceValue = source[key];
    if (key in destination) {
      if (isObject(sourceValue))
        return mapper(sourceValue, destination[key]);
      return destination[key] = sourceValue;
    }
    Prop.transfer(destination, source, key);
  });
}

function urlResolver(url) {
  var href = url;
  // Support: IE 9-11 only, /* doc.documentMode is only available on IE */
  if ('documentMode' in DOM) {
    anchor.setAttribute('href', href);
    href = anchor.href;
  }
  anchor.href = href;
  var hostname = anchor.hostname;
  var ipv6InBrackets = anchor.hostname === '[::1]';
  if (!ipv6InBrackets && hostname.indexOf(':') > -1)
    hostname = '[' + hostname + ']';
  var $return = {
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

function urlCombine(base) {
  var parts = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    parts[_i - 1] = arguments[_i];
  }
  var baseSplitted = base.split(/\/\//);
  var protocol = baseSplitted.length > 1 ? (baseSplitted[0] + '//') : '';
  var uriRemain = protocol === '' ? baseSplitted[0] : baseSplitted[1];
  var uriRemainParts = uriRemain.split(/\//);
  var partsToJoin = [];
  forEach(uriRemainParts, function(p) {
    return trim(p) ? partsToJoin.push(p) : null;
  });
  forEach(parts, function(part) {
    return forEach(part.split(/\//), function(p) {
      return trim(p) ? partsToJoin.push(p) : null;
    });
  });
  return protocol + partsToJoin.join('/');
}
/**
 * Relative path resolver
 * @param { string } relative the path of the actual path
 * @param { string } path the actual path
 * @returns { string } path with ./resolved-path
 */
function pathResolver(relative, path) {
  var isCurrentDir = function(v) {
    return v.substring(0, 2) === './';
  };
  var isParentDir = function(v) {
    return v.substring(0, 3) === '../';
  };
  var toDirPath = function(v) {
    var values = v.split('/');
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
  var parts = toDirPath(relative).parts;
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

function fnEmpty(input) {
  return input;
}

function fnCall(fn) {
  if (fn instanceof Promise)
    fn.then(function(result) {
      if (isFunction(result))
        result.call();
      else if (result instanceof Promise)
        result.then();
    }).catch(function(err) {
      return Logger.error(err);
    });
  return fn;
}

function findAttribute(element, attrs, removeIfFound) {
  if (removeIfFound === void 0) {
    removeIfFound = false;
  }
  var res = null;
  if (!element)
    return null;
  for (var i = 0; i < attrs.length; i++)
    if (res = element.attributes[attrs[i]])
      break;
  if (!isNull(res) && removeIfFound)
    element.removeAttribute(res.name);
  return res;
}

function findDirective(node, name) {
  var attributes = node.attributes || [];
  return attributes.getNamedItem(name) ||
    toArray(attributes).find(function(attr) {
      return (attr.name === name || startWith(attr.name, name + ':'));
    });
}

function getRootElement(el) {
  return el.root || el;
}

function copyObject(object) {
  var out = Object.create(object.__proto__);
  forEach(Object.keys(object), function(key) {
    return out[key] = object[key];
  });
  return out;
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
  forEach(Object.keys(inputData), function(key) {
    var source;
    var destination;
    ReactiveEvent.once('AfterGet', function(evt) {
      evt.onemit = function(descriptor) {
        return source = descriptor;
      };
      Prop.descriptor(inputData, key).get();
    });
    ReactiveEvent.once('AfterGet', function(evt) {
      evt.onemit = function(descriptor) {
        return destination = descriptor;
      };
      var desc = Prop.descriptor(targetObject, key);
      if (desc && isFunction(desc.get))
        desc.get();
    });
    Prop.transfer(targetObject, inputData, key);
    if (!destination || !source)
      return;
    // Adding the previous watches to the property that is being set
    forEach(destination.watches, function(watch) {
      if (source.watches.indexOf(watch) === -1)
        source.watches.push(watch);
    });
    // Notifying the bounds and watches
    source.notify();
  });
  return targetObject;
}

function htmlToJsObj(input, options, onSet) {
  var element = undefined;
  // If it's not a HTML Element, just return
  if ((input instanceof HTMLElement))
    element = input;
  // If it's a string try to get the element
  else if (typeof input === 'string') {
    try {
      var $el = DOM.querySelector(input);
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
  var mNames = (options.names || '[name]').replace(/\[|\]/g, '').split(',');
  var mValues = (options.values || '[value]').replace(/\[|\]/g, '').split(',');
  var getValue = function(el, fieldName) {
    if (fieldName in el)
      return el[fieldName];
    return el.getAttribute(fieldName) || el.innerText;
  };
  var tryGetValue = function(el) {
    var val = undefined;
    mValues.find(function(field) {
      return (val = getValue(el, field)) ? true : false;
    });
    return val;
  };
  var objBuilder = function(element) {
    var builtObject = {};
    // Elements that skipped on serialization process
    var escapes = {
      BUTTON: true
    };
    var checkables = {
      checkbox: true,
      radio: true
    };
    (function walker(el) {
      var attr = findAttribute(el, mNames);
      if (attr) {
        var propName = attr.value;
        if (escapes[el.tagName] === true)
          return;
        if ((el instanceof HTMLInputElement) && (checkables[el.type] === true && el.checked === false))
          return;
        var propOldValue = builtObject[propName];
        var isBuildAsArray = el.hasAttribute(Constants.array);
        var value = tryGetValue(el);
        if (value !== '') {
          if (isBuildAsArray) {
            (propOldValue) ?
            // Add item to the array
            builtObject[propName] = Extend.array(propOldValue, value):
              // Set the new value
              builtObject[propName] = [value];
          } else {
            (propOldValue) ?
            // Spread and add properties
            builtObject[propName] = Extend.array(propOldValue, value):
              // Set the new value
              builtObject[propName] = value;
          }
        }
        // Calling on set function
        if (isFunction(onSet))
          fnCall(onSet(builtObject, propName, value, el));
      }
      forEach(toArray(el.children), function(child) {
        if (!findAttribute(child, [Constants.build]))
          walker(child);
      });
    })(element);
    return builtObject;
  };
  var builtObject = objBuilder(element);
  var builds = toArray(element.querySelectorAll("[".concat(Constants.build, "]")));
  forEach(builds, function(buildElement) {
    // Getting the e-build attr value
    var buildPath = getValue(buildElement, Constants.build);
    var isBuildAsArray = buildElement.hasAttribute(Constants.array);
    var builtObjValue = objBuilder(buildElement);
    // If the object is empty (has all fields with `null` value)
    if (!isFilledObj(builtObjValue))
      return;
    (function objStructurer(remainPath, lastLayer) {
      var splittedPath = remainPath.split('.');
      var leadElement = splittedPath[0];
      // Remove the lead element of the array
      splittedPath.shift();
      var objPropertyValue = lastLayer[leadElement];
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
          fnCall(onSet(lastLayer, leadElement, builtObjValue, buildElement));
        return;
      }
      if (Array.isArray(objPropertyValue)) {
        return forEach(objPropertyValue, function(item) {
          objStructurer(splittedPath.join('.'), item);
        });
      }
      objStructurer(splittedPath.join('.'), lastLayer[leadElement]);
    })(buildPath, builtObject);
  });
  return builtObject;
}
var WIN = window;
var DOM = document;
var anchor = createEl('a').build();
var DelimiterHandler = /** @class */ (function() {
  function DelimiterHandler(bouer, delimiters) {
    this.delimiters = [];
    this.bouer = bouer;
    this.delimiters = delimiters;
  }
  DelimiterHandler.prototype.add = function(item) {
    this.delimiters.push(item);
  };
  DelimiterHandler.prototype.remove = function(name) {
    var index = this.delimiters.findIndex(function(item) {
      return item.name === name;
    });
    this.delimiters.splice(index, 1);
  };
  DelimiterHandler.prototype.run = function(content) {
    var _this = this;
    if (isNull(content) || trim(content) === '')
      return [];
    var mDelimiter = null;
    var checkContent = function(text, flag) {
      var center = '([\\S\\s]*?)';
      for (var i = 0; i < _this.delimiters.length; i++) {
        var item = _this.delimiters[i];
        var result_1 = text.match(RegExp(item.delimiter.open + center + item.delimiter.close, flag || ''));
        if (result_1) {
          mDelimiter = item;
          return result_1;
        }
      }
    };
    var result = checkContent(content, 'g');
    if (!result)
      return [];
    return result.map(function(item) {
      var matches = checkContent(item);
      return {
        field: matches[0],
        expression: trim(matches[1]),
        delimiter: mDelimiter
      };
    });
  };
  DelimiterHandler.prototype.shorthand = function(attrName) {
    if (isNull(attrName) || trim(attrName) === '')
      return null;
    var result = attrName.match(new RegExp('{([\\w{$,-}]*?)}'));
    if (!result)
      return null;
    return {
      field: result[0],
      expression: trim(result[1])
    };
  };
  return DelimiterHandler;
}());
var Evaluator = /** @class */ (function() {
  function Evaluator(bouer) {
    this.bouer = bouer;
  }
  Evaluator.prototype.execRaw = function(code, context) {
    // Executing the expression
    try {
      Function(code).call(context || this.bouer);
    } catch (error) {
      Logger.error(buildError(error));
    }
  };
  Evaluator.prototype.exec = function(opts) {
    var dataToUse = Extend.obj((this.bouer.globalData || {}), (opts.aditional || {}), (opts.data || {}), {
      $root: this.bouer.data,
      $mixin: Extend.mixin
    });
    delete opts.data;
    opts.data = dataToUse;
    return Evaluator.run(opts);
  };
  Evaluator.run = function(opts) {
    try {
      return Function('var d$=arguments[0].d;return(function(){var r$;with(d$){' +
          (opts.isReturn === false ? '' : 'r$=') + opts.code + '}return r$;}).apply(this, arguments[0].a)')
        .call(opts.context, {
          d: opts.data || {},
          a: opts.args
        });
    } catch (error) {
      Logger.error(buildError(error));
    }
  };
  return Evaluator;
}());
var Skeleton = /** @class */ (function() {
  function Skeleton(bouer) {
    var _this = this;
    this._IRT_ = true;
    this.backgroudColor = '';
    this.waveColor = '';
    this.defaultBackgroudColor = '#E2E2E2';
    this.defaultWaveColor = '#ffffff5d';
    this.identifier = 'bouer';
    this.numberOfItems = 1;
    this.reset();
    this.bouer = bouer;
    this.style = createEl('style', function(el) {
      return el.id = _this.identifier;
    }).build();
  }
  Skeleton.prototype.reset = function() {
    this.backgroudColor = this.defaultBackgroudColor;
    this.waveColor = this.defaultWaveColor;
  };
  Skeleton.prototype.init = function(color) {
    var _this = this;
    if (!this.style)
      return;
    if (!DOM.getElementById(this.identifier))
      DOM.head.appendChild(this.style);
    if (!this.style.sheet)
      return;
    for (var i = 0; i < this.style.sheet.cssRules.length; i++)
      this.style.sheet.deleteRule(i);
    if (color) {
      this.backgroudColor = color.background || this.defaultBackgroudColor;
      this.waveColor = color.wave || this.defaultWaveColor;
      this.numberOfItems = color.numberOfItems || this.numberOfItems;
    } else {
      this.reset();
    }
    var dir = Constants.skeleton;
    var bgc = this.backgroudColor;
    var wvc = this.waveColor;
    var rules = [
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
    forEach(rules, function(rule) {
      return _this.style.sheet.insertRule(rule);
    });
    this.style.innerText = rules.join(' ');
  };
  Skeleton.prototype.insertItems = function(node) {
    var parentNode = node.parentElement || node.parentNode;
    var mNode = node;
    if (parentNode == null)
      return;
    if (this.numberOfItems <= 1)
      return;
    if (!mNode.hasAttribute('e-skeleton') && isNull(mNode.querySelector('[e-skeleton]')))
      return;
    var uid = code(6);
    node.setAttribute('skeleton-clone-code', uid);
    for (var i = 0; i < (this.numberOfItems - 1); i++) {
      var cloned = node.cloneNode(true);
      cloned.setAttribute('skeleton-cloned', uid);
      parentNode.insertBefore(cloned, node);
    }
  };
  Skeleton.prototype.clearItems = function(node) {
    var mNode = node;
    var container = (node.parentElement || node.parentNode);
    var uid = mNode.getAttribute('skeleton-clone-code');
    if (!uid)
      return;
    mNode.removeAttribute('skeleton-clone-code');
    forEach([].slice.call(container.querySelectorAll('[skeleton-cloned="' + uid + '"]')), function(node) {
      container.removeChild(node);
    });
  };
  Skeleton.prototype.clear = function(id) {
    id = (id ? ('="' + id + '"') : '');
    var appEl = ifNullStop(this.bouer.el);
    var skeletons = toArray(appEl.querySelectorAll('[' + Constants.skeleton + id + ']'));
    forEach(skeletons, function(el) {
      return el.removeAttribute(Constants.skeleton);
    });
  };
  return Skeleton;
}());
/**
 * It's a **Service Provider** container with all the services that will be used in the application.
 */
var IoC = (function IoC() {
  var bouerId = 1;
  var serviceCollection = new WeakMap();
  var add = function(app, clazz, params, isSingleton) {
    if (app.isDestroyed)
      throw new Error('Application already disposed.');
    if (!serviceCollection.has(app))
      serviceCollection.set(app, new WeakMap());
    var collection = serviceCollection.get(app);
    collection.set(clazz, {
      clazz: clazz,
      isSingleton: ifNullReturn(isSingleton, false),
      args: params
    });
  };
  var resolve = function(app, clazz) {
    if (app.isDestroyed)
      throw new Error('Application already disposed.');
    var collection = serviceCollection.get(app);
    if (!collection)
      return null;
    var service = collection.get(clazz);
    if (service == null)
      return null;
    if (service.isSingleton) {
      if (service.instance)
        return service.instance;
      // Otherwise, creates the singleton instance
      return service.instance = newInstance(clazz, service.args);
    }
    return newInstance(clazz, service.args);
  };
  /**
   * Creates a new instance of a class provided
   * @param clazz the class that the new instance should be created
   * @param params the parameter list that will be injected in the constructor
   * @returns new intance of the class provided
   */
  var newInstance = function(clazz, params) {
    var paramsToProvide = [];
    var mParams = params || [];
    var data = {
      __ctor0: clazz
    };
    // Looping all the provided params of the class constructor
    forEach(mParams, function(paramValue, index) {
      // Creating a unique name for the argument
      var paramName = '__arg' + index;
      // Setting the param name and value
      data[paramName] = paramValue;
      // Adding the unique name
      paramsToProvide.push(paramName);
    });
    // Creating a new instance according to above process
    return Evaluator.run({
      code: 'new __ctor0(' + paramsToProvide.join(',') + ')',
      data: data,
      isReturn: true
    });
  };
  var clear = function(app) {
    return serviceCollection.delete(app);
  };
  return {
    /**
     * Defines the bouer app containing all the services that needs to be provided in this app
     * @param app the bouer instance
     * @returns all the available methods to perform
     */
    app: function(app) {
      return {
        /**
         * Adds a service to be provided in whole the app
         * @param clazz the service that should be resolved future on
         * @param params the parameter that needs to be resolved every time the service is requested.
         * @param isSingleton mark the service as singleton to avoid creating an instance whenever it's requested
         */
        add: function(clazz, params, isSingleton) {
          return add(app, clazz, params, isSingleton);
        },
        /**
         * Resolve the Service with all it's dependencies
         * @param clazz the class the needs to be resolved
         * @returns the instance of the class resolved
         */
        resolve: function(clazz) {
          return resolve(app, clazz);
        },
        /**
         * Dispose all the added service of the current app
         */
        clear: function() {
          clear(app);
        }
      };
    },
    /**
     * Creates a new instance of a class provided
     * @param clazz the class that the new instance should be created
     * @param params the parameter list that will be injected in the constructor
     * @returns new intance of the class provided
     */
    new: function(clazz, params) {
      if (clazz instanceof Bouer) {
        Logger.error('Cannot create an instance of Bouer using IoC');
        return null;
      }
      return newInstance(clazz, params);
    },
    /**
     * Generates a unique Id for the application
     * @returns The next integer from the last one generated
     */
    newId: function() {
      return bouerId++;
    }
  };
})();
var Task = (function Task() {
  return {
    run: function(callback, milliseconds) {
      var timerId = setInterval(function() {
        callback(function() {
          return clearInterval(timerId);
        });
      }, milliseconds || 10);
    }
  };
})();
var Middleware = /** @class */ (function() {
  function Middleware(bouer) {
    var _this = this;
    this._IRT_ = true;
    this.middlewareConfigContainer = {};
    this.run = function(directive, runnable) {
      var middlewares = _this.middlewareConfigContainer[directive];
      if (!middlewares) {
        return (runnable.default || (function() {})).call(_this.bouer);
      }
      var index = 0;
      var middleware = middlewares[index];
      var _loop_1 = function() {
        var isNext = false;
        var middlewareAction = middleware[runnable.type];
        if (middlewareAction) {
          runnable.action(function(config, cbs) {
            Promise.resolve(middlewareAction.call(_this.bouer, config, function() {
              isNext = true;
            })).then(function(value) {
              if (!isNext)
                cbs.success(value);
              cbs.done();
            }).catch(function(error) {
              if (!isNext)
                cbs.fail(error);
              cbs.done();
            });
          });
        } else {
          // Run default config
          (runnable.default || (function() {}))();
        }
        if (isNext == false)
          return "break";
        middleware = middlewares[++index];
      };
      while (middleware != null) {
        var state_1 = _loop_1();
        if (state_1 === "break")
          break;
      }
    };
    this.subscribe = function(directive, actions) {
      if (!_this.middlewareConfigContainer[directive])
        _this.middlewareConfigContainer[directive] = [];
      var middleware = {};
      actions.call(_this.bouer, function(onBind) {
        return middleware.onBind = onBind;
      }, function(onUpdate) {
        return middleware.onUpdate = onUpdate;
      });
      _this.middlewareConfigContainer[directive].push(middleware);
    };
    this.has = function(directive) {
      var middlewares = _this.middlewareConfigContainer[directive];
      if (!middlewares)
        return false;
      return middlewares.length > 0;
    };
    this.bouer = bouer;
  }
  return Middleware;
}());
var Binder = /** @class */ (function() {
  function Binder(bouer) {
    this.binds = [];
    this.DEFAULT_BINDER_PROPERTIES = {
      text: 'value',
      number: 'valueAsNumber',
      checkbox: 'checked',
      radio: 'value',
      contenteditable: 'textContent',
    };
    this.BindingDirection = {
      fromInputToData: 'fromInputToData',
      fromDataToInput: 'fromDataToInput',
    };
    this.bouer = bouer;
    this.evaluator = IoC.app(bouer).resolve(Evaluator);
    this.cleanup();
  }
  Binder.prototype.create = function(options) {
    var _this = this;
    var node = options.node,
      data = options.data,
      fields = options.fields,
      isReplaceProperty = options.isReplaceProperty,
      context = options.context;
    var originalValue = trim(ifNullReturn(node.nodeValue, ''));
    var originalName = node.nodeName;
    var ownerNode = node.ownerElement || node.parentNode;
    var middleware = IoC.app(this.bouer).resolve(Middleware);
    var onUpdate = options.onUpdate || (function(v, n) {});
    // Clousure cache property settings
    var propertyBindConfig = {
      node: node,
      data: data,
      nodeName: originalName,
      nodeValue: originalValue,
      fields: fields,
      parent: ownerNode,
      value: ''
    };
    // Middleware that runs before the bind or update is made
    var $RunDirectiveMiddlewares = function(type) {
      middleware.run(originalName, {
        type: type,
        action: function(middleware) {
          middleware({
            binder: propertyBindConfig,
            detail: {},
          }, {
            success: function() {},
            fail: function() {},
            done: function() {},
          });
        },
      });
    };
    var $BindOneWay = function() {
      // One-Way Data Binding
      var nodeToBind = node;
      // If definable property e-[?]=""..."
      if (originalName.substring(0, Constants.property.length) ===
        Constants.property &&
        isNull(isReplaceProperty)) {
        propertyBindConfig.nodeName = originalName.substring(Constants.property.length);
        ownerNode.setAttribute(propertyBindConfig.nodeName, originalValue);
        nodeToBind = ownerNode.attributes[propertyBindConfig.nodeName];
        // Removing the e-[?] attr
        ownerNode.removeAttribute(node.nodeName);
      }
      // Property value setter
      var setter = function() {
        var valueToSet = propertyBindConfig.nodeValue;
        var isHtml = false;
        // Looping all the fields to be setted
        forEach(fields, function(field) {
          var delimiter = field.delimiter;
          if (delimiter && delimiter.name === 'html')
            isHtml = true;
          var result = _this.evaluator.exec({
            data: data,
            code: field.expression,
            context: context,
          });
          result = isNull(result) ? '' : result;
          valueToSet = valueToSet.replace(field.field, toStr(result));
          if (delimiter && typeof delimiter.onUpdate === 'function')
            valueToSet = delimiter.onUpdate(valueToSet, node, data);
        });
        propertyBindConfig.value = valueToSet;
        if (!isHtml)
          return (nodeToBind.nodeValue = valueToSet);
        var htmlSnippets = createEl('div', function(el) {
            return el.innerHTML = valueToSet;
          })
          .children();
        ownerNode.innerHTML = '';
        forEach(htmlSnippets, function(snippetNode) {
          ownerNode.appendChild(snippetNode);
          IoC.app(_this.bouer).resolve(Compiler).compile({
            el: snippetNode,
            data: data,
            context: context,
          });
        }, _this);
      };
      ReactiveEvent.once('AfterGet', function(event) {
        event.onemit = function(descriptor) {
          _this.binds.push({
            isConnected: options.isConnected,
            watch: descriptor.onChange(function() {
              $RunDirectiveMiddlewares('onUpdate');
              setter();
              onUpdate(descriptor.propValue, node);
            }, node),
          });
        };
        setter();
      });
      $RunDirectiveMiddlewares('onBind');
      propertyBindConfig.node = nodeToBind;
      return propertyBindConfig;
    };
    var $BindTwoWay = function() {
      var propertyNameToBind = '';
      var binderTarget = ownerNode.type;
      if (ownerNode.hasAttribute('contenteditable'))
        binderTarget = 'contenteditable';
      binderTarget = binderTarget || ownerNode.localName;
      if (Constants.bind === originalName)
        propertyNameToBind =
        _this.DEFAULT_BINDER_PROPERTIES[binderTarget] || 'value';
      else
        propertyNameToBind = originalName.split(':')[1]; // e-bind:value -> value
      var isSelect = ownerNode instanceof HTMLSelectElement;
      var isSelectMultiple = isSelect && ownerNode.multiple === true;
      var modelAttribute = findAttribute(ownerNode, [':value'], true);
      var dataBindModel = modelAttribute ? modelAttribute.value : '\'' + ownerNode.value + '\'';
      var dataBindProperty = trim(originalValue);
      var boundPropertyValue;
      var boundModelValue;
      var $Setter = {
        fromDataToInput: function(value) {
          // Normal Property Set
          if (!Array.isArray(boundPropertyValue)) {
            // In case of radio button we need to check if the value is the same to check it
            if (binderTarget === 'radio')
              return (ownerNode.checked =
                ownerNode[propertyNameToBind] == value);
            // Default Binding
            var _valueToSet = isObject(value) ? toStr(value) : isNull(value) ? '' : value;
            var _valueSet = ownerNode[propertyNameToBind];
            if (_valueToSet === _valueSet)
              return;
            return ownerNode[propertyNameToBind] = _valueToSet;
          }
          // Array Set
          boundModelValue =
            boundModelValue ||
            _this.evaluator.exec({
              data: data,
              code: dataBindModel,
              context: context,
            });
          // select-multiple handling
          if (isSelectMultiple) {
            return forEach(toArray(ownerNode.options), function(option) {
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
        fromInputToData: function(value) {
          // Normal Property Set
          if (!Array.isArray(boundPropertyValue)) {
            // Default Binding
            return _this.evaluator.exec({
              isReturn: false,
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
            _this.evaluator.exec({
              data: data,
              code: dataBindModel,
              context: context,
            });
          // select-multiple handling
          if (isSelectMultiple) {
            var optionCollection_1 = [];
            forEach(toArray(ownerNode.options), function(option) {
              if (option.selected === true)
                optionCollection_1.push(trim(option.value));
            });
            boundPropertyValue.splice(0, boundPropertyValue.length);
            return boundPropertyValue.push.apply(boundPropertyValue, optionCollection_1);
          }
          if (value)
            boundPropertyValue.push(boundModelValue);
          else
            boundPropertyValue.splice(boundPropertyValue.indexOf(boundModelValue), 1);
        },
      };
      var callback = function(direction, value) {
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
        return $Setter[direction](value);
      };
      ReactiveEvent.once('AfterGet', function(evt) {
        var getValue = function() {
          return _this.evaluator.exec({
            data: data,
            code: dataBindProperty,
            context: context,
          });
        };
        // Adding the event on emittion
        evt.onemit = function(descriptor) {
          _this.binds.push({
            isConnected: options.isConnected,
            watch: descriptor.onChange(function() {
              $RunDirectiveMiddlewares('onUpdate');
              var value = getValue();
              callback(_this.BindingDirection.fromDataToInput, value);
              onUpdate(value, node);
            }, node),
          });
        };
        // calling the main event
        boundPropertyValue = getValue();
      });
      $RunDirectiveMiddlewares('onBind');
      callback(_this.BindingDirection.fromDataToInput, boundPropertyValue);
      var listeners = ['input', 'propertychange', 'change'];
      if (listeners.indexOf(ownerNode.localName) === -1)
        listeners.push(ownerNode.localName);
      // Applying the events
      forEach(listeners, function(listener) {
        if (listener === 'change' && ownerNode.localName !== 'select')
          return;
        ownerNode.addEventListener(listener, function() {
          callback(_this.BindingDirection.fromInputToData, ownerNode[propertyNameToBind]);
        }, false);
      });
      // Removing the e-bind attr
      ownerNode.removeAttribute(node.nodeName);
      return propertyBindConfig; // Stop Two-Way Data Binding Process
    };
    if (originalName.substring(0, Constants.bind.length) === Constants.bind)
      return $BindTwoWay();
    return $BindOneWay();
  };
  Binder.prototype.remove = function(boundNode, boundAttrName, boundPropName) {
    this.binds = where(this.binds, function(bind) {
      var node = bind.watch.node;
      if ((node.ownerElement || node.parentElement) !== boundNode)
        return true;
      if (isNull(boundAttrName))
        return bind.watch.destroy();
      if (node.nodeName === boundAttrName &&
        (boundPropName === bind.watch.property || isNull(boundPropName)))
        return bind.watch.destroy();
      return true;
    });
  };
  Binder.prototype.onPropertyChange = function(propertyName, callback, targetObject) {
    var mWatch;
    ReactiveEvent.once('AfterGet', function(event) {
      event.onemit = function(descriptor) {
        return (mWatch = descriptor.onChange(callback));
      };
      fnEmpty(targetObject[propertyName]);
    });
    return mWatch;
  };
  Binder.prototype.onPropertyInScopeChange = function(watchable) {
    var _this = this;
    var watches = [];
    ReactiveEvent.once('AfterGet', function(evt) {
      evt.onemit = function(descriptor) {
        // Using scope watch avoid listen to the same property twice
        if (watches.find(function(w) {
            return w.property === descriptor.propName &&
              w.descriptor.propSource === descriptor.propSource;
          }))
          return;
        // Execution handler
        var isExecuting = false;
        watches.push(descriptor.onChange(function() {
          if (isExecuting)
            return;
          isExecuting = true;
          watchable.call(_this.bouer, _this.bouer);
          isExecuting = false;
        }));
      };
      watchable.call(_this.bouer, _this.bouer);
    });
    return {
      watches: watches,
      destroy: function() {
        return forEach(watches, function(w) {
          return w.destroy();
        });
      }
    };
  };
  /** Creates a process to unbind properties that is not connected to the DOM anymone */
  Binder.prototype.cleanup = function() {
    var _this = this;
    var autoUnbind = ifNullReturn(this.bouer.config.autoUnbind, true);
    if (autoUnbind == false)
      return;
    Task.run(function() {
      _this.binds = where(_this.binds, function(bind) {
        if (bind.isConnected())
          return true;
        bind.watch.destroy();
      });
    });
  };
  return Binder;
}());
var EventHandler = /** @class */ (function() {
  function EventHandler(bouer, evaluator) {
    this._IRT_ = true;
    this.$events = {};
    this.input = createEl('input').build();
    this.bouer = bouer;
    this.evaluator = IoC.app(bouer).resolve(Evaluator);
    this.cleanup();
  }
  EventHandler.prototype.compile = function(node, data, context) {
    var _this = this;
    var ownerNode = (node.ownerElement || node.parentNode);
    var nodeName = node.nodeName;
    if (isNull(ownerNode))
      return Logger.error('Invalid ParentElement of “' + nodeName + '”');
    // <button on:submit.once.stop="times++"/>
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    var eventNameWithModifiers = nodeName.substring(Constants.on.length);
    var allModifiers = eventNameWithModifiers.split('.');
    var eventName = allModifiers[0];
    allModifiers.shift();
    if (nodeValue === '')
      return Logger.error('Expected an expression in the “' + nodeName + '” and got an <empty string>.');
    ownerNode.removeAttribute(nodeName);
    var callback = function(evt) {
      // Calling the modifiers
      var availableModifiersFunction = {
        'prevent': 'preventDefault',
        'stop': 'stopPropagation'
      };
      forEach(allModifiers, function(modifier) {
        var modifierFunctionName = availableModifiersFunction[modifier];
        if (evt[modifierFunctionName])
          evt[modifierFunctionName]();
      });
      var mArguments = [evt];
      var isResultFunction = _this.evaluator.exec({
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
          isResultFunction.apply(context, mArguments);
        } catch (error) {
          Logger.error(buildError(error));
        }
      }
    };
    var modifiersObject = {};
    var addEventListenerOptions = ['capture', 'once', 'passive'];
    forEach(allModifiers, function(md) {
      md = md.toLocaleLowerCase();
      if (addEventListenerOptions.indexOf(md) !== -1) {
        modifiersObject[md] = true;
      }
    });
    if (!('on' + eventName in this.input))
      this.on({
        eventName: eventName,
        callback: callback,
        modifiers: modifiersObject,
        context: context,
        attachedNode: ownerNode
      });
    else
      ownerNode.addEventListener(eventName, callback, modifiersObject);
  };
  EventHandler.prototype.on = function(options) {
    var _this = this;
    var instance = this;
    var eventName = options.eventName,
      callback = options.callback,
      context = options.context,
      attachedNode = options.attachedNode,
      modifiers = options.modifiers;
    var iEventSubCallback = function(evt) {
      return callback.apply(context || _this.bouer, [evt]);
    };
    var event = {
      eventName: eventName,
      attachedNode: attachedNode,
      modifiers: modifiers,
      callback: iEventSubCallback,
      destroy: function() {
        return instance.off({
          callback: iEventSubCallback,
          attachedNode: attachedNode,
          eventName: eventName,
        });
      },
      emit: function(options) {
        return _this.emit({
          eventName: eventName,
          attachedNode: attachedNode,
          init: (options || {}).init,
          once: (options || {}).once,
        });
      }
    };
    if (!this.$events[eventName])
      this.$events[eventName] = [];
    this.$events[eventName].push(event);
    return event;
  };
  EventHandler.prototype.off = function(options) {
    var eventName = options.eventName,
      callback = options.callback,
      attachedNode = options.attachedNode;
    if (!this.$events[eventName])
      return;
    this.$events[eventName] = where(this.$events[eventName], function(evt) {
      var isEqual = (evt.eventName === eventName && callback == evt.callback);
      if (attachedNode && (evt.attachedNode === attachedNode) && isEqual)
        return false;
      // In this case remove all
      var isRemoveAll = (evt.eventName === eventName &&
        evt.attachedNode === attachedNode &&
        isNull(callback));
      if (isRemoveAll)
        return;
      return !isEqual;
    });
  };
  EventHandler.prototype.emit = function(options) {
    var _this = this;
    var eventName = options.eventName,
      init = options.init,
      once = options.once,
      attachedNode = options.attachedNode;
    var events = this.$events[eventName];
    if (!events)
      return;
    var emitter = function(node, callback) {
      node.addEventListener(eventName, callback, {
        once: true
      });
      node.dispatchEvent(new CustomEvent(eventName, init));
    };
    this.$events[eventName] = where(events, function(evt) {
      var node = evt.attachedNode;
      var isOnceEvent = ifNullReturn((evt.modifiers || {}).once, false) || ifNullReturn(once, false);
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
      fnCall(evt.callback.call(_this.bouer, new CustomEvent(eventName, init)));
      return !isOnceEvent;
    });
  };
  EventHandler.prototype.cleanup = function() {
    var _this = this;
    var autoOffEvent = ifNullReturn(this.bouer.config.autoOffEvent, true);
    if (autoOffEvent == false)
      return;
    Task.run(function() {
      forEach(Object.keys(_this.$events), function(key) {
        _this.$events[key] = where(_this.$events[key], function(event) {
          if ((event.modifiers || {}).autodestroy === false)
            return true;
          if (!event.attachedNode)
            return true;
          if (event.attachedNode.isConnected)
            return true;
        });
      });
    });
  };
  return EventHandler;
}());
var Routing = /** @class */ (function() {
  function Routing(bouer) {
    this._IRT_ = true;
    this.routeView = null;
    this.activeAnchors = [];
    // Store `href` value of the <base /> tag
    this.base = null;
    this.bouer = bouer;
  }
  /** Initialize the routing the instance */
  Routing.prototype.init = function() {
    var _this = this;
    this.routeView = ifNullStop(this.bouer.el).querySelector('[route-view]');
    if (isNull(this.routeView))
      return;
    this.routeView.removeAttribute('route-view');
    this.base = '/';
    var base = DOM.head.querySelector('base');
    if (base) {
      var baseHref = base.attributes.getNamedItem('href');
      if (!baseHref)
        return Logger.error('The href="/" attribute is required in base element.');
      this.base = baseHref.value;
    }
    if (this.defaultPage)
      this.navigate(DOM.location.href);
    // Listening to the page navigation
    WIN.addEventListener('popstate', function(evt) {
      evt.preventDefault();
      _this.navigate(((evt.state || {}).url || location.href), {
        setURL: false
      });
    });
  };
  /**
   * Navigates to a certain page without reloading all the page
   * @param {string} route the route to navigate to
   * @param {object?} options navigation options
   */
  Routing.prototype.navigate = function(route, options) {
    var _this = this;
    if (!this.routeView)
      return;
    if (isNull(route))
      return Logger.log('Invalid url provided to the navigation method.');
    route = trim(route);
    var resolver = urlResolver(route);
    var usehash = ifNullReturn(this.bouer.config.usehash, true);
    var navigatoTo = (usehash ? resolver.hash : resolver.pathname).split('?')[0];
    options = options || {};
    // In case of: /about/me/, remove the last forward slash
    if (navigatoTo[navigatoTo.length - 1] === '/')
      navigatoTo = navigatoTo.substring(0, navigatoTo.length - 1);
    var page = this.toPage(navigatoTo);
    this.clear();
    if (!page)
      return; // Page Not Found or Page Not Defined
    // If it's not found and the url matches .html do nothing
    if (!page && route.endsWith('.html'))
      return;
    var componentElement = createAnyEl(page.name, function(el) {
        // Inherit the data scope by default
        el.setAttribute('data', isObject(options.data) ? JSON.stringify(options.data) : '$data');
      }).appendTo(this.routeView)
      .build();
    // Document info configuration
    DOM.title = page.title || DOM.title;
    if (ifNullReturn(options.setURL, true))
      this.pushState(resolver.href, DOM.title);
    var routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route);
    IoC.app(this.bouer).resolve(ComponentHandler)
      .order(componentElement, this.bouer.data, function() {
        _this.markActiveAnchorsWithRoute(routeToSet);
      });
  };
  Routing.prototype.pushState = function(url, title) {
    url = urlResolver(url).href;
    if (DOM.location.href === url)
      return;
    WIN.history.pushState({
      url: url,
      title: title
    }, (title || ''), url);
  };
  Routing.prototype.popState = function(times) {
    if (isNull(times))
      times = -1;
    WIN.history.go(times);
  };
  Routing.prototype.toPage = function(url) {
    // Default Page
    if (url === '' || url === '/' ||
      url === '/' + urlCombine((this.base, 'index.html'))) {
      return this.defaultPage;
    }
    // Search for the right page
    return IoC.app(this.bouer).resolve(ComponentHandler)
      .find(function(component) {
        if (!component.route)
          return false;
        var routeRegExp = component.route.replace(/{(.*?)}/gi, '[\\S\\s]{1,}');
        if (Array.isArray(new RegExp('^' + routeRegExp + '$', 'i').exec(url)))
          return true;
        return false;
      }) || this.notFoundPage;
  };
  Routing.prototype.markActiveAnchorsWithRoute = function(route) {
    var _this = this;
    var className = this.bouer.config.activeClassName || 'active-link';
    var appEl = ifNullStop(this.bouer.el);
    var anchors = appEl.querySelectorAll('a');
    if (isNull(route))
      return;
    // Removing the active mark
    forEach(this.activeAnchors, function(anchor) {
      return anchor.classList.remove(className);
    });
    // Removing the active mark
    forEach([].slice.call(appEl.querySelectorAll('a.' + className)), function(anchor) {
      return anchor.classList.remove(className);
    });
    this.activeAnchors = [];
    // Adding the className and storing all the active anchors
    forEach(toArray(anchors), function(anchor) {
      if (anchor.href.split('?')[0] !== route.split('?')[0])
        return;
      anchor.classList.add(className);
      _this.activeAnchors.push(anchor);
    });
  };
  Routing.prototype.markActiveAnchor = function(anchor) {
    var className = this.bouer.config.activeClassName || 'active-link';
    if (isNull(anchor))
      return;
    forEach(this.activeAnchors, function(anchor) {
      return anchor.classList.remove(className);
    });
    forEach([].slice.call(ifNullStop(this.bouer.el).querySelectorAll('a.' + className)), function(anchor) {
      return anchor.classList.remove(className);
    });
    anchor.classList.add(className);
    this.activeAnchors = [anchor];
  };
  Routing.prototype.clear = function() {
    this.routeView.innerHTML = '';
  };
  /**
   * Allow to configure the `Default Page` and `NotFound Page`
   * @param {Component|IComponentOptions} component the component to be checked
   */
  Routing.prototype.configure = function(component) {
    if (component.isDefault === true && !isNull(this.defaultPage))
      return Logger.warn('There are multiple “Default Page” provided, check the “' + component.route + '” route.');
    if (component.isNotFound === true && !isNull(this.notFoundPage))
      return Logger.warn('There are multiple “NotFound Page” provided, check the “' + component.route + '” route.');
    if (component.isDefault === true)
      this.defaultPage = component;
    if (component.isNotFound === true)
      this.notFoundPage = component;
  };
  return Routing;
}());
var DataStore = /** @class */ (function() {
  function DataStore() {
    this._IRT_ = true;
    this.wait = {};
    this.data = {};
    this.req = {};
  }
  DataStore.prototype.set = function(key, dataKey, data) {
    if (key === 'wait')
      return Logger.warn('Only “get” is allowed for type of data');
    this[key][dataKey] = data;
  };
  DataStore.prototype.get = function(key, dataKey, once) {
    var result = this[key][dataKey];
    if (once === true)
      this.unset(key, dataKey);
    return result;
  };
  DataStore.prototype.unset = function(key, dataKey) {
    delete this[key][dataKey];
  };
  return DataStore;
}());
var Directive = /** @class */ (function() {
  function Directive(customDirective, compiler, compilerContext) {
    this._IRT_ = true;
    this.$custom = {};
    this.errorMsgEmptyNode = function(node) {
      return ('Expected an expression in “' + node.nodeName +
        '” and got an <empty string>.');
    };
    this.errorMsgNodeValue = function(node) {
      return ('Expected an expression in “' + node.nodeName +
        '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
    };
    this.compiler = compiler;
    this.context = compilerContext;
    this.bouer = compiler.bouer;
    this.$custom = customDirective;
    this.evaluator = IoC.app(this.bouer).resolve(Evaluator);
    this.delimiter = IoC.app(this.bouer).resolve(DelimiterHandler);
    this.binder = IoC.app(this.bouer).resolve(Binder);
    this.eventHandler = IoC.app(this.bouer).resolve(EventHandler);
  }
  // Helper functions
  Directive.prototype.toOwnerNode = function(node) {
    return node.ownerElement || node.parentNode;
  };
  // Directives
  Directive.prototype.skip = function(node) {
    node.nodeValue = 'true';
  };
  Directive.prototype.if = function(node, data) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var container = ownerNode.parentElement;
    if (!container)
      return;
    var conditions = [];
    var comment = createComment();
    var nodeName = node.nodeName;
    var execute = function() {};
    if (nodeName === Constants.elseif || nodeName === Constants.else)
      return;
    var currentEl = ownerNode;
    var reactives = [];
    var _loop_1 = function() {
      if (currentEl == null)
        return "break";
      var attr = findAttribute(currentEl, ['e-if', 'e-else-if', 'e-else']);
      if (!attr)
        return "break";
      var firstCondition = conditions[0]; // if it already got an 'if',
      if (attr.name === 'e-if' && firstCondition && (attr.name === firstCondition.attr.name))
        return "break";
      if ((attr.nodeName !== 'e-else') && (trim(ifNullReturn(attr.nodeValue, '')) === ''))
        return {
          value: Logger.error(this_1.errorMsgEmptyNode(attr))
        };
      if (this_1.delimiter.run(ifNullReturn(attr.nodeValue, '')).length !== 0)
        return {
          value: Logger.error(this_1.errorMsgNodeValue(attr))
        };
      conditions.push({
        attr: attr,
        node: currentEl
      });
      if (attr.nodeName === ('e-else')) {
        currentEl.removeAttribute(attr.nodeName);
        return "break";
      }
      // Listening to the property get only if the callback function is defined
      ReactiveEvent.once('AfterGet', function(event) {
        event.onemit = function(descriptor) {
          // Avoiding multiple binding in the same property
          if (reactives.findIndex(function(item) {
              return item.descriptor.propName == descriptor.propName;
            }) !== -1)
            return;
          reactives.push({
            attr: attr,
            descriptor: descriptor
          });
        };
        _this.evaluator.exec({
          data: data,
          code: attr.value,
          context: _this.context,
        });
      });
      currentEl.removeAttribute(attr.nodeName);
    };
    var this_1 = this;
    do {
      var state_1 = _loop_1();
      if (typeof state_1 === "object")
        return state_1.value;
      if (state_1 === "break")
        break;
    } while (currentEl = currentEl.nextElementSibling);
    var isChainConnected = function() {
      return !isNull(Extend.array(conditions.map(function(x) {
        return x.node;
      }), comment).find(function(el) {
        return el.isConnected;
      }));
    };
    forEach(reactives, function(item) {
      _this.binder.binds.push({
        // Binder is connected if at least one of the chain and the comment is still connected
        isConnected: isChainConnected,
        watch: item.descriptor.onChange(function() {
          return execute();
        }, item.attr)
      });
    });
    (execute = function() {
      forEach(conditions, function(chainItem) {
        var element = getRootElement(chainItem.node);
        if (!element.parentElement)
          return;
        if (comment.isConnected)
          container.removeChild(element);
        else
          container.replaceChild(comment, element);
      });
      var conditionalExpression = conditions.map(function(item, index) {
        var $value = item.attr.value;
        switch (item.attr.name) {
          case Constants.if:
            return 'if(' + $value + '){ __cb(' + index + '); }';
          case Constants.elseif:
            return 'else if(' + $value + '){ __cb(' + index + '); }';
          case Constants.else:
            return 'else{ __cb(' + index + '); }';
        }
      }).join(' ');
      _this.evaluator.exec({
        data: data,
        isReturn: false,
        code: conditionalExpression,
        context: _this.context,
        aditional: {
          __cb: function(chainIndex) {
            var mElement = conditions[chainIndex].node;
            var element = getRootElement(mElement);
            container.replaceChild(element, comment);
            _this.compiler.compile({
              el: element,
              data: data,
              context: _this.context,
              isConnected: isChainConnected
            });
          }
        }
      });
    })();
  };
  Directive.prototype.show = function(node, data) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    var execute = function(el) {};
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));
    var bindResult = this.binder.create({
      data: data,
      node: node,
      isConnected: function() {
        return ownerNode.isConnected;
      },
      fields: [{
        expression: nodeValue,
        field: nodeValue
      }],
      context: this.context,
      onUpdate: function() {
        return execute(ownerNode);
      }
    });
    (execute = function(element) {
      element.style.display = _this.evaluator.exec({
        data: data,
        code: nodeValue,
        context: _this.context,
      }) ? '' : 'none';
    })(ownerNode);
    ownerNode.removeAttribute(bindResult.node.nodeName);
  };
  Directive.prototype.for = function(node, data) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var container = ownerNode.parentElement;
    if (!container)
      return;
    if (ownerNode.hasAttribute('skeleton-cloned'))
      return;
    var comment = createComment();
    var nodeName = node.nodeName;
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    var listedItemsHandler = [];
    var hasWhereFilter = false;
    var hasOrderFilter = false;
    var execute = function() {};
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
      return Logger.error('Expected a valid “for” expression in “' + nodeName + '” and got “' + nodeValue + '”.' +
        '\nValid: e-for="item of items".');
    // Binding the e-for if got delimiters
    var delimiters = this.delimiter.run(nodeValue);
    if (delimiters.length !== 0)
      this.binder.create({
        node: node,
        data: data,
        fields: delimiters,
        isReplaceProperty: true,
        context: this.context,
        isConnected: function() {
          return comment.isConnected;
        },
        onUpdate: function() {
          return execute();
        }
      });
    ownerNode.removeAttribute(nodeName);
    // Cloning the element
    var forItem = ownerNode.cloneNode(true);
    // Replacing the comment reference
    container.replaceChild(comment, ownerNode);
    // Filters the list of items
    var $Where = function(list, filterConfigParts) {
      hasWhereFilter = true;
      var wKeys = filterConfigParts[2];
      var wValue = filterConfigParts[1];
      if (isNull(wValue) || wValue === '') {
        Logger.error('Invalid where-value in “' + nodeName + '” with “' + nodeValue + '” expression.');
        return list;
      }
      wValue = _this.evaluator.exec({
        data: data,
        code: wValue,
        context: _this.context
      });
      // where:filterFunction
      if (typeof wValue === 'function') {
        list = wValue(list);
      } else {
        // where:search:name?
        if ((isNull(wKeys) || wKeys === '') && isObject(list[0] || '')) {
          Logger.error(('Invalid where-keys in “' + nodeName + '” with “' + nodeValue + '” expression, ' +
            'at least one where-key to be provided when using list of object.'));
          return list;
        }
        var newListCopy_1 = [];
        forEach(list, function(item) {
          var isValid = false;
          if (isNull(wKeys)) {
            isValid = toStr(item).toLowerCase().includes(wValue.toLowerCase());
          } else {
            var keysList = wKeys.split(',').map(function(m) {
              return trim(m);
            });
            for (var i = 0; i < keysList.length; i++) {
              var prop = keysList[i];
              var propValue = _this.evaluator.exec({
                data: item,
                code: prop,
                context: _this.context
              });
              if (toStr(propValue).toLowerCase().includes(wValue.toLowerCase())) {
                isValid = true;
                break;
              }
            }
          }
          if (isValid)
            newListCopy_1.push(item);
        });
        list = newListCopy_1;
      }
      return list;
    };
    // Order the list of items
    var $Order = function(list, type, prop) {
      hasOrderFilter = true;
      if (!type)
        type = 'asc';
      return list.sort(function(a, b) {
        var comparison = function(asc, desc) {
          if (isNull(asc) || isNull(desc))
            return 0;
          switch (toLower(type)) {
            case 'asc':
              return asc ? 1 : -1;
            case 'desc':
              return desc ? -1 : 1;
            default:
              Logger.log('The “' + type + '” order type is invalid: “' + nodeValue +
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
    var $PrepareForItem = function(item, index) {
      expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
      var leftHandParts = expObj.leftHandParts;
      var sourceValue = expObj.sourceValue;
      var isForOf = expObj.isForOf;
      var forData = Extend.obj(data);
      var itemKey = leftHandParts[0];
      var indexOrValue = leftHandParts[1] || '_index_or_value';
      var mIndex = leftHandParts[2] || '_for_in_index';
      forData[itemKey] = item;
      forData[indexOrValue] = isForOf ? index : sourceValue[item];
      forData[mIndex] = index;
      return Reactive.transform({
        data: forData,
        context: _this.context
      });
    };
    // Inserts an element in the DOM
    var $InsertForItem = function(options) {
      // Preparing the data to be inserted
      var forData = $PrepareForItem(options.item, options.index);
      // Inserting in the DOM
      var forClonedItem = container.insertBefore(forItem.cloneNode(true), options.reference || comment);
      // Compiling the inserted data
      _this.compiler.compile({
        el: forClonedItem,
        data: forData,
        context: _this.context,
        onDone: function(el) {
          return _this.eventHandler.emit({
            eventName: Constants.builtInEvents.add,
            attachedNode: el,
            once: true
          });
        }
      });
      // Updating the handler
      listedItemsHandler.splice(options.index, 0, {
        el: forClonedItem,
        data: forData
      });
      return forClonedItem;
    };
    // Builds the expression to an object
    var $ExpressionBuilder = function(expression) {
      var filters = expression.split('|').map(function(item) {
        return trim(item);
      });
      var forExpression = filters[0].replace(/\(|\)/g, '');
      filters.shift();
      // for types:
      // e-for="item of items",  e-for="(item, index) of items"
      // e-for="key in object", e-for="(key, value) in object"
      // e-for="(key, value, index) in object"
      var forSeparator = ' of ';
      var forParts = forExpression.split(forSeparator);
      if (!(forParts.length > 1))
        forParts = forExpression.split(forSeparator = ' in ');
      var leftHand = forParts[0];
      var rightHand = forParts[1];
      var leftHandParts = leftHand.split(',').map(function(x) {
        return trim(x);
      });
      var isForOf = trim(forSeparator) === 'of';
      var iterable = isForOf ? rightHand : 'Object.keys(' + rightHand + ')';
      var sourceValue = _this.evaluator.exec({
        data: data,
        code: rightHand,
        context: _this.context
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
    var $OnArrayChanges = function(detail) {
      if (hasWhereFilter || hasOrderFilter)
        return execute(); // Reorganize re-insert all the items
      detail = detail || {};
      var method = detail.method;
      var args = detail.args;
      var mListedItems = listedItemsHandler;
      var reOrganizeIndexes = function() {
        // In case of unshift re-organize the indexes
        // Was wrapped into a promise in case of large amount of data
        return Promise.resolve(function(array) {
          expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
          var leftHandParts = expObj.leftHandParts;
          var indexOrValue = leftHandParts[1] || '_index_or_value';
          if (indexOrValue === '_index_or_value')
            return;
          forEach(array, function(item, index) {
            item.data[indexOrValue] = index;
          });
        }).then(function(mCaller) {
          return mCaller(listedItemsHandler);
        });
      };
      switch (method) {
        case 'pop':
        case 'shift': { // First or Last item removal handler
          var item = mListedItems[method]();
          if (isNull(item))
            return;
          removeEl(getRootElement(item.el));
          if (method === 'pop')
            return;
          return reOrganizeIndexes();
        }
        case 'splice': { // Indexed removal handler
          var index_1 = args[0];
          var deleteCount = args[1];
          var removedItems = mListedItems.splice(index_1, deleteCount);
          forEach(removedItems, function(item) {
            return removeEl(getRootElement(item.el));
          });
          expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
          var leftHandParts = expObj.leftHandParts;
          var indexOrValue = leftHandParts[1] || '_index_or_value';
          var insertArgs = [].slice.call(args, 2);
          // Adding the items to the dom
          forEach(insertArgs, function(item) {
            index_1++;
            $InsertForItem({
              // Getting the next reference
              reference: getRootElement(listedItemsHandler[index_1].el) || comment,
              index: index_1,
              item: item,
            });
          });
          if (indexOrValue === '_index_or_value')
            return;
          // Fixing the index value
          for (; index_1 < listedItemsHandler.length; index_1++) {
            var item = listedItemsHandler[index_1].data;
            if (typeof item[indexOrValue] === 'number')
              item[indexOrValue] = index_1;
          }
          return;
        }
        case 'push':
        case 'unshift': { // Addition handler
          // Gets the last item as default
          var isUnshift_1 = method == 'unshift';
          var element = (listedItemsHandler[0] || {}).el || comment;
          var indexRef_1 = isUnshift_1 ? 0 : mListedItems.length;
          var reference_1 = isUnshift_1 ? getRootElement(element) : comment;
          // Adding the items to the dom
          forEach([].slice.call(args), function(item) {
            var ref = $InsertForItem({
              index: indexRef_1++,
              reference: reference_1,
              item: item,
            });
            if (isUnshift_1)
              reference_1 = ref;
          });
          if (isUnshift_1)
            reOrganizeIndexes();
          return;
        }
        default:
          return execute();
      }
    };
    var applyWhere = function(listCopy, config) {
      var parts = config.split(':').map(function(item) {
        return trim(item);
      });
      if (parts.length == 1) {
        Logger.error(('Invalid “' + nodeName + '” where expression “' + nodeValue +
          '”, at least a where-value and where-keys, or a filter-function must be provided'));
      } else {
        return $Where(listCopy, parts);
      }
    };
    var reactivePropertyEvent = ReactiveEvent.on('AfterGet', function(descriptor) {
      _this.binder.binds.push({
        isConnected: function() {
          return comment.isConnected;
        },
        watch: descriptor.onChange(function(_n, _o, detail) {
          return $OnArrayChanges(detail);
        }, node)
      });
    });
    var expObj = $ExpressionBuilder(nodeValue);
    var filters = expObj.filters;
    var findFilter = function(fName) {
      return filters.filter(function(item) {
        return item.substring(0, fName.length) === fName;
      });
    };
    var whereFilterConfigs = findFilter('where');
    // Applying the filter before rendering the items
    forEach(whereFilterConfigs, function(config) {
      return applyWhere(expObj.sourceValue, config);
    });
    reactivePropertyEvent.off();
    (execute = function() {
      expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
      var iterable = expObj.iterableExpression;
      var orderFilterConfigs = findFilter('order');
      // Cleaning the existing items
      forEach(listedItemsHandler, function(item) {
        var element = getRootElement(item.el);
        if (!element.parentElement)
          return;
        container.removeChild(element);
      });
      listedItemsHandler = [];
      _this.evaluator.exec({
        data: data,
        isReturn: false,
        context: _this.context,
        code: 'var __e = __each, __fl = __filters, __f = __for; ' +
          '__f(__fl(' + iterable + '), function($$itm, $$idx) { __e($$itm, $$idx); })',
        aditional: {
          __for: forEach,
          __each: function(item, index) {
            return $InsertForItem({
              index: index,
              item: item
            });
          },
          __filters: function(list) {
            var listCopy = Extend.array(list);
            // applying where:
            forEach(whereFilterConfigs, function(config) {
              return listCopy = applyWhere(listCopy, config);
            });
            // applying order:
            var applyOrder = function(config) {
              var parts = config.split(':').map(function(item) {
                return trim(item);
              });
              if (parts.length == 1) {
                Logger.error(('Invalid “' + nodeName + '” order  expression “' + nodeValue +
                  '”, at least the order type must be provided'));
              } else {
                listCopy = $Order(listCopy, parts[1], parts[2]);
              }
            };
            forEach(orderFilterConfigs, function(config) {
              return applyOrder(config);
            });
            return listCopy;
          }
        }
      });
      expObj = null;
    })();
  };
  Directive.prototype.def = function(node, data) {
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));
    var inputData = {};
    var reactiveEvent = ReactiveEvent.on('AfterGet', function(descriptor) {
      if (!(descriptor.propName in inputData))
        inputData[descriptor.propName] = undefined;
      Prop.set(inputData, descriptor.propName, descriptor);
    });
    var mInputData = this.evaluator.exec({
      data: data,
      code: nodeValue,
      context: this.context
    });
    if (!isObject(mInputData))
      return Logger.error('Expected a valid Object Literal expression in “' + node.nodeName +
        '” and got “' + nodeValue + '”.');
    // Adding all non-existing properties
    forEach(Object.keys(mInputData), function(key) {
      if (!(key in inputData))
        inputData[key] = mInputData[key];
    });
    ReactiveEvent.off('AfterGet', reactiveEvent.callback);
    this.bouer.set(inputData, data);
    ownerNode.removeAttribute(node.nodeName);
  };
  Directive.prototype.text = function(node) {
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    ownerNode.textContent = nodeValue;
    ownerNode.removeAttribute(node.nodeName);
  };
  Directive.prototype.bind = function(node, data) {
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));
    this.binder.create({
      node: node,
      isConnected: function() {
        return ownerNode.isConnected;
      },
      fields: [{
        field: nodeValue,
        expression: nodeValue
      }],
      context: this.context,
      data: data
    });
    ownerNode.removeAttribute(node.nodeName);
  };
  Directive.prototype.property = function(node, data) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    var execute = function(obj) {};
    var errorInvalidValue = function(node) {
      return ('Invalid value, expected an Object/Object Literal in “' +
        node.nodeName + '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
    };
    if (nodeValue === '')
      return Logger.error(errorInvalidValue(node));
    if (this.delimiter.run(nodeValue).length !== 0)
      return;
    var inputData = this.evaluator.exec({
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
      fields: [{
        expression: nodeValue,
        field: nodeValue
      }],
      isConnected: function() {
        return ownerNode.isConnected;
      },
      onUpdate: function() {
        return execute(_this.evaluator.exec({
          data: data,
          code: nodeValue,
          context: _this.context
        }));
      }
    });
    ownerNode.removeAttribute(node.nodeName);
    (execute = function(obj) {
      var attrNameToSet = node.nodeName.substring(Constants.property.length);
      var attr = ownerNode.attributes[attrNameToSet];
      if (!attr) {
        (ownerNode.setAttribute(attrNameToSet, ''));
        attr = ownerNode.attributes[attrNameToSet];
      }
      forEach(Object.keys(obj), function(key) {
        /* if has a falsy value remove the key */
        if (!obj[key])
          return attr.value = trim(attr.value.replace(key, ''));
        attr.value = (attr.value.includes(key) ? attr.value : trim(attr.value + ' ' + key));
      });
      if (attr.value === '')
        return ownerNode.removeAttribute(attrNameToSet);
    })(inputData);
  };
  Directive.prototype.data = function(node, data) {
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error('The “data” attribute cannot contain delimiter.');
    ownerNode.removeAttribute(node.nodeName);
    var inputData = {};
    var mData = Extend.obj(data, {
      $data: data
    });
    var reactiveEvent = ReactiveEvent.on('AfterGet', function(descriptor) {
      if (!(descriptor.propName in inputData))
        inputData[descriptor.propName] = undefined;
      Prop.set(inputData, descriptor.propName, descriptor);
    });
    // If data value is empty gets the main scope value
    if (nodeValue === '')
      inputData = Extend.obj(this.bouer.data);
    else {
      // Other wise, compiles the object provided
      var mInputData_1 = this.evaluator.exec({
        data: mData,
        code: nodeValue,
        context: this.context
      });
      if (!isObject(mInputData_1))
        return Logger.error('Expected a valid Object Literal expression in “' + node.nodeName +
          '” and got “' + nodeValue + '”.');
      // Adding all non-existing properties
      forEach(Object.keys(mInputData_1), function(key) {
        if (!(key in inputData))
          inputData[key] = mInputData_1[key];
      });
    }
    ReactiveEvent.off('AfterGet', reactiveEvent.callback);
    var dataKey = node.nodeName.split(':')[1];
    if (dataKey) {
      dataKey = dataKey.replace(/\[|\]/g, '');
      IoC.app(this.bouer).resolve(DataStore).set('data', dataKey, inputData);
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
  };
  Directive.prototype.href = function(node, data) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    ownerNode.removeAttribute(node.nodeName);
    var usehash = ifNullReturn(this.bouer.config.usehash, true);
    var routeToSet = urlCombine((usehash ? '#' : ''), nodeValue);
    ownerNode.setAttribute('href', routeToSet);
    var href = ownerNode.attributes['href'];
    var delimiters = this.delimiter.run(nodeValue);
    if (delimiters.length !== 0)
      this.binder.create({
        data: data,
        node: href,
        isConnected: function() {
          return ownerNode.isConnected;
        },
        context: this.context,
        fields: delimiters
      });
    ownerNode
      .addEventListener('click', function(event) {
        event.preventDefault();
        IoC.app(_this.bouer).resolve(Routing)
          .navigate(href.value);
      }, false);
  };
  Directive.prototype.entry = function(node, data) {
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));
    ownerNode.removeAttribute(node.nodeName);
    IoC.app(this.bouer).resolve(ComponentHandler)
      .prepare([
        {
          name: nodeValue,
          template: ownerNode.outerHTML,
          data: data
            }
        ]);
  };
  Directive.prototype.put = function(node, data) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    var execute = function() {};
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node) + ' Direct <empty string> injection value is not allowed.');
    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error('Expected an expression with no delimiter in “' + node.nodeName +
        '” and got “' + (ifNullReturn(node.nodeValue, '')) + '”.');
    this.binder.create({
      data: data,
      node: node,
      isConnected: function() {
        return ownerNode.isConnected;
      },
      fields: [{
        expression: nodeValue,
        field: nodeValue
      }],
      context: this.context,
      isReplaceProperty: false,
      onUpdate: function() {
        return execute();
      }
    });
    ownerNode.removeAttribute(node.nodeName);
    (execute = function() {
      ownerNode.innerHTML = '';
      nodeValue = trim(ifNullReturn(node.nodeValue, ''));
      if (nodeValue === '')
        return;
      var componentElement = createAnyEl(nodeValue)
        .appendTo(ownerNode)
        .build();
      IoC.app(_this.bouer).resolve(ComponentHandler)
        .order(componentElement, data);
    })();
  };
  Directive.prototype.req = function(node, data) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var container = this.toOwnerNode(ownerNode);
    var nodeName = node.nodeName;
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
      return Logger.error(('Expected a valid “for” expression in “' + nodeName +
        '” and got “' + nodeValue + '”.' + '\nValid: e-req="item of url".'));
    if (ownerNode.hasAttribute('skeleton-cloned'))
      return;
    var delimiters = this.delimiter.run(nodeValue);
    var localDataStore = {};
    var dataKey = (node.nodeName.split(':')[1] || '').replace(/\[|\]/g, '');
    var comment = createComment(undefined, 'request-' + (dataKey || code(6)));
    var onInsertOrUpdate = function() {};
    var onUpdate = function() {};
    var binderConfig = {
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
    var skeleton = IoC.app(this.bouer).resolve(Skeleton);
    // Only insert if the type is `of
    if (nodeValue.includes(' of '))
      skeleton.insertItems(ownerNode);
    if (delimiters.length !== 0)
      binderConfig = this.binder.create({
        data: data,
        node: node,
        fields: delimiters,
        context: this.context,
        isReplaceProperty: false,
        isConnected: function() {
          return comment.isConnected;
        },
        onUpdate: function() {
          return onUpdate();
        }
      });
    ownerNode.removeAttribute(node.nodeName);
    // Mutating the `isConnected` property of the e-req node
    Prop.set(ownerNode, 'isConnected', {
      get: function() {
        return comment.isConnected;
      }
    });
    var subcribeEvent = function(eventName) {
      var attr = ownerNode.attributes.getNamedItem(Constants.on + eventName);
      if (attr)
        _this.eventHandler.compile(attr, data, _this.context);
      return {
        emit: function(detailObj) {
          _this.eventHandler.emit({
            attachedNode: ownerNode,
            eventName: eventName,
            init: {
              detail: detailObj
            },
          });
        }
      };
    };
    var builder = function(expression) {
      var filters = expression.split('|').map(function(item) {
        return trim(item);
      });
      // Removing and retrieving the Request Expression
      var reqExpression = filters.shift().replace(/\(|\)/g, '');
      var reqSeparator = ' of ';
      var reqParts = reqExpression.split(reqSeparator);
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
    var isValidResponse = function(response, requestType) {
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
    var middleware = IoC.app(this.bouer).resolve(Middleware);
    if (!middleware.has('req'))
      return Logger.error('There is no “req” middleware provided for the “e-req” directive requests.');
    var createMiddlewareContext = function(expObject) {
      return {
        binder: binderConfig,
        detail: {
          requestType: expObject.type,
          requestPath: expObject.path,
          reponseData: localDataStore
        }
      };
    };
    (onInsertOrUpdate = function() {
      var expObject = builder(trim(node.nodeValue || ''));
      var responseHandler = function(response) {
        var _a;
        if (!isValidResponse(response, expObject.type))
          return;
        Reactive.transform({
          context: _this.context,
          data: response
        });
        if (dataKey)
          IoC.app(_this.bouer).resolve(DataStore).set('req', dataKey, response);
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
          var variable = trim(expObject.variables.split(',')[0].replace(/\(|\)/g, ''));
          if (variable in data)
            return Logger.error('There is already a “' + variable + '” defined in the current scope. ' +
              'Provide another variable name in order to continue.');
          data[variable] = response.data;
          return _this.compiler.compile({
            el: ownerNode,
            data: Reactive.transform({
              context: _this.context,
              data: data
            }),
            context: _this.context,
            isConnected: function() {
              return comment.isConnected;
            }
          });
        }
        if (expObject.type === 'of') {
          skeleton.clearItems(ownerNode);
          var resUniqueName = code(8, 'res');
          var forDirectiveContent = expObject.expression.replace(expObject.path, resUniqueName);
          var mData = Extend.obj((_a = {}, _a[resUniqueName] = response.data, _a), data);
          ownerNode.setAttribute(Constants.for, Extend.array([forDirectiveContent], expObject.filters).join(' | '));
          Prop.set(mData, resUniqueName, Prop.descriptor(response, 'data'));
          return _this.compiler.compile({
            el: ownerNode,
            data: mData,
            context: _this.context,
            isConnected: function() {
              return comment.isConnected;
            }
          });
        }
      };
      subcribeEvent(Constants.builtInEvents.request).emit();
      middleware.run('req', {
        type: 'onBind',
        action: function(middlewareRequest) {
          middlewareRequest(createMiddlewareContext(expObject), {
            success: function(response) {
              responseHandler(response);
            },
            fail: function(error) {
              return subcribeEvent(Constants.builtInEvents.fail).emit({
                error: error
              });
            },
            done: function() {
              return subcribeEvent(Constants.builtInEvents.done).emit();
            }
          });
        }
      });
    })();
    onUpdate = function() {
      var expObject = builder(trim(node.nodeValue || ''));
      middleware.run('req', {
        type: 'onUpdate',
        default: function() {
          return onInsertOrUpdate();
        },
        action: function(middlewareRequest) {
          middlewareRequest(createMiddlewareContext(expObject), {
            success: function(response) {
              if (!isValidResponse(response, expObject.type))
                return;
              localDataStore.data = response.data;
            },
            fail: function(error) {
              return subcribeEvent(Constants.builtInEvents.fail).emit({
                error: error
              });
            },
            done: function() {
              return subcribeEvent(Constants.builtInEvents.done).emit();
            }
          });
        }
      });
    };
  };
  Directive.prototype.wait = function(node) {
    var _this = this;
    var ownerNode = this.toOwnerNode(node);
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue === '')
      return Logger.error(this.errorMsgEmptyNode(node));
    if (this.delimiter.run(nodeValue).length !== 0)
      return Logger.error(this.errorMsgNodeValue(node));
    ownerNode.removeAttribute(node.nodeName);
    var dataStore = IoC.app(this.bouer).resolve(DataStore);
    var mWait = dataStore.wait[nodeValue];
    if (mWait) {
      mWait.nodes.push(ownerNode);
      // No data exposed yet
      if (!mWait.data)
        return;
      // Compile all the waiting nodes
      forEach(mWait.nodes, function(nodeWaiting) {
        _this.compiler.compile({
          el: nodeWaiting,
          context: mWait.context,
          data: Reactive.transform({
            context: mWait.context,
            data: mWait.data
          }),
        });
      });
      if (ifNullReturn(mWait.once, false))
        delete dataStore.wait[nodeValue];
    }
    return dataStore.wait[nodeValue] = {
      nodes: [ownerNode],
      context: this.context
    };
  };
  Directive.prototype.custom = function(node, data) {
    var ownerNode = this.toOwnerNode(node);
    var nodeName = node.nodeName;
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    var delimiters = this.delimiter.run(nodeValue);
    var $CustomDirective = this.$custom[nodeName];
    var bindConfig = this.binder.create({
      data: data,
      node: node,
      fields: delimiters,
      isReplaceProperty: false,
      context: this.context,
      isConnected: function() {
        return ownerNode.isConnected;
      },
      onUpdate: function() {
        if (typeof $CustomDirective.onUpdate === 'function')
          $CustomDirective.onUpdate(node, bindConfig);
      }
    });
    if (ifNullReturn($CustomDirective.removable, true))
      ownerNode.removeAttribute(nodeName);
    var modifiers = nodeName.split('.');
    modifiers.shift();
    // my-custom-dir:arg.mod1.mod2
    var argument = (nodeName.split(':')[1] || '').split('.')[0];
    bindConfig.modifiers = modifiers;
    bindConfig.argument = argument;
    if (typeof $CustomDirective.onBind === 'function')
      return ifNullReturn($CustomDirective.onBind(node, bindConfig), false);
    return false;
  };
  Directive.prototype.skeleton = function(node) {
    var _a;
    var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
    if (nodeValue !== '')
      return;
    var ownerNode = this.toOwnerNode(node);
    ownerNode.removeAttribute(node.nodeName);
    var uid = ownerNode.getAttribute('skeleton-clone-code');
    if (!uid)
      return;
    ownerNode.removeAttribute('skeleton-clone-code');
    forEach([].slice.call((_a = this.bouer.el) === null || _a === void 0 ? void 0 : _a.querySelectorAll('[="' + uid + '"]')), function(el) {
      (el.parentElement || el.parentNode).removeChild(el);
    });
  };
  return Directive;
}());
var Compiler = /** @class */ (function() {
  function Compiler(bouer, directives) {
    this._IRT_ = true;
    this.NODES_TO_IGNORE_IN_COMPILATION = {
      'SCRIPT': 1,
      '#comment': 8
    };
    this.bouer = bouer;
    this.directives = directives !== null && directives !== void 0 ? directives : {};
    this.binder = IoC.app(bouer).resolve(Binder);
    this.delimiter = IoC.app(bouer).resolve(DelimiterHandler);
    this.eventHandler = IoC.app(bouer).resolve(EventHandler);
    this.component = IoC.app(bouer).resolve(ComponentHandler);
  }
  /**
   * Compiles an html element
   * @param {string} options the options of the compilation process
   * @returns the element compiled
   */
  Compiler.prototype.compile = function(options) {
    var _this = this;
    var rootElement = options.el;
    var context = options.context || this.bouer;
    var data = (options.data || this.bouer.data);
    var isConnected = (options.isConnected || (function() {
      return rootElement.isConnected;
    }));
    var routing = IoC.app(this.bouer).resolve(Routing);
    if (!rootElement)
      return Logger.error('Invalid element provided to the compiler.');
    if (!this.analize(rootElement.outerHTML))
      return rootElement;
    var directive = new Directive(this.directives || {}, this, context);
    var walker = function(node, data) {
      if (node.nodeName in _this.NODES_TO_IGNORE_IN_COMPILATION)
        return;
      // First Element Attributes compilation
      if (node instanceof Element) {
        // e-skip directive
        if (Constants.skip in node.attributes)
          return directive.skip(node);
        // In case of slots
        if ((node.localName.toLowerCase() === Constants.slot || node.tagName.toLowerCase() === Constants.slot) &&
          options.componentSlot) {
          var componentSlot = options.componentSlot;
          var insertSlot_1 = function(slot, reference) {
            var $Walker = function(child) {
              var cloned = child.cloneNode(true);
              reference.parentNode.insertBefore(cloned, reference);
              walker(cloned, data);
            };
            if (slot.nodeName === 'SLOTCONTAINER' || slot.nodeName === 'SLOT')
              forEach(toArray(slot.childNodes), function(child) {
                return $Walker(child);
              });
            else
              $Walker(slot);
            reference.parentNode.removeChild(reference);
          };
          if (node.hasAttribute('default')) {
            if (componentSlot.childNodes.length == 0)
              return;
            // In case of default slot insertion
            return insertSlot_1(componentSlot, node);
          } else if (node.hasAttribute('name')) {
            // In case of target slot insertion
            var target_1 = node.attributes.getNamedItem('name');
            return (function $Walker(element) {
              var slotValue = element.getAttribute(Constants.slot);
              if (slotValue && slotValue === target_1.value) {
                element.removeAttribute(Constants.slot);
                return insertSlot_1(element, node);
              }
              if (element.children.length === 0)
                return null;
              forEach(toArray(element.children), function(child) {
                $Walker(child);
              });
            })(componentSlot);
          }
        }
        // e-def="{...}" directive
        if (Constants.def in node.attributes)
          directive.def(findDirective(node, Constants.def), data);
        // e-entry="..." directive
        if (Constants.entry in node.attributes)
          directive.entry(findDirective(node, Constants.entry), data);
        // wait-data="..." directive
        if (Constants.wait in node.attributes)
          return directive.wait(findDirective(node, Constants.wait));
        // e-for="..." directive
        if (Constants.for in node.attributes)
          return directive.for(findDirective(node, Constants.for), data);
        // <component></component>
        if (_this.component.check(node.localName))
          return _this.component.order(node, data);
        // e-if="..." directive
        if (Constants.if in node.attributes)
          return directive.if(findDirective(node, Constants.if), data);
        // e-else-if="..." or e-else directive
        if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
          Logger.warn('The “' + Constants.elseif + '” or “' + Constants.else +
            '” requires an element with “' + Constants.if+'” above.');
        // e-show="..." directive
        if (Constants.show in node.attributes)
          directive.show(findDirective(node, Constants.show), data);
        // e-req="..." | e-req:[id]="..."  directive
        var reqNode = null;
        if ((reqNode = findDirective(node, Constants.req)))
          return directive.req(reqNode, data);
        // data="..." | data:[id]="..." directive
        var dataNode = null;
        if (dataNode = findDirective(node, Constants.data))
          return directive.data(dataNode, data);
        // put="..." directive
        if (Constants.put in node.attributes)
          return directive.put(findDirective(node, Constants.put), data);
        // route-view node
        if (routing.routeView === node)
          return;
        // Looping the attributes
        forEach(toArray(node.attributes), function(attr) {
          walker(attr, data);
        });
      }
      // :href="..." or !href="..." directive
      if (Constants.check(node, Constants.href))
        return directive.href(node, data);
      // e-text="..." directive
      if (Constants.check(node, Constants.text))
        return directive.text(node);
      // e-bind:[?]="..." directive
      if (Constants.check(node, Constants.bind))
        return directive.bind(node, data);
      // Custom directive
      if (Object.keys(directive.$custom).find(function(name) {
          return Constants.check(node, name);
        }))
        if (directive.custom(node, data))
          return;
      // e-[?]="..." directive
      if (Constants.check(node, Constants.property) && !Constants.isConstant(node.nodeName))
        directive.property(node, data);
      // e-skeleton directive
      if (Constants.check(node, Constants.skeleton))
        directive.skeleton(node);
      // Event handler
      // on:[?]="..." directive
      if (Constants.check(node, Constants.on))
        return _this.eventHandler.compile(node, data, context);
      // ShortHand directive: {title}
      var delimiterField;
      if ((delimiterField = _this.delimiter.shorthand(node.nodeName))) {
        var element = (node.ownerElement || node.parentNode);
        var attr = DOM.createAttribute('e-' + delimiterField.expression);
        attr.value = '{{ ' + delimiterField.expression + ' }}';
        element.attributes.setNamedItem(attr);
        element.attributes.removeNamedItem(delimiterField.field);
        return _this.binder.create({
          node: attr,
          isConnected: isConnected,
          fields: [{
            expression: delimiterField.expression,
            field: attr.value
          }],
          context: context,
          data: data
        });
      }
      // Property binding
      var delimitersFields;
      if (isString(node.nodeValue) && (delimitersFields = _this.delimiter.run(node.nodeValue)) &&
        delimitersFields.length !== 0) {
        _this.binder.create({
          node: node,
          isConnected: isConnected,
          fields: delimitersFields,
          context: context,
          data: data
        });
      }
      forEach(toArray(node.childNodes), function(childNode) {
        return walker(childNode, data);
      });
    };
    walker(rootElement, data);
    if (rootElement.hasAttribute && rootElement.hasAttribute(Constants.silent))
      rootElement.removeAttribute(Constants.silent);
    if (isFunction(options.onDone)) {
      fnCall(options.onDone.call(context, rootElement));
    }
    this.eventHandler.emit({
      eventName: Constants.builtInEvents.compile,
      attachedNode: rootElement,
      once: true,
      init: {
        detail: data
      }
    });
    return rootElement;
  };
  Compiler.prototype.analize = function(htmlSnippet) {
    var tagRegexRule = '<([a-z0-9-_]{1,}|/[a-z0-9-_]{1,})((.|\n|\r)*?)>';
    // Removing unnecessary verification
    var htmlForParser = htmlSnippet
      .replace(/<script((.|\n|\r)*?)<\/script>/gm, '<script></script>')
      .replace(/<style((.|\n|\r)*?)<\/style>/gm, '<style></style>')
      .replace(/<pre((.|\n|\r)*?)<\/pre>/gm, '<pre></pre>')
      .replace(/<code((.|\n|\r)*?)<\/code>/gm, '<code></code>')
      .replace(/<svg((.|\n|\r)*?)<\/svg>/gm, '<svg></svg>')
      .replace(/<!--((.|\n|\r)*?)-->/gm, '')
      .replace(/&nbsp;/g, '&#160;');
    var indentChar = '  ';
    var history = [];
    var tagsTree = [];
    var indentNumber = 0;
    var message = '';
    var isValid = true;
    // Getting the tags
    var tagElements = htmlForParser.match(new RegExp(tagRegexRule, 'ig')) || [];
    var selfCloseTags = new Set([
            'area', 'base', 'br', 'col', 'embed',
            'hr', 'img', 'input', 'link', 'meta',
            'param', 'source', 'track', 'wbr'
        ]);
    for (var i = 0; i < tagElements.length; i++) {
      var tagElement = tagElements[i];
      var match = tagElement.match(new RegExp(tagRegexRule, 'i'));
      var tagName = toLower(match[1]);
      var isClosing = tagElement[1] === '/';
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
        var closingTag = tagsTree.pop();
        var openningTag = tagsTree.pop();
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
        }
        continue;
      }
    }
    if (!isValid) {
      Logger.error(message +
        history.map(function(h, i) {
          return (i + 1) + '.' + Array(h.ident).fill(indentChar).join('') + h.tag;
        }).join('\n'));
    }
    return isValid;
  };
  return Compiler;
}());
var UriHandler = /** @class */ (function() {
  function UriHandler(url) {
    this._IRT_ = true;
    this.url = url || DOM.location.href;
  }
  UriHandler.prototype.params = function(urlPattern) {
    var mParams = {};
    if (urlPattern && isString(urlPattern)) {
      var urlWithQueryParamsIgnored = this.url.split('?')[0];
      var urlPartsReversed_1 = urlWithQueryParamsIgnored.split('/').reverse();
      if (urlPartsReversed_1[0] === '')
        urlPartsReversed_1.shift();
      var urlPatternReversed = urlPattern.split('/').reverse();
      forEach(urlPatternReversed, function(value, index) {
        var valueExec = RegExp('{([\\S\\s]*?)}', 'ig').exec(value);
        if (Array.isArray(valueExec))
          mParams[valueExec[1]] = urlPartsReversed_1[index];
      });
    }
    // Building from query string
    var queryStr = this.url.split('?')[1];
    if (!queryStr)
      return this;
    var keys = queryStr.split('&');
    forEach(keys, function(key) {
      var pair = key.split('=');
      mParams[pair[0]] = (pair[1] || '').split('#')[0];
    });
    return mParams;
  };
  UriHandler.prototype.add = function(params) {
    var mParams = [];
    forEach(Object.keys(params), function(key) {
      mParams.push(key + '=' + params[key]);
    });
    var joined = mParams.join('&');
    return (this.url.includes('?')) ? '&' + joined : '?' + joined;
  };
  UriHandler.prototype.remove = function(param) {
    return param;
  };
  return UriHandler;
}());
var Component = /** @class */ (function() {
  /**
   * Default constructor
   * @param {string|object} optionsOrPath the path of the component or the compponent options
   */
  function Component(optionsOrPath) {
    this._IRT_ = true;
    /** Indicates if the component is destroyed or not */
    this.isDestroyed = false;
    this.children = [];
    /** All the assets attached to the component */
    this.assets = [];
    /** Store temporarily this component UI orders */
    this.events = [];
    var _name = undefined;
    var _path = undefined;
    var _data = undefined;
    if (!isString(optionsOrPath)) {
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
    var template = {
      value: optionsOrPath.template
    };
    Prop.set(this, 'template', {
      get: function() {
        return template.value;
      },
      set: function(v) {
        return template.value = v;
      }
    });
  }
  /**
   * The data that should be exported from the `<script>` tag to the root element
   * @param {object} data the data to export
   */
  Component.prototype.export = function(data) {
    var _this = this;
    if (!isObject(data))
      return Logger.log('Invalid object for component.export(...), only "Object Literal" is allowed.');
    return forEach(Object.keys(data), function(key) {
      _this.data[key] = data[key];
      Prop.transfer(_this.data, data, key);
    });
  };
  /**
   * Destroys the component
   */
  Component.prototype.destroy = function() {
    var _this = this;
    if (!this.el)
      return false;
    if (this.isDestroyed && this.bouer && this.bouer.isDestroyed)
      return;
    if (!this.keepAlive)
      this.isDestroyed = true;
    this.emit('beforeDestroy');
    var container = this.el.parentElement;
    if (container)
      container.removeChild(this.el);
    this.emit('destroyed');
    // Destroying all the events attached to the this instance
    forEach(this.events, function(evt) {
      return _this.off(evt.eventName, evt.callback);
    });
    this.events = [];
    var components = IoC.app(this.bouer).resolve(ComponentHandler)
      .activeComponents;
    components.splice(components.indexOf(this), 1);
  };
  /**
   * Maps the parameters of the route in the component `route` and returns as an object
   */
  Component.prototype.params = function() {
    return new UriHandler().params(this.route);
  };
  /**
   * Dispatch an event
   * @param {string} eventName the event name
   * @param {object?} init the CustomEventInit object where we can provid the event detail
   */
  Component.prototype.emit = function(eventName, init) {
    IoC.app(this.bouer).resolve(EventHandler).emit({
      eventName: eventName,
      attachedNode: this.el,
      init: init
    });
  };
  /**
   * Add an Event listener to the component
   * @param {string} eventName the event to be added
   * @param {Function} callback the callback function of the event
   */
  Component.prototype.on = function(eventName, callback) {
    var instanceHooksSet = new Set([
            'created', 'beforeMount', 'mounted', 'beforeLoad', 'loaded', 'beforeDestroy', 'destroyed'
        ]);
    var registerHooksSet = new Set([
            'requested', 'blocked', 'failed'
        ]);
    if (registerHooksSet.has(eventName))
      Logger.warn('The “' + eventName + '” Event is called before the component is mounted, to be dispatched' +
        'it needs to be on registration object: { ' + eventName + ': function(){ ... }, ... }.');
    var evt = IoC.app(this.bouer).resolve(EventHandler).on({
      eventName: eventName,
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
  };
  /**
   * Removes an Event listener to the component
   * @param {string} eventName the event to be added
   * @param {Function} callback the callback function of the event
   */
  Component.prototype.off = function(eventName, callback) {
    IoC.app(this.bouer).resolve(EventHandler).off({
      eventName: eventName,
      callback: callback,
      attachedNode: this.el
    });
    this.events = where(this.events, function(evt) {
      return !(evt.eventName == eventName && evt.callback == callback);
    });
  };
  /**
   * Adds assets to the component
   * @param {string|object} assets the list of assets to be included
   */
  Component.prototype.addAssets = function(assets) {
    var $Assets = [];
    var assetsTypeMapper = {
      js: 'script',
      css: 'link',
      scss: 'link',
      sass: 'link',
      less: 'link',
      styl: 'link',
      style: 'link',
    };
    var isValidAssetSrc = function(src, index) {
      var isValid = (src || trim(src)) ? true : false;
      if (!isValid)
        Logger.error('Invalid asset “src”, in assets[' + index + '].src');
      return isValid;
    };
    var assetTypeGetter = function(src, index) {
      var srcSplitted = src.split('.');
      var type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];
      if (!type)
        return Logger.error('Couldn\'t find out what type of asset it is, provide ' +
          'the “type” explicitly at assets[' + index + '].type');
      return type;
    };
    forEach(assets, function(asset, index) {
      var src = '';
      var type = '';
      var scoped = true;
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
      if ((src[0] !== '.')) { // The src begins with dot (.)
        var resolver = urlResolver(src);
        var hasBaseURIInURL = resolver.baseURI === src.substring(0, resolver.baseURI.length);
        // Building the URL according to the main path
        src = urlCombine(hasBaseURIInURL ? resolver.origin : resolver.baseURI, resolver.pathname);
      }
      var $Asset = createAnyEl(type, function(el) {
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
    this.assets.push.apply(this.assets, $Assets);
  };
  /**
   * Sets data into a target object, by default is the `component.data`
   * @param {object} inputData the data the should be setted
   * @param {object?} targetObject the target were the inputData
   * @returns the object with the data setted
   */
  Component.prototype.set = function(inputData, targetObject) {
    var _this = this;
    var result = setData(this, inputData, targetObject);
    forEach(Object.keys(inputData), function(key) {
      return Prop.transfer(_this, inputData, key);
    });
    return result;
  };
  return Component;
}());
var ComponentHandler = /** @class */ (function() {
  function ComponentHandler(bouer) {
    this._IRT_ = true;
    // Handle all the components web requests to avoid multiple requests
    this.requests = {};
    this.components = {};
    // Avoids adding multiple styles of the same component if it's already in use
    this.stylesController = {};
    this.activeComponents = [];
    this.bouer = bouer;
    this.delimiter = IoC.app(bouer).resolve(DelimiterHandler);
    this.eventHandler = IoC.app(bouer).resolve(EventHandler);
    this.evaluator = IoC.app(bouer).resolve(Evaluator);
  }
  ComponentHandler.prototype.check = function(nodeName) {
    return (nodeName in this.components);
  };
  ComponentHandler.prototype.request = function(path, response) {
    var _this = this;
    if (!isNull(this.requests[path]))
      return this.requests[path].push(response);
    this.requests[path] = [response];
    var resolver = urlResolver(path);
    var hasBaseElement = DOM.head.querySelector('base') != null;
    var hasBaseURIInURL = resolver.baseURI === path.substring(0, resolver.baseURI.length);
    // Building the URL according to the main path
    var componentPath = urlCombine(hasBaseURIInURL ? resolver.origin : resolver.baseURI, resolver.pathname);
    webRequest(componentPath, {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
      .then(function(response) {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.text();
      })
      .then(function(content) {
        forEach(_this.requests[path], function(request) {
          request.success(content, path);
        });
        delete _this.requests[path];
      })
      .catch(function(error) {
        if (!hasBaseElement)
          Logger.warn('It seems like you are not using the “<base href="/base/components/path/" />” ' +
            'element, try to add as the first child into “<head></head>” element.');
        forEach(_this.requests[path], function(request) {
          return request.fail(error, path);
        });
        delete _this.requests[path];
      });
  };
  ComponentHandler.prototype.prepare = function(components, parent) {
    var _this = this;
    forEach(components, function(entry, index) {
      var isComponentClass = (entry.prototype instanceof Component);
      var component = entry;
      if (isComponentClass) {
        // Resolve the instance of the class
        component = IoC.app(_this.bouer).resolve(entry) || IoC.new(entry);
        component.clazz = entry;
      }
      if ((!component.path || isNull(component.path)) && (!component.template || isNull(component.template)))
        return Logger.warn('The component at options.components[' + index + '] has not valid “path” or “template” ' +
          'property defined, ' + 'then it was ignored.');
      if ((isNull(component.name) || !component.name)) {
        if (!component.path || isNull(component.path))
          return Logger.warn('Provide a “name” to component at options.components[' + index + '] position.');
        var pathSplitted = component.path.toLowerCase().split('/');
        var componentName = pathSplitted[pathSplitted.length - 1].replace('.html', '');
        // If the component name already exists generate a new one
        if (_this.components[componentName]) {
          componentName = toLower(code(8, componentName + '-component-'));
        }
        component.name = componentName;
      }
      component.name = component.name.toLowerCase();
      var parentRoute = '';
      if (_this.components[component.name])
        return Logger.warn('The component name “' + component.name + '” is already define, try changing the name.');
      if (!isNull(parent)) {
        /** TODO: Inherit the parent info */
        parentRoute = parent.route || '';
      }
      if (!isNull(component.route)) { // Completing the route
        component.route = '/' + urlCombine(parentRoute, component.route);
      }
      if (Array.isArray(component.children))
        _this.prepare(component.children, component);
      IoC.app(_this.bouer).resolve(Routing)
        .configure(_this.components[component.name] = component);
      var getContent = function(path) {
        if (!path)
          return;
        _this.request(component.path, {
          success: function(content) {
            component.template = content;
          },
          fail: function(error) {
            Logger.error(buildError(error));
          }
        });
      };
      if (!isNull(component.prefetch)) {
        if (component.prefetch === true)
          return getContent(component.path);
        return;
      }
      if (!(component.prefetch = ifNullReturn(_this.bouer.config.prefetch, true)))
        return;
      return getContent(component.path);
    });
  };
  ComponentHandler.prototype.order = function(componentElement, data, onComponent) {
    var _this = this;
    var $name = toLower(componentElement.nodeName);
    var component = this.components[$name];
    if (!component)
      return Logger.error('No component with name “' + $name + '” registered.');
    var mainExecutionWrapper = function() {
      var resolveComponentInstance = function(c) {
        var mCom;
        if ((c instanceof Component) && c.clazz)
          mCom = IoC.app(_this.bouer).resolve(c.clazz) || IoC.new(c.clazz);
        else if (c instanceof Component)
          mCom = copyObject(c);
        else
          mCom = new Component(c);
        if (mCom.keepAlive === true)
          _this.components[$name] = mCom;
        mCom.template = c.template;
        mCom.bouer = _this.bouer;
        return mCom;
      };
      if (component.template)
        return _this.insert(componentElement, resolveComponentInstance(component), data, onComponent);
      if (!component.path)
        return Logger.error('Expected a valid value in `path` or `template` got invalid value at “' +
          $name + '” component.');
      _this.addEvent('requested', componentElement, component, _this.bouer)
        .emit();
      // Make component request or Add
      _this.request(component.path, {
        success: function(content) {
          component.template = content;
          _this.insert(componentElement, resolveComponentInstance(component), data, onComponent);
        },
        fail: function(error) {
          Logger.error('Failed to request <' + $name + '/> component with path “' +
            component.path + '”.');
          Logger.error(buildError(error));
          _this.addEvent('failed', componentElement, component, _this.bouer).emit();
        }
      });
    };
    // Checking the restrictions
    if (component.restrictions && component.restrictions.length > 0) {
      var blockedRestrictions_1 = [];
      var restrictions = component.restrictions.map(function(restriction) {
        var restrictionResult = restriction.call(_this.bouer, component);
        if (restrictionResult === false)
          blockedRestrictions_1.push(restriction);
        else if (restrictionResult instanceof Promise)
          restrictionResult
          .then(function(value) {
            if (value === false)
              blockedRestrictions_1.push(restriction);
          })
          .catch(function() {
            return blockedRestrictions_1.push(restriction);
          });
        return restrictionResult;
      });
      var blockedEvent_1 = this.addEvent('blocked', componentElement, component, this.bouer);
      var emitter_1 = function() {
        return blockedEvent_1.emit({
          detail: {
            component: component.name,
            message: 'Component “' + component.name + '” blocked by restriction(s)',
            blocks: blockedRestrictions_1
          }
        });
      };
      return Promise.all(restrictions)
        .then(function(restrictionValues) {
          if (restrictionValues.every(function(value) {
              return value == true;
            }))
            mainExecutionWrapper();
          else
            emitter_1();
        })
        .catch(function() {
          return emitter_1();
        });
    }
    return mainExecutionWrapper();
  };
  ComponentHandler.prototype.find = function(predicate) {
    var keys = Object.keys(this.components);
    for (var i = 0; i < keys.length; i++) {
      var component = this.components[keys[i]];
      if (predicate(component))
        return component;
    }
    return null;
  };
  /**
   * Subscribe the hooks of the instance
   * @param { Key } eventName the event name to be added
   * @param { Element } element the element to attach the event
   * @param { any } component the component object
   * @param { object } context the context of the compilation process
   */
  ComponentHandler.prototype.addEvent = function(eventName, element, component, context) {
    var _this = this;
    var callback = component[eventName];
    if (typeof callback === 'function')
      this.eventHandler.on({
        eventName: eventName,
        callback: function(evt) {
          return callback.call(context || component, evt);
        },
        attachedNode: element,
        modifiers: {
          once: true
        },
        context: context || component
      });
    var emitter = function(init) {
      _this.eventHandler.emit({
        attachedNode: element,
        once: true,
        eventName: eventName,
        init: init
      });
      _this.eventHandler.emit({
        eventName: 'component:' + eventName,
        init: {
          detail: {
            component: component
          }
        },
        once: true
      });
    };
    return {
      emit: function(init) {
        return emitter(init);
      }
    };
  };
  ComponentHandler.prototype.insert = function(componentElement, component, data, onComponent) {
    var _this = this;
    var $name = toLower(componentElement.nodeName);
    var container = componentElement.parentElement;
    var compiler = IoC.app(this.bouer).resolve(Compiler);
    if (!container)
      return;
    if (isNull(component.template))
      return Logger.error('The <' + $name + '/> component is not ready yet to be inserted.');
    if (!compiler.analize(component.template))
      return;
    // Adding the component to the active component list if it is not added
    if (!this.activeComponents.includes(component))
      this.activeComponents.push(component);
    var elementSlots = createAnyEl('SlotContainer', function(el) {
      el.innerHTML = componentElement.innerHTML;
      componentElement.innerHTML = '';
    }).build();
    var isKeepAlive = componentElement.hasAttribute('keep-alive') || ifNullReturn(component.keepAlive, false);
    // Component Creation
    if (isKeepAlive === false || isNull(component.el)) {
      createEl('body', function(htmlSnippet) {
        htmlSnippet.innerHTML = component.template;
        forEach([].slice.call(htmlSnippet.children), function(asset) {
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
    var rootElement = component.el;
    if (isNull(rootElement))
      return;
    // Transforming all unknown variables to reactive
    var unknownVars = where(Object.keys(component), function(key) {
      return !(key in component);
    });
    if (unknownVars.length > 0)
      Reactive.transform({
        context: component,
        data: component,
        keys: unknownVars
      });
    // Adding the listeners
    var createdEvent = this.addEvent('created', rootElement, component);
    var beforeMountEvent = this.addEvent('beforeMount', rootElement, component);
    var mountedEvent = this.addEvent('mounted', rootElement, component);
    var beforeLoadEvent = this.addEvent('beforeLoad', rootElement, component);
    var loadedEvent = this.addEvent('loaded', rootElement, component);
    this.addEvent('beforeDestroy', rootElement, component);
    this.addEvent('destroyed', rootElement, component);
    var scriptsAssets = where(component.assets, function(asset) {
      return asset.nodeName === 'SCRIPT';
    });
    var initializer = component.init;
    if (isFunction(initializer))
      fnCall(initializer.call(component));
    var processDataAttr = function(attr) {
      var inputData = {};
      var mData = Extend.obj(data, {
        $data: data
      });
      // Listening to all the reactive properties
      var reactiveEvent = ReactiveEvent.on('AfterGet', function(descriptor) {
        if (!(descriptor.propName in inputData))
          inputData[descriptor.propName] = undefined;
        Prop.set(inputData, descriptor.propName, descriptor);
      });
      // If data value is empty gets the main scope value
      if (attr.value === '')
        inputData = Extend.obj(_this.bouer.data);
      else {
        // Otherwise, compiles the object provided
        var mInputData_1 = IoC.app(_this.bouer).resolve(Evaluator)
          .exec({
            data: mData,
            code: attr.value,
            context: _this.bouer
          });
        if (!isObject(mInputData_1))
          Logger.error('Expected a valid Object Literal expression in “' + attr.nodeName +
            '” and got “' + attr.value + '”.');
        else {
          // Adding all non-existing properties
          forEach(Object.keys(mInputData_1), function(key) {
            if (!(key in inputData))
              inputData[key] = mInputData_1[key];
          });
        }
      }
      reactiveEvent.off();
      inputData = Reactive.transform({
        context: component,
        data: inputData
      });
      forEach(Object.keys(inputData), function(key) {
        Prop.transfer(component.data, inputData, key);
      });
    };
    var compile = function(scriptContent) {
      try {
        // Injecting data
        // If the component has does not have the data directive assigned, create it implicitly
        if (!(findDirective(componentElement, Constants.data)))
          componentElement.setAttribute('data', '$data');
        var dataAttr = null;
        // If the attr is `data`, prepare and inject the value into component `data`
        if (dataAttr = findDirective(componentElement, Constants.data)) {
          var attr = dataAttr;
          if (_this.delimiter.run(attr.value).length !== 0) {
            Logger.error(('The “data” attribute cannot contain delimiter, source element: ' +
              '<' + $name + '/>.'));
          } else {
            processDataAttr(attr);
          }
          componentElement.removeAttribute(attr.name);
        }
        // Executing the mixed scripts
        IoC.app(_this.bouer).resolve(Evaluator)
          .execRaw((scriptContent || ''), component);
        createdEvent.emit();
        // tranfering the attributes
        forEach(toArray(componentElement.attributes), function(attr) {
          componentElement.removeAttribute(attr.name);
          // if the attr is the class, transfer the items to the root element
          if (attr.nodeName === 'class')
            return componentElement.classList.forEach(function(cls) {
              rootElement.classList.add(cls);
            });
          // sets the attr to the root element
          rootElement.attributes.setNamedItem(attr);
        });
        beforeMountEvent.emit();
        // Attaching the root element to the component element
        if (!('root' in componentElement))
          Prop.set(componentElement, 'root', {
            value: rootElement
          });
        // Mouting the element
        container.replaceChild(rootElement, componentElement);
        mountedEvent.emit();
        var rootClassList_1 = {};
        // Retrieving all the classes of the root element
        rootElement.classList.forEach(function(key) {
          return rootClassList_1[key] = true;
        });
        // Changing each selector to avoid conflits
        var changeSelector_1 = function(style, styleId) {
          var rules = [];
          var isStyle = (style.nodeName === 'STYLE');
          if (!style.sheet)
            return;
          var cssRules = style.sheet.cssRules;
          for (var i = 0; i < cssRules.length; i++) {
            var rule = cssRules.item(i);
            if (!rule)
              continue;
            var mRule = rule;
            var ruleText = mRule.selectorText;
            if (ruleText) {
              var firstRule = ruleText.split(' ')[0];
              var selector = (firstRule[0] == '.' || firstRule[0] == '#') ?
                firstRule.substring(1) : firstRule;
              var separator = rootClassList_1[selector] ? '' : ' ';
              var uniqueIdentifier = '.' + styleId;
              var selectorTextSplitted = mRule.selectorText.split(' ');
              if (selectorTextSplitted[0] === toLower(rootElement.tagName))
                selectorTextSplitted.shift();
              mRule.selectorText = uniqueIdentifier + separator + selectorTextSplitted.join(' ');
            }
            // Adds the cssText only if the element is <style>
            if (isStyle)
              rules.push(mRule.cssText);
          }
          if (isStyle)
            style.innerText = rules.join(' ');
        };
        var stylesAssets = where(component.assets, function(asset) {
          return asset.nodeName !== 'SCRIPT';
        });
        var styleAttrName_1 = 'component-style';
        // Configuring the styles
        forEach(stylesAssets, function(asset) {
          var mStyle = asset.cloneNode(true);
          if (mStyle instanceof HTMLLinkElement) {
            var path = component.path[0] === '/' ? component.path.substring(1) : component.path;
            mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
            mStyle.rel = 'stylesheet';
          }
          // Checking if this component already have styles added
          if (_this.stylesController[$name]) {
            var controller = _this.stylesController[$name];
            if (controller.elements.indexOf(rootElement) > -1)
              return;
            controller.elements.push(rootElement);
            return forEach(controller.styles, function($style) {
              rootElement.classList.add($style.getAttribute(styleAttrName_1));
            });
          }
          var styleId = code(7, 'bouer-s');
          mStyle.setAttribute(styleAttrName_1, styleId);
          if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
            mStyle.onload = function(evt) {
              return changeSelector_1(evt.target, styleId);
            };
          _this.stylesController[$name] = {
            styles: [DOM.head.appendChild(mStyle)],
            elements: [rootElement]
          };
          if (!mStyle.hasAttribute('scoped'))
            return;
          rootElement.classList.add(styleId);
          if (mStyle instanceof HTMLStyleElement)
            return changeSelector_1(mStyle, styleId);
        });
        beforeLoadEvent.emit();
        // Compiling the rootElement
        compiler.compile({
          data: Reactive.transform({
            context: component,
            data: component.data
          }),
          onDone: function() {
            if (isFunction(onComponent))
              onComponent(component);
            loadedEvent.emit();
          },
          componentSlot: elementSlots,
          context: component,
          el: rootElement,
        });
        var autoComponentDestroy = ifNullReturn(_this.bouer.config.autoComponentDestroy, true);
        if (autoComponentDestroy === false)
          return;
        // Listening the component to be destroyed
        Task.run(function(stopTask) {
          if (component.el.isConnected)
            return;
          if (_this.bouer.isDestroyed)
            return stopTask();
          component.destroy();
          stopTask();
          var stylesController = _this.stylesController[component.name];
          if (!stylesController)
            return;
          var index = stylesController.elements.indexOf(component.el);
          stylesController.elements.splice(index, 1);
          if (stylesController.elements.length > 0 || container.isConnected)
            return;
          // No elements using the style
          forEach(stylesController.styles, function(style) {
            return forEach(toArray(DOM.head.children), function(item) {
              if (item === style)
                return DOM.head.removeChild(style);
            });
          });
          delete _this.stylesController[component.name];
        });
      } catch (error) {
        Logger.error('Error in <' + $name + '/> component.');
        Logger.error(buildError(error));
      }
    };
    if (scriptsAssets.length === 0)
      return compile();
    var localScriptsContent = [];
    var onlineScriptsContent = [];
    var onlineScriptsUrls = [];
    var webRequestChecker = {};
    // Grouping the online scripts and collecting the online url
    forEach(scriptsAssets, function(script) {
      if (script.src == '' || script.innerHTML)
        localScriptsContent.push(script.innerHTML);
      else {
        var path = component.path[0] === '/' ? component.path.substring(1) : component.path;
        script.src = pathResolver(path, script.getAttribute('src') || '');
        onlineScriptsUrls.push(script.src);
      }
    });
    // No online scripts detected
    if (onlineScriptsUrls.length == 0)
      return compile(localScriptsContent.join('\n\n'));
    // Load the online scripts and run it
    return forEach(onlineScriptsUrls, function(url, index) {
      webRequestChecker[url] = true;
      // Getting script content from a web request
      webRequest(url, {
        headers: {
          'Content-Type': 'text/plain'
        }
      }).then(function(response) {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.text();
      }).then(function(text) {
        delete webRequestChecker[url];
        // Adding the scripts according to the defined order
        onlineScriptsContent[index] = text;
        // if there are not web requests compile the element
        if (Object.keys(webRequestChecker).length === 0)
          return compile(Extend.array(onlineScriptsContent, localScriptsContent).join('\n\n'));
      }).catch(function(error) {
        error.stack = '';
        Logger.error(('Error loading the <script src=\'' + url + '\'></script> in ' +
          '<' + $name + '/> component, remove it in order to be compiled.'));
        Logger.log(error);
      });
    });
  };
  return ComponentHandler;
}());
var ViewChild = /** @class */ (function() {
  function ViewChild() {}
  /**
   * Retrieves the actives components matching the a provided expression
   * @param {Bouer} bouer the app instance
   * @param {Function} expression the expression function to match the required component
   * @returns a list of components matching the expression
   */
  ViewChild.by = function(bouer, expression) {
    // Retrieving the active component
    var activeComponents = IoC.app(bouer).resolve(ComponentHandler)
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, expression);
  };
  /**
   * Retrieves the active component matching the component element or the root element id
   * @param {Bouer} bouer the app instance
   * @param {string} id the id o the component
   * @returns The Component or null
   */
  ViewChild.byId = function(bouer, id) {
    // Retrieving the active component
    var activeComponents = IoC.app(bouer).resolve(ComponentHandler)
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, function(c) {
      return (c.el && getRootElement(c.el).id == id);
    })[0];
  };
  /**
   * Retrieves the actives components matching the component name
   * @param {Bouer} bouer the app instance
   * @param {string} name the component name
   * @returns a list of components matching the name
   */
  ViewChild.byName = function(bouer, name) {
    // Retrieving the active component
    var activeComponents = IoC.app(bouer).resolve(ComponentHandler)
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, function(c) {
      return c.name.toLowerCase() == (name || '').toLowerCase();
    });
  };
  return ViewChild;
}());
var Bouer = /** @class */ (function() {
  /**
   * Default constructor
   * @param {string} selector the selector of the element to be controlled by the instance
   * @param {object?} options the options to the instance
   */
  function Bouer(selector, options) {
    var _this_1 = this;
    /** The name of the instance */
    this._IRT_ = true;
    this.name = 'Bouer';
    this.version = '3.1.0';
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
    var app = this;
    this.options = options = (options || {});
    this.config = options.config || {};
    this.deps = options.deps || {};
    forEach(Object.keys(this.deps), function(key) {
      var deps = _this_1.deps;
      var value = deps[key];
      deps[key] = typeof value === 'function' ? value.bind(_this_1) : value;
    });
    var delimiters = options.delimiters || [];
    // Adding Dependency Injection Services
    IoC.app(this).add(DataStore, [this], true);
    IoC.app(this).add(Evaluator, [this], true);
    IoC.app(this).add(Middleware, [this], true);
    IoC.app(this).add(Binder, [this], true);
    IoC.app(this).add(EventHandler, [this], true);
    IoC.app(this).add(ComponentHandler, [this], true);
    IoC.app(this).add(Skeleton, [this], true);
    IoC.app(this).add(Routing, [this], true);
    IoC.app(this).add(DelimiterHandler, [this, delimiters], true);
    IoC.app(this).add(Compiler, [this, options.directives], true);
    var dataStore = IoC.app(this).resolve(DataStore);
    var middleware = IoC.app(this).resolve(Middleware);
    var componentHandler = IoC.app(this).resolve(ComponentHandler);
    var compiler = IoC.app(this).resolve(Compiler);
    var skeleton = IoC.app(this).resolve(Skeleton);
    var delimiter = IoC.app(this).resolve(DelimiterHandler);
    // Register the middleware
    if (typeof options.middleware === 'function')
      options.middleware.call(app, middleware.subscribe, app);
    // Transform the data properties into a reative
    this.data = Reactive.transform({
      data: options.data || {},
      context: app
    });
    this.globalData = Reactive.transform({
      data: options.globalData || {},
      context: app
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
      get: function() {
        return delimiter.delimiters.slice();
      }
    };
    this.$data = {
      get: function(key) {
        return key ? dataStore.data[key] : null;
      },
      set: function(key, data, toReactive) {
        if (key in dataStore.data)
          return Logger.log('There is already a data stored with this key “' + key + '”.');
        if (ifNullReturn(toReactive, false) === true)
          Reactive.transform({
            context: app,
            data: data
          });
        return IoC.app(_this_1).resolve(DataStore).set('data', key, data);
      },
      unset: function(key) {
        return delete dataStore.data[key];
      }
    };
    this.$req = {
      get: function(key) {
        return key ? dataStore.req[key] : undefined;
      },
      unset: function(key) {
        return delete dataStore.req[key];
      },
    };
    this.$wait = {
      get: function(key) {
        if (!key)
          return undefined;
        var waitedData = dataStore.wait[key];
        if (!waitedData)
          return undefined;
        if (ifNullReturn(waitedData.once, true))
          _this_1.$wait.unset(key);
        return waitedData.data;
      },
      set: function(key, data, once) {
        if (!(key in dataStore.wait))
          return dataStore.wait[key] = {
            data: data,
            nodes: [],
            once: ifNullReturn(once, false),
            context: app
          };
        var mWait = dataStore.wait[key];
        mWait.data = data;
        forEach(mWait.nodes, function(nodeWaiting) {
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
          _this_1.$wait.unset(key);
      },
      unset: function(key) {
        return delete dataStore.wait[key];
      },
    };
    this.$skeleton = {
      clear: function(id) {
        return skeleton.clear(id);
      },
      set: function(color) {
        return skeleton.init(color);
      }
    };
    this.$components = {
      add: function(component) {
        return componentHandler.prepare([component]);
      },
      get: function(name) {
        return componentHandler.components[name];
      },
      viewBy: function(expression) {
        return ViewChild.by(_this_1, expression);
      },
      viewByName: function(componentName) {
        return ViewChild.byName(_this_1, componentName);
      },
      viewById: function(componentId) {
        return ViewChild.byId(_this_1, componentId);
      },
    };
    Prop.set(this, 'refs', {
      get: function() {
        var mRefs = {};
        forEach(toArray(ifNullStop(_this_1.el).querySelectorAll('[' + Constants.ref + ']')), function(ref) {
          var mRef = ref.attributes[Constants.ref];
          var value = trim(mRef.value) || ref.name || '';
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
    componentHandler.prepare(options.components || []);
    if (!isNull(selector) && trim(selector) !== '')
      this.init(selector);
  }
  /**
   * Creates a factory instance of Bouer
   * @param {object?} options the options to the instance
   * @returns Bouer instance
   */
  Bouer.create = function(options) {
    options = (options || {});
    options.config = (options.config || {});
    (options.config || {}).autoUnbind = false;
    (options.config || {}).autoOffEvent = false;
    (options.config || {}).autoComponentDestroy = false;
    return new Bouer('', options);
  };
  /**
   * Compiles a `HTML snippet` to an `Object Literal`
   * @param {string} input the input element
   * @param {object?} options the options of the compilation
   * @param {Function?} onSet a function that should be fired when a value is setted
   * @returns the Object Compiled from the HTML
   */
  Bouer.toJsObj = function(input, options, onSet) {
    return htmlToJsObj(input, options, onSet);
  };
  /**
   * Initialize create application
   * @param {string} selector the selector of the element to be controlled by the instance
   */
  Bouer.prototype.init = function(selector) {
    var _this_1 = this;
    if (this.isInitialized)
      return this;
    if (isNull(selector) || trim(selector) === '')
      throw Logger.error(new Error('Invalid selector provided to the instance.'));
    var app = this;
    var el = DOM.querySelector(selector);
    if (!(this.el = el))
      throw Logger.error(new SyntaxError('Element with selector “' + selector + '” not found.'));
    var options = this.options || {};
    var binder = IoC.app(this).resolve(Binder);
    var eventHandler = IoC.app(this).resolve(EventHandler);
    var routing = IoC.app(this).resolve(Routing);
    var skeleton = IoC.app(this).resolve(Skeleton);
    var compiler = IoC.app(this).resolve(Compiler);
    forEach([options.beforeLoad, options.loaded, options.beforeDestroy, options.destroyed], function(evt) {
      if (typeof evt !== 'function')
        return;
      eventHandler.on({
        eventName: evt.name,
        callback: evt,
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
      onDone: function() {
        return eventHandler.emit({
          eventName: 'loaded',
          attachedNode: el
        });
      }
    });
    WIN.addEventListener('beforeunload', function() {
      if (_this_1.isDestroyed)
        return;
      eventHandler.emit({
        eventName: 'beforeDestroy',
        attachedNode: el
      });
      _this_1.destroy();
    }, {
      once: true
    });
    Task.run(function(stopTask) {
      if (_this_1.isDestroyed)
        return stopTask();
      if (el.isConnected)
        return;
      eventHandler.emit({
        eventName: 'beforeDestroy',
        attachedNode: el
      });
      _this_1.destroy();
      stopTask();
    });
    if (!DOM.head.querySelector('link[rel~="icon"]')) {
      createEl('link', function(favicon) {
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
      }).appendTo(DOM.head);
    }
    return this;
  };
  /**
   * Sets data into a target object, by default is the `bouer.data`
   * @param {object} inputData the data the should be setted
   * @param {object?} targetObject the target were the inputData
   * @returns the object with the data setted
   */
  Bouer.prototype.set = function(inputData, targetObject) {
    return setData(this, inputData, targetObject);
  };
  /**
   * Compiles a `HTML snippet` to an `Object Literal`
   * @param {string} input the input element
   * @param {object?} options the options of the compilation
   * @param {Function?} onSet a function that should be fired when a value is setted
   * @returns the Object Compiled from the HTML
   */
  Bouer.prototype.toJsObj = function(input, options, onSet) {
    return htmlToJsObj(input, options, onSet);
  };
  /**
   * Provides the possibility to watch a property change
   * @param {string} propertyName the property to watch
   * @param {Function} callback the function that should be called when the property change
   * @param {object} targetObject the target object having the property to watch
   * @returns the watch object having the method to destroy the watch
   */
  Bouer.prototype.watch = function(propertyName, callback, targetObject) {
    return IoC.app(this).resolve(Binder).onPropertyChange(propertyName, callback, (targetObject || this.data));
  };
  /**
   * Watch all reactive properties in the provided scope.
   * @param {Function} watchableScope the function that should be called when the any reactive property change
   * @returns an object having all the watches and the method to destroy watches at once
   */
  Bouer.prototype.react = function(watchableScope) {
    return IoC.app(this).resolve(Binder)
      .onPropertyInScopeChange(watchableScope);
  };
  /**
   * Add an Event Listener to the instance or to an object
   * @param {string} eventName the event name to be listening
   * @param {Function} callback the callback that should be fired
   * @param {Node} attachedNode A node to attach the event
   * @param {object} modifiers An object having all the event modifier
   * @returns The event added
   */
  Bouer.prototype.on = function(eventName, callback, options) {
    return IoC.app(this).resolve(EventHandler).
    on({
      eventName: eventName,
      callback: callback,
      attachedNode: (options || {}).attachedNode,
      modifiers: (options || {}).modifiers,
      context: this
    });
  };
  /**
   * Removes an Event Listener from the instance or from object
   * @param {string} eventName the event name to be listening
   * @param {Function} callback the callback that should be fired
   * @param {Node} attachedNode A node to attach the event
   */
  Bouer.prototype.off = function(eventName, callback, attachedNode) {
    return IoC.app(this).resolve(EventHandler).
    off({
      eventName: eventName,
      callback: callback,
      attachedNode: attachedNode
    });
  };
  /**
   * Removes the bind from an element
   * @param {Node} boundNode the node having the bind
   * @param {string} boundAttrName the bound attribute name
   * @param {string} boundPropName the bound property name
   */
  Bouer.prototype.unbind = function(boundNode, boundAttrName, boundPropName) {
    return IoC.app(this).resolve(Binder).
    remove(boundNode, boundPropName, boundAttrName);
  };
  /**
   * Dispatch an event
   * @param {string} eventName the event name
   * @param {object} options options for the emission
   */
  Bouer.prototype.emit = function(eventName, options) {
    var mOptions = (options || {});
    return IoC.app(this).resolve(EventHandler).emit({
      eventName: eventName,
      attachedNode: mOptions.element,
      init: mOptions.init,
      once: mOptions.once
    });
  };
  /**
   * Limits sequential execution to a single one acording to the milliseconds provided
   * @param {Function} callback the callback that should be performed the execution
   * @param {number} wait milliseconds to the be waited before the single execution
   * @returns executable function
   */
  Bouer.prototype.lazy = function(callback, wait) {
    var _this = this;
    var timeout;
    wait = isNull(wait) ? 500 : wait;
    var immediate = arguments[2];
    return function executable() {
      var args = [].slice.call(arguments);
      var callNow = immediate && !timeout;
      var later = function() {
        timeout = null;
        if (!immediate)
          callback.apply(_this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow)
        callback.apply(_this, args);
    };
  };
  /**
   * Compiles an html element
   * @param {string} options the options of the compilation process
   * @returns the element compiled
   */
  Bouer.prototype.compile = function(options) {
    return IoC.app(this).resolve(Compiler).
    compile({
      el: options.el,
      data: options.data,
      context: options.context || this,
      onDone: options.onDone
    });
  };
  /**
   * Destroys the application
   */
  Bouer.prototype.destroy = function() {
    var el = this.el;
    var $Events = IoC.app(this).resolve(EventHandler).$events;
    var destroyedEvents = ($Events['destroyed'] || []).concat(($Events['component:destroyed'] || []));
    this.emit('destroyed', {
      element: this.el
    });
    // Dispatching all the destroy events
    forEach(destroyedEvents, function(es) {
      return es.emit({
        once: true
      });
    });
    $Events['destroyed'] = [];
    $Events['component:destroyed'] = [];
    if (el.tagName == 'BODY')
      el.innerHTML = '';
    else if (DOM.contains(el))
      el.parentElement.removeChild(el);
    this.isDestroyed = true;
    this.isInitialized = false;
    IoC.app(this).clear();
  };
  return Bouer;
}());
exports.Compiler = Compiler;
exports.Component = Component;
exports.DOM = DOM;
exports.Extend = Extend;
exports.IoC = IoC;
exports.Prop = Prop;
exports.Reactive = Reactive;
exports.Routing = Routing;
exports.ViewChild = ViewChild;
exports.WIN = WIN;
exports.Watch = Watch;
exports.anchor = anchor;
exports.buildError = buildError;
exports.code = code;
exports.copyObject = copyObject;
exports.createAnyEl = createAnyEl;
exports.createComment = createComment;
exports.createEl = createEl;
exports["default"] = Bouer;
exports.findAttribute = findAttribute;
exports.findDirective = findDirective;
exports.fnCall = fnCall;
exports.fnEmpty = fnEmpty;
exports.forEach = forEach;
exports.getRootElement = getRootElement;
exports.htmlToJsObj = htmlToJsObj;
exports.ifNullReturn = ifNullReturn;
exports.ifNullStop = ifNullStop;
exports.isEmptyObject = isEmptyObject;
exports.isFilledObj = isFilledObj;
exports.isFunction = isFunction;
exports.isNull = isNull;
exports.isObject = isObject;
exports.isPrimitive = isPrimitive;
exports.isString = isString;
exports.mapper = mapper;
exports.pathResolver = pathResolver;
exports.removeEl = removeEl;
exports.setData = setData;
exports.startWith = startWith;
exports.toArray = toArray;
exports.toLower = toLower;
exports.toStr = toStr;
exports.trim = trim;
exports.urlCombine = urlCombine;
exports.urlResolver = urlResolver;
exports.webRequest = webRequest;
exports.where = where;