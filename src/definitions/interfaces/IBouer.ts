import Component from "../../core/component/Component";
import Bouer from "../../instance/Bouer";
import CustomDirective from "../types/CustomDirective";
import dynamic from "../types/Dynamic";
import MiddlewareConfigActions from "../types/MiddlewareConfigActions";
import IBouerConfig from "./IBouerConfig";
import IComponent from "./IComponent";
import IDelimiter from "./IDelimiter";

export default interface IBouer {
	/** The data of the instance */
	data?: dynamic,

	/** The data of the whole instance */
	globalData?: dynamic

	/** The configuration of the instance */
	config?: IBouerConfig

	/** The components of the instance */
	components?: (IComponent | Component)[];

	/** The custom directives for this instance */
	directives?: CustomDirective,

	/** The dependencies of the instance */
	dependencies?: dynamic<object>,

	/** Appends delimiters to the instance */
	delimiters?: IDelimiter[],

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
