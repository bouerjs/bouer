import IBinderConfig from "./IBinderConfig";
import dynamic from "../types/Dynamic";

export default interface IMiddleware<Detail = dynamic> {
	/** binder configuration of the directive */
	binder: IBinderConfig;

	/** some extra detail of the middleware config */
	detail: Detail;
}