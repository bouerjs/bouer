import { Constants } from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import Observer from "../../shared/helpers/Observer";
import Logger from "../../shared/logger/Logger";
import delimiter from "../../types/delimiter";
import dynamic from "../../types/dynamic";
import IBouer from "../../types/IBouer";
import IBouerConfig from "../../types/IBouerConfig";
import IComponent from "../../types/IComponent";
import watchCallback from "../../types/watchCallback";
import Binder from "../binder/Binder";
import CommentHandler from "../CommentHandler";
import Compiler from "../compiler/Compiler";
import Converter from "../compiler/Converter";
import Component from "../component/Component";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import Evaluator from "../Evaluator";
import EventHandler from "../event/EventHandler";
import Reactive from "../reactive/Reactive";
import Routing from "../routing/Routing";
import DataStore from "../store/DataStore";
import {
  transferProperty,
  isObject,
  createEl,
  forEach,
  isNull,
  DOM,
  trim,
  isFunction,
  toArray
} from "../../shared/helpers/Utils";
import Interceptor from "../interceptor/Interceptor";
import IInterceptor from "../../types/IInterceptor";

export default class Bouer implements IBouer {
  el: Element;
  name = 'Bouer';
  version = '3.0.0';

  data: object;
  globalData: object;
  config: IBouerConfig | undefined;
  components: (IComponent | Component)[] = [];
  routing: Routing | undefined;
  dependencies: dynamic = {};
  interceptor?: (
    intercept: (
      action: string,
      callback: (context: IInterceptor) => void
    ) => void,
    app: Bouer
  ) => void;

  /** Delimiters handler */
  delimiters: {
    /** Adds a delimiter into the instance */
    add: (item: delimiter) => void
    /** Removes a delimiter from the instance */
    remove: (name: string) => void;
    /** Retrieve all the delimiters */
    get: () => delimiter[];
  };

  /** Data Exposition and Injection handler*/
  $data: {
    /**
     * Gets the exposed `data` or the value provided for `data` directive
     * @param key the data:[`key`]="..." directive key value or the app.$data.set(`key`) key provided.
     * @returns the expected object | null
     */
    get: (key?: string) => any,
    /**
     * Sets a value into a storage the used anywhere of the application.
     * @param key the key of the data to be stored.
     * @param data the data to be stored.
     * @param toReactive allow to transform the data to a reactive one after being setted. By default is `false`.
     */
    set: (key: string, data: object | any[], toReactive?: boolean) => any,
    /**
     * Destroy the stored data
     * @param key the data:[`key`]="..." directive value or the app.$data.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset: (key: string) => boolean,
  }

  /** Requests handler */
  $req: {
    /**
     * Gets the `e-req` directive response value
     * @param key the e-req:[`key`]="..." directive key value.
     * @returns the expected object | null
     */
    get: (key?: string) => { data: any, [key: string]: any } | null
    /**
     * Destroy stored req (request)
     * @param key the e-req:[`key`]="..." directive key value.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset: (key: string) => boolean,
  }

  /** Waiting data Handler */
  $wait: {
    /**
     * Gets the elements and data of the `wait-data` directive.
     * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns the expected object | null
     */
    get: (key?: string) => any,
    /**
     * Provides data for `wait-data` directive elements.
     * @param key the key of `wait-data` directive value.
     * @param data the data provide to the elements waiting
     */
    set: (key: string, data: object) => void,
    /**
     * Destroy stored wait
     * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
     * @returns `true` for item deleted or `false` for item not deleted.
     */
    unset: (key: string) => boolean,
  }

  /**
   * Default constructor
   * @param selector the selector of the element to be controlled by the instance
   * @param options the options to the instance
   */
  constructor(selector: string, options?: IBouer) {
    options = options || {};
    // Applying all the options defined

    this.config = options.config;
    this.components = options.components || [];
    this.dependencies = options.dependencies || {};
    this.interceptor = options.interceptor;


    Object.assign(this, options);

    if (isNull(selector) || trim(selector) === '')
      throw Logger.error(('Invalid selector provided to the instance.'));

    const app = this;
    const el = DOM.querySelector(selector);

    if (!el) throw Logger.error(("Element with selector “" + selector + "” not found."));

    const dataStore = new DataStore();
    new Evaluator(this);
    new CommentHandler(this);
    const interceptor = new Interceptor();

    app.beforeMount(el, app);
    this.el = el;

    // Register the interceptor
    if (typeof this.interceptor === 'function')
      this.interceptor(interceptor.register, this);

    // Transform the data properties into a reative
    this.data = Reactive.transform(options!.data || {});
    this.globalData = Reactive.transform(options!.globalData || {});

    app.mounted(app.el, app);

    const delimiter = new DelimiterHandler([
      { name: 'bouer', delimiter: { open: '-e-', close: '-' } },
      { name: 'common', delimiter: { open: '{{', close: '}}' } },
      { name: 'html', delimiter: { open: '{{:html ', close: '}}' } },
    ]);

    const eventHandler = new EventHandler(this);
    const binder = new Binder(this);
    this.routing = new Routing(this);
    const component = new ComponentHandler(this, options!.components);
    const compiler = new Compiler(this);
    const converter = new Converter(this);
    const comment = new CommentHandler(this);

    // Assing the two methods available
    this.delimiters = {
      add: delimiter.add,
      remove: delimiter.remove,
      get: () => delimiter.delimiters.slice()
    };

    this.$data = {
      get: key => key ? dataStore.data[key] : dataStore.data,
      set: (key, data, toReactive) => {
        if (key in dataStore.data)
          return Logger.log(("There is already a data stored with this key “" + key + "”."));

        if ((toReactive ?? false) === true)
          Reactive.transform(data);
        return DataStore.set('data', key, data);
      },
      unset: key => delete dataStore.data[key]
    };

    this.$req = {
      get: key => key ? dataStore.req[key] : dataStore.req,
      unset: key => delete dataStore.req[key],
    };
    this.$wait = {
      get: key => key ? dataStore.wait[key] : dataStore.wait,
      set: (key: string, data: object) => {
        if (!(key in dataStore.wait))
          return dataStore.wait[key] = { data: data, nodes: [] };

        const mWait = dataStore.wait[key];
        mWait.data = data;

        return forEach(mWait.nodes, node => {
          if (!node) return;
          compiler.compile({
            el: node,
            data: Reactive.transform(mWait.data),
          })
        });
      },
      unset: key => delete dataStore.wait[key],
    };

    app.beforeLoad(app.el, app);
    // compile the app
    compiler.compile({
      el: this.el,
      data: this.data,
      onDone: () => app.loaded(app.el, app)
    });

    Observer.observe(this.el, (options) => {
      const { mutation, element } = options;
      if (element.isConnected === false) {
        app.destroyed(app.el, app);
        mutation.disconnect();
      }
    });

    // Initializing Routing
    this.routing.init();

    if (!DOM.head.querySelector("link[rel~='icon']")) {
      createEl('link', (favicon) => {
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
      }).appendTo(DOM.head);
    }
  }

  /**
   * Gets all the elemens having the `ref` attribute
   * @returns an object having all the elements with the `ref attribute value` defined as the key.
   */
  get refs(): dynamic {
    const mRefs: dynamic = {};
    forEach(toArray(this.el.querySelectorAll("[" + Constants.ref + "]")), (ref: any) => {
      const mRef = ref.attributes[Constants.ref] as Attr;
      let value = trim(mRef.value) || ref.name || '';

      if (value === '') {
        return Logger.error("Expected an expression in “" + ref.name +
          "” or at least “name” attribute to combine with “" + ref.name + "”.");
      }

      if (value in mRefs)
        return Logger.warn("The key “" + value + "” in “" + ref.name + "” is taken, choose another key.", ref);

      mRefs[value] = ref;
    });

    return mRefs;
  }

  /**
   * Compiles a `HTML snippet` to a `Object Literal`
   * @param input the input element
   * @param options the options of the compilation
   * @param onSet a function that will be fired when a value is setted
   * @returns the Object Compiled from the HTML
   */
  toJsObj(input: any, options?: {
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
  }, onSet?: (builtObject: object, propName: string, value: any, element: Element) => void) {
    return IoC.Resolve<Converter>('Converter')!.htmlToJsObj(input, options, onSet);
  }

  /**
   * Sets data into a target object, by default is the `app.data`
   * @param inputData the data the will be setted
   * @param targetObject the target were the inputData
   * @returns the object with the data setted
   */
  setData(inputData: object, targetObject?: object) {
    return Reactive.setData(inputData, (targetObject || this.data));
  }

  /**
   * Provides the possibility to watch a property change
   * @param propertyName the property to watch
   * @param callback the function that will be called when the property change
   * @param targetObject the target object having the property to watch
   * @returns the watch object having the method to destroy the watch
   */
  watch(propertyName: string, callback: watchCallback, targetObject?: object) {
    return IoC.Resolve<Binder>('Binder')!.watch(propertyName, callback, targetObject);
  }

  on() { }
  off() { }
  emit() { }

  // Lifecycle Hooks
  beforeMount(element: Element, bouer: Bouer) { }
  mounted(element: Element, bouer: Bouer) { }
  beforeLoad(element: Element, bouer: Bouer) { }
  loaded(element: Element, bouer: Bouer) { }
  destroyed(element: Element, bouer: Bouer) { }
}
