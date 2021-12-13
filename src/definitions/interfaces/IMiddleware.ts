import BinderConfig from "../types/BinderConfig";
import dynamic from "../types/Dynamic";

export default interface IMiddleware {
	binder: BinderConfig;
	detail: dynamic;
}