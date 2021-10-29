import IoC from "../../shared/helpers/IoC";
import UriHandler from "../../shared/helpers/UriHandler";
import {
  DOM,
  forEach, isNull,
  isObject,
  toArray,
  transferProperty
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import dynamic from "../../types/dynamic";
import IComponent from "../../types/IComponent";
import ILifeCycleHooks from "../../types/ILifeCycleHooks";
import EventHandler, { EventSubscription } from "../event/EventHandler";
import Bouer from "../instance/Bouer";
import Reactive from "../reactive/Reactive";
import ComponentHandler from "./ComponentHandler";

export default class Component implements IComponent {
  name: string
  path: string;
  title?: string;
  route?: string;
  template?: string;
  data?: object;
  keepAlive?: boolean;
  isDefault?: boolean;
  isNotFound?: boolean;
  children?: Array<IComponent>;

  bouer: Bouer | undefined;
  el: Element | undefined | null;
  scripts: Array<HTMLScriptElement> = [];
  styles: Array<HTMLStyleElement | HTMLLinkElement> = [];
  // Store temporarily this component UI orders
  events: EventSubscription[] = [];

  public get isReady() {
    return !isNull(this.template);
  }

  /** The anchors attached to this component */
  private links?: Array<HTMLAnchorElement>;

  constructor(options: IComponent) {
    this.name = options.name!;
    this.path = options.path!;

    Object.assign(this, options);
    this.data = Reactive.transform(this.data || {});
  }

  export(options: object) {
    if (!isObject(options))
      return Logger.log("Invalid object for component.export(...), only \"Object Literal\" is allowed.");

    return forEach(Object.keys(options), key => {
      (this.data as any)[key] = (options as any)[key];
      transferProperty(this.data, options, key);
    });
  }

  destroy() {
    if (!this.el) return false;
    this.emit('beforeDestroy');

    let container = this.el.parentElement;
    if (container) container.removeChild(this.el) !== null;

    this.emit('destroyed');

    // Destroying all the events attached to the this instance
    forEach(this.events, evt => this.off((evt.eventName as any), evt.callback));
    this.events = [];

    forEach(this.styles, style =>
      forEach(toArray(DOM.head.children), item => {
        if (item === style)
          DOM.removeChild(style);
      }))
  }

  params() {
    return new UriHandler().params(this.route);
  }

  emit<TKey extends keyof ILifeCycleHooks>(eventName: TKey, init?: CustomEventInit) {
    const eventHandler = IoC.Resolve<EventHandler>('EventHandler')!;
    eventHandler.emit({
      eventName: eventName,
      attachedNode: this.el!,
      init: init
    })
  }

  on<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: CustomEvent) => void) {
    const eventHandler = IoC.Resolve<EventHandler>('EventHandler')!;
    const evt = eventHandler.on(eventName, callback as any, this.el!);
    this.events.push(evt);
  }

  off<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: CustomEvent) => void) {
    const eventHandler = IoC.Resolve<EventHandler>('EventHandler')!;
    eventHandler.on(eventName, callback as any, this.el!);
  }
}
