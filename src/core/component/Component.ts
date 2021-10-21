import Bouer from "../instance/Bouer";
import IComponent from "../../types/IComponent";
import Logger from "../../shared/logger/Logger";
import { anchor, buildError, code, createEl, DOM, forEach, http, isNull, isObject, transferProperty, trim, urlCombine, urlResolver } from "../../shared/helpers/Utils";
import BouerEvent from "../event/BouerEvent";
import EventHandler from "../event/EventHandler";
import Reactive from "../reactive/Reactive";
import UriHandler from "../../shared/helpers/UriHandler";
import Evalutator from "../Evaluator";
import HtmlHandler from "../compiler/HtmlHandler";
import Observer from "../../shared/helpers/Observer";
import Extend from "../../shared/helpers/Extend";
import ILifeCycleHooks from "../../types/ILifeCycleHooks";

export default class Component implements IComponent {
  name: string
  path: string;
  title?: string;
  route?: string;
  template?: string;
  data?: object;
  children?: Array<IComponent>;
  keepAlive?: boolean;

  bouer: Bouer | undefined;
  el: Element | undefined | null;
  scripts: Array<HTMLScriptElement> = [];
  styles: Array<HTMLStyleElement | HTMLLinkElement> = [];
  // Store temporarily this component UI orders
  events: any = {};

  public get isReady() {
    return !isNull(this.template);
  }

  /** The anchors attached to this component */
  private links?: Array<HTMLAnchorElement>;

  constructor(options: IComponent) {
    this.name = options.name;
    this.path = options.path;

    Object.assign(this, options);
    this.data = Reactive.transform(this.data || {});
  }

  insert(componentElement: Element, data: object) {
    const $name = componentElement.nodeName.toLowerCase();
    const container = componentElement.parentElement;
    if (!componentElement.isConnected || !container)
      return Logger.error("Insert location of component <" + $name + "></" + $name + "> not found.");

    if (!this.isReady)
      return Logger.error("The <" + $name + "></" + $name + "> component is not ready yet to be inserted.");

    // Component Creation
    if (this.keepAlive !== true) {
      createEl('body', htmlSnippet => {
        htmlSnippet.innerHTML = this.template!;
        forEach([].slice.apply(htmlSnippet.querySelectorAll('script')), script => {
          this.scripts.push(script);
          htmlSnippet.removeChild(script);
        });

        forEach([].slice.apply(htmlSnippet.querySelectorAll('link[rel="stylesheet"]')),
          style => {
            this.styles.push(style);
            htmlSnippet.removeChild(style);
          });

        forEach([].slice.apply(htmlSnippet.querySelectorAll('style')),
          style => {
            this.styles.push(style);
            htmlSnippet.removeChild(style);
          });

        if (htmlSnippet.children.length === 0)
          return Logger.error("The component <" + $name + "></" + $name + "> seems to be empty or it has not a root element." +
            "eg.: <div></div>, to be included.");

        if (htmlSnippet.children.length > 1)
          return Logger.error("The component <" + $name + "></" + $name + "> seems to have multiple root element, it must have" +
            " only one root.");

        this.el = htmlSnippet.children[0];
        this.emit('created');
      });
    }

    let rootElement = this.el!;
    // tranfering the attributes
    forEach([].slice.call(componentElement.attributes), (attr: Attr) => {
      componentElement.removeAttribute(attr.name);
      if (attr.nodeName === 'class')
        return componentElement.classList.forEach(cls => {
          rootElement.classList.add(cls);
        });

      if (attr.nodeName === 'data') {
        const mData = Evalutator.singleton
          .exec({
            data: data,
            expression: trim(attr.value) !== '' ? attr.value : 'this.data',
          })
        return forEach(Object.keys(mData), key => {
          transferProperty(this.data, mData, key);
        });
      }

      rootElement.attributes.setNamedItem(attr);
    });

    this.emit('beforeMount');

    container.replaceChild(rootElement, componentElement);

    let rootClassList: any = {};
    // Retrieving all the classes of the retu elements
    rootElement.classList.forEach(key => rootClassList[key] = true);

    // Changing each selector to avoid conflits
    const changeSelector = (style: HTMLStyleElement | HTMLLinkElement, id: string) => {
      const isStyle = (style.nodeName === 'STYLE'), rules: string[] = [];
      if (!style.sheet) return;

      const cssRules = style.sheet.cssRules;
      for (let i = 0; i < cssRules.length; i++) {
        const rule = cssRules.item(i);
        if (!rule) continue;
        const ruleAsAny = (rule as any);
        const selector = (ruleAsAny.selectorText as string).substr(1);
        const separation = rootClassList[selector] ? "" : " ";

        ruleAsAny.selectorText = "." + id + separation + ruleAsAny.selectorText;
        if (isStyle) rules.push(ruleAsAny.cssText);
      }
      if (isStyle) style.innerText = rules.join('\n');
    }

    // Configuring the styles
    forEach(this.styles, style => {
      const mStyle = style.cloneNode(true) as Element;

      const styleId = code(7, 'bouer-s');
      if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
        mStyle.onload = evt =>
          changeSelector((evt.target! as HTMLLinkElement), styleId);

      DOM.head.appendChild(mStyle);
      if (!mStyle.hasAttribute('scoped')) return;

      rootElement.classList.add(styleId);
      if (mStyle instanceof HTMLStyleElement)
        return changeSelector(mStyle, styleId);
    });

    const compile = (scriptContent?: string) => {
      try {
        // Executing the mixed scripts
        Evalutator.singleton.execRaw(scriptContent || '', this);
        this.emit('mounted');

        // TODO: Something between this two events

        this.emit('beforeLoad');

        HtmlHandler.singleton
          .compile({
            data: this.data,
            el: rootElement,
            onDone: () => this.emit('loaded')
          });

        Observer.observe(rootElement, () => {
          if (rootElement.isConnected) return;
          this.destroy();
        });
      } catch (error) {
        Logger.error("Error in <" + $name + "></" + $name + "> component.");
        Logger.error(buildError(error));
      }
    }

    if (this.scripts.length === 0)
      return compile();

    // Mixing all the scripts
    const localScriptsContent: string[] = [],
      webRequestChecker: any = {},
      onlineScriptsContent: string[] = [],
      onlineScriptsUrls: string[] = [];
    // Grouping the online scripts and collecting the online url
    forEach(this.scripts, function (script) {
      if (script.src == '' || script.innerHTML)
        localScriptsContent.push(script.innerHTML);
      else
        onlineScriptsUrls.push(script.src);
    });

    // No online scripts detected
    if (onlineScriptsUrls.length == 0)
      return compile(localScriptsContent.join('\n\n'));

    // Load the online scripts and run it
    return forEach(onlineScriptsUrls, (url, index) => {
      webRequestChecker[url] = true;
      // Getting script content from a web request
      http(url, {
        headers: { "Content-Type": 'text/plain' }
      }).then(response => response.text())
        .then(text => {
          delete webRequestChecker[url];
          // Adding the scripts according to the defined order
          onlineScriptsContent[index] = text;

          // if there are not web requests compile the element
          if (Object.keys(webRequestChecker).length === 0)
            return compile(Extend.array(onlineScriptsContent, localScriptsContent).join('\n\n'));
        })
        .catch(error => {
          error.stack = "";
          Logger.error("Error loading the <script src=\"" + url + "\"></script> in " +
            "<" + $name + "></" + $name + "> component, remove it in order to be compiled.");
          Logger.log(error);
          this.emit('failed');
        });
    });
  }

  export(options: object) {
    if (!isObject(options))
      return Logger.log("Invalid object for component.export(...), only \"Object Literal\" is allowed.");

    return forEach(Object.keys(options), key => {
      transferProperty(this.data, options, key);
    });
  }

  destroy() {
    if (!this.el) return false;
    let container = this.el.parentElement;

    if (!container)
      return false;

    this.emit('beforeDestroy');
    container.removeChild(this.el) !== null;
    this.emit('destroyed');

    // Destroying all the events attached to the this instance
    this.events = {};
  }

  params() {
    new UriHandler(this.route || '')
  }

  emit<TKey extends keyof ILifeCycleHooks>(eventName: TKey, ...params: any[]) {
    const thisAsAny = (this as any)
    if (eventName in thisAsAny && typeof thisAsAny[eventName] === 'function')
      thisAsAny[eventName](new BouerEvent({ type: eventName, targert: this }));

    // Firing all subscribed events
    const events = this.events[eventName];
    if (!events) return false;
    forEach(events, (event: (event: BouerEvent, ...params: any[]) => void) =>
      event(new BouerEvent({ type: eventName }), ...params));
    return true;
  }

  on<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: BouerEvent, ...params: any[]) => void) {
    if (!this.events[eventName])
      this.events[eventName] = [];
    this.events[eventName].push(callback);
    return {
      eventName,
      callback
    };
  }

  off<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: BouerEvent, ...params: any[]) => void) {
    if (!this.events[eventName]) return false;
    const eventIndex = this.events[eventName].indexOf(callback);
    this.events[eventName].splice(eventIndex, 1);
    return true;
  }
}
