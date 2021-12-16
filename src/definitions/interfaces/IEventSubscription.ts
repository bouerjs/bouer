import IEventModifiers from "./IEventModifiers";

export default interface IEventSubscription {
	eventName: string
	attachedNode?: Node,
	modifiers?: IEventModifiers,
	callback: (evt: Event | CustomEvent, ...args: any[]) => void,
	emit: (options?: { init?: CustomEventInit, once?: boolean, }) => void
}