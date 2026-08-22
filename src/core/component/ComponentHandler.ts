import IAsset from '../../definitions/interfaces/IAsset';
import IComponentOptions from '../../definitions/interfaces/IComponentOptions';
import ILifeCycleHooks from '../../definitions/interfaces/ILifeCycleHooks';
import Constructor from '../../definitions/types/Constructor';
import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import Bouer from '../../instance/Bouer';
import Constants from '../../shared/helpers/Constants';
import Extend from '../../shared/helpers/Extend';
import IoC from '../../shared/helpers/IoCContainer';
import Prop from '../../shared/helpers/Prop';
import Task from '../../shared/helpers/Task';
import {
  buildError,
  code,
  createEl,
  DOM,
  findDirective,
  fnCallResolver,
  $default,
  forEach,
  ifNullReturn,
  isComputed,
  isFunction,
  isNull,
  isObject,
  isRef,
  pathResolver, toArray,
  toLower,
  trim,
  urlCombine,
  urlResolver,
  webRequest,
  where
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Compiler, { CompilationHooks } from '../compiler/Compiler';
import DelimiterHandler from '../DelimiterHandler';
import Evaluator from '../Evaluator';
import EventHandler from '../event/EventHandler';
import ReactiveEvent from '../event/ReactiveEvent';
import Reactive from '../reactive/Reactive';
import Ref from '../reactive/Ref';
import Routing from '../routing/Routing';
import DataStore from '../store/DataStore';
import Component from './Component';

type Class = Constructor<any>;

export default class ComponentHandler {
  readonly _IRT_ = true;
  private bouer: Bouer;

  // Handle all the components web requests to avoid multiple requests
  private requests: dynamic = {};

  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  evaluator: Evaluator;
  rounting: Routing;
  components: { [key: string]: Component | IComponentOptions } = {};
  // Avoids adding multiple styles of the same component if it's already in use
  stylesController: { [key: string]: { styles: Element[], elements: Element[] } } = {};
  activeComponents: Component[] = [];

  constructor(
    bouer: Bouer,
    delimiterHandler: DelimiterHandler,
    eventHandler: EventHandler,
    evaluator: Evaluator,
    routing: Routing
  ) {
    this.bouer = bouer;
    this.delimiter = delimiterHandler;
    this.eventHandler = eventHandler;
    this.evaluator = evaluator;
    this.rounting = routing;
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

    const baseElement = DOM.head.querySelector('base');
    const resolver = baseElement ?? urlResolver('/');
    // Building the URL according to the main path

    const componentPath = urlCombine(resolver.baseURI, path.replace(resolver.baseURI, ''));

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
        if (!baseElement)
          Logger.warn('It seems like you are not using the “<base href="/base/components/path/" />” ' +
            'element, try to add as the first child into “<head></head>” element.');
        forEach(this.requests[path], (request: dynamic) => request.fail(error, path));
        delete this.requests[path];
      });
  }

  prepare(
    components: (Component | IComponentOptions | Class)[],
    parent?: Component
  ) {
    forEach(components, (entry) => {
      const isComponentClass = ((entry as Class).prototype instanceof Component);

      let component = entry as Component;
      if (isComponentClass) {
        // Resolve the instance of the class
        component = IoC.app(this.bouer).resolve(entry as Class) || IoC.new(entry as Class)!;
        component.clazz = entry as Class;
      }

      // In case of no-named-component, creates a name
      if (isNull(component.name) || !component.name) {
        // Generate a random name
        (component as any).name = toLower(code(8, 'templ' + '-component-'));

        // But, if the component has a path, generate a beautiful name for it
        if (!isNull(component.path) || !component.path) {
          const pathSplitted = component.path.toLowerCase().split('/');
          let componentName = pathSplitted[pathSplitted.length - 1].replace('.html', '') || Component.name;

          // If the component name already exists generate a new one
          if (this.components[componentName]) {
            componentName = toLower(code(8, componentName + '-component-'));
          }

          (component as any).name = componentName;
        }
      }

      // Normalize the name
      (component as any).name = component.name.toLowerCase();
      let parentRoute = '';

      if (this.components[component.name!])
        return Logger.warn('The component name “' + component.name + '” is already define, ' +
          'try changing the “component.name” property.');

      if (!isNull(parent)) {
        /** TODO: Inherit the parent info */
        parentRoute = parent!.route || '';
      }

      if (!isNull(component.route)) { // Completing the route
        (component as any).route = '/' + urlCombine(parentRoute, component.route!);
      }

      if (Array.isArray(component.children))
        this.prepare(component.children, component);

      IoC.app(this.bouer).resolve(Routing)!
        .configure(this.components[component.name!] = component);

      const getContent = (path?: string) => {
        if (!path) return;

        this.request(component.path!, {
          success: content => {
            (component as any).template = content;
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

      if (!((component as any).prefetch = ifNullReturn(this.bouer.config.prefetch, true)))
        return;

      return getContent(component.path);
    });
  }

  order(options: {
    componentElement: Element,
    data: object,
    context: RenderContext,
    directivesToIgnore?: string[],
    beforeComponentLoad?: (element: Element) => void
    onComponentLoad: (component: Component) => void,
    onComponentFail: (element: Element) => void,
    compilationHooks?: CompilationHooks
  }) {
    const { componentElement, data, context, onComponentLoad } = options;
    const $name = toLower(componentElement.nodeName);
    const component = this.components[$name];
    const onComponentFail = options.onComponentFail || $default;

    if (!component) {
      onComponentFail(componentElement);
      return Logger.error('No component with name “' + $name + '” registered.');
    }

    const mainExecutionWrapper = () => {

      const resolveComponentInstance = (c: Component | IComponentOptions) => {
        let mComponent: any;

        if ((c instanceof Component) && (c as Component).clazz)
          mComponent = IoC.app(this.bouer).resolve(c.clazz!) || IoC.new(c.clazz!)!;
        else if (c instanceof Component)
          mComponent = structuredClone(c);
        else
          mComponent = new Component(c);

        if (mComponent.keepAlive === true)
          this.components[$name] = mComponent;

        mComponent.template = c.template;
        mComponent.bouer = this.bouer;
        mComponent.parent = context;

        return mComponent as Component;
      };

      const isGroupableComponent = !component.template && !component.path;

      if (component.template || isGroupableComponent)
        return this.insert({
          componentElement: componentElement,
          component: resolveComponentInstance(component)!,
          directiveToIgnore: options.directivesToIgnore,
          data: data,
          onComponentLoad: onComponentLoad,
          onComponentFail: onComponentFail,
          compilationHooks: options.compilationHooks
        });

      if (!component.path) {
        onComponentFail(componentElement);
        return Logger.error('Expected a valid value in `path` or `template` got invalid value at “' + $name + '” component.');
      }

      this.addEvent('requested', componentElement, component, this.bouer)
        .emit();

      // Make component request or Add
      this.request(component.path, {
        success: content => {
          (component as any).template = content;
          this.insert({
            componentElement: componentElement,
            component: resolveComponentInstance(component)!,
            data: data,
            onComponentLoad: onComponentLoad,
            onComponentFail: onComponentFail,
            directiveToIgnore: options.directivesToIgnore,
            compilationHooks: options.compilationHooks
          });
        },
        fail: (error) => {
          Logger.error('Failed to request <' + $name + '/> component with path “' +
            component.path + '”.');
          Logger.error(buildError(error));

          this.addEvent('failed', componentElement, component, this.bouer).emit();
          onComponentFail(componentElement);
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
      const emitFailEvent = () => blockedEvent.emit({
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
          else {
            onComponentFail(componentElement);
            emitFailEvent();
          }
        })
        .catch(() => emitFailEvent());
    }

    return mainExecutionWrapper();
  }

  find(predicate: (item: (Component | IComponentOptions)) => boolean) {
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
        init: { detail: { component: component } }
      });
    };

    return { emit: (init?: CustomEventInit) => emitter(init) };
  }

  insert(options: {
    componentElement: Element,
    component: Component,
    data: object,
    onComponentLoad: (component: Component) => void,
    onComponentFail: (element: Element) => void
    directiveToIgnore?: string[],
    compilationHooks?: CompilationHooks
  }) {
    const componentElement = options.componentElement;
    const component = options.component;
    const data = options.data;
    const onComponentLoad = options.onComponentLoad || $default;
    const onComponentFail = options.onComponentFail || $default;
    const directivesToIgnore = options.directiveToIgnore;

    const beforeCompile = options.compilationHooks?.beforeCompile || $default;
    const afterCompile = options.compilationHooks?.afterCompile || $default;

    const $name = toLower(componentElement.nodeName);
    const container = componentElement.parentElement;
    const compiler = IoC.app(this.bouer).resolve(Compiler)!;
    const context = component.parent;

    if (!container) {
      return onComponentFail(componentElement);
    }

    if (isNull(component.template)) {
      onComponentFail(componentElement);
      return Logger.error('The <' + $name + '/> component is not ready yet to be inserted.');
    }

    if (!compiler.analize(component.template!)) {
      return onComponentFail(componentElement);
    }

    // Adding the component to the active component list if it is not added
    if (this.activeComponents.indexOf(component) < 0)
      this.activeComponents.push(component);

    const slotContainer = createEl('SlotContainer', el => {
      el.innerHTML = componentElement.innerHTML;
      componentElement.innerHTML = '';
    }).build();

    const isKeepAlive = componentElement.hasAttribute('keep-alive') || ifNullReturn(component.keepAlive, false);
    // Component Creation
    if (isKeepAlive === false || isNull(component.el)) {
      createEl('body', htmlSnippet => {
        // If both .path and .template are invalid, it means that it's a groupable component
        const template = !component.path && !component.template ? '<div></div>' : component.template!;
        htmlSnippet.innerHTML = template;

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

    const mainComponentElement = component.el!;

    if (isNull(mainComponentElement)) return onComponentFail(componentElement);

    // Handling Slots
    if (slotContainer.childNodes.length > 0) {

      const hasSkippedParent = (child: Element): boolean => {
        if (child.hasAttribute(Constants.skip)) return true;
        const parent = child.parentElement;
        if (parent == null) return false;
        return hasSkippedParent(parent);
      };

      // # slot[default]
      const slotContainerChildren = toArray(slotContainer.children);
      const slotDefaults = toArray(mainComponentElement.querySelectorAll('slot[default]'));
      // Looping all the slots defaults target
      forEach(slotDefaults, (slotTarget: Node) => {
        if (hasSkippedParent(slotTarget as Element)) return;

        const slotTargetContainer = slotTarget.parentElement!;
        // Adding the children
        forEach(slotContainerChildren, (child: Node) => {
          slotTargetContainer.insertBefore(child.cloneNode(true), slotTarget);
        });

        // Removing the targets
        slotTargetContainer.removeChild(slotTarget);
      });

      // # div[slot='name'] || slot[slot=name]
      const slotNamed = toArray(mainComponentElement.querySelectorAll('slot[name]'));
      // Looping all the slots defaults target
      forEach(slotNamed, (slotTarget: Element) => {
        if (hasSkippedParent(slotTarget as Element)) return;
        const slotTargetContainer = slotTarget.parentElement!;
        const slotName = slotTarget.getAttribute('name');

        // Adding the children
        forEach(slotContainerChildren, (child: Element) => {
          if ( // slot[slot='name']
            child.nodeName.toLowerCase() == 'slot' &&
            child.getAttribute('slot') == slotName
          ) {
            // Adding the children
            forEach(toArray(child.childNodes), (child: Node) => {
              slotTargetContainer.insertBefore(child.cloneNode(true), slotTarget);
            });
          }

          if ( // div[slot='name']
            child.nodeName.toLowerCase() != 'slot' &&
            child.getAttribute('slot') == slotName
          ) {
            const inserted = slotTargetContainer.insertBefore(
              child.cloneNode(true), slotTarget
            ) as Element;
            inserted.removeAttribute('slot');
          }
        });

        // Removing the target
        slotTargetContainer.removeChild(slotTarget);
      });
    }

    // Transforming all unknown variables to reactive

    forEach(Object.keys(component), propName => {
      let prop = (component as any)[propName];

      // If it's a computed property, wrap it in a ref
      if (!isNull(prop) && isComputed(prop))
        prop = (component as any)[propName] = new Ref(prop);

      if (!isNull(prop) && isRef(prop))
        prop.__!(propName, component);
    });

    // Adding the listeners
    const createdEvent = this.addEvent('created', mainComponentElement, component);
    const beforeMountEvent = this.addEvent('beforeMount', mainComponentElement, component);
    const mountedEvent = this.addEvent('mounted', mainComponentElement, component);
    const beforeLoadEvent = this.addEvent('beforeLoad', mainComponentElement, component);
    const loadedEvent = this.addEvent('loaded', mainComponentElement, component);
    this.addEvent('beforeDestroy', mainComponentElement, component);
    this.addEvent('destroyed', mainComponentElement, component);

    const scriptsAssets = where(component.assets, asset => asset.nodeName === 'SCRIPT');
    const initializer = component.init;

    if (isFunction(initializer))
      fnCallResolver(initializer!.call(component));

    const processDataAttr = (attr: Attr) => {
      // Listening to all the reactive properties
      const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
        if (!(descriptor.propName in inputData))
          inputData[descriptor.propName] = undefined;

        Prop.set(inputData, descriptor.propName, descriptor);
      });


      let inputData: dynamic = {};

      if (attr.value.trim() === '') {
        reactiveEvent.off();
        // Data to apply: {...Bouer.data, ...component.data}
        return Extend.obj(data, component.data);
      }

      // Otherwise, compiles the object provided
      const dataAttrValue = IoC.app(this.bouer).resolve(Evaluator)!
        .exec({
          data: Extend.obj(data, {
            $data: data,
            $scope: data,
            $navigate: data
          }),
          code: attr.value,
          context: context ?? this.bouer
        });

      if (!isObject(dataAttrValue))
        Logger.error('Expected a valid Object Literal expression in “' + attr.nodeName +
          '” and got “' + attr.value + '”.');
      else {
        // Adding all non-existing properties
        forEach(Object.keys(dataAttrValue), key => {
          if (!(key in inputData))
            inputData[key] = dataAttrValue[key];
        });
      }

      reactiveEvent.off();
      return Extend.obj(
        Reactive.transform({ context: component, data: inputData }),
        component.data
      );
    };

    const compile = (scriptContent?: string) => {
      try {

        let dataToUse: any = {};
        let dataAttr = null;

        // If the attr is `data`, prepare and inject the value into component `data`
        if (dataAttr = findDirective(componentElement, Constants.data)) {
          const attr = dataAttr as Attr;
          if (this.delimiter.run(attr.value).length !== 0) {
            Logger.error(('The “data” attribute cannot contain delimiter, source element: ' + '<' + $name + '/>.'));
          } else {
            dataToUse = processDataAttr(attr);

            // Signinng the element with it's data
            IoC.app(this.bouer).resolve(DataStore)!.addNodeData(mainComponentElement, dataToUse);
          }

          componentElement.removeAttribute(attr.name);
        } else {
          dataToUse = component.data;
        }

        // Executing the mixed scripts
        IoC.app(this.bouer).resolve(Evaluator)!
          .execRaw((scriptContent || ''), component);

        createdEvent.emit();

        // tranfering the attributes
        forEach(toArray(componentElement.attributes), (attr: Attr) => {
          // if the attr is the class, transfer the items to the root element
          if (attr.nodeName === 'class')
            return componentElement.classList.forEach(cls => {
              mainComponentElement.classList.add(cls);
            });

          if (Constants.silent == attr.name) return;
          // sets the attr to the root element
          mainComponentElement.setAttribute(attr.name, attr.value);
        });

        beforeMountEvent.emit();

        // Attaching the root element to the component element
        if (!('root' in componentElement))
          Prop.set(componentElement, 'root', { value: mainComponentElement });

        // Mouting the element
        container.replaceChild(mainComponentElement, componentElement);
        mountedEvent.emit();

        const rootClassList: any = {};

        // Retrieving all the classes of the root element
        mainComponentElement.classList.forEach(key => rootClassList[key] = true);

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
            // .item .title, .item .desc
            const ruleText = mRule.selectorText;

            if (ruleText) {
              const classStyleId = '.' + styleId;

              /**
               * From: [.item .title, .item .desc]
               *
               * To: [
               *  .item.e-A1bcD .title,
               *  .e-A1bcD .item .title,
               *  .item.e-A1bcD .desc
               *  .e-A1bcD .item .desc
               * ]
               */
              mRule.selectorText = ruleText.split(',')
                .flatMap(($selector: string) => {
                  const $selectors = $selector.split(' ');
                  $selectors[0] = $selectors[0] + classStyleId;
                  return [$selectors.join(' '), classStyleId + ' ' + $selector];
                })
                .join(',');
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

            if (controller.elements.indexOf(mainComponentElement) > -1)
              return;

            controller.elements.push(mainComponentElement);
            return forEach(controller.styles, $style => {
              mainComponentElement.classList.add($style.getAttribute(styleAttrName) as string);
            });
          }

          const styleId = code(8, 'e-');
          mStyle.setAttribute(styleAttrName, styleId);

          if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
            mStyle.onload = evt => changeSelector((evt.target! as HTMLLinkElement), styleId);

          this.stylesController[$name] = {
            styles: [DOM.head.appendChild(mStyle)],
            elements: [mainComponentElement]
          };

          if (!mStyle.hasAttribute('scoped')) return;

          mainComponentElement.classList.add(styleId);
          if (mStyle instanceof HTMLStyleElement)
            return changeSelector(mStyle, styleId);
        });

        beforeLoadEvent.emit();
        // Compiling the rootElement
        compiler.compile({
          el: mainComponentElement,
          context: component,
          data: Reactive.transform({ context: component, data: dataToUse }),
          directivesToIgnore: directivesToIgnore,

          beforeCompile: beforeCompile,
          afterCompile: afterCompile,

          onComponentLoad: () => {
            onComponentLoad(component);
            loadedEvent.emit();

            if (!this.rounting.routeView) {
              const routeView = mainComponentElement.hasAttribute('route-vew') ?
                mainComponentElement : mainComponentElement.querySelector('[route-view]');

              if (routeView) this.rounting.setRouteView(routeView!);
            }
          }
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
        onComponentFail(componentElement);
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
        Logger.error(error);
        onComponentFail(componentElement);
      });
    });
  }

  /**
   * Adds assets to the component
   * @param {string|object} assets the list of assets to be included
   */
  static prepareAssets(
    component: Component, assets: (IAsset | string)[]
  ) {
    const $Assets: any[] = [];
    const assetsTypeMapper: dynamic = {
      js: 'script',
      css: 'link',
      scss: 'link',
      sass: 'link',
      less: 'link',
      styl: 'link',
      style: 'link',
    };

    const isValidAssetSrc = (src: string, index: number) => {
      const isValid = (src || trim(src)) ? true : false;
      if (!isValid) Logger.error('Invalid asset “src”, in assets[' + index + '].src');
      return isValid;
    };

    const assetTypeGetter = (src: string, index: number) => {
      const srcSplitted = src.split('.');
      const type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];

      if (!type) return Logger.error('Couldn\'t find out what type of asset it is, provide ' +
        'the “type” explicitly at assets[' + index + '].type');

      return type;
    };

    forEach(assets, (asset, index) => {
      let src = '';
      let type = '';
      let scoped = true;

      if (typeof asset === 'string') { // String type
        if (!isValidAssetSrc(asset, index)) return;
        type = assetTypeGetter(trim(src = asset.replace(/\.less|\.s[ac]ss|\.styl/i, '.css')), index);
      } else { // Object Type
        if (!isValidAssetSrc(trim(src = asset.src.replace(/\.less|\.s[ac]ss\.styl/i, '.css')), index)) return;

        if (!asset.type) {
          if (!(type = assetTypeGetter(src, index))) return;
        } else {
          type = assetsTypeMapper[toLower(asset.type)] || asset.type;
        }

        scoped = ifNullReturn(asset.scoped, true);
      }

      const isRelativePathImport = src[0] === '.';

      if (isRelativePathImport && (!component.path || isNull(component.path))) {
        Logger.warn('Component with no `path` cannot use imported assets, check component: ' + component.path);
        return;
      }

      if (isRelativePathImport) {
        const pathSections = component.path.split('/').slice(0, -1);
        if (pathSections[0] === '') pathSections.shift();
        src = pathSections.join('/') + src.substring(1, src.length);
      }

      const $Asset = createEl(type, el => {
        if (ifNullReturn(scoped, true))
          el.setAttribute('scoped', 'true');

        switch (toLower(type)) {
          case 'script': el.setAttribute('src', src); break;
          case 'link':
            el.setAttribute('href', src);
            el.setAttribute('rel', 'stylesheet');
            el.setAttribute('type', 'text/css');
            break;
          default: el.setAttribute('src', src); break;
        }
      }).build();

      $Assets.push($Asset);
    });

    component.assets.splice(0, component.assets.length);
    component.assets.push.apply(component.assets, $Assets);
  }

  /**
   * Dispatch an event of the component
   * @param {string} eventName the event name
   * @param {object?} init the CustomEventInit object where we can provid the event detail
   */
  emit<TKey extends keyof ILifeCycleHooks>(
    component: Component,
    eventName: TKey,
    init?: CustomEventInit
  ) {
    IoC.app(this.bouer!).resolve(EventHandler)!.emit({
      eventName: eventName,
      attachedNode: component.el!,
      init: init
    });
  }
}