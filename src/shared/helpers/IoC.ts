import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";

/**
 * Store instances of classes to provide as service any where
 * of the application, but not via constructor.
 * @see https://www.tutorialsteacher.com/ioc/ioc-container
 */
export default class IoC {
	private static identifierController: number = 1;
	private static container: Map<Bouer, dynamic> = new Map();

	/**
	 * Register an instance into the DI container
	 * @param obj the instance to be store
	 */
	static Register<T>(obj: T) {
		const objAsAny = (obj as any);
		const bouer = objAsAny.bouer;
		let services: dynamic | undefined;
		const serviceName = objAsAny.constructor.name;

		if (!(services = this.container.get(bouer)))
			return this.container.set(bouer, {
				[serviceName]: obj
			});

		services[serviceName] = obj;
	}

	/**
	 * Resolve and Retrieve the instance registered
	 * @param app the application
	 * @param $class the class registered
	 * @returns the instance of the class
	 */
	static Resolve<Service>(app: Bouer, $class: Function): Service {
		if (app.isDestroyed) throw new Error("Application already disposed.");
		let services = this.container.get(app);
		if (!services) throw new Error("Application not registered!");
		return services[$class.name]
	}

	/**
	 * Destroy an instance registered
	 * @param key the name of the class registered
	 */
	static Dispose(app: Bouer) {
		return this.container.delete(app);
	}

	static GetId(): number {
		return IoC.identifierController++;
	}
}