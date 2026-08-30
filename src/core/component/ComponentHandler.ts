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
    $default,
    $internal,
    buildError,
    code,
    createEl,
    DOM,
    filter,
    findDirective,
    fnCallResolver,
    ifNullReturn,
    isFunction,
    isNull,
    isObject,
    pathResolver, toArray,
    toLower,
    urlCombine,
    urlResolver,
    webRequest
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Compiler, { CompilationHooks } from '../compiler/Compiler';
import DelimiterHandler from '../DelimiterHandler';
import Evaluator from '../Evaluator';
import EventHandler from '../event/EventHandler';
import { $reactive } from '../reactive/Reactive';
import ReactiveEvent from '../reactive/ReactiveEvent';
import Routing from '../routing/Routing';
import DataStore from '../store/DataStore';
import ComponentPrototype, { Component } from './Component';

type Class = Constructor<any>;

export default class ComponentHandler {
  private bouer: Bouer;

  // Handle all the components web requests to avoid multiple requests
  private requests: dynamic = {};

  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  evaluator: Evaluator;
  rounting: Routing;
  components: { [key: string]: Component | ComponentPrototype | IComponentOptions } = {};
  // Avoids adding multiple styles of the same component if it's already in use
  stylesController: { [key: string]: { styles: Element[], elements: Element[] } } = {};
  activeComponents: (Component | ComponentPrototype)[] = [];

  constructor(
    bouer: Bouer,
    delimiterHandler: DelimiterHandler,
    eventHandler: EventHandler,
    evaluator: Evaluator,
    routing: Routing
  ) {
    $internal(this);

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
        filter(this.requests[path], (request: dynamic) => {
          request.success(content, path);
        });
        delete this.requests[path];
      })
      .catch(error => {
        if (!baseElement)
          Logger.warn('It seems like you are not using the “<base href="/base/components/path/" />” ' +
            'element, try to add as the first child into “<head></head>” element.');
        filter(this.requests[path], (request: dynamic) => request.fail(error, path));
        delete this.requests[path];
      });
  }

  prepare(
    components: (Constructor<Component> | IComponentOptions)[],
    parent?: ComponentPrototype
  ) {
    filter(components, (entry) => {
      const isComponentClass = ((entry as Class).prototype instanceof Component);

      // Assuming that is a ComponentPrototype
      let $protoComponent = entry as IComponentOptions;
      let $classComponent: Component | undefined;

      // if it is a class
      if (isComponentClass) {
        // Resolve the instance of the class
        $classComponent = IoC.app(this.bouer).resolve(entry as Class) || IoC.resolve(entry as Class) || IoC.new(entry as Class);
        $protoComponent = $classComponent!.__$proto__;
        Prop.set($protoComponent, 'ctor', {
          configurable: false, enumerable: false, writable: false, value: entry as Class
        });
      }

      // In case of no-named-component, creates a name
      if (isNull($protoComponent.name)) {
        // But, if the component has a path, generate a beautiful name for it
        if (!isNull($protoComponent.path) || !$protoComponent.path) {
          const pathSplitted = $protoComponent.path!.toLowerCase().split('/');
          let componentName = pathSplitted[pathSplitted.length - 1].replace('.html', '') || Component.name;

          // If the component name already exists generate a new one
          if (this.components[componentName])
            componentName = toLower(code(8, componentName + '-component-'));

          ($protoComponent as any).name = componentName;
        } else {
          // Generate a random name
          ($protoComponent as any).name = toLower(code(8, 'templ' + '-component-'));
        }
      }

      // Normalize the name
      ($protoComponent as any).name = $protoComponent.name!.toLowerCase();
      let parentRoute = '';

      if (this.components[$protoComponent.name!])
        return Logger.warn('The component name “' + $protoComponent.name + '” is already define, ' +
          'try changing the “component.name” property.');

      if (!isNull(parent))
        // Inherit the parent info
        parentRoute = parent!.route || '';

      if (!isNull($protoComponent.route)) // Completing the route
        ($protoComponent as any).route = '/' + urlCombine(parentRoute, $protoComponent.route!);

      if (Array.isArray($protoComponent.children))
        this.prepare($protoComponent.children, $protoComponent as any);

      this.components[$protoComponent.name!] = $classComponent || $protoComponent;

      IoC.app(this.bouer).resolve(Routing)!
        .configure($protoComponent as any);

      const getContent = (path?: string) => {
        if (!path) return;

        this.request($protoComponent.path!, {
          success: content => {
            ($protoComponent as any).template = content;
          },
          fail: error => {
            Logger.error(buildError(error));
          }
        });
      };

      if ($protoComponent.prefetch === false)
        return;

      if ((($protoComponent as any).prefetch = ifNullReturn(this.bouer.config.prefetch, true)) == false)
        return;

      return getContent($protoComponent.path);
    });
  }

  order(options: {
    componentElement: Element,
    data: object,
    context: RenderContext,
    directivesToIgnore?: string[],
    beforeComponentLoad?: (element: Element) => void
    onComponentLoad: (component: ComponentPrototype) => void,
    onComponentFail: (element: Element) => void,
    compilationHooks?: CompilationHooks
  }) {
    const { componentElement, data, context, onComponentLoad } = options;
    const $name = toLower(componentElement.nodeName);
    const $component = this.components[$name];

    const getComponentOrOptions = (
      entry: Component | ComponentPrototype | IComponentOptions
    ): ComponentPrototype | IComponentOptions => {
      return entry instanceof Component
        ? entry.__$proto__
        : entry instanceof ComponentPrototype
          ? entry : entry;
    };

    const protoComponent = getComponentOrOptions($component);
    const onComponentFail = options.onComponentFail || $default;

    if (!protoComponent) {
      onComponentFail(componentElement);
      return Logger.error('No component with name “' + $name + '” registered.');
    }

    const mainExecutionWrapper = () => {
      const newComponent = (entry: Component | ComponentPrototype | IComponentOptions): Component | ComponentPrototype => {
        const configure = (proto: ComponentPrototype) => {
          proto.bouer = this.bouer;
          Prop.set(proto, 'parent', {
            // only assing the parent if is a component prototype
            value: context instanceof ComponentPrototype ? context : null
          });
          return proto;
        }

        const protoComponent = getComponentOrOptions(entry);

        // If the component is set has keep-alive, just return it
        if (protoComponent.keepAlive == true) {
          configure(protoComponent as ComponentPrototype);
          return entry as ComponentPrototype | Component;
        }

        let $protoComponent: ComponentPrototype;
        let $classComponent: Component | null = null;

        if (entry instanceof Component) {
          const ctor = entry.__$proto__.ctor
          const $newClassComponent: Component<any> = IoC.app(this.bouer).resolve(ctor) || IoC.resolve(ctor) || IoC.new(ctor)!;

          $classComponent = $newClassComponent;
          $protoComponent = $newClassComponent.__$proto__;

          $protoComponent.prepareClass($newClassComponent);
        } else {
          $protoComponent = new ComponentPrototype(entry);
        }

        if ($protoComponent.keepAlive === true)
          this.components[$name] = $protoComponent;

        configure($protoComponent as ComponentPrototype);
        return $classComponent || $protoComponent;
      };

      const isGroupableComponent = !protoComponent.template && !protoComponent.path;

      if (protoComponent.template || isGroupableComponent)
        return this.insert({
          componentElement: componentElement,
          component: newComponent($component)!,
          directiveToIgnore: options.directivesToIgnore,
          data: data,
          onComponentLoad: onComponentLoad,
          onComponentFail: onComponentFail,
          compilationHooks: options.compilationHooks
        });

      if (!protoComponent.path) {
        onComponentFail(componentElement);
        return Logger.error('Expected a valid value in `path` or `template` got invalid value at “' + $name + '” component.');
      }

      this.addEvent('requested', componentElement, protoComponent, this.bouer)
        .emit();

      // Make component request or Add
      this.request(protoComponent.path, {
        success: content => {
          (protoComponent as any).template = content;
          this.insert({
            componentElement: componentElement,
            component: newComponent($component)!,
            data: data,
            onComponentLoad: onComponentLoad,
            onComponentFail: onComponentFail,
            directiveToIgnore: options.directivesToIgnore,
            compilationHooks: options.compilationHooks
          });
        },
        fail: (error) => {
          Logger.error('Failed to request <' + $name + '/> component with path “' +
            protoComponent.path + '”.');
          Logger.error(buildError(error));

          this.addEvent('failed', componentElement, protoComponent, this.bouer).emit();
          onComponentFail(componentElement);
        }
      });
    };

    // Checking the restrictions
    if (protoComponent && protoComponent.restrictions && protoComponent.restrictions!.length > 0) {
      const blockedRestrictions: Function[] = [];
      const restrictions = protoComponent.restrictions.map(restriction => {

        const restrictionResult = restriction.call(this.bouer, protoComponent);

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

      const blockedEvent = this.addEvent('blocked', componentElement, protoComponent || $component, this.bouer);
      const emitFailEvent = () => {
        onComponentFail(componentElement);

        blockedEvent.emit({
          detail: {
            component: protoComponent || $component,
            message: 'Component “' + (protoComponent || $component).name + '” blocked by restriction(s)',
            blocks: blockedRestrictions
          }
        });
      }

      return Promise.all(restrictions)
        .then(restrictionValues => {
          if (restrictionValues.every(value => value == true))
            mainExecutionWrapper();
          else {
            emitFailEvent();
          }
        })
        .catch(() => emitFailEvent());
    }

    return mainExecutionWrapper();
  }

  find(predicate: (item: ComponentPrototype | IComponentOptions) => boolean) {
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const $component = this.components[keys[i]];
      const component = $component instanceof Component
        ? $component.__$proto__
        : $component instanceof ComponentPrototype ? $component :
          $component;
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
    component: Component | ComponentPrototype,
    data: object,
    onComponentLoad: (component: ComponentPrototype) => void,
    onComponentFail: (element: Element) => void
    directiveToIgnore?: string[],
    compilationHooks?: CompilationHooks
  }) {
    const componentElement = options.componentElement;

    const $classComponent = options.component;
    const $protoComponent = $classComponent instanceof Component
      ? $classComponent.__$proto__
      : $classComponent;

    const data = options.data || this.bouer.data;
    const onComponentLoad = options.onComponentLoad || $default;
    const onComponentFail = options.onComponentFail || $default;
    const directivesToIgnore = options.directiveToIgnore;

    const beforeCompile = options.compilationHooks?.beforeCompile || $default;
    const afterCompile = options.compilationHooks?.afterCompile || $default;

    const $name = toLower(componentElement.nodeName);
    const container = componentElement.parentElement;
    const compiler = IoC.app(this.bouer).resolve(Compiler)!;
    const context = $protoComponent.parent;

    if (!container) {
      return onComponentFail(componentElement);
    }

    if (isNull($protoComponent.template)) {
      onComponentFail(componentElement);
      return Logger.error('The <' + $name + '/> component is not ready yet to be inserted.');
    }

    if (!compiler.analize($protoComponent.template!)) {
      return onComponentFail(componentElement);
    }

    const slotContainer = createEl('SlotContainer', el => {
      el.innerHTML = componentElement.innerHTML;
      componentElement.innerHTML = '';
    }).build();

    const isKeepAlive = componentElement.hasAttribute('keep-alive') || ifNullReturn($protoComponent.keepAlive, false);
    // Component Creation
    if (isKeepAlive === false || !$protoComponent.el) {
      $protoComponent.el = createEl('body', htmlSnippet => {
        // If both .path and .template are invalid, it means that it's a groupable component
        const template = !$protoComponent.path && !$protoComponent.template ? '<div></div>' : $protoComponent.template!;
        htmlSnippet.innerHTML = template;

        filter([].slice.call(htmlSnippet.children), (asset: any) => {
          if (['SCRIPT', 'LINK', 'STYLE'].indexOf(asset.nodeName) === -1)
            return;

          $protoComponent.assets.push(asset);
          htmlSnippet.removeChild(asset);
        });

        if (htmlSnippet.children.length === 0)
          return Logger.error(('The component <' + $name + '/> seems to be empty or it ' +
            'has not a root element. Example: <div></div>, to be included.'));

        if (htmlSnippet.children.length > 1)
          return Logger.error(('The component <' + $name + '/> seems to have multiple ' +
            'root element, it must have only one root.'));
      }).child();
    }

    const mainComponentElement = $protoComponent.el!;

    if (!mainComponentElement) return onComponentFail(componentElement);

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
      filter(slotDefaults, (slotTarget: Node) => {
        if (hasSkippedParent(slotTarget as Element)) return;

        const slotTargetContainer = slotTarget.parentElement!;
        // Adding the children
        filter(slotContainerChildren, (child: Node) => {
          slotTargetContainer.insertBefore(child.cloneNode(true), slotTarget);
        });

        // Removing the targets
        slotTargetContainer.removeChild(slotTarget);
      });

      // # div[slot='name'] || slot[slot=name]
      const slotNamed = toArray(mainComponentElement.querySelectorAll('slot[name]'));
      // Looping all the slots defaults target
      filter(slotNamed, (slotTarget: Element) => {
        if (hasSkippedParent(slotTarget as Element)) return;
        const slotTargetContainer = slotTarget.parentElement!;
        const slotName = slotTarget.getAttribute('name');

        // Adding the children
        filter(slotContainerChildren, (child: Element) => {
          if ( // slot[slot='name']
            child.nodeName.toLowerCase() == 'slot' &&
            child.getAttribute('slot') == slotName
          ) {
            // Adding the children
            filter(toArray(child.childNodes), (child: Node) => {
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

    // Adding the listeners
    const createdEvent = this.addEvent('created', mainComponentElement, $protoComponent);
    const beforeMountEvent = this.addEvent('beforeMount', mainComponentElement, $protoComponent);
    const mountedEvent = this.addEvent('mounted', mainComponentElement, $protoComponent);
    const beforeLoadEvent = this.addEvent('beforeLoad', mainComponentElement, $protoComponent);
    const loadedEvent = this.addEvent('loaded', mainComponentElement, $protoComponent);
    this.addEvent('beforeDestroy', mainComponentElement, $protoComponent);
    this.addEvent('destroyed', mainComponentElement, $protoComponent);

    const scriptsAssets = filter($protoComponent.assets, asset => asset.nodeName === 'SCRIPT');
    const initializer = $protoComponent.init;

    if (isFunction(initializer))
      fnCallResolver(initializer!.call($protoComponent));

    const processDataAttr = (attr: Attr) => {
      // Listening to all the reactive properties
      const reactiveEvent = ReactiveEvent.on('AfterGet', descriptor => {
        if (!(descriptor.$name in inputData))
          inputData[descriptor.$name] = undefined;

        Prop.set(inputData, descriptor.$name, descriptor);
      });

      let inputData: dynamic = {};

      if (attr.value.trim() === '') {
        reactiveEvent.off();
        // Data to apply: {...Bouer.data, ...component.data}
        return data;
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
        filter(Object.keys(dataAttrValue), key => {
          if (!(key in inputData))
            inputData[key] = dataAttrValue[key];
        });
      }

      reactiveEvent.off();
      return inputData;
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
          }

          componentElement.removeAttribute(attr.name);
        } else {
          // if there is no data attr, use the component data mixed with the provided data
          dataToUse = Extend.obj($protoComponent.data, data);
        }

        $protoComponent.data = Extend.obj(dataToUse, $protoComponent.data);

        // Executing the mixed scripts
        IoC.app(this.bouer).resolve(Evaluator)!
          .eval((scriptContent || ''), $protoComponent);

        $reactive({
          context: $protoComponent,
          data: $protoComponent.data
        });

        // Signing the element with it's data
        IoC.app(this.bouer).resolve(DataStore)!.addNodeData(
          mainComponentElement,
          $protoComponent.data
        );

        createdEvent.emit();

        // tranfering the attributes
        filter(toArray(componentElement.attributes), (attr: Attr) => {
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

        // Adding the component to the active component list if it is not added
        if (this.activeComponents.indexOf($classComponent || $protoComponent) < 0)
          this.activeComponents.push($classComponent || $protoComponent);

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
        const stylesAssets = filter($protoComponent.assets, asset => asset.nodeName !== 'SCRIPT');
        const styleAttrName = 'component-style';

        // Configuring the styles
        filter(stylesAssets, asset => {
          const mStyle = asset.cloneNode(true) as Element;

          if (mStyle instanceof HTMLLinkElement) {
            const path = $protoComponent.path[0] === '/' ? $protoComponent.path.substring(1) : $protoComponent.path;
            mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
            mStyle.rel = 'stylesheet';
          }

          // Checking if this component already have styles added
          if (this.stylesController[$name]) {
            const controller = this.stylesController[$name];

            if (controller.elements.indexOf(mainComponentElement) > -1)
              return;

            controller.elements.push(mainComponentElement);
            return filter(controller.styles, $style => {
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
          context: $protoComponent,
          data: $protoComponent.data,
          directivesToIgnore: directivesToIgnore,

          beforeCompile: beforeCompile as any,
          afterCompile: afterCompile as any,

          onComponentLoad: () => {
            onComponentLoad($protoComponent);
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
          if ($protoComponent.el!.isConnected) return;

          if (this.bouer.isDestroyed)
            return stopTask();

          $protoComponent.destroy();
          stopTask();

          const stylesController = this.stylesController[$protoComponent.name];
          if (!stylesController)
            return;

          const index = stylesController.elements.indexOf($protoComponent.el!);
          stylesController.elements.splice(index, 1);

          if (stylesController.elements.length > 0 || container.isConnected)
            return;

          // No elements using the style
          filter(stylesController.styles, style =>
            filter(toArray(DOM.head.children), item => {
              if (item === style)
                return DOM.head.removeChild(style);
            }));

          delete this.stylesController[$protoComponent.name];
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
    filter(scriptsAssets as any, (script: HTMLScriptElement) => {
      if (script.src == '' || script.innerHTML)
        localScriptsContent.push(script.innerHTML);
      else {
        const path = $protoComponent.path[0] === '/' ? $protoComponent.path.substring(1) : $protoComponent.path;
        script.src = pathResolver(path, script.getAttribute('src') || '');
        onlineScriptsUrls.push(script.src);
      }
    });

    // No online scripts detected
    if (onlineScriptsUrls.length == 0)
      return compile(localScriptsContent.join('\n\n'));

    // Load the online scripts and run it
    return filter(onlineScriptsUrls, (url, index) => {
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
   * Dispatch an event of the component
   * @param {string} eventName the event name
   * @param {object?} init the CustomEventInit object where we can provid the event detail
   */
  emit<TKey extends keyof ILifeCycleHooks>(
    component: ComponentPrototype,
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