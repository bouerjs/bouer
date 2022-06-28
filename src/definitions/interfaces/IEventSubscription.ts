import IEventModifiers from './IEventModifiers';

interface IEventSubscription {
  eventName: string
  attachedNode?: Node,
  modifiers?: IEventModifiers,
  callback: (evt: Event | CustomEvent, ...args: any[]) => void | Promise<any>,
  emit: (options?: { init?: CustomEventInit, once?: boolean, }) => void,
  destroy: () => void
}

export default IEventSubscription;