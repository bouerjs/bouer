import Evaluator from '../../core/Evaluator';
import Constructor from '../../definitions/types/Constructor';
import Params from '../../definitions/types/Parameters';
import Bouer from '../../instance/Bouer';
import Logger from '../logger/Logger';
import { forEach, ifNullReturn, isNull } from './Utils';

type Service<S> = {
  ctor: Constructor<S>,
  instance?: S,
  isSingleton: boolean,
  args?: unknown[]
};

/**
 * It's a **Service Provider** container with all the services that will be used in the application.
 */
export default (function IoC() {
  let bouerId: number = 1;
  const globalApp: any = { isDestroyed: false };
  const serviceCollection: WeakMap<Bouer, WeakMap<Constructor<unknown>, Service<unknown>>> = new WeakMap();

  const add = <S>(app: Bouer, ctor: any, params?: any[], isSingleton?: boolean) => {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    if (!serviceCollection.has(app))
      serviceCollection.set(app, new WeakMap());

    const collection = serviceCollection.get(app)!;

    collection.set(ctor, {
      ctor: ctor as Constructor<S>,
      isSingleton: ifNullReturn(isSingleton, false),
      args: params
    });
  };

  const resolve = <S>(app: Bouer, clazz: Constructor<S>) => {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    const collection = serviceCollection.get(app);
    if (!collection) return null;

    const service = collection.get(clazz);

    if (service == null)
      return null;

    if (service.isSingleton) {

      if (service.instance)
        return service.instance as S;

      // Otherwise, creates the singleton instance
      return service.instance = newInstance(clazz, service.args, app) as S;
    }

    return newInstance(clazz, service.args, app);
  };

  /**
   * Creates a new instance of a class provided
   * @param clazz the class that the new instance should be created
   * @param params the parameter list that will be injected in the constructor
   * @returns new intance of the class provided
   */
  const newInstance = <S>(clazz: Constructor<S>, params?: any[], app?: Bouer) => {
    const paramsToProvide: string[] = [];
    const mParams: unknown[] = params || [];
    const data: { __ctor0: Constructor<S>, [key: string]: unknown } = { __ctor0: clazz };

    // Looping all the provided params of the class constructor
    forEach(mParams, (paramValue, index) => {
      // Creating a unique name for the argument
      const paramName = '__arg' + index;
      const paramValueAsAny = paramValue as any;

      // If the param is a class
      // eslint-disable-next-line no-prototype-builtins
      if (paramValue && paramValueAsAny.hasOwnProperty('prototype')) {
        if (app) {
          const paramInstance = resolve(app!, paramValueAsAny);
          if (!isNull(paramValueAsAny)) {
            paramValue = paramInstance;
          } else {
            Logger.warn('Could not create an instance of ' + paramValueAsAny.name || paramValueAsAny
              + '. Make sure it is added as a service in IoC[.app].add(Service).');
          }
        } else {
          paramValue = null;
        }
      }

      // Setting the param name and value
      data[paramName] = paramValue;

      // Adding the unique name
      paramsToProvide.push(paramName);
    });

    // Creating a new instance according to above process
    return Evaluator.run({
      code: 'new __ctor0(' + paramsToProvide.join(',') + ')',
      data: data,
      isReturn: true
    }) as S;
  };

  const clear = (app: Bouer) => {
    return serviceCollection.delete(app);
  };

  return {
    /**
     * Adds a service to generic app
     * @param ctor the service that should be resolved future on
     * @param params the parameter that needs to be resolved every time the service is requested.
     * @param isSingleton mark the service as singleton to avoid creating an instance whenever it's requested
     */
    add<S extends Constructor<S>>(
      ctor: S,
      params?: Params<S>,
      isSingleton?: boolean
    ): void {
      return add(globalApp, ctor, (params || []) as any, isSingleton);
    },
    /**
     * Resolves the Service with all it's dependencies
     * @param ctor the class the needs to be resolved
     * @returns the instance of the class resolved
     */
    resolve<S>(
      ctor: Constructor<S>
    ): S | null {
      return resolve(globalApp, ctor);
    },
    /**
     * Defines the bouer app containing all the services that needs to be provided in this app
     * @param app the bouer instance
     * @returns all the available methods to perform
     */
    app(app: Bouer) {
      return {
        /**
         * Adds a service to be provided in whole the app
         * @param ctor the service that should be resolved future on
         * @param params the parameter that needs to be resolved every time the service is requested.
         * @param isSingleton mark the service as singleton to avoid creating an instance whenever it's requested
         */
        add<S extends Constructor<any>>(ctor: S, params?: Params<S>, isSingleton?: boolean): void {
          return add(app, ctor, (params || []) as any, isSingleton);
        },
        /**
         * Resolves the Service with all it's dependencies
         * @param ctor the class the needs to be resolved
         * @returns the instance of the class resolved
         */
        resolve<S >(ctor: Constructor<S>): S | null {
          return resolve(app, ctor);
        },
        /**
         * Dispose all the added service of the current app
         */
        clear() {
          clear(app);
        }
      };
    },
    /**
     * Creates a new instance of a class provided
     * @param ctor the class that the new instance should be created
     * @param params the parameter list that will be injected in the constructor
     * @param app used to auto instantiate a parameter (DI Service), Optional if there isn't or
     *  we do not want to instantiate
     * @returns new intance of the class provided
     */
    new<S extends Constructor<any>>(
      ctor: Constructor<S>,
      params?: Params<S>,
      app?: Bouer
    ): S | null {

      if (ctor instanceof Bouer) {
        Logger.error('Cannot create an instance of Bouer using IoC');
        return null;
      }
      return newInstance(ctor, (params || []) as any, app);
    },
    /**
     * Generates a unique Id for the application
     * @returns The next integer from the last one generated
     */
    newId(): number {
      return bouerId++;
    }
  };
})();