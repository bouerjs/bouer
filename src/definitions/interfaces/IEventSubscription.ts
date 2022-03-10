import IEventModifiers from './IEventModifiers';

interface IEventSubscription {
  eventName: string
  attachedNode?: Node,
  modifiers?: IEventModifiers,
  callback: (evt: Event | CustomEvent, ...args: any[]) => void,
  emit: (options?: { init?: CustomEventInit, once?: boolean, }) => void
}

export default IEventSubscription;