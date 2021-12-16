export default interface IEventEmitterOptions {
	eventName: string
	init?: CustomEventInit,
	once?: boolean,
	attachedNode?: Node
}