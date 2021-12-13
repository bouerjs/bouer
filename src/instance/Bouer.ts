import Binder from "../core/binder/Binder";
import Compiler from "../core/compiler/Compiler";
import Converter from "../core/compiler/Converter";
import Component from "../core/component/Component";
import ComponentHandler from "../core/component/ComponentHandler";
import DelimiterHandler from "../core/DelimiterHandler";
import Evaluator from "../core/Evaluator";
import EventHandler from "../core/event/EventHandler";
import Middleware from "../core/middleware/Middleware";
import Reactive from "../core/reactive/Reactive";
import Routing from "../core/routing/Routing";
import Skeleton from "../core/Skeleton";
import DataStore from "../core/store/DataStore";
import Constants from "../shared/helpers/Constants";
import IoC from "../shared/helpers/IoC";
import Task from "../shared/helpers/Task";
import {
	createEl, defineProperty, DOM, forEach,
	GLOBAL,
	isNull, isObject, toArray, transferProperty, trim
} from "../shared/helpers/Utils";
import Logger from "../shared/logger/Logger";
import IBouer from "../definitions/interfaces/IBouer";
import IBouerConfig from "../definitions/interfaces/IBouerConfig";
import WatchCallback from "../definitions/types/WatchCallback";
import dynamic from "../definitions/types/Dynamic";
import delimiter from "../definitions/types/delimiter";
import IComponent from "../definitions/interfaces/IComponent";

export default class Bouer implements IBouer {
	el: Element;
	name = 'Bouer';
	version = '3.0.0';
	data: object;
	globalData: object;
	config?: IBouerConfig;
	dependencies: dynamic = {};
	isDestroyed: boolean = false;
	__id__: number = IoC.GetId();

	/** Data Exposition and Injection handler*/
	$data: {
		/**
		 * Gets the exposed `data` or the value provided for `data` directive
		 * @param key the data:[`key`]="..." directive key value or the app.$data.set(`key`) key provided.
		 * @returns the expected object | null
		 */
		get: (key?: string) => any,
		/**
		 * Sets a value into a storage the used anywhere of the application.
		 * @param key the key of the data to be stored.
		 * @param data the data to be stored.
		 * @param toReactive allow to transform the data to a reactive one after being setted. By default is `false`.
		 */
		set: (key: string, data: object | any[], toReactive?: boolean) => any,
		/**
		 * Destroy the stored data
		 * @param key the data:[`key`]="..." directive value or the app.$data.set(`key`) key provided.
		 * @returns `true` for item deleted or `false` for item not deleted.
		 */
		unset: (key: string) => boolean,
	}

	/** Requests handler */
	$req: {
		/**
		 * Gets the `e-req` directive response value
		 * @param key the e-req:[`key`]="..." directive key value.
		 * @returns the expected object | null
		 */
		get: (key?: string) => { data: any, [key: string]: any } | null
		/**
		 * Destroy stored req (request)
		 * @param key the e-req:[`key`]="..." directive key value.
		 * @returns `true` for item deleted or `false` for item not deleted.
		 */
		unset: (key: string) => boolean,
	}

	/** Waiting data Handler */
	$wait: {
		/**
		 * Gets the elements and data of the `wait-data` directive.
		 * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
		 * @returns the expected object | null
		 */
		get: (key?: string) => any,
		/**
		 * Provides data for `wait-data` directive elements.
		 * @param key the key of `wait-data` directive value.
		 * @param data the data provide to the elements waiting
		 */
		set: (key: string, data: object) => void,
		/**
		 * Destroy stored wait
		 * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
		 * @returns `true` for item deleted or `false` for item not deleted.
		 */
		unset: (key: string) => boolean,
	}

	/** Delimiters handler */
	$delimiters: {
		/** Adds a delimiter into the instance */
		add: (item: delimiter) => void
		/** Removes a delimiter from the instance */
		remove: (name: string) => void;
		/** Retrieve all the delimiters */
		get: () => delimiter[];
	};

	/** Skeleton handler */
	$skeleton: {
		/** Removes skeletons havining the `id` provided */
		clear: (id?: string) => void,
		/** Set Color of the Wave and/or the Background */
		set: (color?: { wave?: string, background?: string }) => void
	}

	/** Components Handler */
	$components: {
		add: (component: IComponent) => void
		get: (name: string) => (Component | IComponent)
	}

	/** Routing Handler */
	$routing: {
		/** Store Bouer application instance */
		bouer: Bouer;

		/** Store the route elements */
		routeView: Element | null;

		/** Store the Component defined has NotFound Page */
		defaultPage?: Component | IComponent;

		/** Store the Component defined has NotFound Page */
		notFoundPage?: Component | IComponent;

		/** Store `href` value of the <base /> tag */
		base?: string | null;

		/** Navigates to a certain page without reloading all the page */
		navigate: (route: string, changeUrl?: boolean) => void;

		/** Navigates to previous page according to a number of go back */
		popState: (times?: number) => void;

		/** Changes the current url to a new one provided */
		pushState: (url: string, title?: string) => void;

		/** Mark all anchors having the route provided as active */
		markActiveAnchors: (route: string) => void
	}

	/**
	 * Gets all the elemens having the `ref` attribute
	 * @returns an object having all the elements with the `ref attribute value` defined as the key.
	 */
	refs: dynamic = {};

	/**
	 * Default constructor
	 * @param selector the selector of the element to be controlled by the instance
	 * @param options the options to the instance
	 */
	constructor(selector: string, options?: IBouer) {
		options = options || {};
		// Applying all the options defined

		this.config = options.config;
		this.dependencies = options.dependencies || {};

		if (isNull(selector) || trim(selector) === '')
			throw Logger.error(new Error('Invalid selector provided to the instance.'));

		const el = DOM.querySelector(selector);
		if (!el) throw Logger.error(new SyntaxError("Element with selector “" + selector + "” not found."));

		this.el = el;

		const dataStore = new DataStore(this);
		const evaluator = new Evaluator(this);
		const middleware = new Middleware(this);

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

		const delimiters = options.delimiters || [];
		delimiters.push.apply(delimiters, [
			{ name: 'common', delimiter: { open: '{{', close: '}}' } },
			{ name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
		]);

		const binder = new Binder(this);
		const delimiter = new DelimiterHandler(delimiters, this);
		const eventHandler = new EventHandler(this);
		const routing = new Routing(this);
		const componentHandler = new ComponentHandler(this);
		const compiler = new Compiler(this, options);
		const converter = new Converter(this);
		const skeleton = new Skeleton(this);
		skeleton.init();

		this.$delimiters = {
			add: delimiter.add,
			remove: delimiter.remove,
			get: () => delimiter.delimiters.slice()
		};
		this.$data = {
			get: key => key ? dataStore.data[key] : dataStore.data,
			set: (key, data, toReactive) => {
				if (key in dataStore.data)
					return Logger.log("There is already a data stored with this key “" + key + "”.");

				if ((toReactive ?? false) === true)
					Reactive.transform({
						context: this,
						inputObject: data
					});
				return IoC.Resolve<DataStore>(this, DataStore)!.set('data', key, data);
			},
			unset: key => delete dataStore.data[key]
		};
		this.$req = {
			get: key => key ? dataStore.req[key] : dataStore.req,
			unset: key => delete dataStore.req[key],
		};
		this.$wait = {
			get: key => key ? dataStore.wait[key] : dataStore.wait,
			set: (key: string, data: object) => {
				if (!(key in dataStore.wait))
					return dataStore.wait[key] = { data: data, nodes: [] };

				const mWait = dataStore.wait[key];
				mWait.data = data;

				return forEach(mWait.nodes, node => {
					if (!node) return;
					compiler.compile({
						el: node,
						data: Reactive.transform({
							context: this,
							inputObject: mWait.data
						}),
						context: this
					})
				});
			},
			unset: key => delete dataStore.wait[key],
		};
		this.$skeleton = {
			clear: id => skeleton.clear(id),
			set: color => skeleton.init(color)
		}
		this.$components = {
			add: component => componentHandler.prepare([component]),
			get: name => componentHandler.components[name]
		}

		this.$routing = routing;

		defineProperty(this, 'refs', {
			get: () => {
				const mRefs: dynamic = {};
				forEach(toArray(this.el.querySelectorAll("[" + Constants.ref + "]")), (ref: any) => {
					const mRef = ref.attributes[Constants.ref] as Attr;
					let value = trim(mRef.value) || ref.name || '';

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

		forEach([options.beforeLoad, options.loaded, options.beforeDestroy, options.destroyed],
			evt => {
				if (typeof evt !== 'function') return;
				eventHandler.on({
					eventName: evt.name,
					callback: evt as any,
					attachedNode: el,
					modifiers: { once: true },
					context: this
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
			onDone: () => eventHandler.emit({
				eventName: 'loaded',
				attachedNode: el
			})
		});

		GLOBAL.addEventListener('beforeunload', () => {
			if (this.isDestroyed) return;

			eventHandler.emit({
				eventName: 'beforeDestroy',
				attachedNode: el
			});

			this.destroy();
			this.isDestroyed = true;
		}, { once: true });

		Task.run(stopTask => {
			if (this.isDestroyed) return stopTask();
			if (this.el.isConnected) return;

			eventHandler.emit({
				eventName: 'beforeDestroy',
				attachedNode: this.el
			});

			this.destroy();
			stopTask();
			this.isDestroyed = true;
		});

		// Initializing Routing
		routing.init();

		if (!DOM.head.querySelector("link[rel~='icon']")) {
			createEl('link', (favicon) => {
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
	set(inputData: object, targetObject?: object) {

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
		forEach(Object.keys(inputData), key => transferProperty(targetObject, inputData, key));
		return targetObject;
	}

	/**
	 * Compiles a `HTML snippet` to a `Object Literal`
	 * @param input the input element
	 * @param options the options of the compilation
	 * @param onSet a function that should be fired when a value is setted
	 * @returns the Object Compiled from the HTML
	 */
	toJsObj(input: any, options?: {
		/**
		 * attributes that tells the compiler to lookup to the element, e.g: [name],[data-name].
		 * * Note: The definition order matters.
		 */
		names?: string,
		/**
		 * attributes that tells the compiler where it going to get the value, e.g: [value],[data-value].
		 * * Note: The definition order matters.
		 */
		values?: string
	}, onSet?: (builtObject: object, propName: string, value: any, element: Element) => void) {
		return IoC.Resolve<Converter>(this, Converter)!.htmlToJsObj(input, options, onSet);
	}

	/**
	 * Provides the possibility to watch a property change
	 * @param propertyName the property to watch
	 * @param callback the function that should be called when the property change
	 * @param targetObject the target object having the property to watch
	 * @returns the watch object having the method to destroy the watch
	 */
	watch(propertyName: string, callback: WatchCallback, targetObject?: object) {
		return IoC.Resolve<Binder>(this, Binder)!.onPropertyChange(propertyName, callback, targetObject);
	}

	/**
	 * Watch all reactive properties in the provided scope.
	 * @param watchableScope the function that should be called when the any reactive property change
	 * @returns an object having all the watches and the method to destroy watches at once
	 */
	react(watchableScope: (app: Bouer) => void) {
		return IoC.Resolve<Binder>(this, Binder)!
				.onPropertyInScopeChange(watchableScope);
	}

	/**
	 * Add an Event Listener to the instance or to an object
	 * @param eventName the event name to be listening
	 * @param callback the callback that should be fired
	 * @param attachedNode A node to attach the event
	 * @param modifiers An object having all the event modifier
	 * @returns The event added
	 */
	on(eventName: string,
		callback: (event: CustomEvent | Event) => void,
		options?: {
			attachedNode?: Node,
			modifiers?: {
				capture?: boolean;
				once?: boolean;
				passive?: boolean;
				signal?: AbortSignal;
			}
		}) {
		return IoC.Resolve<EventHandler>(this, EventHandler)!.
			on({
				eventName,
				callback,
				attachedNode: (options || {}).attachedNode,
				modifiers: (options || {}).modifiers,
				context: this
			});
	}

	/**
	 * Removes an Event Listener from the instance or from object
	 * @param eventName the event name to be listening
	 * @param callback the callback that should be fired
	 * @param attachedNode A node to attach the event
	 */
	off(eventName: string, callback: (event: CustomEvent | Event) => void, attachedNode?: Node) {
		return IoC.Resolve<EventHandler>(this, EventHandler)!.
			off({
				eventName,
				callback,
				attachedNode
			});
	}

	/**
	 * Dispatch an event
	 * @param options options for the emission
	 */
	emit(eventName: string, options?: {
		element?: Node,
		init?: CustomEventInit,
		once?: boolean
	}) {
		var mOptions = (options || {});
		return IoC.Resolve<EventHandler>(this, EventHandler)!.
			emit({
				eventName: eventName,
				attachedNode: mOptions.element,
				init: mOptions.init,
				once: mOptions.once
			});
	}

	/**
	 * Limits sequential execution to a single one acording to the milliseconds provided
	 * @param callback the callback that should be performed the execution
	 * @param wait milliseconds to the be waited before the single execution
	 * @returns executable function
	 */
	lazy(callback: (args: IArguments) => void, wait?: number) {
		const _this = this;
		let timeout: any; wait = isNull(wait) ? 500 : wait;
		const immediate = arguments[2];

		return function executable() {
			const args: any = [].slice.call(arguments);
			const later = function () {
				timeout = null;
				if (!immediate) callback.apply(_this, args);
			};
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) callback.apply(_this, args);
		};
	}

	/**
	 * Compiles an html element
	 * @param options the options of the compilation process
	 * @returns
	 */
	compile(options: {
		/** The element that wil be compiled */
		el: Element,
		/** The context of this compilation process */
		context: object,
		/** The data that should be injected in the compilation */
		data?: object,
		/** The function that should be fired when the compilation is done */
		onDone?: (element: Element, data?: object | undefined) => void
	}) {
		return IoC.Resolve<Compiler>(this, Compiler)!.
			compile({
				el: options.el,
				data: options.data,
				context: options.context,
				onDone: options.onDone
			});
	}

	destroy() {
		const el = this.el!;
		const destroyedEvents = IoC.Resolve<EventHandler>(this, EventHandler)!
					.$events['destroyed'] || [];

		this.emit('destroyed', { element: this.el! });
		// Dispatching all the destroy events
		forEach(destroyedEvents, es => es.emit({ once: true }));

		if (el.tagName == 'body')
			el.innerHTML = '';
		else if (DOM.contains(el))
			DOM.body.removeChild(el);

		IoC.Dispose(this);
	}

	// Hooks
	beforeLoad?(event: CustomEvent) { }
	loaded?(event: CustomEvent) { }
	beforeDestroy?(event: CustomEvent) { }
	destroyed?(event: CustomEvent) { }
}