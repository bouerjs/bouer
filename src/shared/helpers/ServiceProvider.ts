import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";

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
	 * @param app the application
	 * @param name the name of the service
	 * @returns the instance of the class
	 */
	get<Service>(name: string): Service {
		return ServiceProvider.get(this.app!, name);
	}

	/**
	 * Destroy an instance registered
	 * @param key the name of the class registered
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

	static get<Service>(app: Bouer, name: string): Service {
		if (app.isDestroyed) throw new Error("Application already disposed.");
		let services = ServiceProvider.serviceCollection.get(app);
		if (!services) throw new Error("Application not registered!");
		return services[name]
	}

	static clear(app: Bouer) {
		return ServiceProvider.serviceCollection.delete(app);
	}

	static GenerateId() {
		return ServiceProvider.bouerId++;
	}
}