import IAsset from "../../definitions/interfaces/IAsset";
import IComponentOptions from "../../definitions/interfaces/IComponentOptions";
import IEventSubscription from "../../definitions/interfaces/IEventSubscription";
import ILifeCycleHooks from "../../definitions/interfaces/ILifeCycleHooks";
import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import Prop from "../../shared/helpers/Prop";
import ServiceProvider from "../../shared/helpers/ServiceProvider";
import UriHandler from "../../shared/helpers/UriHandler";
import {
	$CreateAnyEl, forEach, isObject, isString, toLower, trim, urlCombine, urlResolver, where
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
	title?: string;
	route?: string;
	isDefault?: boolean;
	isNotFound?: boolean;
	isDestroyed: boolean = false;

	el?: Element;
	bouer?: Bouer;
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

	export<ExportableData>(
		data: ExportableData
	) {
		if (!isObject(data))
			return Logger.log("Invalid object for component.export(...), only \"Object Literal\" is allowed.");

		return forEach(Object.keys(data), key => {
			(this.data as any)[key] = (data as any)[key];
			Prop.transfer(this.data, data, key);
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
		new ServiceProvider(this.bouer!).get<EventHandler>('EventHandler')!.emit({
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
		const evt = new ServiceProvider(this.bouer!).get<EventHandler>('EventHandler')!.on({
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
		new ServiceProvider(this.bouer!).get<EventHandler>('EventHandler')!.off({
			eventName,
			callback: callback as any,
			attachedNode: this.el!
		});
		this.events = where(this.events, evt => !(evt.eventName == eventName && evt.callback == callback));
	}

	addAssets(assets: (IAsset | string)[]) {
		const $Assets: any[] = [];
		const assetsTypeMapper: dynamic = {
			js: 'script',
			css: 'link',
			scss: 'link',
			sass: 'link',
			less: 'link',
			styl: 'link',
			style: 'link',
		}

		const isValidAssetSrc = function (src: string, index: number) {
			const isValid = (src || trim(src)) ? true : false;
			if (!isValid) Logger.error('Invalid asset “src”, in assets[' + index + '].src');
			return isValid;
		}

		const assetTypeGetter = function (src: string, index: number) {
			const srcSplitted = src.split('.');
			const type = assetsTypeMapper[toLower(srcSplitted[srcSplitted.length - 1])];

			if (!type) return Logger.error("Couldn't find out what type of asset it is, provide " +
				"the “type” explicitly at assets[" + index + "].type");

			return type;
		}

		forEach(assets, (asset, index) => {
			let type = '', src = '', scoped = true;

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

				scoped = asset.scoped ?? true;
			}

			if ((src[0] !== '.')) { // The src begins with dot (.)
				const resolver = urlResolver(src);
				const hasBaseURIInURL = resolver.baseURI === src.substring(0, resolver.baseURI.length);
				// Building the URL according to the main path
				src = urlCombine(hasBaseURIInURL ? resolver.origin : resolver.baseURI, resolver.pathname);
			}

			const $Asset = $CreateAnyEl(type, el => {
				if (scoped ?? true)
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

		this.assets.push.apply(this.assets, $Assets);
	}
}