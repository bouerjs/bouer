import Evaluator from '../../core/Evaluator';
import Bouer from '../../instance/Bouer';
import Logger from '../logger/Logger';

type ServiceClass<Service> = (new (...args: any[]) => Service);

export default class IoC {

  private static _bouerId: number = 1;
  private static _serviceCollection: Map<Bouer, {
    [key: string]: {
      service: {} | ServiceClass<{}>,
      isSingleton: boolean
    }
  }> = new Map();

  /**
   * Register an instance into the service collection
   * @param instance the instance to be store
   */
  static register<Service>(app: Bouer, clazz: Service | ServiceClass<Service>) {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    if (!this._serviceCollection.has(app))
      this._serviceCollection.set(app, {});

    const isClass = (clazz instanceof Function);
    // Get the service name in the constructor it is an instance otherwise, get from the Class name
    const serviceName = isClass ? (clazz as ServiceClass<Service>).name : (clazz as Object).constructor.name;
    const collection = this._serviceCollection.get(app)!;

    return collection[serviceName] = {
      service: clazz as {} | ServiceClass<{}>,
      isSingleton: !isClass
    };
  }

  /**
   * Resolve and Retrieve the instance registered
   * @param name the name of the service
   * @returns the instance of the class
   */
  static resolve<Service>(app: Bouer, clazz: (new (...args: any[]) => Service)) {
    if (app.isDestroyed) throw new Error('Application already disposed.');

    const collection = this._serviceCollection.get(app);
    if (!collection) return undefined;

    const collected = collection[clazz.name];
    if (collected.isSingleton)
      return collected.service as Service;

    return IoC.new(clazz);
  }

  /**
   * Creates a new instance of a class provided
   * @param clazz the class that the new instance should be created
   * @returns new intance of the class provided
   */
  static new<Service>(clazz: (new (...args: any[]) => Service)) {

    if (clazz instanceof Bouer) {
      Logger.error('Cannot create an instance of Bouer using IoC');
      return;
    }

    return Evaluator.run({
      code: 'new _c_()',
      data: { _c_: clazz },
      isReturn: true
    }) as Service;
  }

  /**
   * Destroy an instance registered
   * @param app the application
   */
  static clear(app: Bouer) {
    return IoC._serviceCollection.delete(app);
  }

  /**
   * Generates a unique Id for the application
   * @returns The next integer from the last one generated
   */
  static newId() {
    return IoC._bouerId++;
  }
}