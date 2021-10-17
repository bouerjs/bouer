import {
  defineProperty,
  forEach,
  getDescriptor,
  isNode,
  isNull,
  isObject,
  mapper
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Watch, { CallbackWatch } from "../binder/Watch";
import ReactiveEvent from "../event/ReactiveEvent";

export default class Reactive<TValue, TObject> implements PropertyDescriptor {
  propertyName: string;
  propertyValue: TValue;
  propertySource: TObject;
  propertyDescriptor: PropertyDescriptor | undefined;
  watches: Array<Watch<TValue, TObject>> = [];

  constructor(options: { propertyName: string, sourceObject: TObject }) {
    this.propertyName = options.propertyName;
    this.propertySource = options.sourceObject;
    this.propertyDescriptor = getDescriptor(this.propertySource, this.propertyName);
    // Setting the value of the property
    this.propertyValue = this.propertyDescriptor!.value as TValue;
  }

  get = () => {
    ReactiveEvent.emit('BeforeGet', this);
    const value = this.propertyValue;
    ReactiveEvent.emit('AfterGet', this);
    return value;
  }

  set = (value: TValue) => {
    const oldPropertyValue = this.propertyValue;
    if (oldPropertyValue === value) return;
    ReactiveEvent.emit('BeforeSet', this);

    if (isObject(value) || Array.isArray(value)) {
      if (Array.isArray(value)) {
        Reactive.transform(value, this);

        if (!isNull(this.propertyValue)) {
          if (Array.isArray(this.propertyValue))
            this.propertyValue.splice(0, this.propertyValue.length);
          [].push.apply(this.propertyValue, (value as any));
        } else {
          this.propertyValue = value;
        }
      } else if (isObject(value)) {
        if (isNode(value)) // If some html element
          this.propertyValue = value;
        else {
          Reactive.transform(value);
          if (!isNull(this.propertyValue))
            mapper(this.propertyValue as any, value as any);
          else
            this.propertyValue = value;
        }
      }
    } else {
      this.propertyValue = value;
    }

    ReactiveEvent.emit('AfterSet', this);
    // Calling all the watches
    forEach(this.watches, watch => watch.callback(this.propertyValue, oldPropertyValue));
  }

  watch(callback: CallbackWatch, node?: Node): Watch<TValue, TObject> {
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
      const reference: any = {}; // Using clousure to cache the array methods
      const prototype = inputArray.__proto__ = Object.create(Array.prototype);

      forEach(REACTIVE_ARRAY_METHODS, method => {
        // cache original method
        reference[method] = inputArray[method].bind(inputArray);
        // changing to the reactive one
        prototype[method] = function reactive() {
          const oldArrayValue = inputArray.slice();
          ReactiveEvent.emit('BeforeArrayChanges', reactiveObj!, method, { arrayNew: oldArrayValue, arrayOld: oldArrayValue });
          const result = reference[method].apply(inputArray, arguments);
          ReactiveEvent.emit('AfterArrayChanges', reactiveObj!, method, { arrayNew: oldArrayValue, arrayOld: oldArrayValue });
          return result;
        }
      });

      return inputArray;
    }

    if (!isObject(inputObject))
      return inputObject;

    forEach(Object.keys(inputObject), key => {
      const inputObjectAsAny = inputObject as any;

      // Already a reactive property, do nothing
      if (isNull(getDescriptor(inputObject, key)!.value))
        return;

      const reactive = new Reactive({
        propertyName: key,
        sourceObject: inputObject
      });

      defineProperty(inputObject, key, reactive);

      const propertyValue = inputObjectAsAny[key];

      if (isObject(propertyValue))
        this.transform(propertyValue);
      else if (Array.isArray(propertyValue)) {
        this.transform(propertyValue, reactive); // Transform the array to a reactive one
        forEach(propertyValue, (item: object) => this.transform(item));
      }
    });

    return inputObject;
  }
}
