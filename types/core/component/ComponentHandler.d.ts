import IComponent from "../../definitions/interfaces/IComponent";
import Bouer from "../../instance/Bouer";
import DelimiterHandler from "../DelimiterHandler";
import EventHandler from "../event/EventHandler";
import Component from "./Component";
export default class ComponentHandler {
    private bouer;
    private requests;
    delimiter: DelimiterHandler;
    eventHandler: EventHandler;
    components: {
        [key: string]: (Component | IComponent);
    };
    stylesController: {
        [key: string]: {
            styles: Element[];
            elements: Element[];
        };
    };
    constructor(bouer: Bouer);
    check(nodeName: string): boolean;
    request(url: string, response: {
        success: (content: string, url: string) => void;
        fail: (error: any, url: string) => void;
    }): any;
    prepare(components: (Component | IComponent)[], parent?: (Component | IComponent)): void;
    order(componentElement: Element, data: object, callback?: (component: Component) => void): void | Promise<void>;
    find(callback: (item: (Component | IComponent)) => boolean): IComponent | null;
    /** Subscribe the hooks of the instance */
    addComponentEventAndEmitGlobalEvent(eventName: string, element: Element, component: any, context?: object): {
        emit: (init?: CustomEventInit<any> | undefined) => void;
    };
    private insert;
}
