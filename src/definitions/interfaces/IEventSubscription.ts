import IEventModifiers from './IEventModifiers';

interface IEventSubscription {
  /** The name of the event */
  eventName: string
  /** The event attached node */
  attachedNode?: Node,
  /** all the modifiers of the event */
  modifiers?: IEventModifiers,
  /**
   * the callback that will be performed
   * @param evt the event object
   * @param args other values provided to the event
   * @returns nothing or a promise according to the event
   */
  callback: (evt: Event | CustomEvent, ...args: any[]) => void | Promise<any>,
  /**
   * A method to dispatch the current event
   * @param options Options that can provided on the emission
   */
  emit: (options?: {
    /** An optional values that can be provided on the emission like some data in the detail object */
    init?: CustomEventInit,
    /** Mark the current event to be dispatched only once */
    once?: boolean
  }) => void,
  /** A method to be able to destroy the current event */
  destroy: () => void
}

export default IEventSubscription;