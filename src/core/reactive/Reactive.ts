import dynamic from "../../definitions/types/Dynamic";
import RenderContext from "../../definitions/types/RenderContext";
import WatchCallback from "../../definitions/types/WatchCallback";
import Prop from "../../shared/helpers/Prop";
import {
	forEach,
	isFunction,
	isNull,
	isObject,
	mapper,
	toArray
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Base from "../Base";
import Watch from "../binder/Watch";
import ReactiveEvent from "../event/ReactiveEvent";

export default class Reactive<Value, TObject extends {}> extends Base implements PropertyDescriptor {
	propertyName: string;
	propertyValue: Value;
	propertyValueOld?: Value;
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
		super();

		this.propertyName = options.propertyName;
		this.propertySource = options.sourceObject;
		this.context = options.context;
		// Setting the value of the property

		this.propertyDescriptor = Prop.descriptor(this.propertySource, this.propertyName);

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
		this.propertyValueOld = this.propertyValue;
		if (this.propertyValueOld === value || (Number.isNaN(this.propertyValueOld) && Number.isNaN(value)))
			return;

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
		this.notify();
	}

	notify() {
		// Running all the watches
		forEach(this.watches, watch => watch.callback.call(this.context, this.propertyValue, this.propertyValueOld));
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
		const executer = (inputObject: InputObject, visiting: any[], visited: any[], reactiveObj?: Reactive<any, any>) => {
			if (Array.isArray(inputObject)) {
				if (reactiveObj == null) {
					Logger.warn('Cannot transform this array to a reactive one because no reactive objecto was provided');
					return inputObject;
				}

				if (visiting.indexOf(inputObject) !== -1)
					return inputObject;
				visiting.push(inputObject);

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
						const args = [].slice.call(arguments);
						switch (method) {
							case 'push': case 'unshift':
								forEach(toArray(args), (arg: any) => {
									if (!isObject(arg) && !Array.isArray(arg)) return;
									executer(arg, visiting, visited);
								});
						}

						const result = reference[method].apply(inputArray, args);

						forEach(reactiveObj.watches, watch => watch.callback(inputArray, oldArrayValue, {
							method: method,
							args: args
						}));
						return result;
					}
				});

				return inputArray;
			}

			if (!isObject(inputObject))
				return inputObject;

			if (visiting!.indexOf(inputObject) !== -1)
				return inputObject;
			visiting.push(inputObject);

			forEach(Object.keys(inputObject), key => {
				const mInputObject = inputObject as dynamic;

				// Already a reactive property, do nothing
				if (!('value' in Prop.descriptor(inputObject, key)!))
					return;

				const propertyValue = mInputObject[key];

				if ((propertyValue instanceof Object) && ((propertyValue.$irt) || (propertyValue instanceof Node)))
					return;

				const reactive = new Reactive({
					propertyName: key,
					sourceObject: inputObject,
					context: context
				});

				Prop.set(inputObject, key, reactive);
				if (Array.isArray(propertyValue)) {
					executer(propertyValue as any, visiting, visited, reactive); // Transform the array to a reactive one
					forEach(propertyValue, (item: object) => executer(item as any, visiting, visited));
				} else if (isObject(propertyValue))
					executer(propertyValue, visiting, visited);
			});

			visiting.splice(visiting.indexOf(inputObject), 1);
			visited.push(inputObject);

			return inputObject;
		}

		return executer(options.inputObject, [], [], options.reactiveObj);
	}
}