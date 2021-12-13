import EventModifiers from "./EventModifiers";
declare type EventSubscription = {
    eventName: string;
    attachedNode?: Node;
    modifiers?: EventModifiers;
    callback: (evt: Event | CustomEvent, ...args: any[]) => void;
    emit: (options?: {
        init?: CustomEventInit;
        once?: boolean;
    }) => void;
};
export default EventSubscription;
