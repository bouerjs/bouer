import dynamic from '../../definitions/types/Dynamic';
import Bouer from '../../instance/Bouer';

export default class ServiceProvider {
  private static bouerId: number = 1;
  private static serviceCollection: Map<Bouer, dynamic> = new Map();
  private app?: Bouer;

  /**
   * The default constructor
   * @param app the bouer app having the service that we want
   */
  constructor(app?: Bouer) {
    this.app = app;
  }

  /**
   * Register an instance into the service collection
   * @param instance the instance to be store
   */
  add<Service>(name: string, instance: Service) {
    ServiceProvider.add(name, instance);
  }

  /**
   * Resolve and Retrieve the instance registered
   * @param name the name of the service
   * @returns the instance of the class
   */
  get<Service>(name: string): Service {
    return ServiceProvider.get(this.app!, name);
  }

  /**
   * Destroy an instance registered
   */
  clear() {
    return ServiceProvider.clear(this.app!);
  }

  static add<Service>(name: string, instance: Service) {
    const objAsAny = (instance as any);
    const bouer = objAsAny.bouer;
    let services: dynamic | undefined;

    if (!(services = ServiceProvider.serviceCollection.get(bouer)))
      return ServiceProvider.serviceCollection.set(bouer, {
        [name]: instance
      });

    services[name] = instance;
  }

  /**
   * Resolve and Retrieve the instance registered
   * @param name the name of the service
   * @returns the instance of the class
   */
  static get<Service>(app: Bouer, name: string): Service {
    if (app.isDestroyed) throw new Error('Application already disposed.');
    const services = ServiceProvider.serviceCollection.get(app);
    if (!services) throw new Error('Application not registered!');
    return services[name];
  }

  /**
   * Destroy an instance registered
   * @param app the application
   */
  static clear(app: Bouer) {
    return ServiceProvider.serviceCollection.delete(app);
  }

  /**
   * Generates a unique Id for the application
   * @returns The next integer from the last one generated
   */
  static genId() {
    return ServiceProvider.bouerId++;
  }
}