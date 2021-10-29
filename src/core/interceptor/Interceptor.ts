import IoC from "../../shared/helpers/IoC";
import Logger from "../../shared/logger/Logger";
import dynamic from "../../types/dynamic";
import IInterceptor from "../../types/IInterceptor";

export default class Interceptor {
  private container: dynamic = {};

  constructor() {
    IoC.Register(this);
  }

  run = (action: string, options: IInterceptor) => {
    const mInterceptors = this.container[action];
    if (!mInterceptors) return Logger.log("There is not interceptor for “" + action + "”.");


    for (let index = 0; index < mInterceptors.length; index++) {
      const interceptor = mInterceptors[index];
      interceptor(options);
    }
  }

  register = (action: string, callback: (options: IInterceptor) => void) => {
    let mMiddlewares = this.container[action];

    if (!mMiddlewares) {
      return this.container[action] = [ callback ];
    }

    mMiddlewares.push(callback);
  }
}
