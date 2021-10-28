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
import BouerEvent from "../event/BouerEvent";
import Bouer from "../instance/Bouer";
import Reactive from "../reactive/Reactive";

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
  events: any = {};

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
    this.events = {};

    forEach(this.styles, style =>
      forEach(toArray(DOM.head.children), item => {
        if (item === style)
          DOM.removeChild(style);
      }))
  }

  params() {
    return new UriHandler().params(this.route);
  }

  emit<TKey extends keyof ILifeCycleHooks>(eventName: TKey, ...params: any[]) {
    const mThis = this as dynamic;
    if (eventName in mThis && typeof mThis[eventName] === 'function')
      mThis[eventName](new BouerEvent({ type: eventName, targert: this }));

    // Firing all subscribed events
    const events = this.events[eventName];
    if (!events) return false;
    forEach(events, (event: (event: BouerEvent, ...params: any[]) => void) =>
      event(new BouerEvent({ type: eventName }), ...params));
    return true;
  }

  on<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: BouerEvent, ...params: any[]) => void) {
    if (!this.events[eventName])
      this.events[eventName] = [];
    this.events[eventName].push(callback);
    return {
      eventName,
      callback
    };
  }

  off<TKey extends keyof ILifeCycleHooks>(eventName: TKey, callback: (event: BouerEvent, ...params: any[]) => void) {
    if (!this.events[eventName]) return false;
    const eventIndex = this.events[eventName].indexOf(callback);
    this.events[eventName].splice(eventIndex, 1);
    return true;
  }
}
