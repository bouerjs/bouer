import Evaluator from '../../core/Evaluator';
import Constructor from '../../definitions/types/Constructor';
import Params from '../../definitions/types/Parameters';
import Bouer from '../../instance/Bouer';
import Logger from '../logger/Logger';
import { $default, $internal, filter, ifNullReturn, isNull } from './Utils';


/**
 * It's a **Service Provider** container with all the services that will be used in the application.
 */
const IoC = (function () {
  type Service<S> = { ctor: Constructor<S>, instance?: S, isSingleton: boolean, args?: unknown[] };

  let bouerId: number = 1;
  const global: Bouer = $default<Bouer>({ isDestroyed: false } as any);
  const serviceCollection: WeakMap<Bouer, WeakMap<Constructor<unknown>, Service<unknown>>> = new WeakMap();

  function add<S>(this: Bouer, ctor: Constructor<S>, params?: any[], isSingleton?: boolean, sync?: boolean): void {
    if (this.isDestroyed) throw new Error('Application already disposed.');

    if (!serviceCollection.has(this))
      serviceCollection.set(this, new WeakMap());

    const collection = serviceCollection.get(this)!;

    if (collection.has(ctor)) return;

    collection.set(ctor, {
      ctor: ctor,
      isSingleton: ifNullReturn(isSingleton, false),
      args: params
    });

    if (sync)
      add.call(global, ctor, params, isSingleton);
  };

  function resolve<S>(this: Bouer, ctor: Constructor<S>): S | undefined {
    if (this.isDestroyed) throw new Error('Application already disposed.');

    const collection = serviceCollection.get(this);
    if (!collection) return undefined;

    const service = collection.get(ctor);
    if (service == null)
      return undefined;

    if (!service.isSingleton)
      return newInstance(ctor, service.args, this);

    if (service.instance)
      return service.instance as S;

    // Otherwise, creates the singleton instance
    return (service.instance ?? (service.instance = newInstance(ctor, service.args, this))) as S;
  };

  /**
   * Creates a new instance of a class provided
   * @param ctor the class that the new instance should be created
   * @param params the parameter list that will be injected in the constructor
   * @returns new intance of the class provided
   */
  function newInstance<S>(ctor: Constructor<S>, params?: any[], app?: Bouer) {
    const paramsToProvide: string[] = [];
    const $params: unknown[] = params || [];
    const data: { __ctor: Constructor<S>, [key: string]: unknown } = { __ctor: ctor };

    // Looping all the provided params of the class constructor
    filter($params, (param: any, index) => {
      // Creating a unique name for the argument
      const paramName = '__arg' + index;

      // If the param is a class
      if (param && param.hasOwnProperty('prototype')) {
        if (app) {
          const localInstance = resolve.call(app, param);
          const globalInstance = (!localInstance && app != global) ? resolve.call(global, param) : localInstance;
          param = localInstance || globalInstance;

          if (isNull(param)) {
            Logger.warn('Could not create an instance of ' + paramName + ' in ' + ctor.name +
              '. Make sure it is added as a service in IoC.add(Service).');
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
      code: 'new __ctor(' + paramsToProvide.join(',') + ')',
      data: data,
      returnable: true
    }) as S || undefined;
  };

  function clear(this: Bouer) {
    return serviceCollection.delete(this);
  };

  const methods = {
    add: function <S>(ctor: Constructor<S>, params?: Params<Constructor<S>>, isSingleton?: boolean) {
      add.call(global, ctor, params as [], isSingleton);
      return { add: this.add };
    },
    resolve: function <S>(ctor: Constructor<S>): S | undefined {
      const service = resolve.call(global, ctor) as S;
      if (service) $internal(service); // Add internal mark to skip reactivity
      return service;
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
        add: function <S>(ctor: Constructor<S>, params?: Params<Constructor<S>>, isSingleton?: boolean, sync?: boolean) {
          add.call(app, ctor, params as [], isSingleton, sync);
          return { add: this.add };
        },
        /**
         * Resolves the Service with all it's dependencies
         * @param ctor the class the needs to be resolved
         * @returns the instance of the class resolved
         */
        resolve: function <S>(ctor: Constructor<S>): S | undefined {
          return resolve.call(app, ctor) as S;
        },
        clear: clear.bind(app)
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
    new<S>(
      ctor: Constructor<S>,
      params?: Params<Constructor<S>>,
      app?: Bouer
    ): S | undefined {

      if (ctor === Bouer as any) {
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

/**
 * Resolves the Service with all it's dependencies
 * @param ctor the class the needs to be resolved
 * @returns the instance of the class resolved
 */
export function $inject<S>(ctor: Constructor<S>) {
  return IoC.resolve(ctor);
};

export default IoC;