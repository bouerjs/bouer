import Bouer from "../instance/Bouer";
import Logger from "../../shared/logger/Logger";
import Component from "./Component";
import IComponent from "../../types/IComponent";
import Extend from "../../shared/helpers/Extend";
import dynamic from "../../types/dynamic";
import Routing from "../routing/Routing";
import IoC from "../../shared/helpers/IoC";
import Evaluator from "../Evaluator";
import Compiler from "../compiler/Compiler";
import Observer from "../../shared/helpers/Observer";
import DelimiterHandler from "../DelimiterHandler";
import {
  DOM,
  code,
  http,
  trim,
  isNull,
  anchor,
  forEach,
  createEl,
  buildError,
  transferProperty,
  urlCombine,
  urlResolver,
  isFunction,
  defineProperty,
  isObject,
  toArray
} from "../../shared/helpers/Utils";
import ReactiveEvent from "../event/ReactiveEvent";
import Reactive from "../reactive/Reactive";
import EventHandler from "../event/EventHandler";
import IBouer from "../../types/IBouer";


export default class ComponentHandler {
  private bouer: Bouer;
  private components: { [key: string]: (Component | IComponent) } = {};
  // Handle all the components web requests to avoid multiple requests
  private requests: dynamic = {};
  delimiter: DelimiterHandler;
  eventHandler: EventHandler;

  constructor(bouer: Bouer, appOptions: IBouer) {
    IoC.Register(this)!;

    this.bouer = bouer;
    this.delimiter = IoC.Resolve('DelimiterHandler')!;
    this.eventHandler = IoC.Resolve('EventHandler')!;

    if (appOptions.components) {
      this.prepare(appOptions.components);
    }
  }

  check(nodeName: string) {
    return (nodeName in this.components);
  }

  request(url: string, response: {
    success: (content: string, url: string) => void,
    fail: (error: any, url: string) => void
  }) {
    if (!isNull(this.requests[url]))
      return this.requests[url].push(response);

    this.requests[url] = [response];
    const hasBase = DOM.head.querySelector('base') != null;
    const resolver = urlResolver(anchor.baseURI);
    let baseURI = resolver.baseURI;

    if (!hasBase) baseURI = resolver.origin;
    const urlPath = urlCombine(baseURI, url);

    http(urlPath, { headers: { 'Content-Type': 'text/plain' } })
      .then(response => {
        if (!response.ok) throw ((response.statusText));
        return response.text();
      })
      .then(content => {
        forEach(this.requests[url], (request: dynamic) => {
          request.success(content, url);
        });
      })
      .catch(error => {
        if (!hasBase) Logger.warn("It seems like you are not using the “<base href=\"/\" />” element, " +
            "try to add as the first child into “<head></head>” element.")
        forEach(this.requests[url], (request: dynamic) => {
          request.fail(error, url);
        });
      }).finally(() => {
        delete this.requests[url];
      });
  }

  prepare(components: IComponent[], parent?: IComponent) {
    forEach(components, component => {
      if (isNull(component.name))
        component.name = code(9, 'component-').toLowerCase();

      if (isNull(component.path) && isNull(component.template))
        return Logger.warn("The component with name “" + component.name + "”" +
          component.route ? (" and the route “" + component.route + "”") : "" +
          " has not “path” or “template” property defined, " +
        "then it was ignored.");

      if (!isNull(parent)) { // TODO: Inherit the parent info
      }

      if (Array.isArray(component.children))
        this.prepare(component.children, component);

      if (!isNull(component.route)) { // Completing the API
        component.route = "/" + urlCombine(
          (isNull(parent) ? "" : parent!.route!),
          component.route!);
      }

      if (!isNull((this.components as any)[component.name!]))
        return Logger.warn("The component name “" + component.name + "” is already define, try changing the name.");

      IoC.Resolve<Routing>('Routing')!.configure(this.components[component.name!] = component);

      const preload = (this.bouer.config || {}).preload ?? true;
      if (!preload) return;

      if (!isNull(component.path))
        this.request(component.path!, {
          success: content => {
            component.template = content;
          },
          fail: error => {
            Logger.error(buildError(error));
          }
        });
    });
  }

  order(componentElement: Element, data: object, callback?: (component: Component) => void) {
    const $name = componentElement.nodeName.toLowerCase();
    const mComponents = this.components as dynamic;
    let hasComponent = mComponents[$name];
    if (!hasComponent)
      return Logger.error(("No component with name “" + $name + "” registered."));

    const icomponent = (hasComponent as IComponent);
    const mData = Extend.obj(data, { $this: data });

    if (icomponent.template) {
      const component = new Component(icomponent);
      component.bouer = this.bouer;

      if (isFunction(callback))
        callback!(component);

      this.insert(componentElement, component, mData);

      if (component.keepAlive === true)
        mComponents[$name] = component;
      return;
    }

    const requestedEvent = this.$addEvent('requested', componentElement, icomponent);
    if (requestedEvent) requestedEvent.emit();
    // Make or Add request
    this.request(icomponent.path!, {
      success: content => {
        icomponent.template = content;
        const component = new Component(icomponent);
        component.bouer = this.bouer;

        if (isFunction(callback))
          callback!(component);

        this.insert(componentElement, component, mData);

        if (component.keepAlive === true)
          mComponents[$name] = component;
      },
      fail: (error) => {
        Logger.error(("Failed to request <" + $name + "></" + $name + "> component with path “" + icomponent.path + "”."));
        Logger.error(buildError(error));

        if (typeof icomponent.failed !== 'function') return;
        icomponent.failed(new CustomEvent('failed'));
      }
    });
  }

  find(callback: (item: (Component | IComponent)) => boolean) {
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (callback(component)) return component;
    }
    return null;
  }

  /** Subscribe the hooks of the instance */
  $addEvent(eventName: string, element: Element, callbackSource: any) {
    const callback = callbackSource[eventName];
    if (typeof callback !== 'function') return { emit: (() => { }) }

    const emitter = this.eventHandler.on(eventName, evt => callback(evt), element).emit;
    return {
      emit: () => {
        emitter({
          eventName: eventName,
          attachedNode: element
        })
      }
    }
  }

  private insert(componentElement: Element, component: Component, data: object) {
    const $name = componentElement.nodeName.toLowerCase();
    const container = componentElement.parentElement;
    if (!componentElement.isConnected || !container)
      return; //Logger.warn("Insert location of component <" + $name + "></" + $name + "> not found.");

    if (!component.isReady)
      return Logger.error(("The <" + $name + "></" + $name + "> component is not ready yet to be inserted."));

    const elementContent = createEl('div', el => {
      el.innerHTML = componentElement.innerHTML
      componentElement.innerHTML = "";
    }).build();

    const isKeepAlive = componentElement.hasAttribute('keep-alive') || (component.keepAlive ?? false);
    // Component Creation
    if (isKeepAlive === false || isNull(component.el)) {
      createEl('body', htmlSnippet => {
        htmlSnippet.innerHTML = component.template!;
        forEach([].slice.apply(htmlSnippet.querySelectorAll('script')), script => {
          component.scripts.push(script);
          htmlSnippet.removeChild(script);
        });

        forEach([].slice.apply(htmlSnippet.querySelectorAll('link[rel="stylesheet"]')), style => {
          component.styles.push(style);
          htmlSnippet.removeChild(style);
        });

        forEach([].slice.apply(htmlSnippet.querySelectorAll('style')), style => {
          component.styles.push(style);
          htmlSnippet.removeChild(style);
        });

        if (htmlSnippet.children.length === 0)
          return Logger.error(("The component <" + $name + "></" + $name + "> " +
            "seems to be empty or it has not a root element. Example: <div></div>, to be included."));

        if (htmlSnippet.children.length > 1)
          return Logger.error(("The component <" + $name + "></" + $name + "> " +
            "seems to have multiple root element, it must have only one root."));

        component.el = htmlSnippet.children[0];

        this.$addEvent('created', component.el!, component)
        component.emit('created');
      });
    }

    let rootElement = component.el!;
    // tranfering the attributes
    forEach(toArray(componentElement.attributes), (attr: Attr) => {
      componentElement.removeAttribute(attr.name);
      if (attr.nodeName === 'class')
        return componentElement.classList.forEach(cls => {
          rootElement.classList.add(cls);
        });

      if (attr.nodeName === 'data') {
        if (this.delimiter.run(attr.value).length !== 0)
          return Logger.error(("The “data” attribute cannot contain delimiter, " +
            "source element: <" + $name + "></" + $name + ">."));

        let inputData: dynamic = {};
        const mData = Extend.obj(data, { $this: data });

        const reactiveEvent = ReactiveEvent.on('AfterGet', reactive => {
          inputData[reactive.propertyName] = undefined;
          defineProperty(inputData, reactive.propertyName, reactive);
        });

        // If data value is empty gets the main scope value
        if (attr.value === '')
          inputData = Extend.obj(this.bouer.data);
        else {
          // Other wise, compiles the object provided
          const mInputData = IoC.Resolve<Evaluator>('Evaluator')!
            .exec({ data: mData, expression: attr.value });

          if (!isObject(mInputData))
            return Logger.error(("Expected a valid Object Literal expression in “"
              + attr.nodeName + "” and got “" + attr.value + "”."));

          // Adding all non-existing properties
          forEach(Object.keys(mInputData), key => {
            if (!(key in inputData))
              inputData[key] = mInputData[key];
          });
        }

        reactiveEvent.off();
        Reactive.transform(inputData);

        return forEach(Object.keys(inputData), key => {
          transferProperty(component.data, inputData, key);
        });
      }

      rootElement.attributes.setNamedItem(attr);
    });

    this.$addEvent('beforeMount', component.el!, component)
    component.emit('beforeMount');

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
        const mRule = rule as dynamic;
        const selector = (mRule.selectorText as string).substr(1);
        const separation = rootClassList[selector] ? "" : " ";

        mRule.selectorText = "." + id + separation + mRule.selectorText;
        if (isStyle) rules.push(mRule.cssText);
      }
      if (isStyle) style.innerText = rules.join('\n');
    }

    // Configuring the styles
    forEach(component.styles, style => {
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
        IoC.Resolve<Evaluator>('Evaluator')!
          .execRaw((scriptContent || ''), component);

        this.$addEvent('mounted', component.el!, component);
        component.emit('mounted');

        // TODO: Something between this two events

        this.$addEvent('beforeLoad', component.el!, component)
        component.emit('beforeLoad');

        IoC.Resolve<Compiler>('Compiler')!
          .compile({
            data: Reactive.transform(component.data),
            el: rootElement,
            componentContent: elementContent,
            onDone: () => {
              this.$addEvent('loaded', component.el!, component);
              component.emit('loaded');
            }
          });

        Observer.observe(container, options => {
          if (rootElement.isConnected) return;
          const { mutation, element } = options;
          component.destroy();
          mutation.disconnect();
        });
      } catch (error) {
        Logger.error(("Error in <" + $name + "></" + $name + "> component."));
        Logger.error(buildError(error));
      }
    }

    if (component.scripts.length === 0)
      return compile();

    // Mixing all the scripts
    const localScriptsContent: string[] = [],
      onlineScriptsContent: string[] = [],
      onlineScriptsUrls: string[] = [],
      webRequestChecker: any = {};

    // Grouping the online scripts and collecting the online url
    forEach(component.scripts, function (script) {
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
      }).then(response => {
        if (!response.ok) throw ((response.statusText));
        return response.text();
      }).then(text => {
        delete webRequestChecker[url];
        // Adding the scripts according to the defined order
        onlineScriptsContent[index] = text;

        // if there are not web requests compile the element
        if (Object.keys(webRequestChecker).length === 0)
          return compile(Extend.array(onlineScriptsContent, localScriptsContent).join('\n\n'));
      }).catch(error => {
        error.stack = "";
        Logger.error(("Error loading the <script src=\"" + url + "\"></script> in " +
          "<" + $name + "></" + $name + "> component, remove it in order to be compiled."));
        Logger.log(error);

        this.$addEvent('failed', componentElement, (component as any['failed']))
          .emit();
      });
    });
  }
}
