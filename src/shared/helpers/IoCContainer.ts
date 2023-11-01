import Evaluator from '../../core/Evaluator';
import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';
import Logger from '../logger/Logger';
import { forEach, ifNullReturn } from './Utils';

type ServiceClass<Service> = (new (...args: any[]) => Service);
type ServiceItem<Service> = {
  clazz: ServiceClass<Service>,
  instance?: Service,
  isSingleton: boolean,
  args?: unknown[]
};

/**
 * It's a **Service Provider** container with all the services that will be used in the application.
 */
export default (function IoC() {
  let bouerId: number = 1;
  const serviceCollection: WeakMap<Bouer, WeakMap<ServiceClass<unknown>, ServiceItem<unknown>>> = new WeakMap();

  const add = <Service>(app: Bouer, clazz: ServiceClass<Service>, params?: unknown[], isSingleton?: boolean) => {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    if (!serviceCollection.has(app))
      serviceCollection.set(app, new WeakMap());

    const collection = serviceCollection.get(app)!;

    collection.set(clazz, {
      clazz: clazz as ServiceClass<Service>,
      isSingleton: ifNullReturn(isSingleton, false),
      args: params
    });
  };

  const resolve = <Service>(app: Bouer, clazz: (new (...args: any[]) => Service)) => {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    const collection = serviceCollection.get(app);
    if (!collection) return null;

    const service = collection.get(clazz);

    if (service == null)
      return null;

    if (service.isSingleton) {

      if (service.instance)
        return service.instance as Service;

      // Otherwise, creates the singleton instance
      return service.instance = newInstance(clazz, service.args) as Service;
    }

    return newInstance(clazz, service.args);
  };

  /**
   * Creates a new instance of a class provided
   * @param clazz the class that the new instance should be created
   * @param params the parameter list that will be injected in the constructor
   * @returns new intance of the class provided
   */
  const newInstance = <Service>(clazz: (new (...args: any[]) => Service), params?: unknown[]) => {
    const paramsToProvide: string[] = [];
    const mParams: unknown[] = params || [];
    const data: { __ctor0: ServiceClass<Service>, [key: string]: unknown } = { __ctor0: clazz };

    // Looping all the provided params of the class constructor
    forEach(mParams, (paramValue, index) => {
      // Creating a unique name for the argument
      const paramName = '__arg' + index;

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
    }) as Service;
  };

  const clear = (app: Bouer) => {
    return serviceCollection.delete(app);
  };

  return {
    /**
     * Defines the bouer app containing all the services that needs to be provided in this app
     * @param app the bouer instance
     * @returns all the available methods to perform
     */
    app<Data extends {} = dynamic, GlobalData extends {} = dynamic, Dependencies extends {} = dynamic>(
      app: Bouer<Data, GlobalData, Dependencies>
    ) {
      return {
        /**
         * Adds a service to be provided in whole the app
         * @param clazz the service that should be resolved future on
         * @param params the parameter that needs to be resolved every time the service is requested.
         * @param isSingleton mark the service as singleton to avoid creating an instance whenever it's requested
         */
        add<Service>(clazz: ServiceClass<Service>, params?: unknown[], isSingleton?: boolean): void {
          return add(app as Bouer, clazz, params, isSingleton);
        },
        /**
         * Resolve the Service with all it's dependencies
         * @param clazz the class the needs to be resolved
         * @returns the instance of the class resolved
         */
        resolve<Service>(clazz: (new (...args: any[]) => Service)): Service | null {
          return resolve(app as Bouer, clazz);
        },
        /**
         * Dispose all the added service of the current app
         */
        clear() {
          clear(app as Bouer);
        }
      };
    },

    /**
     * Creates a new instance of a class provided
     * @param clazz the class that the new instance should be created
     * @param params the parameter list that will be injected in the constructor
     * @returns new intance of the class provided
     */
    new<Service>(clazz: (new (...args: any[]) => Service), params?: unknown[]): Service | null {

      if (clazz instanceof Bouer) {
        Logger.error('Cannot create an instance of Bouer using IoC');
        return null;
      }
      return newInstance(clazz, params);
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