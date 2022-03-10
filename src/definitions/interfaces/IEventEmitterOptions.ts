interface IEventEmitterOptions {
  eventName: string
  init?: CustomEventInit,
  once?: boolean,
  attachedNode?: Node
}

export default IEventEmitterOptions;