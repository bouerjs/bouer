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

    var Logger = /** @class */ (function () {
        function Logger() {
        }
        Logger.log = function (content) {
            console.log(Logger.prefix, content);
        };
        Logger.error = function (content) {
            console.error(Logger.prefix, content);
        };
        Logger.warn = function (content) {
            console.warn(Logger.prefix, content);
        };
        Logger.info = function (content) {
            console.info(Logger.prefix, content);
        };
        Logger.prefix = '[Bouer]';
        return Logger;
    }());

    var DOM = document;
    var taskRunner = setInterval;
    var code = function (len) {
        var alpha = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var lowerAlt = false, out = '';
        for (var i = 0; i < (len || 8); i++) {
            var pos = Math.floor(Math.random() * alpha.length);
            out += lowerAlt ? alpha[pos].toLowerCase() : alpha[pos];
            lowerAlt = !lowerAlt;
        }
        return out;
    };
    var isNull = function (input) {
        return (typeof input === 'undefined') || (input === undefined || input === null);
    };
    var isObject = function (input) {
        return (typeof input === 'object') && (String(input) === '[object Object]');
    };
    var isNode = function (input) {
        return (input instanceof Node);
    };
    var isFilledObj = function (input) {
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
    };
    var isPrimitive = function (input) {
        return (typeof input === 'string' ||
            typeof input === 'number' ||
            typeof input === 'symbol' ||
            typeof input === 'boolean');
    };
    var isString = function (input) {
        return (typeof input !== 'undefined') && (typeof input === 'string');
    };
    var isEmptyObject = function (input) {
        if (!input || !isObject(input))
            return true;
        return Object.keys(input).length === 0;
    };
    var isFunction = function (input) {
        return typeof input === 'function';
    };
    var trim = function (value) {
        return value ? value.trim() : value;
    };
    var toLower = function (str) {
        return str.toLowerCase();
    };
    var toStr = function (input) {
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
    };
    var defineProperty = function (object, property, descriptor) {
        Object.defineProperty(object, property, descriptor);
        return object;
    };
    var transferProperty = function (dest, src, name) {
        defineProperty(dest, name, getDescriptor(src, name));
    };
    var getDescriptor = function (obj, prop) {
        return Object.getOwnPropertyDescriptor(obj, prop);
    };
    var findAttribute = function (element, attributesToCheck, removeIfFound) {
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
    };
    var forEach = function (iterable, callback, context) {
        for (var index = 0; index < iterable.length; index++) {
            if (isFunction(callback))
                callback.call(context, iterable[index], index);
        }
    };
    var createEl = function (elName, callback) {
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
    };
    var mapper = function (source, destination) {
        forEach(Object.keys(source), function (key) {
            var sourceAsAny = source;
            var destinationAsAny = destination;
            var sourceValue = sourceAsAny[key];
            if (key in destinationAsAny) {
                if (isObject(sourceValue))
                    return mapper(sourceValue, destinationAsAny[key]);
                return destinationAsAny[key] = sourceValue;
            }
            transferProperty(destination, source, key);
        });
    };
    /**
     * Used to Bind the `isConnected` property of a node to another
     * in order to avoid binding cleanup where the element is not in the DOM
     */
    var connectNode = function (node, nodeToConnectWith) {
        defineProperty(node, 'isConnected', { get: function () { return nodeToConnectWith.isConnected; } });
        return node;
    };

    var DelimiterHandler = /** @class */ (function () {
        function DelimiterHandler(delimiters) {
            this.delimiters = [];
            this.delimiters = delimiters;
            DelimiterHandler.singleton = this;
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

    var Extensions = /** @class */ (function () {
        function Extensions() {
        }
        Extensions.value = function (el, name, set) {
            if (!isNull(set)) {
                el.setAttribute(name, set);
                return el.getAttribute(name);
            }
            if (name in el)
                return el[name];
            return el.getAttribute(name) || el.innerText;
        };
        return Extensions;
    }());

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
        copy: 'e-copy',
        component: ':name',
        on: 'on:',
        check: function (node, cmd) {
            return node.nodeName.substr(0, cmd.length) === cmd;
        },
        isConstant: function (value) {
            var _this = this;
            return (Object.keys(this).map(function (key) { return _this[key]; }).indexOf(value) !== -1);
        }
    };

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

    var Evalutator = /** @class */ (function () {
        function Evalutator(bouer) {
            this.bouer = bouer;
            this.global = this.createWindow();
            Evalutator.singleton = this;
        }
        Evalutator.prototype.createWindow = function () {
            var mWindow;
            createEl('iframe', function (frame, dom) {
                frame.style.display = 'none!important';
                dom.body.appendChild(frame);
                mWindow = frame.contentWindow;
                dom.body.removeChild(frame);
            });
            return mWindow;
        };
        Evalutator.prototype.exec = function (options) {
            var _this = this;
            var data = options.data, args = options.args, expression = options.expression, isReturn = options.isReturn, aditional = options.aditional;
            var globalAsAny = this.global;
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
                delete globalAsAny[key];
                // In case of non-configurable property store them to be handled
                if (key in globalAsAny && getDescriptor(globalAsAny, key).configurable === true)
                    noConfigurableProperties[key] = globalAsAny[key];
                if (key in noConfigurableProperties)
                    globalAsAny[key] = dataToUse[key];
                transferProperty(globalAsAny, dataToUse, key);
            });
            // Executing the expression
            try {
                var mExpression = 'return(function(){"use strict"; ' +
                    (isReturn === false ? '' : 'return') + ' ' + expression + ' }).apply(this, arguments)';
                returnedValue = this.global.Function(mExpression).apply(this.bouer, args);
            }
            catch (error) {
                error.stack = '';
                Logger.error(error);
            }
            // Removing the properties
            forEach(keys, function (key) { return delete globalAsAny[key]; });
            return returnedValue;
        };
        return Evalutator;
    }());

    var ReactiveEvent = /** @class */ (function () {
        function ReactiveEvent() {
        }
        ReactiveEvent.on = function (eventName, callback) {
            var array = (this[eventName]);
            array.push(callback);
            return {
                eventName: eventName,
                callback: callback
            };
        };
        ReactiveEvent.off = function (eventName, callback) {
            var array = this[eventName];
            array.splice(array.indexOf(callback), 1);
            return {
                eventName: eventName,
                callback: callback
            };
        };
        ReactiveEvent.emit = function (eventName, reactive, method, options) {
            try {
                forEach(this[eventName], function (evt) { return evt(reactive, method, options); });
            }
            catch (error) {
                error.stack = '';
                Logger.error(error);
            }
        };
        ReactiveEvent.BeforeGet = [];
        ReactiveEvent.AfterGet = [];
        ReactiveEvent.BeforeSet = [];
        ReactiveEvent.AfterSet = [];
        ReactiveEvent.BeforeArrayChanges = [];
        ReactiveEvent.AfterArrayChanges = [];
        return ReactiveEvent;
    }());

    var Binder = /** @class */ (function () {
        function Binder(bouer) {
            this.binds = [];
            this.DEFAULT_BINDER_PROPERTIES = {
                'text': 'value',
                'number': 'valueAsNumber',
                'checkbox': 'checked',
                'radio': 'checked'
            };
            this.BindingDirection = {
                fromInputToData: 'to-data-property',
                fromDataToInput: 'to-input'
            };
            Binder.singleton = this;
            this.evaluator = Evalutator.singleton;
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
            // let reactiveEvent: ReactiveEvent | undefined;
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
                    propertyNameToBind_1 = this.DEFAULT_BINDER_PROPERTIES[ownerElement.type] || 'value';
                }
                else {
                    propertyNameToBind_1 = originalName.split(':')[1]; // e-bind:value -> value
                }
                var callback_1 = function (direction, value) {
                    switch (direction) {
                        case _this.BindingDirection.fromDataToInput:
                            return ownerElement[propertyNameToBind_1] = value;
                        case _this.BindingDirection.fromInputToData:
                            return data[originalValue] = ownerElement[propertyNameToBind_1];
                    }
                };
                var reactiveEvent_1 = ReactiveEvent.on('AfterGet', function (reactive) {
                    _this.binds.push(reactive.watch(function (value) {
                        callback_1(_this.BindingDirection.fromDataToInput, value);
                        onChange(value, node);
                    }, node));
                });
                var result = this.evaluator.exec({
                    expression: originalValue,
                    data: data
                });
                if (reactiveEvent_1)
                    ReactiveEvent.off('AfterGet', reactiveEvent_1.callback);
                ownerElement[propertyNameToBind_1] = (isObject(result) ? toStr(result) : (isNull(result) ? '' : result));
                var listeners = [ownerElement.nodeName.toLowerCase(), 'propertychange', 'change'];
                var callbackEvent_1 = function () {
                    callback_1(_this.BindingDirection.fromInputToData, ownerElement[propertyNameToBind_1]);
                };
                // Applying the events
                forEach(listeners, function (listener) { return ownerElement.addEventListener(listener, callbackEvent_1, false); });
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
                    var htmlData = createEl('div', function (el) {
                        el.innerHTML = valueToSet;
                    }).build().children[0];
                    ownerElement.appendChild(htmlData);
                    // TODO: Compile HTML Element Here
                }
            };
            // Listening to the property get only if the callback function is defined
            var reactiveEvent = ReactiveEvent.on('BeforeGet', function (reactive) {
                _this.binds.push(reactive.watch(function (value) {
                    setter();
                    onChange(value, node);
                }, node));
            });
            setter();
            if (reactiveEvent)
                ReactiveEvent.off('BeforeGet', reactiveEvent.callback);
            propertyBindConfig.boundNode = nodeToBind;
            return propertyBindConfig;
        };
        /** Creates a process for unbind properties when it does not exists anymore in the DOM */
        Binder.prototype.cleanup = function () {
            var _this = this;
            taskRunner(function () { return forEach(_this.binds, function (watch, index) {
                if (!watch.node)
                    return;
                if (watch.node.isConnected)
                    return;
                watch.destroy();
                _this.binds.splice(index, 1);
            }); }, 1000);
        };
        return Binder;
    }());

    var BouerEvent = /** @class */ (function () {
        function BouerEvent(options) {
            var _this = this;
            this.composedPath = function () {
                return _this.source.composedPath();
            };
            this.initEvent = function (type, bubbles, cancelable) {
                return _this.source.initEvent(type, bubbles, cancelable);
            };
            this.preventDefault = function () {
                return _this.source.preventDefault();
            };
            this.stopImmediatePropagation = function () {
                return _this.source.stopImmediatePropagation();
            };
            this.stopPropagation = function () {
                return _this.source.stopPropagation();
            };
            var source = options.source, type = options.type;
            this.source = source || new Event(type);
            this.bubbles = this.source.bubbles;
            this.cancelBubble = this.source.cancelBubble;
            this.cancelable = this.source.cancelable;
            this.composed = this.source.composed;
            this.currentTarget = this.source.currentTarget;
            this.defaultPrevented = this.source.defaultPrevented;
            this.eventPhase = this.source.eventPhase;
            this.isTrusted = this.source.isTrusted;
            this.target = this.source.target;
            this.timeStamp = this.source.timeStamp;
            this.type = this.source.type;
            /* @deprecated but required on Typescript */
            this.returnValue = this.source.returnValue;
            this.srcElement = this.source.srcElement;
            /* End @deprecated but required on Typescript */
            this.AT_TARGET = this.source.AT_TARGET;
            this.BUBBLING_PHASE = this.source.BUBBLING_PHASE;
            this.CAPTURING_PHASE = this.source.CAPTURING_PHASE;
            this.NONE = this.source.NONE;
        }
        return BouerEvent;
    }());

    var EventHandler = /** @class */ (function () {
        function EventHandler(bouer) {
            this.events = [];
            EventHandler.singleton = this;
            this.bouer = bouer;
            this.evaluator = Evalutator.singleton;
            this.input = createEl('input').build();
        }
        EventHandler.prototype.handle = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = (node.ownerElement || node.parentNode);
            var nodeName = node.nodeName;
            if (isNull(ownerElement))
                return Logger.error("Invalid ParentElement of \"" + nodeName + "\"");
            // <button on:submit.once.stopPropagation="times++"></button>
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var eventNameWithModifiers = nodeName.substr(Constants.on.length);
            var modifiers = eventNameWithModifiers.split('.');
            var eventName = modifiers[0];
            modifiers.shift();
            if (nodeValue === '')
                Logger.error("Expected an expression in the \"" + nodeName + "\" and got an <empty string>.");
            var callback = function (evt, args) {
                var isCallOnce = (modifiers.indexOf('once') !== -1);
                // Calling the modifiers
                forEach(modifiers, function (modifier) {
                    forEach(Object.keys(evt), function (key) {
                        var fnModifier;
                        if (fnModifier = evt[key] && isFunction(fnModifier) &&
                            toLower(key) === toLower(modifier))
                            fnModifier();
                    });
                });
                var event = new BouerEvent({
                    source: evt,
                    type: evt.type
                });
                var mArguments = Extend.array(event, args);
                var isResultFunction = _this.evaluator.exec({
                    data: Extend.obj(data, { event: event }),
                    expression: nodeValue,
                    args: mArguments
                });
                if (isFunction(isResultFunction)) {
                    try {
                        isResultFunction.apply(_this.bouer, mArguments);
                    }
                    catch (error) {
                        error.stack = '';
                        Logger.error(error);
                    }
                }
                return isCallOnce;
            };
            // Native Event Subscription
            if (('on' + eventName) in this.input) {
                var callbackNavite_1 = function (evt) {
                    if (callback(evt, [])) // Returns isCallOnce boolean value
                        ownerElement.removeEventListener(eventName, callbackNavite_1, false);
                };
                ownerElement.addEventListener(eventName, callbackNavite_1, false);
            }
            else {
                this.on(eventName, callback);
            }
        };
        EventHandler.prototype.on = function (eventName, callback) {
            var event = {
                eventName: eventName,
                callback: function (evt, args) { return callback(evt, args); }
            };
            this.events.push(event);
            return event;
        };
        EventHandler.prototype.off = function (eventName, callback) {
            var index = -1;
            var event = this.events.find(function (evt, idx) {
                if (evt.eventName === eventName && callback == evt.callback) {
                    index = idx;
                    return true;
                }
            });
            if (event)
                this.events.splice(index, 1);
            return event;
        };
        EventHandler.prototype.emit = function (options) {
            var _this = this;
            var eventName = options.eventName, mArguments = options.arguments;
            forEach(this.events, function (event) {
                if (eventName !== event.eventName)
                    return;
                event.callback.call(_this.bouer, new BouerEvent({
                    type: eventName
                }), mArguments || []);
            });
        };
        return EventHandler;
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

    var CommentHandler = /** @class */ (function () {
        function CommentHandler(bouer) {
            this.bouer = bouer;
            CommentHandler.singleton = this;
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
                    if (Array.isArray(value)) {
                        Reactive.transform(value, _this);
                        if (!isNull(_this.propertyValue)) {
                            if (Array.isArray(_this.propertyValue))
                                _this.propertyValue.splice(0, _this.propertyValue.length);
                            [].push.apply(_this.propertyValue, value);
                        }
                        else {
                            _this.propertyValue = value;
                        }
                    }
                    else if (isObject(value)) {
                        if (isNode(value)) // If some html element
                            _this.propertyValue = value;
                        else {
                            Reactive.transform(value);
                            if (!isNull(_this.propertyValue))
                                mapper(_this.propertyValue, value);
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
                        ReactiveEvent.emit('BeforeArrayChanges', reactiveObj, method, { arrayNew: oldArrayValue, arrayOld: oldArrayValue });
                        var result = reference_1[method].apply(inputArray_1, arguments);
                        ReactiveEvent.emit('AfterArrayChanges', reactiveObj, method, { arrayNew: oldArrayValue, arrayOld: oldArrayValue });
                        return result;
                    };
                });
                return inputArray_1;
            }
            if (!isObject(inputObject))
                return inputObject;
            forEach(Object.keys(inputObject), function (key) {
                var inputObjectAsAny = inputObject;
                // Already a reactive property, do nothing
                if (isNull(getDescriptor(inputObject, key).value))
                    return;
                var reactive = new Reactive({
                    propertyName: key,
                    sourceObject: inputObject
                });
                defineProperty(inputObject, key, reactive);
                var propertyValue = inputObjectAsAny[key];
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

    var DirectiveReturn = /** @class */ (function () {
        function DirectiveReturn() {
            var node = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                node[_i] = arguments[_i];
            }
            this.node = node;
        }
        /**
         * Connects the node with the element that will be provided
         * @param element the root element that will be connected with
         */
        DirectiveReturn.prototype.connect = function (element) {
            forEach(this.node, function (node) { return connectNode(node, element); });
        };
        return DirectiveReturn;
    }());
    var Directive = /** @class */ (function () {
        function Directive(bouer, htmlHandler) {
            this.errorMsgEmptyNode = function (node) { return "Expected an expression in \"" + node.nodeName
                + "\" and got an <empty string>."; };
            this.errorMsgNodeValue = function (node) {
                var _a;
                return "Expected an expression in \"" + node.nodeName
                    + "\" and got \"" + ((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '') + "\".";
            };
            this.bouer = bouer;
            this.htmlHandler = htmlHandler;
            this.evaluator = Evalutator.singleton;
            this.delimiter = DelimiterHandler.singleton;
            this.binder = Binder.singleton;
            this.comment = CommentHandler.singleton;
        }
        // Helper functions
        Directive.prototype.toOwnerNode = function (node) {
            return node.ownerElement || node.parentNode;
        };
        Directive.prototype.returner = function (node, callback) {
            if (isFunction(callback))
                callback();
            return new (DirectiveReturn.bind.apply(DirectiveReturn, __spreadArray([void 0], node, false)))();
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
            var conditionalChain = [];
            var comment = this.comment.create();
            var nodeName = node.nodeName;
            var exec = function () { };
            if (!container)
                return this.returner(node);
            if (nodeName === Constants.elseif || nodeName === Constants.else)
                return this.returner(node);
            var currentEl = ownerElement;
            var reactives = [];
            var _loop_1 = function () {
                if (currentEl == null)
                    return "break";
                var attr = findAttribute(currentEl, ['e-if', 'e-else-if', 'e-else']);
                if (!attr)
                    return "break";
                if ((attr.nodeName !== 'e-else') && (trim((_a = attr.nodeValue) !== null && _a !== void 0 ? _a : '') === ''))
                    return { value: this_1.returner(attr, function () { return Logger.error(_this.errorMsgEmptyNode(attr)); }) };
                if (this_1.delimiter.run((_b = attr.nodeValue) !== null && _b !== void 0 ? _b : '').length !== 0)
                    return { value: this_1.returner(attr, function () { return Logger.error(_this.errorMsgNodeValue(attr)); }) };
                conditionalChain.push({ node: attr, element: currentEl });
                connectNode(currentEl, container);
                connectNode(attr, container);
                if (attr.nodeName === ('e-else')) {
                    currentEl.removeAttribute(attr.nodeName);
                    return "break";
                }
                // Listening to the property get only if the callback function is defined
                var reactiveEvent = ReactiveEvent.on('BeforeGet', function (reactive) {
                    // Avoiding multiple binding in the same property
                    if (reactives.findIndex(function (item) { return item.reactive.propertyName == reactive.propertyName; }) !== -1)
                        return;
                    reactives.push({ attr: attr, reactive: reactive });
                });
                this_1.evaluator.exec({
                    data: data,
                    expression: attr.value,
                });
                if (reactiveEvent)
                    ReactiveEvent.off('BeforeGet', reactiveEvent.callback);
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
                var _a;
                forEach(conditionalChain, function (chainItem) {
                    if (chainItem.element.parentElement) {
                        if (comment.isConnected)
                            container.removeChild(chainItem.element);
                        else
                            container.replaceChild(comment, chainItem.element);
                    }
                });
                var shownElement = null;
                for (var i = 0; i < conditionalChain.length; i++) {
                    var chainItem = conditionalChain[i];
                    var mNode = chainItem.node;
                    var mElement = chainItem.element;
                    var nodeValue = trim((_a = mNode.nodeValue) !== null && _a !== void 0 ? _a : '');
                    if (shownElement)
                        break;
                    if (mNode.nodeName !== 'e-else') {
                        var value = _this.evaluator.exec({
                            expression: nodeValue,
                            data: data
                        });
                        if (!value) // If not truthy value continue to the next element
                            continue;
                    }
                    container.replaceChild(mElement, comment);
                    shownElement = mElement;
                    _this.htmlHandler.compile({
                        el: mElement,
                        data: data
                    });
                }
            })();
            return this.returner(conditionalChain.map(function (item) { return item.node; }));
        };
        Directive.prototype.show = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            if (nodeValue === '')
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgEmptyNode(node));
                });
            if (hasDelimiter)
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgNodeValue(node));
                });
            var exec = function (element) {
                var value = _this.evaluator.exec({
                    expression: nodeValue,
                    data: data
                });
                element.style.display = value ? '' : 'none';
            };
            var bindResult = this.binder.create({
                data: data,
                node: node,
                fields: [{ expression: nodeValue, field: nodeValue }],
                onChange: function () { return exec(ownerElement); }
            });
            exec(ownerElement);
            ownerElement.removeAttribute(bindResult.boundNode.nodeName);
            return this.returner(node);
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
                return this.returner(node);
            if (nodeValue === '')
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgEmptyNode(node));
                });
            if (!nodeValue.includes(' of ') && !nodeValue.includes(' in '))
                return this.returner(node, function () {
                    Logger.error("Expected a valid \"for\" expression in \"" + nodeName + "\" and got \"" +
                        nodeValue + "\"." + "\nValid: e-for=\"item of items\".");
                });
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
                    Logger.error("Invalid filter-value in \"" + nodeName + "\" \"" + nodeValue + "\" expression.");
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
                        Logger.error("Invalid filter-keys in \"" + nodeName + "\" \"" + nodeValue + "\" expression, " +
                            "at least one filter-key to be provided.");
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
                                Logger.log("The \"" + type + "\" order type is invalid: \"" + nodeValue +
                                    "\". Available types are: " + "\"asc\" for order ascendent and \"desc\" for order descendent.");
                                return 0;
                        }
                    };
                    if (!prop)
                        return comparison(a > b, b < a);
                    return comparison(a[prop] > b[prop], b[prop] < a[prop]);
                });
            };
            var reactivePropertyEvent = ReactiveEvent.on('AfterGet', function (reactive) { return _this.binder.binds.push(reactive.watch(function () { return exec(); }, node)); });
            var reactiveArrayEvent = ReactiveEvent.on('AfterArrayChanges', function (reactive) { return exec(); });
            // Creating a fake reactive prop and fake Watch to destroy AfterArrayChanges Event
            this.binder.binds.push(new Watch(new Reactive({ propertyName: '_', sourceObject: { _: [] } }), function () { }, {
                node: node,
                onDestroy: function () { return ReactiveEvent.off('AfterArrayChanges', reactiveArrayEvent.callback); }
            }));
            (exec = function () {
                var _a;
                // updating the nodeValue
                nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
                var filters = nodeValue.split('|').map(function (item) { return trim(item); });
                var forExpression = filters[0].replace('(', '').replace(')', '');
                filters.shift();
                var forSeparator = ' of ';
                var forParts = forExpression.split(forSeparator);
                if (forParts.length === 0) {
                    forSeparator = ' in ';
                    forParts = forExpression.split(forSeparator);
                }
                var leftHand = forParts[0];
                var rightHand = forParts[1];
                var leftHandParts = leftHand.split(',').map(function (x) { return trim(x); });
                // Preparing variables declaration
                // Eg.: let item; | let item, index=0;
                var leftHandDeclaration = 'let ' + leftHand + (leftHand.includes(',') ? '=0' : '') + ';';
                var hasIndex = leftHandParts.length > 1;
                forExpression = [(hasIndex ? leftHandParts[0] : leftHand), '$$applyFilters(' + rightHand + ')']
                    .join(forSeparator);
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
                    expression: leftHandDeclaration +
                        'for(' + forExpression + '){ ' + ' $$each(' + leftHand + (hasIndex ? '++' : '') + ')}',
                    aditional: {
                        $$each: function (item, index) {
                            var forData = Extend.obj(data);
                            forData[leftHandParts[0]] = item;
                            if (hasIndex)
                                forData[leftHandParts[1]] = index;
                            _this.htmlHandler.compile({
                                el: forItem.cloneNode(true),
                                data: forData,
                                onDone: function (el) {
                                    listedItems.push(container.insertBefore(el, comment));
                                }
                            });
                        },
                        $$applyFilters: function (list) {
                            var listCopy = Extend.array(list);
                            var findFilter = function (fName) {
                                return filters.find(function (item) { return item.substr(0, fName.length) === fName; });
                            };
                            // applying filter:
                            var filterConfig = findFilter('filter');
                            if (filterConfig) {
                                var filterConfigParts = filterConfig.split(':').map(function (item) { return trim(item); });
                                if (filterConfigParts.length == 1) {
                                    Logger.error("Invalid \"" + nodeName + "\" filter expression \"" + nodeValue +
                                        "\", at least a filter-value and filter-keys, or a filter-function must be provided");
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
                                    Logger.error("Invalid \"" + nodeName + "\" order  expression \"" + nodeValue +
                                        "\", at least the order type must be provided");
                                }
                                else {
                                    listCopy = order(listCopy, orderConfigParts[1], orderConfigParts[2]);
                                }
                            }
                            return listCopy;
                        }
                    }
                });
            })();
            ReactiveEvent.off('AfterGet', reactivePropertyEvent.callback);
            return this.returner(node);
        };
        Directive.prototype.def = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            if (nodeValue === '')
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgEmptyNode(node));
                });
            if (hasDelimiter)
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgNodeValue(node));
                });
            var inputData = this.evaluator.exec({
                data: data,
                expression: nodeValue
            });
            if (!isObject(inputData))
                return this.returner(node, function () {
                    Logger.error("Expected a valid Object Literal expression in \"" + node.nodeName + "\" and got \"" + nodeValue + "\".");
                });
            this.bouer.setData(inputData, data);
            ownerElement.removeAttribute(node.nodeName);
        };
        Directive.prototype.content = function (node) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            if (nodeValue === '')
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgEmptyNode(node));
                });
            ownerElement.innerText = nodeValue;
            ownerElement.removeAttribute(node.nodeName);
        };
        Directive.prototype.bind = function (node, data) {
            var _this = this;
            var _a;
            var ownerElement = this.toOwnerNode(node);
            var nodeValue = trim((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '');
            var hasDelimiter = this.delimiter.run(nodeValue).length !== 0;
            if (nodeValue === '')
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgEmptyNode(node));
                });
            if (hasDelimiter)
                return this.returner(node, function () {
                    Logger.error(_this.errorMsgNodeValue(node));
                });
            this.binder.create({
                node: node,
                fields: [{ field: nodeValue, expression: nodeValue }],
                data: data
            });
            ownerElement.removeAttribute(node.nodeName);
            return this.returner(node);
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
                return "Invalid value, expected an Object/Object Literal in \"" + node.nodeName +
                    "\" and got \"" + ((_a = node.nodeValue) !== null && _a !== void 0 ? _a : '') + "\".";
            };
            if (nodeValue === '')
                return this.returner(node, function () {
                    Logger.error(errorInvalidValue(node));
                });
            if (hasDelimiter)
                return this.returner(node);
            var inputData = this.evaluator.exec({
                data: data,
                expression: nodeValue
            });
            if (!isObject(inputData))
                return this.returner(node, function () {
                    Logger.error(errorInvalidValue(node));
                });
            this.binder.create({
                data: data,
                node: node,
                eReplace: false,
                fields: [{ expression: nodeValue, field: nodeValue }],
                onChange: function () { return exec(_this.evaluator.exec({
                    data: data,
                    expression: nodeValue
                })); }
            });
            ownerElement.removeAttribute(node.nodeName);
            (exec = function (obj) {
                var nameAttrToSet = node.nodeName.substr(Constants.property.length);
                var attr = ownerElement.attributes[nameAttrToSet];
                if (!attr) {
                    (ownerElement.setAttribute(nameAttrToSet, ''));
                    attr = ownerElement.attributes[nameAttrToSet];
                }
                forEach(Object.keys(obj), function (key) {
                    /* if has a falsy value remove the key */
                    if (!obj[key])
                        return attr.value = trim(attr.value.replace(key, ''));
                    attr.value = (attr.value.includes(key) ? attr.value : trim(attr.value + ' ' + key));
                });
                if (attr.value === '')
                    return ownerElement.removeAttribute(nameAttrToSet);
            })(inputData);
            return this.returner(node);
        };
        Directive.prototype.req = function (node, data) {
            Logger.info(node);
            return this.returner(node);
        };
        Directive.prototype.id = function (node, data) {
            return this.returner(node);
        };
        Directive.prototype.filter = function (node, data) {
            return this.returner(node);
        };
        Directive.prototype.data = function (node, data) {
            Logger.warn('e-anm not implemented yet.');
        };
        Directive.prototype.href = function (node, data) {
            return this.returner(node);
        };
        Directive.prototype.skeleton = function (node, data) {
            Logger.warn('e-skeleton not implemented yet.');
        };
        Directive.prototype.wait = function (node, data) {
            Logger.warn('wait-data not implemented yet.');
        };
        Directive.prototype.copy = function (node) {
            Logger.warn('e-copy not implemented yet.');
        };
        Directive.prototype.component = function (node, data) {
            Logger.warn('<component /> not implemented yet.');
        };
        return Directive;
    }());

    var HtmlHandler = /** @class */ (function () {
        function HtmlHandler(bouer) {
            this.NODES_TO_IGNORE_IN_COMPILATION = {
                'SCRIPT': 1,
                '#comment': 8
            };
            HtmlHandler.singleton = this;
            this.bouer = bouer;
            this.delimiter = DelimiterHandler.singleton;
            this.eventHandler = EventHandler.singleton;
            this.binder = Binder.singleton;
            this.directive = new Directive(bouer, this);
        }
        HtmlHandler.prototype.toJsObj = function (input, options, onSet) {
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
                throw Logger.error("Invalid element passed in app.toJsObj(...)");
            // Clear [ ] and , and return an array of the names provided
            var clear = function (value) {
                return value.split(',').map(function (item) { return trim(item.replace('[', '').replace(']', '')); });
            };
            options = options || {};
            var mNames = clear(options.names || '[name]');
            var mValues = clear(options.values || '[value]');
            var tryGetValue = function (el) {
                var val = undefined;
                mValues.find(function (field) {
                    return (val = Extensions.value(el, field)) ? true : false;
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
                    forEach([].slice.call(el.children), function (child) {
                        if (!findAttribute(child, [Constants.build]))
                            walker(child);
                    });
                })(element);
                return builtObject;
            };
            var builtObject = objBuilder(element);
            var builds = [].slice.call(element.querySelectorAll("[" + Constants.build + "]"));
            forEach(builds, function (buildElement) {
                // Getting the e-build attr value
                var fullPath = Extensions.value(buildElement, Constants.build);
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
        HtmlHandler.prototype.compile = function (options) {
            var _this = this;
            var rootElement = options.el;
            var data = (options.data || this.bouer.data);
            if (!this.analizer(rootElement.outerHTML))
                return;
            var walker = function (node, data) {
                if (node.nodeName in _this.NODES_TO_IGNORE_IN_COMPILATION)
                    return;
                // First Element Attributes compilation
                if (node instanceof Element) {
                    // e-ignore" directive
                    if (Constants.ignore in node.attributes)
                        return _this.directive.ignore(node);
                    // e-def="{...}" directive
                    if (Constants.def in node.attributes)
                        _this.directive.def(node.attributes[Constants.def], data);
                    // wait-data="..." directive
                    if (Constants.wait in node.attributes)
                        return _this.directive.wait(node.attributes[Constants.wait], data);
                    // e-copy="..." directive
                    if (Constants.copy in node.attributes)
                        _this.directive.copy(node);
                    // data="..." directive
                    if (Constants.data in node.attributes)
                        return _this.directive.data(node.attributes[Constants.data], data);
                    // e-for="..." directive
                    if (Constants.for in node.attributes)
                        return _this.directive.for(node.attributes[Constants.for], data)
                            .connect(rootElement);
                    // e-if="..." directive
                    if (Constants.if in node.attributes)
                        return _this.directive.if(node.attributes[Constants.if], data);
                    // e-else-if="..." or e-else directive
                    if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
                        Logger.warn('The "' + Constants.elseif + '" or "' + Constants.else + '" requires an element with "' + Constants.if + '" above.');
                    // e-show="..." directive
                    if (Constants.show in node.attributes)
                        return _this.directive.show(node.attributes[Constants.show], data)
                            .connect(rootElement);
                    // <component> directive
                    if (Constants.component in node.attributes)
                        return _this.directive.component(node.attributes[Constants.component], data);
                    // e-req="..." | e-req:[id]="..."  directive
                    var reqNode = null;
                    if ((reqNode = node.attributes[Constants.req]) ||
                        (reqNode = [].slice.call(node.attributes).find(function (attr) { return Constants.check(attr, Constants.req); })))
                        return _this.directive.req(reqNode, data);
                    // :href="..." or !href="..." directive
                    if ((Constants.href in node.attributes) || (Constants.ihref in node.attributes))
                        return _this.directive.href(node.attributes[Constants.href], data)
                            .connect(rootElement);
                    // Looping the attributes
                    forEach([].slice.call(node.attributes), function (attr) {
                        walker(attr, data);
                    });
                }
                // e-content="..." directive
                if (Constants.check(node, Constants.content))
                    return _this.directive.content(node);
                // e-bind:[?]="..." directive
                if (Constants.check(node, Constants.bind))
                    return _this.directive.bind(node, data)
                        .connect(rootElement);
                // e-[?]="..." directive
                if (Constants.check(node, Constants.property) && !Constants.isConstant(node.nodeName))
                    _this.directive.property(node, data)
                        .connect(rootElement);
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
                // Looping the nodes if exists
                var childNode = node.childNodes[0];
                do {
                    if (!childNode)
                        break;
                    walker(childNode, data);
                } while (childNode = childNode.nextSibling);
            };
            walker(rootElement, data);
            if (isFunction(options.onDone))
                options.onDone.call(this.bouer, rootElement);
        };
        HtmlHandler.prototype.analizer = function (htmlSnippet) {
            return true;
        };
        return HtmlHandler;
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
            mutation.observe(element, { childList: true });
        };
        return Observer;
    }());

    var Bouer = /** @class */ (function () {
        /**
         * Default constructor
         * @param elSelector the section that will be controlled by the instance
         * @param options the options to the instance
         */
        function Bouer(elSelector, options) {
            this.name = 'Bouer';
            this.version = '3.0.0';
            // Applying all the options defined
            Object.assign(this, (options || {}));
            if (isNull(elSelector) || trim(elSelector) === '')
                throw Logger.error('Invalid selector provided to the instance.');
            var app = this;
            var el = DOM.querySelector(elSelector);
            if (isNull(el))
                throw Logger.error('Element with selector \'' + elSelector + '\' not found.');
            this.el = el;
            app.beforeMount(app.el, app);
            new Evalutator(this);
            new CommentHandler(this);
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
            var htmlHandler = new HtmlHandler(this);
            new CommentHandler(this);
            app.beforeLoad(app.el, app);
            // compile the app
            htmlHandler.compile({
                el: this.el,
                data: this.data,
                onDone: function () {
                    app.loaded(app.el, app);
                }
            });
            Observer.observe(this.el, function (options) {
                var mutation = options.mutation, element = options.element;
                if (element.isConnected === false) {
                    app.destroyed(app.el, app);
                    mutation.disconnect();
                }
            });
            // Assing the two methods available
            this.delimiters = {
                add: delimiter.add,
                remove: delimiter.remove,
                get: function () { return delimiter.delimiters; }
            };
            if (!DOM.head.querySelector("link[rel~='icon']")) {
                createEl('link', function (favicon) {
                    favicon.rel = 'icon';
                    favicon.type = 'image/png';
                    favicon.href = 'https://afonsomatelias.github.io/easy/assets/img/main_ico.png';
                }).appendTo(DOM.head);
            }
        }
        /**
         * Compiles a `HTML snippet` to a `Object Literal`
         * @param input the input element
         * @param options the options of the compilation
         * @param onSet a function that will be fired when a value is setted
         * @returns the Object Compiled from the HTML
         */
        Bouer.prototype.toJsObj = function (input, options, onSet) {
            return HtmlHandler.singleton.toJsObj(input, options, onSet);
        };
        /**
         * Sets data into a target object, by default is the `app.data`
         * @param inputData the data the will be setted
         * @param targetObject the target were the inputData
         * @returns
         */
        Bouer.prototype.setData = function (inputData, targetObject) {
            if (!isObject(inputData))
                return Logger.error('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".');
            if (targetObject === null || !isObject(targetObject))
                return Logger.error('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".');
            targetObject = this.data;
            // Transforming the input
            Reactive.transform(inputData);
            // Transfering the properties
            forEach(Object.keys(inputData), function (key) { return transferProperty(targetObject, inputData, key); });
            return targetObject;
        };
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
