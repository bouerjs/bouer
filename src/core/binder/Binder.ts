import BinderConfig from "../../definitions/types/BinderConfig";
import DelimiterResponse from "../../definitions/types/DelimiterResponse";
import dynamic from "../../definitions/types/Dynamic";
import WatchCallback from "../../definitions/types/WatchCallback";
import Bouer from "../../instance/Bouer";
import Constants from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import Task from "../../shared/helpers/Task";
import {
	createEl,
	findAttribute,
	forEach, isFunction, isNull,
	isObject,
	toArray, toStr,
	trim,
	where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Compiler from "../compiler/Compiler";
import Evaluator from "../Evaluator";
import ReactiveEvent from "../event/ReactiveEvent";
import Middleware from "../middleware/Middleware";
import Watch from "./Watch";

export default class Binder {
	bouer: Bouer;
	evaluator: Evaluator;
	binds: Watch<any, any>[] = [];

	private DEFAULT_BINDER_PROPERTIES: any = {
		'text': 'value',
		'number': 'valueAsNumber',
		'checkbox': 'checked',
		'radio': 'value'
	}

	private BindingDirection = {
		fromInputToData: 'fromInputToData',
		fromDataToInput: 'fromDataToInput'
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
		fields: DelimiterResponse[],
		isReplaceProperty?: boolean,
		context: object,
		onUpdate?: (value: any, node: Node) => void,
	}) {
		const { node, data, fields, isReplaceProperty, context } = options;
		const originalValue = trim(node.nodeValue ?? '');
		const originalName = node.nodeName;
		const ownerElement = (node as any).ownerElement || node.parentNode;
		const middleware = IoC.Resolve<Middleware>(this.bouer, Middleware)!;
		const onUpdate = options.onUpdate || ((v: any, n: Node) => { });

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

		const $runDirectiveMiddlewares = (type: 'bind' | 'update') => {
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
			const binderTarget = ownerElement.type || ownerElement.localName;

			if (Constants.bind === originalName)
				propertyNameToBind = this.DEFAULT_BINDER_PROPERTIES[binderTarget] || 'value';
			else
				propertyNameToBind = originalName.split(':')[1]; // e-bind:value -> value

			const isSelect = ownerElement instanceof HTMLSelectElement;
			const isSelectMultiple = isSelect && ownerElement.multiple === true;
			const modelAttribute = findAttribute(ownerElement, [':value'], true);
			const dataBindModel: any = modelAttribute ? modelAttribute.value :  "\""+ ownerElement.value +"\"";
			const dataBindProperty = trim(originalValue);

			let boundPropertyValue: any;
			let boundModelValue: any;

			const callback = (direction: string, value: any) => {
				if (isSelect && !isSelectMultiple && Array.isArray(boundPropertyValue) && !dataBindModel) {
					return Logger.error("Since it's a <select> array binding, it expects the “multiple” attribute in" +
						" order to bind the multiple values.");
				}

				// Array Binding
				if (!isSelectMultiple && (Array.isArray(boundPropertyValue) && !dataBindModel)) {
					return Logger.error("Since it's an array binding it expects a model but it has not been defined" +
						", provide a model as it follows: value=\"String-Model\" or :value=\"Object-Model\".");
				}

				const $set: { [key: string]: Function } = {
					fromDataToInput: () => {
						// Normal Property Set
						if (!Array.isArray(boundPropertyValue)) {
							// In case of radio button we need to check if the value is the same to check it
							if (binderTarget === 'radio')
								return ownerElement.checked = ownerElement[propertyNameToBind] == value;

							// Default Binding
							return ownerElement[propertyNameToBind] = (isObject(value) ? toStr(value) : (isNull(value) ? '' : value));
						}

						// Array Set

						boundModelValue = boundModelValue || this.evaluator.exec({
							data: data,
							expression: dataBindModel,
							context: context
						});

						// select-multiple handling
						if (isSelectMultiple) {
							return forEach(toArray(ownerElement.options), (option: HTMLOptionElement) => {
								option.selected = boundPropertyValue.indexOf(trim(option.value)) !== -1;
							});
						}

						// checkboxes, radio, etc
						if (boundPropertyValue.indexOf(boundModelValue) === -1) {
							switch (typeof ownerElement[propertyNameToBind]) {
								case 'boolean': ownerElement[propertyNameToBind] = false; break;
								case 'number': ownerElement[propertyNameToBind] = 0; break;
								default: ownerElement[propertyNameToBind] = ""; break;
							}
						}
					},
					fromInputToData: () => {
						// Normal Property Set
						if (!Array.isArray(boundPropertyValue)) {
							// Default Binding
							return data[dataBindProperty] = value;
						}

						// Array Set

						boundModelValue = boundModelValue || this.evaluator.exec({
							data: data,
							expression: dataBindModel,
							context: context
						});

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

						if (value)
							boundPropertyValue.push(boundModelValue);
						else
							boundPropertyValue.splice(boundPropertyValue.indexOf(boundModelValue), 1);
					}
				}

				return $set[direction]();
			}

			ReactiveEvent.once('AfterGet', evt => {
				// Adding the event on emittion
				evt.onemit = reactive => {
					this.binds.push(reactive.onChange(value => {
						callback(this.BindingDirection.fromDataToInput, value);
						onUpdate(value, node);
						$runDirectiveMiddlewares('update');
					}, node));
				}

				// calling the main event
				boundPropertyValue = this.evaluator.exec({
					data: data,
					expression: dataBindProperty,
					context: context
				});
			});

			callback(this.BindingDirection.fromDataToInput, boundPropertyValue);

			const listeners = ['input','propertychange','change'];
			if (!listeners.includes(ownerElement.localName))
				listeners.push(ownerElement.localName);

			// Applying the events
			forEach(listeners, listener => {
				if (listener === 'change' && ownerElement.localName !== 'select') return;

				ownerElement.addEventListener(listener, () => {
					callback(this.BindingDirection.fromInputToData, ownerElement[propertyNameToBind]);
				}, false);
			});

			// Removing the e-bind attr
			ownerElement.removeAttribute(node.nodeName);
			$runDirectiveMiddlewares('bind');
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
					$runDirectiveMiddlewares('update');
				}, node));
			}
			setter();
		});

		propertyBindConfig.node = nodeToBind;
		$runDirectiveMiddlewares('bind');
		return propertyBindConfig;
	}

	onPropertyChange(propertyName: string, callback: WatchCallback, targetObject?: object) {
		let mWatch: Watch<any, any> | null = null;
		const mTargetObject = targetObject || this.bouer.data;

		ReactiveEvent.once('AfterGet', event => {
			event.onemit = reactive => mWatch = reactive.onChange(callback);
			const _ = (mTargetObject as any)[propertyName];
		});

		return mWatch;
	}

	onPropertyInScopeChange(watchable: (app: Bouer) => void) {
		const watches: Watch<any, any>[] = [];

		ReactiveEvent.once('AfterGet', evt => {
			evt.onemit = reactive => {
				watches.push(reactive.onChange(() => watchable.call(this.bouer, this.bouer)));
			}
			watchable.call(this.bouer, this.bouer);
		});

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
