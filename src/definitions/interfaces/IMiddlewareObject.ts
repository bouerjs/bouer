import IMiddleware from "./IMiddleware";

export default interface IMiddlewareObject {
	bind?: (context: IMiddleware, next: () => void) => Promise<any>,
	update?: (context: IMiddleware, next: () => void) => Promise<any>
}