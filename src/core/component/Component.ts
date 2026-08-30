import IAsset from '../../definitions/interfaces/IAsset';
import IComponentOptions from '../../definitions/interfaces/IComponentOptions';
import IEventSubscription from '../../definitions/interfaces/IEventSubscription';
import ILifeCycleHooks from '../../definitions/interfaces/ILifeCycleHooks';
import Constructor from '../../definitions/types/Constructor';
import DataType from '../../definitions/types/DataType';
import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';
import Extend from '../../shared/helpers/Extend';
import IoC from '../../shared/helpers/IoCContainer';
import Prop from '../../shared/helpers/Prop';
import UriHandler from '../../shared/helpers/UriHandler';
import {
    $default,
    $internal,
    createEl,
    filter,
    ifNullReturn,
    isFunction,
    isNull,
    isObject,
    setData,
    toLower,
    trim
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import EventHandler from '../event/EventHandler';
import { $reactive, InertVariable } from '../reactive/Reactive';
import ComponentHandler from './ComponentHandler';

export default class ComponentPrototype<Data extends {} = {}> implements IComponentOptions<Data> {
  readonly name: string;
  readonly path: string;
  readonly template?: string;
  readonly keepAlive?: boolean;
  readonly prefetch?: boolean;
  readonly title?: string;
  readonly route?: string;

  readonly isDefault?: boolean;
  readonly isNotFound?: boolean;

  data: DataType<Data, this> & dynamic;

  /** Indicates if the component is destroyed or not */
  isDestroyed: boolean = false;

  /** The Component Class */
  ctor: Constructor<any>;

  /** The root element of the component */
  el?: Element;

  /** Bouer instance of the component */
  bouer?: Bouer;

  /** The parent component */
  parent?: ComponentPrototype;

  /** The children of the component */
  readonly children?: (Constructor<Component> | IComponentOptions | ComponentPrototype)[] = [];

  /** All the assets attached to the component */
  readonly assets: (HTMLScriptElement | HTMLStyleElement | HTMLLinkElement)[] = [];

  readonly restrictions?: (
    (this: Bouer, component: ComponentPrototype | IComponentOptions) => boolean | Promise<boolean>
  )[];

  /** Store temporarily this component UI orders */
  private events: IEventSubscription[] = [];

  /** The function that will be called when the component is created */
  init?(): void;

  /**
   * Default constructor
   * @param {string|object} optionsOrPath the path of the component or the compponent options
   */
  constructor(optionsOrPath?: string | IComponentOptions<Data>, assets?: (IAsset | string)[]) {
    $internal(this);
    this.ctor = $default();

    let _name: string | undefined = undefined;
    let _path: string | undefined = undefined;
    let _data: DataType<{}, ComponentPrototype> | undefined = undefined;

    if (isObject(optionsOrPath)) {
      _name = (optionsOrPath as ComponentPrototype<Data>).name;
      _path = (optionsOrPath as ComponentPrototype<Data>).path;
      _data = (optionsOrPath as ComponentPrototype<Data>).data;
      Object.assign(this, optionsOrPath);
    } else {
      _path = optionsOrPath as string;
    }

    this.name = _name || '';
    this.path = _path || '';
    this.data = $reactive({
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

    this.setAssets(assets || []);
  }

  setAssets(
    assets: (string | IAsset)[]
  ) {
    const component = this;

    const $Assets: any[] = [];
    const assetsTypeMapper: dynamic = {
      js: 'script', css: 'link', scss: 'link',
      sass: 'link', less: 'link', styl: 'link',
      style: 'link'
    };

    const isValidAssetSrc = (src: string, index: number) => {
      const isValid = (src || trim(src)) ? true : false;
      if (!isValid) Logger.error('Invalid asset “src”, in assets[' + index + '].src');
      return isValid;
    };

    const assetTypeGetter = (src: string, index: number) => {
      const srcSplitted = src.split('.');
      const type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];

      if (!type) return Logger.error('Couldn\'t find out what type of asset it is, provide ' +
        'the “type” explicitly at assets[' + index + '].type');

      return type;
    };

    filter(assets, (asset, index) => {
      let src = '';
      let type = '';
      let scoped = true;

      if (typeof asset === 'string') { // String type
        if (!isValidAssetSrc(asset, index)) return;
        type = assetTypeGetter(trim(src = asset.replace(/\.less|\.s[ac]ss|\.styl/i, '.css')), index);
      } else { // Object Type
        if (!isValidAssetSrc(trim(src = asset.src.replace(/\.less|\.s[ac]ss\.styl/i, '.css')), index)) return;

        if (!asset.type) {
          if (!(type = assetTypeGetter(src, index))) return;
        } else {
          type = assetsTypeMapper[toLower(asset.type)] || asset.type;
        }

        scoped = ifNullReturn(asset.scoped, true);
      }

      const isRelativePathImport = src[0] === '.';

      if (isRelativePathImport && (!component.path || isNull(component.path))) {
        Logger.warn('Component with no `path` cannot use imported assets, check component: ' + component.path);
        return;
      }

      if (isRelativePathImport) {
        const pathSections = component.path.split('/').slice(0, -1);
        if (pathSections[0] === '') pathSections.shift();
        src = pathSections.join('/') + src.substring(1, src.length);
      }

      const $Asset = createEl(type, el => {
        if (ifNullReturn(scoped, true))
          el.setAttribute('scoped', 'true');

        switch (toLower(type)) {
          case 'script': el.setAttribute('src', src); break;
          case 'link':
            el.setAttribute('href', src);
            el.setAttribute('rel', 'stylesheet');
            el.setAttribute('type', 'text/css');
            break;
          default: el.setAttribute('src', src); break;
        }
      }).build();

      $Assets.push($Asset);
    });

    component.assets.splice(0, component.assets.length);
    component.assets.push.apply(component.assets, $Assets);
  }

  /**
   * The data that should be exported from the `<script>` tag to the root element
   * @param {object} data the data to export
   */
  export(data: dynamic, props?: string[]) {
    if (!isObject(data))
      return Logger.error('Invalid object for component.export(...), only "Object Literal" is allowed.');

    return filter(props || Object.keys(data), key => {
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
    filter(this.events, evt => this.off((evt.eventName as any), evt.callback));
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
    this.events = filter(this.events, evt => !(evt.eventName == eventName && evt.callback == callback));
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
    filter(Object.keys(inputData), key => Prop.transfer(this, inputData, key as keyof InputData));
    return result;
  }

  prepareClass(
    component: Component<any>
  ) {
    const proto: ComponentPrototype = this;
    const hooks = [
      'requested', 'created', 'beforeMount', 'mounted', 'beforeLoad',
      'loaded', 'beforeDestroy', 'destroyed', 'blocked', 'failed'
    ];
    const ignorables: string[] = ['__$proto__', 'init', 'constructor'].concat(hooks);

    const cachedInert: dynamic = {};
    const properties = Object.getOwnPropertyNames(component);
    const methods = Object.getOwnPropertyNames(component.constructor.prototype);

    const fields = filter(Extend.array(properties, methods), key => ignorables.indexOf(key) < 0);

    // Transfering the properties from the component to the data
    filter(fields as any, (field: never) => {
      const fieldValue: any = component[field];

      // If the value is a function, bind it to the component ifself
      if (typeof fieldValue === 'function') {
        Prop.set(fieldValue, 'nobind', { value: true });
        return proto.data[field] = fieldValue.bind(component);
      }

      //In case of InertVariable, cache the object and return the value
      if (fieldValue instanceof InertVariable) {
        cachedInert[field] = fieldValue;
        return Prop.set(proto.data, field, {
          get: function reactive() {
            return cachedInert[field].get();
          },
          set: function reactive(value: any) {
            cachedInert[field].set(value);
          }
        });
      }

      proto.data[field] = fieldValue;
    });

    // Transforming the data to reactive
    $reactive({ context: proto, data: proto.data });

    // Pointing the properties of the component to the actual data props
    filter(fields as any, (field: never) => {
      Prop.set(component, field, {
        get: function reactive() { return proto.data[field]; },
        set: function reactive(value) { proto.data[field] = value; }
      });
    });

    // Setting all the methods
    filter(hooks as any, (hook: never) => {
      if (isFunction(proto[hook])) {
        proto[hook] = component[hook];
      }
    });
  }
}

export class Component<Data extends object = {}> {
  readonly __$proto__: ComponentPrototype<Data>;

  constructor(
    init?: string | IComponentOptions<Data>,
    assets?: (IAsset | string)[]
  ) {
    this.__$proto__ = $default();

    Prop.set(this, '__$proto__', {
      enumerable: false,  configurable: false,
      value: new ComponentPrototype<Data>(init, assets)
    });

    const component = this.__$proto__;

    if (component.name == '') {
      // Setting the name of the component, according to the caller (Component) name if not configured
      Prop.set(component, 'name', { value: this.constructor.name });
    }
  }

  destroy() {
    this.__$proto__.destroy();
  }

  params() {
    return this.__$proto__.params();
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
};