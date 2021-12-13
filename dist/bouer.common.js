/*!
 * Bouer.js v3.0.0
 * Copyright Easy.js 2018-2020 | 2021-2021 Afonso Matumona
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// Quotes “"+  +"”
function webRequest(url, options) {
    if (!url)
        return Promise.reject(new Error("Invalid Url"));
    var createXhr = function (method) {
        if (DOM.documentMode && (!method.match(/^(get|post)$/i) || !GLOBAL.XMLHttpRequest)) {
            return new GLOBAL.ActiveXObject("Microsoft.XMLHTTP");
        }
        else if (GLOBAL.XMLHttpRequest) {
            return new GLOBAL.XMLHttpRequest();
        }
        throw new Error("This browser does not support XMLHttpRequest.");
    };
    var getOption = function (key, mDefault) {
        var initAsAny = (options || {});
        var value = initAsAny[key];
        if (value)
            return value;
        return mDefault;
    };
    var headers = getOption('headers', {});
    var method = getOption('method', 'get');
    var body = getOption('body', undefined);
    var xhr = createXhr(method);
    return new Promise(function (resolve, reject) {
        var createResponse = function (mFunction, ok, status, xhr, response) {
            mFunction({
                url: url, ok: ok, status: status,
                statusText: xhr.statusText || '',
                headers: xhr.getAllResponseHeaders(),
                json: function () { return Promise.resolve(JSON.stringify(response)); },
                text: function () { return Promise.resolve(response); }
            });
        };
        xhr.open(method, url, true);
        forEach(Object.keys(headers), function (key) {
            xhr.setRequestHeader(key, headers[key]);
        });
        xhr.onload = function () {
            var response = ('response' in xhr) ? xhr.response : xhr.responseText;
            var status = xhr.status === 1223 ? 204 : xhr.status;
            if (status === 0)
                status = response ? 200 : urlResolver(url).protocol === 'file' ? 404 : 0;
            createResponse(resolve, (status >= 200 && status < 400), status, xhr, response);
        };
        xhr.onerror = function () {
            createResponse(reject, false, xhr.status, xhr, '');
        };
        xhr.onabort = function () {
            createResponse(reject, false, xhr.status, xhr, '');
        };
        xhr.ontimeout = function () {
            createResponse(reject, false, xhr.status, xhr, '');
        };
        xhr.send(body);
    });
}
function code(len, prefix, sufix) {
    var alpha = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var lowerAlt = false, out = '';
    for (var i = 0; i < (len || 8); i++) {
        var pos = Math.floor(Math.random() * alpha.length);
        out += lowerAlt ? toLower(alpha[pos]) : alpha[pos];
        lowerAlt = !lowerAlt;
    }
    return ((prefix || "") + out + (sufix || ""));
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
function trim(value) {
    return value ? value.trim() : value;
}
function startWith(value, pattern) {
    return (value.substr(0, pattern.length) === pattern);
}
function toLower(str) {
    return str.toLowerCase();
}
function toStr(input) {
    if (isPrimitive(input)) {
        return String(input);
    }
    else if (isObject(input) || Array.isArray(input)) {
        return JSON.stringify(input);
    }
    else if (isFunction(input.toString)) {
        return input.toString();
    }
    else {
        return String(input);
    }
}
function defineProperty(object, property, descriptor) {
    Object.defineProperty(object, property, descriptor);
    return object;
}
function transferProperty(dest, src, name) {
    defineProperty(dest, name, getDescriptor(src, name));
}
function getDescriptor(obj, prop) {
    return Object.getOwnPropertyDescriptor(obj, prop);
}
function findAttribute(element, attributesToCheck, removeIfFound) {
    if (removeIfFound === void 0) { removeIfFound = false; }
    var res = null;
    if (!element)
        return null;
    for (var _i = 0, attributesToCheck_1 = attributesToCheck; _i < attributesToCheck_1.length; _i++) {
        var attrName = attributesToCheck_1[_i];
        var flexibleName = attrName;
        if (res = element.attributes[flexibleName])
            break;
    }
    if (!isNull(res) && removeIfFound)
        element.removeAttribute(res.name);
    return res;
}
function forEach(iterable, callback, context) {
    for (var index = 0; index < iterable.length; index++) {
        if (isFunction(callback))
            callback.call(context, iterable[index], index);
    }
}
function where(iterable, callback, context) {
    var out = [];
    for (var index = 0; index < iterable.length; index++) {
        var item = iterable[index];
        if (isFunction(callback) && callback.call(context, item, index)) {
            out.push(item);
        }
    }
    return out;
}
function toArray(array) {
    if (!array)
        return [];
    return [].slice.call(array);
}
function createAnyEl(elName, callback) {
    var el = DOM.createElement(elName);
    if (isFunction(callback))
        callback(el, DOM);
    var returnObj = {
        appendTo: function (target) {
            target.appendChild(el);
            return returnObj;
        },
        build: function () { return el; }
    };
    return returnObj;
}
function createEl(elName, callback) {
    var el = DOM.createElement(elName);
    if (isFunction(callback))
        callback(el, DOM);
    var returnObj = {
        appendTo: function (target) {
            target.appendChild(el);
            return returnObj;
        },
        build: function () { return el; }
    };
    return returnObj;
}
function mapper(source, destination) {
    forEach(Object.keys(source), function (key) {
        var sourceValue = source[key];
        if (key in destination) {
            if (isObject(sourceValue))
                return mapper(sourceValue, destination[key]);
            return destination[key] = sourceValue;
        }
        transferProperty(destination, source, key);
    });
}
function urlResolver(url) {
    var href = url;
    // Support: IE 9-11 only, /* doc.documentMode is only available on IE */
    if ('documentMode' in DOM) {
        anchor.setAttribute('href', href);
        href = anchor.href;
    }
    anchor.setAttribute('href', href);
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
    forEach(uriRemainParts, function (p) { return trim(p) ? partsToJoin.push(p) : null; });
    forEach(parts, function (part) { return forEach(part.split(/\//), function (p) { return trim(p) ? partsToJoin.push(p) : null; }); });
    return protocol + partsToJoin.join('/');
}
/**
 * Relative path resolver
 */
function pathResolver(relative, path) {
    var isCurrentDir = function (v) { return v.substr(0, 2) === './'; };
    var isParentDir = function (v) { return v.substr(0, 3) === '../'; };
    var toDirPath = function (v) {
        var values = v.split('/');
        if (/\.html$|\.css$|\.js$/gi.test(v))
            values.pop();
        return {
            relative: values.join('/'),
            parts: values
        };
    };
    if (isCurrentDir(path))
        return toDirPath(relative).relative + path.substr(1);
    if (isParentDir(path)) {
        var parts_1 = toDirPath(relative).parts;
        parts_1.push((function pathLookUp(value) {
            if (!isParentDir(value))
                return value;
            parts_1.pop();
            return pathLookUp(value.substr(3));
        })(path));
        return parts_1.join('/');
    }
    return path;
}
function buildError(error) {
    if (!error)
        return 'Unknown Error';
    error.stack = '';
    return error;
}
/**
 * Used to Bind the `isConnected` property of a node to another
 * in order to avoid binding cleanup where the element is not in the DOM
 */
function connectNode(node, nodeToConnectWith) {
    defineProperty(node, 'isConnected', { get: function () { return nodeToConnectWith.isConnected; } });
    return node;
}
var DOM = document;
var GLOBAL = globalThis;
var anchor = createEl('a').build();

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
    content: 'e-content',
    bind: 'e-bind',
    property: 'e-',
    skeleton: 'e-skeleton',
    route: 'route-view',
    href: ':href',
    entry: 'e-entry',
    on: 'on:',
    silent: 'silent',
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
    check: function (node, cmd) {
        return startWith(node.nodeName, cmd);
    },
    isConstant: function (value) {
        var _this = this;
        return (Object.keys(this).map(function (key) { return _this[key]; }).indexOf(value) !== -1);
    }
};

/**
 * Store instances of classes to provide any where of
 * the application, but not via constructor.
 * @see https://www.tutorialsteacher.com/ioc/ioc-container
 */
var IoC = /** @class */ (function () {
    function IoC() {
    }
    /**
     * Register an instance into the DI container
     * @param obj the instance to be store
     */
    IoC.Register = function (obj) {
        var objAsAny = obj;
        if (!this.container[objAsAny.bouer.__id__])
            this.container[objAsAny.bouer.__id__] = {};
        this.container[objAsAny.bouer.__id__][objAsAny.constructor.name] = {
            app: objAsAny.bouer,
            ClassInstance: obj
        };
    };
    /**
     * Resolve and Retrieve the instance registered
     * @param app the application
     * @param $class the class registered
     * @returns the instance of the class
     */
    IoC.Resolve = function (app, $class) {
        if (app.isDestroyed)
            throw new Error("Application already disposed.");
        var appContainer = this.container[app.__id__];
        var mContainer = appContainer[$class.name];
        return mContainer.ClassInstance;
    };
    /**
     * Destroy an instance registered
     * @param key the name of the class registered
     */
    IoC.Dispose = function (bouer) {
        delete this.container[bouer.__id__];
    };
    IoC.GetId = function () {
        return IoC.identifierController++;
    };
    IoC.identifierController = 1;
    IoC.container = {};
    return IoC;
}());

var Task = /** @class */ (function () {
    function Task() {
    }
    Task.run = function (callback, milliseconds) {
        var t_id = setInterval(function () {
            callback(function () { return clearInterval(t_id); });
        }, milliseconds || 1000);
    };
    return Task;
}());

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.log = function () {
        var content = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            content[_i] = arguments[_i];
        }
        console.log.apply(console, __spreadArray([Logger.prefix], content, false));
    };
    Logger.error = function () {
        var content = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            content[_i] = arguments[_i];
        }
        console.error.apply(console, __spreadArray([Logger.prefix], content, false));
    };
    Logger.warn = function () {
        var content = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            content[_i] = arguments[_i];
        }
        console.warn.apply(console, __spreadArray([Logger.prefix], content, false));
    };
    Logger.info = function () {
        var content = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            content[_i] = arguments[_i];
        }
        console.info.apply(console, __spreadArray([Logger.prefix], content, false));
    };
    Logger.prefix = '[Bouer]';
    return Logger;
}());

var Extend = /** @class */ (function () {
    function Extend() {
    }
    // join objects into one
    Extend.obj = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var out = {};
        forEach(args, function (arg) {
            if (isNull(arg))
                return;
            forEach(Object.keys(arg), function (key) {
                var propValue = arg[key];
                if (isNull(propValue))
                    return;
                transferProperty(out, arg, key);
            });
        });
        return out;
    };
    /** join arrays into one */
    Extend.array = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var out = [];
        forEach(args, function (arg) {
            if (isNull(arg))
                return;
            if (!Array.isArray(arg))
                return out.push(arg);
            forEach(Object.keys(arg), function (key) {
                var value = arg[key];
                if (isNull(value))
                    return;
                if (Array.isArray(value)) {
                    [].push.apply(out, value);
                }
                else {
                    out.push(value);
                }
            });
        });
        return out;
    };
    return Extend;
}());

var DelimiterHandler = /** @class */ (function () {
    function DelimiterHandler(delimiters, bouer) {
        this.delimiters = [];
        this.bouer = bouer;
        this.delimiters = delimiters;
        IoC.Register(this);
    }
    DelimiterHandler.prototype.add = function (item) {
        this.delimiters.push(item);
    };
    DelimiterHandler.prototype.remove = function (name) {
        var index = this.delimiters.findIndex(function (item) { return item.name === name; });
        this.delimiters.splice(index, 1);
    };
    DelimiterHandler.prototype.run = function (content) {
        var _this = this;
        if (isNull(content) || trim(content) === '')
            return [];
        var mDelimiter = null;
        var checkContent = function (text, flag) {
            var center = '([\\S\\s]*?)';
            for (var i = 0; i < _this.delimiters.length; i++) {
                var delimiter = _this.delimiters[i];
                var result_1 = text.match(RegExp(delimiter.delimiter.open + center + delimiter.delimiter.close, flag || ''));
                if (result_1) {
                    mDelimiter = delimiter;
                    return result_1;
                }
            }
        };
        var result = checkContent(content, 'g');
        if (!result)
            return [];
        return result.map(function (item) {
            var matches = checkContent(item);
            return {
                field: matches[0],
                expression: trim(matches[1]),
                delimiter: mDelimiter
            };
        });
    };
    return DelimiterHandler;
}());

var Evaluator = /** @class */ (function () {
    function Evaluator(bouer) {
        this.bouer = bouer;
        this.global = this.createWindow();
        IoC.Register(this);
    }
    Evaluator.prototype.createWindow = function () {
        var mWindow;
        createEl('iframe', function (frame, dom) {
            frame.style.display = 'none!important';
            dom.body.appendChild(frame);
            mWindow = frame.contentWindow;
            dom.body.removeChild(frame);
        });
        delete mWindow.name;
        return mWindow;
    };
    Evaluator.prototype.execRaw = function (expression, context) {
        // Executing the expression
        try {
            var mExpression = "(function(){ " + expression + " }).apply(this, arguments)";
            GLOBAL.Function(mExpression).apply(context || this.bouer);
        }
        catch (error) {
            Logger.error(buildError(error));
        }
    };
    Evaluator.prototype.exec = function (options) {
        var _this = this;
        var data = options.data, args = options.args, expression = options.expression, isReturn = options.isReturn, aditional = options.aditional, context = options.context;
        var mGlobal = this.global;
        var noConfigurableProperties = {};
        context = context || this.bouer;
        var dataToUse = Extend.obj(aditional || {});
        // Defining the scope data
        forEach(Object.keys(data), function (key) {
            transferProperty(dataToUse, data, key);
        });
        // Applying the global data to the dataToUse variable
        forEach(Object.keys(this.bouer.globalData), function (key) {
            if (key in dataToUse)
                return Logger.warn('It was not possible to use the globalData property "' + key +
                    '" because it already defined in the current scope.');
            transferProperty(dataToUse, _this.bouer.globalData, key);
        });
        var keys = Object.keys(dataToUse);
        var returnedValue;
        // Spreading all the properties
        forEach(keys, function (key) {
            delete mGlobal[key];
            // In case of non-configurable property store them to be handled
            if (key in mGlobal && getDescriptor(mGlobal, key).configurable === true)
                noConfigurableProperties[key] = mGlobal[key];
            if (key in noConfigurableProperties)
                mGlobal[key] = dataToUse[key];
            transferProperty(mGlobal, dataToUse, key);
        });
        // Executing the expression
        try {
            var mExpression = 'return(function(){"use strict"; ' +
                (isReturn === false ? '' : 'return') + ' ' + expression + ' }).apply(this, arguments)';
            returnedValue = this.global.Function(mExpression).apply(context, args);
        }
        catch (error) {
            Logger.error(buildError(error));
        }
        // Removing the properties
        forEach(keys, function (key) { return delete mGlobal[key]; });
        return returnedValue;
    };
    return Evaluator;
}());

var EventHandler = /** @class */ (function () {
    function EventHandler(bouer) {
        this.$events = {};
        this.input = createEl('input').build();
        this.bouer = bouer;
        this.evaluator = IoC.Resolve(this.bouer, Evaluator);
        IoC.Register(this);
        this.cleanup();
    }
    EventHandler.prototype.handle = function (node, data, context) {
        var _this = this;
        var _a;
        var ownerElement = (node.ownerElement || node.parentNode);
        var nodeName = node.nodeName;
        if (isNull(ownerElement))
            return Logger.error("Invalid ParentElement of “" + nodeName + "”");
        // <button on:submit.once.stopPropagation="times++"></button>
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        var eventNameWithModifiers = nodeName.substr(Constants.on.length);
        var allModifiers = eventNameWithModifiers.split('.');
        var eventName = allModifiers[0];
        allModifiers.shift();
        if (nodeValue === '')
            return Logger.error("Expected an expression in the “" + nodeName + "” and got an <empty string>.");
        connectNode(node, ownerElement);
        ownerElement.removeAttribute(nodeName);
        var callback = function (evt) {
            // Calling the modifiers
            var availableModifiersFunction = {
                'prevent': 'preventDefault',
                'stop': 'stopPropagation'
            };
            forEach(allModifiers, function (modifier) {
                var modifierFunctionName = availableModifiersFunction[modifier];
                if (evt[modifierFunctionName])
                    evt[modifierFunctionName]();
            });
            var mArguments = [evt];
            var isResultFunction = _this.evaluator.exec({
                data: data,
                expression: nodeValue,
                args: mArguments,
                aditional: { event: evt },
                context: context
            });
            if (isFunction(isResultFunction)) {
                try {
                    isResultFunction.apply(context, mArguments);
                }
                catch (error) {
                    Logger.error(buildError(error));
                }
            }
        };
        var modifiersObject = {};
        var addEventListenerOptions = ['capture', 'once', 'passive'];
        forEach(allModifiers, function (md) {
            md = md.toLocaleLowerCase();
            if (addEventListenerOptions.indexOf(md) !== -1) {
                modifiersObject[md] = true;
            }
        });
        if (!('on' + eventName in this.input))
            this.on({ eventName: eventName, callback: callback, modifiers: modifiersObject, context: context, attachedNode: ownerElement });
        else
            ownerElement.addEventListener(eventName, callback, modifiersObject);
    };
    EventHandler.prototype.on = function (options) {
        var _this = this;
        var eventName = options.eventName, callback = options.callback, context = options.context, attachedNode = options.attachedNode, modifiers = options.modifiers;
        var event = {
            eventName: eventName,
            callback: function (evt) { return callback.apply(context || _this.bouer, [evt]); },
            attachedNode: attachedNode,
            modifiers: modifiers,
            emit: function (options) { return _this.emit({
                eventName: eventName,
                attachedNode: attachedNode,
                init: (options || {}).init,
                once: (options || {}).once,
            }); }
        };
        if (!this.$events[eventName])
            this.$events[eventName] = [];
        this.$events[eventName].push(event);
        return event;
    };
    EventHandler.prototype.off = function (options) {
        var eventName = options.eventName, callback = options.callback, attachedNode = options.attachedNode;
        if (!this.$events[eventName])
            return;
        this.$events[eventName] = where(this.$events[eventName], function (evt) {
            if (attachedNode)
                return (evt.attachedNode === attachedNode);
            return !(evt.eventName === eventName && callback == evt.callback);
        });
    };
    EventHandler.prototype.emit = function (options) {
        var _this = this;
        var eventName = options.eventName, init = options.init, once = options.once, attachedNode = options.attachedNode;
        var events = this.$events[eventName];
        if (!events)
            return;
        var emitter = function (node, callback) {
            node.addEventListener(eventName, callback, { once: true });
            node.dispatchEvent(new CustomEvent(eventName, init));
        };
        forEach(events, function (evt, index) {
            var node = evt.attachedNode;
            // If a node was provided, just dispatch the events in this node
            if (attachedNode) {
                if (node !== attachedNode)
                    return;
                return emitter(node, evt.callback);
            }
            // Otherwise, if this events has a node, dispatch the node event
            if (node)
                return emitter(node, evt.callback);
            // Otherwise, dispatch all events
            evt.callback.call(_this.bouer, new CustomEvent(eventName, init));
            if ((once !== null && once !== void 0 ? once : false) === true)
                events.splice(index, 1);
        });
    };
    EventHandler.prototype.cleanup = function () {
        var _this = this;
        Task.run(function () {
            forEach(Object.keys(_this.$events), function (key) {
                _this.$events[key] = where(_this.$events[key], function (event) {
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

var ReactiveEvent = /** @class */ (function () {
    function ReactiveEvent() {
    }
    ReactiveEvent.on = function (eventName, callback) {
        var array = (this[eventName]);
        array.push(callback);
        return {
            eventName: eventName,
            callback: callback,
            off: function () { return ReactiveEvent.off(eventName, callback); }
        };
    };
    ReactiveEvent.off = function (eventName, callback) {
        var array = this[eventName];
        array.splice(array.indexOf(callback), 1);
        return true;
    };
    ReactiveEvent.once = function (eventName, callback) {
        var event = {};
        var mEvent = ReactiveEvent.on(eventName, function (reactive, method, options) {
            if (event.onemit)
                event.onemit(reactive);
        });
        try {
            callback(event);
        }
        catch (error) {
            Logger.error(buildError(error));
        }
        finally {
            ReactiveEvent.off(eventName, mEvent.callback);
        }
    };
    ReactiveEvent.emit = function (eventName, reactive) {
        try {
            forEach(this[eventName], function (evt) { return evt(reactive); });
        }
        catch (error) {
            Logger.error(buildError(error));
        }
    };
    ReactiveEvent.BeforeGet = [];
    ReactiveEvent.AfterGet = [];
    ReactiveEvent.BeforeSet = [];
    ReactiveEvent.AfterSet = [];
    return ReactiveEvent;
}());

var Watch = /** @class */ (function () {
    function Watch(reactive, callback, options) {
        var _this = this;
        this.destroy = function () {
            var indexOfThis = _this.reactive.watches.indexOf(_this);
            if (indexOfThis !== -1)
                _this.reactive.watches.splice(indexOfThis, 1);
            if (_this.onDestroy)
                _this.onDestroy();
        };
        this.reactive = reactive;
        this.property = reactive.propertyName;
        this.callback = callback;
        if (options) {
            this.node = options.node;
            this.onDestroy = options.onDestroy;
        }
    }
    return Watch;
}());

var UriHandler = /** @class */ (function () {
    function UriHandler(url) {
        this.url = url || DOM.location.href;
    }
    UriHandler.prototype.params = function (urlPattern) {
        var _this = this;
        var mParams = {};
        var buildQueryParams = function () {
            // Building from query string
            var queryStr = _this.url.split('?')[1];
            if (!queryStr)
                return _this;
            var keys = queryStr.split('&');
            forEach(keys, function (key) {
                var pair = key.split('=');
                mParams[pair[0]] = (pair[1] || '').split('#')[0];
            });
        };
        if (urlPattern && isString(urlPattern)) {
            var urlWithQueryParamsIgnored = this.url.split('?')[0];
            var urlPartsReversed_1 = urlWithQueryParamsIgnored.split('/').reverse();
            if (urlPartsReversed_1[0] === '')
                urlPartsReversed_1.shift();
            var urlPatternReversed = urlPattern.split('/').reverse();
            forEach(urlPatternReversed, function (value, index) {
                var valueExec = RegExp("{([\\S\\s]*?)}").exec(value);
                if (Array.isArray(valueExec))
                    mParams[valueExec[1]] = urlPartsReversed_1[index];
            });
        }
        buildQueryParams();
        return mParams;
    };
    UriHandler.prototype.add = function (params) {
        var mParams = [];
        forEach(Object.keys(params), function (key) {
            mParams.push(key + '=' + params[key]);
        });
        var joined = mParams.join('&');
        return (this.url.includes('?')) ? '&' + joined : '?' + joined;
    };
    UriHandler.prototype.remove = function (param) {
        return param;
    };
    return UriHandler;
}());

var Component = /** @class */ (function () {
    function Component(optionsOrPath) {
        this.prefetch = false;
        this.title = undefined;
        this.route = undefined;
        this.isDefault = undefined;
        this.isNotFound = undefined;
        this.el = undefined;
        this.bouer = undefined;
        this.children = [];
        this.assets = [];
        // Store temporarily this component UI orders
        this.events = [];
        var _name = undefined;
        var _path = undefined;
        if (!isString(optionsOrPath)) {
            _name = optionsOrPath.name;
            _path = optionsOrPath.path;
            Object.assign(this, optionsOrPath);
        }
        else {
            _path = optionsOrPath;
        }
        this.name = _name;
        this.path = _path;
        this.data = Reactive.transform({
            context: this,
            inputObject: this.data || {}
        });
    }
    // Hooks
    Component.prototype.requested = function (event) { };
    Component.prototype.created = function (event) { };
    Component.prototype.beforeMount = function (event) { };
    Component.prototype.mounted = function (event) { };
    Component.prototype.beforeLoad = function (event) { };
    Component.prototype.loaded = function (event) { };
    Component.prototype.beforeDestroy = function (event) { };
    Component.prototype.destroyed = function (event) { };
    Component.prototype.blocked = function (event) { };
    Component.prototype.failed = function (event) { };
    Component.prototype.export = function (options) {
        var _this = this;
        if (!isObject(options))
            return Logger.log("Invalid object for component.export(...), only \"Object Literal\" is allowed.");
        return forEach(Object.keys(options), function (key) {
            _this.data[key] = options[key];
            transferProperty(_this.data, options, key);
        });
    };
    Component.prototype.destroy = function () {
        var _this = this;
        if (!this.el)
            return false;
        this.emit('beforeDestroy');
        var container = this.el.parentElement;
        if (container)
            container.removeChild(this.el) !== null;
        // Destroying all the events attached to the this instance
        forEach(this.events, function (evt) { return _this.off(evt.eventName, evt.callback); });
        this.events = [];
        this.emit('destroyed');
    };
    Component.prototype.params = function () {
        return new UriHandler().params(this.route);
    };
    Component.prototype.emit = function (eventName, init) {
        IoC.Resolve(this.bouer, EventHandler).emit({
            eventName: eventName,
            attachedNode: this.el,
            init: init
        });
    };
    Component.prototype.on = function (eventName, callback) {
        var context = (eventName == 'beforeDestroy' ||
            eventName == 'beforeLoad' ||
            eventName == 'beforeMount' ||
            eventName == 'destroyed' ||
            eventName == 'loaded' ||
            eventName == 'mounted') ? this : this.bouer;
        var evt = IoC.Resolve(this.bouer, EventHandler).on({
            eventName: eventName,
            callback: callback,
            attachedNode: this.el,
            context: context
        });
        this.events.push(evt);
        return evt;
    };
    Component.prototype.off = function (eventName, callback) {
        IoC.Resolve(this.bouer, EventHandler).off({
            eventName: eventName,
            callback: callback,
            attachedNode: this.el
        });
        this.events = where(this.events, function (evt) { return !(evt.eventName == eventName && evt.callback == callback); });
    };
    Component.prototype.addAssets = function (assets) {
        var $assets = [];
        var assetsTypeMapper = {
            'css': 'link',
            'js': 'script',
            'style': 'link'
        };
        forEach(assets, function (asset, index) {
            if (!asset.src || !trim(asset.src))
                return Logger.error('Invalid asset “src”, in assets[' + index + '].src');
            var type = '';
            if (!asset.type) {
                var srcSplitted = asset.src.split('.');
                type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];
                if (!type)
                    return Logger.error("Couldn't find out what type of asset it is, provide " +
                        "the “type” explicitly at assets[" + index + "].type");
            }
            else {
                asset.type = toLower(asset.type);
                type = assetsTypeMapper[asset.type] || asset.type;
            }
            var $asset = createAnyEl(type, function (el) {
                var _a;
                if ((_a = asset.scoped) !== null && _a !== void 0 ? _a : true)
                    el.setAttribute('scoped', 'true');
                switch (toLower(type)) {
                    case 'script':
                        el.setAttribute('src', asset.src);
                        break;
                    case 'link':
                        el.setAttribute('href', asset.src);
                        el.setAttribute('rel', 'stylesheet');
                        el.setAttribute('type', 'text/css');
                        break;
                    default:
                        el.setAttribute('src', asset.src);
                        break;
                }
            }).build();
            $assets.push($asset);
        });
        this.assets.push.apply(this.assets, $assets);
    };
    return Component;
}());

var Reactive = /** @class */ (function () {
    function Reactive(options) {
        var _this = this;
        this.watches = [];
        this.get = function () {
            ReactiveEvent.emit('BeforeGet', _this);
            _this.propertyValue = _this.isComputed ? _this.computedGetter() : _this.propertyValue;
            var value = _this.propertyValue;
            ReactiveEvent.emit('AfterGet', _this);
            return value;
        };
        this.set = function (value) {
            var oldPropertyValue = _this.propertyValue;
            if (oldPropertyValue === value)
                return;
            ReactiveEvent.emit('BeforeSet', _this);
            if (isObject(value) || Array.isArray(value)) {
                if ((typeof _this.propertyValue) !== (typeof value))
                    return Logger.error(("Cannot set “" + (typeof value) + "” in “" +
                        _this.propertyName + "” property."));
                if (Array.isArray(value)) {
                    Reactive.transform({
                        inputObject: value,
                        reactiveObj: _this,
                        context: _this.context
                    });
                    var propValueAsAny = _this.propertyValue;
                    propValueAsAny.splice(0, propValueAsAny.length);
                    propValueAsAny.push.apply(propValueAsAny, value);
                }
                else if (isObject(value)) {
                    if ((value instanceof Node)) // If some html element
                        _this.propertyValue = value;
                    else {
                        Reactive.transform({
                            inputObject: value,
                            context: _this.context
                        });
                        if (!isNull(_this.propertyValue))
                            mapper(value, _this.propertyValue);
                        else
                            _this.propertyValue = value;
                    }
                }
            }
            else {
                _this.propertyValue = value;
            }
            if (_this.isComputed && _this.computedSetter)
                _this.computedSetter(value);
            ReactiveEvent.emit('AfterSet', _this);
            // Calling all the watches
            forEach(_this.watches, function (watch) { return watch.callback(_this.propertyValue, oldPropertyValue); });
        };
        this.propertyName = options.propertyName;
        this.propertySource = options.sourceObject;
        this.context = options.context;
        // Setting the value of the property
        this.propertyDescriptor = getDescriptor(this.propertySource, this.propertyName);
        this.propertyValue = this.propertyDescriptor.value;
        this.isComputed = typeof this.propertyValue === 'function' && this.propertyValue.name === '$computed';
        if (this.isComputed) {
            var computedResult = this.propertyValue.call(this.context);
            if ('get' in computedResult || isFunction(computedResult)) {
                this.computedGetter = computedResult.get || computedResult;
            }
            if ('set' in computedResult) {
                this.computedSetter = computedResult.set;
            }
            if (!this.computedGetter)
                throw new Error("Computed property must be a function “function $computed(){...}” " +
                    "that returns a function for “getter only” or an object with a “get” and/or “set” function");
            this.propertyValue = undefined;
        }
        if (typeof this.propertyValue === 'function' && !this.isComputed)
            this.propertyValue = this.propertyValue.bind(this.context);
    }
    Reactive.prototype.onChange = function (callback, node) {
        var w = new Watch(this, callback, { node: node });
        this.watches.push(w);
        return w;
    };
    Reactive.transform = function (options) {
        var context = options.context;
        var executer = function (inputObject, reactiveObj, visiting, visited) {
            if (Array.isArray(inputObject)) {
                if (reactiveObj == null) {
                    Logger.warn('Cannot transform this array to a reactive one because no reactive objecto was provided');
                    return inputObject;
                }
                if (visiting === null || visiting === void 0 ? void 0 : visiting.includes(inputObject))
                    return inputObject;
                visiting === null || visiting === void 0 ? void 0 : visiting.push(inputObject);
                var REACTIVE_ARRAY_METHODS = ['push', 'pop', 'unshift', 'shift', 'splice'];
                var inputArray_1 = inputObject;
                var reference_1 = {}; // Using clousure to cache the array methods
                var prototype_1 = inputArray_1.__proto__ = Object.create(Array.prototype);
                forEach(REACTIVE_ARRAY_METHODS, function (method) {
                    // cache original method
                    reference_1[method] = inputArray_1[method].bind(inputArray_1);
                    // changing to the reactive one
                    prototype_1[method] = function reactive() {
                        var oldArrayValue = inputArray_1.slice();
                        switch (method) {
                            case 'push':
                            case 'unshift':
                                forEach(toArray(arguments), function (arg) {
                                    if (!isObject(arg) && !Array.isArray(arg))
                                        return;
                                    executer(arg);
                                });
                        }
                        var result = reference_1[method].apply(inputArray_1, arguments);
                        forEach(reactiveObj.watches, function (watch) { return watch.callback(inputArray_1, oldArrayValue); });
                        return result;
                    };
                });
                return inputArray_1;
            }
            if (!isObject(inputObject))
                return inputObject;
            if (visiting === null || visiting === void 0 ? void 0 : visiting.includes(inputObject))
                return inputObject;
            visiting === null || visiting === void 0 ? void 0 : visiting.push(inputObject);
            forEach(Object.keys(inputObject), function (key) {
                var mInputObject = inputObject;
                // Already a reactive property, do nothing
                if (isNull(getDescriptor(inputObject, key).value))
                    return;
                var propertyValue = mInputObject[key];
                if (propertyValue && (propertyValue instanceof Bouer) ||
                    (propertyValue instanceof Component) ||
                    (propertyValue instanceof Node))
                    return;
                var reactive = new Reactive({
                    propertyName: key,
                    sourceObject: inputObject,
                    context: context
                });
                defineProperty(inputObject, key, reactive);
                if (isObject(propertyValue))
                    executer(propertyValue);
                else if (Array.isArray(propertyValue)) {
                    executer(propertyValue, reactive); // Transform the array to a reactive one
                    forEach(propertyValue, function (item) { return executer(item); });
                }
            });
            visiting === null || visiting === void 0 ? void 0 : visiting.splice(visiting.indexOf(inputObject), 1);
            visited === null || visited === void 0 ? void 0 : visited.push(inputObject);
            return inputObject;
        };
        return executer(options.inputObject, options.reactiveObj, [], []);
    };
    return Reactive;
}());

var Routing = /** @class */ (function () {
    function Routing(bouer) {
        this.defaultPage = undefined;
        this.notFoundPage = undefined;
        this.routeView = null;
        this.activeAnchors = [];
        // Store `href` value of the <base /> tag
        this.base = null;
        this.bouer = bouer;
        this.routeView = this.bouer.el.querySelector('[route-view]');
        IoC.Register(this);
    }
    Routing.prototype.init = function () {
        var _this = this;
        if (isNull(this.routeView))
            return;
        this.routeView.removeAttribute('route-view');
        this.base = "/";
        var base = DOM.head.querySelector('base');
        if (base) {
            var baseHref = base.attributes['href'];
            if (!baseHref)
                return Logger.error("The href=\"/\" attribute is required in base element.");
            this.base = baseHref.value;
        }
        if (this.defaultPage)
            this.navigate(DOM.location.href);
        // Listening to the page navigation
        GLOBAL.addEventListener('popstate', function (evt) {
            evt.preventDefault();
            _this.navigate((evt.state || location.href), false);
        });
    };
    /**
     * Navigates to a certain page without reloading all the page
     * @param route the route to navigate to
     * @param changeUrl allow to change the url after the navigation, default value is `true`
     */
    Routing.prototype.navigate = function (route, changeUrl) {
        var _this = this;
        var _a;
        if (!this.routeView)
            return;
        if (isNull(route))
            return Logger.log("Invalid url provided to the navigation method.");
        route = trim(route);
        var resolver = urlResolver(route);
        var usehash = (_a = (this.bouer.config || {}).usehash) !== null && _a !== void 0 ? _a : true;
        var navigatoTo = (usehash ? resolver.hash : resolver.pathname).split('?')[0];
        // In case of: /about/me/, remove the last forward slash
        if (navigatoTo[navigatoTo.length - 1] === '/')
            navigatoTo = navigatoTo.substr(0, navigatoTo.length - 1);
        var page = this.toPage(navigatoTo);
        this.clear();
        if (!page)
            return; // Page Not Found and NotFound Page Not Defined
        // If it's not found and the url matches .html do nothing
        if (!page && route.endsWith('.html'))
            return;
        var componentElement = createAnyEl(page.name)
            .appendTo(this.routeView)
            .build();
        // Document info configuration
        DOM.title = page.title || DOM.title;
        if ((changeUrl !== null && changeUrl !== void 0 ? changeUrl : true))
            this.pushState(resolver.href, DOM.title);
        var routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route);
        IoC.Resolve(this.bouer, ComponentHandler)
            .order(componentElement, {}, function (component) {
            component.on('loaded', function () {
                _this.markActiveAnchors(routeToSet);
            });
        });
    };
    Routing.prototype.pushState = function (url, title) {
        url = urlResolver(url).href;
        if (DOM.location.href === url)
            return;
        GLOBAL.history.pushState(url, (title || ''), url);
    };
    Routing.prototype.popState = function (times) {
        if (isNull(times))
            times = -1;
        GLOBAL.history.go(times);
    };
    Routing.prototype.toPage = function (url) {
        // Default Page
        if (url === '' || url === '/' ||
            url === "/" + urlCombine((this.base, "index.html"))) {
            return this.defaultPage;
        }
        // Search for the right page
        return IoC.Resolve(this.bouer, ComponentHandler)
            .find(function (component) {
            if (!component.route)
                return false;
            var routeRegExp = component.route.replace(/{(.*?)}/gi, '[\\S\\s]{1,}');
            if (Array.isArray(new RegExp("^" + routeRegExp + "$").exec(url)))
                return true;
            return false;
        }) || this.notFoundPage;
    };
    Routing.prototype.markActiveAnchors = function (route) {
        var _this = this;
        var className = (this.bouer.config || {}).activeClassName || 'active-link';
        var anchors = this.bouer.el.querySelectorAll('a');
        forEach(this.activeAnchors, function (anchor) {
            return anchor.classList.remove(className);
        });
        forEach([].slice.call(this.bouer.el.querySelectorAll('a.' + className)), function (anchor) {
            return anchor.classList.remove(className);
        });
        this.activeAnchors = [];
        forEach(toArray(anchors), function (anchor) {
            if (anchor.href.split('?')[0] !== route.split('?')[0])
                return;
            anchor.classList.add(className);
            _this.activeAnchors.push(anchor);
        });
    };
    Routing.prototype.clear = function () {
        this.routeView.innerHTML = '';
    };
    /**
     * Allow to configure the `Default Page` and `NotFound Page`
     * @param component the component to be checked
     */
    Routing.prototype.configure = function (component) {
        if (component.isDefault === true && !isNull(this.defaultPage))
            return Logger.warn("There are multiple “Default Page” provided, check the “" + component.route + "” route.");
        if (component.isNotFound === true && !isNull(this.notFoundPage))
            return Logger.warn("There are multiple “NotFound Page” provided, check the “" + component.route + "” route.");
        if (component.isDefault === true)
            this.defaultPage = component;
        if (component.isNotFound === true)
            this.notFoundPage = component;
    };
    return Routing;
}());

var ComponentHandler = /** @class */ (function () {
    function ComponentHandler(bouer) {
        // Handle all the components web requests to avoid multiple requests
        this.requests = {};
        this.components = {};
        // Avoids to add multiple styles of the same component if it's already in use
        this.stylesController = {};
        this.bouer = bouer;
        this.delimiter = IoC.Resolve(this.bouer, DelimiterHandler);
        this.eventHandler = IoC.Resolve(this.bouer, EventHandler);
        IoC.Register(this);
    }
    ComponentHandler.prototype.check = function (nodeName) {
        return (nodeName in this.components);
    };
    ComponentHandler.prototype.request = function (url, response) {
        var _this = this;
        if (!isNull(this.requests[url]))
            return this.requests[url].push(response);
        this.requests[url] = [response];
        var resolver = urlResolver(anchor.baseURI);
        var hasBaseElement = DOM.head.querySelector('base') != null;
        var baseURI = hasBaseElement ? resolver.baseURI : resolver.origin;
        var urlPath = urlCombine(baseURI, url);
        webRequest(urlPath, { headers: { 'Content-Type': 'text/plain' } })
            .then(function (response) {
            if (!response.ok)
                throw new Error(response.statusText);
            return response.text();
        })
            .then(function (content) {
            forEach(_this.requests[url], function (request) {
                request.success(content, url);
            });
        })
            .catch(function (error) {
            if (!hasBaseElement)
                Logger.warn("It seems like you are not using the “<base href=\"/base/components/path/\" />” " +
                    "element, try to add as the first child into “<head></head>” element.");
            forEach(_this.requests[url], function (request) {
                request.fail(error, url);
            });
        })
            .finally(function () {
            delete _this.requests[url];
        });
    };
    ComponentHandler.prototype.prepare = function (components, parent) {
        var _this = this;
        forEach(components, function (component) {
            var _a;
            var ctorName = component.constructor.name;
            var isBuitInClass = ctorName === "IComponent" || ctorName === "Component" || ctorName === "Object";
            if (isNull(component.name)) {
                if (isBuitInClass)
                    component.name = toLower(code(9, 'component-'));
                else
                    component.name = toLower(component.constructor.name);
            }
            if (isNull(component.path) && isNull(component.template))
                return Logger.warn("The component with name “" + component.name + "”" +
                    component.route ? (" and the route “" + component.route + "”") : "" +
                    " has not “path” or “template” property defined, " +
                    "then it was ignored.");
            if (!isNull(_this.components[component.name]))
                return Logger.warn("The component name “" + component.name + "” is already define, try changing the name.");
            if (Array.isArray(component.children))
                _this.prepare(component.children, component);
            if (!isNull(component.route)) { // Completing the API
                component.route = "/" + urlCombine((isNull(parent) ? "" : parent.route), component.route);
            }
            IoC.Resolve(_this.bouer, Routing)
                .configure(_this.components[component.name] = component);
            var getContent = function (path) {
                if (!path)
                    return;
                _this.request(component.path, {
                    success: function (content) {
                        component.template = content;
                    },
                    fail: function (error) {
                        Logger.error(buildError(error));
                    }
                });
            };
            if (!isNull(component.prefetch)) {
                if (component.prefetch === true)
                    return getContent(component.path);
                return;
            }
            var prefetch = (_a = (_this.bouer.config || {}).prefetch) !== null && _a !== void 0 ? _a : true;
            if (!prefetch)
                return;
            return getContent(component.path);
        });
    };
    ComponentHandler.prototype.order = function (componentElement, data, callback) {
        var _this = this;
        var $name = toLower(componentElement.nodeName);
        var mComponents = this.components;
        var hasComponent = mComponents[$name];
        if (!hasComponent)
            return Logger.error("No component with name “" + $name + "” registered.");
        var component = hasComponent;
        var icomponent = component;
        var mainExecutionWrapper = function () {
            if (component.template) {
                var newComponent = (component instanceof Component) ? component : new Component(component);
                newComponent.bouer = _this.bouer;
                _this.insert(componentElement, newComponent, data, callback);
                if (component.keepAlive === true)
                    mComponents[$name] = component;
                return;
            }
            var requestedEvent = _this.addComponentEventAndEmitGlobalEvent('requested', componentElement, component, _this.bouer);
            if (requestedEvent)
                requestedEvent.emit();
            // Make or Add request
            _this.request(component.path, {
                success: function (content) {
                    var newComponent = (component instanceof Component) ? component : new Component(component);
                    icomponent.template = newComponent.template = content;
                    newComponent.bouer = _this.bouer;
                    _this.insert(componentElement, newComponent, data, callback);
                    if (component.keepAlive === true)
                        mComponents[$name] = component;
                },
                fail: function (error) {
                    Logger.error("Failed to request <" + $name + "></" + $name + "> component with path “" + component.path + "”.");
                    Logger.error(buildError(error));
                    if (typeof icomponent.failed !== 'function')
                        return;
                    icomponent.failed(new CustomEvent('failed'));
                }
            });
        };
        // Checking the restrictions
        if (icomponent.restrictions && icomponent.restrictions.length > 0) {
            var blockedRestrictions_1 = [];
            var restrictions = icomponent.restrictions.map(function (restriction) {
                var restrictionResult = restriction.call(_this.bouer, component);
                if (restrictionResult === false)
                    blockedRestrictions_1.push(restriction);
                else if (restrictionResult instanceof Promise)
                    restrictionResult
                        .then(function (value) {
                        if (value === false)
                            blockedRestrictions_1.push(restriction);
                    })
                        .catch(function () { return blockedRestrictions_1.push(restriction); });
                return restrictionResult;
            });
            var blockedEvent_1 = this.addComponentEventAndEmitGlobalEvent('blocked', componentElement, component, this.bouer);
            var emitter_1 = function () { return blockedEvent_1.emit({
                detail: {
                    component: component.name,
                    message: "Component “" + component.name + "” blocked by restriction(s)",
                    blocks: blockedRestrictions_1
                }
            }); };
            return Promise.all(restrictions)
                .then(function (restrictionValues) {
                if (restrictionValues.every(function (value) { return value == true; }))
                    mainExecutionWrapper();
                else
                    emitter_1();
            })
                .catch(function () { return emitter_1(); });
        }
        return mainExecutionWrapper();
    };
    ComponentHandler.prototype.find = function (callback) {
        var keys = Object.keys(this.components);
        for (var i = 0; i < keys.length; i++) {
            var component = this.components[keys[i]];
            if (callback(component))
                return component;
        }
        return null;
    };
    /** Subscribe the hooks of the instance */
    ComponentHandler.prototype.addComponentEventAndEmitGlobalEvent = function (eventName, element, component, context) {
        var callback = component[eventName];
        this.eventHandler.emit({
            eventName: 'component:' + eventName,
            init: {
                detail: { component: component }
            }
        });
        if (typeof callback !== 'function')
            return { emit: (function () { }) };
        var emitter = this.eventHandler.on({
            eventName: eventName,
            callback: function (evt) { return callback.call(component, evt); },
            attachedNode: element,
            modifiers: { once: true },
            context: context || component
        }).emit;
        return {
            emit: function (init) { return emitter({
                init: init
            }); }
        };
    };
    ComponentHandler.prototype.insert = function (componentElement, component, data, callback) {
        var _this = this;
        var _a;
        var $name = toLower(componentElement.nodeName);
        var container = componentElement.parentElement;
        if (!componentElement.isConnected || !container)
            return; //Logger.warn("Insert location of component <" + $name + "></" + $name + "> not found.");
        if (isNull(component.template))
            return Logger.error("The <" + $name + "></" + $name + "> component is not ready yet to be inserted.");
        var elementSlots = createAnyEl('SlotContainer', function (el) {
            el.innerHTML = componentElement.innerHTML;
            componentElement.innerHTML = "";
        }).build();
        var isKeepAlive = componentElement.hasAttribute('keep-alive') || ((_a = component.keepAlive) !== null && _a !== void 0 ? _a : false);
        // Component Creation
        if (isKeepAlive === false || isNull(component.el)) {
            createEl('body', function (htmlSnippet) {
                htmlSnippet.innerHTML = component.template;
                forEach([].slice.call(htmlSnippet.children), function (asset) {
                    if (['SCRIPT', 'LINK', 'STYLE'].indexOf(asset.nodeName) === -1)
                        return;
                    component.assets.push(asset);
                    htmlSnippet.removeChild(asset);
                });
                if (htmlSnippet.children.length === 0)
                    return Logger.error(("The component <" + $name + "></" + $name + "> " +
                        "seems to be empty or it has not a root element. Example: <div></div>, to be included."));
                if (htmlSnippet.children.length > 1)
                    return Logger.error(("The component <" + $name + "></" + $name + "> " +
                        "seems to have multiple root element, it must have only one root."));
                component.el = htmlSnippet.children[0];
                _this.addComponentEventAndEmitGlobalEvent('created', component.el, component, _this.bouer);
                component.emit('created');
            });
        }
        if (isNull(component.el))
            return;
        if (isFunction(callback))
            callback(component);
        var rootElement = component.el;
        // tranfering the attributes
        forEach(toArray(componentElement.attributes), function (attr) {
            componentElement.removeAttribute(attr.name);
            if (attr.nodeName === 'class')
                return componentElement.classList.forEach(function (cls) {
                    rootElement.classList.add(cls);
                });
            if (attr.nodeName === 'data') {
                if (_this.delimiter.run(attr.value).length !== 0)
                    return Logger.error(("The “data” attribute cannot contain delimiter, " +
                        "source element: <" + $name + "></" + $name + ">."));
                var inputData_1 = {};
                var mData = Extend.obj(data, { $data: data });
                var reactiveEvent = ReactiveEvent.on('AfterGet', function (reactive) {
                    inputData_1[reactive.propertyName] = undefined;
                    defineProperty(inputData_1, reactive.propertyName, reactive);
                });
                // If data value is empty gets the main scope value
                if (attr.value === '')
                    inputData_1 = Extend.obj(_this.bouer.data);
                else {
                    // Other wise, compiles the object provided
                    var mInputData_1 = IoC.Resolve(_this.bouer, Evaluator)
                        .exec({
                        data: mData,
                        expression: attr.value,
                        context: _this.bouer
                    });
                    if (!isObject(mInputData_1))
                        return Logger.error(("Expected a valid Object Literal expression in “"
                            + attr.nodeName + "” and got “" + attr.value + "”."));
                    // Adding all non-existing properties
                    forEach(Object.keys(mInputData_1), function (key) {
                        if (!(key in inputData_1))
                            inputData_1[key] = mInputData_1[key];
                    });
                }
                reactiveEvent.off();
                Reactive.transform({
                    context: component,
                    inputObject: inputData_1
                });
                return forEach(Object.keys(inputData_1), function (key) {
                    transferProperty(component.data, inputData_1, key);
                });
            }
            rootElement.attributes.setNamedItem(attr);
        });
        var initializer = component.init;
        if (isFunction(initializer))
            initializer.call(component);
        this.addComponentEventAndEmitGlobalEvent('beforeMount', component.el, component);
        component.emit('beforeMount');
        container.replaceChild(rootElement, componentElement);
        var rootClassList = {};
        // Retrieving all the classes of the retu elements
        rootElement.classList.forEach(function (key) { return rootClassList[key] = true; });
        // Changing each selector to avoid conflits
        var changeSelector = function (style, styleId) {
            var isStyle = (style.nodeName === 'STYLE'), rules = [];
            if (!style.sheet)
                return;
            var cssRules = style.sheet.cssRules;
            for (var i = 0; i < cssRules.length; i++) {
                var rule = cssRules.item(i);
                if (!rule)
                    continue;
                var mRule = rule;
                if (mRule.selectorText) {
                    var selector = mRule.selectorText.substr(1);
                    var separation = rootClassList[selector] ? "" : " ";
                    var uniqueIdentifier = "." + styleId;
                    var selectorTextSplitted = mRule.selectorText.split(' ');
                    if (selectorTextSplitted[0] === toLower(rootElement.tagName))
                        selectorTextSplitted.shift();
                    mRule.selectorText = uniqueIdentifier + separation + selectorTextSplitted.join(' ');
                }
                if (isStyle)
                    rules.push(mRule.cssText);
            }
            if (isStyle)
                style.innerText = rules.join(' ');
        };
        var scriptsAssets = where(component.assets, function (asset) { return toLower(asset.nodeName) === 'script'; });
        var stylesAssets = where(component.assets, function (asset) { return toLower(asset.nodeName) !== 'script'; });
        var styleAttrName = 'component-style';
        // Configuring the styles
        forEach(stylesAssets, function (asset) {
            var mStyle = asset.cloneNode(true);
            if (mStyle instanceof HTMLLinkElement) {
                var path = component.path[0] === '/' ? component.path.substr(1) : component.path;
                mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
            }
            //Checking if this component already have styles added
            if (_this.stylesController[$name]) {
                var controller = _this.stylesController[$name];
                if (controller.elements.indexOf(rootElement) === -1) {
                    controller.elements.push(rootElement);
                    forEach(controller.styles, function ($style) {
                        rootElement.classList.add($style.getAttribute(styleAttrName));
                    });
                }
                return;
            }
            var styleId = code(7, 'bouer-s');
            mStyle.setAttribute(styleAttrName, styleId);
            if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
                mStyle.onload = function (evt) { return changeSelector(evt.target, styleId); };
            _this.stylesController[$name] = {
                styles: [DOM.head.appendChild(mStyle)],
                elements: [rootElement]
            };
            if (!mStyle.hasAttribute('scoped'))
                return;
            rootElement.classList.add(styleId);
            if (mStyle instanceof HTMLStyleElement)
                return changeSelector(mStyle, styleId);
        });
        var compile = function (scriptContent) {
            try {
                // Executing the mixed scripts
                IoC.Resolve(_this.bouer, Evaluator)
                    .execRaw((scriptContent || ''), component);
                _this.addComponentEventAndEmitGlobalEvent('mounted', component.el, component);
                component.emit('mounted');
                // TODO: Something between this two events
                _this.addComponentEventAndEmitGlobalEvent('beforeLoad', component.el, component);
                component.emit('beforeLoad');
                IoC.Resolve(_this.bouer, Compiler)
                    .compile({
                    data: Reactive.transform({
                        context: component,
                        inputObject: component.data
                    }),
                    el: rootElement,
                    componentSlot: elementSlots,
                    context: component,
                    onDone: function () {
                        _this.addComponentEventAndEmitGlobalEvent('loaded', component.el, component);
                        component.emit('loaded');
                    }
                });
                Task.run(function (stopTask) {
                    if (component.el.isConnected)
                        return;
                    component.destroy();
                    stopTask();
                    var stylesController = _this.stylesController[component.name];
                    if (!stylesController)
                        return;
                    var index = stylesController.elements.indexOf(component.el);
                    stylesController.elements.splice(index, 1);
                    // No elements using the style
                    if (stylesController.elements.length > 0)
                        return;
                    forEach(stylesController.styles, function (style) {
                        return forEach(toArray(DOM.head.children), function (item) {
                            if (item === style)
                                return DOM.head.removeChild(style);
                        });
                    });
                    delete _this.stylesController[component.name];
                });
            }
            catch (error) {
                Logger.error("Error in <" + $name + "></" + $name + "> component.");
                Logger.error(buildError(error));
            }
        };
        if (scriptsAssets.length === 0)
            return compile();
        // Mixing all the scripts
        var localScriptsContent = [], onlineScriptsContent = [], onlineScriptsUrls = [], webRequestChecker = {};
        // Grouping the online scripts and collecting the online url
        forEach(scriptsAssets, function (script) {
            if (script.src == '' || script.innerHTML)
                localScriptsContent.push(script.innerHTML);
            else {
                var path = component.path[0] === '/' ? component.path.substr(1) : component.path;
                script.src = pathResolver(path, script.getAttribute('src') || '');
                onlineScriptsUrls.push(script.src);
            }
        });
        // No online scripts detected
        if (onlineScriptsUrls.length == 0)
            return compile(localScriptsContent.join('\n\n'));
        // Load the online scripts and run it
        return forEach(onlineScriptsUrls, function (url, index) {
            webRequestChecker[url] = true;
            // Getting script content from a web request
            webRequest(url, {
                headers: { "Content-Type": 'text/plain' }
            }).then(function (response) {
                if (!response.ok)
                    throw new Error(response.statusText);
                return response.text();
            }).then(function (text) {
                delete webRequestChecker[url];
                // Adding the scripts according to the defined order
                onlineScriptsContent[index] = text;
                // if there are not web requests compile the element
                if (Object.keys(webRequestChecker).length === 0)
                    return compile(Extend.array(onlineScriptsContent, localScriptsContent).join('\n\n'));
            }).catch(function (error) {
                error.stack = "";
                Logger.error(("Error loading the <script src=\"" + url + "\"></script> in " +
                    "<" + $name + "></" + $name + "> component, remove it in order to be compiled."));
                Logger.log(error);
                _this.addComponentEventAndEmitGlobalEvent('failed', componentElement, component, _this.bouer)
                    .emit();
            });
        });
    };
    return ComponentHandler;
}());

var CommentHandler = /** @class */ (function () {
    function CommentHandler(bouer) {
        this.bouer = bouer;
        IoC.Register(this);
    }
    /** Creates a comment with some identifier */
    CommentHandler.prototype.create = function (id) {
        var comment = DOM.createComment('e');
        comment.id = id || code(8);
        return comment;
    };
    return CommentHandler;
}());

var Middleware = /** @class */ (function () {
    function Middleware(bouer) {
        var _this = this;
        this.middlewareConfigContainer = {};
        this.run = function (directive, runnable) {
            var middlewares = _this.middlewareConfigContainer[directive];
            if (!middlewares) {
                return (runnable.default || (function () { }))();
            }
            var index = 0;
            var middleware = middlewares[index];
            var _loop_1 = function () {
                var isNext = false;
                var middlewareAction = middleware[runnable.type];
                if (middlewareAction) {
                    runnable.action(function (config, cbs) {
                        Promise.resolve(middlewareAction(config, function () {
                            isNext = true;
                        }))
                            .then(function (value) { return isNext ? null : cbs.success(value); })
                            .catch(function (error) { return isNext ? null : cbs.fail(error); })
                            .finally(function () { return isNext ? null : cbs.done(); });
                    });
                }
                else {
                    (runnable.default || (function () { }))();
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
        this.register = function (directive, actions) {
            if (!_this.middlewareConfigContainer[directive])
                _this.middlewareConfigContainer[directive] = [];
            var middleware = {};
            actions(function (bind) { return middleware.bind = bind; }, function (update) { return middleware.update = update; });
            _this.middlewareConfigContainer[directive].push(middleware);
        };
        this.bouer = bouer;
        IoC.Register(this);
    }
    return Middleware;
}());

var DataStore = /** @class */ (function () {
    function DataStore(bouer) {
        this.wait = {};
        this.data = {};
        this.req = {};
        this.bouer = bouer;
        IoC.Register(this);
    }
    DataStore.prototype.set = function (key, dataKey, data) {
        if (key === 'wait')
            return Logger.warn("Only “get” is allowed for type of data");
        IoC.Resolve(this.bouer, DataStore)[key][dataKey] = data;
    };
    DataStore.prototype.get = function (key, dataKey, once) {
        var result = IoC.Resolve(this.bouer, DataStore)[key][dataKey];
        if (once === true)
            this.unset(key, dataKey);
        return result;
    };
    DataStore.prototype.unset = function (key, dataKey) {
        delete IoC.Resolve(this.bouer, DataStore)[key][dataKey];
    };
    return DataStore;
}());

var Directive = /** @class */ (function () {
    function Directive(customDirective, compiler, compilerContext) {
        this.$custom = {};
        this.errorMsgEmptyNode = function (node) { return ("Expected an expression in “" + node.nodeName +
            "” and got an <empty string>."); };
        this.errorMsgNodeValue = function (node) {
            var _a;
            return ("Expected an expression in “" + node.nodeName +
                "” and got “" + ((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '') + "”.");
        };
        this.compiler = compiler;
        this.context = compilerContext;
        this.bouer = compiler.bouer;
        this.$custom = customDirective;
        this.evaluator = IoC.Resolve(this.bouer, Evaluator);
        this.delimiter = IoC.Resolve(this.bouer, DelimiterHandler);
        this.binder = IoC.Resolve(this.bouer, Binder);
        this.eventHandler = IoC.Resolve(this.bouer, EventHandler);
        this.comment = new CommentHandler(this.bouer);
    }
    // Helper functions
    Directive.prototype.toOwnerNode = function (node) {
        return node.ownerElement || node.parentNode;
    };
    // Directives
    Directive.prototype.skip = function (node) {
        node.nodeValue = 'true';
    };
    Directive.prototype.if = function (node, data) {
        var _this = this;
        var _a, _b;
        var ownerElement = this.toOwnerNode(node);
        var container = ownerElement.parentElement;
        if (!container)
            return;
        var conditions = [];
        var comment = this.comment.create();
        var nodeName = node.nodeName;
        var execute = function () { };
        if (nodeName === Constants.elseif || nodeName === Constants.else)
            return;
        var currentEl = ownerElement;
        var reactives = [];
        var _loop_1 = function () {
            if (currentEl == null)
                return "break";
            var attr = findAttribute(currentEl, ['e-if', 'e-else-if', 'e-else']);
            if (!attr)
                return "break";
            var firstCondition = conditions[0]; // if it already got an if,
            if (attr.name === 'e-if' && firstCondition && (attr.name === firstCondition.node.name))
                return "break";
            if ((attr.nodeName !== 'e-else') && (trim((_a = attr.nodeValue) !== null && _a !== void 0 ? _a : '') === ''))
                return { value: Logger.error(this_1.errorMsgEmptyNode(attr)) };
            if (this_1.delimiter.run((_b = attr.nodeValue) !== null && _b !== void 0 ? _b : '').length !== 0)
                return { value: Logger.error(this_1.errorMsgNodeValue(attr)) };
            conditions.push({ node: attr, element: currentEl });
            connectNode(currentEl, container);
            connectNode(attr, container);
            if (attr.nodeName === ('e-else')) {
                currentEl.removeAttribute(attr.nodeName);
                return "break";
            }
            // Listening to the property get only if the callback function is defined
            ReactiveEvent.once('AfterGet', function (event) {
                event.onemit = function (reactive) {
                    // Avoiding multiple binding in the same property
                    if (reactives.findIndex(function (item) { return item.reactive.propertyName == reactive.propertyName; }) !== -1)
                        return;
                    reactives.push({ attr: attr, reactive: reactive });
                };
                _this.evaluator.exec({
                    data: data,
                    expression: attr.value,
                    context: _this.context
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
        forEach(reactives, function (item) {
            return _this.binder.binds.push(item.reactive.onChange(function () { return execute(); }, item.attr));
        });
        (execute = function () {
            forEach(conditions, function (chainItem) {
                if (chainItem.element.parentElement) {
                    if (comment.isConnected)
                        container.removeChild(chainItem.element);
                    else
                        container.replaceChild(comment, chainItem.element);
                }
            });
            var conditionalExpression = conditions.map(function (item, index) {
                var $value = item.node.value;
                switch (item.node.name) {
                    case Constants.if: return "if(" + $value + "){ _cb(" + index + "); }";
                    case Constants.elseif: return "else if(" + $value + "){ _cb(" + index + "); }";
                    case Constants.else: return "else{ _cb(" + index + "); }";
                }
            }).join(" ");
            _this.evaluator.exec({
                data: data,
                isReturn: false,
                expression: conditionalExpression,
                context: _this.context,
                aditional: {
                    _cb: function (chainIndex) {
                        var element = conditions[chainIndex].element;
                        container.replaceChild(element, comment);
                        _this.compiler.compile({
                            el: element,
                            data: data,
                            context: _this.context,
                        });
                    }
                }
            });
        })();
    };
    Directive.prototype.show = function (node, data) {
        var _this = this;
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        var execute = function (element) {
            var value = _this.evaluator.exec({
                data: data,
                expression: nodeValue,
                context: _this.context,
            });
            element.style.display = value ? '' : 'none';
        };
        connectNode(node, ownerElement);
        var bindResult = this.binder.create({
            data: data,
            node: node,
            fields: [{ expression: nodeValue, field: nodeValue }],
            context: this.context,
            onUpdate: function () { return execute(ownerElement); }
        });
        execute(ownerElement);
        ownerElement.removeAttribute(bindResult.node.nodeName);
    };
    Directive.prototype.for = function (node, data) {
        var _this = this;
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var container = ownerElement.parentElement;
        if (!container)
            return;
        var comment = this.comment.create();
        var nodeName = node.nodeName;
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        var listedItems = [];
        var execute = function () { };
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
            return Logger.error("Expected a valid “for” expression in “" + nodeName + "” and got “" + nodeValue + "”."
                + "\nValid: e-for=\"item of items\".");
        // Binding the e-for if got delimiters
        var delimiters = this.delimiter.run(nodeValue);
        if (delimiters.length !== 0)
            this.binder.create({
                data: data,
                fields: delimiters,
                isReplaceProperty: true,
                node: node,
                context: this.context,
                onUpdate: function () { return execute(); }
            });
        ownerElement.removeAttribute(nodeName);
        var forItem = ownerElement.cloneNode(true);
        container.replaceChild(comment, ownerElement);
        connectNode(forItem, comment);
        connectNode(node, comment);
        var $where = function (list, filterConfigParts) {
            var whereValue = filterConfigParts[1];
            var whereKeys = filterConfigParts[2];
            if (isNull(whereValue) || whereValue === '') {
                Logger.error("Invalid where-value in “" + nodeName + "” with “" + nodeValue + "” expression.");
                return list;
            }
            whereValue = _this.evaluator.exec({
                data: data,
                expression: whereValue,
                context: _this.context
            });
            // where:myFilter
            if (typeof whereValue === 'function') {
                list = whereValue(list);
            }
            else {
                // where:search:name
                if (isNull(whereKeys) || whereKeys === '') {
                    Logger.error(("Invalid where-keys in “" + nodeName + "” with “" + nodeValue + "” expression, " +
                        "at least one where-key to be provided."));
                    return list;
                }
                var newListCopy_1 = [];
                forEach(list, function (item) {
                    for (var _i = 0, _a = whereKeys.split(',').map(function (m) { return trim(m); }); _i < _a.length; _i++) {
                        var prop = _a[_i];
                        var propValue = _this.evaluator.exec({
                            data: item,
                            expression: prop,
                            context: _this.context
                        });
                        if (!toStr(propValue).includes(whereValue))
                            break;
                        newListCopy_1.push(item);
                    }
                });
                list = newListCopy_1;
            }
            return list;
        };
        var $order = function (list, type, prop) {
            if (!type)
                type = 'asc';
            return list.sort(function (a, b) {
                var comparison = function (asc, desc) {
                    if (isNull(asc) || isNull(desc))
                        return 0;
                    switch (toLower(type)) {
                        case 'asc': return asc ? 1 : -1;
                        case 'desc': return desc ? -1 : 1;
                        default:
                            Logger.log("The “" + type + "” order type is invalid: “" + nodeValue +
                                "”. Available types are: “asc”  for order ascendent and “desc” for order descendent.");
                            return 0;
                    }
                };
                if (!prop)
                    return comparison(a > b, b < a);
                return comparison(a[prop] > b[prop], b[prop] < a[prop]);
            });
        };
        // Builds the expression to object
        var builder = function (expression) {
            var filters = expression.split('|').map(function (item) { return trim(item); });
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
            var leftHandParts = leftHand.split(',').map(function (x) { return trim(x); });
            var isForOf = trim(forSeparator) === 'of';
            var iterable = isForOf ? rightHand : "Object.keys(" + rightHand + ")";
            var sourceValue = _this.evaluator.exec({
                data: data,
                expression: rightHand,
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
        var reactivePropertyEvent = ReactiveEvent.on('AfterGet', function (reactive) { return _this.binder.binds.push(reactive.onChange(function () { return execute(); }, node)); });
        var expObj = builder(nodeValue);
        reactivePropertyEvent.off();
        (execute = function () {
            var _a;
            expObj = expObj || builder(trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : ''));
            var iterable = expObj.iterableExpression, leftHandParts = expObj.leftHandParts, sourceValue = expObj.sourceValue, isForOf = expObj.isForOf, filters = expObj.filters;
            // Cleaning the
            forEach(listedItems, function (item) {
                if (!item.parentElement)
                    return;
                container.removeChild(item);
            });
            listedItems = [];
            _this.evaluator.exec({
                data: data,
                isReturn: false,
                context: _this.context,
                expression: "_for(_filters(" + iterable + "), ($$itm, $$idx) => { _each($$itm, $$idx); })",
                aditional: {
                    _for: forEach,
                    _each: function (item, index) {
                        var forData = Extend.obj(data);
                        var _item_key = leftHandParts[0];
                        var _index_or_value = leftHandParts[1] || '_index_or_value';
                        var _index = leftHandParts[2] || '_for_in_index';
                        forData[_item_key] = item;
                        forData[_index_or_value] = isForOf ? index : sourceValue[item];
                        forData[_index] = index;
                        var clonedItem = container.insertBefore(forItem.cloneNode(true), comment);
                        _this.compiler.compile({
                            el: clonedItem,
                            data: forData,
                            context: _this.context,
                            onDone: function (el) { return _this.eventHandler.emit({
                                eventName: Constants.builtInEvents.add,
                                attachedNode: el,
                                once: true
                            }); }
                        });
                        listedItems.push(clonedItem);
                    },
                    _filters: function (list) {
                        var listCopy = Extend.array(list);
                        var findFilter = function (fName) {
                            return filters.find(function (item) { return item.substr(0, fName.length) === fName; });
                        };
                        // applying where:
                        var filterConfig = findFilter('where');
                        if (filterConfig) {
                            var whereConfigParts = filterConfig.split(':').map(function (item) { return trim(item); });
                            if (whereConfigParts.length == 1) {
                                Logger.error(("Invalid “" + nodeName + "” where expression “" + nodeValue +
                                    "”, at least a where-value and where-keys, or a filter-function must be provided"));
                            }
                            else {
                                listCopy = $where(listCopy, whereConfigParts);
                            }
                        }
                        // applying order:
                        var orderConfig = findFilter('order');
                        if (orderConfig) {
                            var orderConfigParts = orderConfig.split(':').map(function (item) { return trim(item); });
                            if (orderConfigParts.length == 1) {
                                Logger.error(("Invalid “" + nodeName + "” order  expression “" + nodeValue +
                                    "”, at least the order type must be provided"));
                            }
                            else {
                                listCopy = $order(listCopy, orderConfigParts[1], orderConfigParts[2]);
                            }
                        }
                        return listCopy;
                    }
                }
            });
            expObj = null;
        })();
    };
    Directive.prototype.def = function (node, data) {
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        var inputData = this.evaluator.exec({
            data: data,
            expression: nodeValue,
            context: this.context
        });
        if (!isObject(inputData))
            return Logger.error(("Expected a valid Object Literal expression in “"
                + node.nodeName + "” and got “" + nodeValue + "”."));
        this.bouer.set(inputData, data);
        ownerElement.removeAttribute(node.nodeName);
    };
    Directive.prototype.content = function (node) {
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        ownerElement.innerText = nodeValue;
        ownerElement.removeAttribute(node.nodeName);
    };
    Directive.prototype.bind = function (node, data) {
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        this.binder.create({
            node: connectNode(node, ownerElement),
            fields: [{ field: nodeValue, expression: nodeValue }],
            context: this.context,
            data: data
        });
        ownerElement.removeAttribute(node.nodeName);
    };
    Directive.prototype.property = function (node, data) {
        var _this = this;
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        var execute = function (obj) { };
        var errorInvalidValue = function (node) {
            var _a;
            return ("Invalid value, expected an Object/Object Literal in “" + node.nodeName
                + "” and got “" + ((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '') + "”.");
        };
        if (nodeValue === '')
            return Logger.error(errorInvalidValue(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return;
        var inputData = this.evaluator.exec({
            data: data,
            expression: nodeValue,
            context: this.context
        });
        if (!isObject(inputData))
            return Logger.error(errorInvalidValue(node));
        this.binder.create({
            data: data,
            node: connectNode(node, ownerElement),
            isReplaceProperty: false,
            fields: [{ expression: nodeValue, field: nodeValue }],
            context: this.context,
            onUpdate: function () { return execute(_this.evaluator.exec({
                data: data,
                expression: nodeValue,
                context: _this.context
            })); }
        });
        ownerElement.removeAttribute(node.nodeName);
        (execute = function (obj) {
            var attrNameToSet = node.nodeName.substr(Constants.property.length);
            var attr = ownerElement.attributes[attrNameToSet];
            if (!attr) {
                (ownerElement.setAttribute(attrNameToSet, ''));
                attr = ownerElement.attributes[attrNameToSet];
            }
            forEach(Object.keys(obj), function (key) {
                /* if has a falsy value remove the key */
                if (!obj[key])
                    return attr.value = trim(attr.value.replace(key, ''));
                attr.value = (attr.value.includes(key) ? attr.value : trim(attr.value + ' ' + key));
            });
            if (attr.value === '')
                return ownerElement.removeAttribute(attrNameToSet);
        })(inputData);
    };
    Directive.prototype.data = function (node, data) {
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error("The “data” attribute cannot contain delimiter.");
        ownerElement.removeAttribute(node.nodeName);
        var inputData = {};
        var mData = Extend.obj(data, { $data: data });
        var reactiveEvent = ReactiveEvent.on('AfterGet', function (reactive) {
            inputData[reactive.propertyName] = undefined;
            defineProperty(inputData, reactive.propertyName, reactive);
        });
        // If data value is empty gets the main scope value
        if (nodeValue === '')
            inputData = Extend.obj(this.bouer.data);
        else {
            // Other wise, compiles the object provided
            var mInputData_1 = this.evaluator.exec({
                data: mData,
                expression: nodeValue,
                context: this.context
            });
            if (!isObject(mInputData_1))
                return Logger.error(("Expected a valid Object Literal expression in “" + node.nodeName +
                    "” and got “" + nodeValue + "”."));
            // Adding all non-existing properties
            forEach(Object.keys(mInputData_1), function (key) {
                if (!(key in inputData))
                    inputData[key] = mInputData_1[key];
            });
        }
        ReactiveEvent.off('AfterGet', reactiveEvent.callback);
        var dataKey = node.nodeName.split(':')[1];
        if (dataKey) {
            dataKey = dataKey.replace(/\[|\]/g, '');
            IoC.Resolve(this.bouer, DataStore).set('data', dataKey, inputData);
        }
        Reactive.transform({
            context: this.context,
            inputObject: inputData
        });
        return this.compiler.compile({
            data: inputData,
            el: ownerElement,
            context: this.context,
        });
    };
    Directive.prototype.href = function (node, data) {
        var _this = this;
        var _a, _b;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        ownerElement.removeAttribute(node.nodeName);
        var usehash = (_b = (this.bouer.config || {}).usehash) !== null && _b !== void 0 ? _b : true;
        var routeToSet = urlCombine((usehash ? '#' : ''), nodeValue);
        ownerElement.setAttribute('href', routeToSet);
        var href = ownerElement.attributes['href'];
        var delimiters = this.delimiter.run(nodeValue);
        if (delimiters.length !== 0)
            this.binder.create({
                data: data,
                node: connectNode(href, ownerElement),
                context: this.context,
                fields: delimiters
            });
        ownerElement
            .addEventListener('click', function (event) {
            event.preventDefault();
            IoC.Resolve(_this.bouer, Routing)
                .navigate(href.value);
        }, false);
    };
    Directive.prototype.entry = function (node, data) {
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        ownerElement.removeAttribute(node.nodeName);
        IoC.Resolve(this.bouer, ComponentHandler)
            .prepare([
            {
                name: nodeValue,
                template: ownerElement.outerHTML,
                data: data
            }
        ]);
    };
    Directive.prototype.put = function (node, data) {
        var _this = this;
        var _a, _b;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        var execute = function () { };
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node), "Direct <empty string> injection value is not allowed.");
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error("Expected an expression with no delimiter in “"
                + node.nodeName + "” and got “" + ((_b = node.nodeValue) !== null && _b !== void 0 ? _b : '') + "”.");
        this.binder.create({
            data: data,
            node: connectNode(node, ownerElement),
            fields: [{ expression: nodeValue, field: nodeValue }],
            context: this.context,
            isReplaceProperty: false,
            onUpdate: function () { return execute(); }
        });
        ownerElement.removeAttribute(node.nodeName);
        (execute = function () {
            var _a;
            ownerElement.innerHTML = '';
            nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            if (nodeValue === '')
                return;
            var componentElement = createAnyEl(nodeValue)
                .appendTo(ownerElement)
                .build();
            IoC.Resolve(_this.bouer, ComponentHandler)
                .order(componentElement, data);
        })();
    };
    Directive.prototype.req = function (node, data) {
        var _this = this;
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeName = node.nodeName;
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
            return Logger.error(("Expected a valid “for” expression in “" + nodeName
                + "” and got “" + nodeValue + "”." + "\nValid: e-req=\"item of [url]\"."));
        // If it's list request type, connect ownerNode
        if (nodeValue.includes(' of '))
            connectNode(ownerElement, ownerElement.parentNode);
        connectNode(node, ownerElement);
        var delimiters = this.delimiter.run(nodeValue);
        var localDataStore = {};
        var onInsertOrUpdate = function () { };
        var onUpdate = function () { };
        var binderConfig = {
            node: node,
            data: data,
            nodeName: nodeName,
            nodeValue: nodeValue,
            fields: delimiters,
            parent: ownerElement,
            value: nodeValue
        };
        if (delimiters.length !== 0)
            binderConfig = this.binder.create({
                data: data,
                node: node,
                context: this.context,
                fields: delimiters,
                isReplaceProperty: false,
                onUpdate: function () { return onUpdate(); }
            });
        ownerElement.removeAttribute(node.nodeName);
        var subcribeEvent = function (eventName) {
            var attr = ownerElement.attributes[Constants.on + eventName];
            if (attr)
                _this.eventHandler.handle(attr, data, _this.context);
            return {
                emit: function (detailObj) {
                    _this.eventHandler.emit({
                        attachedNode: ownerElement,
                        eventName: eventName,
                        init: {
                            detail: detailObj
                        },
                    });
                }
            };
        };
        var builder = function (expression) {
            var filters = expression.split('|').map(function (item) { return trim(item); });
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
        var isValidResponse = function (response, requestType) {
            if (!response) {
                Logger.error(("the return must be an object containing " +
                    "“data” property. Example: { data: {} | [] }"));
                return false;
            }
            if (!("data" in response)) {
                Logger.error(("the return must contain the “data” " +
                    "property. Example: { data: {} | [] }"));
                return false;
            }
            if ((requestType === 'of' && !Array.isArray(response.data))) {
                Logger.error(("Using e-ref=\"... “of” ...\" the response must be a " +
                    "list of items, and got “" + typeof response.data + "”."));
                return false;
            }
            if ((requestType === 'as' && !(typeof response.data === 'object'))) {
                Logger.error(("Using e-ref=\"... “as” ...\" the response must be a list " +
                    "of items, and got “" + typeof response.data + "”."));
                return false;
            }
            return true;
        };
        var middleware = IoC.Resolve(this.bouer, Middleware);
        var requestEvent = subcribeEvent(Constants.builtInEvents.request);
        var responseEvent = subcribeEvent(Constants.builtInEvents.response);
        var failEvent = subcribeEvent(Constants.builtInEvents.fail);
        var doneEvent = subcribeEvent(Constants.builtInEvents.done);
        var dataKey = (node.nodeName.split(':')[1] || '').replace(/\[|\]/g, '');
        (onInsertOrUpdate = function () {
            var expObject = builder(trim(node.nodeValue || ''));
            var responseHandler = function (response) {
                var _a;
                if (!isValidResponse(response, expObject.type))
                    return;
                Reactive.transform({
                    context: _this.context,
                    inputObject: response
                });
                responseEvent.emit({
                    response: response
                });
                // Handle Content Insert/Update
                if (!('data' in localDataStore)) {
                    // Store the data
                    localDataStore.data = undefined;
                    transferProperty(localDataStore, response, 'data');
                }
                else {
                    // Update de local data
                    return localDataStore.data = response.data;
                }
                if (dataKey)
                    IoC.Resolve(_this.bouer, DataStore).set('req', dataKey, response);
                if (expObject.type === 'as') {
                    // Removing the: “(...)”  “,”  and getting only the variable
                    var variable = trim(expObject.variables.split(',')[0].replace(/\(|\)/g, ''));
                    return _this.compiler.compile({
                        el: ownerElement,
                        data: Extend.obj((_a = {}, _a[variable] = response.data, _a), data),
                        context: _this.context,
                        onDone: function (_, inData) {
                            subcribeEvent(Constants.builtInEvents.compile)
                                .emit({
                                data: inData
                            });
                        }
                    });
                }
                if (expObject.type === 'of') {
                    var forDirectiveContent = expObject.expression.replace(expObject.path, '_response_');
                    ownerElement.setAttribute(Constants.for, forDirectiveContent);
                    data._response_ = undefined;
                    defineProperty(data, '_response_', getDescriptor(response, 'data'));
                    return _this.compiler.compile({
                        el: ownerElement,
                        data: data,
                        context: _this.context,
                        onDone: function (_, inData) {
                            subcribeEvent(Constants.builtInEvents.compile)
                                .emit({
                                data: inData
                            });
                        }
                    });
                }
            };
            requestEvent.emit();
            middleware.run('req', {
                type: 'bind',
                action: function (middleware) {
                    var context = {
                        binder: binderConfig,
                        detail: {
                            requestType: expObject.type,
                            requestPath: expObject.path,
                            reponseData: localDataStore
                        }
                    };
                    var cbs = {
                        success: function (response) {
                            responseHandler(response);
                        },
                        fail: function (error) { return failEvent.emit({
                            error: error
                        }); },
                        done: function () { return doneEvent.emit(); }
                    };
                    middleware(context, cbs);
                }
            });
        })();
        onUpdate = function () {
            var expObject = builder(trim(node.nodeValue || ''));
            middleware.run('req', {
                type: 'update',
                default: function () {
                    onInsertOrUpdate();
                },
                action: function (middleware) {
                    var context = {
                        binder: binderConfig,
                        detail: {
                            requestType: expObject.type,
                            requestPath: expObject.path,
                            reponseData: localDataStore
                        }
                    };
                    var cbs = {
                        success: function (response) {
                            if (!isValidResponse(response, expObject.type))
                                return;
                            localDataStore.data = response.data;
                        },
                        fail: function (error) { return failEvent.emit({
                            error: error
                        }); },
                        done: function () { return doneEvent.emit(); }
                    };
                    middleware(context, cbs);
                }
            });
        };
    };
    Directive.prototype.wait = function (node) {
        var _this = this;
        var _a;
        var ownerElement = this.toOwnerNode(node);
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        ownerElement.removeAttribute(node.nodeName);
        var dataStore = IoC.Resolve(this.bouer, DataStore);
        var mWait = dataStore.wait[nodeValue];
        if (mWait) {
            mWait.nodes.push(ownerElement);
            // No data exposed yet
            if (!mWait.data)
                return;
            // Compile all the waiting nodes
            return forEach(mWait.nodes, function (nodeWaiting) {
                _this.compiler.compile({
                    el: nodeWaiting,
                    data: Reactive.transform({
                        context: _this.context,
                        inputObject: mWait.data
                    }),
                    context: _this.context,
                });
            });
        }
        return dataStore.wait[nodeValue] = { nodes: [ownerElement] };
    };
    Directive.prototype.custom = function (node, data) {
        var _a, _b, _c;
        var ownerElement = this.toOwnerNode(node);
        var nodeName = node.nodeName;
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        var delimiters = this.delimiter.run(nodeValue);
        var $directiveConfig = this.$custom[nodeName];
        var bindConfig = this.binder.create({
            data: data,
            node: connectNode(node, ownerElement),
            fields: delimiters,
            isReplaceProperty: false,
            context: this.context,
            onUpdate: function () {
                if (typeof $directiveConfig.update === 'function')
                    $directiveConfig.update(node, bindConfig);
            }
        });
        if ((_b = $directiveConfig.removable) !== null && _b !== void 0 ? _b : true)
            ownerElement.removeAttribute(nodeName);
        var modifiers = nodeName.split('.');
        modifiers.shift();
        // my-custom-dir:arg.mod1.mod2
        var argument = (nodeName.split(':')[1] || '').split('.')[0];
        bindConfig.modifiers = modifiers;
        bindConfig.argument = argument;
        if (typeof $directiveConfig.bind === 'function')
            return (_c = $directiveConfig.bind(node, bindConfig)) !== null && _c !== void 0 ? _c : false;
        return false;
    };
    Directive.prototype.skeleton = function (node) {
        var _a;
        var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        if (nodeValue !== '')
            return;
        var ownerElement = this.toOwnerNode(node);
        ownerElement.removeAttribute(node.nodeName);
    };
    return Directive;
}());

var Compiler = /** @class */ (function () {
    function Compiler(bouer, appOptions) {
        this.NODES_TO_IGNORE_IN_COMPILATION = {
            'SCRIPT': 1,
            '#comment': 8
        };
        this.bouer = bouer;
        this.bouerOptions = appOptions;
        this.binder = IoC.Resolve(this.bouer, Binder);
        this.delimiter = IoC.Resolve(this.bouer, DelimiterHandler);
        this.eventHandler = IoC.Resolve(this.bouer, EventHandler);
        this.component = IoC.Resolve(this.bouer, ComponentHandler);
        IoC.Register(this);
    }
    Compiler.prototype.compile = function (options) {
        var _this = this;
        var rootElement = options.el;
        var context = options.context || this.bouer;
        var data = (options.data || this.bouer.data);
        if (!this.analize(rootElement.outerHTML))
            return rootElement;
        var directive = new Directive(this.bouerOptions.directives || {}, this, context);
        var walker = function (node, data) {
            if (node.nodeName in _this.NODES_TO_IGNORE_IN_COMPILATION)
                return;
            // First Element Attributes compilation
            if (node instanceof Element) {
                // e-skip" directive
                if (Constants.skip in node.attributes)
                    return directive.skip(node);
                if (node.localName === Constants.slot && options.componentSlot) {
                    var insertSlot_1 = function (slot, reference) {
                        var $walker = function (child) {
                            var cloned = child.cloneNode(true);
                            rootElement.insertBefore(cloned, reference);
                            walker(cloned, data);
                        };
                        if (slot.nodeName === 'SLOTCONTAINER')
                            forEach(toArray(slot.childNodes), function (child) { return $walker(child); });
                        else
                            $walker(slot);
                        rootElement.removeChild(reference);
                    };
                    if (node.hasAttribute('default')) {
                        // In case of default slot insertion
                        return insertSlot_1(options.componentSlot, node);
                    }
                    else if (node.hasAttribute('name')) {
                        // In case of target slot insertion
                        var target_1 = node.attributes['name'];
                        return (function innerWalker(element) {
                            var slotValue = element.getAttribute(Constants.slot);
                            if (slotValue && slotValue === target_1.value) {
                                element.removeAttribute(Constants.slot);
                                return insertSlot_1(element, node);
                            }
                            if (element.children.length === 0)
                                return null;
                            forEach(toArray(element.children), function (child) {
                                innerWalker(child);
                            });
                        })(options.componentSlot);
                    }
                }
                // e-def="{...}" directive
                if (Constants.def in node.attributes)
                    directive.def(node.attributes[Constants.def], data);
                // e-entry="..." directive
                if (Constants.entry in node.attributes)
                    directive.entry(node.attributes[Constants.entry], data);
                // wait-data="..." directive
                if (Constants.wait in node.attributes)
                    return directive.wait(node.attributes[Constants.wait]);
                // <component></component>
                if (_this.component.check(node.localName))
                    return _this.component.order(node, data);
                // e-for="..." directive
                if (Constants.for in node.attributes)
                    return directive.for(node.attributes[Constants.for], data);
                // e-if="..." directive
                if (Constants.if in node.attributes)
                    return directive.if(node.attributes[Constants.if], data);
                // e-else-if="..." or e-else directive
                if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
                    Logger.warn('The "' + Constants.elseif + '" or "' + Constants.else + '" requires an element with "' + Constants.if + '" above.');
                // e-show="..." directive
                if (Constants.show in node.attributes)
                    directive.show(node.attributes[Constants.show], data);
                // e-req="..." | e-req:[id]="..."  directive
                var reqNode = null;
                if ((reqNode = node.attributes[Constants.req]) ||
                    (reqNode = toArray(node.attributes).find(function (attr) { return Constants.check(attr, Constants.req); })))
                    return directive.req(reqNode, data);
                // data="..." | data:[id]="..." directive
                var dataNode = null;
                if (dataNode = toArray(node.attributes).find(function (attr) {
                    var attrName = attr.name;
                    // In case of data="..."
                    if (attrName === Constants.data)
                        return true;
                    // In case of data:[data-id]="..."
                    return startWith(attrName, Constants.data + ':');
                }))
                    return directive.data(dataNode, data);
                // put="..." directive
                if (Constants.put in node.attributes)
                    return directive.put(node.attributes[Constants.put], data);
                // Looping the attributes
                forEach(toArray(node.attributes), function (attr) {
                    walker(attr, data);
                });
            }
            // :href="..." or !href="..." directive
            if (Constants.check(node, Constants.href))
                return directive.href(node, data);
            // e-content="..." directive
            if (Constants.check(node, Constants.content))
                return directive.content(node);
            // e-bind:[?]="..." directive
            if (Constants.check(node, Constants.bind))
                return directive.bind(node, data);
            // Custom directive
            if (Object.keys(directive.$custom).find(function (name) { return Constants.check(node, name); }))
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
                return _this.eventHandler.handle(node, data, context);
            // Property binding
            var delimitersFields;
            if (isString(node.nodeValue) && (delimitersFields = _this.delimiter.run(node.nodeValue)) && delimitersFields.length !== 0) {
                _this.binder.create({
                    node: connectNode(node, rootElement),
                    fields: delimitersFields,
                    context: context,
                    data: data
                });
            }
            forEach(toArray(node.childNodes), function (childNode) {
                return walker(childNode, data);
            });
        };
        walker(rootElement, data);
        if (rootElement.hasAttribute(Constants.silent))
            rootElement.removeAttribute(Constants.silent);
        if (isFunction(options.onDone))
            options.onDone.call(context, rootElement);
        return rootElement;
    };
    Compiler.prototype.analize = function (htmlSnippet) {
        return true;
    };
    return Compiler;
}());

var Binder = /** @class */ (function () {
    function Binder(bouer) {
        this.binds = [];
        this.DEFAULT_BINDER_PROPERTIES = {
            'text': 'value',
            'number': 'valueAsNumber',
            'checkbox': 'checked',
            'radio': 'value'
        };
        this.BindingDirection = {
            fromInputToData: 'fromInputToData',
            fromDataToInput: 'fromDataToInput'
        };
        this.bouer = bouer;
        this.evaluator = IoC.Resolve(this.bouer, Evaluator);
        IoC.Register(this);
        this.cleanup();
    }
    Binder.prototype.create = function (options) {
        var _this = this;
        var _a;
        var node = options.node, data = options.data, fields = options.fields, isReplaceProperty = options.isReplaceProperty, context = options.context;
        var originalValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
        var originalName = node.nodeName;
        var ownerElement = node.ownerElement || node.parentNode;
        var middleware = IoC.Resolve(this.bouer, Middleware);
        var onUpdate = options.onUpdate || (function (v, n) { });
        // Clousure cache property settings
        var propertyBindConfig = {
            node: node,
            data: data,
            nodeName: originalName,
            nodeValue: originalValue,
            fields: fields,
            parent: ownerElement,
            value: ''
        };
        var $runDirectiveMiddlewares = function (type) {
            middleware.run(originalName, {
                type: type,
                action: function (middleware) {
                    middleware({
                        binder: propertyBindConfig,
                        detail: {}
                    }, {
                        success: function () { },
                        fail: function () { },
                        done: function () { }
                    });
                }
            });
        };
        // Two-Way Data Binding: e-bind:[?]="..."
        if (originalName.substr(0, Constants.bind.length) === Constants.bind) {
            var propertyNameToBind_1 = '';
            var binderTarget_1 = ownerElement.type || ownerElement.localName;
            if (Constants.bind === originalName)
                propertyNameToBind_1 = this.DEFAULT_BINDER_PROPERTIES[binderTarget_1] || 'value';
            else
                propertyNameToBind_1 = originalName.split(':')[1]; // e-bind:value -> value
            var isSelect_1 = ownerElement instanceof HTMLSelectElement;
            var isSelectMultiple_1 = isSelect_1 && ownerElement.multiple === true;
            var modelAttribute = findAttribute(ownerElement, [':value'], true);
            var dataBindModel_1 = modelAttribute ? modelAttribute.value : "\"" + ownerElement.value + "\"";
            var dataBindProperty_1 = trim(originalValue);
            var boundPropertyValue_1;
            var boundModelValue_1;
            var callback_1 = function (direction, value) {
                if (isSelect_1 && !isSelectMultiple_1 && Array.isArray(boundPropertyValue_1) && !dataBindModel_1) {
                    return Logger.error("Since it's a <select> array binding, it expects the “multiple” attribute in" +
                        " order to bind the multiple values.");
                }
                // Array Binding
                if (!isSelectMultiple_1 && (Array.isArray(boundPropertyValue_1) && !dataBindModel_1)) {
                    return Logger.error("Since it's an array binding it expects a model but it has not been defined" +
                        ", provide a model as it follows: value=\"String-Model\" or :value=\"Object-Model\".");
                }
                var $set = {
                    fromDataToInput: function () {
                        // Normal Property Set
                        if (!Array.isArray(boundPropertyValue_1)) {
                            // In case of radio button we need to check if the value is the same to check it
                            if (binderTarget_1 === 'radio')
                                return ownerElement.checked = ownerElement[propertyNameToBind_1] == value;
                            // Default Binding
                            return ownerElement[propertyNameToBind_1] = (isObject(value) ? toStr(value) : (isNull(value) ? '' : value));
                        }
                        // Array Set
                        boundModelValue_1 = boundModelValue_1 || _this.evaluator.exec({
                            data: data,
                            expression: dataBindModel_1,
                            context: context
                        });
                        // select-multiple handling
                        if (isSelectMultiple_1) {
                            return forEach(toArray(ownerElement.options), function (option) {
                                option.selected = boundPropertyValue_1.indexOf(trim(option.value)) !== -1;
                            });
                        }
                        // checkboxes, radio, etc
                        if (boundPropertyValue_1.indexOf(boundModelValue_1) === -1) {
                            switch (typeof ownerElement[propertyNameToBind_1]) {
                                case 'boolean':
                                    ownerElement[propertyNameToBind_1] = false;
                                    break;
                                case 'number':
                                    ownerElement[propertyNameToBind_1] = 0;
                                    break;
                                default:
                                    ownerElement[propertyNameToBind_1] = "";
                                    break;
                            }
                        }
                    },
                    fromInputToData: function () {
                        // Normal Property Set
                        if (!Array.isArray(boundPropertyValue_1)) {
                            // Default Binding
                            return data[dataBindProperty_1] = value;
                        }
                        // Array Set
                        boundModelValue_1 = boundModelValue_1 || _this.evaluator.exec({
                            data: data,
                            expression: dataBindModel_1,
                            context: context
                        });
                        // select-multiple handling
                        if (isSelectMultiple_1) {
                            var optionCollection_1 = [];
                            forEach(toArray(ownerElement.options), function (option) {
                                if (option.selected === true)
                                    optionCollection_1.push(trim(option.value));
                            });
                            boundPropertyValue_1.splice(0, boundPropertyValue_1.length);
                            return boundPropertyValue_1.push.apply(boundPropertyValue_1, optionCollection_1);
                        }
                        if (value)
                            boundPropertyValue_1.push(boundModelValue_1);
                        else
                            boundPropertyValue_1.splice(boundPropertyValue_1.indexOf(boundModelValue_1), 1);
                    }
                };
                return $set[direction]();
            };
            ReactiveEvent.once('AfterGet', function (evt) {
                // Adding the event on emittion
                evt.onemit = function (reactive) {
                    _this.binds.push(reactive.onChange(function (value) {
                        callback_1(_this.BindingDirection.fromDataToInput, value);
                        onUpdate(value, node);
                        $runDirectiveMiddlewares('update');
                    }, node));
                };
                // calling the main event
                boundPropertyValue_1 = _this.evaluator.exec({
                    data: data,
                    expression: dataBindProperty_1,
                    context: context
                });
            });
            callback_1(this.BindingDirection.fromDataToInput, boundPropertyValue_1);
            var listeners = ['input', 'propertychange', 'change'];
            if (!listeners.includes(ownerElement.localName))
                listeners.push(ownerElement.localName);
            // Applying the events
            forEach(listeners, function (listener) {
                if (listener === 'change' && ownerElement.localName !== 'select')
                    return;
                ownerElement.addEventListener(listener, function () {
                    callback_1(_this.BindingDirection.fromInputToData, ownerElement[propertyNameToBind_1]);
                }, false);
            });
            // Removing the e-bind attr
            ownerElement.removeAttribute(node.nodeName);
            $runDirectiveMiddlewares('bind');
            return propertyBindConfig; // Stop Two-Way Data Binding Process
        }
        // One-Way Data Binding
        var nodeToBind = node;
        // If definable property e-[?]="..."
        if (originalName.substr(0, Constants.property.length) === Constants.property && isNull(isReplaceProperty)) {
            propertyBindConfig.nodeName = originalName.substr(Constants.property.length);
            ownerElement.setAttribute(propertyBindConfig.nodeName, originalValue);
            nodeToBind = ownerElement.attributes[propertyBindConfig.nodeName];
            // Removing the e-[?] attr
            ownerElement.removeAttribute(node.nodeName);
        }
        // Property value setter
        var setter = function () {
            var valueToSet = propertyBindConfig.nodeValue;
            var isHtml = false;
            // Looping all the fields to be setted
            forEach(fields, function (field) {
                var delimiter = field.delimiter;
                if (delimiter && delimiter.name === 'html')
                    isHtml = true;
                var result = _this.evaluator.exec({
                    data: data,
                    expression: field.expression,
                    context: context
                });
                result = isNull(result) ? '' : result;
                valueToSet = valueToSet.replace(field.field, toStr(result));
                if (delimiter && isFunction(delimiter.action))
                    valueToSet = delimiter.action(valueToSet, node, data);
            });
            propertyBindConfig.value = valueToSet;
            if (!isHtml)
                nodeToBind.nodeValue = valueToSet;
            else {
                var htmlSnippet = createEl('div', function (el) {
                    el.innerHTML = valueToSet;
                }).build().children[0];
                ownerElement.appendChild(htmlSnippet);
                IoC.Resolve(_this.bouer, Compiler).compile({
                    el: htmlSnippet,
                    data: data,
                    context: context
                });
            }
        };
        ReactiveEvent.once('AfterGet', function (event) {
            event.onemit = function (reactive) {
                _this.binds.push(reactive.onChange(function (value) {
                    setter();
                    onUpdate(value, node);
                    $runDirectiveMiddlewares('update');
                }, node));
            };
            setter();
        });
        propertyBindConfig.node = nodeToBind;
        $runDirectiveMiddlewares('bind');
        return propertyBindConfig;
    };
    Binder.prototype.onPropertyChange = function (propertyName, callback, targetObject) {
        var mWatch = null;
        var mTargetObject = targetObject || this.bouer.data;
        ReactiveEvent.once('AfterGet', function (event) {
            event.onemit = function (reactive) { return mWatch = reactive.onChange(callback); };
            mTargetObject[propertyName];
        });
        return mWatch;
    };
    Binder.prototype.onPropertyInScopeChange = function (watchable) {
        var _this = this;
        var watches = [];
        ReactiveEvent.once('AfterGet', function (evt) {
            evt.onemit = function (reactive) {
                watches.push(reactive.onChange(function () { return watchable.call(_this.bouer, _this.bouer); }));
            };
            watchable.call(_this.bouer, _this.bouer);
        });
        return watches;
    };
    /** Creates a process for unbind properties when it does not exists anymore in the DOM */
    Binder.prototype.cleanup = function () {
        var _this = this;
        Task.run(function () {
            _this.binds = where(_this.binds, function (bind) {
                if (!bind.node)
                    return true;
                if (bind.node.isConnected)
                    return true;
                bind.destroy();
            });
        });
    };
    return Binder;
}());

var Converter = /** @class */ (function () {
    function Converter(bouer) {
        this.bouer = bouer;
        IoC.Register(this);
    }
    Converter.prototype.htmlToJsObj = function (input, options, onSet) {
        var element = undefined;
        var instance = this;
        // If it's not a HTML Element, just return
        if ((input instanceof Element))
            element = input;
        // If the element is an object
        else if (isObject(input))
            return input;
        // If it's a string try to get the element
        else if (isString(input)) {
            try {
                element = this.bouer.el.querySelector(input);
            }
            catch (_a) {
                // Unknown element type
                return input;
            }
        }
        // If the element is not
        if (isNull(element))
            throw Logger.error("Invalid element passed in app.toJsObj(...).");
        options = options || {};
        // Clear [ ] and , and return an array of the names provided
        var mNames = (options.names || '[name]').replace(/\[|\]/g, '').split(',');
        var mValues = (options.values || '[value]').replace(/\[|\]/g, '').split(',');
        var getter = function (el, fieldName) {
            if (fieldName in el)
                return el[fieldName];
            return el.getAttribute(fieldName) || el.innerText;
        };
        var tryGetValue = function (el) {
            var val = undefined;
            mValues.find(function (field) {
                return (val = getter(el, field)) ? true : false;
            });
            return val;
        };
        var objBuilder = function (element) {
            var builtObject = {};
            // Elements that skipped on serialization process
            var escapes = { BUTTON: true };
            var checkables = { checkbox: true, radio: true };
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
                    if (isBuildAsArray) {
                        (propOldValue) ?
                            // Add item to the array
                            builtObject[propName] = Extend.array(propOldValue, value) :
                            // Set the new value
                            builtObject[propName] = [value];
                    }
                    else {
                        (propOldValue) ?
                            // Spread and add properties
                            builtObject[propName] = Extend.array(propOldValue, value) :
                            // Set the new value
                            builtObject[propName] = value;
                    }
                    // Calling on set function
                    if (isFunction(onSet))
                        onSet.call(instance.bouer, builtObject, propName, value, el);
                }
                forEach(toArray(el.children), function (child) {
                    if (!findAttribute(child, [Constants.build]))
                        walker(child);
                });
            })(element);
            return builtObject;
        };
        var builtObject = objBuilder(element);
        var builds = toArray(element.querySelectorAll("[" + Constants.build + "]"));
        forEach(builds, function (buildElement) {
            // Getting the e-build attr value
            var fullPath = getter(buildElement, Constants.build);
            var isBuildAsArray = buildElement.hasAttribute(Constants.array);
            var builderObjValue = objBuilder(buildElement);
            // If the object is empty (has all fields with `null` value)
            if (!isFilledObj(builderObjValue))
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
                            lastLayer[leadElement] = [Extend.obj(objPropertyValue, builderObjValue)];
                        }
                        else if (Array.isArray(objPropertyValue)) {
                            objPropertyValue.push(builderObjValue);
                        }
                        else {
                            lastLayer[leadElement] = [builderObjValue];
                        }
                    }
                    else {
                        isNull(objPropertyValue) ?
                            // Set the new property
                            lastLayer[leadElement] = builderObjValue :
                            // Spread and add the new fields into the object
                            lastLayer[leadElement] = Extend.obj(objPropertyValue, builderObjValue);
                    }
                    if (isFunction(onSet))
                        onSet.call(instance.bouer, lastLayer, leadElement, builderObjValue, buildElement);
                    return;
                }
                if (Array.isArray(objPropertyValue)) {
                    return forEach(objPropertyValue, function (item) {
                        objStructurer(splittedPath.join('.'), item);
                    });
                }
                objStructurer(splittedPath.join('.'), lastLayer[leadElement]);
            })(fullPath, builtObject);
        });
        return builtObject;
    };
    return Converter;
}());

var Skeleton = /** @class */ (function () {
    function Skeleton(bouer) {
        var _this = this;
        this.backgroudColor = '';
        this.waveColor = '';
        this.defaultBackgroudColor = '#E2E2E2';
        this.defaultWaveColor = '#ffffff5d';
        this.identifier = "bouer";
        this.reset();
        this.bouer = bouer;
        this.style = createEl('style', function (el) { return el.id = _this.identifier; }).build();
        IoC.Register(this);
    }
    Skeleton.prototype.reset = function () {
        this.backgroudColor = this.defaultBackgroudColor;
        this.waveColor = this.defaultWaveColor;
    };
    Skeleton.prototype.init = function (color) {
        var _this = this;
        if (!this.style)
            return;
        var dir = Constants.skeleton;
        if (!DOM.getElementById(this.identifier))
            DOM.head.appendChild(this.style);
        if (!this.style.sheet)
            return;
        for (var i = 0; i < this.style.sheet.cssRules.length; i++)
            this.style.sheet.deleteRule(i);
        if (color) {
            this.backgroudColor = color.background || this.defaultBackgroudColor;
            this.waveColor = color.wave || this.defaultWaveColor;
        }
        else {
            this.reset();
        }
        var rules = [
            '[silent]{ display: none!important; }',
            '[' + dir + '] { background-color: ' + this.backgroudColor + '!important; position: relative!important; overflow: hidden; }',
            '[' + dir + '],[' + dir + '] * { color: transparent!important; }',
            '[' + dir + ']::before, [' + dir + ']::after { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: block; }',
            '[' + dir + ']::before { background-color: ' + this.backgroudColor + '!important; z-index: 1;}',
            '[' + dir + ']::after { transform: translateX(-100%); background: linear-gradient(90deg, transparent, ' + this.waveColor
                + ', transparent); animation: loading 1.5s infinite; z-index: 2; }',
            '@keyframes loading { 100% { transform: translateX(100%); } }',
            '@-webkit-keyframes loading { 100% { transform: translateX(100%); } }'
        ];
        forEach(rules, function (rule) { return _this.style.sheet.insertRule(rule); });
    };
    Skeleton.prototype.clear = function (id) {
        id = (id ? ('="' + id + '"') : '');
        var skeletons = toArray(this.bouer.el.querySelectorAll("[" + Constants.skeleton + id + "]"));
        forEach(skeletons, function (el) { return el.removeAttribute(Constants.skeleton); });
    };
    return Skeleton;
}());

var Bouer = /** @class */ (function () {
    /**
     * Default constructor
     * @param selector the selector of the element to be controlled by the instance
     * @param options the options to the instance
     */
    function Bouer(selector, options) {
        var _this_1 = this;
        this.name = 'Bouer';
        this.version = '3.0.0';
        this.dependencies = {};
        this.isDestroyed = false;
        this.__id__ = IoC.GetId();
        /**
         * Gets all the elemens having the `ref` attribute
         * @returns an object having all the elements with the `ref attribute value` defined as the key.
         */
        this.refs = {};
        options = options || {};
        // Applying all the options defined
        this.config = options.config;
        this.dependencies = options.dependencies || {};
        if (isNull(selector) || trim(selector) === '')
            throw Logger.error(new Error('Invalid selector provided to the instance.'));
        var el = DOM.querySelector(selector);
        if (!el)
            throw Logger.error(new SyntaxError("Element with selector “" + selector + "” not found."));
        this.el = el;
        var dataStore = new DataStore(this);
        new Evaluator(this);
        var middleware = new Middleware(this);
        // Register the middleware
        if (typeof options.middleware === 'function')
            options.middleware.call(this, middleware.register, this);
        // Transform the data properties into a reative
        this.data = Reactive.transform({
            inputObject: options.data || {},
            context: this
        });
        this.globalData = Reactive.transform({
            inputObject: options.globalData || {},
            context: this
        });
        var delimiters = options.delimiters || [];
        delimiters.push.apply(delimiters, [
            { name: 'common', delimiter: { open: '{{', close: '}}' } },
            { name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
        ]);
        new Binder(this);
        var delimiter = new DelimiterHandler(delimiters, this);
        var eventHandler = new EventHandler(this);
        var routing = new Routing(this);
        var componentHandler = new ComponentHandler(this);
        var compiler = new Compiler(this, options);
        new Converter(this);
        var skeleton = new Skeleton(this);
        skeleton.init();
        this.$delimiters = {
            add: delimiter.add,
            remove: delimiter.remove,
            get: function () { return delimiter.delimiters.slice(); }
        };
        this.$data = {
            get: function (key) { return key ? dataStore.data[key] : dataStore.data; },
            set: function (key, data, toReactive) {
                if (key in dataStore.data)
                    return Logger.log("There is already a data stored with this key “" + key + "”.");
                if ((toReactive !== null && toReactive !== void 0 ? toReactive : false) === true)
                    Reactive.transform({
                        context: _this_1,
                        inputObject: data
                    });
                return IoC.Resolve(_this_1, DataStore).set('data', key, data);
            },
            unset: function (key) { return delete dataStore.data[key]; }
        };
        this.$req = {
            get: function (key) { return key ? dataStore.req[key] : dataStore.req; },
            unset: function (key) { return delete dataStore.req[key]; },
        };
        this.$wait = {
            get: function (key) { return key ? dataStore.wait[key] : dataStore.wait; },
            set: function (key, data) {
                if (!(key in dataStore.wait))
                    return dataStore.wait[key] = { data: data, nodes: [] };
                var mWait = dataStore.wait[key];
                mWait.data = data;
                return forEach(mWait.nodes, function (node) {
                    if (!node)
                        return;
                    compiler.compile({
                        el: node,
                        data: Reactive.transform({
                            context: _this_1,
                            inputObject: mWait.data
                        }),
                        context: _this_1
                    });
                });
            },
            unset: function (key) { return delete dataStore.wait[key]; },
        };
        this.$skeleton = {
            clear: function (id) { return skeleton.clear(id); },
            set: function (color) { return skeleton.init(color); }
        };
        this.$components = {
            add: function (component) { return componentHandler.prepare([component]); },
            get: function (name) { return componentHandler.components[name]; }
        };
        this.$routing = routing;
        defineProperty(this, 'refs', {
            get: function () {
                var mRefs = {};
                forEach(toArray(_this_1.el.querySelectorAll("[" + Constants.ref + "]")), function (ref) {
                    var mRef = ref.attributes[Constants.ref];
                    var value = trim(mRef.value) || ref.name || '';
                    if (value === '') {
                        return Logger.error("Expected an expression in “" + ref.name +
                            "” or at least “name” attribute to combine with “" + ref.name + "”.");
                    }
                    if (value in mRefs)
                        return Logger.warn("The key “" + value + "” in “" + ref.name + "” is taken, choose another key.", ref);
                    mRefs[value] = ref;
                });
                return mRefs;
            }
        });
        forEach([options.beforeLoad, options.loaded, options.beforeDestroy, options.destroyed], function (evt) {
            if (typeof evt !== 'function')
                return;
            eventHandler.on({
                eventName: evt.name,
                callback: evt,
                attachedNode: el,
                modifiers: { once: true },
                context: _this_1
            });
        });
        eventHandler.emit({
            eventName: 'beforeLoad',
            attachedNode: el
        });
        // Registering all the components
        componentHandler.prepare(options.components || []);
        // compile the app
        compiler.compile({
            el: this.el,
            data: this.data,
            context: this,
            onDone: function () { return eventHandler.emit({
                eventName: 'loaded',
                attachedNode: el
            }); }
        });
        GLOBAL.addEventListener('beforeunload', function () {
            if (_this_1.isDestroyed)
                return;
            eventHandler.emit({
                eventName: 'beforeDestroy',
                attachedNode: el
            });
            _this_1.destroy();
            _this_1.isDestroyed = true;
        }, { once: true });
        Task.run(function (stopTask) {
            if (_this_1.isDestroyed)
                return stopTask();
            if (_this_1.el.isConnected)
                return;
            eventHandler.emit({
                eventName: 'beforeDestroy',
                attachedNode: _this_1.el
            });
            _this_1.destroy();
            stopTask();
            _this_1.isDestroyed = true;
        });
        // Initializing Routing
        routing.init();
        if (!DOM.head.querySelector("link[rel~='icon']")) {
            createEl('link', function (favicon) {
                favicon.rel = 'icon';
                favicon.type = 'image/png';
                favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
            }).appendTo(DOM.head);
        }
    }
    /**
     * Sets data into a target object, by default is the `app.data`
     * @param inputData the data the should be setted
     * @param targetObject the target were the inputData
     * @returns the object with the data setted
     */
    Bouer.prototype.set = function (inputData, targetObject) {
        if (!isObject(inputData)) {
            Logger.error('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".');
            return {};
        }
        if (isObject(targetObject) && targetObject == null) {
            Logger.error('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".');
            return inputData;
        }
        targetObject = targetObject || this.data;
        // Transforming the input
        Reactive.transform({
            inputObject: inputData,
            context: this
        });
        // Transfering the properties
        forEach(Object.keys(inputData), function (key) { return transferProperty(targetObject, inputData, key); });
        return targetObject;
    };
    /**
     * Compiles a `HTML snippet` to a `Object Literal`
     * @param input the input element
     * @param options the options of the compilation
     * @param onSet a function that should be fired when a value is setted
     * @returns the Object Compiled from the HTML
     */
    Bouer.prototype.toJsObj = function (input, options, onSet) {
        return IoC.Resolve(this, Converter).htmlToJsObj(input, options, onSet);
    };
    /**
     * Provides the possibility to watch a property change
     * @param propertyName the property to watch
     * @param callback the function that should be called when the property change
     * @param targetObject the target object having the property to watch
     * @returns the watch object having the method to destroy the watch
     */
    Bouer.prototype.watch = function (propertyName, callback, targetObject) {
        return IoC.Resolve(this, Binder).onPropertyChange(propertyName, callback, targetObject);
    };
    /**
     * Watch all reactive properties in the provided scope.
     * @param watchableScope the function that should be called when the any reactive property change
     * @returns an object having all the watches and the method to destroy watches at once
     */
    Bouer.prototype.react = function (watchableScope) {
        return IoC.Resolve(this, Binder)
            .onPropertyInScopeChange(watchableScope);
    };
    /**
     * Add an Event Listener to the instance or to an object
     * @param eventName the event name to be listening
     * @param callback the callback that should be fired
     * @param attachedNode A node to attach the event
     * @param modifiers An object having all the event modifier
     * @returns The event added
     */
    Bouer.prototype.on = function (eventName, callback, options) {
        return IoC.Resolve(this, EventHandler).
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
     * @param eventName the event name to be listening
     * @param callback the callback that should be fired
     * @param attachedNode A node to attach the event
     */
    Bouer.prototype.off = function (eventName, callback, attachedNode) {
        return IoC.Resolve(this, EventHandler).
            off({
            eventName: eventName,
            callback: callback,
            attachedNode: attachedNode
        });
    };
    /**
     * Dispatch an event
     * @param options options for the emission
     */
    Bouer.prototype.emit = function (eventName, options) {
        var mOptions = (options || {});
        return IoC.Resolve(this, EventHandler).
            emit({
            eventName: eventName,
            attachedNode: mOptions.element,
            init: mOptions.init,
            once: mOptions.once
        });
    };
    /**
     * Limits sequential execution to a single one acording to the milliseconds provided
     * @param callback the callback that should be performed the execution
     * @param wait milliseconds to the be waited before the single execution
     * @returns executable function
     */
    Bouer.prototype.lazy = function (callback, wait) {
        var _this = this;
        var timeout;
        wait = isNull(wait) ? 500 : wait;
        var immediate = arguments[2];
        return function executable() {
            var args = [].slice.call(arguments);
            var later = function () {
                timeout = null;
                if (!immediate)
                    callback.apply(_this, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow)
                callback.apply(_this, args);
        };
    };
    /**
     * Compiles an html element
     * @param options the options of the compilation process
     * @returns
     */
    Bouer.prototype.compile = function (options) {
        return IoC.Resolve(this, Compiler).
            compile({
            el: options.el,
            data: options.data,
            context: options.context,
            onDone: options.onDone
        });
    };
    Bouer.prototype.destroy = function () {
        var el = this.el;
        var destroyedEvents = IoC.Resolve(this, EventHandler)
            .$events['destroyed'] || [];
        this.emit('destroyed', { element: this.el });
        // Dispatching all the destroy events
        forEach(destroyedEvents, function (es) { return es.emit({ once: true }); });
        if (el.tagName == 'body')
            el.innerHTML = '';
        else if (DOM.contains(el))
            DOM.body.removeChild(el);
        IoC.Dispose(this);
    };
    // Hooks
    Bouer.prototype.beforeLoad = function (event) { };
    Bouer.prototype.loaded = function (event) { };
    Bouer.prototype.beforeDestroy = function (event) { };
    Bouer.prototype.destroyed = function (event) { };
    return Bouer;
}());

exports.Component = Component;
exports["default"] = Bouer;
