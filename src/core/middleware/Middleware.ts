import Bouer from "../../instance/Bouer";
import IoC from "../../shared/helpers/IoC";
import Logger from "../../shared/logger/Logger";
import IMiddleware from "../../types/IMiddleware";

export type MiddlewareObject = {
	bind?: (context: IMiddleware, next: () => void) => Promise<any>,
	update?: (context: IMiddleware, next: () => void) => Promise<any>
}

export type MiddlewareConfigActions = (
	bind: (configure: (context: IMiddleware) => Promise<any>) => void,
	update: (configure: (context: IMiddleware) => Promise<any>) => void
) => void;

export default class Middleware {
	private middlewareConfigContainer: { [key: string]: MiddlewareObject[] } = {};
	bouer: Bouer;

	constructor(bouer: Bouer) {
		this.bouer = bouer;

		IoC.Register(this);
	}

	run = (directive: string, runnable: {
		type: 'bind' | 'update',
		action: (middleware: (context: IMiddleware, callbacks: {
			success: (response: any) => void,
			fail: (error: any) => void,
			done: () => void
		}) => void) => void,
		default?: () => void
	}) => {

		const middlewares = this.middlewareConfigContainer[directive];
		if (!middlewares) {
			return (runnable.default || (() => { }))();
		};

		let index = 0;
		let middleware = middlewares[index];

		while (middleware != null) {
			let isNext = false;
			const middlewareAction = middleware[runnable.type];

			if (middlewareAction) {
				runnable.action((config, cbs) => {
					Promise.resolve(middlewareAction(config, () => {
						isNext = true;
					}))
						.then(value => isNext ? null : cbs.success(value))
						.catch(error => isNext ? null : cbs.fail(error))
						.finally(() => isNext ? null : cbs.done());
				});
			} else {
				(runnable.default || (() => { }))();
			}

			if (isNext == false)
				break;

			middleware = middlewares[++index];
		}
	}

	register = (directive: string, actions: MiddlewareConfigActions) => {
		if (!this.middlewareConfigContainer[directive])
			this.middlewareConfigContainer[directive] = [];

		const middleware: MiddlewareObject = {};

		actions(
			bind => middleware.bind = bind,
			update => middleware.update = update
		);

		this.middlewareConfigContainer[directive].push(middleware);
	}
}