import IoC from "../../shared/helpers/IoC";
import Logger from "../../shared/logger/Logger";
import dynamic from "../../types/dynamic";
import IMiddleware from "../../types/IMiddleware";

export default class Middleware {
  private container: dynamic = {};

  constructor() {
    IoC.Register(this);
  }

  run = (action: string, options: IMiddleware) => {
    const middlewares = this.container[action];
    if (!middlewares) return Logger.log("There is not middleware for “" + action + "”.");


    for (let index = 0; index < middlewares.length; index++) {
      const middleware = middlewares[index];
      middleware(options);
    }
  }

  configure = (action: string, callback: (options: IMiddleware) => void) => {
    let mMiddlewares = this.container[action];

    if (!mMiddlewares) {
      return this.container[action] = [ callback ];
    }

    mMiddlewares.push(callback);
  }
}
