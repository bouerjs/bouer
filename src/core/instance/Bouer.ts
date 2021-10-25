import IoC from "../../shared/helpers/IoC";
import Observer from "../../shared/helpers/Observer";
import {
  createEl,
  DOM,
  forEach,
  isNull,
  isObject, transferProperty,
  trim
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import { delimiter } from "../../types/delimiter";
import IBouer from "../../types/IBouer";
import IBouerConfig from "../../types/IBouerConfig";
import IComponent from "../../types/IComponent";
import { watchCallback } from "../../types/watchCallback";
import Binder from "../binder/Binder";
import Watch from "../binder/Watch";
import { default as CommentHandler, default as CommentHanlder } from "../CommentHandler";
import Compiler from "../compiler/Compiler";
import Converter from "../compiler/Converter";
import Component from "../component/Component";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import Evalutator from "../Evaluator";
import EventHandler from "../event/EventHandler";
import ReactiveEvent from "../event/ReactiveEvent";
import Reactive from "../reactive/Reactive";
import Routing from "../routing/Routing";
import DataStore from "../store/DataStore";

export default class Bouer implements IBouer {
  el: Element;
  name = 'Bouer';
  version = '3.0.0';

  data: object;
  globalData: object;
  config: IBouerConfig | undefined;
  components: (IComponent | Component)[] = [];
  routing: Routing | undefined;
  dependencies: any[] = [];

  /** delimiters handler */
  delimiters: {
    /** Adds a delimiter into the instance */
    add: Function;
    /** Removes a delimiter from the instance */
    remove: Function;
    /** Retrieve all the delimiters */
    get: () => Array<delimiter>;
  };

  /**
   * Default constructor
   * @param elSelector the section that will be controlled by the instance
   * @param options the options to the instance
   */
  constructor(elSelector: string, options?: IBouer) {
    options = options || {};
    // Applying all the options defined
    Object.assign(this, options);

    // Un
    delete (this as any).components;

    if (isNull(elSelector) || trim(elSelector) === '')
      throw Logger.error('Invalid selector provided to the instance.');

    const app = this;
    const el = DOM.querySelector(elSelector);

    if (isNull(el))
      throw Logger.error("Element with selector “" + elSelector + "” not found.");

    this.el = el!;
    app.beforeMount(app.el, app);

    new DataStore();
    new Evalutator(this);
    new CommentHandler(this)
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
    const routing = this.routing = new Routing(this);
    const component = new ComponentHandler(this, options!.components);
    const compiler = new Compiler(this);
    const converter = new Converter(this);
    const comment = new CommentHanlder(this);

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
    routing.init();

    // Assing the two methods available
    this.delimiters = {
      add: delimiter.add,
      remove: delimiter.remove,
      get: () => [].slice.call(delimiter.delimiters)
    };

    if (!DOM.head.querySelector("link[rel~='icon']")) {
      createEl('link', (favicon) => {
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'https://afonsomatelias.github.io/assets/bouer/img/short.png';
      }).appendTo(DOM.head);
    }
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
   * @returns
   */
  setData(inputData: object, targetObject?: object) {
    if (!isObject(inputData))
      return Logger.error('Invalid inputData value, expected an "Object Literal" and got "' + (typeof inputData) + '".');

    if (targetObject === null || !isObject(targetObject))
      return Logger.error('Invalid targetObject value, expected an "Object Literal" and got "' + (typeof targetObject) + '".');

    targetObject = this.data;

    // Transforming the input
    Reactive.transform(inputData);

    // Transfering the properties
    forEach(Object.keys(inputData), key => transferProperty(targetObject, inputData, key));
    return targetObject;
  }

  watch(propertyName: string, callback: watchCallback, targetObject?: object) {
    return IoC.Resolve<Binder>('Binder')!.watch(propertyName, callback, targetObject);
  }

  // Lifecycle Hooks
  beforeMount(element: Element, bouer: Bouer) { }
  mounted(element: Element, bouer: Bouer) { }
  beforeLoad(element: Element, bouer: Bouer) { }
  loaded(element: Element, bouer: Bouer) { }
  destroyed(element: Element, bouer: Bouer) { }
}
