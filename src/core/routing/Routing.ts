import IComponentOptions from "../../definitions/interfaces/IComponentOptions";
import Bouer from "../../instance/Bouer";
import IoC from "../../shared/helpers/IoC";
import { createAnyEl, DOM, forEach, GLOBAL, isNull, toArray, trim, urlCombine, urlResolver } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Base from "../Base";
import Component from "../component/Component";
import ComponentHandler from "../component/ComponentHandler";

export default class Routing extends Base {
	bouer: Bouer;
	defaultPage?: Component | IComponentOptions<any> = undefined;
	notFoundPage?: Component | IComponentOptions<any> = undefined;
	routeView: Element | null = null;
	activeAnchors: HTMLAnchorElement[] = [];

	// Store `href` value of the <base /> tag
	base: string | null = null;

	constructor(bouer: Bouer) {
		super();

		this.bouer = bouer;
		this.routeView = this.bouer.el.querySelector('[route-view]');

		IoC.Register(this);
	}

	init() {
		if (isNull(this.routeView)) return;
		this.routeView!.removeAttribute('route-view');
		this.base = "/";

		const base = DOM.head.querySelector('base');
		if (base) {
			const baseHref = base.attributes.getNamedItem('href');
			if (!baseHref)
				return Logger.error("The href=\"/\" attribute is required in base element.");
			this.base = baseHref.value;
		}

		if (this.defaultPage)
			this.navigate(DOM.location.href);

		// Listening to the page navigation
		GLOBAL.addEventListener('popstate', evt => {
			evt.preventDefault();
			this.navigate((evt.state || location.href), false);
		});
	}

	/**
	 * Navigates to a certain page without reloading all the page
	 * @param route the route to navigate to
	 * @param changeUrl allow to change the url after the navigation, default value is `true`
	 */
	navigate(route: string, changeUrl?: boolean) {
		if (!this.routeView)
			return;

		if (isNull(route))
			return Logger.log("Invalid url provided to the navigation method.");

		route = trim(route);

		const resolver = urlResolver(route);
		const usehash = this.bouer.config.usehash ?? true;
		let navigatoTo = (usehash ? resolver.hash : resolver.pathname).split('?')[0];

		// In case of: /about/me/, remove the last forward slash
		if (navigatoTo[navigatoTo.length - 1] === '/')
			navigatoTo = navigatoTo.substring(0, navigatoTo.length - 1);

		const page = this.toPage(navigatoTo);

		this.clear();
		if (!page) return; // Page Not Found and NotFound Page Not Defined

		// If it's not found and the url matches .html do nothing
		if (!page && route.endsWith('.html')) return;

		const componentElement = createAnyEl(page.name!, el => {
			// Inherit the data scope by default
			el.setAttribute('data', '$data');
		}).appendTo(this.routeView!)
			.build();

		// Document info configuration
		DOM.title = page.title || DOM.title;

		if ((changeUrl ?? true))
			this.pushState(resolver.href, DOM.title);

		const routeToSet = urlCombine(resolver.baseURI, (usehash ? '#' : ''), page.route!);
		IoC.Resolve<ComponentHandler>(this.bouer, ComponentHandler)!
			.order(componentElement, this.bouer.data , component => {
				component.on('loaded', () => {
					this.markActiveAnchorsWithRoute(routeToSet);
				});
			});
	}

	pushState(url: string, title?: string) {
		url = urlResolver(url).href;
		if (DOM.location.href === url) return;
		GLOBAL.history.pushState(url, (title || ''), url);
	}

	popState(times?: number) {
		if (isNull(times)) times = -1;
		GLOBAL.history.go(times);
	}

	private toPage(url: string) {
		// Default Page
		if (url === '' || url === '/' ||
			url === "/" + urlCombine((this.base, "index.html"))) {
			return this.defaultPage;
		}

		// Search for the right page
		return IoC.Resolve<ComponentHandler>(this.bouer, ComponentHandler)!
			.find(component => {
				if (!component.route) return false;

				const routeRegExp = component.route!.replace(/{(.*?)}/gi, '[\\S\\s]{1,}');

				if (Array.isArray(new RegExp("^" + routeRegExp + "$").exec(url)))
					return true;

				return false;
			}) || this.notFoundPage;
	}

	markActiveAnchorsWithRoute(route: string) {
		const className = this.bouer.config.activeClassName || 'active-link';
		const anchors = this.bouer.el.querySelectorAll('a');

		forEach(this.activeAnchors, anchor =>
			anchor.classList.remove(className));

		forEach([].slice.call(this.bouer.el.querySelectorAll('a.' + className)), (anchor: HTMLAnchorElement) =>
			anchor.classList.remove(className));

		this.activeAnchors = [];

		forEach(toArray(anchors), (anchor: HTMLAnchorElement) => {
			if (anchor.href.split('?')[0] !== route.split('?')[0])
				return;

			anchor.classList.add(className);
			this.activeAnchors.push(anchor);
		});
	}

	markActiveAnchor(anchor: HTMLAnchorElement) {
		const className = this.bouer.config.activeClassName || 'active-link';

		forEach(this.activeAnchors, anchor =>
			anchor.classList.remove(className));
		forEach([].slice.call(this.bouer.el.querySelectorAll('a.' + className)), (anchor: HTMLAnchorElement) =>
			anchor.classList.remove(className));

		anchor.classList.add(className);
		this.activeAnchors = [anchor];
	}

	clear() {
		this.routeView!.innerHTML = '';
	}

	/**
	 * Allow to configure the `Default Page` and `NotFound Page`
	 * @param component the component to be checked
	 */
	configure<Data>(component: IComponentOptions<Data>) {
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