import IComponent from "../../definitions/interfaces/IComponent";
import Bouer from "../../instance/Bouer";
import Component from "../component/Component";
export default class Routing {
    bouer: Bouer;
    defaultPage?: Component | IComponent;
    notFoundPage?: Component | IComponent;
    routeView: Element | null;
    activeAnchors: HTMLAnchorElement[];
    base: string | null;
    constructor(bouer: Bouer);
    init(): void;
    /**
     * Navigates to a certain page without reloading all the page
     * @param route the route to navigate to
     * @param changeUrl allow to change the url after the navigation, default value is `true`
     */
    navigate(route: string, changeUrl?: boolean): void;
    pushState(url: string, title?: string): void;
    popState(times?: number): void;
    private toPage;
    markActiveAnchors(route: string): void;
    clear(): void;
    /**
     * Allow to configure the `Default Page` and `NotFound Page`
     * @param component the component to be checked
     */
    configure(component: IComponent): void;
}
