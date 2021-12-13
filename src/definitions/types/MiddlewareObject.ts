import IMiddleware from "../interfaces/IMiddleware";

type MiddlewareObject = {
	bind?: (context: IMiddleware, next: () => void) => Promise<any>,
	update?: (context: IMiddleware, next: () => void) => Promise<any>
}

export default MiddlewareObject;