import Bouer from "../../Bouer";
import { Constants } from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import { createEl, forEach, isFunction, isNull, toLower, trim } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Evaluator from "../Evaluator";
import BouerEvent from "./BouerEvent";

type EventSubscription = {
  eventName: string
  callback: (evt: BouerEvent, args: any[]) => void
}

type EventEmitterOptions = {
  eventName: string
  arguments?: any[]
}

export default class EventHandler {
  /**
   * Provide the instance of the class.
   * link: https://refactoring.guru/design-patterns/singleton
   */
  static singleton: EventHandler;

  private bouer: Bouer;
  private evaluator: Evaluator;
  private events: Array<EventSubscription> = [];
  private input: HTMLInputElement;

  constructor(bouer: Bouer) {
    EventHandler.singleton = this;

    this.bouer = bouer;
    this.evaluator = Evaluator.singleton;
    this.input = createEl('input').build();
  }

  handle(node: Node, data: object) {
    let ownerElement = ((node as any).ownerElement || node.parentNode) as Element;
    const nodeName = node.nodeName;

    if (isNull(ownerElement))
      return Logger.error("Invalid ParentElement of \"" + nodeName + "\"");

    // <button on:submit.once.stopPropagation="times++"></button>
    const nodeValue = trim(node.nodeValue ?? '');

    const eventNameWithModifiers = nodeName.substr(Constants.on.length);
    const modifiers = eventNameWithModifiers.split('.');
    const eventName = modifiers[0];
    modifiers.shift();

    if (nodeValue === '')
      Logger.error("Expected an expression in the \"" + nodeName + "\" and got an <empty string>.");

    const callback = (evt: Event, args: any[]) => {
      const isCallOnce = (modifiers.indexOf('once') !== -1)

      // Calling the modifiers
      forEach(modifiers, modifier => {
        forEach(Object.keys(evt), key => {
          let fnModifier;
          if (fnModifier = (evt as any)[key] && isFunction(fnModifier) &&
            toLower(key) === toLower(modifier))
            fnModifier();
        })
      });

      const event = new BouerEvent({
        source: evt,
        type: evt.type
      });

      const mArguments = Extend.array(event, args);

      const isResultFunction = this.evaluator.exec({
        data: Extend.obj(data, { event: event }),
        expression: nodeValue,
        args: mArguments
      });

      if (isFunction(isResultFunction)) {
        try {
          (isResultFunction as Function).apply(this.bouer, mArguments);
        } catch (error: any) {
          error.stack = '';
          Logger.error(error);
        }
      }

      return isCallOnce;
    }

    // Native Event Subscription
    if (('on' + eventName) in this.input) {
      const callbackNavite = (evt: Event) => {
        if (callback(evt, [])) // Returns isCallOnce boolean value
          ownerElement.removeEventListener(eventName, callbackNavite, false);
      }

      ownerElement.addEventListener(eventName, callbackNavite, false);
    } else {
      this.on(eventName, callback)
    }
  }

  on(eventName: string, callback: (event: BouerEvent, ...args: any[]) => void) {
    const event: EventSubscription = {
      eventName: eventName,
      callback: (evt, args) => callback(evt, args)
    };

    this.events.push(event);

    return event;
  }

  off(eventName: string, callback: (event: BouerEvent, ...args: any[]) => void) {
    let index = -1;
    const event = this.events.find((evt, idx) => {
      if (evt.eventName === eventName && callback == evt.callback) {
        index = idx;
        return true;
      }
    });

    if (event)
      this.events.splice(index, 1);

    return event;
  }

  emit(options: EventEmitterOptions) {
    const { eventName, arguments: mArguments } = options;
    forEach(this.events, event => {
      if (eventName !== event.eventName)
        return;
      event.callback.call(this.bouer, new BouerEvent({
        type: eventName
      }), mArguments || []);
    });
  }
}
