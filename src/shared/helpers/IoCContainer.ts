import Evaluator from '../../core/Evaluator';
import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';
import Logger from '../logger/Logger';
import { forEach, ifNullReturn, isNull, toLower, where } from './Utils';

type ServiceClass<Service> = (new (...args: any[]) => Service);
type ServiceItem<Service> = {
  clazz: ServiceClass<Service>,
  instance?: Service,
  isSingleton: boolean,
  args?: dynamic
};

export default (function IoC() {
  let bouerId: number = 1;
  const serviceCollection: Map<Bouer, dynamic<ServiceItem<any>>> = new Map();

  const findServiceByName = (app: Bouer | null, name: string) => {
    if (!app) return null;

    const collection = serviceCollection.get(app) || {};

    const serviceName = where(Object.keys(collection),
      key => toLower(collection[key].clazz.name) == toLower(name)
    )[0];

    if (!serviceName)
      return null;

    return collection[serviceName];
  };

  const classParams = <Type>(ctor: (new (...args: any[]) => Type)) => {
    if (!ctor) return [];
    return (ctor + '')
      .replace(/[/][/].*$/mg, '') // strip single-line comments
      .replace(/\s+/g, '') // strip white space
      .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
      .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
      .replace(/=[^,]+/g, '') // strip any ES6 defaults
      .split(',').filter(Boolean); // split & filter [""]
  };

  const add = <Service>(app: Bouer, clazz: ServiceClass<Service>, params?: dynamic, isSingleton?: boolean) => {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    if (!serviceCollection.has(app))
      serviceCollection.set(app, {});

    const serviceName = (clazz as ServiceClass<Service>).name;
    const collection = serviceCollection.get(app)!;

    collection[serviceName] = {
      clazz: clazz as ServiceClass<Service>,
      isSingleton: ifNullReturn(isSingleton, false),
      args: params
    };
  };

  /**
   * Resolve and Retrieve the instance registered
   * @param name the name of the service
   * @returns the instance of the class
   */
  const resolve = <Service>(app: Bouer, clazz: (new (...args: any[]) => Service)) => {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    const collection = serviceCollection.get(app);
    if (!collection) return null;

    const service = collection[clazz.name];
    if (service.isSingleton) {

      if (service.instance)
        return service.instance as Service;

      // Otherwise, creates the singleton instance
      return service.instance = newInstace(app, clazz, service.args) as Service;
    }

    return newInstace(app, clazz, service.args);
  };

  /**
   * Creates a new instance of a class provided
   * @param clazz the class that the new instance should be created
   * @returns new intance of the class provided
   */
  const newInstace = <Service>(app: Bouer | null, clazz: (new (...args: any[]) => Service), params?: dynamic) => {
    const paramsToProvide: string[] = [];
    const mParams: dynamic = params || {};
    const data: { __ctor0: ServiceClass<Service>, [key: string]: any } = { __ctor0: clazz };

    // Looping all the params of the class constructor
    forEach(classParams(clazz), (key, index) => {
      // Trying to get the value from the provided params
      let paramValue = mParams[key];
      // Creating a unique name for the argument
      const paramName = '__arg' + index;

      // If the parameter name matches Bouer, then injects the provided bouer instance
      if (toLower(Bouer.name) === toLower(key)) {
        paramValue = app;
      } else if (isNull(paramValue)) { // Otherwise, check if the param name matches any dependency

        // Trying to find any dependency with the same name
        const service = findServiceByName(app, toLower(key));

        // If was found
        if (service != null) {
          // And it gots and instance, assign the instance
          if (service.instance) {
            paramValue = service.instance as Service;
          } else { // Otherwise, creates a new instance, and assign
            paramValue = newInstace(app, service.clazz, service.args);
            // Setting the instance if it's singleton
            service.instance = service.isSingleton ? paramValue : null;
          }
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
    }) as Service;
  };

  /**
   * Destroy an instance registered
   * @param app the application
   */
  const clear = (app: Bouer) => {
    return serviceCollection.delete(app);
  };

  class IoC {
    /**
     * Defines the bouer app containing all the services that needs to be provided
     * @param app the bouer instance
     * @returns all the available methods to perform
     */
    static app<Data = {}, GlobalData = {}, Dependencies = {}>(app: Bouer<Data, GlobalData, Dependencies>) {
      return {
        /**
         * Adds a service to be provided in whole the app
         * @param instance the instance to be store
         */
        add<Service>(clazz: ServiceClass<Service>, params?: dynamic, isSingleton?: boolean) {
          return add(app as Bouer, clazz, params, isSingleton);
        },
        resolve<Service>(clazz: (new (...args: any[]) => Service)) {
          return resolve(app as Bouer, clazz);
        },
        clear() {
          clear(app as Bouer);
        }
      };
    }

    /**
     * Creates a new instance of a class provided
     * @param clazz the class that the new instance should be created
     * @returns new intance of the class provided
     */
    static new<Service>(clazz: (new (...args: any[]) => Service), params?: dynamic) {

      if (clazz instanceof Bouer) {
        Logger.error('Cannot create an instance of Bouer using IoC');
        return;
      }
      return newInstace(null, clazz);
    }

    /**
     * Generates a unique Id for the application
     * @returns The next integer from the last one generated
     */
    static newId() {
      return bouerId++;
    }
  }

  return IoC;
})();