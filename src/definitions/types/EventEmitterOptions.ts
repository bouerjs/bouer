export type EventEmitterOptions = {
	eventName: string
	init?: CustomEventInit,
	once?: boolean,
	attachedNode?: Node
}

export default EventEmitterOptions;