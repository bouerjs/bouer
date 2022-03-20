import MiddlewareResult from '../src/core/middleware/MiddlewareResult';
import IAsset from '../src/definitions/interfaces/IAsset';
import IBinderConfig from '../src/definitions/interfaces/IBinderConfig';
import IBouerConfig from '../src/definitions/interfaces/IBouerConfig';
import IBouerOptions from '../src/definitions/interfaces/IBouerOptions';
import IComponentOptions from '../src/definitions/interfaces/IComponentOptions';
import IDelimiter from '../src/definitions/interfaces/IDelimiter';
import IDelimiterResponse from '../src/definitions/interfaces/IDelimiterResponse';
import IEventModifiers from '../src/definitions/interfaces/IEventModifiers';
import IEventSubscription from '../src/definitions/interfaces/IEventSubscription';
import ILifeCycleHooks from '../src/definitions/interfaces/ILifeCycleHooks';
import IMiddleware from '../src/definitions/interfaces/IMiddleware';
import CustomDirective from '../src/definitions/types/CustomDirective';
import dynamic from '../src/definitions/types/Dynamic';
import RenderContext from '../src/definitions/types/RenderContext';
import WatchCallback from '../src/definitions/types/WatchCallback';
import Extend from '../src/shared/helpers/Extend';


declare class Component<Data = {}> {
  /** The name of the component */
  name: string;

  /** The path of the component (not required on e-entry directive) */
  path: string;

  /** The default data that should be injected in the component */
  data: Data;

  /** The component html template [hard code component] */
  template?: string;

  /** Allow the component the keep the last state */
  keepAlive?: boolean;

  /**
   * Allow to prefetch the component content when the application is ready.
   * Note: it overrides the global prefetch value
   */
  prefetch?: boolean;

  /** The title that should be replaced when the page is loaded */
  title?: string;

  /** The navigation url */
  route?: string;

  /** Allow to set this component as the `default page` when the application loads */
  readonly isDefault?: boolean;

  /** Allow to set this component as the `not found page` when no route was found */
  readonly isNotFound?: boolean;

  /** Indicates if the component is destroyed or not */
  readonly isDestroyed: boolean;

  /** The root element of the component */
  readonly el?: Element;

  /** Bouer instance of the component */
  readonly bouer?: Bouer;

  /** The children of the component that should inherit the `route` of the father */
  readonly children?: (Component | IComponentOptions<Data>)[];

  /** restrictions functions of the component */
  readonly restrictions?: ((
    component: Component | IComponentOptions<Data>
  ) => boolean | Promise<boolean>)[];

  /**
   * The data the should be exported from the `<script>` tag
   * @param data the data to export
   */
  export<ExportableData>(data: ExportableData): void;

  /**
   * Destroys the component
   */
  destroy(): void;

  /**
   * Maps the parameters of the route in the component `route` and returns as an object
   */
  params(): dynamic<string>;

  /**
   * Add an Event listener to the component
   * @param eventName the event to be added
   * @param callback the callback function of the event
   */
  on<TKey extends keyof ILifeCycleHooks>(
    eventName: TKey,
    callback: (event: CustomEvent) => void
  ): IEventSubscription;

  /**
   * Removes an Event listener to the component
   * @param eventName the event to be added
   * @param callback the callback function of the event
   */
  off<TKey extends keyof ILifeCycleHooks>(
    eventName: TKey,
    callback: (event: CustomEvent) => void
  ): void;

  /**
   * Allow to add assets to the component
   * @param assets the list of assets to be included
   */
  addAssets(assets: (string | IAsset)[]): void;

  /**
   * Default constructor
   * @param optionsOrPath the path of the component or the compponent options
   */
  constructor(optionsOrPath: string | IComponentOptions<Data>);
}

declare class Reactive<Value, TObject> {
  propertyName: string;
  propertyValue: Value;
  propertySource: TObject;
  propertyDescriptor: PropertyDescriptor | undefined;
  watches: Array<Watch<Value, TObject>>;
  isComputed: boolean;
  context: RenderContext;

  computedGetter?: () => any;
  computedSetter?: (value: Value) => void;

  get(): Value;
  set(value: Value): void;

  onChange(callback: WatchCallback, node?: Node): Watch<Value, TObject>;
}

declare class Watch<Value, TObject> {
  readonly property: string;
  readonly node: Node | undefined;
  readonly reactive: Reactive<Value, TObject>;
  readonly callback: WatchCallback;
  readonly onDestroy?: () => void | undefined;

  /**
   * Destroys instance of watch
   */
  destroy(): void;
}

declare class Bouer<Data = {}, GlobalData = {}, Dependencies = {}> {
  /** Application Id */
  readonly __id__: number;

  /** The main application element */
  readonly el: Element;

  /** Instance namse */
  readonly name: string;

  /** Bouer version */
  readonly version: string;

  /** The data of the instance */
  readonly data: Data;

  /** The data of the whole instance */
  readonly globalData: GlobalData;

  /** The configuration of the instance */
  readonly config?: IBouerConfig;

  /** The dependencies of the instance */
  readonly deps: Dependencies;

  /**
   * Gets all the elemens having the `ref` attribute
   * @returns an object having all the elements with the `ref attribute value` defined as the key.
   */
  readonly refs: dynamic<Element>;
  /** Bouer options */
  readonly options: IBouerOptions<Data, GlobalData, Dependencies>;

  /** Indicates if the application is destroyed or not */
  isDestroyed: boolean;

  /** Data Exposition and Injection handler*/
  readonly $data: {
    /**
     * Gets the exposed `data` or the value provided for `data` directive
     * @param key the data:[`key`]="..." directive key value or the app.$data.set(`key`) key provided.
     * @returns the expected object | null
     */
    get(key: string): object | undefined;
    /**
     * Sets a value into a storage the used anywhere of the application.
     * @param key the key of the data to be stored.
     * @param data the data to be stored.
     * @param toReactive allow to transform the data to a reactive one after being setted. By default is `false`.
     */
    set(key: string, data: object | any[], toReactive?: boolean): void;
    /**
     * Destroy the stored data
     * @param key the data:[`key`]="..." directive value or the app.$data.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean;
  };

  /** (e-req) Requests handler */
  readonly $req: {
    /**
     * Gets the `e-req` directive response value
     * @param key the e-req:[`key`]="..." directive key value.
     * @returns the expected object | null
     */
    get(key: string): { data: any;[key: string]: any } | null;
    /**
     * Destroy stored req (request)
     * @param key the e-req:[`key`]="..." directive key value.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean;
  };

  /** Data Waits Handler */
  readonly $wait: {
    /**
     * Gets the elements and data of the `wait-data` directive.
     * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns the expected object | null
     */
    get(key: string): object | undefined;
    /**
     * Provides data for `wait-data` directive elements.
     * @param key the key of `wait-data` directive value.
     * @param data the data provide to the elements waiting
     */
    set(key: string, data: object, once?: boolean): void;
    /**
     * Destroy stored wait
     * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset(key: string): boolean;
  };

  /** Delimiters handler */
  readonly $delimiters: {
    /**
     * Adds a delimiter into the instance
     * @param item the delimiter to be added
     */
    add(item: IDelimiter): void;
    /**
     * Removes a delimiter from the instance
     * @param name the delimiter name
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
     * @param id the skeleton identifier
     */
    clear(id?: string): void;
    /**
     * Set Color of the Wave and/or the Background
     * @param color the color config object for the skeleton
     */
    set(color?: {
      /** the color of the wave */
      wave?: string;
      /** the color of the background */
      background?: string;
    }): void;
  };

  /** Components Handler */
  readonly $components: {
    /**
     * Adds a component to the instance
     * @param component the component to be added
     */
    add<Data>(component: Component<Data> | IComponentOptions<Data>): void;
    /**
     * Gets a component from the instance
     * @param name the name of the component to get
     */
    get<Data>(name: string): Component<Data> | IComponentOptions<Data>;
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

    /**
     * Navigates to a certain page without reloading all the page
     * @param route the route to navigate to
     * @param options navigation options
     */
    navigate(
      route: string,
      options?: {
        /** allow to change the url after the navigation, default value is `true` */
        setURL?: boolean;
        /** the data object that should be injected to the page to be loaded, default value is the main data */
        data?: object;
      }
    ): void;

    /**
     * Navigates to previous page according to the number of times
     * @param times number to pages to go back
     */
    popState(times?: number): void;

    /**
     * Changes the current url to a new one provided
     * @param url the url to change
     * @param title the of the new url
     */
    pushState(url: string, title?: string): void;

    /**
     * Mark an anchor as active
     * @param anchor the anchor to mark
     */
    markActiveAnchor(anchor: HTMLAnchorElement): void;

    /**
     * Mark all anchors having the route provided as active
     * @param route the that need to marked
     */
    markActiveAnchorsWithRoute(route: string): void;
  };

  /**
   * Sets new data (as reactive) to a target object
   * @param inputData the data that should be set
   * @param targetObject the target object (optional)
   */
  set<InputData, TargetObject>(
    inputData: InputData,
    targetObject?: TargetObject | Data | GlobalData
  ): TargetObject | Data | GlobalData;

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
      names?: string;
      values?: string;
    },
    onSet?: (
      builtObjectLayer: object,
      propName: string,
      value: any,
      element: Element
    ) => void
  ): object | null;

  /**
   * Provides the possibility to watch a property change
   * @param propertyName the property to watch
   * @param callback the function that should be called when the property change
   * @param targetObject the target object having the property to watch
   * @returns the watch object having the method to destroy the watch
   */
  watch<Key extends keyof TargetObject, TargetObject = Data>(
    propertyName: Key,
    callback: (
      valueNew: TargetObject[Key],
      valueOld: TargetObject[Key]
    ) => void,
    targetObject: TargetObject | Data
  ): Watch<TargetObject[Key], TargetObject | Data>;

  /**
   * Watch all reactive properties in the provided scope.
   * @param watchableScope the function that should be called when the any reactive property change
   * @returns an object having all the watches and the method to destroy watches at once
   */
  react(watchableScope: (app: Bouer) => void): void;

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
      /** A node to attach this event */
      attachedNode?: Node;
      /** Modifiers of the event | AddEventListenerOptions */
      modifiers?: {
        autodestroy?: boolean;
        capture?: boolean;
        once?: boolean;
        passive?: boolean;
        signal?: AbortSignal;
      };
    }
  ): IEventSubscription;

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
  ): void;

  /**
   * Removes the bind from an element
   * @param boundNode the node having the bind
   * @param boundAttrName the bound attribute name
   * @param boundPropName the bound property name
   */
  unbind(boundNode: Node, boundAttrName?: string, boundPropName?: string): void;

  /**
   * Dispatch an event
   * @param eventName
   * @param options options for the emission
   */
  emit(
    eventName: string,
    options?: {
      /** Attached event node */
      element?: Node;
      /** EventInit Object  */
      init?: CustomEventInit;
      /** Allow to remove the event after being dispatched */
      once?: boolean;
    }
  ): void;

  /**
   * Limits sequential execution to a single one acording to the milliseconds provided
   * @param callback the callback that should be performed the execution
   * @param wait milliseconds to the be waited before the single execution
   * @returns executable function
   */
  lazy(
    callback: (...args: any[]) => void,
    wait?: number
  ): (...args: any[]) => void;

  /**
   * Compiles an html element
   * @param options the options of the compilation process
   */
  compile<Data>(options: {
    el: Element;
    context: RenderContext;
    data?: Data;
    onDone?: (element: Element, data?: Data | undefined) => void;
  }): void;

  /**
   * Destroys the application
   */
  destroy(): void;

  /**
   * Default constructor
   * @param selector the root application element selector
   * @param options the options of the instance
   */
  constructor(
    selector: string,
    options?: IBouerOptions<Data, GlobalData, Dependencies>
  );

  /**
   * Creates a factory instance of Bouer
   * @param options the options to the instance
   * @returns Bouer instance
   */
  static create<Data = {}, GlobalData = {}, Dependencies = {}>(
    options?: IBouerOptions<Data, GlobalData, Dependencies>
  ): Bouer;

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
      names?: string;
      values?: string;
    },
    onSet?: (
      builtObjectLayer: object,
      propName: string,
      value: any,
      element: Element
    ) => void
  ): object | null;

  /**
   * Initialize create application
   * @param selector the selector of the element to be controlled by the instance
   */
  init(selector: string): Bouer;
}

export {
  Bouer as default,
  IBouerOptions,
  Component,
  IComponentOptions,
  Watch,
  WatchCallback,
  Reactive,
  IMiddleware,
  MiddlewareResult,
  IBinderConfig,
  IDelimiter,
  IDelimiterResponse,
  CustomDirective,
  IEventModifiers,
  IEventSubscription,
  IAsset,
  Extend,
};
