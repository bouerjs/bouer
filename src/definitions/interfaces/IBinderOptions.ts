import Component from "../../core/component/Component";
import Bouer from "../../instance/Bouer";
import IDelimiterResponse from "./IDelimiterResponse";
import dynamic from "../types/Dynamic";

export default interface IBinderOptions {
	/** Node to the bound */
	node: Node,

	/** The current scope data of  */
	data: dynamic,

	/** The fields having the delimiters to bind */
	fields: IDelimiterResponse[],

	/** Allow to replace the directive to the origiral one. `e-class` to `class` */
	isReplaceProperty?: boolean,

	/** The context of the binding */
	context: Bouer | Component,

	/** Allow to check if the bound element/parent-element is still connected to the DOM  */
	isConnected: () => boolean,

	/** Fires whenever the data property is updated */
	onUpdate?: (value: any, node: Node) => void,
}