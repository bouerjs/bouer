export default class BouerEvent implements Event {
  private source: Event;

  constructor(options: { type: string, source?: Event }) {
    const { source, type } = options;
    this.source = source || new Event(type);

    this.bubbles = this.source.bubbles;
    this.cancelBubble = this.source.cancelBubble;
    this.cancelable = this.source.cancelable;
    this.composed = this.source.composed;
    this.currentTarget = this.source.currentTarget;
    this.defaultPrevented = this.source.defaultPrevented;
    this.eventPhase = this.source.eventPhase;
    this.isTrusted = this.source.isTrusted;
    this.target = this.source.target;
    this.timeStamp = this.source.timeStamp;
    this.type = this.source.type;

    /* @deprecated but required on Typescript */
    this.returnValue = this.source.returnValue;
    this.srcElement = this.source.srcElement;
    /* End @deprecated but required on Typescript */

    this.AT_TARGET = this.source.AT_TARGET;
    this.BUBBLING_PHASE = this.source.BUBBLING_PHASE;
    this.CAPTURING_PHASE = this.source.CAPTURING_PHASE;
    this.NONE = this.source.NONE;
  }

  bubbles: boolean;
  cancelBubble: boolean;
  cancelable: boolean;
  composed: boolean;
  currentTarget: EventTarget | null;
  defaultPrevented: boolean;
  eventPhase: number;
  isTrusted: boolean;
  returnValue: boolean;
  srcElement: EventTarget | null;
  target: EventTarget | null;
  timeStamp: number;
  type: string;

  composedPath = () =>
    this.source.composedPath();

  initEvent = (type: string, bubbles?: boolean, cancelable?: boolean) =>
    this.source.initEvent(type, bubbles, cancelable)

  preventDefault = () =>
    this.source.preventDefault();

  stopImmediatePropagation = () =>
    this.source.stopImmediatePropagation();

  stopPropagation = () =>
    this.source.stopPropagation();

  AT_TARGET: number;
  BUBBLING_PHASE: number;
  CAPTURING_PHASE: number;
  NONE: number;
}
