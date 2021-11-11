import Bouer from "../../instance/Bouer";
import IoC from "../../shared/helpers/IoC";
import {
  defineProperty,
  forEach,
  getDescriptor,
  isFunction,
  isNull,
  isObject,
  mapper,
  toArray,
  transferProperty
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import dynamic from "../../types/dynamic";
import watchCallback from "../../types/watchCallback";
import Watch from "../binder/Watch";
import Component from "../component/Component";
import ReactiveEvent from "../event/ReactiveEvent";

export default class Reactive<TValue, TObject> implements PropertyDescriptor {
  propertyName: string;
  propertyValue: TValue;
  propertySource: TObject;
  propertyDescriptor: PropertyDescriptor | undefined;
  watches: Array<Watch<TValue, TObject>> = [];
  isComputed: boolean;

  computedGetter?: () => any
  computedSetter?: (value: TValue) => void

  constructor(options: { propertyName: string, sourceObject: TObject }) {
    this.propertyName = options.propertyName;
    this.propertySource = options.sourceObject;
    // Setting the value of the property
    this.propertyDescriptor = getDescriptor(this.propertySource, this.propertyName);

    this.propertyValue = this.propertyDescriptor!.value as TValue;
    this.isComputed = typeof this.propertyValue === 'function' && this.propertyValue.name === '$computed';
    if (this.isComputed) {
      const computedResult = (this.propertyValue as any).call(IoC.Resolve('Bouer'));

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
  }

  get = () => {
    ReactiveEvent.emit('BeforeGet', this);
    this.propertyValue = this.isComputed ? this.computedGetter!() : this.propertyValue;
    const value = this.propertyValue;
    ReactiveEvent.emit('AfterGet', this);
    return value;
  }

  set = (value: TValue) => {
    const oldPropertyValue = this.propertyValue;
    if (oldPropertyValue === value) return;
    ReactiveEvent.emit('BeforeSet', this);

    if (isObject(value) || Array.isArray(value)) {
      if ((typeof this.propertyValue) !== (typeof value))
        return Logger.error(("Cannot set “" + (typeof value) + "” in “" +
          this.propertyName + "” property."));

      if (Array.isArray(value)) {
        Reactive.transform(value, this);
        const propValueAsAny = this.propertyValue as any;

        propValueAsAny.splice(0, propValueAsAny.length);
        propValueAsAny.push.apply(propValueAsAny, (value as any));
      } else if (isObject(value)) {
        if ((value instanceof Node)) // If some html element
          this.propertyValue = value;
        else {
          Reactive.transform(value);
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

  watch(callback: watchCallback, node?: Node): Watch<TValue, TObject> {
    const w = new Watch(this, callback, { node: node });
    this.watches.push(w);
    return w;
  }

  static transform = <TObject>(inputObject: TObject, reactiveObj?: Reactive<any, any>) => {
    if (Array.isArray(inputObject)) {
      if (reactiveObj == null) {
        Logger.warn('Cannot transform this array to a reactive one because no reactive objecto was provided');
        return inputObject;
      }

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
              forEach(toArray(arguments), arg => {
                if (!isObject(arg) && !Array.isArray(arg)) return;
                Reactive.transform(arg);
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
        sourceObject: inputObject
      });

      defineProperty(inputObject, key, reactive);

      if (isObject(propertyValue))
        this.transform(propertyValue);
      else if (Array.isArray(propertyValue)) {
        this.transform(propertyValue, reactive); // Transform the array to a reactive one
        forEach(propertyValue, (item: object) => this.transform(item));
      }
    });

    return inputObject;
  }

  static setData(inputData: object, targetObject?: object) {
    if (!isObject(inputData))
      return Logger.error('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".');

    if (isObject(targetObject) && targetObject !== null)
      return Logger.error('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".');

    // Transforming the input
    Reactive.transform(inputData);

    // Transfering the properties
    forEach(Object.keys(inputData), key => transferProperty(targetObject, inputData, key));
    return targetObject;
  }
}
