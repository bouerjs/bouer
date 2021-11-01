/*!
 * Bouer.js v3.0.0
 * Copyright Easy.js 2018-2020 | 2021-2021 Afonso Matumona
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Bouer = factory());
})(this, (function () { 'use strict';

    function http(input, init) { return fetch(input, init); }
    function code(len, prefix, sufix) {
        var alpha = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var lowerAlt = false, out = '';
        for (var i = 0; i < (len || 8); i++) {
            var pos = Math.floor(Math.random() * alpha.length);
            out += lowerAlt ? alpha[pos].toLowerCase() : alpha[pos];
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
    function isNode(input) {
        return (input instanceof Node);
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
        else if (isObject(input)) {
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
    function buildError(error, options) {
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
    var taskRunner = setInterval;

    var Constants = {
        ignore: 'e-ignore',
        build: 'e-build',
        array: 'e-array',
        if: 'e-if',
        elseif: 'e-else-if',
        else: 'e-else',
        show: 'e-show',
        req: 'e-req',
        tmp: 'e-tmp',
        fill: 'e-fill',
        for: 'e-for',
        use: 'e-use',
        id: 'e-id',
        order: 'e-order',
        filter: 'e-filter',
        data: 'data',
        def: 'e-def',
        wait: 'wait-data',
        toggle: 'e-toggle',
        content: 'e-content',
        bind: 'e-bind',
        property: 'e-',
        anm: 'e-anm',
        skeleton: 'e-skeleton',
        route: 'route-view',
        href: ':href',
        ihref: '!href',
        entry: 'e-entry',
        component: ':name',
        on: 'on:',
        tagContent: 'content',
        ref: 'ref',
        put: 'put',
        connector: 'connector',
        events: {
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
         * @param instance the instance to be store
         */
        IoC.Register = function (instance) {
            this.container[instance.__proto__.constructor.name] = instance;
        };
        /**
         * Resolve and Retrieve the instance registered
         * @param key the name of the class registered
         * @returns the instance of the class
         */
        IoC.Resolve = function (key) {
            return this.container[key];
        };
        /**
         * Destroy an instance registered
         * @param key the name of the class registered
         */
        IoC.Dispose = function (key) {
            delete this.container[key];
        };
        IoC.container = {};
        return IoC;
    }());

    var Observer = /** @class */ (function () {
        function Observer() {
        }
        /**
         * Element Observer
         * @param element the target element to be observe
         * @param callback the callback that will fired when the element changes
         */
        Observer.observe = function (element, callback) {
            var mutation = new MutationObserver(function (records) {
                callback({
                    element: element,
                    mutation: mutation,
                    records: records
                });
            });
            mutation.observe(element, {
                childList: true
            });
        };
        return Observer;
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

    var Binder = /** @class */ (function () {
        function Binder(bouer) {
            this.binds = [];
            this.DEFAULT_BINDER_PROPERTIES = {
                'text': 'value',
                'number': 'valueAsNumber',
                'checkbox': 'checked',
                'radio': 'checked',
            };
            this.BindingDirection = {
                fromInputToData: 'to-data-property',
                fromDataToInput: 'to-input'
            };
            IoC.Register(this);
            this.evaluator = IoC.Resolve('Evaluator');
            this.bouer = bouer;
            this.cleanup();
        }
        Binder.prototype.create = function (options) {
            var _this = this;
            var _a;
            var node = options.node, data = options.data, fields = options.fields, eReplace = options.eReplace;
            var originalValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var originalName = node.nodeName;
            var ownerElement = node.ownerElement || node.parentNode;
            var onChange = options.onChange || (function (value, node) { });
            // Clousure cache property settings
            var propertyBindConfig = {
                name: originalName,
                value: originalValue,
                bindOptions: options,
                boundNode: node
            };
            // Two-Way Data Binding: e-bind:[?]="..."
            if (originalName.substr(0, Constants.bind.length) === Constants.bind) {
                var propertyNameToBind_1 = '';
                if (Constants.bind === originalName) {
                    var key = ownerElement.type || ownerElement.localName;
                    propertyNameToBind_1 = this.DEFAULT_BINDER_PROPERTIES[key] || 'value';
                }
                else {
                    propertyNameToBind_1 = originalName.split(':')[1]; // e-bind:value -> value
                }
                var isSelect_1 = (ownerElement instanceof HTMLSelectElement);
                var isSelectMultiple_1 = isSelect_1 && ownerElement.multiple === true;
                var bindConfig_1 = originalValue.split('|').map(function (x) { return trim(x); });
                var bindProperty_1 = bindConfig_1[0];
                var boundPropertyValue_1;
                var bindModelValue_1;
                var bindModel_1;
                var callback_1 = function (direction, value) {
                    if (!(bindModel_1 = bindConfig_1[1])) {
                        var attrValue = trim(ownerElement.getAttribute('value'));
                        if (attrValue)
                            bindModel_1 = "'" + attrValue + "'";
                    }
                    if (isSelect_1 && !isSelectMultiple_1 && Array.isArray(boundPropertyValue_1) && !bindModel_1) {
                        return Logger.error("Since it's a <select> array binding, it expects the “multiple” attribute in" +
                            " order to bind the multi values.");
                    }
                    // Array Binding
                    if (!isSelectMultiple_1 && (Array.isArray(boundPropertyValue_1) && !bindModel_1)) {
                        return Logger.error("Since it's an array binding it expects a model but it has not been defined" +
                            ", provide a model as it follows " +
                            originalName + "=\"" + bindProperty_1 + " | Model\" or value=\"String-Model\".");
                    }
                    switch (direction) {
                        case _this.BindingDirection.fromDataToInput: {
                            if (Array.isArray(boundPropertyValue_1)) {
                                // select-multiple handling
                                if (isSelectMultiple_1) {
                                    return forEach(toArray(ownerElement.options), function (option) {
                                        option.selected = boundPropertyValue_1.indexOf(trim(option.value)) !== -1;
                                    });
                                }
                                // checkboxes, radio, etc
                                if (boundPropertyValue_1.indexOf(bindModelValue_1) === -1) {
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
                                return;
                            }
                            // Default Binding
                            return ownerElement[propertyNameToBind_1] = (isObject(value) ? toStr(value) : (isNull(value) ? '' : value));
                        }
                        case _this.BindingDirection.fromInputToData: {
                            if (Array.isArray(boundPropertyValue_1)) {
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
                                bindModelValue_1 = bindModelValue_1 || _this.evaluator.exec({ data: data, expression: bindModel_1 });
                                if (value)
                                    boundPropertyValue_1.push(bindModelValue_1);
                                else
                                    boundPropertyValue_1.splice(boundPropertyValue_1.indexOf(bindModelValue_1), 1);
                                return;
                            }
                            // Default Binding
                            return data[bindProperty_1] = value;
                        }
                    }
                };
                var reactiveEvent = ReactiveEvent.on('AfterGet', function (reactive) {
                    _this.binds.push(reactive.watch(function (value) {
                        callback_1(_this.BindingDirection.fromDataToInput, value);
                        onChange(value, node);
                    }, node));
                });
                var result = boundPropertyValue_1 = this.evaluator.exec({
                    expression: bindProperty_1,
                    data: data
                });
                reactiveEvent.off();
                callback_1(this.BindingDirection.fromDataToInput, result);
                var listeners = [ownerElement.nodeName.toLowerCase(), 'propertychange', 'change'];
                var callbackEvent_1 = function () {
                    callback_1(_this.BindingDirection.fromInputToData, ownerElement[propertyNameToBind_1]);
                };
                // Applying the events
                forEach(listeners, function (listener) {
                    if (listener === 'change' && ownerElement.localName !== 'select')
                        return;
                    ownerElement.addEventListener(listener, callbackEvent_1, false);
                });
                // Removing the e-bind attr
                ownerElement.removeAttribute(node.nodeName);
                return propertyBindConfig; // Stop Two-Way Data Binding Process
            }
            // One-Way Data Binding
            var nodeToBind = node;
            // If definable property e-[?]="..."
            if (originalName.substr(0, Constants.property.length) === Constants.property && isNull(eReplace)) {
                propertyBindConfig.name = originalName.substr(Constants.property.length);
                ownerElement.setAttribute(propertyBindConfig.name, originalValue);
                nodeToBind = ownerElement.attributes[propertyBindConfig.name];
                // Removing the e-[?] attr
                ownerElement.removeAttribute(node.nodeName);
            }
            // Property value setter
            var setter = function () {
                var valueToSet = propertyBindConfig.value;
                var isHtml = false;
                // Looping all the fields to be setted
                forEach(fields, function (field) {
                    var delimiter = field.delimiter;
                    if (delimiter && delimiter.name === 'html')
                        isHtml = true;
                    var result = _this.evaluator.exec({
                        expression: field.expression,
                        data: data
                    });
                    result = isNull(result) ? '' : result;
                    valueToSet = valueToSet.replace(field.field, toStr(result));
                    if (delimiter && isFunction(delimiter.action))
                        valueToSet = delimiter.action(valueToSet, node, data);
                });
                if (!isHtml)
                    nodeToBind.nodeValue = valueToSet;
                else {
                    var htmlSnippit = createEl('div', function (el) {
                        el.innerHTML = valueToSet;
                    }).build().children[0];
                    ownerElement.appendChild(htmlSnippit);
                    IoC.Resolve('Compiler').compile({
                        el: htmlSnippit,
                        data: data
                    });
                }
            };
            ReactiveEvent.once('AfterGet', function (event) {
                event.onemit = function (reactive) {
                    _this.binds.push(reactive.watch(function (value) {
                        setter();
                        onChange(value, node);
                    }, node));
                };
                setter();
            });
            propertyBindConfig.boundNode = nodeToBind;
            return propertyBindConfig;
        };
        Binder.prototype.watch = function (propertyName, callback, targetObject) {
            var mWatch = null;
            var mTargetObject = targetObject || this.bouer.data;
            ReactiveEvent.once('AfterGet', function (event) {
                event.onemit = function (reactive) { return mWatch = reactive.watch(callback); };
                mTargetObject[propertyName];
            });
            return mWatch;
        };
        /** Creates a process for unbind properties when it does not exists anymore in the DOM */
        Binder.prototype.cleanup = function () {
            var _this = this;
            taskRunner(function () {
                var availableBinds = [];
                forEach(_this.binds, function (bind) {
                    if (!bind.node)
                        return availableBinds.push(bind);
                    if (bind.node.isConnected)
                        return availableBinds.push(bind);
                    bind.destroy();
                });
                _this.binds = availableBinds;
            }, 1000);
        };
        return Binder;
    }());

    var CommentHandler = /** @class */ (function () {
        function CommentHandler(bouer) {
            IoC.Register(this);
            this.bouer = bouer;
        }
        /** Creates a comment with some identifier */
        CommentHandler.prototype.create = function (id) {
            var comment = DOM.createComment('e');
            comment.id = id || code(8);
            return comment;
        };
        // Gets a comment from an element
        CommentHandler.prototype.get = function (id, element) {
            if (isNull(id))
                return;
            element = element || this.bouer.el;
            return this.retrieve(element).find(function (comment) { return comment.id === id; });
        };
        CommentHandler.prototype.retrieve = function (elem) {
            if (!elem)
                return [];
            var filterNone = function () { return NodeFilter.FILTER_ACCEPT; };
            var iterator = DOM.createNodeIterator(elem, NodeFilter.SHOW_COMMENT, filterNone);
            var nodes = [];
            var node;
            while (node = iterator.nextNode()) {
                // Only adds easy nodes
                if ('id' in node)
                    nodes.push(node);
            }
            return nodes;
        };
        return CommentHandler;
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
        /** Add properties to the first object extracting from the next arguments */
        Extend.addToObj = function (destination) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            forEach(args, function (arg) {
                if (isNull(arg))
                    return;
                forEach(Object.keys(arg), function (key) {
                    var propValue = arg[key];
                    if (isNull(propValue))
                        return;
                    transferProperty(destination, arg, key);
                });
            });
            return destination;
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

    var Reactive = /** @class */ (function () {
        function Reactive(options) {
            var _this = this;
            this.watches = [];
            this.get = function () {
                ReactiveEvent.emit('BeforeGet', _this);
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
                        Reactive.transform(value, _this);
                        var propValueAsAny = _this.propertyValue;
                        propValueAsAny.splice(0, propValueAsAny.length);
                        propValueAsAny.push.apply(propValueAsAny, value);
                    }
                    else if (isObject(value)) {
                        if (isNode(value)) // If some html element
                            _this.propertyValue = value;
                        else {
                            Reactive.transform(value);
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
                ReactiveEvent.emit('AfterSet', _this);
                // Calling all the watches
                forEach(_this.watches, function (watch) { return watch.callback(_this.propertyValue, oldPropertyValue); });
            };
            this.propertyName = options.propertyName;
            this.propertySource = options.sourceObject;
            this.propertyDescriptor = getDescriptor(this.propertySource, this.propertyName);
            // Setting the value of the property
            this.propertyValue = this.propertyDescriptor.value;
        }
        Reactive.prototype.watch = function (callback, node) {
            var w = new Watch(this, callback, { node: node });
            this.watches.push(w);
            return w;
        };
        Reactive.setData = function (inputData, targetObject) {
            if (!isObject(inputData))
                return Logger.error(('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".'));
            if (isObject(targetObject) && targetObject !== null)
                return Logger.error(('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".'));
            // Transforming the input
            Reactive.transform(inputData);
            // Transfering the properties
            forEach(Object.keys(inputData), function (key) { return transferProperty(targetObject, inputData, key); });
            return targetObject;
        };
        var _a;
        _a = Reactive;
        Reactive.transform = function (inputObject, reactiveObj) {
            if (Array.isArray(inputObject)) {
                if (reactiveObj == null) {
                    Logger.warn('Cannot transform this array to a reactive one because no reactive objecto was provided');
                    return inputObject;
                }
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
                                    Reactive.transform(arg);
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
            forEach(Object.keys(inputObject), function (key) {
                var mInputObject = inputObject;
                // Already a reactive property, do nothing
                if (isNull(getDescriptor(inputObject, key).value))
                    return;
                var reactive = new Reactive({
                    propertyName: key,
                    sourceObject: inputObject
                });
                defineProperty(inputObject, key, reactive);
                var propertyValue = mInputObject[key];
                if (isObject(propertyValue))
                    _a.transform(propertyValue);
                else if (Array.isArray(propertyValue)) {
                    _a.transform(propertyValue, reactive); // Transform the array to a reactive one
                    forEach(propertyValue, function (item) { return _a.transform(item); });
                }
            });
            return inputObject;
        };
        return Reactive;
    }());

    var DataStore = /** @class */ (function () {
        function DataStore() {
            this.wait = {};
            this.data = {};
            this.req = {};
            IoC.Register(this);
        }
        DataStore.set = function (key, dataKey, data) {
            if (key === 'wait')
                return Logger.warn("Only “get” is allowed for type of data");
            IoC.Resolve(DataStore.name)[key][dataKey] = data;
        };
        DataStore.get = function (key, dataKey, once) {
            var result = IoC.Resolve(DataStore.name)[key][dataKey];
            if (once === true)
                DataStore.unset(key, dataKey);
            return result;
        };
        DataStore.unset = function (key, dataKey) {
            delete IoC.Resolve(DataStore.name)[key][dataKey];
        };
        return DataStore;
    }());

    var Directive = /** @class */ (function () {
        function Directive(bouer, compiler) {
            this.errorMsgEmptyNode = function (node) { return ("Expected an expression in “" + node.nodeName +
                "” and got an <empty string>."); };
            this.errorMsgNodeValue = function (node) {
                var _a;
                return ("Expected an expression in “" + node.nodeName +
                    "” and got “" + ((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '') + "”.");
            };
            this.bouer = bouer;
            this.compiler = compiler;
            this.evaluator = IoC.Resolve('Evaluator');
            this.delimiter = IoC.Resolve('DelimiterHandler');
            this.comment = IoC.Resolve('CommentHandler');
            this.binder = IoC.Resolve('Binder');
            this.eventHandler = IoC.Resolve('EventHandler');
        }
        // Helper functions
        Directive.prototype.toOwnerNode = function (node) {
            return node.ownerElement || node.parentNode;
        };
        // Directives
        Directive.prototype.ignore = function (node) {
            node.nodeValue = 'true';
        };
        Directive.prototype.if = function (node, data) {
            var _this = this;
            var _a, _b;
            var ownerElement = this.toOwnerNode(node);
            var container = ownerElement.parentElement;
            var conditions = [];
            var comment = this.comment.create();
            var nodeName = node.nodeName;
            var exec = function () { };
            if (!container)
                return;
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
                return _this.binder.binds.push(item.reactive.watch(function () { return exec(); }, item.attr));
            });
            (exec = function () {
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
                    aditional: {
                        _cb: function (chainIndex) {
                            var element = conditions[chainIndex].element;
                            container.replaceChild(element, comment);
                            _this.compiler.compile({
                                el: element,
                                data: data
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
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            if (nodeValue === '')
                return Logger.error(this.errorMsgEmptyNode(node));
            if (hasDelimiter)
                return Logger.error(this.errorMsgNodeValue(node));
            var exec = function (element) {
                var value = _this.evaluator.exec({
                    expression: nodeValue,
                    data: data
                });
                element.style.display = value ? '' : 'none';
            };
            connectNode(node, ownerElement);
            var bindResult = this.binder.create({
                data: data,
                node: node,
                fields: [{ expression: nodeValue, field: nodeValue }],
                onChange: function () { return exec(ownerElement); }
            });
            exec(ownerElement);
            ownerElement.removeAttribute(bindResult.boundNode.nodeName);
        };
        Directive.prototype.for = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var container = ownerElement.parentElement;
            var comment = this.comment.create();
            var nodeName = node.nodeName;
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var listedItems = [];
            var exec = function () { };
            if (!container)
                return;
            if (nodeValue === '')
                return Logger.error(this.errorMsgEmptyNode(node));
            if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
                return Logger.error(("Expected a valid “for” expression in “" + nodeName + "” and got “" + nodeValue + "”."
                    + "\nValid: e-for=\"item of items\"."));
            // Binding the e-for if got delimiters
            var delimiters = this.delimiter.run(nodeValue);
            if (delimiters.length !== 0)
                this.binder.create({
                    data: data,
                    fields: delimiters,
                    eReplace: true,
                    node: node,
                    onChange: function () { return exec(); }
                });
            ownerElement.removeAttribute(nodeName);
            var forItem = ownerElement.cloneNode(true);
            container.replaceChild(comment, ownerElement);
            connectNode(forItem, comment);
            connectNode(node, comment);
            var filter = function (list, filterConfigParts) {
                var filterValue = filterConfigParts[1];
                var filterKeys = filterConfigParts[2];
                if (isNull(filterValue) || filterValue === '') {
                    Logger.error(("Invalid filter-value in “" + nodeName + "” with “" + nodeValue + "” expression."));
                    return list;
                }
                filterValue = _this.evaluator.exec({
                    data: data,
                    expression: filterValue
                });
                // filter:myFilter
                if (typeof filterValue === 'function') {
                    list = filterValue(list);
                }
                else {
                    // filter:search:name
                    if (isNull(filterKeys) || filterKeys === '') {
                        Logger.error(("Invalid filter-keys in “" + nodeName + "” with “" + nodeValue + "” expression, " +
                            "at least one filter-key to be provided."));
                        return list;
                    }
                    var newListCopy_1 = [];
                    forEach(list, function (item) {
                        for (var _i = 0, _a = filterKeys.split(',').map(function (m) { return trim(m); }); _i < _a.length; _i++) {
                            var prop = _a[_i];
                            var propValue = _this.evaluator.exec({ data: item, expression: prop });
                            if (!toStr(propValue).includes(filterValue))
                                break;
                            newListCopy_1.push(item);
                        }
                    });
                    list = newListCopy_1;
                }
                return list;
            };
            var order = function (list, type, prop) {
                if (!type)
                    type = 'asc';
                return list.sort(function (a, b) {
                    var comparison = function (asc, desc) {
                        if (isNull(asc) || isNull(desc))
                            return 0;
                        switch (type.toLowerCase()) {
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
            var expressionToObj = function (expression) {
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
                var sourceValue = _this.evaluator.exec({ data: data, expression: rightHand });
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
            var reactivePropertyEvent = ReactiveEvent.on('AfterGet', function (reactive) { return _this.binder.binds.push(reactive.watch(function () { return exec(); }, node)); });
            var expressionObj = expressionToObj(nodeValue);
            reactivePropertyEvent.off();
            (exec = function () {
                var _a;
                expressionObj = expressionObj || expressionToObj(trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : ''));
                var iterable = expressionObj.iterableExpression, leftHandParts = expressionObj.leftHandParts, sourceValue = expressionObj.sourceValue, isForOf = expressionObj.isForOf, filters = expressionObj.filters;
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
                    expression: "_for(" + iterable + ", ($$itm, $$idx) => { _each($$itm, $$idx); })",
                    aditional: {
                        _for: forEach,
                        _each: function (item, index) {
                            var forData = Extend.obj(data);
                            var _item_key = leftHandParts[0];
                            var _index_or_value = leftHandParts[1] || 'index_or_value';
                            var _index = leftHandParts[2] || 'for_in_index';
                            forData[_item_key] = item;
                            forData[_index_or_value] = isForOf ? index : sourceValue[item];
                            forData[_index] = index;
                            var clonedItem = container.insertBefore(forItem.cloneNode(true), comment);
                            _this.compiler.compile({
                                el: clonedItem,
                                data: forData
                            });
                            listedItems.push(clonedItem);
                        },
                        _flt: function (list) {
                            var listCopy = Extend.array(list);
                            var findFilter = function (fName) {
                                return filters.find(function (item) { return item.substr(0, fName.length) === fName; });
                            };
                            // applying filter:
                            var filterConfig = findFilter('filter');
                            if (filterConfig) {
                                var filterConfigParts = filterConfig.split(':').map(function (item) { return trim(item); });
                                if (filterConfigParts.length == 1) {
                                    Logger.error(("Invalid “" + nodeName + "” filter expression “" + nodeValue +
                                        "”, at least a filter-value and filter-keys, or a filter-function must be provided"));
                                }
                                else {
                                    listCopy = filter(listCopy, filterConfigParts);
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
                                    listCopy = order(listCopy, orderConfigParts[1], orderConfigParts[2]);
                                }
                            }
                            return listCopy;
                        }
                    }
                });
                expressionObj = null;
            })();
        };
        Directive.prototype.def = function (node, data) {
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            if (nodeValue === '')
                return Logger.error(this.errorMsgEmptyNode(node));
            if (hasDelimiter)
                return Logger.error(this.errorMsgNodeValue(node));
            var inputData = this.evaluator.exec({
                data: data,
                expression: nodeValue
            });
            if (!isObject(inputData))
                return Logger.error(("Expected a valid Object Literal expression in “"
                    + node.nodeName + "” and got “" + nodeValue + "”."));
            this.bouer.setData(inputData, data);
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
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            if (nodeValue === '')
                return Logger.error(this.errorMsgEmptyNode(node));
            if (hasDelimiter)
                return Logger.error(this.errorMsgNodeValue(node));
            this.binder.create({
                node: connectNode(node, ownerElement),
                fields: [{ field: nodeValue, expression: nodeValue }],
                data: data
            });
            ownerElement.removeAttribute(node.nodeName);
        };
        Directive.prototype.property = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            var exec = function (obj) { };
            var errorInvalidValue = function (node) {
                var _a;
                return ("Invalid value, expected an Object/Object Literal in “" + node.nodeName
                    + "” and got “" + ((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '') + "”.");
            };
            if (nodeValue === '')
                return Logger.error(errorInvalidValue(node));
            if (hasDelimiter)
                return;
            var inputData = this.evaluator.exec({
                data: data,
                expression: nodeValue
            });
            if (!isObject(inputData))
                return Logger.error(errorInvalidValue(node));
            this.binder.create({
                data: data,
                node: connectNode(node, ownerElement),
                eReplace: false,
                fields: [{ expression: nodeValue, field: nodeValue }],
                onChange: function () { return exec(_this.evaluator.exec({
                    data: data,
                    expression: nodeValue
                })); }
            });
            ownerElement.removeAttribute(node.nodeName);
            (exec = function (obj) {
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
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            var inputData = {};
            if (hasDelimiter)
                return Logger.error(("The “data” attribute cannot contain delimiter."));
            ownerElement.removeAttribute(node.nodeName);
            var mData = Extend.obj(data, { $this: data });
            var reactiveEvent = ReactiveEvent.on('AfterGet', function (reactive) {
                inputData[reactive.propertyName] = undefined;
                defineProperty(inputData, reactive.propertyName, reactive);
            });
            // If data value is empty gets the main scope value
            if (nodeValue === '')
                inputData = Extend.obj(this.bouer.data);
            else {
                // Other wise, compiles the object provided
                var mInputData_1 = this.evaluator.exec({ data: mData, expression: nodeValue });
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
                DataStore.set('data', dataKey, inputData);
            }
            Reactive.transform(inputData);
            return this.compiler.compile({
                data: inputData,
                el: ownerElement
            });
        };
        Directive.prototype.href = function (node, data) {
            var _a, _b;
            var ownerElement = this.toOwnerNode(node);
            var nodeName = node.nodeName;
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
                    fields: delimiters
                });
            ownerElement
                .addEventListener('click', function (event) {
                event.preventDefault();
                IoC.Resolve('Routing')
                    .navigate(href.value);
            }, false);
            href.markable = nodeName[0] === ':';
        };
        Directive.prototype.entry = function (node, data) {
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            if (nodeValue === '')
                return Logger.error(this.errorMsgEmptyNode(node));
            if (hasDelimiter)
                return Logger.error(this.errorMsgNodeValue(node));
            ownerElement.removeAttribute(node.nodeName);
            IoC.Resolve('ComponentHandler')
                .prepare([
                {
                    name: nodeValue,
                    template: ownerElement.outerHTML,
                    data: data
                }
            ]);
        };
        Directive.prototype.put = function (node, data) {
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var exec = function () { };
            if (nodeValue === '')
                return Logger.error(this.errorMsgEmptyNode(node), "Direct <empty string> injection value is allowed, only with a delimiter.");
            var delimiters = this.delimiter.run(nodeValue);
            ownerElement.removeAttribute(node.nodeName);
            if (delimiters.length !== 0)
                this.binder.create({
                    data: data,
                    node: connectNode(node, ownerElement),
                    fields: delimiters,
                    onChange: function () { return exec(); }
                });
            (exec = function () {
                var _a;
                ownerElement.innerHTML = '';
                nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
                if (nodeValue === '')
                    return;
                var componentElement = createAnyEl(nodeValue)
                    .appendTo(ownerElement)
                    .build();
                IoC.Resolve('ComponentHandler')
                    .order(componentElement, data);
            })();
        };
        Directive.prototype.req = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeName = node.nodeName;
            var localDataStore = {};
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var exec = function () { };
            if (!nodeValue.includes(' of ') && !nodeValue.includes(' as '))
                return Logger.error(("Expected a valid “for” expression in “" + nodeName
                    + "” and got “" + nodeValue + "”." + "\nValid: e-req=\"item of [url]\"."));
            // If it's list request type, connect ownerNode
            if (nodeValue.includes(' of '))
                connectNode(ownerElement, ownerElement.parentNode);
            connectNode(node, ownerElement);
            var delimiters = this.delimiter.run(nodeValue);
            if (delimiters.length !== 0)
                this.binder.create({
                    data: data,
                    node: node,
                    fields: delimiters,
                    eReplace: false,
                    onChange: function () { return exec(); }
                });
            ownerElement.removeAttribute(node.nodeName);
            var subcribeEvent = function (eventName) {
                var attr = ownerElement.attributes[Constants.on + eventName];
                if (attr)
                    _this.eventHandler.handle(attr, data);
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
            var interceptor = IoC.Resolve('Interceptor');
            var requestEvent = subcribeEvent(Constants.events.request);
            var responseEvent = subcribeEvent(Constants.events.response);
            var failEvent = subcribeEvent(Constants.events.fail);
            var doneEvent = subcribeEvent(Constants.events.done);
            (exec = function () {
                nodeValue = trim(node.nodeValue || "");
                var filters = nodeValue.split('|').map(function (item) { return trim(item); });
                var reqExpression = filters[0].replace(/\(|\)/g, '');
                filters.shift();
                var reqSeparator = ' of ';
                var reqParts = reqExpression.split(reqSeparator);
                if (!(reqParts.length > 1))
                    reqParts = reqExpression.split(reqSeparator = ' as ');
                var mReqSeparator = trim(reqSeparator);
                var dataKey = node.nodeName.split(':')[1];
                dataKey = dataKey ? dataKey.replace(/\[|\]/g, '') : '';
                requestEvent.emit();
                interceptor.run('req', {
                    http: http,
                    type: mReqSeparator,
                    path: reqParts[1].replace(/\[|\]/g, ''),
                    success: function (response) {
                        var _a;
                        if (!response)
                            return Logger.error(("the “success” parameter must be an object containing " +
                                "“data” property. Example: { data: {} | [] }"));
                        if (!("data" in response))
                            return Logger.error(("the “success” parameter must be contain the “data” " +
                                "property. Example: { data: {} | [] }"));
                        if ((mReqSeparator === 'of' && !Array.isArray(response.data)))
                            return Logger.error(("Using e-ref=\"... “of” ...\" the response must be a " +
                                "list of items, and got “" + typeof response.data + "”."));
                        if ((mReqSeparator === 'as' && !(typeof response.data === 'object')))
                            return Logger.error(("Using e-ref=\"... “as” ...\" the response must be a list " +
                                "of items, and got “" + typeof response.data + "”."));
                        Reactive.transform(response);
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
                            DataStore.set('req', dataKey, response);
                        switch (mReqSeparator) {
                            case 'as':
                                // Removing the: “(...)”  “,”  and getting only the variable
                                var variable = trim(reqParts[0].split(',')[0].replace(/\(|\)/g, ''));
                                return _this.compiler.compile({
                                    el: ownerElement,
                                    data: Extend.obj((_a = {}, _a[variable] = response.data, _a), data),
                                    onDone: function (_, inData) {
                                        subcribeEvent(Constants.events.compile)
                                            .emit({
                                            data: inData
                                        });
                                    }
                                });
                            case 'of':
                                var forDirectiveContent = nodeValue.replace(reqParts[1], '_response_');
                                ownerElement.setAttribute(Constants.for, forDirectiveContent);
                                return _this.compiler.compile({
                                    el: ownerElement,
                                    data: Extend.obj({ _response_: response.data }, data),
                                    onDone: function (_, inData) {
                                        subcribeEvent(Constants.events.compile)
                                            .emit({
                                            data: inData
                                        });
                                    }
                                });
                        }
                    },
                    fail: function (error) { return failEvent.emit({
                        error: error
                    }); },
                    done: function () { return doneEvent.emit(); }
                });
            })();
        };
        Directive.prototype.wait = function (node) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            var dataStore = IoC.Resolve('DataStore');
            if (nodeValue === '')
                return Logger.error(this.errorMsgEmptyNode(node));
            if (hasDelimiter)
                return Logger.error(this.errorMsgNodeValue(node));
            ownerElement.removeAttribute(node.nodeName);
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
                        data: Reactive.transform(mWait.data)
                    });
                });
            }
            return dataStore.wait[nodeValue] = { nodes: [ownerElement] };
        };
        Directive.prototype.skeleton = function (node, data) {
            Logger.warn('e-skeleton not implemented yet.');
        };
        return Directive;
    }());

    var Compiler = /** @class */ (function () {
        function Compiler(bouer) {
            this.NODES_TO_IGNORE_IN_COMPILATION = {
                'SCRIPT': 1,
                '#comment': 8
            };
            IoC.Register(this);
            this.bouer = bouer;
            this.binder = IoC.Resolve('Binder');
            this.delimiter = IoC.Resolve('DelimiterHandler');
            this.eventHandler = IoC.Resolve('EventHandler');
            this.component = IoC.Resolve('ComponentHandler');
            this.directive = new Directive(bouer, this);
        }
        Compiler.prototype.compile = function (options) {
            var _this = this;
            var rootElement = options.el;
            var data = (options.data || this.bouer.data);
            if (!this.analize(rootElement.outerHTML))
                return;
            var walker = function (node, data) {
                if (node.nodeName in _this.NODES_TO_IGNORE_IN_COMPILATION)
                    return;
                // First Element Attributes compilation
                if (node instanceof Element) {
                    // e-ignore" directive
                    if (Constants.ignore in node.attributes)
                        return _this.directive.ignore(node);
                    if (node.localName === Constants.tagContent && options.componentContent) {
                        var insertContent_1 = function (content, reference) {
                            forEach(toArray(content.childNodes), function (child) {
                                var cloned = child.cloneNode(true);
                                rootElement.insertBefore(cloned, reference);
                                walker(cloned, data);
                            });
                            rootElement.removeChild(reference);
                        };
                        if (node.hasAttribute('default')) {
                            // In case of default content insertion
                            return insertContent_1(options.componentContent, node);
                        }
                        else if (node.hasAttribute('target')) {
                            // In case of target content insertion
                            var target_1 = node.attributes['target'];
                            return forEach(toArray(options.componentContent.children), function (child) {
                                if (child.localName === Constants.tagContent && child.getAttribute('target') !== target_1.value)
                                    return;
                                insertContent_1(child, node);
                            });
                        }
                    }
                    // e-def="{...}" directive
                    if (Constants.def in node.attributes)
                        _this.directive.def(node.attributes[Constants.def], data);
                    // e-entry="..." directive
                    if (Constants.entry in node.attributes)
                        _this.directive.entry(node.attributes[Constants.entry], data);
                    // wait-data="..." directive
                    if (Constants.wait in node.attributes)
                        return _this.directive.wait(node.attributes[Constants.wait]);
                    // <component></component>
                    if (_this.component.check(node.localName))
                        return _this.component.order(node, data);
                    // e-for="..." directive
                    if (Constants.for in node.attributes)
                        return _this.directive.for(node.attributes[Constants.for], data);
                    // e-if="..." directive
                    if (Constants.if in node.attributes)
                        return _this.directive.if(node.attributes[Constants.if], data);
                    // e-else-if="..." or e-else directive
                    if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
                        Logger.warn('The "' + Constants.elseif + '" or "' + Constants.else + '" requires an element with "' + Constants.if + '" above.');
                    // e-show="..." directive
                    if (Constants.show in node.attributes)
                        _this.directive.show(node.attributes[Constants.show], data);
                    // e-req="..." | e-req:[id]="..."  directive
                    var reqNode = null;
                    if ((reqNode = node.attributes[Constants.req]) ||
                        (reqNode = toArray(node.attributes).find(function (attr) { return Constants.check(attr, Constants.req); })))
                        return _this.directive.req(reqNode, data);
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
                        return _this.directive.data(dataNode, data);
                    // put="..." directive
                    if (Constants.put in node.attributes)
                        return _this.directive.put(node.attributes[Constants.put], data);
                    // Looping the attributes
                    forEach(toArray(node.attributes), function (attr) {
                        walker(attr, data);
                    });
                }
                // :href="..." or !href="..." directive
                if (Constants.check(node, Constants.href) || Constants.check(node, Constants.ihref))
                    return _this.directive.href(node, data);
                // e-content="..." directive
                if (Constants.check(node, Constants.content))
                    return _this.directive.content(node);
                // e-bind:[?]="..." directive
                if (Constants.check(node, Constants.bind))
                    return _this.directive.bind(node, data);
                // e-[?]="..." directive
                if (Constants.check(node, Constants.property) && !Constants.isConstant(node.nodeName))
                    _this.directive.property(node, data);
                // Event handler
                // on:[?]="..." directive
                if (Constants.check(node, Constants.on))
                    return _this.eventHandler.handle(node, data);
                // Property binding
                var delimitersFields;
                if (isString(node.nodeValue) && (delimitersFields = _this.delimiter.run(node.nodeValue)) && delimitersFields.length !== 0) {
                    _this.binder.create({
                        node: connectNode(node, rootElement),
                        fields: delimitersFields,
                        data: data
                    });
                }
                forEach(toArray(node.childNodes), function (childNode) {
                    return walker(childNode, data);
                });
            };
            walker(rootElement, data);
            if (isFunction(options.onDone))
                options.onDone.call(this.bouer, rootElement);
        };
        Compiler.prototype.analize = function (htmlSnippet) {
            return true;
        };
        return Compiler;
    }());

    var Converter = /** @class */ (function () {
        function Converter(bouer) {
            IoC.Register(this);
            this.bouer = bouer;
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
                throw Logger.error(("Invalid element passed in app.toJsObj(...)."));
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
                            onSet.call(instance, builtObject, propName, value, el);
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
                            onSet.call(instance, lastLayer, leadElement, builderObjValue, buildElement);
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
        function Component(options) {
            this.scripts = [];
            this.styles = [];
            // Store temporarily this component UI orders
            this.events = [];
            this.name = options.name;
            this.path = options.path;
            Object.assign(this, options);
            this.data = Reactive.transform(this.data || {});
        }
        Object.defineProperty(Component.prototype, "isReady", {
            get: function () {
                return !isNull(this.template);
            },
            enumerable: false,
            configurable: true
        });
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
            this.emit('destroyed');
            // Destroying all the events attached to the this instance
            forEach(this.events, function (evt) { return _this.off(evt.eventName, evt.callback); });
            this.events = [];
            forEach(this.styles, function (style) {
                return forEach(toArray(DOM.head.children), function (item) {
                    if (item === style)
                        DOM.removeChild(style);
                });
            });
        };
        Component.prototype.params = function () {
            return new UriHandler().params(this.route);
        };
        Component.prototype.emit = function (eventName, init) {
            var eventHandler = IoC.Resolve('EventHandler');
            eventHandler.emit({
                eventName: eventName,
                attachedNode: this.el,
                init: init
            });
        };
        Component.prototype.on = function (eventName, callback) {
            var eventHandler = IoC.Resolve('EventHandler');
            var evt = eventHandler.on(eventName, callback, this.el);
            this.events.push(evt);
        };
        Component.prototype.off = function (eventName, callback) {
            var eventHandler = IoC.Resolve('EventHandler');
            eventHandler.on(eventName, callback, this.el);
        };
        return Component;
    }());

    var ComponentHandler = /** @class */ (function () {
        function ComponentHandler(bouer, components) {
            this.components = {};
            // Handle all the components web requests to avoid multiple requests
            this.requests = {};
            IoC.Register(this);
            this.bouer = bouer;
            this.delimiter = IoC.Resolve('DelimiterHandler');
            this.eventHandler = IoC.Resolve('EventHandler');
            if (components) {
                if (!DOM.head.querySelector('base'))
                    Logger.warn("“<base href=\"/\" />” element not found, we advise to set it " +
                        "as first element of “<head></head>” to avoid errors when url have extension (.html)." +
                        "\n@see: https://www.w3schools.com/tags/tag_base.asp");
                this.prepare(components);
            }
        }
        ComponentHandler.prototype.check = function (nodeName) {
            return (nodeName in this.components);
        };
        ComponentHandler.prototype.request = function (url, response) {
            var _this = this;
            if (!isNull(this.requests[url]))
                return this.requests[url].push(response);
            this.requests[url] = [response];
            var urlPath = urlCombine(urlResolver(anchor.baseURI).baseURI, url);
            http(urlPath, { headers: { 'Content-Type': 'text/plain' } })
                .then(function (response) {
                if (!response.ok)
                    throw ((response.statusText));
                return response.text();
            })
                .then(function (content) {
                forEach(_this.requests[url], function (request) {
                    request.success(content, url);
                });
            })
                .catch(function (error) {
                forEach(_this.requests[url], function (request) {
                    request.fail(error, url);
                });
            }).finally(function () {
                delete _this.requests[url];
            });
        };
        ComponentHandler.prototype.prepare = function (components, parent) {
            var _this = this;
            forEach(components, function (component) {
                var _a;
                if (isNull(component.name))
                    component.name = code(9, 'component-').toLowerCase();
                if (isNull(component.path) && isNull(component.template))
                    return Logger.warn("The component with name “" + component.name + "”" +
                        component.route ? (" and the route “" + component.route + "”") : "" +
                        " has not “path” or “template” property defined, " +
                        "then it was ignored.");
                if (Array.isArray(component.children))
                    _this.prepare(component.children, component);
                if (!isNull(component.route)) { // Completing the API
                    component.route = "/" + urlCombine((isNull(parent) ? "" : parent.route), component.route);
                }
                if (!isNull(_this.components[component.name]))
                    return Logger.warn("The component name “" + component.name + "” is already define, try changing the name.");
                IoC.Resolve('Routing').configure(_this.components[component.name] = component);
                var preload = (_a = (_this.bouer.config || {}).preload) !== null && _a !== void 0 ? _a : true;
                if (!preload)
                    return;
                if (!isNull(component.path))
                    _this.request(component.path, {
                        success: function (content) {
                            component.template = content;
                        },
                        fail: function (error) {
                            Logger.error(buildError(error));
                        }
                    });
            });
        };
        ComponentHandler.prototype.order = function (componentElement, data, callback) {
            var _this = this;
            var $name = componentElement.nodeName.toLowerCase();
            var mComponents = this.components;
            var hasComponent = mComponents[$name];
            if (!hasComponent)
                return Logger.error(("No component with name “" + $name + "” registered."));
            var icomponent = hasComponent;
            var mData = Extend.obj(data, { $this: data });
            if (icomponent.template) {
                var component = new Component(icomponent);
                component.bouer = this.bouer;
                if (isFunction(callback))
                    callback(component);
                this.insert(componentElement, component, mData);
                if (component.keepAlive === true)
                    mComponents[$name] = component;
                return;
            }
            var requestedEvent = this.$addEvent('requested', componentElement, icomponent);
            if (requestedEvent)
                requestedEvent.emit();
            // Make or Add request
            this.request(icomponent.path, {
                success: function (content) {
                    icomponent.template = content;
                    var component = new Component(icomponent);
                    component.bouer = _this.bouer;
                    if (isFunction(callback))
                        callback(component);
                    _this.insert(componentElement, component, mData);
                    if (component.keepAlive === true)
                        mComponents[$name] = component;
                },
                fail: function (error) {
                    Logger.error(("Failed to request <" + $name + "></" + $name + "> component with path “" + icomponent.path + "”."));
                    Logger.error(buildError(error));
                    if (typeof icomponent.failed !== 'function')
                        return;
                    icomponent.failed(new CustomEvent('failed'));
                }
            });
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
        ComponentHandler.prototype.$addEvent = function (eventName, element, callbackSource) {
            var callback = callbackSource[eventName];
            if (typeof callback !== 'function')
                return { emit: (function () { }) };
            var emitter = this.eventHandler.on(eventName, function (evt) { return callback(evt); }, element).emit;
            return {
                emit: function () {
                    emitter({
                        eventName: eventName,
                        attachedNode: element
                    });
                }
            };
        };
        ComponentHandler.prototype.insert = function (componentElement, component, data) {
            var _this = this;
            var _a;
            var $name = componentElement.nodeName.toLowerCase();
            var container = componentElement.parentElement;
            if (!componentElement.isConnected || !container)
                return; //Logger.warn("Insert location of component <" + $name + "></" + $name + "> not found.");
            if (!component.isReady)
                return Logger.error(("The <" + $name + "></" + $name + "> component is not ready yet to be inserted."));
            var elementContent = createEl('div', function (el) {
                el.innerHTML = componentElement.innerHTML;
                componentElement.innerHTML = "";
            }).build();
            // Component Creation
            if (((_a = component.keepAlive) !== null && _a !== void 0 ? _a : false) === false || isNull(component.el)) {
                createEl('body', function (htmlSnippet) {
                    htmlSnippet.innerHTML = component.template;
                    forEach([].slice.apply(htmlSnippet.querySelectorAll('script')), function (script) {
                        component.scripts.push(script);
                        htmlSnippet.removeChild(script);
                    });
                    forEach([].slice.apply(htmlSnippet.querySelectorAll('link[rel="stylesheet"]')), function (style) {
                        component.styles.push(style);
                        htmlSnippet.removeChild(style);
                    });
                    forEach([].slice.apply(htmlSnippet.querySelectorAll('style')), function (style) {
                        component.styles.push(style);
                        htmlSnippet.removeChild(style);
                    });
                    if (htmlSnippet.children.length === 0)
                        return Logger.error(("The component <" + $name + "></" + $name + "> " +
                            "seems to be empty or it has not a root element. Example: <div></div>, to be included."));
                    if (htmlSnippet.children.length > 1)
                        return Logger.error(("The component <" + $name + "></" + $name + "> " +
                            "seems to have multiple root element, it must have only one root."));
                    component.el = htmlSnippet.children[0];
                    _this.$addEvent('created', component.el, component);
                    component.emit('created');
                });
            }
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
                    var mData = Extend.obj(data, { $this: data });
                    var reactiveEvent = ReactiveEvent.on('AfterGet', function (reactive) {
                        inputData_1[reactive.propertyName] = undefined;
                        defineProperty(inputData_1, reactive.propertyName, reactive);
                    });
                    // If data value is empty gets the main scope value
                    if (attr.value === '')
                        inputData_1 = Extend.obj(_this.bouer.data);
                    else {
                        // Other wise, compiles the object provided
                        var mInputData_1 = IoC.Resolve('Evaluator')
                            .exec({ data: mData, expression: attr.value });
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
                    Reactive.transform(inputData_1);
                    return forEach(Object.keys(inputData_1), function (key) {
                        transferProperty(component.data, inputData_1, key);
                    });
                }
                rootElement.attributes.setNamedItem(attr);
            });
            this.$addEvent('beforeMount', component.el, component);
            component.emit('beforeMount');
            container.replaceChild(rootElement, componentElement);
            var rootClassList = {};
            // Retrieving all the classes of the retu elements
            rootElement.classList.forEach(function (key) { return rootClassList[key] = true; });
            // Changing each selector to avoid conflits
            var changeSelector = function (style, id) {
                var isStyle = (style.nodeName === 'STYLE'), rules = [];
                if (!style.sheet)
                    return;
                var cssRules = style.sheet.cssRules;
                for (var i = 0; i < cssRules.length; i++) {
                    var rule = cssRules.item(i);
                    if (!rule)
                        continue;
                    var mRule = rule;
                    var selector = mRule.selectorText.substr(1);
                    var separation = rootClassList[selector] ? "" : " ";
                    mRule.selectorText = "." + id + separation + mRule.selectorText;
                    if (isStyle)
                        rules.push(mRule.cssText);
                }
                if (isStyle)
                    style.innerText = rules.join('\n');
            };
            // Configuring the styles
            forEach(component.styles, function (style) {
                var mStyle = style.cloneNode(true);
                var styleId = code(7, 'bouer-s');
                if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
                    mStyle.onload = function (evt) {
                        return changeSelector(evt.target, styleId);
                    };
                DOM.head.appendChild(mStyle);
                if (!mStyle.hasAttribute('scoped'))
                    return;
                rootElement.classList.add(styleId);
                if (mStyle instanceof HTMLStyleElement)
                    return changeSelector(mStyle, styleId);
            });
            var compile = function (scriptContent) {
                try {
                    // Executing the mixed scripts
                    IoC.Resolve('Evaluator')
                        .execRaw((scriptContent || ''), component);
                    _this.$addEvent('mounted', component.el, component);
                    component.emit('mounted');
                    // TODO: Something between this two events
                    _this.$addEvent('beforeLoad', component.el, component);
                    component.emit('beforeLoad');
                    IoC.Resolve('Compiler')
                        .compile({
                        data: Reactive.transform(component.data),
                        el: rootElement,
                        componentContent: elementContent,
                        onDone: function () {
                            _this.$addEvent('loaded', component.el, component);
                            component.emit('loaded');
                        }
                    });
                    Observer.observe(container, function () {
                        if (rootElement.isConnected)
                            return;
                        component.destroy();
                    });
                }
                catch (error) {
                    Logger.error(("Error in <" + $name + "></" + $name + "> component."));
                    Logger.error(buildError(error));
                }
            };
            if (component.scripts.length === 0)
                return compile();
            // Mixing all the scripts
            var localScriptsContent = [], onlineScriptsContent = [], onlineScriptsUrls = [], webRequestChecker = {};
            // Grouping the online scripts and collecting the online url
            forEach(component.scripts, function (script) {
                if (script.src == '' || script.innerHTML)
                    localScriptsContent.push(script.innerHTML);
                else
                    onlineScriptsUrls.push(script.src);
            });
            // No online scripts detected
            if (onlineScriptsUrls.length == 0)
                return compile(localScriptsContent.join('\n\n'));
            // Load the online scripts and run it
            return forEach(onlineScriptsUrls, function (url, index) {
                webRequestChecker[url] = true;
                // Getting script content from a web request
                http(url, {
                    headers: { "Content-Type": 'text/plain' }
                }).then(function (response) {
                    if (!response.ok)
                        throw ((response.statusText));
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
                    _this.$addEvent('failed', componentElement, component)
                        .emit();
                });
            });
        };
        return ComponentHandler;
    }());

    var DelimiterHandler = /** @class */ (function () {
        function DelimiterHandler(delimiters) {
            this.delimiters = [];
            IoC.Register(this);
            this.delimiters = delimiters;
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
            IoC.Register(this);
            this.bouer = bouer;
            this.global = this.createWindow();
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
            var data = options.data, args = options.args, expression = options.expression, isReturn = options.isReturn, aditional = options.aditional;
            var mGlobal = this.global;
            var noConfigurableProperties = {};
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
                returnedValue = this.global.Function(mExpression).apply(this.bouer, args);
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
            this.events = [];
            this.bouer = bouer;
            this.evaluator = IoC.Resolve('Evaluator');
            IoC.Register(this);
            this.cleanup();
        }
        EventHandler.prototype.handle = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = (node.ownerElement || node.parentNode);
            var nodeName = node.nodeName;
            if (isNull(ownerElement))
                return Logger.error(("Invalid ParentElement of “" + nodeName + "”"));
            // <button on:submit.once.stopPropagation="times++"></button>
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var eventNameWithModifiers = nodeName.substr(Constants.on.length);
            var modifiersList = eventNameWithModifiers.split('.');
            var eventName = modifiersList[0];
            modifiersList.shift();
            if (nodeValue === '')
                return Logger.error(("Expected an expression in the “" + nodeName + "” and got an <empty string>."));
            connectNode(node, ownerElement);
            ownerElement.removeAttribute(nodeName);
            var callback = function (evt) {
                // Calling the modifiers
                forEach(modifiersList, function (modifier) {
                    forEach(Object.keys(evt), function (key) {
                        var fnModifier;
                        if (fnModifier = evt[key] && isFunction(fnModifier) && toLower(key) === toLower(modifier))
                            fnModifier();
                    });
                });
                var mArguments = [evt];
                var isResultFunction = _this.evaluator.exec({
                    data: data,
                    expression: nodeValue,
                    args: mArguments,
                    aditional: { event: evt }
                });
                if (isFunction(isResultFunction)) {
                    try {
                        isResultFunction.apply(_this.bouer, mArguments);
                    }
                    catch (error) {
                        Logger.error(buildError(error));
                    }
                }
            };
            var modifiers = {};
            var addEventListenerOptions = ['capture', 'once', 'passive'];
            forEach(modifiersList, function (md) {
                md = md.toLocaleLowerCase();
                if (addEventListenerOptions.indexOf(md) !== -1)
                    modifiers[md] = true;
            });
            this.on(eventName, callback, ownerElement, modifiers);
        };
        EventHandler.prototype.on = function (eventName, callback, attachedNode, modifiers) {
            var _this = this;
            var event = {
                eventName: eventName,
                callback: function (evt) { return callback.apply(_this.bouer, [evt]); },
                attachedNode: attachedNode,
                emit: this.emit
            };
            if (attachedNode)
                attachedNode.addEventListener(eventName, event.callback, modifiers || false);
            else
                this.events.push(event);
            return event;
        };
        EventHandler.prototype.off = function (eventName, callback, attachedNode) {
            if (attachedNode)
                return attachedNode.removeEventListener(eventName, callback);
            var index = -1;
            this.events.find(function (evt, idx) {
                if (evt.eventName === eventName && callback == evt.callback) {
                    index = idx;
                    return true;
                }
            });
            this.events.splice(index, 1);
        };
        EventHandler.prototype.emit = function (options) {
            var _this = this;
            var eventName = options.eventName, init = options.init, attachedNode = options.attachedNode;
            var customEvent = new CustomEvent(eventName, init);
            if (attachedNode)
                return attachedNode.dispatchEvent(customEvent);
            forEach(this.events, function (event, index) {
                var _a;
                if (eventName !== event.eventName)
                    return;
                event.callback.call(_this.bouer, customEvent);
                if (((_a = options.once) !== null && _a !== void 0 ? _a : false) === true)
                    _this.events.splice(index, 1);
            });
        };
        EventHandler.prototype.cleanup = function () {
            var _this = this;
            taskRunner(function () {
                var availableEvents = [];
                forEach(_this.events, function (event) {
                    if (!event.attachedNode)
                        return availableEvents.push(event);
                    if (event.attachedNode.isConnected)
                        return availableEvents.push(event);
                });
                _this.events = availableEvents;
            }, 1000);
        };
        return EventHandler;
    }());

    var Routing = /** @class */ (function () {
        function Routing(bouer) {
            this.defaultPage = null;
            this.notFoundPage = null;
            this.routeView = null;
            this.activeAnchors = [];
            // Store `href` value of the <base /> tag
            this.base = null;
            IoC.Register(this);
            this.bouer = bouer;
            this.routeView = this.bouer.el.querySelector('[route-view]');
        }
        Routing.prototype.init = function () {
            var _this = this;
            if (isNull(this.routeView))
                return;
            this.routeView.removeAttribute('route-view');
            var base = DOM.head.querySelector('base');
            if (!base)
                return;
            var baseHref = base.attributes['href'];
            if (!baseHref)
                return Logger.error(("The href=\"/\" attribute is required in base element."));
            this.base = baseHref.value;
            this.navigate(DOM.location.href);
            // Listening to the page navigation
            GLOBAL.addEventListener('popstate', function (evt) {
                evt.preventDefault();
                _this.navigate((evt.state || {}).url || DOM.location.href);
            });
        };
        Routing.prototype.navigate = function (url) {
            var _this = this;
            var _a;
            if (isNull(url))
                return Logger.log("Invalid url provided to the navigation method.");
            url = trim(url);
            var resolver = urlResolver(url);
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
            if (!page && url.endsWith('.html'))
                return;
            var componentElement = createAnyEl(page.name)
                .appendTo(this.routeView)
                .build();
            var routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route);
            IoC.Resolve('ComponentHandler')
                .order(componentElement, {}, function (component) {
                component.on('loaded', function () {
                    _this.markActiveAnchors(routeToSet);
                });
            });
            // Document info configuration
            DOM.title = page.title || DOM.title;
            this.pushState(resolver.href, DOM.title);
        };
        Routing.prototype.pushState = function (url, title) {
            url = urlResolver(url).href;
            GLOBAL.history.pushState({ url: url }, (title || ''), url);
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
            return IoC.Resolve('ComponentHandler')
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
            this.activeAnchors = [];
            forEach(toArray(anchors), function (anchor) {
                if (anchor.href !== route)
                    return;
                if (!anchor.markable)
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

    var Interceptor = /** @class */ (function () {
        function Interceptor() {
            var _this = this;
            this.container = {};
            this.run = function (action, options) {
                var mInterceptors = _this.container[action];
                if (!mInterceptors)
                    return Logger.log("There is not interceptor for “" + action + "”.");
                for (var index = 0; index < mInterceptors.length; index++) {
                    var interceptor = mInterceptors[index];
                    interceptor(options);
                }
            };
            this.register = function (action, callback) {
                var mMiddlewares = _this.container[action];
                if (!mMiddlewares) {
                    return _this.container[action] = [callback];
                }
                mMiddlewares.push(callback);
            };
            IoC.Register(this);
        }
        return Interceptor;
    }());

    var Bouer = /** @class */ (function () {
        /**
         * Default constructor
         * @param selector the selector of the element to be controlled by the instance
         * @param options the options to the instance
         */
        function Bouer(selector, options) {
            this.name = 'Bouer';
            this.version = '3.0.0';
            this.components = [];
            this.dependencies = {};
            options = options || {};
            // Applying all the options defined
            this.config = options.config;
            this.components = options.components || [];
            this.dependencies = options.dependencies || {};
            this.interceptor = options.interceptor;
            Object.assign(this, options);
            if (isNull(selector) || trim(selector) === '')
                throw Logger.error(('Invalid selector provided to the instance.'));
            var app = this;
            var el = DOM.querySelector(selector);
            if (!el)
                throw Logger.error(("Element with selector “" + selector + "” not found."));
            var dataStore = new DataStore();
            new Evaluator(this);
            new CommentHandler(this);
            var interceptor = new Interceptor();
            app.beforeMount(el, app);
            this.el = el;
            // Register the interceptor
            if (typeof this.interceptor === 'function')
                this.interceptor(interceptor.register, this);
            // Transform the data properties into a reative
            this.data = Reactive.transform(options.data || {});
            this.globalData = Reactive.transform(options.globalData || {});
            app.mounted(app.el, app);
            var delimiter = new DelimiterHandler([
                { name: 'bouer', delimiter: { open: '-e-', close: '-' } },
                { name: 'common', delimiter: { open: '{{', close: '}}' } },
                { name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
            ]);
            new EventHandler(this);
            new Binder(this);
            this.routing = new Routing(this);
            new ComponentHandler(this, options.components);
            var compiler = new Compiler(this);
            new Converter(this);
            new CommentHandler(this);
            // Assing the two methods available
            this.delimiters = {
                add: delimiter.add,
                remove: delimiter.remove,
                get: function () { return delimiter.delimiters.slice(); }
            };
            this.$data = {
                get: function (key) { return key ? dataStore.data[key] : dataStore.data; },
                set: function (key, data, toReactive) {
                    if (key in dataStore.data)
                        return Logger.log(("There is already a data stored with this key “" + key + "”."));
                    if ((toReactive !== null && toReactive !== void 0 ? toReactive : false) === true)
                        Reactive.transform(data);
                    return DataStore.set('data', key, data);
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
                            data: Reactive.transform(mWait.data),
                        });
                    });
                },
                unset: function (key) { return delete dataStore.wait[key]; },
            };
            app.beforeLoad(app.el, app);
            // compile the app
            compiler.compile({
                el: this.el,
                data: this.data,
                onDone: function () { return app.loaded(app.el, app); }
            });
            Observer.observe(this.el, function (options) {
                var mutation = options.mutation, element = options.element;
                if (element.isConnected === false) {
                    app.destroyed(app.el, app);
                    mutation.disconnect();
                }
            });
            // Initializing Routing
            this.routing.init();
            if (!DOM.head.querySelector("link[rel~='icon']")) {
                createEl('link', function (favicon) {
                    favicon.rel = 'icon';
                    favicon.type = 'image/png';
                    favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
                }).appendTo(DOM.head);
            }
        }
        Object.defineProperty(Bouer.prototype, "refs", {
            /**
             * Gets all the elemens having the `ref` attribute
             * @returns an object having all the elements with the `ref attribute value` defined as the key.
             */
            get: function () {
                var mRefs = {};
                forEach(toArray(this.el.querySelectorAll("[" + Constants.ref + "]")), function (ref) {
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
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Compiles a `HTML snippet` to a `Object Literal`
         * @param input the input element
         * @param options the options of the compilation
         * @param onSet a function that will be fired when a value is setted
         * @returns the Object Compiled from the HTML
         */
        Bouer.prototype.toJsObj = function (input, options, onSet) {
            return IoC.Resolve('Converter').htmlToJsObj(input, options, onSet);
        };
        /**
         * Sets data into a target object, by default is the `app.data`
         * @param inputData the data the will be setted
         * @param targetObject the target were the inputData
         * @returns the object with the data setted
         */
        Bouer.prototype.setData = function (inputData, targetObject) {
            return Reactive.setData(inputData, (targetObject || this.data));
        };
        /**
         * Provides the possibility to watch a property change
         * @param propertyName the property to watch
         * @param callback the function that will be called when the property change
         * @param targetObject the target object having the property to watch
         * @returns the watch object having the method to destroy the watch
         */
        Bouer.prototype.watch = function (propertyName, callback, targetObject) {
            return IoC.Resolve('Binder').watch(propertyName, callback, targetObject);
        };
        Bouer.prototype.on = function () { };
        Bouer.prototype.off = function () { };
        Bouer.prototype.emit = function () { };
        // Lifecycle Hooks
        Bouer.prototype.beforeMount = function (element, bouer) { };
        Bouer.prototype.mounted = function (element, bouer) { };
        Bouer.prototype.beforeLoad = function (element, bouer) { };
        Bouer.prototype.loaded = function (element, bouer) { };
        Bouer.prototype.destroyed = function (element, bouer) { };
        return Bouer;
    }());

    return Bouer;

}));
