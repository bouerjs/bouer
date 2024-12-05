import IAsset from '../../definitions/interfaces/IAsset';
import IComponentOptions from '../../definitions/interfaces/IComponentOptions';
import IEventSubscription from '../../definitions/interfaces/IEventSubscription';
import ILifeCycleHooks from '../../definitions/interfaces/ILifeCycleHooks';
import Constructor from '../../definitions/types/Constructor';
import DataType from '../../definitions/types/DataType';
import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';
import IoC from '../../shared/helpers/IoCContainer';
import Prop from '../../shared/helpers/Prop';
import UriHandler from '../../shared/helpers/UriHandler';
import {
  forEach,
  isObject,
  setData,
  where
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import EventHandler from '../event/EventHandler';
import Reactive from '../reactive/Reactive';
import ComponentHandler from './ComponentHandler';

export default class Component<Data extends {} = {}> implements IComponentOptions {
  readonly _IRT_ = true;

  readonly name: string;
  readonly path: string;
  readonly data: DataType<Data, this> & dynamic;
  readonly template?: string;
  readonly keepAlive?: boolean;
  readonly prefetch?: boolean;
  readonly title?: string;
  readonly route?: string;

  readonly isDefault?: boolean;
  readonly isNotFound?: boolean;

  /** Indicates if the component is destroyed or not */
  isDestroyed: boolean = false;

  /** The Component Class */
  clazz: Constructor<any> | undefined;

  /** The root element of the component */
  el?: Element;

  /** Bouer instance of the component */
  bouer?: Bouer;

  readonly children?: (Component | IComponentOptions | Constructor<Component>)[] = [];

  /** All the assets attached to the component */
  readonly assets: (HTMLScriptElement | HTMLStyleElement | HTMLLinkElement)[] = [];

  readonly restrictions?: (
    (this: Bouer, component: Component | IComponentOptions) => boolean | Promise<boolean>
  )[];

  /** Store temporarily this component UI orders */
  private events: IEventSubscription[] = [];

  /**
   * Default constructor
   * @param {string|object} optionsOrPath the path of the component or the compponent options
   */
  constructor(optionsOrPath?: string | IComponentOptions, assets?: (IAsset | string)[]) {
    let _name: string | undefined = undefined;
    let _path: string | undefined = undefined;
    let _data: DataType<{}, Component> | undefined = undefined;

    if (isObject(optionsOrPath)) {
      _name = (optionsOrPath as Component).name;
      _path = (optionsOrPath as Component).path;
      _data = (optionsOrPath as Component).data;
      Object.assign(this, optionsOrPath);
    } else {
      _path = optionsOrPath as string;
    }

    this.name = _name || '';
    this.path = _path || '';
    this.data = Reactive.transform({
      context: this,
      data: _data || {}
    });

    // Store the content to avoid showing it unnecessary
    const template = {
      value: (optionsOrPath || {} as any).template || ''
    };

    Prop.set(this, 'template', {
      get: () => template.value,
      set: (v) => template.value = v
    });

    ComponentHandler.prepareAssets(this, assets || []);
  }

  /**
   * The data that should be exported from the `<script>` tag to the root element
   * @param {object} data the data to export
   */
  export(data: dynamic) {
    if (!isObject(data))
      return Logger.log('Invalid object for component.export(...), only "Object Literal" is allowed.');

    return forEach(Object.keys(data), key => {
      (this.data as any)[key] = (data as any)[key];
      Prop.transfer(this.data, data, key as any);
    });
  }

  /**
   * Destroys the component
   */
  destroy() {
    if (!this.el) return false;

    if (this.isDestroyed && this.bouer && this.bouer.isDestroyed)
      return;

    if (!this.keepAlive)
      this.isDestroyed = true;

    const handler = IoC.app(this.bouer!).resolve(ComponentHandler)!;

    handler.emit(this, 'beforeDestroy');

    const container = this.el.parentElement;
    if (container) container.removeChild(this.el);

    handler.emit(this, 'destroyed');

    // Destroying all the events attached to the this instance
    forEach(this.events, evt => this.off((evt.eventName as any), evt.callback));
    this.events = [];

    const components = handler.activeComponents;

    components.splice(components.indexOf(this), 1);
  }

  /**
   * Maps the parameters of the route in the component `route` and returns as an object
   */
  params() {
    return new UriHandler().params(this.route);
  }

  /**
   * Add an Event listener to the component
   * @param {string} eventName the event to be added
   * @param {Function} callback the callback function of the event
   */
  on<TKey extends keyof ILifeCycleHooks>(
    eventName: TKey,
    callback: (this: this, event: CustomEvent) => void
  ) {
    const instanceHooksSet = new Set([
      'created', 'beforeMount', 'mounted', 'beforeLoad', 'loaded', 'beforeDestroy', 'destroyed'
    ]);
    const registerHooksSet = new Set([
      'requested', 'blocked', 'failed'
    ]);

    if (registerHooksSet.has(eventName))
      Logger.warn('The “' + eventName + '” Event is called before the component is mounted, to be dispatched' +
        'it needs to be on registration object: { ' + eventName + ': function(){ ... }, ... }.');

    const evt = IoC.app(this.bouer!).resolve(EventHandler)!.on({
      eventName,
      callback: callback as any,
      attachedNode: this.el!,
      context: this,
      modifiers: { once: instanceHooksSet.has(eventName), autodestroy: false },
    });
    this.events.push(evt);
    return evt;
  }

  /**
   * Removes an Event listener to the component
   * @param {string} eventName the event to be added
   * @param {Function} callback the callback function of the event
   */
  off<TKey extends keyof ILifeCycleHooks>(
    eventName: TKey, callback: (this: this, event: CustomEvent) => void
  ) {
    IoC.app(this.bouer!).resolve(EventHandler)!.off({
      eventName,
      callback: callback as any,
      attachedNode: this.el!,
    });
    this.events = where(this.events, evt => !(evt.eventName == eventName && evt.callback == callback));
  }

  /**
   * Sets data into a target object, by default is the `component.data`
   * @param {object} inputData the data the should be setted
   * @param {object?} targetObject the target were the inputData
   * @returns the object with the data setted
   */
  set<InputData extends {}, TargetObject extends {} = Data>(
    inputData: InputData,
    targetObject?: TargetObject
  ): InputData & TargetObject {
    const result = setData(this, inputData, targetObject);
    forEach(Object.keys(inputData), key => Prop.transfer(this, inputData, key as keyof InputData));
    return result;
  }

  init?(): void;

  requested?(event: CustomEvent): void;
  created?(event: CustomEvent): void;
  beforeMount?(event: CustomEvent): void;
  mounted?(event: CustomEvent): void;
  beforeLoad?(event: CustomEvent): void;
  loaded?(event: CustomEvent): void;
  beforeDestroy?(event: CustomEvent): void;
  destroyed?(event: CustomEvent): void;
  blocked?(event: CustomEvent): void;
  failed?(event: CustomEvent): void;
}