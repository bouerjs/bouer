import Bouer from "../instance/Bouer";
import { Constants } from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import { buildError, connectNode, createEl, forEach, isFunction, isNull, taskRunner, toLower, trim } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Evaluator from "../Evaluator";
import BouerEvent from "./BouerEvent";
import IoC from "../../shared/helpers/IoC";

type EventSubscription = {
  eventName: string
  callback: (evt: BouerEvent, ...args: any[]) => void,
  attachedNode?: Node
}

type EventEmitterOptions = {
  eventName: string
  arguments?: any[],
  once?: boolean,
  attachedNode?: Node
}

export default class EventHandler {
  private bouer: Bouer;
  private evaluator: Evaluator;
  private events: EventSubscription[] = [];
  private input: HTMLInputElement;

  constructor(bouer: Bouer) {
    this.bouer = bouer;
    this.evaluator = IoC.Resolve('Evaluator')!;
    this.input = createEl('input').build();

    IoC.Register(this);
    this.cleanup();
  }

  handle(node: Node, data: object) {
    let ownerElement = ((node as any).ownerElement || node.parentNode) as Element;
    const nodeName = node.nodeName;

    if (isNull(ownerElement))
      return Logger.error(new Error("Invalid ParentElement of “" + nodeName + "”"));

    // <button on:submit.once.stopPropagation="times++"></button>
    const nodeValue = trim(node.nodeValue ?? '');

    const eventNameWithModifiers = nodeName.substr(Constants.on.length);
    const modifiers = eventNameWithModifiers.split('.');
    const eventName = modifiers[0];
    modifiers.shift();

    if (nodeValue === '')
      return Logger.error(new Error("Expected an expression in the “" + nodeName + "” and got an <empty string>."));

    connectNode(node, ownerElement);
    ownerElement.removeAttribute(nodeName);

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
        } catch (error) {
          Logger.error(buildError(error));
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
      this.on(eventName, callback, ownerElement)
    }
  }

  on(eventName: string, callback: (event: BouerEvent, ...args: any[]) => void, attachedNode?: Node) {
    const event: EventSubscription = {
      eventName: eventName,
      callback: (evt, args) => callback(evt, args),
      attachedNode: attachedNode
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

    if (event) this.events.splice(index, 1);

    return event;
  }

  emit(options: EventEmitterOptions) {
    const { eventName, arguments: mArguments } = options;
    forEach(this.events, (event, index) => {
      if (eventName !== event.eventName)
        return;

      if (!options.attachedNode && event.attachedNode !== options.attachedNode)
        return;

      event.callback.call(this.bouer, new BouerEvent({
        type: eventName,
        target: options.attachedNode
      }), (mArguments || []));

      if ((options.once ?? false) === true)
        this.events.splice(index, 1);
    });
  }

  private cleanup() {
    taskRunner(() => {
      const availableEvents: EventSubscription[] = [];
      forEach(this.events, event => {
        if (!event.attachedNode) return availableEvents.push(event);
        if (event.attachedNode.isConnected) return availableEvents.push(event);
      });
      this.events = availableEvents;
    }, 1000);
  }
}
