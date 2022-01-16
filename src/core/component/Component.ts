import IAsset from "../../definitions/interfaces/IAsset";
import IComponentOptions from "../../definitions/interfaces/IComponentOptions";
import IEventSubscription from "../../definitions/interfaces/IEventSubscription";
import ILifeCycleHooks from "../../definitions/interfaces/ILifeCycleHooks";
import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import ServiceProvider from "../../shared/helpers/ServiceProvider";
import Prop from "../../shared/helpers/Prop";
import UriHandler from "../../shared/helpers/UriHandler";
import {
	createAnyEl, forEach, isObject, isString, toLower, trim, where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Base from "../Base";
import EventHandler from "../event/EventHandler";
import Reactive from "../reactive/Reactive";
export default class Component<Data = {}> extends Base implements IComponentOptions<Data>{
	name: string;
	path: string;
	data: Data;
	template?: string;
	keepAlive?: boolean;
	prefetch?: boolean = false;
	title?: string = undefined;
	route?: string = undefined;
	isDefault?: boolean = undefined;
	isNotFound?: boolean = undefined;
	isDestroyed: boolean = false;

	el?: Element = undefined;
	bouer?: Bouer = undefined;
	readonly children?: (Component | IComponentOptions<Data>)[] = [];
	readonly assets: (HTMLScriptElement | HTMLStyleElement | HTMLLinkElement)[] = [];
	readonly restrictions?: ((component: (Component | IComponentOptions<Data>)) => boolean | Promise<boolean>)[];
	// Store temporarily this component UI orders
	private events: IEventSubscription[] = [];

	constructor(optionsOrPath: string | IComponentOptions<Data>) {
		super();

		let _name: any = undefined;
		let _path: any = undefined;
		let _data: any = undefined;

		if (!isString(optionsOrPath)) {
			_name = (optionsOrPath as IComponentOptions<Data>).name;
			_path = (optionsOrPath as IComponentOptions<Data>).path;
			_data = (optionsOrPath as IComponentOptions<Data>).data;
			Object.assign(this, optionsOrPath);
		} else {
			_path = optionsOrPath;
		}

		this.name = _name;
		this.path = _path;
		this.data = Reactive.transform({
			context: this as any,
			inputObject: _data || {}
		});
	}

	// Hooks
	requested?(event: CustomEvent) { }
	created?(event: CustomEvent) { }
	beforeMount?(event: CustomEvent) { }
	mounted?(event: CustomEvent) { }
	beforeLoad?(event: CustomEvent) { }
	loaded?(event: CustomEvent) { }
	beforeDestroy?(event: CustomEvent) { }
	destroyed?(event: CustomEvent) { }
	blocked?(event: CustomEvent) { }
	failed?(event: CustomEvent) { }

	export<ExportableData>(
		exportedData: ExportableData
	) {
		if (!isObject(exportedData))
			return Logger.log("Invalid object for component.export(...), only \"Object Literal\" is allowed.");

		return forEach(Object.keys(exportedData), key => {
			(this.data as any)[key] = (exportedData as any)[key];
			Prop.transfer(this.data, exportedData, key);
		});
	}

	destroy() {
		if (!this.el) return false;

		if (this.isDestroyed && this.bouer && this.bouer.isDestroyed)
			return;

		if (!this.keepAlive)
			this.isDestroyed = true;

		this.emit('beforeDestroy');

		let container = this.el.parentElement;
		if (container) container.removeChild(this.el);

		// Destroying all the events attached to the this instance
		forEach(this.events, evt => this.off((evt.eventName as any), evt.callback));

		this.events = [];
		this.emit('destroyed');
	}

	params() {
		return new UriHandler().params(this.route);
	}

	emit<TKey extends keyof ILifeCycleHooks>(
		eventName: TKey,
		init?: CustomEventInit
	) {
		ServiceProvider.get<EventHandler>(this.bouer!, 'EventHandler')!.emit({
			eventName: eventName,
			attachedNode: this.el!,
			init: init
		})
	}

	on<TKey extends keyof ILifeCycleHooks>(
		eventName: TKey,
		callback: (event: CustomEvent) => void
	) {
		const context = (eventName == 'requested' || eventName == 'failed' || eventName == 'blocked') ? this.bouer! : this;
		const evt = ServiceProvider.get<EventHandler>(this.bouer!, 'EventHandler')!.on({
			eventName,
			callback: callback as any,
			attachedNode: this.el!,
			context: context as any
		});
		this.events.push(evt);
		return evt;
	}

	off<TKey extends keyof ILifeCycleHooks>(
		eventName: TKey, callback: (event: CustomEvent) => void
	) {
		ServiceProvider.get<EventHandler>(this.bouer!, 'EventHandler')!.off({
			eventName,
			callback: callback as any,
			attachedNode: this.el!
		});
		this.events = where(this.events, evt => !(evt.eventName == eventName && evt.callback == callback));
	}

	addAssets(assets: IAsset[]) {
		const $assets: any[] = [];
		const assetsTypeMapper: dynamic = {
			js: 'script',
			css: 'link',
			style: 'link'
		}
		forEach(assets, (asset, index) => {
			if (!asset.src || !trim(asset.src))
				return Logger.error('Invalid asset “src”, in assets[' + index + '].src');
			let type = '';

			if (!asset.type) {
				const srcSplitted = asset.src.split('.');
				type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];

				if (!type) return Logger.error("Couldn't find out what type of asset it is, provide " +
					"the “type” explicitly at assets[" + index + "].type");
			} else {
				asset.type = toLower(asset.type);
				type = assetsTypeMapper[asset.type] || asset.type;
			}

			const $asset = createAnyEl(type, el => {
				if (asset.scoped ?? true)
					el.setAttribute('scoped', 'true');

				switch (toLower(type)) {
					case 'script': el.setAttribute('src', asset.src); break;
					case 'link':
						el.setAttribute('href', asset.src);
						el.setAttribute('rel', 'stylesheet');
						el.setAttribute('type', 'text/css');
						break;
					default: el.setAttribute('src', asset.src); break;
				}
			}).build();

			$assets.push($asset);
		});

		this.assets.push.apply(this.assets, $assets);
	}
}