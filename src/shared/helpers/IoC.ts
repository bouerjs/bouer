import dynamic from "../../types/dynamic";

/**
 * Store instances of classes to provide any where of
 * the application, but not via constructor.
 * @see https://www.tutorialsteacher.com/ioc/ioc-container
 */
export default class IoC {
  private static container: dynamic = {}

  /**
   * Register an instance into the DI container
   * @param instance the instance to be store
   */
  static Register<T>(instance: T) {
    this.container[
      (instance as any).constructor.name
    ] = instance;
  }

  /**
   * Resolve and Retrieve the instance registered
   * @param key the name of the class registered
   * @returns the instance of the class
   */
  static Resolve<T>(key: string) {
    return this.container[key] as (T | null);
  }

  /**
   * Destroy an instance registered
   * @param key the name of the class registered
   */
  static Dispose(key: string) {
    delete this.container[key];
  }
}
