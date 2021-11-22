import { Constants } from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import { buildError, connectNode, forEach, isFunction, isNull, taskRunner, toLower, trim, where } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import dynamic from "../../types/dynamic";
import Evaluator from "../Evaluator";
import Bouer from "../../instance/Bouer";

export type EventEmitterOptions = {
	eventName: string
	init?: CustomEventInit,
	once?: boolean,
	attachedNode?: Node
}

export type EventSubscription = {
	eventName: string
	attachedNode?: Node,
	callback: (evt: Event | CustomEvent, ...args: any[]) => void,
	emit: (options?: { init?: CustomEventInit, once?: boolean, }) => void
}
export default class EventHandler {
	private bouer: Bouer;
	private evaluator: Evaluator;
	private events: EventSubscription[] = [];

	constructor(bouer: Bouer) {
		this.bouer = bouer;
		this.evaluator = IoC.Resolve('Evaluator')!;

		IoC.Register(this);
		this.cleanup();
	}

	handle(node: Node, data: object, context: object) {
		let ownerElement = ((node as any).ownerElement || node.parentNode) as Element;
		const nodeName = node.nodeName;

		if (isNull(ownerElement))
			return Logger.error("Invalid ParentElement of “" + nodeName + "”");

		// <button on:submit.once.stopPropagation="times++"></button>
		const nodeValue = trim(node.nodeValue ?? '');

		const eventNameWithModifiers = nodeName.substr(Constants.on.length);
		const modifiersList = eventNameWithModifiers.split('.');
		const eventName = modifiersList[0];
		modifiersList.shift();

		if (nodeValue === '')
			return Logger.error("Expected an expression in the “" + nodeName + "” and got an <empty string>.");

		connectNode(node, ownerElement);
		ownerElement.removeAttribute(nodeName);

		const callback = (evt: CustomEvent | Event) => {
			// Calling the modifiers
			forEach(modifiersList, modifier => {
				forEach(Object.keys(evt), key => {
					let fnModifier;
					if (fnModifier = (evt as any)[key] && isFunction(fnModifier) && toLower(key) === toLower(modifier))
						fnModifier();
				})
			});

			const mArguments = [evt];
			const isResultFunction = this.evaluator.exec({
				data: data,
				expression: nodeValue,
				args: mArguments,
				aditional: { event: evt },
				context: context
			});

			if (isFunction(isResultFunction)) {
				try {
					(isResultFunction as Function).apply(context, mArguments);
				} catch (error) {
					Logger.error(buildError(error));
				}
			}
		}

		const modifiers: dynamic = {};
		const addEventListenerOptions = ['capture', 'once', 'passive'];
		forEach(modifiersList, md => {
			md = md.toLocaleLowerCase();
			if (addEventListenerOptions.indexOf(md) !== -1)
				modifiers[md] = true;
		});

		this.on({
			eventName,
			callback,
			modifiers,
			context,
			attachedNode: ownerElement,
		});
	}

	on(options: {
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node,
		context: object,
		modifiers?: {
			capture?: boolean;
			once?: boolean;
			passive?: boolean;
			signal?: AbortSignal;
		}
	}) {

		const { eventName, callback, context, attachedNode, modifiers } = options;
		const event: EventSubscription = {
			eventName: eventName,
			callback: evt => callback.apply(context || this.bouer, [evt]),
			attachedNode: attachedNode,
			emit: options => this.emit({
				eventName: eventName,
				attachedNode: attachedNode,
				init: (options || {}).init,
				once: (options || {}).once,
			})
		};

		if (attachedNode)
			attachedNode.addEventListener(eventName, event.callback, modifiers || false);
		else
			this.events.push(event);
		return event;
	}

	off(options: {
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node
	}) {

		const { eventName, callback, attachedNode } = options;
		if (attachedNode)
			return attachedNode.removeEventListener(eventName, callback);

		let index = -1;
		this.events.find((evt, idx) => {
			if (evt.eventName === eventName && callback == evt.callback) {
				index = idx;
				return true;
			}
		});

		this.events.splice(index, 1);
	}

	emit(options: EventEmitterOptions) {
		const { eventName, init, attachedNode } = options;
		const customEvent = new CustomEvent(eventName, init);

		if (attachedNode)
			return attachedNode.dispatchEvent(customEvent)

		forEach(this.events, (event, index) => {
			if (eventName !== event.eventName) return;
			event.callback.call(this.bouer, customEvent);
			if ((options.once ?? false) === true)
				this.events.splice(index, 1);
		});
	}

	private cleanup() {
		taskRunner(() => {
			this.events = where(this.events, event => {
				if (!event.attachedNode) return true;
				if (event.attachedNode.isConnected) return true;
			});
		}, 1000);
	}
}
