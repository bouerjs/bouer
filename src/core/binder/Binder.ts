import IBinderConfig from "../../definitions/interfaces/IBinderConfig";
import IBinderOptions from "../../definitions/interfaces/IBinderOptions";
import WatchCallback from "../../definitions/types/WatchCallback";
import Bouer from "../../instance/Bouer";
import Constants from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import ServiceProvider from "../../shared/helpers/ServiceProvider";
import Task from "../../shared/helpers/Task";
import {
	$CreateEl,
	findAttribute,
	forEach, isNull,
	isObject,
	toArray, toStr,
	trim,
	where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Base from "../Base";
import Compiler from "../compiler/Compiler";
import Evaluator from "../Evaluator";
import ReactiveEvent from "../event/ReactiveEvent";
import Middleware from "../middleware/Middleware";
import Watch from "./Watch";

export default class Binder extends Base {
	bouer: Bouer;
	evaluator: Evaluator;
	binds: { isConnected: () => boolean, watch: Watch<any, any> }[] = [];
	serviceProvider: ServiceProvider;

	private DEFAULT_BINDER_PROPERTIES: any = {
		text: 'value',
		number: 'valueAsNumber',
		checkbox: 'checked',
		radio: 'value'
	}

	private BindingDirection = {
		fromInputToData: 'fromInputToData',
		fromDataToInput: 'fromDataToInput'
	}

	constructor(bouer: Bouer) {
		super();
		this.bouer = bouer;
		this.serviceProvider = new ServiceProvider(bouer);
		this.evaluator = this.serviceProvider.get('Evaluator')!;

		this.serviceProvider.add('Binder', this);
		this.cleanup();
	}

	create(options: IBinderOptions) {
		const { node, data, fields, isReplaceProperty, context } = options;
		const originalValue = trim(node.nodeValue ?? '');
		const originalName = node.nodeName;
		const ownerNode = (node as any).ownerElement || node.parentNode;
		const middleware = this.serviceProvider.get<Middleware>('Middleware')!;
		const onUpdate = options.onUpdate || ((v: any, n: Node) => { });

		// Clousure cache property settings
		const propertyBindConfig: IBinderConfig = {
			node: node,
			data: data,
			nodeName: originalName,
			nodeValue: originalValue,
			fields: fields,
			parent: ownerNode,
			value: ''
		};

		const $RunDirectiveMiddlewares = (type: 'onBind' | 'onUpdate') => {
			middleware.run(originalName, {
				type: type,
				action: middleware => {
					middleware({
						binder: propertyBindConfig,
						detail: {}
					}, {
						success() { },
						fail() { },
						done() { }
					})
				}
			});
		}

		const $BindOneWay = () => {
			// One-Way Data Binding
			let nodeToBind = node;

			// If definable property e-[?]="..."
			if (originalName.substring(0, Constants.property.length) === Constants.property && isNull(isReplaceProperty)) {
				propertyBindConfig.nodeName = originalName.substring(Constants.property.length);
				ownerNode.setAttribute(propertyBindConfig.nodeName, originalValue);
				nodeToBind = ownerNode.attributes[propertyBindConfig.nodeName];

				// Removing the e-[?] attr
				ownerNode.removeAttribute(node.nodeName);
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

					if (delimiter && typeof delimiter.onUpdate === 'function')
						valueToSet = delimiter.onUpdate(valueToSet, node, data);
				});

				propertyBindConfig.value = valueToSet;

				if (!isHtml)
					return nodeToBind.nodeValue = valueToSet;

				const htmlSnippet = $CreateEl('div', el => {
					el.innerHTML = valueToSet;
				}).build().children[0];

				ownerNode.appendChild(htmlSnippet);
				this.serviceProvider.get<Compiler>('Compiler')!.compile({
					el: htmlSnippet,
					data: data,
					context: context
				});
			}

			ReactiveEvent.once('AfterGet', event => {
				event.onemit = reactive => {
					this.binds.push({
						isConnected: options.isConnected,
						watch: reactive.onChange(value => {
							setter();
							onUpdate(value, node);
							$RunDirectiveMiddlewares('onUpdate');
						}, node)
					});
				}

				setter();
			});

			propertyBindConfig.node = nodeToBind;
			$RunDirectiveMiddlewares('onBind');
			return propertyBindConfig;
		}

		const $BindTwoWay = () => {
			let propertyNameToBind = '';
			const binderTarget = ownerNode.type || ownerNode.localName;

			if (Constants.bind === originalName)
				propertyNameToBind = this.DEFAULT_BINDER_PROPERTIES[binderTarget] || 'value';
			else
				propertyNameToBind = originalName.split(':')[1]; // e-bind:value -> value

			const isSelect = ownerNode instanceof HTMLSelectElement;
			const isSelectMultiple = isSelect && ownerNode.multiple === true;
			const modelAttribute = findAttribute(ownerNode, [':value'], true);
			const dataBindModel: any = modelAttribute ? modelAttribute.value : "\"" + ownerNode.value + "\"";
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

				const $Setter: { [key: string]: Function } = {
					fromDataToInput: () => {
						// Normal Property Set
						if (!Array.isArray(boundPropertyValue)) {
							// In case of radio button we need to check if the value is the same to check it
							if (binderTarget === 'radio')
								return ownerNode.checked = ownerNode[propertyNameToBind] == value;

							// Default Binding
							return ownerNode[propertyNameToBind] = (isObject(value) ? toStr(value) : (isNull(value) ? '' : value));
						}

						// Array Set

						boundModelValue = boundModelValue || this.evaluator.exec({
							data: data,
							expression: dataBindModel,
							context: context
						});

						// select-multiple handling
						if (isSelectMultiple) {
							return forEach(toArray(ownerNode.options), (option: HTMLOptionElement) => {
								option.selected = boundPropertyValue.indexOf(trim(option.value)) !== -1;
							});
						}

						// checkboxes, radio, etc
						if (boundPropertyValue.indexOf(boundModelValue) === -1) {
							switch (typeof ownerNode[propertyNameToBind]) {
								case 'boolean': ownerNode[propertyNameToBind] = false; break;
								case 'number': ownerNode[propertyNameToBind] = 0; break;
								default: ownerNode[propertyNameToBind] = ""; break;
							}
						}
					},
					fromInputToData: () => {
						// Normal Property Set
						if (!Array.isArray(boundPropertyValue)) {
							// Default Binding
							return this.evaluator.exec({
								isReturn: false,
								context: context,
								data: Extend.obj(data, { $vl: value }),
								expression: dataBindProperty + '=$vl'
							});
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
							forEach(toArray(ownerNode.options), (option: HTMLOptionElement) => {
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

				return $Setter[direction]();
			}

			ReactiveEvent.once('AfterGet', evt => {
				// Adding the event on emittion
				evt.onemit = reactive => {

					this.binds.push({
						isConnected: options.isConnected,
						watch: reactive.onChange(value => {
							callback(this.BindingDirection.fromDataToInput, value);
							onUpdate(value, node);
							$RunDirectiveMiddlewares('onUpdate');
						}, node)
					});
				}

				// calling the main event
				boundPropertyValue = this.evaluator.exec({
					data: data,
					expression: dataBindProperty,
					context: context
				});
			});

			callback(this.BindingDirection.fromDataToInput, boundPropertyValue);

			const listeners = ['input', 'propertychange', 'change'];
			if (listeners.indexOf(ownerNode.localName) === -1)
				listeners.push(ownerNode.localName);

			// Applying the events
			forEach(listeners, listener => {
				if (listener === 'change' && ownerNode.localName !== 'select') return;

				ownerNode.addEventListener(listener, () => {
					callback(this.BindingDirection.fromInputToData, ownerNode[propertyNameToBind]);
				}, false);
			});

			// Removing the e-bind attr
			ownerNode.removeAttribute(node.nodeName);
			$RunDirectiveMiddlewares('onBind');
			return propertyBindConfig; // Stop Two-Way Data Binding Process
		}

		if (originalName.substring(0, Constants.bind.length) === Constants.bind)
			return $BindTwoWay();
		return $BindOneWay();
	}

	onPropertyChange<Value, TargetObject>(
		propertyName: string | number | symbol,
		callback: WatchCallback, targetObject: TargetObject
	) {
		let mWatch: Watch<Value, TargetObject> | undefined;

		ReactiveEvent.once('AfterGet', event => {
			event.onemit = reactive => mWatch = reactive.onChange(callback) as any;
			const _ = (targetObject as any)[propertyName];
		});

		return mWatch;
	}

	onPropertyInScopeChange(watchable: (app: Bouer) => void) {
		const watches: Watch<any, any>[] = [];

		ReactiveEvent.once('AfterGet', evt => {
			evt.onemit = reactive => {
				// Do not watch the same property twice
				if (watches.find(w => w.property === reactive.propertyName &&
					w.reactive.propertySource === reactive.propertySource)) return;

				// Execution handler
				let isExecuting = false;
				watches.push(reactive.onChange(() => {
					if (isExecuting) return;
					isExecuting = true;
					watchable.call(this.bouer, this.bouer);
					isExecuting = false;
				}));
			}
			watchable.call(this.bouer, this.bouer);
		});

		return watches;
	}

	/** Creates a process to unbind properties that is not connected to the DOM anymone */
	private cleanup() {
		Task.run(() => {
			this.binds = where(this.binds, bind => {
				if (bind.isConnected()) return true;
				bind.watch.destroy();
			});
		});
	}
}