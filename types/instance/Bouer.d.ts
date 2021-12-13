import Component from "../core/component/Component";
import IBouer from "../definitions/interfaces/IBouer";
import IBouerConfig from "../definitions/interfaces/IBouerConfig";
import WatchCallback from "../definitions/types/WatchCallback";
import dynamic from "../definitions/types/Dynamic";
import delimiter from "../definitions/types/delimiter";
import IComponent from "../definitions/interfaces/IComponent";
export default class Bouer implements IBouer {
    el: Element;
    name: string;
    version: string;
    data: object;
    globalData: object;
    config?: IBouerConfig;
    dependencies: dynamic;
    isDestroyed: boolean;
    __id__: number;
    /** Data Exposition and Injection handler*/
    $data: {
        /**
         * Gets the exposed `data` or the value provided for `data` directive
         * @param key the data:[`key`]="..." directive key value or the app.$data.set(`key`) key provided.
         * @returns the expected object | null
         */
        get: (key?: string) => any;
        /**
         * Sets a value into a storage the used anywhere of the application.
         * @param key the key of the data to be stored.
         * @param data the data to be stored.
         * @param toReactive allow to transform the data to a reactive one after being setted. By default is `false`.
         */
        set: (key: string, data: object | any[], toReactive?: boolean) => any;
        /**
         * Destroy the stored data
         * @param key the data:[`key`]="..." directive value or the app.$data.set(`key`) key provided.
         * @returns `true` for item deleted or `false` for item not deleted.
         */
        unset: (key: string) => boolean;
    };
    /** Requests handler */
    $req: {
        /**
         * Gets the `e-req` directive response value
         * @param key the e-req:[`key`]="..." directive key value.
         * @returns the expected object | null
         */
        get: (key?: string) => {
            data: any;
            [key: string]: any;
        } | null;
        /**
         * Destroy stored req (request)
         * @param key the e-req:[`key`]="..." directive key value.
         * @returns `true` for item deleted or `false` for item not deleted.
         */
        unset: (key: string) => boolean;
    };
    /** Waiting data Handler */
    $wait: {
        /**
         * Gets the elements and data of the `wait-data` directive.
         * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
         * @returns the expected object | null
         */
        get: (key?: string) => any;
        /**
         * Provides data for `wait-data` directive elements.
         * @param key the key of `wait-data` directive value.
         * @param data the data provide to the elements waiting
         */
        set: (key: string, data: object) => void;
        /**
         * Destroy stored wait
         * @param key the wait-data="`key`" directive value or the app.$wait.set(`key`) key provided.
         * @returns `true` for item deleted or `false` for item not deleted.
         */
        unset: (key: string) => boolean;
    };
    /** Delimiters handler */
    $delimiters: {
        /** Adds a delimiter into the instance */
        add: (item: delimiter) => void;
        /** Removes a delimiter from the instance */
        remove: (name: string) => void;
        /** Retrieve all the delimiters */
        get: () => delimiter[];
    };
    /** Skeleton handler */
    $skeleton: {
        /** Removes skeletons havining the `id` provided */
        clear: (id?: string) => void;
        /** Set Color of the Wave and/or the Background */
        set: (color?: {
            wave?: string;
            background?: string;
        }) => void;
    };
    /** Components Handler */
    $components: {
        add: (component: IComponent) => void;
        get: (name: string) => (Component | IComponent);
    };
    /** Routing Handler */
    $routing: {
        /** Store Bouer application instance */
        bouer: Bouer;
        /** Store the route elements */
        routeView: Element | null;
        /** Store the Component defined has NotFound Page */
        defaultPage?: Component | IComponent;
        /** Store the Component defined has NotFound Page */
        notFoundPage?: Component | IComponent;
        /** Store `href` value of the <base /> tag */
        base?: string | null;
        /** Navigates to a certain page without reloading all the page */
        navigate: (route: string, changeUrl?: boolean) => void;
        /** Navigates to previous page according to a number of go back */
        popState: (times?: number) => void;
        /** Changes the current url to a new one provided */
        pushState: (url: string, title?: string) => void;
        /** Mark all anchors having the route provided as active */
        markActiveAnchors: (route: string) => void;
    };
    /**
     * Gets all the elemens having the `ref` attribute
     * @returns an object having all the elements with the `ref attribute value` defined as the key.
     */
    refs: dynamic;
    /**
     * Default constructor
     * @param selector the selector of the element to be controlled by the instance
     * @param options the options to the instance
     */
    constructor(selector: string, options?: IBouer);
    /**
     * Sets data into a target object, by default is the `app.data`
     * @param inputData the data the should be setted
     * @param targetObject the target were the inputData
     * @returns the object with the data setted
     */
    set(inputData: object, targetObject?: object): object;
    /**
     * Compiles a `HTML snippet` to a `Object Literal`
     * @param input the input element
     * @param options the options of the compilation
     * @param onSet a function that should be fired when a value is setted
     * @returns the Object Compiled from the HTML
     */
    toJsObj(input: any, options?: {
        /**
         * attributes that tells the compiler to lookup to the element, e.g: [name],[data-name].
         * * Note: The definition order matters.
         */
        names?: string;
        /**
         * attributes that tells the compiler where it going to get the value, e.g: [value],[data-value].
         * * Note: The definition order matters.
         */
        values?: string;
    }, onSet?: (builtObject: object, propName: string, value: any, element: Element) => void): object;
    /**
     * Provides the possibility to watch a property change
     * @param propertyName the property to watch
     * @param callback the function that should be called when the property change
     * @param targetObject the target object having the property to watch
     * @returns the watch object having the method to destroy the watch
     */
    watch(propertyName: string, callback: WatchCallback, targetObject?: object): null;
    /**
     * Watch all reactive properties in the provided scope.
     * @param watchableScope the function that should be called when the any reactive property change
     * @returns an object having all the watches and the method to destroy watches at once
     */
    react(watchableScope: (app: Bouer) => void): import("../core/binder/Watch").default<any, any>[];
    /**
     * Add an Event Listener to the instance or to an object
     * @param eventName the event name to be listening
     * @param callback the callback that should be fired
     * @param attachedNode A node to attach the event
     * @param modifiers An object having all the event modifier
     * @returns The event added
     */
    on(eventName: string, callback: (event: CustomEvent | Event) => void, options?: {
        attachedNode?: Node;
        modifiers?: {
            capture?: boolean;
            once?: boolean;
            passive?: boolean;
            signal?: AbortSignal;
        };
    }): import("../definitions/types/EventSubscription").default;
    /**
     * Removes an Event Listener from the instance or from object
     * @param eventName the event name to be listening
     * @param callback the callback that should be fired
     * @param attachedNode A node to attach the event
     */
    off(eventName: string, callback: (event: CustomEvent | Event) => void, attachedNode?: Node): void;
    /**
     * Dispatch an event
     * @param options options for the emission
     */
    emit(eventName: string, options?: {
        element?: Node;
        init?: CustomEventInit;
        once?: boolean;
    }): void;
    /**
     * Limits sequential execution to a single one acording to the milliseconds provided
     * @param callback the callback that should be performed the execution
     * @param wait milliseconds to the be waited before the single execution
     * @returns executable function
     */
    lazy(callback: (args: IArguments) => void, wait?: number): () => void;
    /**
     * Compiles an html element
     * @param options the options of the compilation process
     * @returns
     */
    compile(options: {
        /** The element that wil be compiled */
        el: Element;
        /** The context of this compilation process */
        context: object;
        /** The data that should be injected in the compilation */
        data?: object;
        /** The function that should be fired when the compilation is done */
        onDone?: (element: Element, data?: object | undefined) => void;
    }): Element;
    destroy(): void;
    beforeLoad?(event: CustomEvent): void;
    loaded?(event: CustomEvent): void;
    beforeDestroy?(event: CustomEvent): void;
    destroyed?(event: CustomEvent): void;
}
