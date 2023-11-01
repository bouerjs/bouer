import IMiddleware from '../../definitions/interfaces/IMiddleware';
import IMiddlewareObject from '../../definitions/interfaces/IMiddlewareObject';
import Bouer from '../../instance/Bouer';
import IMiddlewareResult from './IMiddlewareResult';

export default class Middleware {
  readonly _IRT_ = true;
  private middlewareConfigContainer: { [key: string]: IMiddlewareObject[] } = {};
  bouer: Bouer;

  constructor(bouer: Bouer) {
    this.bouer = bouer;
  }

  run = (directive: string, runnable: {
    type: 'onBind' | 'onUpdate',
    action: (middleware: (context: IMiddleware, callbacks: {
      success: (response: any) => void,
      fail: (error: any) => void,
      done: () => void
    }) => void) => void,
    default?: () => void
  }) => {
    const middlewares = this.middlewareConfigContainer[directive];
    if (!middlewares) {
      return (runnable.default || (() => { })).call(this.bouer);
    }

    let index = 0;
    let middleware = middlewares[index];

    while (middleware != null) {
      let isNext = false;
      const middlewareAction = middleware[runnable.type];

      if (middlewareAction) {
        runnable.action((config, cbs) => {
          Promise.resolve(middlewareAction.call(this.bouer, config, () => {
            isNext = true;
          })).then(value => {
            if (!isNext) cbs.success(value);
            cbs.done();
          }).catch(error => {
            if (!isNext) cbs.fail(error);
            cbs.done();
          });
        });
      } else {
        // Run default config
        (runnable.default || (() => { }))();
      }

      if (isNext == false)
        break;

      middleware = middlewares[++index];
    }
  };

  subscribe = (directive: string, actions: (
    this: Bouer,
    onBind: (
      this: Bouer,
      configure: (this: Bouer, context: IMiddleware) => IMiddlewareResult | Promise<IMiddlewareResult>
    ) => void,
    onUpdate: (
      this: Bouer,
      configure: (this: Bouer, context: IMiddleware) => IMiddlewareResult | Promise<IMiddlewareResult>
    ) => void
  ) => void) => {
    if (!this.middlewareConfigContainer[directive])
      this.middlewareConfigContainer[directive] = [];

    const middleware: IMiddlewareObject = {};

    actions.call(this.bouer,
      onBind => middleware.onBind = onBind,
      onUpdate => middleware.onUpdate = onUpdate
    );

    this.middlewareConfigContainer[directive].push(middleware);
  };

  has = (directive: string) => {
    const middlewares = this.middlewareConfigContainer[directive];
    if (!middlewares) return false;
    return middlewares.length > 0;
  };
}