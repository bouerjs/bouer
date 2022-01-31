import MiddlewareResult from "../../core/middleware/MiddlewareResult";
import IMiddleware from "./IMiddleware";

export default interface IMiddlewareObject {
	onBind?: (context: IMiddleware, next: () => void) => MiddlewareResult | Promise<MiddlewareResult>,
	onUpdate?: (context: IMiddleware, next: () => void) => MiddlewareResult | Promise<MiddlewareResult>
}