import IAsset from '../../definitions/interfaces/IAsset';
import IComponentOptions from '../../definitions/interfaces/IComponentOptions';
import IEventSubscription from '../../definitions/interfaces/IEventSubscription';
import ILifeCycleHooks from '../../definitions/interfaces/ILifeCycleHooks';
import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';
import Prop from '../../shared/helpers/Prop';
import IoC from '../../shared/helpers/IoCContainer';
import UriHandler from '../../shared/helpers/UriHandler';
import {
  $CreateAnyEl,
  forEach,
  ifNullReturn,
  isObject,
  isString,
  toLower,
  trim,
  urlCombine,
  urlResolver, where
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import EventHandler from '../event/EventHandler';
import Reactive from '../reactive/Reactive';
import ComponentHandler from './ComponentHandler';

export default class Component<Data = {}> implements IComponentOptions<Data> {
  readonly _IRT_ = true;

  name: string;
  path: string;
  data: Data;
  template?: string;
  keepAlive?: boolean;
  prefetch?: boolean;
  title?: string;
  route?: string;

  readonly isDefault?: boolean;
  readonly isNotFound?: boolean;

  /** Indicates if the component is destroyed or not */
  isDestroyed: boolean = false;

  /** The Component Class */
  clazz: (new (...args: any[]) => Component<Data>) | undefined;

  /** The root element of the component */
  el?: Element;

  /** Bouer instance of the component */
  bouer?: Bouer;

  readonly children?: (Component | IComponentOptions | (new (...args: any[]) => Component))[] = [];
  /** All the assets attached to the component */
  readonly assets: (HTMLScriptElement | HTMLStyleElement | HTMLLinkElement)[] = [];

  readonly restrictions?: ((component: Component | IComponentOptions) => boolean | Promise<boolean>)[];

  /** Store temporarily this component UI orders */
  private events: IEventSubscription[] = [];

  /**
   * Default constructor
   * @param {string|object} optionsOrPath the path of the component or the compponent options
   */
  constructor(optionsOrPath: string | IComponentOptions<Data>) {
    let _name: string | undefined = undefined;
    let _path: string | undefined = undefined;
    let _data: Data | undefined = undefined;

    if (!isString(optionsOrPath)) {
      _name = (optionsOrPath as IComponentOptions<Data>).name;
      _path = (optionsOrPath as IComponentOptions<Data>).path;
      _data = (optionsOrPath as IComponentOptions<Data>).data;
      Object.assign(this, optionsOrPath);
    } else {
      _path = optionsOrPath as string;
    }

    this.name = _name || '';
    this.path = _path || '';
    this.data = Reactive.transform({
      context: this as any,
      data: _data || {}
    });

    // Store the content to avoid showing it unnecessary
    const template = {
      value: (optionsOrPath as IComponentOptions).template
    };

    Prop.set(this, 'template', {
      get: () => template.value,
      set: (v) => template.value = v
    });
  }

  /**
   * The data that should be exported from the `<script>` tag to the root element
   * @param {object} data the data to export
   */
  export<ExportableData extends {}>(
    data: ExportableData
  ) {
    if (!isObject(data))
      return Logger.log('Invalid object for component.export(...), only "Object Literal" is allowed.');

    return forEach(Object.keys(data), key => {
      (this.data as any)[key] = (data as any)[key];
      Prop.transfer(this.data as dynamic, data, key as any);
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

    this.emit('beforeDestroy');

    const container = this.el.parentElement;
    if (container) container.removeChild(this.el);

    this.emit('destroyed');

    // Destroying all the events attached to the this instance
    forEach(this.events, evt => this.off((evt.eventName as any), evt.callback));
    this.events = [];

    const components = IoC.app(this.bouer!).resolve(ComponentHandler)!
      .activeComponents;

    components.splice(components.indexOf(this as Component<{}>), 1);
  }

  /**
   * Maps the parameters of the route in the component `route` and returns as an object
   */
  params() {
    return new UriHandler().params(this.route);
  }

  /**
   * Dispatch an event
   * @param {string} eventName the event name
   * @param {object?} init the CustomEventInit object where we can provid the event detail
   */
  emit<TKey extends keyof ILifeCycleHooks>(
    eventName: TKey,
    init?: CustomEventInit
  ) {
    IoC.app(this.bouer!).resolve(EventHandler)!.emit({
      eventName: eventName,
      attachedNode: this.el!,
      init: init
    });
  }

  /**
   * Add an Event listener to the component
   * @param {string} eventName the event to be added
   * @param {Function} callback the callback function of the event
   */
  on<TKey extends keyof ILifeCycleHooks>(
    eventName: TKey,
    callback: (event: CustomEvent) => void
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
      context: this as any,
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
    eventName: TKey, callback: (event: CustomEvent) => void
  ) {
    IoC.app(this.bouer!).resolve(EventHandler)!.off({
      eventName,
      callback: callback as any,
      attachedNode: this.el!
    });
    this.events = where(this.events, evt => !(evt.eventName == eventName && evt.callback == callback));
  }

  /**
   * Adds assets to the component
   * @param {string|object} assets the list of assets to be included
   */
  addAssets(assets: (IAsset | string)[]) {
    const $Assets: any[] = [];
    const assetsTypeMapper: dynamic = {
      js: 'script',
      css: 'link',
      scss: 'link',
      sass: 'link',
      less: 'link',
      styl: 'link',
      style: 'link',
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

    forEach(assets, (asset, index) => {
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

      if ((src[0] !== '.')) { // The src begins with dot (.)
        const resolver = urlResolver(src);
        const hasBaseURIInURL = resolver.baseURI === src.substring(0, resolver.baseURI.length);
        // Building the URL according to the main path
        src = urlCombine(hasBaseURIInURL ? resolver.origin : resolver.baseURI, resolver.pathname);
      }

      const $Asset = $CreateAnyEl(type, el => {
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

    this.assets.push.apply(this.assets, $Assets);
  }
}