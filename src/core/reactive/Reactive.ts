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
	propName: string;
	propValue: Value;
	propValueOld?: Value;
	propSource: TObject;
	propDescriptor: PropertyDescriptor | undefined;
	watches: Array<Watch<Value, TObject>> = [];
	isComputed: boolean;
	context: RenderContext;

	computedGetter?: () => any
	computedSetter?: (value: Value) => void

	constructor(options: {
		propName: string,
		srcObject: TObject,
		context: RenderContext
	}) {
		super();

		this.propName = options.propName;
		this.propSource = options.srcObject;
		this.context = options.context;
		// Setting the value of the property

		this.propDescriptor = Prop.descriptor(this.propSource, this.propName);

		this.propValue = this.propDescriptor!.value as Value;
		this.isComputed = typeof this.propValue === 'function' && this.propValue.name === '$computed';
		if (this.isComputed) {
			const computedResult = (this.propValue as any).call(this.context);

			if ('get' in computedResult || !isNull(computedResult)) {
				this.computedGetter = computedResult.get || (() => computedResult);
			}

			if ('set' in computedResult) {
				this.computedSetter = computedResult.set;
			}

			if (isNull(this.computedGetter))
				throw new Error("Computed property must be a function “function $computed(){...}” that returns " +
					"a valid value to infer “getter only” or an object with a “get” and/or “set” function");

			(this.propValue as any) = undefined;
		}

		if (typeof this.propValue === 'function' && !this.isComputed)
			this.propValue = this.propValue.bind(this.context);
	}

	get = () => {
		ReactiveEvent.emit('BeforeGet', this);
		this.propValue = this.isComputed ? this.computedGetter!() : this.propValue;
		const value = this.propValue;
		ReactiveEvent.emit('AfterGet', this);
		return value;
	}

	set = (value: Value) => {
		this.propValueOld = this.propValue;
		if (this.propValueOld === value || (Number.isNaN(this.propValueOld) && Number.isNaN(value)))
			return;

		ReactiveEvent.emit('BeforeSet', this);

		if (isObject(value) || Array.isArray(value)) {
			if ((typeof this.propValue) !== (typeof value))
				return Logger.error(("Cannot set “" + (typeof value) + "” in “" +
					this.propName + "” property."));

			if (Array.isArray(value)) {
				Reactive.transform({
					data: value,
					reactiveObj: this,
					context: this.context
				});
				const propValueAsAny = this.propValue as any;

				propValueAsAny.splice(0, propValueAsAny.length);
				propValueAsAny.push.apply(propValueAsAny, (value as any));
			} else if (isObject(value)) {
				if ((value instanceof Node)) // If some html element
					this.propValue = value;
				else {
					Reactive.transform({
						data: value,
						context: this.context
					});
					if (!isNull(this.propValue))
						mapper(value, this.propValue);
					else
						this.propValue = value;
				}
			}
		} else {
			this.propValue = value;
		}

		if (this.isComputed && this.computedSetter)
			this.computedSetter(value);

		ReactiveEvent.emit('AfterSet', this);
		this.notify();
	}

	notify() {
		// Running all the watches
		forEach(this.watches, watch => watch.callback.call(this.context, this.propValue, this.propValueOld));
	}

	onChange(callback: WatchCallback, node?: Node): Watch<Value, TObject> {
		const w = new Watch(this, callback, { node: node });
		this.watches.push(w);
		return w;
	}

	static transform = <InputObject>(options: {
		context: RenderContext,
		data: InputObject,
		reactiveObj?: Reactive<any, any>,
	}) => {
		const context = options.context;
		const executer = (data: InputObject, visiting: any[], visited: any[], reactiveObj?: Reactive<any, any>) => {
			if (Array.isArray(data)) {
				if (reactiveObj == null) {
					Logger.warn('Cannot transform this array to a reactive one because no reactive objecto was provided');
					return data;
				}

				if (visiting.indexOf(data) !== -1)
					return data;
				visiting.push(data);

				const REACTIVE_ARRAY_METHODS = ['push', 'pop', 'unshift', 'shift', 'splice']
				const inputArray = data as any;
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

			if (!isObject(data))
				return data;

			if (visiting!.indexOf(data) !== -1)
				return data;
			visiting.push(data);

			forEach(Object.keys(data), key => {
				const mInputObject = data as dynamic;

				// Already a reactive property, do nothing
				if (!('value' in Prop.descriptor(data, key)!))
					return;

				const propertyValue = mInputObject[key];

				if ((propertyValue instanceof Object) && ((propertyValue._IRT_) || (propertyValue instanceof Node)))
					return;

				const reactive = new Reactive({
					propName: key,
					srcObject: data,
					context: context
				});

				Prop.set(data, key, reactive);
				if (Array.isArray(propertyValue)) {
					executer(propertyValue as any, visiting, visited, reactive); // Transform the array to a reactive one
					forEach(propertyValue, (item: object) => executer(item as any, visiting, visited));
				} else if (isObject(propertyValue))
					executer(propertyValue, visiting, visited);
			});

			visiting.splice(visiting.indexOf(data), 1);
			visited.push(data);

			return data;
		}

		return executer(options.data, [], [], options.reactiveObj);
	}
}