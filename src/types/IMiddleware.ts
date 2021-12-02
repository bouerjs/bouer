import { BinderConfig } from "../core/binder/Binder";
import dynamic from "./dynamic";

export default interface IMiddleware {
	binder: BinderConfig;
	detail: dynamic;
}