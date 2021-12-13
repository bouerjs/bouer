import EventEmitterOptions from "../../definitions/types/EventEmitterOptions";
import EventModifiers from "../../definitions/types/EventModifiers";
import EventSubscription from "../../definitions/types/EventSubscription";
import Bouer from "../../instance/Bouer";
import Evaluator from "../Evaluator";
export default class EventHandler {
    bouer: Bouer;
    evaluator: Evaluator;
    $events: {
        [key: string]: EventSubscription[];
    };
    input: HTMLInputElement;
    constructor(bouer: Bouer);
    handle(node: Node, data: object, context: object): void;
    on(options: {
        eventName: string;
        callback: (event: CustomEvent | Event) => void;
        attachedNode?: Node;
        context: object;
        modifiers?: EventModifiers;
    }): EventSubscription;
    off(options: {
        eventName: string;
        callback: (event: CustomEvent | Event) => void;
        attachedNode?: Node;
    }): void;
    emit(options: EventEmitterOptions): void;
    private cleanup;
}
