import IEventEmitterOptions from "../../definitions/interfaces/IEventEmitterOptions";
import IEventModifiers from "../../definitions/interfaces/IEventModifiers";
import IEventSubscription from "../../definitions/interfaces/IEventSubscription";
import RenderContext from "../../definitions/types/RenderContext";
import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import Constants from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import Task from "../../shared/helpers/Task";
import {
	buildError,
	createEl,
	forEach,
	isFunction,
	isNull,
	trim,
	where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Evaluator from "../Evaluator";
import Base from "../Base";

export default class EventHandler extends Base {
	bouer: Bouer;
	evaluator: Evaluator;
	$events: { [key: string]: IEventSubscription[] } = {};
	input = createEl('input').build();

	constructor(bouer: Bouer) {
		super();

		this.bouer = bouer;
		this.evaluator = IoC.Resolve(this.bouer, Evaluator)!;

		IoC.Register(this);
		this.cleanup();
	}

	handle(node: Node, data: object, context: RenderContext) {
		const ownerNode = ((node as any).ownerElement || node.parentNode) as Element;
		const nodeName = node.nodeName;

		if (isNull(ownerNode))
			return Logger.error("Invalid ParentElement of “" + nodeName + "”");

		// <button on:submit.once.stopPropagation="times++"></button>
		const nodeValue = trim(node.nodeValue ?? '');

		const eventNameWithModifiers = nodeName.substring(Constants.on.length);
		let allModifiers = eventNameWithModifiers.split('.');
		const eventName = allModifiers[0];
		allModifiers.shift();
		const modifierFunctions = [];

		if (nodeValue === '')
			return Logger.error("Expected an expression in the “" + nodeName + "” and got an <empty string>.");

		ownerNode.removeAttribute(nodeName);

		const callback = (evt: CustomEvent | Event) => {
			// Calling the modifiers
			const availableModifiersFunction: any = {
				'prevent': 'preventDefault',
				'stop': 'stopPropagation'
			};

			forEach(allModifiers, modifier => {
				const modifierFunctionName = availableModifiersFunction[modifier];
				if ((evt as any)[modifierFunctionName]) (evt as any)[modifierFunctionName]();
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

		const modifiersObject: dynamic = {};
		const addEventListenerOptions = ['capture', 'once', 'passive'];
		forEach(allModifiers, md => {
			md = md.toLocaleLowerCase();
			if (addEventListenerOptions.indexOf(md) !== -1) {
				modifiersObject[md] = true;
			} else {
				modifierFunctions.push(md);
			}
		});

		if (!('on' + eventName in this.input))
			this.on({ eventName, callback, modifiers: modifiersObject, context, attachedNode: ownerNode });
		else
			ownerNode.addEventListener(eventName, callback, modifiersObject);
	}

	on(options: {
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node,
		context: RenderContext,
		modifiers?: IEventModifiers
	}) {
		const { eventName, callback, context, attachedNode, modifiers } = options;
		const event: IEventSubscription = {
			eventName: eventName,
			callback: evt => callback.apply(context || this.bouer, [evt]),
			attachedNode: attachedNode,
			modifiers: modifiers,
			emit: options => this.emit({
				eventName: eventName,
				attachedNode: attachedNode,
				init: (options || {}).init,
				once: (options || {}).once,
			})
		};

		if (!this.$events[eventName])
			this.$events[eventName] = [];

		this.$events[eventName].push(event);
		return event;
	}

	off(options: {
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node
	}) {

		const { eventName, callback, attachedNode } = options;
		if (!this.$events[eventName])
			return;

		this.$events[eventName] = where(this.$events[eventName], evt => {
			if (attachedNode)
				return (evt.attachedNode === attachedNode)

			return !(evt.eventName === eventName && callback == evt.callback);
		});
	}

	emit(options: IEventEmitterOptions) {
		const { eventName, init, once, attachedNode } = options;
		const events = this.$events[eventName];

		if (!events)
			return;

		const emitter = (node: Node, callback: any) => {
			node.addEventListener(eventName, callback, { once: true });
			node.dispatchEvent(new CustomEvent(eventName, init));
		}

		forEach(events, evt => {
			const node = evt.attachedNode;

			// If a node was provided, just dispatch the events in this node
			if (attachedNode) {
				if (node !== attachedNode) return;
				return emitter(node, evt.callback);
			}

			// Otherwise, if this events has a node, dispatch the node event
			if (node) return emitter(node, evt.callback);

			// Otherwise, dispatch the event
			evt.callback.call(this.bouer, new CustomEvent(eventName, init));
			if ((once ?? false) === true)
				events.splice(events.indexOf(evt), 1);
		});
	}

	private cleanup() {
		Task.run(() => {
			forEach(Object.keys(this.$events), key => {
				this.$events[key] = where(this.$events[key], event => {
					if (!event.attachedNode) return true;
					if (event.attachedNode.isConnected) return true;
				});
			});
		}, 1000);
	}
}
