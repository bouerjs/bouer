import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import WatchCallback from '../../definitions/types/WatchCallback';
import Prop from '../../shared/helpers/Prop';
import {
  fnCallResolver,
  forEach,
  isNull,
  isObject,
  mapper,
  toArray
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Watch from '../binder/Watch';
import ReactiveEvent from '../event/ReactiveEvent';
import Computed from './Computed';

export default class Reactive<Value, Obj> implements PropertyDescriptor {
  readonly _IRT_ = true;
  propName: string;
  propValue: Value;
  propValueOld?: Value;
  propSource: Obj;
  baseDescriptor: PropertyDescriptor | undefined;
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

    this.propName = options.propName;
    this.propSource = options.srcObject;
    this.context = options.context;
    // Setting the value of the property

    this.baseDescriptor = Prop.descriptor(this.propSource as dynamic, this.propName);

    this.propValue = this.baseDescriptor!.value as Value;

    const propValue = this.propValue as any;
    const isFn = typeof propValue === 'function';

    // If the value is a function, we bind it to the context
    if (isFn) this.propValue = propValue.bind(this.context);

    const isComputed = isFn && propValue.name === '$computed' ||
      propValue instanceof Computed;

    if (isComputed) {
      this.computed = isObject(propValue)
          // If the value is an object, we assume it's a computed object
          ? propValue as Computed<Value, RenderContext>
          // If the value is a function, we assume it's a computed function
          : new Computed(propValue);

      // Adding the context
      this.computed.__({
        context: this.context,
        propName: this.propName,
        propSource: this.propSource as dynamic
      });

      this.propValueOld = this.propValue;
      this.propValue = undefined as any;

      // PropValue interceptor
      Prop.set(this as any, 'propValue', {
        get: () => {
          return fnCallResolver(this.computed!.get());
        },
        set: (v) => {
          if (isNull(this.computed!.set)) return;
          fnCallResolver(this.computed!.set(v));
        },
      });
    }
  }

  get = (function get (this: Reactive<Value, Obj>) {
    ReactiveEvent.emit('BeforeGet', this);
    const value = this.propValue;
    ReactiveEvent.emit('AfterGet', this);
    return value;
  }).bind(this);

  set = (function set (this: Reactive<Value, Obj>, value: Value) {
    if (this.propValue === value || (Number.isNaN(this.propValue) && Number.isNaN(value))) return;

    this.propValueOld = this.propValue;
    ReactiveEvent.emit('BeforeSet', this);

    if (isObject(value) || Array.isArray(value)) {
      // Checking the type
      if ((typeof this.propValue) !== (typeof value))
        return Logger.error(('Cannot set “' + (typeof value) + '” in “' +
          this.propName + '” property.'));

      // Checking if the value is null
      if (isNull(this.propValue))
        return;

      // Transform if it is not an html element
      if (this.propValue instanceof Node)
        this.propValue = value;
      else
        Reactive.transform({
          data: value,
          descriptor: this,
          context: this.context
        });

      if (Array.isArray(value))
        this.propValue = value;

      mapper(value as dynamic, this.propValue as dynamic);
    } else {
      this.propValue = value;
    }

    ReactiveEvent.emit('AfterSet', this);
    this.notify();
  }).bind(this);

  /**
   * Force onChange callback calling
   */
  notify() {
    const isObj = isObject(this.propValue);
    // Running all the watches
    forEach(this.watches, w => {
      // Remapping the binding from the parents to the children properties
      const reactiveEvent = isObj ? ReactiveEvent.on('AfterGet', descriptor => {
        if (w.property === descriptor.propName) return;
        const parentWatch = w as any;

        // If it's already bound, ignore
        if (descriptor.watches.indexOf(parentWatch) != -1) return;

        // Assotiating the child property with the parent watch
        descriptor.watches.push(w as any);
      }) : { off: () => { } };

      w.callback.call(this.context, this.propValue, this.propValueOld);
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
    descriptor?: Reactive<any, any>,
    /** All the keys that needs to be transformed */
    keys?: string[]
  }) => {
    const context = options.context;
    let tranformedData = new WeakSet();

    const executer = (
      data: InputObject | InputObject[],
      descriptor?: Reactive<any, any>,
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
                  executer(arg);
                });
            }

            const result = reference[method].apply(inputArray, args);

            forEach(descriptor.watches, watch => watch.callback.call(context, inputArray, oldArrayValue, {
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


      forEach(keys || Object.keys(data as dynamic), key => {
        const mInputObject = data as dynamic;

        // Already a reactive property, do nothing
        if (!('value' in Prop.descriptor(data as dynamic, key)!))
          return;

        const propValue = mInputObject[key];

        if ((propValue instanceof Object) && ((propValue._IRT_) || (propValue instanceof Node)))
          return;

        const descriptor = new Reactive({
          propName: key,
          srcObject: data,
          context: context
        });

        Prop.set(data as dynamic, key, descriptor);

        // If the value is a computed object, do nothing
        if (isObject(propValue) && propValue instanceof Computed)
          return;

        if (Array.isArray(propValue)) {
          executer(propValue as any, descriptor); // Transform the array to a reactive one
          forEach(propValue, (item: object) => executer(item as any));
        } else if (isObject(propValue))
          executer(propValue);
      });

      return data;
    };

    const data = executer(options.data, options.descriptor, options.keys);
    tranformedData = new WeakSet();
    return data;
  };
}