import Bouer from "../../instance/Bouer";
import IoC from "../../shared/helpers/IoC";
import UriHandler from "../../shared/helpers/UriHandler";
import {
	createEl,
	defineProperty,
	DOM,
	forEach, isObject, isString, transferProperty, where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import IComponent from "../../types/IComponent";
import ILifeCycleHooks from "../../types/ILifeCycleHooks";
import EventHandler, { EventSubscription } from "../event/EventHandler";
import Reactive from "../reactive/Reactive";
export default class Component implements IComponent {
	name: string;
	path: string;
	data?: object;
	template?: string;
	keepAlive?: boolean;
	title?: string = undefined;
	route?: string = undefined;
	isDefault?: boolean = undefined;
	isNotFound?: boolean = undefined;

	el?: Element = undefined;
	bouer?: Bouer = undefined;
	scripts: Array<HTMLScriptElement> = [];
	children?: (Component | IComponent)[] = [];
	styles: Array<HTMLStyleElement | HTMLLinkElement> = [];
	restrictions?: Array<((compoment: (Component | IComponent)) => boolean)> = [];

	// Store temporarily this component UI orders
	private events: EventSubscription[] = [];

	// Events
	beforeMount?(event: CustomEvent) { }
	mounted?(event: CustomEvent) { }
	beforeLoad?(event: CustomEvent) { }
	loaded?(event: CustomEvent) { }
	beforeDestroy?(event: CustomEvent) { }
	destroyed?(event: CustomEvent) { }
	blocked?(event: CustomEvent) { }

	constructor(optionsOrPath: string | IComponent) {
		let _name: any = undefined;
		let _path: any = undefined;

		if (!isString(optionsOrPath)) {
			_name = (optionsOrPath as IComponent).name;
			_path = (optionsOrPath as IComponent).path;
			Object.assign(this, optionsOrPath);
		} else {
			_path = optionsOrPath;
		}

		this.name = _name;
		this.path = _path;
		this.data = Reactive.transform(this.data || {});
	}

	export(options: object) {
		if (!isObject(options))
			return Logger.log("Invalid object for component.export(...), only \"Object Literal\" is allowed.");

		return forEach(Object.keys(options), key => {
			(this.data as any)[key] = (options as any)[key];
			transferProperty(this.data, options, key);
		});
	}

	destroy() {
		if (!this.el) return false;
		this.emit('beforeDestroy');

		let container = this.el.parentElement;
		if (container) container.removeChild(this.el) !== null;

		// Destroying all the events attached to the this instance
		forEach(this.events, evt => this.off((evt.eventName as any), evt.callback));
		this.events = [];

		this.emit('destroyed');
	}

	params() {
		return new UriHandler().params(this.route);
	}

	emit<TKey extends keyof ILifeCycleHooks>(eventName: TKey, init?: CustomEventInit) {
		IoC.Resolve<EventHandler>('EventHandler')!.emit({
			eventName: eventName,
			attachedNode: this.el!,
			init: init
		})
	}

	on<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: CustomEvent) => void) {
		const evt = IoC.Resolve<EventHandler>('EventHandler')!.on(eventName, callback as any, this.el!);
		this.events.push(evt);
		return evt;
	}

	off<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: CustomEvent) => void) {
		IoC.Resolve<EventHandler>('EventHandler')!.off(eventName, callback as any, this.el!);
		this.events = where(this.events, evt => !(evt.eventName == eventName && evt.callback == callback));
	}

	addCSS(styles: { href: string, scoped: boolean }[]) {
		const $styles = styles.map(item => {
			return createEl('link', el => {
				if (item.scoped ?? true)
					el.setAttribute('scoped', 'true');
				el.setAttribute('href', item.href);
				el.rel = "stylesheet";
			}).build();
		});
		this.styles.push.apply(this.styles, $styles);
	}
}
