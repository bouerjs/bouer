import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import WatchCallback from '../../definitions/types/WatchCallback';
import Prop from '../../shared/helpers/Prop';
import {
  fnCall,
  forEach,
  isFunction,
  isNull,
  isObject,
  mapper,
  toArray
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Base from '../Base';
import Watch from '../binder/Watch';
import ReactiveEvent from '../event/ReactiveEvent';

export default class Reactive<Value, TObject> extends Base implements PropertyDescriptor {
  propName: string;
  propValue: Value;
  propValueOld?: Value;
  propSource: TObject;
  baseDescriptor: PropertyDescriptor | undefined;
  watches: Watch<Value, TObject>[] = [];
  isComputed: boolean;
  context: RenderContext;
  fnComputed?: Function;

  /**
   * Default constructor
   * @param {object} options the options of the reactive instance
   */
  constructor(options: {
    /** the property name */
    propName: string,
    /** the object containing the property to be tranformed */
    srcObject: TObject,
    /** function execution context */
    context: RenderContext
  }) {
    super();

    this.propName = options.propName;
    this.propSource = options.srcObject;
    this.context = options.context;
    // Setting the value of the property

    this.baseDescriptor = Prop.descriptor(this.propSource as dynamic, this.propName);

    this.propValue = this.baseDescriptor!.value as Value;
    this.isComputed = typeof this.propValue === 'function' && this.propValue.name === '$computed';

    if (this.isComputed) {
      this.fnComputed = this.propValue as any;
      (this.propValue as any) = undefined;
    }

    if (typeof this.propValue === 'function' && !this.isComputed)
      this.propValue = this.propValue.bind(this.context);
  }

  private readonly computed = () => {
    if (!this.isComputed)
      return { get: () => { }, set: (v: any) => { } };

    const computedResult = this.fnComputed!.call(this.context);

    if (isNull(computedResult))
      throw new Error('Invalid value used as return in “function $computed(){...}”.');

    const isNotInferred = isObject(computedResult) || isFunction(computedResult);

    return {
      get: (isNotInferred && 'get' in computedResult) ? computedResult.get : (() => computedResult),
      set: (isNotInferred && 'set' in computedResult) ? computedResult.set : undefined
    };
  };

  get = () => {
    const computedGet = this.computed().get;

    ReactiveEvent.emit('BeforeGet', this);
    this.propValue = this.isComputed ?
      fnCall(computedGet.call(this.context)) : this.propValue;
    const value = this.propValue;
    ReactiveEvent.emit('AfterGet', this);
    return value;
  };

  set = (value: Value) => {
    if (this.propValue === value || (Number.isNaN(this.propValue) && Number.isNaN(value)))
      return;

    const computedSet = this.computed().set;

    if (this.isComputed && computedSet)
      fnCall(computedSet.call(this.context, value));
    else if (this.isComputed && isNull(computedSet))
      return;

    this.propValueOld = this.propValue;

    ReactiveEvent.emit('BeforeSet', this);

    if (isObject(value) || Array.isArray(value)) {
      if ((typeof this.propValue) !== (typeof value))
        return Logger.error(('Cannot set “' + (typeof value) + '” in “' +
          this.propName + '” property.'));

      if (Array.isArray(value)) {
        Reactive.transform({
          data: value,
          descriptor: this,
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
            data: value as dynamic,
            context: this.context
          });
          if (!isNull(this.propValue))
            mapper(value as dynamic, this.propValue as dynamic);
          else
            this.propValue = value;
        }
      }
    } else {
      this.propValue = value;
    }

    ReactiveEvent.emit('AfterSet', this);
    this.notify();
  };

  /**
   * Force onChange callback calling
   */
  notify() {
    // Running all the watches
    forEach(this.watches, watch => watch.callback.call(this.context, this.propValue, this.propValueOld));
  }

  /**
   * Subscribe an event that should be performed on property value change
   * @param {Function} callback the callback function that will be called
   * @param {Node?} node the node that should be attached (Optional)
   * @returns A watch instance object
   */
  onChange(callback: WatchCallback, node?: Node): Watch<Value, TObject> {
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
  }) => {
    const context = options.context;
    const executer = (
      data: InputObject | InputObject[],
      visiting: any[], visited: any[],
      descriptor?: Reactive<any, any>
    ) => {
      if (Array.isArray(data)) {
        if (descriptor == null) {
          Logger.warn('Cannot transform this array to a reactive one because no reactive object was provided');
          return data;
        }

        if (visiting.indexOf(data) !== -1)
          return data;
        visiting.push(data);

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
                  executer(arg, visiting, visited);
                });
            }

            const result = reference[method].apply(inputArray, args);

            forEach(descriptor.watches, watch => watch.callback(inputArray, oldArrayValue, {
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

      if (visiting!.indexOf(data) !== -1)
        return data;
      visiting.push(data);

      forEach(Object.keys(data as dynamic), key => {
        const mInputObject = data as dynamic;

        // Already a reactive property, do nothing
        if (!('value' in Prop.descriptor(data as dynamic, key)!))
          return;

        const propertyValue = mInputObject[key];

        if ((propertyValue instanceof Object) && ((propertyValue._IRT_) || (propertyValue instanceof Node)))
          return;

        const reactive = new Reactive({
          propName: key,
          srcObject: data,
          context: context
        });

        Prop.set(data as dynamic, key, reactive);
        if (Array.isArray(propertyValue)) {
          executer(propertyValue as any, visiting, visited, reactive); // Transform the array to a reactive one
          forEach(propertyValue, (item: object) => executer(item as any, visiting, visited));
        } else if (isObject(propertyValue))
          executer(propertyValue, visiting, visited);
      });

      visiting.splice(visiting.indexOf(data), 1);
      visited.push(data);

      return data;
    };

    return executer(options.data, [], [], options.descriptor);
  };
}