import Binder from "../core/binder/Binder";
import CommentHandler from "../core/CommentHandler";
import Compiler from "../core/compiler/Compiler";
import Converter from "../core/compiler/Converter";
import Component from "../core/component/Component";
import ComponentHandler from "../core/component/ComponentHandler";
import DelimiterHandler from "../core/DelimiterHandler";
import Evaluator from "../core/Evaluator";
import EventHandler, { EventEmitterOptions } from "../core/event/EventHandler";
import Interceptor from "../core/interceptor/Interceptor";
import Reactive from "../core/reactive/Reactive";
import Routing from "../core/routing/Routing";
import Skeleton from "../core/Skeleton";
import DataStore from "../core/store/DataStore";
import { Constants } from "../shared/helpers/Constants";
import IoC from "../shared/helpers/IoC";
import {
	createEl, defineProperty, DOM, forEach,
	GLOBAL,
	isNull, toArray, trim
} from "../shared/helpers/Utils";
import Logger from "../shared/logger/Logger";
import delimiter from "../types/delimiter";
import dynamic from "../types/dynamic";
import IBouer from "../types/IBouer";
import IBouerConfig from "../types/IBouerConfig";
import IComponent from "../types/IComponent";
import watchCallback from "../types/watchCallback";

export default class Bouer implements IBouer {
	el: Element;
	name = 'Bouer';
	version = '3.0.0';
	data: object;
	globalData: object;
	config?: IBouerConfig;
	routing?: Routing;
	dependencies: dynamic = {};

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

		const dataStore = new DataStore();
		new Evaluator(this);
		new CommentHandler(this);
		const interceptor = new Interceptor();
		IoC.Register(this);

		// Register the interceptor
		if (typeof options.interceptor === 'function')
			options.interceptor(interceptor.register, this);

		// Transform the data properties into a reative
		this.data = Reactive.transform(options!.data || {});
		this.globalData = Reactive.transform(options!.globalData || {});

		const delimiters = options.delimiters || [];
		delimiters.push.apply(delimiters, [
			{ name: 'bouer', delimiter: { open: '-e-', close: '-' } },
			{ name: 'common', delimiter: { open: '{{', close: '}}' } },
			{ name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
		]);

		new Binder(this);
		const delimiter = new DelimiterHandler(delimiters);
		const eventHandler = new EventHandler(this);
		this.routing = new Routing(this);
		const componentHandler = new ComponentHandler(this, options);
		const compiler = new Compiler(this, options);
		new Converter(this);
		new CommentHandler(this);
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
					Reactive.transform(data);
				return DataStore.set('data', key, data);
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
						data: Reactive.transform(mWait.data),
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

		GLOBAL.addEventListener('beforeunload', evt => {
			eventHandler.emit({
				eventName: 'beforeDestroy',
				attachedNode: el
			});

			this.destroy();
		}, { once: true });

		// Initializing Routing
		this.routing.init();

		if (!DOM.head.querySelector("link[rel~='icon']")) {
			createEl('link', (favicon) => {
				favicon.rel = 'icon';
				favicon.type = 'image/png';
				favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
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
		return IoC.Resolve<Converter>('Converter')!.htmlToJsObj(input, options, onSet);
	}

	/**
	 * Sets data into a target object, by default is the `app.data`
	 * @param inputData the data the will be setted
	 * @param targetObject the target were the inputData
	 * @returns the object with the data setted
	 */
	setData(inputData: object, targetObject?: object) {
		return Reactive.setData(inputData, (targetObject || this.data));
	}

	/**
	 * Provides the possibility to watch a property change
	 * @param propertyName the property to watch
	 * @param callback the function that will be called when the property change
	 * @param targetObject the target object having the property to watch
	 * @returns the watch object having the method to destroy the watch
	 */
	watch(propertyName: string, callback: watchCallback, targetObject?: object) {
		return IoC.Resolve<Binder>('Binder')!.watch(propertyName, callback, targetObject);
	}

	/**
	 * Add an Event Listener to the instance or to an object
	 * @param eventName the event name to be listening
	 * @param callback the callback that will be fired
	 * @param attachedNode A node to attach the event
	 * @param modifiers An object having all the event modifier
	 * @returns The event added
	 */
	on(eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node,
		modifiers?: {
			capture?: boolean;
			once?: boolean;
			passive?: boolean;
			signal?: AbortSignal;
		}) {
		return IoC.Resolve<EventHandler>('EventHandler')!.
			on({
				eventName,
				callback,
				attachedNode,
				modifiers,
				context: this
			});
	}

	/**
	 * Removes an Event Listener from the instance or from object
	 * @param eventName the event name to be listening
	 * @param callback the callback that will be fired
	 * @param attachedNode A node to attach the event
	 */
	off(eventName: string, callback: (event: CustomEvent | Event) => void, attachedNode?: Node) {
		return IoC.Resolve<EventHandler>('EventHandler')!.
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
	emit(options: EventEmitterOptions) {
		return IoC.Resolve<EventHandler>('EventHandler')!.
			emit(options);
	}

	/**
	 * Limits sequential execution to a single one acording to the milliseconds provided
	 * @param callback the callback that will be performed the execution
	 * @param wait milliseconds to the be waited before the single execution
	 * @returns executable function
	 */
	lazy(callback: (args: IArguments) => void, wait?: number) {
		const _this = this;
		let timeout: any; wait = isNull(wait) ? 500 : wait;
		const immediate = arguments[2];

		return function executable() {
			const args = arguments;
			const later = function () {
				timeout = null;
				if (!immediate) callback.call(_this, args);
			};
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) callback.call(_this, args);
		};
	}

	destroy() {
		const el = this.el!;
		if (el.tagName == 'body')
			el.innerHTML = '';
		else DOM.body.removeChild(el);

		forEach(toArray(
				DOM.head.querySelectorAll('#bouer,[component-style]')
			), (item: Element) => {
				if (item.isConnected)
					DOM.head.removeChild(item);
			});

		this.emit({
			eventName: 'destroyed',
			attachedNode: this.el!
		})
	}

	// Hooks
	beforeLoad?(event: CustomEvent) { }
	loaded?(event: CustomEvent) { }
	beforeDestroy?(event: CustomEvent) { }
	destroyed?(event: CustomEvent) { }
}