import Bouer from "../../instance/Bouer";
/**
 * Store instances of classes to provide any where of
 * the application, but not via constructor.
 * @see https://www.tutorialsteacher.com/ioc/ioc-container
 */
export default class IoC {
    private static identifierController;
    private static container;
    /**
     * Register an instance into the DI container
     * @param obj the instance to be store
     */
    static Register<T>(obj: T): void;
    /**
     * Resolve and Retrieve the instance registered
     * @param app the application
     * @param $class the class registered
     * @returns the instance of the class
     */
    static Resolve<T>(app: Bouer, $class: Function): T | null;
    /**
     * Destroy an instance registered
     * @param key the name of the class registered
     */
    static Dispose(bouer: Bouer): void;
    static GetId(): number;
}
