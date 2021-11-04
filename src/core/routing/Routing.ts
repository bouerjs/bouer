import Bouer from "../..";
import IoC from "../../shared/helpers/IoC";
import { createAnyEl, createEl, DOM, forEach, GLOBAL, isNull, toArray, trim, urlCombine, urlResolver } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import IComponent from "../../types/IComponent";
import ComponentHandler from "../component/ComponentHandler";

export default class Routing {
  bouer: Bouer;
  defaultPage: IComponent | null = null;
  notFoundPage: IComponent | null = null;
  routeView: Element | null = null;
  activeAnchors: HTMLAnchorElement[] = [];

  // Store `href` value of the <base /> tag
  base: string | null = null;

  constructor(bouer: Bouer) {
    IoC.Register(this);

    this.bouer = bouer;
    this.routeView = this.bouer.el.querySelector('[route-view]');
  }

  init() {
    if (isNull(this.routeView)) return;
    this.routeView!.removeAttribute('route-view');
    const base = DOM.head.querySelector('base');

    if (!base) return;
    const baseHref = (base.attributes as any)['href'];
    if (!baseHref)
      return Logger.error(("The href=\"/\" attribute is required in base element."));

    this.base = baseHref.value;

    if (this.defaultPage)
      this.navigate(DOM.location.href);

    // Listening to the page navigation
    GLOBAL.addEventListener('popstate', evt => {
      evt.preventDefault();
      this.navigate((evt.state || {}).url || DOM.location.href);
    });
  }

  navigate(url: string) {
    if (isNull(url))
      return Logger.log("Invalid url provided to the navigation method.");

    url = trim(url);

    const resolver = urlResolver(url);
    const usehash = (this.bouer.config || {}).usehash ?? true;
    let navigatoTo = (usehash ? resolver.hash : resolver.pathname).split('?')[0];

    // In case of: /about/me/, remove the last forward slash
    if (navigatoTo[navigatoTo.length - 1] === '/')
      navigatoTo = navigatoTo.substr(0, navigatoTo.length - 1);

    const page = this.toPage(navigatoTo);

    this.clear();
    if (!page) return; // Page Not Found and NotFound Page Not Defined

    // If it's not found and the url matches .html do nothing
    if (!page && url.endsWith('.html')) return;

    const componentElement = createAnyEl(page.name!)
      .appendTo(this.routeView!)
      .build();

    const routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route!);
    IoC.Resolve<ComponentHandler>('ComponentHandler')!
      .order(componentElement, {}, component => {
        component.on('loaded', () => {
          this.markActiveAnchors(routeToSet);
        });
      });

    // Document info configuration
    DOM.title = page.title || DOM.title;

    this.pushState(resolver.href, DOM.title);
  }

  pushState(url: string, title?: string) {
    url = urlResolver(url).href;
    GLOBAL.history.pushState({ url: url }, (title || ''), url);
  }

  popState(times: number) {
    if (isNull(times)) times = -1;
    GLOBAL.history.go(times);
  }

  toPage(url: string) {
    // Default Page
    if (url === '' || url === '/' ||
      url === "/" + urlCombine((this.base, "index.html"))) {
      return this.defaultPage;
    }

    // Search for the right page
    return IoC.Resolve<ComponentHandler>('ComponentHandler')!
      .find(component => {
        if (!component.route) return false;

        const routeRegExp = component.route!.replace(/{(.*?)}/gi, '[\\S\\s]{1,}');

        if (Array.isArray(new RegExp("^" + routeRegExp + "$").exec(url)))
          return true;

        return false;
      }) || this.notFoundPage;
  }

  markActiveAnchors(route: string) {
    const className = (this.bouer.config || {}).activeClassName || 'active-link';
    const anchors = this.bouer.el.querySelectorAll('a');

    forEach(this.activeAnchors, anchor =>
      anchor.classList.remove(className));

    this.activeAnchors = [];

    forEach(toArray(anchors), (anchor: HTMLAnchorElement) => {
      if (anchor.href !== route) return;
      if (!(anchor as any).markable) return;

      anchor.classList.add(className);
      this.activeAnchors.push(anchor);
    });
  }

  clear() {
    this.routeView!.innerHTML = '';
  }

  /**
   * Allow to configure the `Default Page` and `NotFound Page`
   * @param component the component to be checked
   */
  configure(component: IComponent) {
    if (component.isDefault === true && !isNull(this.defaultPage))
      return Logger.warn("There are multiple “Default Page” provided, check the “" + component.route + "” route.");

    if (component.isNotFound === true && !isNull(this.notFoundPage))
      return Logger.warn("There are multiple “NotFound Page” provided, check the “" + component.route + "” route.");

    if (component.isDefault === true)
      this.defaultPage = component;

    if (component.isNotFound === true)
      this.notFoundPage = component;
  }
}
