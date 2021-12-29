import Component from "../../core/component/Component";
import Bouer from "../../instance/Bouer";
import CustomDirective from "../types/CustomDirective";
import MiddlewareConfigActions from "../types/MiddlewareConfigActions";
import IBouerConfig from "./IBouerConfig";
import IComponentOptions from "./IComponentOptions";
import IDelimiter from "./IDelimiter";

export default interface IBouerOptions<Data, GlobalData, Dependencies> {
	/** The data of the instance */
	readonly data?: Data,

	/** The data of the whole instance */
	readonly globalData?: GlobalData

	/** The configuration of the instance */
	readonly config?: IBouerConfig

	/** The components of the instance */
	readonly components?: (Component<any> | IComponentOptions<any>)[];

	/** The custom directives for this instance */
	readonly directives?: CustomDirective,

	/** The dependencies of the instance */
	readonly deps?: Dependencies,

	/** Appends delimiters to the instance */
	readonly delimiters?: IDelimiter[],

	/** Middlewares that should be used in the application */
	middleware?: (
		configure: (directive: string, actions: MiddlewareConfigActions) => void,
		app: Bouer
	) => void,

	/** The hook that should be called before the component is loaded */
	beforeLoad?(event: CustomEvent): void;

	/** The hook that should be called after the component is loaded (Compiled) */
	loaded?(event: CustomEvent): void;

	/** The hook that should be called before the component is destroyed */
	beforeDestroy?(event: CustomEvent): void;

	/** The hook that should be called after the component is destroyed */
	destroyed?(event: CustomEvent): void;
}
