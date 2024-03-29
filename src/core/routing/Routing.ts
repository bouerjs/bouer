import IComponentOptions from '../../definitions/interfaces/IComponentOptions';
import Bouer from '../../instance/Bouer';
import IoC from '../../shared/helpers/IoCContainer';
import {
  createAnyEl,
  DOM,
  forEach,
  WIN,
  ifNullReturn,
  isNull,
  isObject,
  toArray,
  trim,
  urlCombine,
  urlResolver,
  ifNullStop
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Component from '../component/Component';
import ComponentHandler from '../component/ComponentHandler';

export default class Routing {
  readonly _IRT_ = true;
  bouer: Bouer;
  defaultPage?: Component | IComponentOptions;
  notFoundPage?: Component | IComponentOptions;
  routeView: Element | null = null;
  activeAnchors: HTMLAnchorElement[] = [];

  // Store `href` value of the <base /> tag
  base: string | null = null;

  constructor(bouer: Bouer) {
    this.bouer = bouer;
  }

  /** Initialize the routing the instance */
  init() {
    this.routeView = ifNullStop(this.bouer.el).querySelector('[route-view]');

    if (isNull(this.routeView)) return;
    this.routeView!.removeAttribute('route-view');
    this.base = '/';

    const base = DOM.head.querySelector('base');
    if (base) {
      const baseHref = base.attributes.getNamedItem('href');
      if (!baseHref)
        return Logger.error('The href="/" attribute is required in base element.');
      this.base = baseHref.value;
    }

    if (this.defaultPage)
      this.navigate(DOM.location.href);

    // Listening to the page navigation
    WIN.addEventListener('popstate', evt => {
      evt.preventDefault();
      this.navigate(((evt.state || {}).url || location.href), {
        setURL: false
      });
    });
  }

  /**
   * Navigates to a certain page without reloading all the page
   * @param {string} route the route to navigate to
   * @param {object?} options navigation options
   */
  navigate(route: string, options?: {
    setURL?: boolean,
    data?: object
  }) {
    if (!this.routeView)
      return;

    if (isNull(route))
      return Logger.log('Invalid url provided to the navigation method.');

    route = trim(route);

    const resolver = urlResolver(route);
    const usehash = ifNullReturn(this.bouer.config.usehash, true);
    let navigatoTo = (usehash ? resolver.hash : resolver.pathname).split('?')[0];

    options = options || {};

    // In case of: /about/me/, remove the last forward slash
    if (navigatoTo[navigatoTo.length - 1] === '/')
      navigatoTo = navigatoTo.substring(0, navigatoTo.length - 1);

    const page = this.toPage(navigatoTo);

    this.clear();
    if (!page) return; // Page Not Found or Page Not Defined

    // If it's not found and the url matches .html do nothing
    if (!page && route.endsWith('.html')) return;

    const componentElement = createAnyEl(page.name!, el => {
      // Inherit the data scope by default
      el.setAttribute('data', isObject(options!.data) ? JSON.stringify(options!.data) : '$data');
    }).appendTo(this.routeView!)
      .build();

    // Document info configuration
    DOM.title = page.title || DOM.title;

    if (ifNullReturn(options.setURL, true))
      this.pushState(resolver.href, DOM.title);

    const routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route!);
    IoC.app(this.bouer).resolve(ComponentHandler)!
      .order(componentElement, this.bouer.data, () => {
        this.markActiveAnchorsWithRoute(routeToSet);
      });
  }

  pushState(url: string, title?: string) {
    url = urlResolver(url).href;
    if (DOM.location.href === url) return;
    WIN.history.pushState({ url, title }, (title || ''), url);
  }

  popState(times?: number) {
    if (isNull(times)) times = -1;
    WIN.history.go(times);
  }

  private toPage(url: string) {
    // Default Page
    if (url === '' || url === '/' ||
      url === '/' + urlCombine((this.base, 'index.html'))) {
      return this.defaultPage;
    }

    // Search for the right page
    return IoC.app(this.bouer).resolve(ComponentHandler)!
      .find(component => {
        if (!component.route) return false;

        const routeRegExp = component.route!.replace(/{(.*?)}/gi, '[\\S\\s]{1,}');

        if (Array.isArray(new RegExp('^' + routeRegExp + '$', 'i').exec(url)))
          return true;

        return false;
      }) || this.notFoundPage;
  }

  markActiveAnchorsWithRoute(route: string) {
    const className = this.bouer.config.activeClassName || 'active-link';
    const appEl = ifNullStop(this.bouer.el);
    const anchors = appEl.querySelectorAll('a');

    if (isNull(route)) return;

    // Removing the active mark
    forEach(this.activeAnchors, anchor =>
      anchor.classList.remove(className));

    // Removing the active mark
    forEach([].slice.call(appEl.querySelectorAll('a.' + className)),
      (anchor: HTMLAnchorElement) =>
        anchor.classList.remove(className));

    this.activeAnchors = [];

    // Adding the className and storing all the active anchors
    forEach(toArray(anchors), (anchor: HTMLAnchorElement) => {
      if (anchor.href.split('?')[0] !== route.split('?')[0])
        return;

      anchor.classList.add(className);
      this.activeAnchors.push(anchor);
    });
  }

  markActiveAnchor(anchor: HTMLAnchorElement) {
    const className = this.bouer.config.activeClassName || 'active-link';
    if (isNull(anchor)) return;

    forEach(this.activeAnchors, anchor => anchor.classList.remove(className));
    forEach([].slice.call(ifNullStop(this.bouer.el)!.querySelectorAll('a.' + className)),
      (anchor: HTMLAnchorElement) => anchor.classList.remove(className));

    anchor.classList.add(className);
    this.activeAnchors = [anchor];
  }

  clear() {
    this.routeView!.innerHTML = '';
  }

  /**
   * Allow to configure the `Default Page` and `NotFound Page`
   * @param {Component|IComponentOptions} component the component to be checked
   */
  configure(component: Component | IComponentOptions) {
    if (component.isDefault === true && !isNull(this.defaultPage))
      return Logger.warn('There are multiple “Default Page” provided, check the “' + component.route + '” route.');

    if (component.isNotFound === true && !isNull(this.notFoundPage))
      return Logger.warn('There are multiple “NotFound Page” provided, check the “' + component.route + '” route.');

    if (component.isDefault === true)
      this.defaultPage = component;

    if (component.isNotFound === true)
      this.notFoundPage = component;
  }
}