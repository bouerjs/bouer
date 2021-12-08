import { Constants } from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import {
	createEl,
	forEach, isFunction, isNull,
	isObject,
	toArray,
	toLower,
	toStr,
	trim,
	where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import delimiterResponse from "../../types/delimiterResponse";
import dynamic from "../../types/dynamic";
import watchCallback from "../../types/watchCallback";
import Compiler from "../compiler/Compiler";
import Evaluator from "../Evaluator";
import ReactiveEvent from "../event/ReactiveEvent";
import Bouer from "../../instance/Bouer";
import Watch from "./Watch";
import Middleware from "../middleware/Middleware";
import Task from "../../shared/helpers/Task";
export interface BinderConfig {
	node: Node,
	data: dynamic,
	parent: Element,
	nodeName: string,
	nodeValue: string,
	fields: delimiterResponse[],
	argument?: string,
	modifiers?: string[],
	value: string
}

export default class Binder {
	bouer: Bouer;
	evaluator: Evaluator;
	binds: Watch<any, any>[] = [];

	private DEFAULT_BINDER_PROPERTIES: any = {
		'text': 'value',
		'number': 'valueAsNumber',
		'checkbox': 'checked',
		'radio': 'checked',
	}
	private BindingDirection = {
		fromInputToData: 'to-data-property',
		fromDataToInput: 'to-input'
	}

	constructor(bouer: Bouer) {
		this.bouer = bouer;
		this.evaluator = IoC.Resolve(this.bouer, Evaluator)!;

		IoC.Register(this);
		this.cleanup();
	}

	create(options: {
		node: Node,
		data: dynamic,
		fields: delimiterResponse[],
		isReplaceProperty?: boolean,
		context: object,
		onUpdate?: (value: any, node: Node) => void,
	}) {
		const { node, data, fields, isReplaceProperty, context } = options;
		const originalValue = trim(node.nodeValue ?? '');
		const originalName = node.nodeName;
		const ownerElement = (node as any).ownerElement || node.parentNode;
		const onUpdate = options.onUpdate || ((v: any, n: Node) => { });

		const middleware = IoC.Resolve<Middleware>(this.bouer, Middleware)!;

		// Clousure cache property settings
		const propertyBindConfig: BinderConfig = {
			node: node,
			data: data,
			nodeName: originalName,
			nodeValue: originalValue,
			fields: fields,
			parent: ownerElement,
			value: ''
		};

		const $middleware = (type: 'bind' | 'update') => {
			middleware.run(originalName, {
				type: type,
				action: middleware => {
					middleware({
						binder: propertyBindConfig,
						detail: {}
					}, {
						success: () => { },
						fail: () => { },
						done: () => { }
					})
				}
			});
		}

		// Two-Way Data Binding: e-bind:[?]="..."
		if (originalName.substr(0, Constants.bind.length) === Constants.bind) {
			let propertyNameToBind = '';
			if (Constants.bind === originalName) {
				const key = ownerElement.type || ownerElement.localName;
				propertyNameToBind = this.DEFAULT_BINDER_PROPERTIES[key] || 'value';
			} else {
				propertyNameToBind = originalName.split(':')[1]; // e-bind:value -> value
			}

			const isSelect = (ownerElement instanceof HTMLSelectElement);
			const isSelectMultiple = isSelect && ownerElement.multiple === true;
			const bindConfig = originalValue.split('|').map(x => trim(x));
			const bindProperty = bindConfig[0];
			let boundPropertyValue: any;
			let bindModelValue: any;
			let bindModel: any;

			const callback = (direction: string, value: any,) => {
				if (!(bindModel = bindConfig[1])) {
					const attrValue = trim(ownerElement.getAttribute('value'))
					if (attrValue) bindModel = "'" + attrValue + "'";
				}

				if (isSelect && !isSelectMultiple && Array.isArray(boundPropertyValue) && !bindModel) {
					return Logger.error("Since it's a <select> array binding, it expects the “multiple” attribute in" +
						" order to bind the multi values.");
				}

				// Array Binding
				if (!isSelectMultiple && (Array.isArray(boundPropertyValue) && !bindModel)) {
					return Logger.error("Since it's an array binding it expects a model but it has not been defined" +
						", provide a model as it follows " +
						originalName + "=\"" + bindProperty + " | Model\" or value=\"String-Model\".");
				}

				switch (direction) {
					case this.BindingDirection.fromDataToInput: {
						if (Array.isArray(boundPropertyValue)) {
							// select-multiple handling
							if (isSelectMultiple) {
								return forEach(toArray(ownerElement.options), (option: HTMLOptionElement) => {
									option.selected = boundPropertyValue.indexOf(trim(option.value)) !== -1;
								});
							}

							// checkboxes, radio, etc
							if (boundPropertyValue.indexOf(bindModelValue) === -1) {
								switch (typeof ownerElement[propertyNameToBind]) {
									case 'boolean': ownerElement[propertyNameToBind] = false; break;
									case 'number': ownerElement[propertyNameToBind] = 0; break;
									default: ownerElement[propertyNameToBind] = ""; break;
								}
							}

							return;
						}

						// Default Binding
						return ownerElement[propertyNameToBind] = (isObject(value) ? toStr(value) : (isNull(value) ? '' : value));
					}
					case this.BindingDirection.fromInputToData: {
						if (Array.isArray(boundPropertyValue)) {
							// select-multiple handling
							if (isSelectMultiple) {
								const optionCollection: string[] = [];
								forEach(toArray(ownerElement.options), (option: HTMLOptionElement) => {
									if (option.selected === true)
										optionCollection.push(trim(option.value));
								});

								boundPropertyValue.splice(0, boundPropertyValue.length);
								return boundPropertyValue.push.apply(boundPropertyValue, optionCollection);
							}

							bindModelValue = bindModelValue || this.evaluator.exec({
								data: data,
								expression: bindModel,
								context: context
							});
							if (value)
								boundPropertyValue.push(bindModelValue);
							else
								boundPropertyValue.splice(boundPropertyValue.indexOf(bindModelValue), 1);
							return;
						}

						// Default Binding
						return data[bindProperty] = value;
					}
				}
			}

			const reactiveEvent = ReactiveEvent.on('AfterGet', reactive => {
				this.binds.push(reactive.onChange(value => {
					callback(this.BindingDirection.fromDataToInput, value)
					onUpdate(value, node);
					$middleware('update');
				}, node));
			});

			const result = boundPropertyValue = this.evaluator.exec({
				data: data,
				expression: bindProperty,
				context: context
			});

			reactiveEvent.off();

			callback(this.BindingDirection.fromDataToInput, result);

			const listeners = [toLower(ownerElement.nodeName), 'propertychange', 'change'];
			const callbackEvent = () => {
				callback(this.BindingDirection.fromInputToData, ownerElement[propertyNameToBind]);
			};

			// Applying the events
			forEach(listeners, listener => {
				if (listener === 'change' && ownerElement.localName !== 'select') return;
				ownerElement.addEventListener(listener, callbackEvent, false);
			});

			// Removing the e-bind attr
			ownerElement.removeAttribute(node.nodeName);
			$middleware('bind');
			return propertyBindConfig; // Stop Two-Way Data Binding Process
		}

		// One-Way Data Binding
		let nodeToBind = node;

		// If definable property e-[?]="..."
		if (originalName.substr(0, Constants.property.length) === Constants.property && isNull(isReplaceProperty)) {
			propertyBindConfig.nodeName = originalName.substr(Constants.property.length);
			ownerElement.setAttribute(propertyBindConfig.nodeName, originalValue);
			nodeToBind = ownerElement.attributes[propertyBindConfig.nodeName];

			// Removing the e-[?] attr
			ownerElement.removeAttribute(node.nodeName);
		}

		// Property value setter
		const setter = () => {
			let valueToSet = propertyBindConfig.nodeValue;
			let isHtml = false;

			// Looping all the fields to be setted
			forEach(fields, field => {
				const delimiter = field.delimiter;

				if (delimiter && delimiter.name === 'html')
					isHtml = true;

				let result = this.evaluator.exec({
					data: data,
					expression: field.expression,
					context: context
				});

				result = isNull(result) ? '' : result;
				valueToSet = valueToSet.replace(field.field, toStr(result));

				if (delimiter && isFunction(delimiter.action))
					valueToSet = delimiter.action!(valueToSet, node, data);
			});

			propertyBindConfig.value = valueToSet;

			if (!isHtml)
				nodeToBind.nodeValue = valueToSet;
			else {
				const htmlSnippet = createEl('div', el => {
					el.innerHTML = valueToSet;
				}).build().children[0];
				ownerElement.appendChild(htmlSnippet);
				IoC.Resolve<Compiler>(this.bouer, Compiler)!.compile({
					el: htmlSnippet,
					data: data,
					context: context
				})
			}
		}

		ReactiveEvent.once('AfterGet', event => {
			event.onemit = reactive => {
				this.binds.push(reactive.onChange(value => {
					setter();
					onUpdate(value, node);
					$middleware('update');
				}, node));
			}
			setter();
		});

		propertyBindConfig.node = nodeToBind;
		$middleware('bind');
		return propertyBindConfig;
	}

	onPropertyChange(propertyName: string, callback: watchCallback, targetObject?: object) {
		let mWatch: Watch<any, any> | null = null;
		const mTargetObject = targetObject || this.bouer.data;

		ReactiveEvent.once('AfterGet', event => {
			event.onemit = reactive => mWatch = reactive.onChange(callback);
			const _ = (mTargetObject as any)[propertyName];
		});

		return mWatch;
	}

	onPropertyInScopeChange(watchable: () => void) {
		const watches: Watch<any, any>[] = [];

		ReactiveEvent.once('AfterGet', evt => {
			evt.onemit = reactive => {
				watches.push(new Watch(reactive, () => watchable()));
			}
			watchable();
		})

		return watches;
	}

	/** Creates a process for unbind properties when it does not exists anymore in the DOM */
	private cleanup() {
		Task.run(() => {
			this.binds = where(this.binds, bind => {
				if (!bind.node) return true;
				if (bind.node.isConnected) return true;
				bind.destroy();
			});
		});
	}
}
