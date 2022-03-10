import IMiddleware from '../../definitions/interfaces/IMiddleware';
import IMiddlewareObject from '../../definitions/interfaces/IMiddlewareObject';
import Bouer from '../../instance/Bouer';
import ServiceProvider from '../../shared/helpers/ServiceProvider';
import Base from '../Base';
import MiddlewareResult from './MiddlewareResult';

export default class Middleware extends Base {
  private middlewareConfigContainer: { [key: string]: IMiddlewareObject[] } = {};
  bouer: Bouer;

  constructor(bouer: Bouer) {
    super();

    this.bouer = bouer;
    ServiceProvider.add('Middleware', this);
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
      return (runnable.default || (() => { }))();
    }

    let index = 0;
    let middleware = middlewares[index];

    while (middleware != null) {
      let isNext = false;
      const middlewareAction = middleware[runnable.type];

      if (middlewareAction) {
        runnable.action((config, cbs) => {
          Promise.resolve(middlewareAction(config, () => {
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

  register = (directive: string, actions: (
    onBind: (configure: (context: IMiddleware) => MiddlewareResult | Promise<MiddlewareResult>) => void,
    onUpdate: (configure: (context: IMiddleware) => MiddlewareResult | Promise<MiddlewareResult>) => void
  ) => void) => {
    if (!this.middlewareConfigContainer[directive])
      this.middlewareConfigContainer[directive] = [];

    const middleware: IMiddlewareObject = {};

    actions(
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