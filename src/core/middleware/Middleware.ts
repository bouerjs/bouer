import IMiddleware from "../../definitions/interfaces/IMiddleware";
import MiddlewareConfigActions from "../../definitions/types/MiddlewareConfigActions";
import IMiddlewareObject from "../../definitions/interfaces/IMiddlewareObject";
import Bouer from "../../instance/Bouer";
import IoC from "../../shared/helpers/IoC";
import Base from "../Base";

export default class Middleware extends Base {
	private middlewareConfigContainer: { [key: string]: IMiddlewareObject[] } = {};
	bouer: Bouer;

	constructor(bouer: Bouer) {
		super();

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
						.then(value => {
							if (!isNext) cbs.success(value);
							cbs.done()
						})
						.catch(error => {

							if (!isNext) cbs.fail(error);
							cbs.done();
						});
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

		const middleware: IMiddlewareObject = {};

		actions(
			bind => middleware.bind = bind,
			update => middleware.update = update
		);

		this.middlewareConfigContainer[directive].push(middleware);
	}
}