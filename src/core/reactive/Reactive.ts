import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import WatchCallback from '../../definitions/types/WatchCallback';
import IoC from '../../shared/helpers/IoCContainer';
import Property from '../../shared/helpers/Property';
import {
    $default,
    $internal,
    fnCallResolver,
    filter,
    isNull,
    isObject,
    mapper,
    toArray
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Watch from '../binder/Watch';
import Computed from './Computed';
import ReactiveEvent from './ReactiveEvent';

export default class ReactivePropertyDescriptor<Value, Obj> implements PropertyDescriptor {
  $name: string;
  $value: Value;
  $valueOld?: Value;
  source: Obj;
  base: PropertyDescriptor | undefined;
  watches: Watch<Value, Obj>[] = [];
  context: RenderContext;
  computed?: Computed<Value, typeof this.context>;

  /**
   * Default constructor
   * @param {object} options the options of the reactive instance
   */
  constructor(options: {
    /** the property name */
    propName: string,
    /** the object containing the property to be tranformed */
    srcObject: Obj,
    /** function execution context */
    context: RenderContext
  }) {
    $internal(this);
    this.$name = options.propName;
    this.source = options.srcObject;
    this.context = options.context;
    // Setting the value of the property

    this.base = Property.descriptor(this.source as dynamic, this.$name);
    this.$value = this.base!.value as Value;

    const propValue = this.$value as any;
    const isFn = typeof propValue === 'function';

    // If the value is a function, we bind it to the context
    if (isFn) this.$value = propValue.bind(this.context);

    const isComputed = isFn && propValue.name === '$computed' ||
      propValue instanceof Computed;

    if (isComputed) {
      this.computed = isObject(propValue)
          // If the value is an object, we assume it's a computed object
          ? propValue as Computed<Value, RenderContext>
          // If the value is a function, we assume it's a computed function
          : new Computed(propValue);

      // Adding the context
      const init = '_' in this.computed ? this.computed._ as Function : $default;

      init({
        context: this.context,
        propName: this.$name,
        propSource: this.source as dynamic
      });

      this.$valueOld = this.$value;
      this.$value = undefined as any;

      // Intercepting $value
      Property.set(this as any, '$value', {
        get: () => {
          return fnCallResolver(this.computed!.get());
        },
        set: (v) => {
          if (!this.computed!.set) return;
          fnCallResolver(this.computed!.set(v));
        },
      });
    }
  }

  get = (function get (this: ReactivePropertyDescriptor<Value, Obj>) {
    ReactiveEvent.emit('BeforeGet', this);
    const value = this.$value;
    ReactiveEvent.emit('AfterGet', this);
    return value;
  }).bind(this);

  set = (function set (this: ReactivePropertyDescriptor<Value, Obj>, value: Value) {
    if (this.$value === value || (Number.isNaN(this.$value) && Number.isNaN(value))) return;

    this.$valueOld = this.$value;
    ReactiveEvent.emit('BeforeSet', this);

    if (isObject(value) || Array.isArray(value)) {
      // Checking the type
      if (this.$value != null && (typeof this.$value) !== (typeof value))
        return Logger.error(('Cannot set “' + (typeof value) + '” in “' +
          this.$name + '” property.'));

      // Checking if the value is null
      if (isNull(this.$value))
        return;

      // Transform if it is not an html element
      if (this.$value instanceof Node)
        this.$value = value;
      else
        ReactivePropertyDescriptor.transform({
          data: value,
          descriptor: this,
          context: this.context
        });

      if (Array.isArray(value))
        this.$value = value;

      mapper(value as dynamic, this.$value as dynamic);
    } else {
      this.$value = value;
    }

    ReactiveEvent.emit('AfterSet', this);
    this.notify();
  }).bind(this);

  /**
   * Force onChange callback calling
   */
  notify() {
    const isObj = isObject(this.$value);
    // Running all the watches
    filter(this.watches, w => {
      // Remapping the binding from the parents to the children properties
      const reactiveEvent = isObj ? ReactiveEvent.on('AfterGet', descriptor => {
        if (w.property === descriptor.$name) return;
        const parentWatch = w as any;

        // If it's already bound, ignore
        if (descriptor.watches.indexOf(parentWatch) != -1) return;

        // Assotiating the child property with the parent watch
        descriptor.watches.push(w as any);
      }) : { off: () => { } };

      w.callback.call(this.context, this.$value, this.$valueOld);
      reactiveEvent.off();
    });
  }

  /**
   * Subscribe an event that should be performed on property value change
   * @param {Function} callback the callback function that will be called
   * @param {Node?} node the node that should be attached (Optional)
   * @returns A watch instance object
   */
  onChange(callback: WatchCallback<Value>, node?: Node): Watch<Value, Obj> {
    const w = new Watch(this, callback, { node: node });
    this.watches.push(w);
    return w;
  }

  /**
   * Tranform a Object Litertal to a an Object with reactive properties
   * @param {object} options the options for object transformation
   * @returns the object transformed
   */
  static transform = <InputObject>(options: {
    /** The context where this reactive property belongs */
    context: RenderContext,
    /** The data having the property that needs to be transformed to a reactive one */
    data: InputObject,
    /** Reactive descriptor that needs to be provided in case of Array Object */
    descriptor?: ReactivePropertyDescriptor<any, any>,
    /** All the keys that needs to be transformed */
    keys?: string[]
  }) => {
    const context = options.context;
    let tranformedData = new WeakSet();

    const executer = (
      data: InputObject | InputObject[],
      descriptor?: ReactivePropertyDescriptor<any, any>,
      keys?: string[],
    ) => {

      if (Array.isArray(data)) {
        if (descriptor == null) {
          Logger.warn('Cannot transform this array to a reactive one because no reactive object was provided');
          return data;
        }

        // Checking if the array has already been transformed
        if (tranformedData.has(data as any))
          return data;
        tranformedData.add(data as any);

        const REACTIVE_ARRAY_METHODS = ['push', 'pop', 'unshift', 'shift', 'splice'];
        const inputArray = data as any;
        const reference: dynamic = {}; // Using clousure to cache the array methods
        Object.setPrototypeOf(inputArray, Object.create(Array.prototype));
        const prototype = Object.getPrototypeOf(inputArray);

        filter(REACTIVE_ARRAY_METHODS, method => {

          // cache original method
          reference[method] = inputArray[method].bind(inputArray);
          // changing to the reactive one
          prototype[method] = function reactive() {
            const oldArrayValue = inputArray.slice();
            const args = [].slice.call(arguments);
            switch (method) {
              case 'push': case 'unshift':
                filter(toArray(args), (arg: any) => {
                  if (!isObject(arg) && !Array.isArray(arg)) return;
                  executer(arg);
                });
            }

            const result = reference[method].apply(inputArray, args);

            filter(descriptor.watches, watch => watch.callback.call(context, inputArray, oldArrayValue, {
              method: method,
              args: args
            }));
            return result;
          };

        });

        return inputArray;
      }

      if (!isObject(data))
        return data;

      // Checking if the array has already been transformed
      if (tranformedData.has(data as any))
        return data;
      tranformedData.add(data as any);

      filter(keys || Object.keys(data as dynamic), key => {
        const mInputObject = data as dynamic;

        // Already a reactive property, do nothing
        if (!('value' in Property.descriptor(data as dynamic, key)!))
          return;

        const propValue = mInputObject[key];

        if ((propValue instanceof Object && 'ͼ' in propValue) || propValue instanceof Node)
          return;

        // If the value is a function, belonging to a component do nothing
        if (typeof propValue === 'function' && 'nobind' in propValue)
          return;

        const descriptor = new ReactivePropertyDescriptor({
          propName: key,
          srcObject: data,
          context: context
        });

        Property.set(data as dynamic, key, descriptor);

        // If the value is a computed object, do nothing
        if (isObject(propValue) && propValue instanceof Computed)
          return;

        if (Array.isArray(propValue)) {
          executer(propValue as any, descriptor); // Transform the array to a reactive one
          filter(propValue, (item: object) => executer(item as any));
        } else if (isObject(propValue))
          executer(propValue);
      });

      return data;
    };

    executer(options.data, options.descriptor, options.keys);
    tranformedData = new WeakSet();
    return options.data as any;
  };
}

export class InertProp<T> {
  private value?: T
  constructor(value?: T) {
    $internal(this);
    this.value = value;
  }
  get() { return this.value; }
  set(value: T) { this.value = value; }
}

export function $reactive<Data extends dynamic>(options: {
    /** The context where this reactive property belongs */
    context?: RenderContext,
    /** Reactive descriptor that needs to be provided in case of Array Object */
    descriptor?: ReactivePropertyDescriptor<any, any>,
    /** The data having the property that needs to be transformed to a reactive one */
    data: Data,
    /** All the keys that needs to be transformed */
    keys?: string[]
  }) {
  // If no context is provided, create one
  if (options.context == null)
    options.context = IoC.global;

  return ReactivePropertyDescriptor.transform({
    context: options.context!,
    data: options.data,
    descriptor: options.descriptor,
    keys: options.keys
  });
}

export function $inert<T>(entry?: T | undefined): T {
  // Tricking the typescript compiler
  return new InertProp<T>(entry) as T;
}