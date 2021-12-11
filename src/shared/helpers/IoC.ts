import Bouer from "../../instance/Bouer";

type Instance = {
	app: Bouer,
	ClassInstance: any
}

type Container = {
	[appId: number]: { [name: string]: Instance }
};

/**
 * Store instances of classes to provide any where of
 * the application, but not via constructor.
 * @see https://www.tutorialsteacher.com/ioc/ioc-container
 */
export default class IoC {
	private static identifierController: number = 1;
	private static container: Container = {};

	/**
	 * Register an instance into the DI container
	 * @param obj the instance to be store
	 */
	static Register<T>(obj: T) {
		const objAsAny = (obj as any);

		if (!this.container[objAsAny.bouer.__id__])
			this.container[objAsAny.bouer.__id__] = {};

		this.container[objAsAny.bouer.__id__][objAsAny.constructor.name] = {
			app: objAsAny.bouer,
			ClassInstance: obj
		};
	}

	/**
	 * Resolve and Retrieve the instance registered
	 * @param app the application
	 * @param $class the class registered
	 * @returns the instance of the class
	 */
	static Resolve<T>(app: Bouer, $class: Function): T | null {
		if (app.isDestroyed) throw new Error("Application already disposed.");
		const appContainer = this.container[app.__id__];
		const mContainer = appContainer[$class.name];
		return mContainer.ClassInstance;
	}

	/**
	 * Destroy an instance registered
	 * @param key the name of the class registered
	 */
	static Dispose(bouer: Bouer) {
		delete this.container[bouer.__id__];
	}

	static GetId(): number {
		return IoC.identifierController++;
	}
}