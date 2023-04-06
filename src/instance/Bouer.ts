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
import IoC from '../shared/helpers/IoCContainer';
import Task from '../shared/helpers/Task';
import Logger from '../shared/logger/Logger';
import Prop from '../shared/helpers/Prop';
import ReactiveEvent from '../core/event/ReactiveEvent';
import {
  $CreateEl, DOM, forEach,
  WIN,
  ifNullReturn,
  isNull, isObject, toArray, trim, ifNullStop, isFunction,
} from '../shared/helpers/Utils';
import SkeletonOptions from '../definitions/types/SkeletonOptions';
import ViewChild from '../core/ViewChild';

export default class Bouer<Data = {}, GlobalData = {}, Dependencies = {}> implements
  IBouerOptions<Data, GlobalData, Dependencies> {
  /** The name of the instance */
  readonly _IRT_ = true;
  readonly name = 'Bouer';
  readonly version = '3.1.0';
  readonly data: Data;
  readonly globalData: GlobalData;
  readonly config: IBouerConfig;
  readonly deps: Dependencies;

  /** Unique Id of the instance */
  readonly __id__: number = IoC.newId();

  /** App options provided in the instance */
  readonly options: IBouerOptions<Data, GlobalData, Dependencies>;

  /**
   * Gets all the elemens having the `ref` attribute
   * @returns an object having all the elements with the `ref attribute value` defined as the key.
   */
  readonly refs: dynamic<Element> = {};

  /** The main element controlled by the instance */
  el: Element | undefined | null;

  /** Provides the status of the app */
  isDestroyed: boolean = false;

  /** Provides state of the app, if it is already initialized */
  isInitialized: boolean = false;

  /** Data Exposition and Injection handler*/
  readonly $data: {
    /**
     * Gets the exposed `data` or the value provided for `data` directive
     * @param {string} key the data:[`key`]="..." directive key value or the app.$data.set(`key`) key provided.
     * @returns the expected object | null
     */
    get<Data>(key: string): Data | undefined,
    /**
     * Sets a value into a storage the used anywhere of the application.
     * @param {string} key the key of the data to be stored.
     * @param {object} data the data to be stored.
     * @param {boolean?} toReactive allow to transform the data to a reactive one after being setted.
     * By default is `false`.
     */
    set<Data>(key: string, data: Data | Data[], toReactive?: boolean): void,
    /**
     * Destroy the stored data
     * @param {string} key the data:[`key`]="..." directive value or the app.$data.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean,
  };

  /** (e-req) Requests handler */
  readonly $req: {
    /**
     * Gets the `e-req` directive response value
     * @param {string} key the e-req:[`key`]="..." directive key value.
     * @returns the expected object | null
     */
    get<Response>(key: string): { data: Response, [key: string]: any } | null,
    /**
     * Destroy stored req (request)
     * @param {string} key the e-req:[`key`]="..." directive key value.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean,
  };

  /** Data Waits Handler */
  readonly $wait: {
    /**
     * Gets the elements and data of the `wait-data` directive.
     * @param {string} key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns the expected object | null
     */
    get<WaitData>(key: string): WaitData | undefined,
    /**
     * Provides data for `wait-data` directive elements.
     * @param {string} key the key of `wait-data` directive value.
     * @param {object} data the data provide to the elements waiting
     */
    set<WaitData>(key: string, data: WaitData): void,
    /**
     * Destroy stored wait
     * @param {string} key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean,
  };

  /** Delimiters handler */
  readonly $delimiters: {
    /**
     * Adds a delimiter into the instance
     * @param {object} item delimiter object
     */
    add(item: IDelimiter): void
    /**
     * Removes a delimiter from the instance
     * @param {string} name the delimiter name
     */
    remove(name: string): void;
    /**
     * Retrieve all the delimiters
     */
    get(): IDelimiter[];
  };

  /** Skeleton handler */
  readonly $skeleton: {
    /**
     * Removes skeletons havining the `id` provided
     * @param {string?} id the skeleton identifier
     */
    clear(id?: string): void,
    /**
     * Set Color of the Wave and/or the Background
     * @param {object?} color the color config object for the skeleton
     */
    set(color?: SkeletonOptions): void
  };

  /** Components Handler */
  readonly $components: {
    /**
     * Adds a component to the instance
     * @param {object} component the component to be added
     */
    add<Data extends {} = {}>(
      component: Component<Data> | IComponentOptions<Data> | (new (...args: any[]) => Component<Data>)
    ): void;
    /**
     * Gets a component from the instance
     * @param {string} name the name of the component to get
     */
    get(name: string): Component | IComponentOptions,
    /**
     * Retrieves the actives components matching the a provided expression
     * @param {string} expression the expression that matches the wanted components
     */
    viewBy<Child extends Component>(expression: (component: Component) => boolean): Child[],
    /**
     * Retrieves the actives components matching the component name
     * @param {string} componentName the name of the wanted components
     */
    viewByName<Child extends Component>(componentName: string): Child[],
    /**
     * Retrieves the active component matching the component element or the root element id
     * @param {string} componentId the component element id of the wanted component (in case of just one insertion)
     */
    viewById<Child extends Component>(componentId: string): Child | null,
  };

  /** Routing Handler */
  readonly $routing: {
    /** Store the route elements */
    routeView: Element | null;

    /** Store the Component defined has NotFound Page */
    defaultPage?: Component | IComponentOptions;

    /** Store the Component defined has NotFound Page */
    notFoundPage?: Component | IComponentOptions;

    /**
     * Navigates to a certain page without reloading all the page
     * @param {string} route the route to navigate to
     * @param {object?} options navigation options
     */
    navigate(route: string, options?: {
      /** allow to change the url after the navigation, default value is `true` */
      setURL?: boolean,
      /** the data object that should be injected to the page to be loaded, default value is the main data */
      data?: object
    }): void;

    /**
     * Navigates to previous page according to the number of times
     * @param {number?} times number to pages to go back
     */
    popState(times?: number): void;

    /**
     * Changes the current url to a new one provided
     * @param {string} url the url to change
     * @param {string?} title the of the new url
     */
    pushState(url: string, title?: string): void;

    /**
     * Mark an anchor as active
     * @param {HTMLAnchorElement} anchor the anchor to mark
     */
    markActiveAnchor(anchor: HTMLAnchorElement): void

    /**
     * Mark all anchors having the route provided as active
     * @param {string} route the that need to marked
     */
    markActiveAnchorsWithRoute(route: string): void
  };

  /**
   * Default constructor
   * @param {string} selector the selector of the element to be controlled by the instance
   * @param {object?} options the options to the instance
   */
  constructor(
    selector: string,
    options?: IBouerOptions<Data, GlobalData, Dependencies>
  ) {
    const app = this as Bouer;

    this.options = options = (options || {});
    this.config = options.config || {};
    this.deps = options.deps || {} as any;

    forEach(Object.keys(this.deps as {}), key => {
      const deps = this.deps as any;
      const value = deps[key];
      deps[key] = typeof value === 'function' ? value.bind(this) : value;
    });

    const delimiters = options.delimiters || [];

    // Adding Dependency Injection Services
    IoC.app(this).add(DataStore, {}, true);
    IoC.app(this).add(Evaluator, {}, true);
    IoC.app(this).add(Middleware, {}, true);
    IoC.app(this).add(Binder, {}, true);
    IoC.app(this).add(EventHandler, {}, true);
    IoC.app(this).add(ComponentHandler, {}, true);
    IoC.app(this).add(Skeleton, {}, true);
    IoC.app(this).add(Routing, {}, true);

    IoC.app(this).add(DelimiterHandler, { delimiters }, true);
    IoC.app(this).add(Compiler, { directives: options.directives }, true);

    const dataStore = IoC.app(this).resolve(DataStore)!;
    const middleware = IoC.app(this).resolve(Middleware)!;
    const componentHandler = IoC.app(this).resolve(ComponentHandler)!;
    const compiler = IoC.app(this).resolve(Compiler)!;
    const skeleton = IoC.app(this).resolve(Skeleton)!;
    const delimiter = IoC.app(this).resolve(DelimiterHandler)!;

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

    delimiters.push.apply(delimiters, [
      { name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
      { name: 'common', delimiter: { open: '{{', close: '}}' } },
    ]);


    this.$routing = IoC.app(this).resolve(Routing)!;

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
            data: data as dynamic
          });
        return IoC.app(this).resolve(DataStore)!.set('data', key, data as dynamic);
      },
      unset: key => delete dataStore.data[key]
    };

    this.$req = {
      get: key => key ? dataStore.req[key] : undefined,
      unset: key => delete dataStore.req[key],
    };

    this.$wait = {
      get: <WaitData>(key: string) => {
        if (!key) return undefined;

        const waitedData = dataStore.wait[key];
        if (!waitedData) return undefined;

        if (ifNullReturn(waitedData.once, true))
          this.$wait.unset(key);

        return waitedData.data as WaitData;
      },
      set: <WaitData>(key: string, data: WaitData, once?: boolean) => {
        if (!(key in dataStore.wait))
          return dataStore.wait[key] = {
            data: data as dynamic,
            nodes: [],
            once: ifNullReturn(once, false),
            context: app
          };

        const mWait = dataStore.wait[key];

        mWait.data = data as dynamic;
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
      get: name => componentHandler.components[name],
      viewBy: (expression: (component: Component) => boolean) => ViewChild.by(this as Bouer, expression),
      viewByName: (componentName: string) => ViewChild.byName(this as Bouer, componentName),
      viewById: (componentId: string) => ViewChild.byId(this as Bouer, componentId),
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
   * @param {object?} options the options to the instance
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
   * @param {string} input the input element
   * @param {object?} options the options of the compilation
   * @param {Function?} onSet a function that should be fired when a value is setted
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
   * @param {string} selector the selector of the element to be controlled by the instance
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
    const binder = IoC.app(this).resolve(Binder)!;
    const eventHandler = IoC.app(this).resolve(EventHandler)!;
    const routing = IoC.app(this).resolve(Routing)!;
    const skeleton = IoC.app(this).resolve(Skeleton)!;
    const compiler = IoC.app(this).resolve(Compiler)!;

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
    skeleton.init((options.config || {}).skeleton);
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
   * @param {object} inputData the data the should be setted
   * @param {object?} targetObject the target were the inputData
   * @returns the object with the data setted
   */
  set<InputData extends {}, TargetObject = Data>(
    inputData: InputData,
    targetObject?: TargetObject | Data
  ) {
    if (isNull(targetObject))
      targetObject = this.data;

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
        Prop.descriptor(inputData, key as keyof InputData)!.get!();
      });

      ReactiveEvent.once('AfterGet', evt => {
        evt.onemit = reactive => destination = reactive;
        const desc = Prop.descriptor(targetObject as {}, key as never);
        if (desc && isFunction(desc.get)) desc.get!();
      });

      Prop.transfer(targetObject as {}, inputData, key as never);

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
   * @param {string} input the input element
   * @param {object?} options the options of the compilation
   * @param {Function?} onSet a function that should be fired when a value is setted
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
   * @param {string} propertyName the property to watch
   * @param {Function} callback the function that should be called when the property change
   * @param {object} targetObject the target object having the property to watch
   * @returns the watch object having the method to destroy the watch
   */
  watch<Key extends keyof TargetObject, TargetObject = Data>(
    propertyName: Key,
    callback: (valueNew: TargetObject[Key], valueOld: TargetObject[Key]) => void,
    targetObject: TargetObject | Data = this.data
  ) {
    return IoC.app(this).resolve(Binder)!
      .onPropertyChange<TargetObject[Key], TargetObject | Data>(
        propertyName, callback as WatchCallback, targetObject || this.data
      );
  }

  /**
   * Watch all reactive properties in the provided scope.
   * @param {Function} watchableScope the function that should be called when the any reactive property change
   * @returns an object having all the watches and the method to destroy watches at once
   */
  react(watchableScope: (app: Bouer) => void) {
    return IoC.app(this).resolve(Binder)!
      .onPropertyInScopeChange(watchableScope);
  }

  /**
   * Add an Event Listener to the instance or to an object
   * @param {string} eventName the event name to be listening
   * @param {Function} callback the callback that should be fired
   * @param {Node} attachedNode A node to attach the event
   * @param {object} modifiers An object having all the event modifier
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
    return IoC.app(this).resolve(EventHandler)!.
      on({
        eventName,
        callback,
        attachedNode: (options || {}).attachedNode,
        modifiers: (options || {}).modifiers,
        context: this as Bouer
      });
  }

  /**
   * Removes an Event Listener from the instance or from object
   * @param {string} eventName the event name to be listening
   * @param {Function} callback the callback that should be fired
   * @param {Node} attachedNode A node to attach the event
   */
  off(
    eventName: string,
    callback?: (event: CustomEvent | Event) => void,
    attachedNode?: Node
  ) {
    return IoC.app(this).resolve(EventHandler)!.
      off({
        eventName,
        callback,
        attachedNode
      });
  }

  /**
   * Removes the bind from an element
   * @param {Node} boundNode the node having the bind
   * @param {string} boundAttrName the bound attribute name
   * @param {string} boundPropName the bound property name
   */
  unbind(boundNode: Node, boundAttrName?: string, boundPropName?: string) {
    return IoC.app(this).resolve(Binder)!.
      remove(boundNode, boundPropName, boundAttrName);
  }

  /**
   * Dispatch an event
   * @param {string} eventName the event name
   * @param {object} options options for the emission
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
    return IoC.app(this).resolve(EventHandler)!.emit({
      eventName: eventName,
      attachedNode: mOptions.element,
      init: mOptions.init,
      once: mOptions.once
    });
  }

  /**
   * Limits sequential execution to a single one acording to the milliseconds provided
   * @param {Function} callback the callback that should be performed the execution
   * @param {number} wait milliseconds to the be waited before the single execution
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
   * @param {string} options the options of the compilation process
   * @returns the element compiled
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
    return IoC.app(this).resolve(Compiler)!.
      compile({
        el: options.el,
        data: options.data,
        context: options.context,
        onDone: options.onDone
      });
  }

  /**
   * Destroys the application
   */
  destroy() {
    const el = this.el!;
    const $Events = IoC.app(this).resolve(EventHandler)!.$events;
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
    IoC.app(this).clear();
  }
}