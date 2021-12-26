import RenderContext from "../../definitions/types/RenderContext";
import dynamic from "../../definitions/types/Dynamic";
import WatchCallback from "../../definitions/types/WatchCallback";
import Bouer from "../../instance/Bouer";
import {
	defineProperty,
	forEach,
	getDescriptor,
	isFunction,
	isNull,
	isObject,
	mapper,
	toArray
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Watch from "../binder/Watch";
import Component from "../component/Component";
import ReactiveEvent from "../event/ReactiveEvent";

export default class Reactive<Value, TObject> implements PropertyDescriptor {
	propertyName: string;
	propertyValue: Value;
	propertySource: TObject;
	propertyDescriptor: PropertyDescriptor | undefined;
	watches: Array<Watch<Value, TObject>> = [];
	isComputed: boolean;
	context: RenderContext;

	computedGetter?: () => any
	computedSetter?: (value: Value) => void

	constructor(options: {
		propertyName: string,
		sourceObject: TObject,
		context: RenderContext
	}) {
		this.propertyName = options.propertyName;
		this.propertySource = options.sourceObject;
		this.context = options.context;
		// Setting the value of the property
		this.propertyDescriptor = getDescriptor(this.propertySource, this.propertyName);

		this.propertyValue = this.propertyDescriptor!.value as Value;
		this.isComputed = typeof this.propertyValue === 'function' && this.propertyValue.name === '$computed';
		if (this.isComputed) {
			const computedResult = (this.propertyValue as any).call(this.context);

			if ('get' in computedResult || isFunction(computedResult)) {
				this.computedGetter = computedResult.get || computedResult;
			}

			if ('set' in computedResult) {
				this.computedSetter = computedResult.set;
			}

			if (!this.computedGetter)
				throw new Error("Computed property must be a function “function $computed(){...}” " +
					"that returns a function for “getter only” or an object with a “get” and/or “set” function");

			(this.propertyValue as any) = undefined;
		}

		if (typeof this.propertyValue === 'function' && !this.isComputed)
			this.propertyValue = this.propertyValue.bind(this.context);
	}

	get = () => {
		ReactiveEvent.emit('BeforeGet', this);
		this.propertyValue = this.isComputed ? this.computedGetter!() : this.propertyValue;
		const value = this.propertyValue;
		ReactiveEvent.emit('AfterGet', this);
		return value;
	}

	set = (value: Value) => {
		const oldPropertyValue = this.propertyValue;
		if (oldPropertyValue === value) return;
		ReactiveEvent.emit('BeforeSet', this);

		if (isObject(value) || Array.isArray(value)) {
			if ((typeof this.propertyValue) !== (typeof value))
				return Logger.error(("Cannot set “" + (typeof value) + "” in “" +
					this.propertyName + "” property."));

			if (Array.isArray(value)) {
				Reactive.transform({
					inputObject: value,
					reactiveObj: this,
					context: this.context
				});
				const propValueAsAny = this.propertyValue as any;

				propValueAsAny.splice(0, propValueAsAny.length);
				propValueAsAny.push.apply(propValueAsAny, (value as any));
			} else if (isObject(value)) {
				if ((value instanceof Node)) // If some html element
					this.propertyValue = value;
				else {
					Reactive.transform({
						inputObject: value,
						context: this.context
					});
					if (!isNull(this.propertyValue))
						mapper(value, this.propertyValue);
					else
						this.propertyValue = value;
				}
			}
		} else {
			this.propertyValue = value;
		}

		if (this.isComputed && this.computedSetter)
			this.computedSetter(value);

		ReactiveEvent.emit('AfterSet', this);
		// Calling all the watches
		forEach(this.watches, watch => watch.callback(this.propertyValue, oldPropertyValue));
	}

	onChange(callback: WatchCallback, node?: Node): Watch<Value, TObject> {
		const w = new Watch(this, callback, { node: node });
		this.watches.push(w);
		return w;
	}

	static transform = <InputObject>(options: {
		context: RenderContext,
		inputObject: InputObject,
		reactiveObj?: Reactive<any, any>,
	}) => {
		const context = options.context;
		const executer = (inputObject: InputObject, reactiveObj?: Reactive<any, any>, visiting?: any[], visited?: any[]) => {
			if (Array.isArray(inputObject)) {
				if (reactiveObj == null) {
					Logger.warn('Cannot transform this array to a reactive one because no reactive objecto was provided');
					return inputObject;
				}

				if (visiting!.indexOf(inputObject) !== -1)
					return inputObject;
				visiting?.push(inputObject);

				const REACTIVE_ARRAY_METHODS = ['push', 'pop', 'unshift', 'shift', 'splice']
				const inputArray = inputObject as any;
				const reference: dynamic = {}; // Using clousure to cache the array methods
				const prototype = inputArray.__proto__ = Object.create(Array.prototype);

				forEach(REACTIVE_ARRAY_METHODS, method => {
					// cache original method
					reference[method] = inputArray[method].bind(inputArray);
					// changing to the reactive one
					prototype[method] = function reactive() {
						const oldArrayValue = inputArray.slice();

						switch (method) {
							case 'push': case 'unshift':
								forEach(toArray(arguments), (arg: any) => {
									if (!isObject(arg) && !Array.isArray(arg)) return;
									executer(arg);
								});
						}

						const result = reference[method].apply(inputArray, arguments);

						forEach(reactiveObj.watches, watch => watch.callback(inputArray, oldArrayValue));
						return result;
					}
				});

				return inputArray;
			}

			if (!isObject(inputObject))
				return inputObject;

			if (visiting!.indexOf(inputObject) !== -1)
				return inputObject;
			visiting?.push(inputObject);

			forEach(Object.keys(inputObject), key => {
				const mInputObject = inputObject as dynamic;

				// Already a reactive property, do nothing
				if (isNull(getDescriptor(inputObject, key)!.value))
					return;

				const propertyValue = mInputObject[key];

				if (propertyValue && (propertyValue instanceof Bouer) ||
					(propertyValue instanceof Component) ||
					(propertyValue instanceof Node))
					return;

				const reactive = new Reactive({
					propertyName: key,
					sourceObject: inputObject,
					context: context
				});

				defineProperty(inputObject, key, reactive);

				if (isObject(propertyValue))
					executer(propertyValue);
				else if (Array.isArray(propertyValue)) {
					executer(propertyValue as any, reactive); // Transform the array to a reactive one
					forEach(propertyValue, (item: object) => executer(item as any));
				}
			});

			visiting?.splice(visiting.indexOf(inputObject), 1);
			visited?.push(inputObject);

			return inputObject;
		}

		return executer(options.inputObject, options.reactiveObj, [], []);
	}
}