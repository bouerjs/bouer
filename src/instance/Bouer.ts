import Binder from '../core/binder/Binder';
import Compiler from '../core/compiler/Compiler';
import Converter from '../core/compiler/Converter';
import Component from '../core/component/Component';
import ComponentHandler from '../core/component/ComponentHandler';
import DelimiterHandler from '../core/DelimiterHandler';
import Evaluator from '../core/Evaluator';
import EventHandler from '../core/event/EventHandler';
import Middleware from '../core/middleware/Middleware';
import Reactive from '../core/reactive/Reactive';
import Routing from '../core/routing/Routing';
import Skeleton from '../core/Skeleton';
import DataStore from '../core/store/DataStore';
import IBouerOptions from '../definitions/interfaces/IBouerOptions';
import IBouerConfig from '../definitions/interfaces/IBouerConfig';
import IComponentOptions from '../definitions/interfaces/IComponentOptions';
import IDelimiter from '../definitions/interfaces/IDelimiter';
import dynamic from '../definitions/types/Dynamic';
import RenderContext from '../definitions/types/RenderContext';
import WatchCallback from '../definitions/types/WatchCallback';
import Constants from '../shared/helpers/Constants';
import ServiceProvider from '../shared/helpers/ServiceProvider';
import Task from '../shared/helpers/Task';
import Logger from '../shared/logger/Logger';
import Base from '../core/Base';
import Prop from '../shared/helpers/Prop';
import ReactiveEvent from '../core/event/ReactiveEvent';
import {
  $CreateEl, DOM, forEach,
  WIN,
  ifNullReturn,
  isNull, isObject, toArray, trim, ifNullStop,
} from '../shared/helpers/Utils';

export default class Bouer<Data = {}, GlobalData = {}, Dependencies = {}>
  extends Base implements IBouerOptions<Data, GlobalData, Dependencies> {
  readonly name = 'Bouer';
  readonly version = '3.0.0';
  readonly data: Data;
  readonly globalData: GlobalData;
  readonly config: IBouerConfig;
  readonly deps: Dependencies;
  readonly __id__: number = ServiceProvider.genId();
  readonly options: IBouerOptions<Data, GlobalData, Dependencies>;
  /**
   * Gets all the elemens having the `ref` attribute
   * @returns an object having all the elements with the `ref attribute value` defined as the key.
   */
  readonly refs: dynamic<Element> = {};
  el: Element | undefined | null;
  isDestroyed: boolean = false;
  isInitialized: boolean = false;

  /** Data Exposition and Injection handler*/
  readonly $data: {
    /**
     * Gets the exposed `data` or the value provided for `data` directive
     * @param key the data:[`key`]="..." directive key value or the app.$data.set(`key`) key provided.
     * @returns the expected object | null
     */
    get(key: string): object | undefined,
    /**
     * Sets a value into a storage the used anywhere of the application.
     * @param key the key of the data to be stored.
     * @param data the data to be stored.
     * @param toReactive allow to transform the data to a reactive one after being setted. By default is `false`.
     */
    set(key: string, data: object | any[], toReactive?: boolean): void,
    /**
     * Destroy the stored data
     * @param key the data:[`key`]="..." directive value or the app.$data.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean,
  };

  /** (e-req) Requests handler */
  readonly $req: {
    /**
     * Gets the `e-req` directive response value
     * @param key the e-req:[`key`]="..." directive key value.
     * @returns the expected object | null
     */
    get(key: string): { data: any, [key: string]: any } | null
    /**
     * Destroy stored req (request)
     * @param key the e-req:[`key`]="..." directive key value.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean,
  };

  /** Data Waits Handler */
  readonly $wait: {
    /**
     * Gets the elements and data of the `wait-data` directive.
     * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns the expected object | null
     */
    get(key: string): object | undefined,
    /**
     * Provides data for `wait-data` directive elements.
     * @param key the key of `wait-data` directive value.
     * @param data the data provide to the elements waiting
     */
    set(key: string, data: object): void,
    /**
     * Destroy stored wait
     * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean,
  };

  /** Delimiters handler */
  readonly $delimiters: {
    /** Adds a delimiter into the instance */
    add(item: IDelimiter): void
    /** Removes a delimiter from the instance */
    remove(name: string): void;
    /** Retrieve all the delimiters */
    get(): IDelimiter[];
  };

  /** Skeleton handler */
  readonly $skeleton: {
    /** Removes skeletons havining the `id` provided */
    clear(id?: string): void,
    /** Set Color of the Wave and/or the Background */
    set(color?: { wave?: string, background?: string }): void
  };

  /** Components Handler */
  readonly $components: {
    add<Data>(component: Component<Data> | IComponentOptions<Data>): void
    get<Data>(name: string): (Component<Data> | IComponentOptions<Data>)
  };

  /** Routing Handler */
  readonly $routing: {
    /** Store Bouer application instance */
    bouer: Bouer;

    /** Store the route elements */
    routeView: Element | null;

    /** Store the Component defined has NotFound Page */
    defaultPage?: Component<any> | IComponentOptions<any>;

    /** Store the Component defined has NotFound Page */
    notFoundPage?: Component<any> | IComponentOptions<any>;

    /** Store `href` value of the <base /> tag */
    base?: string | null;

    /** Navigates to a certain page without reloading all the page */
    navigate(route: string, options?: {
      setURL?: boolean,
      data?: object
    }): void;

    /** Navigates to previous page according to the number of times */
    popState(times?: number): void;

    /** Changes the current url to a new one provided */
    pushState(url: string, title?: string): void;

    /** Mark an anchor as active */
    markActiveAnchor(anchor: HTMLAnchorElement): void

    /** Mark all anchors having the route provided as active */
    markActiveAnchorsWithRoute(route: string): void
  };

  /**
   * Default constructor
   * @param selector the selector of the element to be controlled by the instance
   * @param options the options to the instance
   */
  constructor(
    selector: string,
    options?: IBouerOptions<Data, GlobalData, Dependencies>
  ) {
    super();

    const app = this as Bouer;
    this.options = options = (options || {});
    this.config = options.config || {};
    this.deps = options.deps || {} as any;

    forEach(Object.keys(this.deps as {}), key => {
      const deps = this.deps as any;
      const value = deps[key];
      deps[key] = typeof value === 'function' ? value.bind(this) : value;
    });

    new ServiceProvider(app);
    new Evaluator(app);

    const dataStore = new DataStore(app);
    const middleware = new Middleware(app);

    // Register the middleware
    if (typeof options.middleware === 'function')
      options.middleware.call(app, middleware.register, app);

    // Transform the data properties into a reative
    this.data = Reactive.transform({
      data: options.data || {},
      context: app
    });
    this.globalData = Reactive.transform({
      data: options.globalData || {},
      context: app
    });

    const delimiters = options.delimiters || [];
    delimiters.push.apply(delimiters, [
      { name: 'common', delimiter: { open: '{{', close: '}}' } },
      { name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
    ]);

    new Binder(app);
    new EventHandler(app);
    const delimiter = new DelimiterHandler(delimiters, app);
    const componentHandler = new ComponentHandler(app);
    const compiler = new Compiler(app, options.directives);
    const skeleton = new Skeleton(app);

    this.$routing = new Routing(app);

    this.$delimiters = {
      add: delimiter.add,
      remove: delimiter.remove,
      get: () => delimiter.delimiters.slice()
    };

    this.$data = {
      get: key => key ? dataStore.data[key] : null,
      set: (key, data, toReactive) => {
        if (key in dataStore.data)
          return Logger.log('There is already a data stored with this key “' + key + '”.');

        if (ifNullReturn(toReactive, false) === true)
          Reactive.transform({
            context: app,
            data: data
          });
        return new ServiceProvider(app).get<DataStore>('DataStore')!.set('data', key, data);
      },
      unset: key => delete dataStore.data[key]
    };

    this.$req = {
      get: key => key ? dataStore.req[key] : undefined,
      unset: key => delete dataStore.req[key],
    };

    this.$wait = {
      get: key => {
        if (key) return undefined;

        const waitedData = dataStore.wait[key];
        if (!waitedData) return undefined;

        if (ifNullReturn(waitedData.once, true))
          this.$wait.unset(key);

        return waitedData.data;
      },
      set: (key: string, data: object, once?: boolean) => {
        if (!(key in dataStore.wait))
          return dataStore.wait[key] = {
            data: data,
            nodes: [],
            once: ifNullReturn(once, false),
            context: app
          };

        const mWait = dataStore.wait[key];

        mWait.data = data;
        forEach(mWait.nodes, nodeWaiting => {
          if (!nodeWaiting) return;

          compiler.compile({
            el: nodeWaiting,
            context: mWait.context,
            data: Reactive.transform({
              context: mWait.context,
              data: mWait.data as object
            }),
          });
        });

        if (ifNullReturn(once, false))
          this.$wait.unset(key);
      },
      unset: key => delete dataStore.wait[key],
    };

    this.$skeleton = {
      clear: id => skeleton.clear(id),
      set: color => skeleton.init(color)
    };

    this.$components = {
      add: component => componentHandler.prepare([component]),
      get: name => componentHandler.components[name]
    };

    Prop.set(this, 'refs', {
      get: () => {
        const mRefs: dynamic<Element> = {};
        forEach(toArray(ifNullStop(this.el).querySelectorAll('[' + Constants.ref + ']')),
          (ref: any) => {
            const mRef = ref.attributes[Constants.ref] as Attr;
            const value = trim(mRef.value) || ref.name || '';

            if (value === '')
              return Logger.error('Expected an expression in “' + ref.name +
                '” or at least “name” attribute to combine with “' + ref.name + '”.');

            if (value in mRefs)
              return Logger.warn('The key “' + value + '” in “' + ref.name + '” is taken, choose another key.', ref);

            mRefs[value] = ref;
          });

        return mRefs;
      }
    });

    // Registering all the components
    componentHandler.prepare(options.components || []);

    if (!isNull(selector) && trim(selector) !== '')
      this.init(selector);
  }

  /**
   * Creates a factory instance of Bouer
   * @param options the options to the instance
   * @returns Bouer instance
   */
  static create<Data = {}, GlobalData = {}, Dependencies = {}>(
    options?: IBouerOptions<Data, GlobalData, Dependencies>
  ) {
    options = (options || {});
    (options.config as any) = (options.config || {});
    (options.config || {}).autoUnbind = false;
    (options.config || {}).autoOffEvent = false;
    (options.config || {}).autoComponentDestroy = false;
    return new Bouer('', options);
  }

  /**
   * Compiles a `HTML snippet` to an `Object Literal`
   * @param input the input element
   * @param options the options of the compilation
   * @param onSet a function that should be fired when a value is setted
   * @returns the Object Compiled from the HTML
   */
  static toJsObj(
    input: string | HTMLElement,
    options?: {
      /**
       * attributes that tells the compiler to lookup to the element, e.g: [name],[data-name].
       * * Note: The definition order matters.
       */
      names?: string,
      /**
       * attributes that tells the compiler where it going to get the value, e.g: [value],[data-value].
       * * Note: The definition order matters.
       */
      values?: string
    },
    onSet?: (builtObjectLayer: object, propName: string, value: any, element: Element) => void
  ) {
    return Converter.htmlToJsObj(input, options, onSet);
  }

  /**
   * Initialize create application
   * @param selector the selector of the element to be controlled by the instance
   */
  init(selector: string) {
    if (this.isInitialized)
      return this;

    if (isNull(selector) || trim(selector) === '')
      throw Logger.error(new Error('Invalid selector provided to the instance.'));

    const app = this as Bouer;
    const el = DOM.querySelector(selector);
    if (!(this.el = el)) throw Logger.error(new SyntaxError('Element with selector “' + selector + '” not found.'));

    const options = this.options || {};
    const binder = ServiceProvider.get<Binder>(app, 'Binder')!;
    const eventHandler = ServiceProvider.get<EventHandler>(app, 'EventHandler')!;
    const routing = ServiceProvider.get<Routing>(app, 'Routing')!;
    const skeleton = ServiceProvider.get<Skeleton>(app, 'Skeleton')!;
    const compiler = ServiceProvider.get<Compiler>(app, 'Compiler')!;

    forEach([options.beforeLoad, options.loaded, options.beforeDestroy, options.destroyed],
      evt => {
        if (typeof evt !== 'function') return;
        eventHandler.on({
          eventName: evt.name,
          callback: evt as any,
          attachedNode: el,
          modifiers: { once: true },
          context: app
        });
      });

    eventHandler.emit({ eventName: 'beforeLoad', attachedNode: el });

    // Enabling this configs for listeners
    (options.config || {}).autoUnbind = true;
    (options.config || {}).autoOffEvent = true;
    (options.config || {}).autoComponentDestroy = true;

    routing.init();
    skeleton.init();
    binder.cleanup();
    eventHandler.cleanup();
    this.isInitialized = true;

    // compile the app
    compiler.compile({
      el: this.el,
      data: this.data,
      context: app,
      onDone: () => eventHandler.emit({
        eventName: 'loaded',
        attachedNode: el
      })
    });

    WIN.addEventListener('beforeunload', () => {
      if (this.isDestroyed) return;

      eventHandler.emit({ eventName: 'beforeDestroy', attachedNode: el });
      this.destroy();
    }, { once: true });

    Task.run(stopTask => {
      if (this.isDestroyed) return stopTask();
      if (el.isConnected) return;

      eventHandler.emit({ eventName: 'beforeDestroy', attachedNode: el });
      this.destroy();
      stopTask();
    });

    if (!DOM.head.querySelector('link[rel~="icon"]')) {
      $CreateEl('link', (favicon) => {
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
      }).appendTo(DOM.head);
    }

    return this;
  }

  /**
   * Sets data into a target object, by default is the `app.data`
   * @param inputData the data the should be setted
   * @param targetObject the target were the inputData
   * @returns the object with the data setted
   */
  set<InputData extends {}, TargetObject = Data>(
    inputData: InputData,
    targetObject: TargetObject | Data = this.data
  ) {
    if (!isObject(inputData)) {
      Logger.error('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".');
      return targetObject;
    }

    if (isObject(targetObject) && targetObject == null) {
      Logger.error('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".');
      return inputData;
    }

    // Transforming the input
    Reactive.transform({
      data: inputData,
      context: this as Bouer
    });

    // Transfering the properties
    forEach(Object.keys(inputData), key => {
      let source: Reactive<any, any> | undefined;
      let destination: Reactive<any, any> | undefined;

      ReactiveEvent.once('AfterGet', evt => {
        evt.onemit = reactive => source = reactive;
        Prop.descriptor(inputData, key)!.get!();
      });

      ReactiveEvent.once('AfterGet', evt => {
        evt.onemit = reactive => destination = reactive;
        const desc = Prop.descriptor(targetObject as {}, key);
        if (desc) desc.get!();
      });

      Prop.transfer(targetObject as {}, inputData, key);

      if (!destination || !source) return;
      // Adding the previous watches to the property that is being set
      forEach(destination.watches, watch => {
        if (source!.watches.indexOf(watch) === -1)
          source!.watches.push(watch);
      });

      // Notifying the bounds and watches
      source.notify();
    });

    return targetObject;
  }

  /**
   * Compiles a `HTML snippet` to an `Object Literal`
   * @param input the input element
   * @param options the options of the compilation
   * @param onSet a function that should be fired when a value is setted
   * @returns the Object Compiled from the HTML
   */
  toJsObj(
    input: string | HTMLElement,
    options?: {
      /**
       * attributes that tells the compiler to lookup to the element, e.g: [name],[data-name].
       * * Note: The definition order matters.
       */
      names?: string,
      /**
       * attributes that tells the compiler where it going to get the value, e.g: [value],[data-value].
       * * Note: The definition order matters.
       */
      values?: string
    },
    onSet?: (builtObjectLayer: object, propName: string, value: any, element: Element) => void
  ) {
    return Converter.htmlToJsObj(input, options, onSet);
  }

  /**
   * Provides the possibility to watch a property change
   * @param propertyName the property to watch
   * @param callback the function that should be called when the property change
   * @param targetObject the target object having the property to watch
   * @returns the watch object having the method to destroy the watch
   */
  watch<Key extends keyof TargetObject, TargetObject = Data>(
    propertyName: Key,
    callback: (valueNew: TargetObject[Key], valueOld: TargetObject[Key]) => void,
    targetObject: TargetObject | Data = this.data
  ) {
    return new ServiceProvider(this).get<Binder>('Binder')!
      .onPropertyChange<TargetObject[Key], TargetObject | Data>(
        propertyName, callback as WatchCallback, targetObject || this.data
      );
  }

  /**
   * Watch all reactive properties in the provided scope.
   * @param watchableScope the function that should be called when the any reactive property change
   * @returns an object having all the watches and the method to destroy watches at once
   */
  react(watchableScope: (app: Bouer) => void) {
    return new ServiceProvider(this).get<Binder>('Binder')!
      .onPropertyInScopeChange(watchableScope);
  }

  /**
   * Add an Event Listener to the instance or to an object
   * @param eventName the event name to be listening
   * @param callback the callback that should be fired
   * @param attachedNode A node to attach the event
   * @param modifiers An object having all the event modifier
   * @returns The event added
   */
  on(
    eventName: string,
    callback: (event: CustomEvent | Event) => void,
    options?: {
      attachedNode?: Node,
      modifiers?: {
        autodestroy?: boolean;
        capture?: boolean;
        once?: boolean;
        passive?: boolean;
        signal?: AbortSignal;
      }
    }
  ) {
    return new ServiceProvider(this).get<EventHandler>('EventHandler')!.
      on({
        eventName,
        callback,
        attachedNode: (options || {}).attachedNode,
        modifiers: (options || {}).modifiers,
        context: this
      });
  }

  /**
   * Removes an Event Listener from the instance or from object
   * @param eventName the event name to be listening
   * @param callback the callback that should be fired
   * @param attachedNode A node to attach the event
   */
  off(
    eventName: string,
    callback?: (event: CustomEvent | Event) => void,
    attachedNode?: Node
  ) {
    return new ServiceProvider(this).get<EventHandler>('EventHandler')!.
      off({
        eventName,
        callback,
        attachedNode
      });
  }

  /**
   * Removes the bind from an element
   * @param boundNode the node having the bind
   * @param boundAttrName the bound attribute name
   * @param boundPropName the bound property name
   */
  unbind(boundNode: Node, boundAttrName?: string, boundPropName?: string) {
    return new ServiceProvider(this).get<Binder>('Binder')!.
      remove(boundNode, boundPropName, boundAttrName);
  }

  /**
   * Dispatch an event
   * @param options options for the emission
   */
  emit(
    eventName: string,
    options?: {
      element?: Node,
      init?: CustomEventInit,
      once?: boolean
    }
  ) {
    const mOptions = (options || {});
    return new ServiceProvider(this as Bouer)
      .get<EventHandler>('EventHandler')!.emit({
        eventName: eventName,
        attachedNode: mOptions.element,
        init: mOptions.init,
        once: mOptions.once
      });
  }

  /**
   * Limits sequential execution to a single one acording to the milliseconds provided
   * @param callback the callback that should be performed the execution
   * @param wait milliseconds to the be waited before the single execution
   * @returns executable function
   */
  lazy(callback: (...args: any[]) => void, wait?: number) {
    const _this = this;
    let timeout: any; wait = isNull(wait) ? 500 : wait;
    const immediate = arguments[2];

    return function executable() {
      const args: any = [].slice.call(arguments);
      const callNow = immediate && !timeout;
      const later = () => {
        timeout = null;
        if (!immediate) callback.apply(_this, args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) callback.apply(_this, args);
    };
  }

  /**
   * Compiles an html element
   * @param options the options of the compilation process
   */
  compile<Data>(options: {
    /** The element that wil be compiled */
    el: Element,
    /** The context of this compilation process */
    context: RenderContext,
    /** The data that should be injected in the compilation */
    data?: Data,
    /** The function that should be fired when the compilation is done */
    onDone?: (element: Element, data?: Data | undefined) => void
  }) {
    return new ServiceProvider(this).get<Compiler>('Compiler')!.
      compile({
        el: options.el,
        data: options.data,
        context: options.context,
        onDone: options.onDone
      });
  }

  destroy() {
    const el = this.el!;
    const serviceProvider = new ServiceProvider(this as Bouer);
    const $Events = serviceProvider.get<EventHandler>('EventHandler')!.$events;
    const destroyedEvents = ($Events['destroyed'] || []).concat(($Events['component:destroyed'] || []));

    this.emit('destroyed', { element: this.el! });
    // Dispatching all the destroy events
    forEach(destroyedEvents, es => es.emit({ once: true }));
    $Events['destroyed'] = [];
    $Events['component:destroyed'] = [];

    if (el.tagName == 'BODY')
      el.innerHTML = '';
    else if (DOM.contains(el))
      el.parentElement!.removeChild(el);

    this.isDestroyed = true;
    this.isInitialized = false;
    serviceProvider.clear();
  }
}