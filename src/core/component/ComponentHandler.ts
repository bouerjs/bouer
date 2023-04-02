import IComponentOptions from '../../definitions/interfaces/IComponentOptions';
import ILifeCycleHooks from '../../definitions/interfaces/ILifeCycleHooks';
import ComponentClass from '../../definitions/types/ComponentClass';
import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';
import Constants from '../../shared/helpers/Constants';
import Extend from '../../shared/helpers/Extend';
import Prop from '../../shared/helpers/Prop';
import IoC from '../../shared/helpers/IoCContainer';
import Task from '../../shared/helpers/Task';
import {
  $CreateAnyEl,
  $CreateEl,
  buildError,
  code,
  DOM,
  fnCall,
  forEach,
  findDirective,
  ifNullReturn,
  isFunction,
  isNull,
  isObject,
  pathResolver, toArray,
  toLower,
  urlCombine,
  urlResolver,
  webRequest,
  where,
  copyObject
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Base from '../Base';
import Compiler from '../compiler/Compiler';
import DelimiterHandler from '../DelimiterHandler';
import Evaluator from '../Evaluator';
import EventHandler from '../event/EventHandler';
import ReactiveEvent from '../event/ReactiveEvent';
import Reactive from '../reactive/Reactive';
import Routing from '../routing/Routing';
import Component from './Component';

export default class ComponentHandler extends Base {
  private bouer: Bouer;
  // Handle all the components web requests to avoid multiple requests
  private requests: dynamic = {};
  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  evaluator: Evaluator;
  components: { [key: string]: Component | IComponentOptions } = {};
  // Avoids adding multiple styles of the same component if it's already in use
  stylesController: { [key: string]: { styles: Element[], elements: Element[] }, } = {};
  activeComponents: Component[] = [];

  constructor(
    bouer: Bouer,
    delimiterHandler: DelimiterHandler,
    eventHandler: EventHandler,
    evaluator: Evaluator
  ) {
    super();

    this.bouer = bouer;
    this.delimiter = delimiterHandler!;
    this.eventHandler = eventHandler!;
    this.evaluator = evaluator!;
  }

  check(nodeName: string) {
    return (nodeName in this.components);
  }

  request(path: string, response: {
    success: (content: string, url: string) => void,
    fail: (error: any, url: string) => void
  }) {
    if (!isNull(this.requests[path]))
      return this.requests[path].push(response);

    this.requests[path] = [response];

    const resolver = urlResolver(path);
    const hasBaseElement = DOM.head.querySelector('base') != null;
    const hasBaseURIInURL = resolver.baseURI === path.substring(0, resolver.baseURI.length);

    // Building the URL according to the main path
    const componentPath = urlCombine(hasBaseURIInURL ? resolver.origin : resolver.baseURI, resolver.pathname);

    webRequest(componentPath, { headers: { 'Content-Type': 'text/plain' } })
      .then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.text();
      })
      .then(content => {
        forEach(this.requests[path], (request: dynamic) => {
          request.success(content, path);
        });
        delete this.requests[path];
      })
      .catch(error => {
        if (!hasBaseElement)
          Logger.warn('It seems like you are not using the “<base href="/base/components/path/" />” ' +
            'element, try to add as the first child into “<head></head>” element.');
        forEach(this.requests[path], (request: dynamic) => request.fail(error, path));
        delete this.requests[path];
      });
  }

  prepare(
    components: (Component | IComponentOptions | ComponentClass)[],
    parent?: Component<any>
  ) {
    forEach(components, (entry, index) => {
      const isComponentClass = ((entry as ComponentClass).prototype instanceof Component);

      let component = entry as Component;
      if (isComponentClass) {
        // Resolve the instance of the class
        component = IoC.new(entry as ComponentClass)!;
        component.clazz = entry as ComponentClass;
      }

      if ((!component.path || isNull(component.path)) && (!component.template || isNull(component.template)))
        return Logger.warn('The component at options.components[' + index + '] has not valid “path” or “template” ' +
          'property defined, ' + 'then it was ignored.');

      if (isNull(component.name) || !component.name) {
        if (!component.path || isNull(component.path))
          return Logger.warn('Provide a “name” to component at options.components[' + index + '] position.');

        const pathSplitted = component.path.toLowerCase().split('/');
        let componentName = pathSplitted[pathSplitted.length - 1].replace('.html', '');

        // If the component name already exists generate a new one
        if (this.components[componentName]) {
          componentName = toLower(code(8, componentName + '-component-'));
        }

        component.name = componentName;
      }

      component.name = component.name.toLowerCase();
      let parentRoute = '';

      if (this.components[component.name!])
        return Logger.warn('The component name “' + component.name + '” is already define, try changing the name.');

      if (!isNull(parent)) {
        /** TODO: Inherit the parent info */
        parentRoute = parent!.route || '';
      }

      if (!isNull(component.route)) { // Completing the route
        component.route = '/' + urlCombine(parentRoute, component.route!);
      }

      if (Array.isArray(component.children))
        this.prepare(component.children, component);

      IoC.app(this.bouer).resolve(Routing)!
        .configure(this.components[component.name!] = component);

      const getContent = (path?: string) => {
        if (!path) return;

        this.request(component.path!, {
          success: content => {
            component.template = content;
          },
          fail: error => {
            Logger.error(buildError(error));
          }
        });
      };

      if (!isNull(component.prefetch)) {
        if (component.prefetch === true)
          return getContent(component.path);
        return;
      }

      if (!(component.prefetch = ifNullReturn(this.bouer.config.prefetch, true)))
        return;

      return getContent(component.path);
    });
  }

  order(componentElement: Element, data: object, onComponent?: (component: Component) => void) {
    const $name = toLower(componentElement.nodeName);
    const component = this.components[$name];

    if (!component) return Logger.error('No component with name “' + $name + '” registered.');

    const mainExecutionWrapper = () => {
      const resolveComponentInstance = (c: Component | IComponentOptions) => {
        let mCom: Component;

        if ((c instanceof Component) && (c as Component).clazz)
          mCom = IoC.new(c.clazz!)!;
        else if (c instanceof Component)
          mCom = copyObject(c);
        else
          mCom = new Component(c);

        if (mCom.keepAlive === true)
          this.components[$name] = mCom;

        mCom.template = c.template;
        mCom.bouer = this.bouer;
        return mCom;
      };

      if (component.template)
        return this.insert(componentElement, resolveComponentInstance(component)!, data, onComponent);

      if (!component.path)
        return Logger.error('Expected a valid value in `path` or `template` got invalid value at “' +
          $name + '” component.');

      this.addEvent('requested', componentElement, component, this.bouer)
        .emit();

      // Make component request or Add
      this.request(component.path, {
        success: content => {
          component.template = content;
          this.insert(componentElement, resolveComponentInstance(component)!, data, onComponent);
        },
        fail: (error) => {
          Logger.error('Failed to request <' + $name + '/> component with path “' +
            component.path + '”.');
          Logger.error(buildError(error));

          this.addEvent('failed', componentElement, component, this.bouer).emit();
        }
      });
    };

    // Checking the restrictions
    if (component.restrictions && component.restrictions!.length > 0) {
      const blockedRestrictions: Function[] = [];
      const restrictions = component.restrictions.map(restriction => {

        const restrictionResult = restriction.call(this.bouer, component);

        if (restrictionResult === false)
          blockedRestrictions.push(restriction);
        else if (restrictionResult instanceof Promise)
          restrictionResult
            .then(value => {
              if (value === false)
                blockedRestrictions.push(restriction);
            })
            .catch(() => blockedRestrictions.push(restriction));

        return restrictionResult;
      });

      const blockedEvent = this.addEvent('blocked', componentElement, component, this.bouer);
      const emitter = () => blockedEvent.emit({
        detail: {
          component: component.name,
          message: 'Component “' + component.name + '” blocked by restriction(s)',
          blocks: blockedRestrictions
        }
      });

      return Promise.all(restrictions)
        .then(restrictionValues => {
          if (restrictionValues.every(value => value == true))
            mainExecutionWrapper();
          else
            emitter();
        })
        .catch(() => emitter());
    }

    return mainExecutionWrapper();
  }

  find(predicate: (item: (Component<any> | IComponentOptions<any>)) => boolean) {
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (predicate(component)) return component;
    }
    return null;
  }

  /**
   * Subscribe the hooks of the instance
   * @param { Key } eventName the event name to be added
   * @param { Element } element the element to attach the event
   * @param { any } component the component object
   * @param { object } context the context of the compilation process
   */
  addEvent<Key extends keyof ILifeCycleHooks>(
    eventName: Key,
    element: Element,
    component: any,
    context?: object
  ) {
    const callback = (component as any)[eventName];

    if (typeof callback === 'function')
      this.eventHandler.on({
        eventName,
        callback: evt => callback.call(context || component, evt),
        attachedNode: element,
        modifiers: { once: true },
        context: context || component
      });

    const emitter = (init: any) => {
      this.eventHandler.emit({
        attachedNode: element,
        once: true,
        eventName,
        init
      });

      this.eventHandler.emit({
        eventName: 'component:' + eventName,
        init: { detail: { component: component } },
        once: true
      });
    };

    return { emit: (init?: CustomEventInit) => emitter(init) };
  }

  insert(
    componentElement: Element,
    component: Component<any>,
    data: object,
    onComponent?: (component: Component) => void
  ) {
    const $name = toLower(componentElement.nodeName);
    const container = componentElement.parentElement;
    const compiler = IoC.app(this.bouer).resolve(Compiler)!;

    if (!container)
      return;

    if (isNull(component.template))
      return Logger.error('The <' + $name + '/> component is not ready yet to be inserted.');

    if (!compiler.analize(component.template!))
      return;

    // Adding the component to the active component list if it is not added
    if (!this.activeComponents.includes(component))
      this.activeComponents.push(component);

    const elementSlots = $CreateAnyEl('SlotContainer', el => {
      el.innerHTML = componentElement.innerHTML;
      componentElement.innerHTML = '';
    }).build();

    const isKeepAlive = componentElement.hasAttribute('keep-alive') || ifNullReturn(component.keepAlive, false);
    // Component Creation
    if (isKeepAlive === false || isNull(component.el)) {
      $CreateEl('body', htmlSnippet => {
        htmlSnippet.innerHTML = component.template!;

        forEach([].slice.call(htmlSnippet.children), (asset: any) => {
          if (['SCRIPT', 'LINK', 'STYLE'].indexOf(asset.nodeName) === -1)
            return;

          component.assets.push(asset);
          htmlSnippet.removeChild(asset);
        });

        if (htmlSnippet.children.length === 0)
          return Logger.error(('The component <' + $name + '/> seems to be empty or it ' +
            'has not a root element. Example: <div></div>, to be included.'));

        if (htmlSnippet.children.length > 1)
          return Logger.error(('The component <' + $name + '/> seems to have multiple ' +
            'root element, it must have only one root.'));

        component.el = htmlSnippet.children[0];
      });
    }

    const rootElement = component.el!;

    if (isNull(rootElement)) return;

    // Adding the listeners
    const createdEvent = this.addEvent('created', rootElement, component);
    const beforeMountEvent = this.addEvent('beforeMount', rootElement, component);
    const mountedEvent = this.addEvent('mounted', rootElement, component);
    const beforeLoadEvent = this.addEvent('beforeLoad', rootElement, component);
    const loadedEvent = this.addEvent('loaded', rootElement, component);
    this.addEvent('beforeDestroy', rootElement, component);
    this.addEvent('destroyed', rootElement, component);

    const scriptsAssets = where(component.assets, asset => asset.nodeName === 'SCRIPT');
    const initializer = (component as any).init;

    if (isFunction(initializer))
      fnCall(initializer.call(component));

    const processDataAttr = (attr: Attr) => {
      let inputData: dynamic = {};
      const mData = Extend.obj(data, { $data: data });

      // Listening to all the reactive properties
      const reactiveEvent = ReactiveEvent.on('AfterGet', reactive => {
        if (!(reactive.propName in inputData))
          inputData[reactive.propName] = undefined;
        Prop.set(inputData, reactive.propName, reactive);
      });

      // If data value is empty gets the main scope value
      if (attr.value === '')
        inputData = Extend.obj(this.bouer.data);
      else {
        // Otherwise, compiles the object provided
        const mInputData = IoC.app(this.bouer).resolve(Evaluator)!
          .exec({
            data: mData,
            code: attr.value,
            context: this.bouer
          });

        if (!isObject(mInputData))
          Logger.error(('Expected a valid Object Literal expression in “' + attr.nodeName +
            '” and got “' + attr.value + '”.'));
        else {
          // Adding all non-existing properties
          forEach(Object.keys(mInputData), key => {
            if (!(key in inputData))
              inputData[key] = mInputData[key];
          });
        }
      }

      reactiveEvent.off();
      inputData = Reactive.transform({
        context: component,
        data: inputData
      });

      forEach(Object.keys(inputData), key => {
        Prop.transfer(component.data, inputData, key);
      });
    };

    const compile = (scriptContent?: string) => {
      try {
        // Injecting data
        // If the component has does not have the data directive assigned, create it implicitly
        if (!(findDirective(componentElement, Constants.data)))
          componentElement.setAttribute('data', '$data');

        let dataAttr = null;
        // If the attr is `data`, prepare and inject the value into component `data`
        if (dataAttr = findDirective(componentElement, Constants.data)) {
          const attr = dataAttr as Attr;
          if (this.delimiter.run(attr.value).length !== 0) {
            Logger.error(('The “data” attribute cannot contain delimiter, source element: ' +
              '<' + $name + '/>.'));
          } else {
            processDataAttr(attr);
          }
          componentElement.removeAttribute(attr.name);
        }

        // Executing the mixed scripts
        IoC.app(this.bouer).resolve(Evaluator)!
          .execRaw((scriptContent || ''), component);

        createdEvent.emit();

        // tranfering the attributes
        forEach(toArray(componentElement.attributes), (attr: Attr) => {
          componentElement.removeAttribute(attr.name);

          // if the attr is the class, transfer the items to the root element
          if (attr.nodeName === 'class')
            return componentElement.classList.forEach(cls => {
              rootElement.classList.add(cls);
            });

          // sets the attr to the root element
          rootElement.attributes.setNamedItem(attr);
        });

        beforeMountEvent.emit();

        // Attaching the root element to the component element
        if (!('root' in componentElement))
          Prop.set((componentElement as any), 'root', { value: rootElement });

        // Mouting the element
        container.replaceChild(rootElement, componentElement);
        mountedEvent.emit();

        const rootClassList: any = {};

        // Retrieving all the classes of the root element
        rootElement.classList.forEach(key => rootClassList[key] = true);

        // Changing each selector to avoid conflits
        const changeSelector = (style: HTMLStyleElement | HTMLLinkElement, styleId: string) => {
          const rules: string[] = [];
          const isStyle = (style.nodeName === 'STYLE');

          if (!style.sheet) return;

          const cssRules = style.sheet.cssRules;

          for (let i = 0; i < cssRules.length; i++) {
            const rule = cssRules.item(i);

            if (!rule) continue;

            const mRule = rule as dynamic;
            const ruleText = mRule.selectorText;

            if (ruleText) {
              const firstRule = (ruleText as string).split(' ')[0];
              const selector = (firstRule[0] == '.' || firstRule[0] == '#')
                ? firstRule.substring(1) : firstRule;
              const separator = rootClassList[selector] ? '' : ' ';
              const uniqueIdentifier = '.' + styleId;
              const selectorTextSplitted = mRule.selectorText.split(' ');

              if (selectorTextSplitted[0] === toLower(rootElement.tagName))
                selectorTextSplitted.shift();

              mRule.selectorText = uniqueIdentifier + separator + selectorTextSplitted.join(' ');
            }

            // Adds the cssText only if the element is <style>
            if (isStyle) rules.push(mRule.cssText);
          }
          if (isStyle) style.innerText = rules.join(' ');
        };
        const stylesAssets = where(component.assets, asset => asset.nodeName !== 'SCRIPT');
        const styleAttrName = 'component-style';

        // Configuring the styles
        forEach(stylesAssets, asset => {
          const mStyle = asset.cloneNode(true) as Element;

          if (mStyle instanceof HTMLLinkElement) {
            const path = component.path[0] === '/' ? component.path.substring(1) : component.path;
            mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
            mStyle.rel = 'stylesheet';
          }

          // Checking if this component already have styles added
          if (this.stylesController[$name]) {
            const controller = this.stylesController[$name];

            if (controller.elements.indexOf(rootElement) > -1)
              return;

            controller.elements.push(rootElement);
            return forEach(controller.styles, $style => {
              rootElement.classList.add($style.getAttribute(styleAttrName) as string);
            });
          }

          const styleId = code(7, 'bouer-s');
          mStyle.setAttribute(styleAttrName, styleId);

          if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
            mStyle.onload = evt => changeSelector((evt.target! as HTMLLinkElement), styleId);

          this.stylesController[$name] = {
            styles: [DOM.head.appendChild(mStyle)],
            elements: [rootElement]
          };

          if (!mStyle.hasAttribute('scoped')) return;

          rootElement.classList.add(styleId);
          if (mStyle instanceof HTMLStyleElement)
            return changeSelector(mStyle, styleId);
        });

        beforeLoadEvent.emit();
        // Compiling the rootElement
        compiler.compile({
          data: Reactive.transform({ context: component, data: component.data }),
          onDone: () => {
            if (isFunction(onComponent))
              onComponent!(component);
            loadedEvent.emit();
          },
          componentSlot: elementSlots,
          context: component,
          el: rootElement,
        });

        const autoComponentDestroy = ifNullReturn(this.bouer.config.autoComponentDestroy, true);
        if (autoComponentDestroy === false) return;

        // Listening the component to be destroyed
        Task.run(stopTask => {
          if (component.el!.isConnected) return;

          if (this.bouer.isDestroyed)
            return stopTask();

          component.destroy();
          stopTask();

          const stylesController = this.stylesController[component.name];
          if (!stylesController)
            return;

          const index = stylesController.elements.indexOf(component.el!);
          stylesController.elements.splice(index, 1);

          if (stylesController.elements.length > 0 || container.isConnected)
            return;

          // No elements using the style
          forEach(stylesController.styles, style =>
            forEach(toArray(DOM.head.children), item => {
              if (item === style)
                return DOM.head.removeChild(style);
            }));

          delete this.stylesController[component.name];
        });
      } catch (error) {
        Logger.error('Error in <' + $name + '/> component.');
        Logger.error(buildError(error));
      }
    };

    if (scriptsAssets.length === 0)
      return compile();

    const localScriptsContent: string[] = [];
    const onlineScriptsContent: string[] = [];
    const onlineScriptsUrls: string[] = [];
    const webRequestChecker: any = {};

    // Grouping the online scripts and collecting the online url
    forEach(scriptsAssets as any, (script: HTMLScriptElement) => {
      if (script.src == '' || script.innerHTML)
        localScriptsContent.push(script.innerHTML);
      else {
        const path = component.path[0] === '/' ? component.path.substring(1) : component.path;
        script.src = pathResolver(path, script.getAttribute('src') || '');
        onlineScriptsUrls.push(script.src);
      }
    });

    // No online scripts detected
    if (onlineScriptsUrls.length == 0)
      return compile(localScriptsContent.join('\n\n'));

    // Load the online scripts and run it
    return forEach(onlineScriptsUrls, (url, index) => {
      webRequestChecker[url] = true;
      // Getting script content from a web request
      webRequest(url, {
        headers: { 'Content-Type': 'text/plain' }
      }).then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.text();
      }).then(text => {
        delete webRequestChecker[url];
        // Adding the scripts according to the defined order
        onlineScriptsContent[index] = text;

        // if there are not web requests compile the element
        if (Object.keys(webRequestChecker).length === 0)
          return compile(Extend.array(onlineScriptsContent, localScriptsContent).join('\n\n'));
      }).catch(error => {
        error.stack = '';
        Logger.error(('Error loading the <script src=\'' + url + '\'></script> in ' +
          '<' + $name + '/> component, remove it in order to be compiled.'));
        Logger.log(error);
      });
    });
  }
}