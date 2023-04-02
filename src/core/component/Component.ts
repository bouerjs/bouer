import IAsset from '../../definitions/interfaces/IAsset';
import IComponentOptions from '../../definitions/interfaces/IComponentOptions';
import IEventSubscription from '../../definitions/interfaces/IEventSubscription';
import ILifeCycleHooks from '../../definitions/interfaces/ILifeCycleHooks';
import ComponentClass from '../../definitions/types/ComponentClass';
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
import Base from '../Base';
import EventHandler from '../event/EventHandler';
import Reactive from '../reactive/Reactive';
import ComponentHandler from './ComponentHandler';

export default class Component<Data = {}> extends Base implements IComponentOptions<Data> {
  name: string;
  path: string;
  data: Data;
  template?: string;
  keepAlive?: boolean;
  prefetch?: boolean;
  title?: string;
  route?: string;
  isDefault?: boolean;
  isNotFound?: boolean;
  isDestroyed: boolean = false;

  clazz: ComponentClass | undefined;

  el?: Element;
  bouer?: Bouer;
  readonly children?: (Component | IComponentOptions | ComponentClass)[] = [];
  readonly assets: (HTMLScriptElement | HTMLStyleElement | HTMLLinkElement)[] = [];
  readonly restrictions?: ((component: Component | IComponentOptions) => boolean | Promise<boolean>)[];
  // Store temporarily this component UI orders
  private events: IEventSubscription[] = [];

  constructor(optionsOrPath: string | IComponentOptions<Data>) {
    super();

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

  params() {
    return new UriHandler().params(this.route);
  }

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