import Bouer from "../instance/Bouer";
import Logger from "../../shared/logger/Logger";
import Component from "./Component";
import IComponent from "../../types/IComponent";
import Extend from "../../shared/helpers/Extend";
import BouerEvent from "../event/BouerEvent";
import { dynamic } from "../../types/dynamic";
import Routing from "../routing/Routing";
import IoC from "../../shared/helpers/IoC";
import Evalutator from "../Evaluator";
import HtmlHandler from "../compiler/HtmlHandler";
import Observer from "../../shared/helpers/Observer";
import {
  anchor,
  buildError,
  code,
  createEl,
  DOM,
  forEach,
  http,
  isNull,
  transferProperty,
  trim,
  urlCombine,
  urlResolver
} from "../../shared/helpers/Utils";


export default class ComponentHandler {
  private bouer: Bouer;
  private components: { [key: string]: (Component | IComponent) } = {};
  // Handle all the components web requests to avoid multiple requests
  private requests: dynamic = {};

  constructor(bouer: Bouer, components?: IComponent[]) {
    IoC.Register(this)!;

    this.bouer = bouer;
    if (components) this.prepare(components);
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

    const urlPath = urlCombine(urlResolver(anchor.baseURI).baseURI, url);
    http(urlPath, { headers: { 'Content-Type': 'text/plain' } })
      .then(result => result.text())
      .then(content => {
        forEach(this.requests[url], (request: dynamic) => {
          request.success(content, url);
        });
      })
      .catch(error => {
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

      if (isNull(component.path))
        return Logger.warn("The component with name “" + component.name +
          "” and the route “" + component.route + "” has not “path” property defined," +
          " then it was ignored.");

      if (!isNull(parent)) { // TODO: Inherit the parent info
      }

      if (Array.isArray(component.children))
        this.prepare(component.children, component);

      if (!isNull(component.route)) { // Completing the API
        component.route = "/" + urlCombine(
          (isNull(parent) ? "" : parent!.route!),
          component.route!);
      }

      if (!isNull((this.components as any)[component.name]))
        return Logger.warn("The component name “" + component.name + "” is already define, try changing the name.");

      IoC.Resolve<Routing>('Routing')!.configure(this.components[component.name] = component);

      const preload = (this.bouer.config || {}).preload ?? true;
      if (!preload) return;

      this.request(component.path, {
        success: content => {
          component.template = content;
        },
        fail: () => {}
      });
    });
  }

  order(componentElement: Element, data: object) {
    const $name = componentElement.nodeName.toLowerCase();
    const mComponents = this.components as dynamic;
    let hasComponent = mComponents[$name];
    if (!hasComponent)
      return Logger.error("No component with name “" + $name + "” registered.");

    const icomponent = (hasComponent as IComponent);
    const mData = Extend.obj(data, { $this: data });

    if (icomponent.template) {
      const component = new Component(icomponent);
      component.bouer = this.bouer;
      this.insert(componentElement, component, mData);

      if (component.keepAlive === true)
        mComponents[$name] = component;
      return;
    }

    if (typeof icomponent.requested === 'function')
      icomponent.requested(new BouerEvent({ type: 'requested' }));

    // Make or Add request
    this.request(icomponent.path, {
      success: content => {
        icomponent.template = content;
        const component = new Component(icomponent);
        component.bouer = this.bouer;
        this.insert(componentElement, component, mData);

        if (component.keepAlive === true)
          mComponents[$name] = component;
      },
      fail: (error) => {
        Logger.error(buildError(error));

        if (typeof icomponent.failed !== 'function') return;
        icomponent.failed(new BouerEvent({ type: 'failed' }));
      }
    })
  }

  insert(element: Element, component: Component, data: object) {
    const $name = element.nodeName.toLowerCase();
    const container = element.parentElement;
    if (!element.isConnected || !container)
      return; //Logger.warn("Insert location of component <" + $name + "></" + $name + "> not found.");

    if (!component.isReady)
      return Logger.error("The <" + $name + "></" + $name + "> component is not ready yet to be inserted.");

    // Component Creation
    if ((component.keepAlive ?? false) === false || isNull(component.el)) {
      createEl('body', htmlSnippet => {
        htmlSnippet.innerHTML = component.template!;
        forEach([].slice.apply(htmlSnippet.querySelectorAll('script')), script => {
          component.scripts.push(script);
          htmlSnippet.removeChild(script);
        });

        forEach([].slice.apply(htmlSnippet.querySelectorAll('link[rel="stylesheet"]')),
          style => {
            component.styles.push(style);
            htmlSnippet.removeChild(style);
          });

        forEach([].slice.apply(htmlSnippet.querySelectorAll('style')),
          style => {
            component.styles.push(style);
            htmlSnippet.removeChild(style);
          });

        if (htmlSnippet.children.length === 0)
          return Logger.error("The component <" + $name + "></" + $name + "> seems to be empty or it has not a root element." +
            "eg.: <div></div>, to be included.");

        if (htmlSnippet.children.length > 1)
          return Logger.error("The component <" + $name + "></" + $name + "> seems to have multiple root element, it must have" +
            " only one root.");

        component.el = htmlSnippet.children[0];
        component.emit('created');
      });
    }

    let rootElement = component.el!;
    // tranfering the attributes
    forEach([].slice.call(element.attributes), (attr: Attr) => {
      element.removeAttribute(attr.name);
      if (attr.nodeName === 'class')
        return element.classList.forEach(cls => {
          rootElement.classList.add(cls);
        });

      if (attr.nodeName === 'data') {
        const mData = IoC.Resolve<Evalutator>('Evalutator')!
          .exec({
            data: data,
            expression: trim(attr.value) !== '' ? attr.value : 'this.data',
          })
        return forEach(Object.keys(mData), key => {
          transferProperty(component.data, mData, key);
        });
      }

      rootElement.attributes.setNamedItem(attr);
    });

    component.emit('beforeMount');

    container.replaceChild(rootElement, element);

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
        IoC.Resolve<Evalutator>('Evalutator')!
          .execRaw(scriptContent || '', component);
        component.emit('mounted');

        // TODO: Something between this two events

        component.emit('beforeLoad');

        IoC.Resolve<HtmlHandler>('HtmlHandler')!
          .compile({
            data: component.data,
            el: rootElement,
            onDone: () => component.emit('loaded')
          });

        Observer.observe(container, () => {
          if (rootElement.isConnected) return;
          component.destroy();
        });
      } catch (error) {
        Logger.error("Error in <" + $name + "></" + $name + "> component.");
        Logger.error(buildError(error));
      }
    }

    if (component.scripts.length === 0)
      return compile();

    // Mixing all the scripts
    const localScriptsContent: string[] = [],
      webRequestChecker: any = {},
      onlineScriptsContent: string[] = [],
      onlineScriptsUrls: string[] = [];
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
          component.emit('failed');
        });
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
}
