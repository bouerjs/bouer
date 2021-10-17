import IBouer from "./types/IBouer";
import Logger from "./shared/logger/Logger";
import DelimiterHandler, { Delimiter } from "./core/DelimiterHandler";
import HtmlHandler from "./core/compiler/HtmlHandler";
import Evalutator from "./core/Evaluator";
import EventHandler from "./core/event/EventHandler";
import Binder from "./core/binder/Binder";
import { ComponentDefinition } from "./types/IComponent";
import IBouerConfig from "./types/IBouerConfig";
import CommentHanlder from "./core/CommentHandler";
import Observer from "./shared/helpers/Observer";
import {
  createEl,
  DOM,
  forEach,
  isNull,
  isObject,
  transferProperty,
  trim
} from "./shared/helpers/Utils";
import CommentHandler from "./core/CommentHandler";
import Reactive from "./core/reactive/Reactive";

export default class Bouer implements IBouer {
  el: Element;
  name = 'Bouer';
  version = '3.0.0';

  data?: object;
  globalData?: object;
  config?: IBouerConfig;
  components?: ComponentDefinition;
  dependencies?: any[];

  /** delimiters handler */
  delimiters: {
    /** Adds a delimiter into the instance */
    add: Function;
    /** Removes a delimiter from the instance */
    remove: Function;
    /** Retrieve all the delimiters */
    get: () => Array<Delimiter>;
  };

  /**
   * Default constructor
   * @param elSelector the section that will be controlled by the instance
   * @param options the options to the instance
   */
  constructor(elSelector: string, options?: IBouer) {
    // Applying all the options defined
    Object.assign(this, (options || {}));

    if (isNull(elSelector) || trim(elSelector) === '')
      throw Logger.error('Invalid selector provided to the instance.');

    const app = this;
    const el = DOM.querySelector(elSelector);

    if (isNull(el))
      throw Logger.error('Element with selector \'' + elSelector + '\' not found.');

    this.el = el!;
    app.beforeMount(app.el, app);

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
    const htmlHandler = new HtmlHandler(this);
    const comment = new CommentHanlder(this);

    app.beforeLoad(app.el, app);
    // compile the app
    htmlHandler.compile({
      el: this.el,
      data: this.data,
      onDone: () => {
        app.loaded(app.el, app);
      }
    });

    Observer.observe(this.el, (options) => {
      const { mutation, element } = options;
      if (element.isConnected === false) {
        app.destroyed(app.el, app);
        mutation.disconnect();
      }
    });

    // Assing the two methods available
    this.delimiters = {
      add: delimiter.add,
      remove: delimiter.remove,
      get: () => delimiter.delimiters
    };

    if (!DOM.head.querySelector("link[rel~='icon']")) {
      createEl('link', (favicon) => {
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'https://afonsomatelias.github.io/easy/assets/img/main_ico.png';
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
    return HtmlHandler.singleton.toJsObj(input, options, onSet);
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

  // Lifecycle Hooks
  beforeMount(element: Element, bouer: Bouer) { }
  mounted(element: Element, bouer: Bouer) { }
  beforeLoad(element: Element, bouer: Bouer) { }
  loaded(element: Element, bouer: Bouer) { }
  destroyed(element: Element, bouer: Bouer) { }
}
