import IDelimiter from "../src/definitions/interfaces/IDelimiter";
import IBouerConfig from "../src/definitions/interfaces/IBouerConfig";
import IComponentOptions from "../src/definitions/interfaces/IComponentOptions";
import dynamic from "../src/definitions/types/Dynamic";
import IEventSubscription from "../src/definitions/interfaces/IEventSubscription";
import RenderContext from "../src/definitions/types/RenderContext";
import IAsset from "../src/definitions/interfaces/IAsset";
import ILifeCycleHooks from "../src/definitions/interfaces/ILifeCycleHooks";
import IBouerOptions from "../src/definitions/interfaces/IBouerOptions";
import WatchCallback from "../src/definitions/types/WatchCallback";
import MiddlewareConfigActions from "../src/definitions/types/MiddlewareConfigActions";
import IMiddleware from "../src/definitions/interfaces/IMiddleware";
import IBinderConfig from "../src/definitions/interfaces/IBinderConfig";
import IDelimiterResponse from "../src/definitions/interfaces/IDelimiterResponse";
import CustomDirective from "../src/definitions/types/CustomDirective";
import IEventModifiers from "../src/definitions/interfaces/IEventModifiers";


interface Component<Data = {}> {
	name: string;
	path: string;
	data?: Data;
	template?: string;
	keepAlive?: boolean;
	prefetch?: boolean;
	title?: string;
	route?: string;
	isDefault?: boolean;
	isNotFound?: boolean;
	isDestroyed: boolean;

	el?: Element;
	bouer?: Bouer;
	readonly children?: (Component | IComponentOptions<Data>)[];
	readonly assets: (HTMLScriptElement | HTMLStyleElement | HTMLLinkElement)[];
	readonly restrictions?: ((component: (Component | IComponentOptions<Data>)) => boolean | Promise<boolean>)[];

	requested?(event: CustomEvent): void;
	created?(event: CustomEvent): void;
	beforeMount?(event: CustomEvent): void;
	mounted?(event: CustomEvent): void;
	beforeLoad?(event: CustomEvent): void;
	loaded?(event: CustomEvent): void;
	beforeDestroy?(event: CustomEvent): void;
	destroyed?(event: CustomEvent): void;
	blocked?(event: CustomEvent): void;
	failed?(event: CustomEvent): void;

	export<ExportableData>(
		options: ExportableData
	): void;
	destroy(): void;

	params(): dynamic<string>;

	emit<TKey extends keyof ILifeCycleHooks>(
		eventName: TKey,
		init?: CustomEventInit
	): void;

	on<TKey extends keyof ILifeCycleHooks>(
		eventName: TKey,
		callback: (event: CustomEvent) => void
	): IEventSubscription;

	off<TKey extends keyof ILifeCycleHooks>(
		eventName: TKey, callback: (event: CustomEvent) => void
	): void;

	addAssets(assets: IAsset[]): void;
}

interface Reactive<Value, TObject> {
	propertyName: string;
	propertyValue: Value;
	propertySource: TObject;
	propertyDescriptor: PropertyDescriptor | undefined;
	watches: Array<Watch<Value, TObject>>;
	isComputed: boolean;
	context: RenderContext;

	computedGetter?: () => any
	computedSetter?: (value: Value) => void

	get(): Value
	set(value: Value): void;

	onChange(callback: WatchCallback, node?: Node): Watch<Value, TObject>;
}

interface Watch<Value, TObject> {
	readonly property: string;
	readonly node: Node | undefined;
	readonly reactive: Reactive<Value, TObject>;
	readonly callback: WatchCallback;
	readonly onDestroy?: () => void | undefined;

	destroy(): void;
}

interface Bouer<Data = {}, GlobalData = {}, Dependencies = {}> {
	readonly el: Element;
	readonly name;
	readonly version;
	readonly data: Data;
	readonly globalData: GlobalData;
	readonly config?: IBouerConfig;
	readonly dependencies: Dependencies;
	readonly __id__: number;
	readonly refs: dynamic<Element>;
	isDestroyed: boolean;

	readonly $data: {
		get: (key?: string) => object | undefined,
		set: (key: string, data: object | any[], toReactive?: boolean) => void,
		unset: (key: string) => boolean,
	}

	readonly $req: {
		get: (key?: string) => { data: any, [key: string]: any } | null
		unset: (key: string) => boolean,
	}

	readonly $wait: {
		get: (key?: string) => object | undefined,
		set: (key: string, data: object) => void,
		unset: (key: string) => boolean,
	}

	readonly $delimiters: {
		add: (item: IDelimiter) => void
		remove: (name: string) => void;
		get: () => IDelimiter[];
	};

	readonly $skeleton: {
		clear: (id?: string) => void,
		set: (color?: { wave?: string, background?: string }) => void
	}

	readonly $components: {
		add: <Data>(component: IComponentOptions<Data>) => void
		get: <Data>(name: string) => (Component<Data> | IComponentOptions<Data>)
	}

	readonly $routing: {
		bouer: Bouer;
		routeView: Element | null;
		defaultPage?: Component<any> | IComponentOptions<any>;
		notFoundPage?: Component<any> | IComponentOptions<any>;
		base?: string | null;
		navigate: (route: string, changeUrl?: boolean) => void;
		popState: (times?: number) => void;
		pushState: (url: string, title?: string) => void;
		markActiveAnchors: (route: string) => void
	}

	set<InputData, TargetObject>(
		inputData: InputData,
		targetObject?: TargetObject | Data | GlobalData
	): TargetObject | Data | GlobalData;

	toJsObj(input: string | HTMLElement, options?: { names?: string, values?: string },
		onSet?: (builtObjectLayer: object, propName: string, value: any, element: Element) => void
	): object | null;

	watch<Key extends keyof TargetObject, TargetObject = Data>(
		propertyName: Key,
		callback: (valueNew: TargetObject[Key], valueOld: TargetObject[Key]) => void,
		targetObject: TargetObject | Data
	): Watch<TargetObject[Key], TargetObject | Data>

	react(watchableScope: (app: Bouer) => void): void;

	on(
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		options?: {
			attachedNode?: Node,
			modifiers?: {
				capture?: boolean;
				once?: boolean;
				passive?: boolean;
				signal?: AbortSignal;
			}
		}
	): IEventSubscription;

	off(
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node
	): void;

	emit(
		eventName: string,
		options?: {
			element?: Node,
			init?: CustomEventInit,
			once?: boolean
		}
	): void;

	lazy(
		callback: (...args: any[]) => void,
		wait?: number
	): (...args: any[]) => void;

	compile<Data>(options: {
		el: Element,
		context: RenderContext,
		data?: Data,
		onDone?: (element: Element, data?: Data | undefined) => void
	}): void;

	destroy(): void;

	beforeLoad(event: CustomEvent): void;
	loaded(event: CustomEvent): void;
	beforeDestroy(event: CustomEvent): void;
	destroyed(event: CustomEvent): void;
}


export {
	Bouer as default,
	IBouerOptions,

	Component,
	IComponentOptions,

	Watch,
	Reactive,

	MiddlewareConfigActions,
	IMiddleware,

	IBinderConfig,

	IDelimiter,
	IDelimiterResponse,

	CustomDirective,

	IEventModifiers,
	IEventSubscription,

	IAsset
}