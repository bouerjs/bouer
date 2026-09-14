import Evaluator from '../../core/Evaluator';
import Constructor from '../../definitions/types/Constructor';
import Params from '../../definitions/types/Parameters';
import Bouer from '../../instance/Bouer';
import Logger from '../logger/Logger';
import Property from './Property';
import { $default, filter, ifNullReturn, isNull } from './Utils';


/**
 * It's a **Service Provider** container with all the services that will be used in the application.
*/
const IoC = (function () {
  type Service<S> = { ctor: Constructor<S>, instance?: S, isSingleton: boolean, args?: unknown[] };

  let bouerId: number = 1;
  const global: Bouer = $default<Bouer>({ isDestroyed: false } as any);
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

  const resolve = <S>(app: Bouer, ctor: Constructor<S>) => {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    const collection = serviceCollection.get(app);
    if (!collection) return undefined;

    const service = collection.get(ctor);
    if (service == null)
      return undefined;

    if (!service.isSingleton)
      return newInstance(ctor, service.args, app);

    if (service.instance)
      return service.instance as S;

    // Otherwise, creates the singleton instance
    return (service.instance ?? (service.instance = newInstance(ctor, service.args, app))) as S;
  };

  /**
   * Creates a new instance of a class provided
   * @param ctor the class that the new instance should be created
   * @param params the parameter list that will be injected in the constructor
   * @returns new intance of the class provided
   */
  const newInstance = <S>(ctor: Constructor<S>, params?: any[], app?: Bouer) => {
    const paramsToProvide: string[] = [];
    const $params: unknown[] = params || [];
    const data: { __ctor0: Constructor<S>, [key: string]: unknown } = { __ctor0: ctor };

    // Looping all the provided params of the class constructor
    filter($params, (param: any, index) => {
      // Creating a unique name for the argument
      const paramName = '__arg' + index;

      // If the param is a class
      // eslint-disable-next-line no-prototype-builtins
      if (param && param.hasOwnProperty('prototype')) {
        if (app) {
          const localInstance = resolve(app!, param);
          const globalInstance = (!localInstance && app != global) ? resolve(global, param) : localInstance;

          if (!isNull(param)) {
            param = localInstance || globalInstance;
          } else {
            Logger.warn('Could not create an instance of ' + param.name || param
              + '. Make sure it is added as a service in IoC[.app(Bouer)].add(Service).');
          }
        } else {
          param = null;
        }
      }

      // Setting the param name and value
      data[paramName] = param;

      // Adding the unique name
      paramsToProvide.push(paramName);
    });

    // Creating a new instance according to above process
    return Evaluator.run({
      code: 'new __ctor0(' + paramsToProvide.join(',') + ')',
      data: data,
      returnable: true
    }) as S || undefined;
  };

  const clear = (app: Bouer) => {
    return serviceCollection.delete(app);
  };

  const methods = {
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
      return add(global, ctor, (params || []) as any, isSingleton);
    },
    /**
     * Resolves the Service with all it's dependencies
     * @param ctor the class the needs to be resolved
     * @returns the instance of the class resolved
     */
    resolve<S>(
      ctor: Constructor<S>
    ): S | undefined {
      return resolve(global, ctor);
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
        resolve<S >(ctor: Constructor<S>): S | undefined {
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
    ): S | undefined {

      if (ctor instanceof Bouer) {
        Logger.error('Cannot create an instance of Bouer using IoC');
        return undefined;
      }
      return newInstance(ctor, (params || []) as any, app);
    },
    /**
     * Generates a unique Id for the application
     * @returns The next integer from the last one generated
     */
    newId(): number {
      return bouerId++;
    },
    global
  };
  return methods
})();

export default IoC;