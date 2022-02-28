/*!
 * Bouer.js v3.0.0
 * Copyright Easy.js 2018-2020 | 2021-2022 Afonso Matumona
 * Released under the MIT License.
 */
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Bouer = factory());
})(this, (function () { 'use strict';

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};
function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

var Prop = /** @class */ (function () {
    function Prop() {
    }
    Prop.set = function (obj, propName, descriptor) {
        Object.defineProperty(obj, propName, descriptor);
        return obj;
    };
    Prop.descriptor = function (obj, propName) {
        return Object.getOwnPropertyDescriptor(obj, propName);
    };
    Prop.transfer = function (destination, source, propName) {
        var descriptor = Prop.descriptor(source, propName);
        var mDst = destination;
        if (!(propName in destination))
            mDst[propName] = undefined;
        Prop.set(destination, propName, descriptor);
    };
    return Prop;
}());

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
function ifNullReturn(v, _return) {
    return isNull(v) ? _return : v;
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
function $CreateComment(id) {
    var comment = DOM.createComment('e');
    comment.id = id || code(8);
    return comment;
}
function $CreateAnyEl(elName, callback) {
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
function $CreateEl(elName, callback) {
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
function $RemoveEl(el) {
    var parent = el.parentNode;
    if (parent)
        parent.removeChild(el);
}
function mapper(source, destination) {
    forEach(Object.keys(source), function (key) {
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
    forEach(uriRemainParts, function (p) { return trim(p) ? partsToJoin.push(p) : null; });
    forEach(parts, function (part) { return forEach(part.split(/\//), function (p) { return trim(p) ? partsToJoin.push(p) : null; }); });
    return protocol + partsToJoin.join('/');
}
/**
 * Relative path resolver
 */
function pathResolver(relative, path) {
    var isCurrentDir = function (v) { return v.substring(0, 2) === './'; };
    var isParentDir = function (v) { return v.substring(0, 3) === '../'; };
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
        return toDirPath(relative).relative + path.substring(1);
    if (isParentDir(path)) {
        var parts_1 = toDirPath(relative).parts;
        parts_1.push((function pathLookUp(value) {
            if (!isParentDir(value))
                return value;
            parts_1.pop();
            return pathLookUp(value.substring(3));
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
var DOM = document;
var GLOBAL = globalThis;
var anchor = $CreateEl('a').build();

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
    check: function (node, cmd) {
        return startWith(node.nodeName, cmd);
    },
    isConstant: function (value) {
        var _this = this;
        return (Object.keys(this).map(function (key) { return _this[key]; }).indexOf(value) !== -1);
    }
};

var Extend = /** @class */ (function () {
    function Extend() {
    }
    /** joins objects into one */
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
                Prop.transfer(out, arg, key);
            });
        });
        return out;
    };
    /** add properties to the first object provided */
    Extend.mixin = function (out) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        // Props to mix with out object
        var props = Extend.obj.apply(this, args);
        forEach(Object.keys(props), function (key) {
            var hasOwnProp = key in out;
            Prop.transfer(out, props, key);
            if (hasOwnProp) {
                var mOut = out;
                mOut[key] = mOut[key];
            }
        });
        return out;
    };
    /** joins arrays into one */
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
                if (Array.isArray(value))
                    [].push.apply(out, value);
                else
                    out.push(value);
            });
        });
        return out;
    };
    return Extend;
}());

var ServiceProvider = /** @class */ (function () {
    /**
     * The default constructor
     * @param app the bouer app having the service that we want
     */
    function ServiceProvider(app) {
        this.app = app;
    }
    /**
     * Register an instance into the service collection
     * @param instance the instance to be store
     */
    ServiceProvider.prototype.add = function (name, instance) {
        ServiceProvider.add(name, instance);
    };
    /**
     * Resolve and Retrieve the instance registered
     * @param app the application
     * @param name the name of the service
     * @returns the instance of the class
     */
    ServiceProvider.prototype.get = function (name) {
        return ServiceProvider.get(this.app, name);
    };
    /**
     * Destroy an instance registered
     * @param key the name of the class registered
     */
    ServiceProvider.prototype.clear = function () {
        return ServiceProvider.clear(this.app);
    };
    ServiceProvider.add = function (name, instance) {
        var _a;
        var objAsAny = instance;
        var bouer = objAsAny.bouer;
        var services;
        if (!(services = ServiceProvider.serviceCollection.get(bouer)))
            return ServiceProvider.serviceCollection.set(bouer, (_a = {},
                _a[name] = instance,
                _a));
        services[name] = instance;
    };
    ServiceProvider.get = function (app, name) {
        if (app.isDestroyed)
            throw new Error("Application already disposed.");
        var services = ServiceProvider.serviceCollection.get(app);
        if (!services)
            throw new Error("Application not registered!");
        return services[name];
    };
    ServiceProvider.clear = function (app) {
        return ServiceProvider.serviceCollection.delete(app);
    };
    ServiceProvider.GenerateId = function () {
        return ServiceProvider.bouerId++;
    };
    ServiceProvider.bouerId = 1;
    ServiceProvider.serviceCollection = new Map();
    return ServiceProvider;
}());

var Task = /** @class */ (function () {
    function Task() {
    }
    Task.run = function (callback, milliseconds) {
        var t_id = setInterval(function () {
            callback(function () { return clearInterval(t_id); });
        }, milliseconds || 10);
    };
    return Task;
}());

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

var Base = /** @class */ (function () {
    function Base() {
        /** IRT -> Ignore Reactive Transformation */
        this._IRT_ = true;
    }
    return Base;
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
        var mEvent = ReactiveEvent.on(eventName, function (reactive) {
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

var Binder = /** @class */ (function (_super) {
    __extends(Binder, _super);
    function Binder(bouer) {
        var _this = _super.call(this) || this;
        _this.binds = [];
        _this.DEFAULT_BINDER_PROPERTIES = {
            text: 'value',
            number: 'valueAsNumber',
            checkbox: 'checked',
            radio: 'value'
        };
        _this.BindingDirection = {
            fromInputToData: 'fromInputToData',
            fromDataToInput: 'fromDataToInput'
        };
        _this.bouer = bouer;
        _this.serviceProvider = new ServiceProvider(bouer);
        _this.evaluator = _this.serviceProvider.get('Evaluator');
        _this.serviceProvider.add('Binder', _this);
        _this.cleanup();
        return _this;
    }
    Binder.prototype.create = function (options) {
        var _this = this;
        var node = options.node, data = options.data, fields = options.fields, isReplaceProperty = options.isReplaceProperty, context = options.context;
        var originalValue = trim(ifNullReturn(node.nodeValue, ''));
        var originalName = node.nodeName;
        var ownerNode = node.ownerElement || node.parentNode;
        var middleware = this.serviceProvider.get('Middleware');
        var onUpdate = options.onUpdate || (function (v, n) { });
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
        var $RunDirectiveMiddlewares = function (type) {
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
        var $BindOneWay = function () {
            // One-Way Data Binding
            var nodeToBind = node;
            // If definable property e-[?]="..."
            if (originalName.substring(0, Constants.property.length) === Constants.property && isNull(isReplaceProperty)) {
                propertyBindConfig.nodeName = originalName.substring(Constants.property.length);
                ownerNode.setAttribute(propertyBindConfig.nodeName, originalValue);
                nodeToBind = ownerNode.attributes[propertyBindConfig.nodeName];
                // Removing the e-[?] attr
                ownerNode.removeAttribute(node.nodeName);
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
                    if (delimiter && typeof delimiter.onUpdate === 'function')
                        valueToSet = delimiter.onUpdate(valueToSet, node, data);
                });
                propertyBindConfig.value = valueToSet;
                if (!isHtml)
                    return nodeToBind.nodeValue = valueToSet;
                var htmlSnippet = $CreateEl('div', function (el) {
                    el.innerHTML = valueToSet;
                }).build().children[0];
                ownerNode.appendChild(htmlSnippet);
                _this.serviceProvider.get('Compiler').compile({
                    el: htmlSnippet,
                    data: data,
                    context: context
                });
            };
            ReactiveEvent.once('AfterGet', function (event) {
                event.onemit = function (reactive) {
                    _this.binds.push({
                        isConnected: options.isConnected,
                        watch: reactive.onChange(function (value) {
                            setter();
                            onUpdate(value, node);
                            $RunDirectiveMiddlewares('onUpdate');
                        }, node)
                    });
                };
                setter();
            });
            propertyBindConfig.node = nodeToBind;
            $RunDirectiveMiddlewares('onBind');
            return propertyBindConfig;
        };
        var $BindTwoWay = function () {
            var propertyNameToBind = '';
            var binderTarget = ownerNode.type || ownerNode.localName;
            if (Constants.bind === originalName)
                propertyNameToBind = _this.DEFAULT_BINDER_PROPERTIES[binderTarget] || 'value';
            else
                propertyNameToBind = originalName.split(':')[1]; // e-bind:value -> value
            var isSelect = ownerNode instanceof HTMLSelectElement;
            var isSelectMultiple = isSelect && ownerNode.multiple === true;
            var modelAttribute = findAttribute(ownerNode, [':value'], true);
            var dataBindModel = modelAttribute ? modelAttribute.value : "\"" + ownerNode.value + "\"";
            var dataBindProperty = trim(originalValue);
            var boundPropertyValue;
            var boundModelValue;
            var callback = function (direction, value) {
                if (isSelect && !isSelectMultiple && Array.isArray(boundPropertyValue) && !dataBindModel) {
                    return Logger.error("Since it's a <select> array binding, it expects the “multiple” attribute in" +
                        " order to bind the multiple values.");
                }
                // Array Binding
                if (!isSelectMultiple && (Array.isArray(boundPropertyValue) && !dataBindModel)) {
                    return Logger.error("Since it's an array binding it expects a model but it has not been defined" +
                        ", provide a model as it follows: value=\"String-Model\" or :value=\"Object-Model\".");
                }
                var $Setter = {
                    fromDataToInput: function () {
                        // Normal Property Set
                        if (!Array.isArray(boundPropertyValue)) {
                            // In case of radio button we need to check if the value is the same to check it
                            if (binderTarget === 'radio')
                                return ownerNode.checked = ownerNode[propertyNameToBind] == value;
                            // Default Binding
                            return ownerNode[propertyNameToBind] = (isObject(value) ? toStr(value) : (isNull(value) ? '' : value));
                        }
                        // Array Set
                        boundModelValue = boundModelValue || _this.evaluator.exec({
                            data: data,
                            expression: dataBindModel,
                            context: context
                        });
                        // select-multiple handling
                        if (isSelectMultiple) {
                            return forEach(toArray(ownerNode.options), function (option) {
                                option.selected = boundPropertyValue.indexOf(trim(option.value)) !== -1;
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
                                    ownerNode[propertyNameToBind] = "";
                                    break;
                            }
                        }
                    },
                    fromInputToData: function () {
                        // Normal Property Set
                        if (!Array.isArray(boundPropertyValue)) {
                            // Default Binding
                            return _this.evaluator.exec({
                                isReturn: false,
                                context: context,
                                data: Extend.obj(data, { $vl: value }),
                                expression: dataBindProperty + '=$vl'
                            });
                        }
                        // Array Set
                        boundModelValue = boundModelValue || _this.evaluator.exec({
                            data: data,
                            expression: dataBindModel,
                            context: context
                        });
                        // select-multiple handling
                        if (isSelectMultiple) {
                            var optionCollection_1 = [];
                            forEach(toArray(ownerNode.options), function (option) {
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
                    }
                };
                return $Setter[direction]();
            };
            ReactiveEvent.once('AfterGet', function (evt) {
                var getValue = function () { return _this.evaluator.exec({
                    data: data,
                    expression: dataBindProperty,
                    context: context
                }); };
                // Adding the event on emittion
                evt.onemit = function (reactive) {
                    _this.binds.push({
                        isConnected: options.isConnected,
                        watch: reactive.onChange(function () {
                            var value = getValue();
                            callback(_this.BindingDirection.fromDataToInput, value);
                            onUpdate(value, node);
                            $RunDirectiveMiddlewares('onUpdate');
                        }, node)
                    });
                };
                // calling the main event
                boundPropertyValue = getValue();
            });
            callback(_this.BindingDirection.fromDataToInput, boundPropertyValue);
            var listeners = ['input', 'propertychange', 'change'];
            if (listeners.indexOf(ownerNode.localName) === -1)
                listeners.push(ownerNode.localName);
            // Applying the events
            forEach(listeners, function (listener) {
                if (listener === 'change' && ownerNode.localName !== 'select')
                    return;
                ownerNode.addEventListener(listener, function () {
                    callback(_this.BindingDirection.fromInputToData, ownerNode[propertyNameToBind]);
                }, false);
            });
            // Removing the e-bind attr
            ownerNode.removeAttribute(node.nodeName);
            $RunDirectiveMiddlewares('onBind');
            return propertyBindConfig; // Stop Two-Way Data Binding Process
        };
        if (originalName.substring(0, Constants.bind.length) === Constants.bind)
            return $BindTwoWay();
        return $BindOneWay();
    };
    Binder.prototype.onPropertyChange = function (propertyName, callback, targetObject) {
        var mWatch;
        ReactiveEvent.once('AfterGet', function (event) {
            event.onemit = function (reactive) { return mWatch = reactive.onChange(callback); };
            targetObject[propertyName];
        });
        return mWatch;
    };
    Binder.prototype.onPropertyInScopeChange = function (watchable) {
        var _this = this;
        var watches = [];
        ReactiveEvent.once('AfterGet', function (evt) {
            evt.onemit = function (reactive) {
                // Do not watch the same property twice
                if (watches.find(function (w) { return w.property === reactive.propName &&
                    w.reactive.propSource === reactive.propSource; }))
                    return;
                // Execution handler
                var isExecuting = false;
                watches.push(reactive.onChange(function () {
                    if (isExecuting)
                        return;
                    isExecuting = true;
                    watchable.call(_this.bouer, _this.bouer);
                    isExecuting = false;
                }));
            };
            watchable.call(_this.bouer, _this.bouer);
        });
        return watches;
    };
    /** Creates a process to unbind properties that is not connected to the DOM anymone */
    Binder.prototype.cleanup = function () {
        var _this = this;
        Task.run(function () {
            _this.binds = where(_this.binds, function (bind) {
                if (bind.isConnected())
                    return true;
                bind.watch.destroy();
            });
        });
    };
    return Binder;
}(Base));

var Watch = /** @class */ (function (_super) {
    __extends(Watch, _super);
    function Watch(reactive, callback, options) {
        var _this = _super.call(this) || this;
        _this.destroy = function () {
            var indexOfThis = _this.reactive.watches.indexOf(_this);
            if (indexOfThis !== -1)
                _this.reactive.watches.splice(indexOfThis, 1);
            if (_this.onDestroy)
                _this.onDestroy();
        };
        _this.reactive = reactive;
        _this.property = reactive.propName;
        _this.callback = callback;
        if (options) {
            _this.node = options.node;
            _this.onDestroy = options.onDestroy;
        }
        return _this;
    }
    return Watch;
}(Base));

var Reactive = /** @class */ (function (_super) {
    __extends(Reactive, _super);
    function Reactive(options) {
        var _this = _super.call(this) || this;
        _this.watches = [];
        _this.get = function () {
            ReactiveEvent.emit('BeforeGet', _this);
            _this.propValue = _this.isComputed ? _this.computedGetter.call(_this.context) : _this.propValue;
            var value = _this.propValue;
            ReactiveEvent.emit('AfterGet', _this);
            return value;
        };
        _this.set = function (value) {
            _this.propValueOld = _this.propValue;
            if (_this.propValueOld === value || (Number.isNaN(_this.propValueOld) && Number.isNaN(value)))
                return;
            ReactiveEvent.emit('BeforeSet', _this);
            if (isObject(value) || Array.isArray(value)) {
                if ((typeof _this.propValue) !== (typeof value))
                    return Logger.error(("Cannot set “" + (typeof value) + "” in “" +
                        _this.propName + "” property."));
                if (Array.isArray(value)) {
                    Reactive.transform({
                        data: value,
                        reactiveObj: _this,
                        context: _this.context
                    });
                    var propValueAsAny = _this.propValue;
                    propValueAsAny.splice(0, propValueAsAny.length);
                    propValueAsAny.push.apply(propValueAsAny, value);
                }
                else if (isObject(value)) {
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
            }
            else {
                _this.propValue = value;
            }
            if (_this.isComputed && _this.computedSetter)
                _this.computedSetter.call(_this.context, value);
            ReactiveEvent.emit('AfterSet', _this);
            _this.notify();
        };
        _this.propName = options.propName;
        _this.propSource = options.srcObject;
        _this.context = options.context;
        // Setting the value of the property
        _this.propDescriptor = Prop.descriptor(_this.propSource, _this.propName);
        _this.propValue = _this.propDescriptor.value;
        _this.isComputed = typeof _this.propValue === 'function' && _this.propValue.name === '$computed';
        if (_this.isComputed) {
            var computedResult_1 = _this.propValue.call(_this.context);
            if ('get' in computedResult_1 || !isNull(computedResult_1)) {
                _this.computedGetter = computedResult_1.get || (function () { return computedResult_1; });
            }
            if ('set' in computedResult_1) {
                _this.computedSetter = computedResult_1.set;
            }
            if (isNull(_this.computedGetter))
                throw new Error("Computed property must be a function “function $computed(){...}” that returns " +
                    "a valid value to infer “getter only” or an object with a “get” and/or “set” function");
            _this.propValue = undefined;
        }
        if (typeof _this.propValue === 'function' && !_this.isComputed)
            _this.propValue = _this.propValue.bind(_this.context);
        return _this;
    }
    Reactive.prototype.notify = function () {
        var _this = this;
        // Running all the watches
        forEach(this.watches, function (watch) { return watch.callback.call(_this.context, _this.propValue, _this.propValueOld); });
    };
    Reactive.prototype.onChange = function (callback, node) {
        var w = new Watch(this, callback, { node: node });
        this.watches.push(w);
        return w;
    };
    Reactive.transform = function (options) {
        var context = options.context;
        var executer = function (data, visiting, visited, reactiveObj) {
            if (Array.isArray(data)) {
                if (reactiveObj == null) {
                    Logger.warn('Cannot transform this array to a reactive one because no reactive objecto was provided');
                    return data;
                }
                if (visiting.indexOf(data) !== -1)
                    return data;
                visiting.push(data);
                var REACTIVE_ARRAY_METHODS = ['push', 'pop', 'unshift', 'shift', 'splice'];
                var inputArray_1 = data;
                var reference_1 = {}; // Using clousure to cache the array methods
                var prototype_1 = inputArray_1.__proto__ = Object.create(Array.prototype);
                forEach(REACTIVE_ARRAY_METHODS, function (method) {
                    // cache original method
                    reference_1[method] = inputArray_1[method].bind(inputArray_1);
                    // changing to the reactive one
                    prototype_1[method] = function reactive() {
                        var oldArrayValue = inputArray_1.slice();
                        var args = [].slice.call(arguments);
                        switch (method) {
                            case 'push':
                            case 'unshift':
                                forEach(toArray(args), function (arg) {
                                    if (!isObject(arg) && !Array.isArray(arg))
                                        return;
                                    executer(arg, visiting, visited);
                                });
                        }
                        var result = reference_1[method].apply(inputArray_1, args);
                        forEach(reactiveObj.watches, function (watch) { return watch.callback(inputArray_1, oldArrayValue, {
                            method: method,
                            args: args
                        }); });
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
            forEach(Object.keys(data), function (key) {
                var mInputObject = data;
                // Already a reactive property, do nothing
                if (!('value' in Prop.descriptor(data, key)))
                    return;
                var propertyValue = mInputObject[key];
                if ((propertyValue instanceof Object) && ((propertyValue._IRT_) || (propertyValue instanceof Node)))
                    return;
                var reactive = new Reactive({
                    propName: key,
                    srcObject: data,
                    context: context
                });
                Prop.set(data, key, reactive);
                if (Array.isArray(propertyValue)) {
                    executer(propertyValue, visiting, visited, reactive); // Transform the array to a reactive one
                    forEach(propertyValue, function (item) { return executer(item, visiting, visited); });
                }
                else if (isObject(propertyValue))
                    executer(propertyValue, visiting, visited);
            });
            visiting.splice(visiting.indexOf(data), 1);
            visited.push(data);
            return data;
        };
        return executer(options.data, [], [], options.reactiveObj);
    };
    return Reactive;
}(Base));

var Directive = /** @class */ (function (_super) {
    __extends(Directive, _super);
    function Directive(customDirective, compiler, compilerContext) {
        var _this = _super.call(this) || this;
        _this.$custom = {};
        _this.errorMsgEmptyNode = function (node) { return ("Expected an expression in “" + node.nodeName +
            "” and got an <empty string>."); };
        _this.errorMsgNodeValue = function (node) { return ("Expected an expression in “" + node.nodeName +
            "” and got “" + (ifNullReturn(node.nodeValue, '')) + "”."); };
        _this.compiler = compiler;
        _this.context = compilerContext;
        _this.bouer = compiler.bouer;
        _this.$custom = customDirective;
        _this.serviceProvider = new ServiceProvider(_this.bouer);
        _this.evaluator = _this.serviceProvider.get('Evaluator');
        _this.delimiter = _this.serviceProvider.get('DelimiterHandler');
        _this.binder = _this.serviceProvider.get('Binder');
        _this.eventHandler = _this.serviceProvider.get('EventHandler');
        return _this;
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
        var ownerNode = this.toOwnerNode(node);
        var container = ownerNode.parentElement;
        if (!container)
            return;
        var conditions = [];
        var comment = $CreateComment();
        var nodeName = node.nodeName;
        var execute = function () { };
        if (nodeName === Constants.elseif || nodeName === Constants.else)
            return;
        var currentEl = ownerNode;
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
            if ((attr.nodeName !== 'e-else') && (trim(ifNullReturn(attr.nodeValue, '')) === ''))
                return { value: Logger.error(this_1.errorMsgEmptyNode(attr)) };
            if (this_1.delimiter.run(ifNullReturn(attr.nodeValue, '')).length !== 0)
                return { value: Logger.error(this_1.errorMsgNodeValue(attr)) };
            conditions.push({ node: attr, element: currentEl });
            if (attr.nodeName === ('e-else')) {
                currentEl.removeAttribute(attr.nodeName);
                return "break";
            }
            // Listening to the property get only if the callback function is defined
            ReactiveEvent.once('AfterGet', function (event) {
                event.onemit = function (reactive) {
                    // Avoiding multiple binding in the same property
                    if (reactives.findIndex(function (item) { return item.reactive.propName == reactive.propName; }) !== -1)
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
            _this.binder.binds.push({
                // Binder is connected if at least one of the chain and the comment is still connected
                isConnected: function () { return !isNull(Extend.array(conditions.map(function (x) { return x.element; }), comment).find(function (el) { return el.isConnected; })); },
                watch: item.reactive.onChange(function () { return execute(); }, item.attr)
            });
        });
        (execute = function () {
            forEach(conditions, function (chainItem) {
                if (!chainItem.element.parentElement)
                    return;
                if (comment.isConnected)
                    container.removeChild(chainItem.element);
                else
                    container.replaceChild(comment, chainItem.element);
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
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        var execute = function (el) { };
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        var bindResult = this.binder.create({
            data: data,
            node: node,
            isConnected: function () { return ownerNode.isConnected; },
            fields: [{ expression: nodeValue, field: nodeValue }],
            context: this.context,
            onUpdate: function () { return execute(ownerNode); }
        });
        (execute = function (element) {
            var value = _this.evaluator.exec({
                data: data,
                expression: nodeValue,
                context: _this.context,
            });
            element.style.display = value ? '' : 'none';
        })(ownerNode);
        ownerNode.removeAttribute(bindResult.node.nodeName);
    };
    Directive.prototype.for = function (node, data) {
        var _this = this;
        var ownerNode = this.toOwnerNode(node);
        var container = ownerNode.parentElement;
        if (!container)
            return;
        var comment = $CreateComment();
        var nodeName = node.nodeName;
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        var listedItemsHandler = [];
        var hasWhereFilter = false;
        var hasOrderFilter = false;
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
                node: node,
                data: data,
                fields: delimiters,
                isReplaceProperty: true,
                context: this.context,
                isConnected: function () { return comment.isConnected; },
                onUpdate: function () { return execute(); }
            });
        ownerNode.removeAttribute(nodeName);
        // Cloning the element
        var forItem = ownerNode.cloneNode(true);
        // Replacing the comment reference
        container.replaceChild(comment, ownerNode);
        // Filters the list of items
        var $Where = function (list, filterConfigParts) {
            hasWhereFilter = true;
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
                    var isValid = false;
                    for (var _i = 0, _a = whereKeys.split(',').map(function (m) { return trim(m); }); _i < _a.length; _i++) {
                        var prop = _a[_i];
                        var propValue = _this.evaluator.exec({
                            data: item,
                            expression: prop,
                            context: _this.context
                        });
                        if (toStr(propValue).includes(whereValue)) {
                            isValid = true;
                            break;
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
        var $Order = function (list, type, prop) {
            hasOrderFilter = true;
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
        // Prepare the item before to insert
        var $PrepareForItem = function (item, index) {
            expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
            var leftHandParts = expObj.leftHandParts, sourceValue = expObj.sourceValue, isForOf = expObj.isForOf;
            var forData = Extend.obj(data);
            var _item_key = leftHandParts[0];
            var _index_or_value = leftHandParts[1] || '_index_or_value';
            var _index = leftHandParts[2] || '_for_in_index';
            forData[_item_key] = item;
            forData[_index_or_value] = isForOf ? index : sourceValue[item];
            forData[_index] = index;
            return Reactive.transform({
                data: forData,
                context: _this.context
            });
        };
        // Inserts an element in the DOM
        var $InsertForItem = function (options) {
            // Preparing the data to be inserted
            var forData = $PrepareForItem(options.item, options.index);
            // Inserting in the DOM
            var forClonedItem = container.insertBefore(forItem.cloneNode(true), options.reference || comment);
            // Compiling the inserted data
            _this.compiler.compile({
                el: forClonedItem,
                data: forData,
                context: _this.context,
                onDone: function (el) { return _this.eventHandler.emit({
                    eventName: Constants.builtInEvents.add,
                    attachedNode: el,
                    once: true
                }); }
            });
            // Addin
            listedItemsHandler[options.method]({
                el: forClonedItem,
                data: forData
            });
            return forClonedItem;
        };
        // Builds the expression to an object
        var $ExpressionBuilder = function (expression) {
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
        // Handler the UI when the Array changes
        var $OnArrayChanges = function (detail) {
            if (hasWhereFilter || hasOrderFilter)
                return execute(); // Reorganize re-insert all the items
            detail = detail || {};
            var method = detail.method;
            var args = detail.args;
            var mListedItems = listedItemsHandler;
            var reOrganizeIndexes = function () {
                // In case of unshift re-organize the indexes
                // Was wrapped into a promise in case of large amount of data
                return Promise.resolve(function (array) {
                    expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
                    var leftHandParts = expObj.leftHandParts;
                    var _index_or_value = leftHandParts[1] || '_index_or_value';
                    forEach(array, function (item, index) {
                        item.data[_index_or_value] = index;
                    });
                }).then(function (mCaller) { return mCaller(listedItemsHandler); });
            };
            switch (method) {
                case 'pop':
                case 'shift': { // First or Last item removal handler
                    var item = mListedItems[method]();
                    if (!item)
                        return;
                    $RemoveEl(item.el);
                    if (method === 'pop')
                        return;
                    return reOrganizeIndexes();
                }
                case 'splice': { // Indexed removal handler
                    var removedItems = mListedItems[method].apply(mListedItems, args);
                    forEach(removedItems, function (item) { return $RemoveEl(item.el); });
                    var index = args[0];
                    expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
                    var leftHandParts = expObj.leftHandParts;
                    var _index_or_value = leftHandParts[1] || '_index_or_value';
                    // Fixing the index value
                    for (; index < listedItemsHandler.length; index++) {
                        var item = listedItemsHandler[index].data;
                        if (typeof item[_index_or_value] === 'number')
                            item[_index_or_value] = index;
                    }
                    return;
                }
                case 'push':
                case 'unshift': { // Addition handler
                    // Gets the last item as default
                    var indexRef_1 = mListedItems.length;
                    var isUnshift_1 = method == 'unshift';
                    var reference_1 = isUnshift_1 ? listedItemsHandler[0].el : undefined;
                    // Adding the itens to the dom
                    forEach([].slice.call(args), function (item) {
                        var ref = $InsertForItem({
                            index: indexRef_1++,
                            reference: reference_1,
                            method: method,
                            item: item,
                        });
                        if (isUnshift_1)
                            reference_1 = ref;
                    });
                    if (!isUnshift_1)
                        return;
                    return reOrganizeIndexes();
                }
                default: return execute();
            }
        };
        var reactivePropertyEvent = ReactiveEvent.on('AfterGet', function (reactive) {
            _this.binder.binds.push({
                isConnected: function () { return comment.isConnected; },
                watch: reactive.onChange(function (_n, _o, detail) {
                    return $OnArrayChanges(detail);
                }, node)
            });
        });
        var expObj = $ExpressionBuilder(nodeValue);
        reactivePropertyEvent.off();
        (execute = function () {
            expObj = expObj || $ExpressionBuilder(trim(ifNullReturn(node.nodeValue, '')));
            var iterable = expObj.iterableExpression, filters = expObj.filters;
            // Cleaning the
            forEach(listedItemsHandler, function (item) {
                if (!item.el.parentElement)
                    return;
                container.removeChild(item.el);
            });
            listedItemsHandler = [];
            _this.evaluator.exec({
                data: data,
                isReturn: false,
                context: _this.context,
                expression: "var __e = _each, __fl = _filters, __f = _for; " +
                    "__f(__fl(" + iterable + "), function($$itm, $$idx) { __e($$itm, $$idx); })",
                aditional: {
                    _for: forEach,
                    _each: function (item, index) {
                        $InsertForItem({
                            index: index,
                            item: item,
                            method: 'push'
                        });
                    },
                    _filters: function (list) {
                        var listCopy = Extend.array(list);
                        var findFilter = function (fName) {
                            return filters.find(function (item) { return item.substring(0, fName.length) === fName; });
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
                                listCopy = $Where(listCopy, whereConfigParts);
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
                                listCopy = $Order(listCopy, orderConfigParts[1], orderConfigParts[2]);
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
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        var inputData = {};
        var reactiveEvent = ReactiveEvent.on('AfterGet', function (reactive) {
            if (!(reactive.propName in inputData))
                inputData[reactive.propName] = undefined;
            Prop.set(inputData, reactive.propName, reactive);
        });
        var mInputData = this.evaluator.exec({
            data: data,
            expression: nodeValue,
            context: this.context
        });
        if (!isObject(mInputData))
            return Logger.error(("Expected a valid Object Literal expression in “" + node.nodeName +
                "” and got “" + nodeValue + "”."));
        // Adding all non-existing properties
        forEach(Object.keys(mInputData), function (key) {
            if (!(key in inputData))
                inputData[key] = mInputData[key];
        });
        ReactiveEvent.off('AfterGet', reactiveEvent.callback);
        this.bouer.set(inputData, data);
        ownerNode.removeAttribute(node.nodeName);
    };
    Directive.prototype.text = function (node) {
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        ownerNode.innerText = nodeValue;
        ownerNode.removeAttribute(node.nodeName);
    };
    Directive.prototype.bind = function (node, data) {
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        this.binder.create({
            node: node,
            isConnected: function () { return ownerNode.isConnected; },
            fields: [{ field: nodeValue, expression: nodeValue }],
            context: this.context,
            data: data
        });
        ownerNode.removeAttribute(node.nodeName);
    };
    Directive.prototype.property = function (node, data) {
        var _this = this;
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        var execute = function (obj) { };
        var errorInvalidValue = function (node) {
            return ("Invalid value, expected an Object/Object Literal in “" + node.nodeName
                + "” and got “" + (ifNullReturn(node.nodeValue, '')) + "”.");
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
            node: node,
            isReplaceProperty: false,
            isConnected: function () { return ownerNode.isConnected; },
            fields: [{ expression: nodeValue, field: nodeValue }],
            context: this.context,
            onUpdate: function () { return execute(_this.evaluator.exec({
                data: data,
                expression: nodeValue,
                context: _this.context
            })); }
        });
        ownerNode.removeAttribute(node.nodeName);
        (execute = function (obj) {
            var attrNameToSet = node.nodeName.substring(Constants.property.length);
            var attr = ownerNode.attributes[attrNameToSet];
            if (!attr) {
                (ownerNode.setAttribute(attrNameToSet, ''));
                attr = ownerNode.attributes[attrNameToSet];
            }
            forEach(Object.keys(obj), function (key) {
                /* if has a falsy value remove the key */
                if (!obj[key])
                    return attr.value = trim(attr.value.replace(key, ''));
                attr.value = (attr.value.includes(key) ? attr.value : trim(attr.value + ' ' + key));
            });
            if (attr.value === '')
                return ownerNode.removeAttribute(attrNameToSet);
        })(inputData);
    };
    Directive.prototype.data = function (node, data) {
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error("The “data” attribute cannot contain delimiter.");
        ownerNode.removeAttribute(node.nodeName);
        var inputData = {};
        var mData = Extend.obj(data, { $data: data });
        var reactiveEvent = ReactiveEvent.on('AfterGet', function (reactive) {
            if (!(reactive.propName in inputData))
                inputData[reactive.propName] = undefined;
            Prop.set(inputData, reactive.propName, reactive);
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
            this.serviceProvider.get('DataStore').set('data', dataKey, inputData);
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
    Directive.prototype.href = function (node, data) {
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
                isConnected: function () { return ownerNode.isConnected; },
                context: this.context,
                fields: delimiters
            });
        ownerNode
            .addEventListener('click', function (event) {
            event.preventDefault();
            _this.serviceProvider.get('Routing')
                .navigate(href.value);
        }, false);
    };
    Directive.prototype.entry = function (node, data) {
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        ownerNode.removeAttribute(node.nodeName);
        this.serviceProvider.get('ComponentHandler')
            .prepare([
            {
                name: nodeValue,
                template: ownerNode.outerHTML,
                data: data
            }
        ]);
    };
    Directive.prototype.put = function (node, data) {
        var _this = this;
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        var execute = function () { };
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node), "Direct <empty string> injection value is not allowed.");
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error("Expected an expression with no delimiter in “"
                + node.nodeName + "” and got “" + (ifNullReturn(node.nodeValue, '')) + "”.");
        this.binder.create({
            data: data,
            node: node,
            isConnected: function () { return ownerNode.isConnected; },
            fields: [{ expression: nodeValue, field: nodeValue }],
            context: this.context,
            isReplaceProperty: false,
            onUpdate: function () { return execute(); }
        });
        ownerNode.removeAttribute(node.nodeName);
        (execute = function () {
            ownerNode.innerHTML = '';
            nodeValue = trim(ifNullReturn(node.nodeValue, ''));
            if (nodeValue === '')
                return;
            var componentElement = $CreateAnyEl(nodeValue)
                .appendTo(ownerNode)
                .build();
            _this.serviceProvider.get('ComponentHandler')
                .order(componentElement, data);
        })();
    };
    Directive.prototype.req = function (node, data) {
        var _this = this;
        var ownerNode = this.toOwnerNode(node);
        var container = this.toOwnerNode(ownerNode);
        var nodeName = node.nodeName;
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
            return Logger.error(("Expected a valid “for” expression in “" + nodeName
                + "” and got “" + nodeValue + "”." + "\nValid: e-req=\"item of [url]\"."));
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
            parent: ownerNode,
            value: nodeValue,
        };
        if (delimiters.length !== 0)
            binderConfig = this.binder.create({
                data: data,
                node: node,
                fields: delimiters,
                context: this.context,
                isReplaceProperty: false,
                isConnected: function () { return container.isConnected; },
                onUpdate: function () { return onUpdate(); }
            });
        ownerNode.removeAttribute(node.nodeName);
        var subcribeEvent = function (eventName) {
            var attr = ownerNode.attributes.getNamedItem(Constants.on + eventName);
            if (attr)
                _this.eventHandler.handle(attr, data, _this.context);
            return {
                emit: function (detailObj) {
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
                Logger.error(("Using e-req=\"... “of” ...\" the response must be a " +
                    "list of items, and got “" + typeof response.data + "”."));
                return false;
            }
            if ((requestType === 'as' && !(typeof response.data === 'object'))) {
                Logger.error(("Using e-req=\"... “as” ...\" the response must be a list " +
                    "of items, and got “" + typeof response.data + "”."));
                return false;
            }
            return true;
        };
        var middleware = this.serviceProvider.get('Middleware');
        var dataKey = (node.nodeName.split(':')[1] || '').replace(/\[|\]/g, '');
        if (!middleware.has('req'))
            return Logger.error("There is no “req” middleware provided for the “e-req” directive requests.");
        (onInsertOrUpdate = function () {
            var expObject = builder(trim(node.nodeValue || ''));
            var responseHandler = function (response) {
                var _a;
                if (!isValidResponse(response, expObject.type))
                    return;
                Reactive.transform({
                    context: _this.context,
                    data: response
                });
                if (dataKey)
                    _this.serviceProvider.get('DataStore').set('req', dataKey, response);
                subcribeEvent(Constants.builtInEvents.response).emit({
                    response: response
                });
                // Handle Content Insert/Update
                if (!('data' in localDataStore)) {
                    // Store the data
                    localDataStore.data = undefined;
                    Prop.transfer(localDataStore, response, 'data');
                }
                else {
                    // Update de local data
                    return localDataStore.data = response.data;
                }
                if (expObject.type === 'as') {
                    // Removing the: “(...)”  “,”  and getting only the variable
                    var variable = trim(expObject.variables.split(',')[0].replace(/\(|\)/g, ''));
                    if (variable in data)
                        return Logger.error("There is already a “" + variable + "” defined in the current scope. " +
                            "Provide another variable name in order to continue.");
                    data[variable] = response.data;
                    return _this.compiler.compile({
                        el: ownerNode,
                        data: Reactive.transform({ context: _this.context, data: data }),
                        context: _this.context
                    });
                }
                if (expObject.type === 'of') {
                    var resUniqueName = code(8, 'res');
                    var forDirectiveContent = expObject.expression.replace(expObject.path, resUniqueName);
                    var mData = Extend.obj((_a = {}, _a[resUniqueName] = response.data, _a), data);
                    ownerNode.setAttribute(Constants.for, forDirectiveContent);
                    Prop.set(mData, resUniqueName, Prop.descriptor(response, 'data'));
                    return _this.compiler.compile({
                        el: ownerNode,
                        data: mData,
                        context: _this.context
                    });
                }
            };
            subcribeEvent(Constants.builtInEvents.request).emit();
            middleware.run('req', {
                type: 'onBind',
                action: function (middlewareRequest) {
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
                        fail: function (error) { return subcribeEvent(Constants.builtInEvents.fail).emit({
                            error: error
                        }); },
                        done: function () { return subcribeEvent(Constants.builtInEvents.done).emit(); }
                    };
                    middlewareRequest(context, cbs);
                }
            });
        })();
        onUpdate = function () {
            var expObject = builder(trim(node.nodeValue || ''));
            middleware.run('req', {
                type: 'onUpdate',
                default: function () { return onInsertOrUpdate(); },
                action: function (middlewareRequest) {
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
                        fail: function (error) { return subcribeEvent(Constants.builtInEvents.fail).emit({
                            error: error
                        }); },
                        done: function () { return subcribeEvent(Constants.builtInEvents.done).emit(); }
                    };
                    middlewareRequest(context, cbs);
                }
            });
        };
    };
    Directive.prototype.wait = function (node) {
        var _this = this;
        var ownerNode = this.toOwnerNode(node);
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (nodeValue === '')
            return Logger.error(this.errorMsgEmptyNode(node));
        if (this.delimiter.run(nodeValue).length !== 0)
            return Logger.error(this.errorMsgNodeValue(node));
        ownerNode.removeAttribute(node.nodeName);
        var dataStore = this.serviceProvider.get('DataStore');
        var mWait = dataStore.wait[nodeValue];
        if (mWait) {
            mWait.nodes.push(ownerNode);
            // No data exposed yet
            if (!mWait.data)
                return;
            // Compile all the waiting nodes
            forEach(mWait.nodes, function (nodeWaiting) {
                _this.compiler.compile({
                    el: nodeWaiting,
                    data: Reactive.transform({
                        context: _this.context,
                        data: mWait.data
                    }),
                    context: _this.context
                });
            });
            if (ifNullReturn(mWait.once, false))
                delete dataStore.wait[nodeValue];
        }
        return dataStore.wait[nodeValue] = { nodes: [ownerNode] };
    };
    Directive.prototype.custom = function (node, data) {
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
            isConnected: function () { return ownerNode.isConnected; },
            onUpdate: function () {
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
    Directive.prototype.skeleton = function (node) {
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        if (nodeValue !== '')
            return;
        var ownerNode = this.toOwnerNode(node);
        ownerNode.removeAttribute(node.nodeName);
    };
    return Directive;
}(Base));

var Compiler = /** @class */ (function (_super) {
    __extends(Compiler, _super);
    function Compiler(bouer, directives) {
        var _this = _super.call(this) || this;
        _this.NODES_TO_IGNORE_IN_COMPILATION = {
            'SCRIPT': 1,
            '#comment': 8
        };
        _this.bouer = bouer;
        _this.serviceProvider = new ServiceProvider(bouer);
        _this.directives = directives;
        _this.binder = _this.serviceProvider.get('Binder');
        _this.delimiter = _this.serviceProvider.get('DelimiterHandler');
        _this.eventHandler = _this.serviceProvider.get('EventHandler');
        _this.component = _this.serviceProvider.get('ComponentHandler');
        ServiceProvider.add('Compiler', _this);
        return _this;
    }
    Compiler.prototype.compile = function (options) {
        var _this = this;
        var rootElement = options.el;
        var context = options.context || this.bouer;
        var data = (options.data || this.bouer.data);
        if (!rootElement)
            return Logger.error("Invalid element provided to the compiler.");
        if (!this.analize(rootElement.outerHTML))
            return rootElement;
        var directive = new Directive(this.directives || {}, this, context);
        var walker = function (node, data) {
            if (node.nodeName in _this.NODES_TO_IGNORE_IN_COMPILATION)
                return;
            // First Element Attributes compilation
            if (node instanceof Element) {
                // e-skip" directive
                if (Constants.skip in node.attributes)
                    return directive.skip(node);
                if ((node.localName.toLowerCase() === Constants.slot || node.tagName.toLowerCase() === Constants.slot)
                    && options.componentSlot) {
                    var componentSlot = options.componentSlot;
                    var insertSlot_1 = function (slot, reference) {
                        var $Walker = function (child) {
                            var cloned = child.cloneNode(true);
                            reference.parentNode.insertBefore(cloned, reference);
                            walker(cloned, data);
                        };
                        if (slot.nodeName === 'SLOTCONTAINER' || slot.nodeName === 'SLOT')
                            forEach(toArray(slot.childNodes), function (child) { return $Walker(child); });
                        else
                            $Walker(slot);
                        reference.parentNode.removeChild(reference);
                    };
                    if (node.hasAttribute('default')) {
                        if (componentSlot.childNodes.length == 0)
                            return;
                        // In case of default slot insertion
                        return insertSlot_1(componentSlot, node);
                    }
                    else if (node.hasAttribute('name')) {
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
                            forEach(toArray(element.children), function (child) {
                                $Walker(child);
                            });
                        })(componentSlot);
                    }
                }
                // e-def="{...}" directive
                if (Constants.def in node.attributes)
                    directive.def(node.attributes.getNamedItem(Constants.def), data);
                // e-entry="..." directive
                if (Constants.entry in node.attributes)
                    directive.entry(node.attributes.getNamedItem(Constants.entry), data);
                // wait-data="..." directive
                if (Constants.wait in node.attributes)
                    return directive.wait(node.attributes.getNamedItem(Constants.wait));
                // <component></component>
                if (_this.component.check(node.localName))
                    return _this.component.order(node, data);
                // e-for="..." directive
                if (Constants.for in node.attributes)
                    return directive.for(node.attributes.getNamedItem(Constants.for), data);
                // e-if="..." directive
                if (Constants.if in node.attributes)
                    return directive.if(node.attributes.getNamedItem(Constants.if), data);
                // e-else-if="..." or e-else directive
                if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
                    Logger.warn('The "' + Constants.elseif + '" or "' + Constants.else + '" requires an element with "' + Constants.if + '" above.');
                // e-show="..." directive
                if (Constants.show in node.attributes)
                    directive.show(node.attributes.getNamedItem(Constants.show), data);
                // e-req="..." | e-req:[id]="..."  directive
                var reqNode = null;
                if ((reqNode = node.attributes.getNamedItem(Constants.req)) ||
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
                    return directive.put(node.attributes.getNamedItem(Constants.put), data);
                // Looping the attributes
                forEach(toArray(node.attributes), function (attr) {
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
            var delimiterField;
            if ((delimiterField = _this.delimiter.shorthand(node.nodeName))) {
                var element = (node.ownerElement || node.parentNode);
                var attr = DOM.createAttribute("e-" + delimiterField.expression);
                attr.value = "{{ " + delimiterField.expression + " }}";
                element.attributes.setNamedItem(attr);
                element.attributes.removeNamedItem(delimiterField.field);
                return _this.binder.create({
                    node: attr,
                    isConnected: function () { return rootElement.isConnected; },
                    fields: [{ expression: delimiterField.expression, field: attr.value }],
                    context: context,
                    data: data
                });
            }
            // Property binding
            var delimitersFields;
            if (isString(node.nodeValue) && (delimitersFields = _this.delimiter.run(node.nodeValue))
                && delimitersFields.length !== 0) {
                _this.binder.create({
                    node: node,
                    isConnected: function () { return rootElement.isConnected; },
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
        if (isFunction(options.onDone)) {
            options.onDone.call(context, rootElement);
        }
        this.eventHandler.emit({
            eventName: Constants.builtInEvents.compile,
            attachedNode: rootElement,
            once: true,
            init: { detail: data }
        });
        return rootElement;
    };
    Compiler.prototype.analize = function (htmlSnippet) {
        return true;
    };
    return Compiler;
}(Base));

var Converter = /** @class */ (function (_super) {
    __extends(Converter, _super);
    function Converter(bouer) {
        var _this = _super.call(this) || this;
        _this.bouer = bouer;
        ServiceProvider.add('Converter', _this);
        return _this;
    }
    Converter.prototype.htmlToJsObj = function (input, options, onSet) {
        var element = undefined;
        var instance = this;
        // If it's not a HTML Element, just return
        if ((input instanceof HTMLElement))
            element = input;
        // If it's a string try to get the element
        else if (typeof input === 'string') {
            try {
                var $el = this.bouer.el.querySelector(input);
                if (!$el) {
                    Logger.error("Element with \"" + input + "\" selector Not Found.");
                    return null;
                }
                element = $el;
            }
            catch (error) {
                // Unknown error
                Logger.error(buildError(error));
                return null;
            }
        }
        // If the element is not
        if (isNull(element))
            throw Logger.error("Invalid element provided at app.toJsObj(> \"" + input + "\" <).");
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
            mValues.find(function (field) { return (val = getter(el, field)) ? true : false; });
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
            var buildPath = getter(buildElement, Constants.build);
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
                        }
                        else if (Array.isArray(objPropertyValue)) {
                            objPropertyValue.push(builtObjValue);
                        }
                        else {
                            lastLayer[leadElement] = [builtObjValue];
                        }
                    }
                    else {
                        isNull(objPropertyValue) ?
                            // Set the new property
                            lastLayer[leadElement] = builtObjValue :
                            // Spread and add the new fields into the object
                            lastLayer[leadElement] = Extend.obj(objPropertyValue, builtObjValue);
                    }
                    if (isFunction(onSet))
                        onSet.call(instance.bouer, lastLayer, leadElement, builtObjValue, buildElement);
                    return;
                }
                if (Array.isArray(objPropertyValue)) {
                    return forEach(objPropertyValue, function (item) {
                        objStructurer(splittedPath.join('.'), item);
                    });
                }
                objStructurer(splittedPath.join('.'), lastLayer[leadElement]);
            })(buildPath, builtObject);
        });
        return builtObject;
    };
    return Converter;
}(Base));

var UriHandler = /** @class */ (function (_super) {
    __extends(UriHandler, _super);
    function UriHandler(url) {
        var _this = _super.call(this) || this;
        _this.url = url || DOM.location.href;
        return _this;
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
}(Base));

var Component = /** @class */ (function (_super) {
    __extends(Component, _super);
    function Component(optionsOrPath) {
        var _this = _super.call(this) || this;
        _this.isDestroyed = false;
        _this.children = [];
        _this.assets = [];
        // Store temporarily this component UI orders
        _this.events = [];
        var _name = undefined;
        var _path = undefined;
        var _data = undefined;
        if (!isString(optionsOrPath)) {
            _name = optionsOrPath.name;
            _path = optionsOrPath.path;
            _data = optionsOrPath.data;
            Object.assign(_this, optionsOrPath);
        }
        else {
            _path = optionsOrPath;
        }
        _this.name = _name;
        _this.path = _path;
        _this.data = Reactive.transform({
            context: _this,
            data: _data || {}
        });
        return _this;
    }
    Component.prototype.export = function (data) {
        var _this = this;
        if (!isObject(data))
            return Logger.log("Invalid object for component.export(...), only \"Object Literal\" is allowed.");
        return forEach(Object.keys(data), function (key) {
            _this.data[key] = data[key];
            Prop.transfer(_this.data, data, key);
        });
    };
    Component.prototype.destroy = function () {
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
        forEach(this.events, function (evt) { return _this.off(evt.eventName, evt.callback); });
        this.events = [];
    };
    Component.prototype.params = function () {
        return new UriHandler().params(this.route);
    };
    Component.prototype.emit = function (eventName, init) {
        new ServiceProvider(this.bouer).get('EventHandler').emit({
            eventName: eventName,
            attachedNode: this.el,
            init: init
        });
    };
    Component.prototype.on = function (eventName, callback) {
        var instanceHooksSet = new Set(['created', 'beforeMount', 'mounted', 'beforeLoad', 'loaded', 'beforeDestroy', 'destroyed']);
        var registerHooksSet = new Set(['requested', 'blocked', 'failed']);
        if (registerHooksSet.has(eventName))
            Logger.warn("The “" + eventName + "” Event is called before the component is mounted, to be dispatched" +
                "it needs to be on registration object: { " + eventName + ": function(){ ... }, ... }.");
        var evt = new ServiceProvider(this.bouer).get('EventHandler').on({
            eventName: eventName,
            callback: callback,
            attachedNode: this.el,
            context: this,
            modifiers: { once: instanceHooksSet.has(eventName), autodestroy: false },
        });
        this.events.push(evt);
        return evt;
    };
    Component.prototype.off = function (eventName, callback) {
        new ServiceProvider(this.bouer).get('EventHandler').off({
            eventName: eventName,
            callback: callback,
            attachedNode: this.el
        });
        this.events = where(this.events, function (evt) { return !(evt.eventName == eventName && evt.callback == callback); });
    };
    Component.prototype.addAssets = function (assets) {
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
        var isValidAssetSrc = function (src, index) {
            var isValid = (src || trim(src)) ? true : false;
            if (!isValid)
                Logger.error('Invalid asset “src”, in assets[' + index + '].src');
            return isValid;
        };
        var assetTypeGetter = function (src, index) {
            var srcSplitted = src.split('.');
            var type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];
            if (!type)
                return Logger.error("Couldn't find out what type of asset it is, provide " +
                    "the “type” explicitly at assets[" + index + "].type");
            return type;
        };
        forEach(assets, function (asset, index) {
            var type = '', src = '', scoped = true;
            if (typeof asset === 'string') { // String type
                if (!isValidAssetSrc(asset, index))
                    return;
                type = assetTypeGetter(trim(src = asset.replace(/\.less|\.s[ac]ss|\.styl/i, '.css')), index);
            }
            else { // Object Type
                if (!isValidAssetSrc(trim(src = asset.src.replace(/\.less|\.s[ac]ss\.styl/i, '.css')), index))
                    return;
                if (!asset.type) {
                    if (!(type = assetTypeGetter(src, index)))
                        return;
                }
                else {
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
            var $Asset = $CreateAnyEl(type, function (el) {
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
    return Component;
}(Base));

var ComponentHandler = /** @class */ (function (_super) {
    __extends(ComponentHandler, _super);
    function ComponentHandler(bouer) {
        var _this = _super.call(this) || this;
        // Handle all the components web requests to avoid multiple requests
        _this.requests = {};
        _this.components = {};
        // Avoids to add multiple styles of the same component if it's already in use
        _this.stylesController = {};
        _this.bouer = bouer;
        _this.serviceProvider = new ServiceProvider(bouer);
        _this.delimiter = _this.serviceProvider.get('DelimiterHandler');
        _this.eventHandler = _this.serviceProvider.get('EventHandler');
        ServiceProvider.add('ComponentHandler', _this);
        return _this;
    }
    ComponentHandler.prototype.check = function (nodeName) {
        return (nodeName in this.components);
    };
    ComponentHandler.prototype.request = function (path, response) {
        var _this = this;
        if (!isNull(this.requests[path]))
            return this.requests[path].push(response);
        this.requests[path] = [response];
        var resolver = urlResolver(path);
        var hasBaseElement = DOM.head.querySelector('base') != null;
        var hasBaseURIInURL = resolver.baseURI === path.substring(0, resolver.baseURI.length);
        // Building the URL according to the main path
        var componentPath = urlCombine(hasBaseURIInURL ? resolver.origin : resolver.baseURI, resolver.pathname);
        webRequest(componentPath, { headers: { 'Content-Type': 'text/plain' } })
            .then(function (response) {
            if (!response.ok)
                throw new Error(response.statusText);
            return response.text();
        })
            .then(function (content) {
            forEach(_this.requests[path], function (request) {
                request.success(content, path);
            });
            delete _this.requests[path];
        })
            .catch(function (error) {
            if (!hasBaseElement)
                Logger.warn("It seems like you are not using the “<base href=\"/base/components/path/\" />” " +
                    "element, try to add as the first child into “<head></head>” element.");
            forEach(_this.requests[path], function (request) { return request.fail(error, path); });
            delete _this.requests[path];
        });
    };
    ComponentHandler.prototype.prepare = function (components, parent) {
        var _this = this;
        forEach(components, function (component) {
            if (isNull(component.path) && isNull(component.template))
                return Logger.warn("The component with name “" + component.name + "”" +
                    (component.route ? (" and route “" + component.route + "”") : "") +
                    " has not “path” or “template” property defined, " + "then it was ignored.");
            if (isNull(component.name) || !component.name) {
                var pathSplitted = component.path.toLowerCase().split('/');
                var generatedComponentName = pathSplitted[pathSplitted.length - 1].replace('.html', '');
                // If the component name already exists generate a new one
                if (_this.components[generatedComponentName])
                    generatedComponentName = toLower(code(8, generatedComponentName + '-component-'));
                component.name = generatedComponentName;
            }
            if (_this.components[component.name])
                return Logger.warn("The component name “" + component.name + "” is already define, try changing the name.");
            if (!isNull(component.route)) { // Completing the route
                component.route = "/" + urlCombine((isNull(parent) ? "" : parent.route), component.route);
            }
            if (Array.isArray(component.children))
                _this.prepare(component.children, component);
            _this.serviceProvider.get('Routing')
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
            if (!(component.prefetch = ifNullReturn(_this.bouer.config.prefetch, true)))
                return;
            return getContent(component.path);
        });
    };
    ComponentHandler.prototype.order = function (componentElement, data, onComponent) {
        var _this = this;
        var $name = toLower(componentElement.nodeName);
        var mComponents = this.components;
        var inComponent = mComponents[$name];
        if (!inComponent)
            return Logger.error("No component with name “" + $name + "” registered.");
        var component = inComponent;
        var iComponent = component;
        var mainExecutionWrapper = function () {
            if (component.template) {
                var newComponent = (component instanceof Component) ? component : new Component(component);
                newComponent.bouer = _this.bouer;
                _this.insert(componentElement, newComponent, data, onComponent);
                if (component.keepAlive === true)
                    mComponents[$name] = component;
                return;
            }
            if (!component.path)
                return Logger.error("Expected a valid value in `path` or `template` got invalid value at “" + $name + "” component.");
            _this.addEvent('requested', componentElement, component, _this.bouer)
                .emit();
            // Make component request or Add
            _this.request(component.path, {
                success: function (content) {
                    var newComponent = (component instanceof Component) ? component : new Component(component);
                    iComponent.template = newComponent.template = content;
                    newComponent.bouer = _this.bouer;
                    _this.insert(componentElement, newComponent, data, onComponent);
                    if (component.keepAlive === true)
                        mComponents[$name] = component;
                },
                fail: function (error) {
                    Logger.error("Failed to request <" + $name + "></" + $name + "> component with path “" + component.path + "”.");
                    Logger.error(buildError(error));
                    _this.addEvent('failed', componentElement, component, _this.bouer).emit();
                }
            });
        };
        // Checking the restrictions
        if (iComponent.restrictions && iComponent.restrictions.length > 0) {
            var blockedRestrictions_1 = [];
            var restrictions = iComponent.restrictions.map(function (restriction) {
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
            var blockedEvent_1 = this.addEvent('blocked', componentElement, component, this.bouer);
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
    ComponentHandler.prototype.find = function (predicate) {
        var keys = Object.keys(this.components);
        for (var i = 0; i < keys.length; i++) {
            var component = this.components[keys[i]];
            if (predicate(component))
                return component;
        }
        return null;
    };
    /** Subscribe the hooks of the instance */
    ComponentHandler.prototype.addEvent = function (eventName, element, component, context) {
        var _this = this;
        var callback = component[eventName];
        if (typeof callback === 'function')
            this.eventHandler.on({
                eventName: eventName,
                callback: function (evt) { return callback.call(context || component, evt); },
                attachedNode: element,
                modifiers: { once: true },
                context: context || component
            });
        var emitter = function (init) {
            _this.eventHandler.emit({
                attachedNode: element,
                once: true,
                eventName: eventName,
                init: init
            });
            _this.eventHandler.emit({
                eventName: 'component:' + eventName,
                init: { detail: { component: component } },
                once: true
            });
        };
        return {
            emit: function (init) { return emitter(init); }
        };
    };
    ComponentHandler.prototype.insert = function (componentElement, component, data, onComponent) {
        var _this = this;
        var $name = toLower(componentElement.nodeName);
        var container = componentElement.parentElement;
        if (!componentElement.isConnected || !container)
            return; //Logger.warn("Insert location of component <" + $name + "></" + $name + "> not found.");
        if (isNull(component.template))
            return Logger.error("The <" + $name + "></" + $name + "> component is not ready yet to be inserted.");
        var elementSlots = $CreateAnyEl('SlotContainer', function (el) {
            el.innerHTML = componentElement.innerHTML;
            componentElement.innerHTML = "";
        }).build();
        var isKeepAlive = componentElement.hasAttribute('keep-alive') || ifNullReturn(component.keepAlive, false);
        // Component Creation
        if (isKeepAlive === false || isNull(component.el)) {
            $CreateEl('body', function (htmlSnippet) {
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
            });
        }
        if (isNull(component.el))
            return;
        var rootElement = component.el;
        // Adding the listeners
        var createdEvent = this.addEvent('created', component.el, component);
        var beforeMountEvent = this.addEvent('beforeMount', component.el, component);
        var mountedEvent = this.addEvent('mounted', component.el, component);
        var beforeLoadEvent = this.addEvent('beforeLoad', component.el, component);
        var loadedEvent = this.addEvent('loaded', component.el, component);
        this.addEvent('beforeDestroy', component.el, component);
        this.addEvent('destroyed', component.el, component);
        var scriptsAssets = where(component.assets, function (asset) { return toLower(asset.nodeName) === 'script'; });
        var initializer = component.init;
        if (isFunction(initializer))
            initializer.call(component);
        var compile = function (scriptContent) {
            try {
                // Executing the mixed scripts
                _this.serviceProvider.get('Evaluator')
                    .execRaw((scriptContent || ''), component);
                createdEvent.emit();
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
                            if (!(reactive.propName in inputData_1))
                                inputData_1[reactive.propName] = undefined;
                            Prop.set(inputData_1, reactive.propName, reactive);
                        });
                        // If data value is empty gets the main scope value
                        if (attr.value === '')
                            inputData_1 = Extend.obj(_this.bouer.data);
                        else {
                            // Other wise, compiles the object provided
                            var mInputData_1 = _this.serviceProvider.get('Evaluator')
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
                            data: inputData_1
                        });
                        return forEach(Object.keys(inputData_1), function (key) {
                            Prop.transfer(component.data, inputData_1, key);
                        });
                    }
                    rootElement.attributes.setNamedItem(attr);
                });
                beforeMountEvent.emit();
                container.replaceChild(rootElement, componentElement);
                mountedEvent.emit();
                var rootClassList_1 = {};
                // Retrieving all the classes of the root element
                rootElement.classList.forEach(function (key) { return rootClassList_1[key] = true; });
                // Changing each selector to avoid conflits
                var changeSelector_1 = function (style, styleId) {
                    var isStyle = (style.nodeName === 'STYLE'), rules = [];
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
                            var selector = (firstRule[0] == '.' || firstRule[0] == '#')
                                ? firstRule.substring(1) : firstRule;
                            var separator = rootClassList_1[selector] ? "" : " ";
                            var uniqueIdentifier = "." + styleId;
                            var selectorTextSplitted = mRule.selectorText.split(' ');
                            if (selectorTextSplitted[0] === toLower(rootElement.tagName))
                                selectorTextSplitted.shift();
                            mRule.selectorText = uniqueIdentifier + separator + selectorTextSplitted.join(' ');
                        }
                        if (isStyle)
                            rules.push(mRule.cssText);
                    }
                    if (isStyle)
                        style.innerText = rules.join(' ');
                };
                var stylesAssets = where(component.assets, function (asset) { return toLower(asset.nodeName) !== 'script'; });
                var styleAttrName_1 = 'component-style';
                // Configuring the styles
                forEach(stylesAssets, function (asset) {
                    var mStyle = asset.cloneNode(true);
                    if (mStyle instanceof HTMLLinkElement) {
                        var path = component.path[0] === '/' ? component.path.substring(1) : component.path;
                        mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
                        mStyle.rel = "stylesheet";
                    }
                    // Checking if this component already have styles added
                    if (_this.stylesController[$name]) {
                        var controller = _this.stylesController[$name];
                        if (controller.elements.indexOf(rootElement) === -1) {
                            controller.elements.push(rootElement);
                            forEach(controller.styles, function ($style) {
                                rootElement.classList.add($style.getAttribute(styleAttrName_1));
                            });
                        }
                        return;
                    }
                    ;
                    var styleId = code(7, 'bouer-s');
                    mStyle.setAttribute(styleAttrName_1, styleId);
                    if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
                        mStyle.onload = function (evt) { return changeSelector_1(evt.target, styleId); };
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
                _this.serviceProvider.get('Compiler')
                    .compile({
                    data: Reactive.transform({ context: component, data: component.data }),
                    onDone: function () {
                        if (isFunction(onComponent))
                            onComponent(component);
                        loadedEvent.emit();
                    },
                    componentSlot: elementSlots,
                    context: component,
                    el: rootElement,
                });
                Task.run(function (stopTask) {
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
                var path = component.path[0] === '/' ? component.path.substring(1) : component.path;
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
            });
        });
    };
    return ComponentHandler;
}(Base));

var DelimiterHandler = /** @class */ (function (_super) {
    __extends(DelimiterHandler, _super);
    function DelimiterHandler(delimiters, bouer) {
        var _this = _super.call(this) || this;
        _this.delimiters = [];
        _this.bouer = bouer;
        _this.delimiters = delimiters;
        ServiceProvider.add('DelimiterHandler', _this);
        return _this;
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
    DelimiterHandler.prototype.shorthand = function (attrName) {
        if (isNull(attrName) || trim(attrName) === '')
            return null;
        var result = attrName.match(new RegExp("{([\\w{$,-}]*?)}"));
        if (!result)
            return null;
        return {
            field: result[0],
            expression: trim(result[1])
        };
    };
    return DelimiterHandler;
}(Base));

var Evaluator = /** @class */ (function (_super) {
    __extends(Evaluator, _super);
    function Evaluator(bouer) {
        var _this = _super.call(this) || this;
        _this.bouer = bouer;
        _this.global = _this.createWindow();
        ServiceProvider.add('Evaluator', _this);
        return _this;
    }
    Evaluator.prototype.createWindow = function () {
        var mWindow;
        $CreateEl('iframe', function (frame, dom) {
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
        var dataToUse = Extend.obj(aditional || {}, { $root: this.bouer.data, $mixin: Extend.mixin });
        // Defining the scope data
        forEach(Object.keys(data), function (key) {
            Prop.transfer(dataToUse, data, key);
        });
        // Applying the global data to the dataToUse variable
        forEach(Object.keys(this.bouer.globalData), function (key) {
            if (key in dataToUse)
                return Logger.warn('It was not possible to use the globalData property "' + key +
                    '" because it already defined in the current scope.');
            Prop.transfer(dataToUse, _this.bouer.globalData, key);
        });
        var keys = Object.keys(dataToUse);
        var returnedValue;
        // Spreading all the properties
        forEach(keys, function (key) {
            delete mGlobal[key];
            // In case of non-configurable property store them to be handled
            if (key in mGlobal && Prop.descriptor(mGlobal, key).configurable === true)
                noConfigurableProperties[key] = mGlobal[key];
            if (key in noConfigurableProperties)
                mGlobal[key] = dataToUse[key];
            Prop.transfer(mGlobal, dataToUse, key);
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
}(Base));

var EventHandler = /** @class */ (function (_super) {
    __extends(EventHandler, _super);
    function EventHandler(bouer) {
        var _this = _super.call(this) || this;
        _this.$events = {};
        _this.input = $CreateEl('input').build();
        _this.bouer = bouer;
        _this.serviceProvider = new ServiceProvider(bouer);
        _this.evaluator = _this.serviceProvider.get('Evaluator');
        ServiceProvider.add('EventHandler', _this);
        _this.cleanup();
        return _this;
    }
    EventHandler.prototype.handle = function (node, data, context) {
        var _this = this;
        var ownerNode = (node.ownerElement || node.parentNode);
        var nodeName = node.nodeName;
        if (isNull(ownerNode))
            return Logger.error("Invalid ParentElement of “" + nodeName + "”");
        // <button on:submit.once.stopPropagation="times++"></button>
        var nodeValue = trim(ifNullReturn(node.nodeValue, ''));
        var eventNameWithModifiers = nodeName.substring(Constants.on.length);
        var allModifiers = eventNameWithModifiers.split('.');
        var eventName = allModifiers[0];
        allModifiers.shift();
        if (nodeValue === '')
            return Logger.error("Expected an expression in the “" + nodeName + "” and got an <empty string>.");
        ownerNode.removeAttribute(nodeName);
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
            this.on({ eventName: eventName, callback: callback, modifiers: modifiersObject, context: context, attachedNode: ownerNode });
        else
            ownerNode.addEventListener(eventName, callback, modifiersObject);
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
            var isEqual = (evt.eventName === eventName && callback == evt.callback);
            if (attachedNode && (evt.attachedNode === attachedNode) && isEqual)
                return false;
            return !isEqual;
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
        this.$events[eventName] = where(events, function (evt) {
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
            evt.callback.call(_this.bouer, new CustomEvent(eventName, init));
            return !isOnceEvent;
        });
    };
    EventHandler.prototype.cleanup = function () {
        var _this = this;
        Task.run(function () {
            forEach(Object.keys(_this.$events), function (key) {
                _this.$events[key] = where(_this.$events[key], function (event) {
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
}(Base));

var Middleware = /** @class */ (function (_super) {
    __extends(Middleware, _super);
    function Middleware(bouer) {
        var _this = _super.call(this) || this;
        _this.middlewareConfigContainer = {};
        _this.run = function (directive, runnable) {
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
                        })).then(function (value) {
                            if (!isNext)
                                cbs.success(value);
                            cbs.done();
                        }).catch(function (error) {
                            if (!isNext)
                                cbs.fail(error);
                            cbs.done();
                        });
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
        _this.register = function (directive, actions) {
            if (!_this.middlewareConfigContainer[directive])
                _this.middlewareConfigContainer[directive] = [];
            var middleware = {};
            actions(function (onBind) { return middleware.onBind = onBind; }, function (onUpdate) { return middleware.onUpdate = onUpdate; });
            _this.middlewareConfigContainer[directive].push(middleware);
        };
        _this.has = function (directive) {
            var middlewares = _this.middlewareConfigContainer[directive];
            if (!middlewares)
                return false;
            return middlewares.length > 0;
        };
        _this.bouer = bouer;
        ServiceProvider.add('Middleware', _this);
        return _this;
    }
    return Middleware;
}(Base));

var Routing = /** @class */ (function (_super) {
    __extends(Routing, _super);
    function Routing(bouer) {
        var _this = _super.call(this) || this;
        _this.routeView = null;
        _this.activeAnchors = [];
        // Store `href` value of the <base /> tag
        _this.base = null;
        _this.bouer = bouer;
        _this.routeView = _this.bouer.el.querySelector('[route-view]');
        ServiceProvider.add('Routing', _this);
        return _this;
    }
    Routing.prototype.init = function () {
        var _this = this;
        if (isNull(this.routeView))
            return;
        this.routeView.removeAttribute('route-view');
        this.base = "/";
        var base = DOM.head.querySelector('base');
        if (base) {
            var baseHref = base.attributes.getNamedItem('href');
            if (!baseHref)
                return Logger.error("The href=\"/\" attribute is required in base element.");
            this.base = baseHref.value;
        }
        if (this.defaultPage)
            this.navigate(DOM.location.href);
        // Listening to the page navigation
        GLOBAL.addEventListener('popstate', function (evt) {
            evt.preventDefault();
            _this.navigate(((evt.state || {}).url || location.href), {
                setURL: false
            });
        });
    };
    Routing.prototype.navigate = function (route, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (!this.routeView)
            return;
        if (isNull(route))
            return Logger.log("Invalid url provided to the navigation method.");
        route = trim(route);
        var resolver = urlResolver(route);
        var usehash = ifNullReturn(this.bouer.config.usehash, true);
        var navigatoTo = (usehash ? resolver.hash : resolver.pathname).split('?')[0];
        // In case of: /about/me/, remove the last forward slash
        if (navigatoTo[navigatoTo.length - 1] === '/')
            navigatoTo = navigatoTo.substring(0, navigatoTo.length - 1);
        var page = this.toPage(navigatoTo);
        this.clear();
        if (!page)
            return; // Page Not Found and NotFound Page Not Defined
        // If it's not found and the url matches .html do nothing
        if (!page && route.endsWith('.html'))
            return;
        var componentElement = $CreateAnyEl(page.name, function (el) {
            // Inherit the data scope by default
            el.setAttribute('data', isObject(options.data) ? JSON.stringify(options.data) : '$data');
        }).appendTo(this.routeView)
            .build();
        // Document info configuration
        DOM.title = page.title || DOM.title;
        if (ifNullReturn(options.setURL, true))
            this.pushState(resolver.href, DOM.title);
        var routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route);
        new ServiceProvider(this.bouer).get('ComponentHandler')
            .order(componentElement, this.bouer.data, function () {
            _this.markActiveAnchorsWithRoute(routeToSet);
        });
    };
    Routing.prototype.pushState = function (url, title) {
        url = urlResolver(url).href;
        if (DOM.location.href === url)
            return;
        GLOBAL.history.pushState({ url: url, title: title }, (title || ''), url);
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
        return new ServiceProvider(this.bouer).get('ComponentHandler')
            .find(function (component) {
            if (!component.route)
                return false;
            var routeRegExp = component.route.replace(/{(.*?)}/gi, '[\\S\\s]{1,}');
            if (Array.isArray(new RegExp("^" + routeRegExp + "$").exec(url)))
                return true;
            return false;
        }) || this.notFoundPage;
    };
    Routing.prototype.markActiveAnchorsWithRoute = function (route) {
        var _this = this;
        var className = this.bouer.config.activeClassName || 'active-link';
        var anchors = this.bouer.el.querySelectorAll('a');
        if (isNull(route))
            return;
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
    Routing.prototype.markActiveAnchor = function (anchor) {
        var className = this.bouer.config.activeClassName || 'active-link';
        if (isNull(anchor))
            return;
        forEach(this.activeAnchors, function (anchor) {
            return anchor.classList.remove(className);
        });
        forEach([].slice.call(this.bouer.el.querySelectorAll('a.' + className)), function (anchor) {
            return anchor.classList.remove(className);
        });
        anchor.classList.add(className);
        this.activeAnchors = [anchor];
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
}(Base));

var Skeleton = /** @class */ (function (_super) {
    __extends(Skeleton, _super);
    function Skeleton(bouer) {
        var _this = _super.call(this) || this;
        _this.backgroudColor = '';
        _this.waveColor = '';
        _this.defaultBackgroudColor = '#E2E2E2';
        _this.defaultWaveColor = '#ffffff5d';
        _this.identifier = "bouer";
        _this.reset();
        _this.bouer = bouer;
        _this.style = $CreateEl('style', function (el) { return el.id = _this.identifier; }).build();
        ServiceProvider.add('Skeleton', _this);
        return _this;
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
            '[--s]{ display: none!important; }',
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
}(Base));

var DataStore = /** @class */ (function (_super) {
    __extends(DataStore, _super);
    function DataStore(bouer) {
        var _this = _super.call(this) || this;
        _this.wait = {};
        _this.data = {};
        _this.req = {};
        _this.bouer = bouer;
        _this.serviceProvider = new ServiceProvider(bouer);
        _this.serviceProvider.add('DataStore', _this);
        return _this;
    }
    DataStore.prototype.set = function (key, dataKey, data) {
        if (key === 'wait')
            return Logger.warn("Only “get” is allowed for type of data");
        this.serviceProvider.get('DataStore')[key][dataKey] = data;
    };
    DataStore.prototype.get = function (key, dataKey, once) {
        var result = this.serviceProvider.get('DataStore')[key][dataKey];
        if (once === true)
            this.unset(key, dataKey);
        return result;
    };
    DataStore.prototype.unset = function (key, dataKey) {
        delete this.serviceProvider.get('DataStore')[key][dataKey];
    };
    return DataStore;
}(Base));

var Bouer = /** @class */ (function (_super) {
    __extends(Bouer, _super);
    /**
     * Default constructor
     * @param selector the selector of the element to be controlled by the instance
     * @param options the options to the instance
     */
    function Bouer(selector, options) {
        var _this_1 = _super.call(this) || this;
        _this_1.name = 'Bouer';
        _this_1.version = '3.0.0';
        _this_1.__id__ = ServiceProvider.GenerateId();
        /**
         * Gets all the elemens having the `ref` attribute
         * @returns an object having all the elements with the `ref attribute value` defined as the key.
         */
        _this_1.refs = {};
        _this_1.isDestroyed = false;
        if (isNull(selector) || trim(selector) === '')
            throw Logger.error(new Error('Invalid selector provided to the instance.'));
        var el = DOM.querySelector(selector);
        if (!el)
            throw Logger.error(new SyntaxError("Element with selector “" + selector + "” not found."));
        _this_1.el = el;
        options = options || {};
        _this_1.config = options.config || {};
        _this_1.deps = options.deps || {};
        forEach(Object.keys(_this_1.deps), function (key) {
            var deps = _this_1.deps;
            var value = deps[key];
            deps[key] = typeof value === 'function' ? value.bind(_this_1) : value;
        });
        var dataStore = new DataStore(_this_1);
        new Evaluator(_this_1);
        var middleware = new Middleware(_this_1);
        // Register the middleware
        if (typeof options.middleware === 'function')
            options.middleware.call(_this_1, middleware.register, _this_1);
        // Transform the data properties into a reative
        _this_1.data = Reactive.transform({
            data: options.data || {},
            context: _this_1
        });
        _this_1.globalData = Reactive.transform({
            data: options.globalData || {},
            context: _this_1
        });
        var delimiters = options.delimiters || [];
        delimiters.push.apply(delimiters, [
            { name: 'common', delimiter: { open: '{{', close: '}}' } },
            { name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
        ]);
        new Binder(_this_1);
        var delimiter = new DelimiterHandler(delimiters, _this_1);
        var eventHandler = new EventHandler(_this_1);
        var routing = new Routing(_this_1);
        var componentHandler = new ComponentHandler(_this_1);
        var compiler = new Compiler(_this_1, options.directives || {});
        new Converter(_this_1);
        var skeleton = new Skeleton(_this_1);
        skeleton.init();
        _this_1.$delimiters = {
            add: delimiter.add,
            remove: delimiter.remove,
            get: function () { return delimiter.delimiters.slice(); }
        };
        _this_1.$data = {
            get: function (key) { return key ? dataStore.data[key] : null; },
            set: function (key, data, toReactive) {
                if (key in dataStore.data)
                    return Logger.log("There is already a data stored with this key “" + key + "”.");
                if (ifNullReturn(toReactive, false) === true)
                    Reactive.transform({
                        context: _this_1,
                        data: data
                    });
                return new ServiceProvider(_this_1).get('DataStore').set('data', key, data);
            },
            unset: function (key) { return delete dataStore.data[key]; }
        };
        _this_1.$req = {
            get: function (key) { return key ? dataStore.req[key] : undefined; },
            unset: function (key) { return delete dataStore.req[key]; },
        };
        _this_1.$wait = {
            get: function (key) {
                if (key)
                    return undefined;
                var waitedData = dataStore.wait[key];
                if (!waitedData)
                    return undefined;
                if (ifNullReturn(waitedData.once, true))
                    _this_1.$wait.unset(key);
                return waitedData.data;
            },
            set: function (key, data, once) {
                if (!(key in dataStore.wait))
                    return dataStore.wait[key] = { data: data, nodes: [], once: ifNullReturn(once, false) };
                var mWait = dataStore.wait[key];
                mWait.data = data;
                forEach(mWait.nodes, function (nodeWaiting) {
                    if (!nodeWaiting)
                        return;
                    compiler.compile({
                        el: nodeWaiting,
                        data: Reactive.transform({
                            context: _this_1,
                            data: mWait.data
                        }),
                        context: _this_1
                    });
                });
                if (ifNullReturn(once, false))
                    _this_1.$wait.unset(key);
            },
            unset: function (key) { return delete dataStore.wait[key]; },
        };
        _this_1.$skeleton = {
            clear: function (id) { return skeleton.clear(id); },
            set: function (color) { return skeleton.init(color); }
        };
        _this_1.$components = {
            add: function (component) { return componentHandler.prepare([component]); },
            get: function (name) { return componentHandler.components[name]; }
        };
        _this_1.$routing = routing;
        Prop.set(_this_1, 'refs', {
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
            el: _this_1.el,
            data: _this_1.data,
            context: _this_1,
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
        });
        // Initializing Routing
        routing.init();
        if (!DOM.head.querySelector("link[rel~='icon']")) {
            $CreateEl('link', function (favicon) {
                favicon.rel = 'icon';
                favicon.type = 'image/png';
                favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
            }).appendTo(DOM.head);
        }
        return _this_1;
    }
    /**
     * Sets data into a target object, by default is the `app.data`
     * @param inputData the data the should be setted
     * @param targetObject the target were the inputData
     * @returns the object with the data setted
     */
    Bouer.prototype.set = function (inputData, targetObject) {
        if (targetObject === void 0) { targetObject = this.data; }
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
            context: this
        });
        // Transfering the properties
        forEach(Object.keys(inputData), function (key) {
            var r_src;
            var r_dst;
            // Notifying the bound elements and the watches
            ReactiveEvent.once('AfterGet', function (evt) {
                evt.onemit = function (reactive) { return r_src = reactive; };
                Prop.descriptor(inputData, key).get();
            });
            // Notifying the bound elements and the watches
            ReactiveEvent.once('AfterGet', function (evt) {
                evt.onemit = function (reactive) { return r_dst = reactive; };
                var desc = Prop.descriptor(targetObject, key);
                if (desc)
                    desc.get();
            });
            Prop.transfer(targetObject, inputData, key);
            if (!r_dst || !r_src)
                return;
            // Adding the previous watches to the property that is being set
            forEach(r_dst.watches, function (watch) {
                if (r_src.watches.indexOf(watch) === -1)
                    r_src.watches.push(watch);
            });
            // Notifying the bounds and watches
            r_src.notify();
        });
        return targetObject;
    };
    /**
     * Compiles a `HTML snippet` to an `Object Literal`
     * @param input the input element
     * @param options the options of the compilation
     * @param onSet a function that should be fired when a value is setted
     * @returns the Object Compiled from the HTML
     */
    Bouer.prototype.toJsObj = function (input, options, onSet) {
        return new ServiceProvider(this).get('Converter').htmlToJsObj(input, options, onSet);
    };
    /**
     * Provides the possibility to watch a property change
     * @param propertyName the property to watch
     * @param callback the function that should be called when the property change
     * @param targetObject the target object having the property to watch
     * @returns the watch object having the method to destroy the watch
     */
    Bouer.prototype.watch = function (propertyName, callback, targetObject) {
        if (targetObject === void 0) { targetObject = this.data; }
        return new ServiceProvider(this).get('Binder').onPropertyChange(propertyName, callback, targetObject || this.data);
    };
    /**
     * Watch all reactive properties in the provided scope.
     * @param watchableScope the function that should be called when the any reactive property change
     * @returns an object having all the watches and the method to destroy watches at once
     */
    Bouer.prototype.react = function (watchableScope) {
        return new ServiceProvider(this).get('Binder')
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
        return new ServiceProvider(this).get('EventHandler').
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
        return new ServiceProvider(this).get('EventHandler').
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
        return new ServiceProvider(this).get('EventHandler').
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
     */
    Bouer.prototype.compile = function (options) {
        return new ServiceProvider(this).get('Compiler').
            compile({
            el: options.el,
            data: options.data,
            context: options.context,
            onDone: options.onDone
        });
    };
    Bouer.prototype.destroy = function () {
        var el = this.el;
        var serviceProvider = new ServiceProvider(this);
        var $Events = serviceProvider.get('EventHandler').$events;
        var destroyedEvents = ($Events['destroyed'] || []).concat(($Events['component:destroyed'] || []));
        this.emit('destroyed', { element: this.el });
        // Dispatching all the destroy events
        forEach(destroyedEvents, function (es) { return es.emit({ once: true }); });
        $Events['destroyed'] = [];
        $Events['component:destroyed'] = [];
        if (el.tagName == 'BODY')
            el.innerHTML = '';
        else if (DOM.contains(el))
            el.parentElement.removeChild(el);
        this.isDestroyed = true;
        serviceProvider.clear();
    };
    return Bouer;
}(Base));

return Bouer;

}));
