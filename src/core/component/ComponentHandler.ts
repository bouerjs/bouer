import IComponentOptions from "../../definitions/interfaces/IComponentOptions";
import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import Extend from "../../shared/helpers/Extend";
import IoC from "../../shared/helpers/IoC";
import Task from "../../shared/helpers/Task";
import {
	anchor,
	buildError,
	code,
	createAnyEl,
	createEl,
	defineProperty,
	DOM,
	forEach, isFunction,
	isNull,
	isObject, pathResolver, toArray,
	toLower, transferProperty, urlCombine,
	urlResolver, webRequest, where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Compiler from "../compiler/Compiler";
import DelimiterHandler from "../DelimiterHandler";
import Evaluator from "../Evaluator";
import EventHandler from "../event/EventHandler";
import ReactiveEvent from "../event/ReactiveEvent";
import Reactive from "../reactive/Reactive";
import Routing from "../routing/Routing";
import Component from "./Component";

export default class ComponentHandler {
	private bouer: Bouer;
	// Handle all the components web requests to avoid multiple requests
	private requests: dynamic = {};
	delimiter: DelimiterHandler;
	eventHandler: EventHandler;
	components: { [key: string]: (Component<any> | IComponentOptions<any>) } = {};
	// Avoids to add multiple styles of the same component if it's already in use
	stylesController: { [key: string]: { styles: Element[], elements: Element[] }, } = {};

	constructor(bouer: Bouer) {
		this.bouer = bouer;
		this.delimiter = IoC.Resolve(this.bouer, DelimiterHandler)!;
		this.eventHandler = IoC.Resolve(this.bouer, EventHandler)!;

		IoC.Register(this);
	}

	check(nodeName: string) {
		return (nodeName in this.components);
	}

	request(url: string, response: {
		success: (content: string, url: string) => void,
		fail: (error: any, url: string) => void
	}) {
		if (!isNull(this.requests[url]))
			return this.requests[url].push(response);

		this.requests[url] = [response];

		const resolver = urlResolver(anchor.baseURI);
		const hasBaseElement = DOM.head.querySelector('base') != null;
		const baseURI = hasBaseElement ? resolver.baseURI : resolver.origin;
		const urlPath = urlCombine(baseURI, url);

		webRequest(urlPath, { headers: { 'Content-Type': 'text/plain' } })
			.then(response => {
				if (!response.ok) throw new Error(response.statusText);
				return response.text();
			})
			.then(content => {
				forEach(this.requests[url], (request: dynamic) => {
					request.success(content, url);
				});
				delete this.requests[url];
			})
			.catch(error => {
				if (!hasBaseElement)
					Logger.warn("It seems like you are not using the “<base href=\"/base/components/path/\" />” " +
						"element, try to add as the first child into “<head></head>” element.");
				forEach(this.requests[url], (request: dynamic) => {
					request.fail(error, url);
				});
				delete this.requests[url];
			})
	}

	prepare(components: (Component<any> | IComponentOptions<any>)[], parent?: (Component<any> | IComponentOptions<any>)) {
		forEach(components, component => {
			const ctorName = component.constructor.name;
			const isBuitInClass = ctorName === "IComponent" || ctorName === "Component" || ctorName === "Object";

			if (isNull(component.name)) {
				if (isBuitInClass)
					component.name = toLower(code(9, 'component-'));
				else
					component.name = toLower(component.constructor.name);
			}

			if (isNull(component.path) && isNull(component.template))
				return Logger.warn("The component with name “" + component.name + "”" +
					component.route ? (" and the route “" + component.route + "”") : "" +
					" has not “path” or “template” property defined, " +
				"then it was ignored.");

			if (!isNull((this.components as any)[component.name!]))
				return Logger.warn("The component name “" + component.name + "” is already define, try changing the name.");

			if (!isNull(parent)) { // TODO: Inherit the parent info
			}

			if (Array.isArray(component.children))
				this.prepare(component.children, component);

			if (!isNull(component.route)) { // Completing the API
				component.route = "/" + urlCombine(
					(isNull(parent) ? "" : parent!.route!),
					component.route!);
			}

			IoC.Resolve<Routing>(this.bouer, Routing)!
				.configure(this.components[component.name!] = component);

			const getContent = (path?: string) => {
				if (!path) return;

				this.request(component.path!, {
					success: content => {
						component.template = content;
					},
					fail: error => {
						Logger.error(buildError(error));
					}
				});
			}

			if (!isNull(component.prefetch)) {
				if (component.prefetch === true)
					return getContent(component.path);
				return;
			}

			const prefetch = (this.bouer.config || {}).prefetch ?? true;
			if (!prefetch) return;

			return getContent(component.path);
		});
	}

	order(componentElement: Element, data: object, callback?: (component: Component<any>) => void) {
		const $name = toLower(componentElement.nodeName);
		const mComponents = this.components as dynamic;
		let hasComponent = mComponents[$name];
		if (!hasComponent)
			return Logger.error("No component with name “" + $name + "” registered.");

		const component = (hasComponent as (Component<any> | IComponentOptions<any>));
		const icomponent = (component as IComponentOptions<any>);

		const mainExecutionWrapper = () => {
			if (component.template) {
				const newComponent = (component instanceof Component) ? component : new Component(component);
				newComponent.bouer = this.bouer;

				this.insert(componentElement, newComponent, data, callback);

				if (component.keepAlive === true)
					mComponents[$name] = component;
				return;
			}

			const requestedEvent = this.addComponentEventAndEmitGlobalEvent('requested', componentElement, component, this.bouer);
			if (requestedEvent) requestedEvent.emit();
			// Make or Add request
			this.request(component.path!, {
				success: content => {
					const newComponent = (component instanceof Component) ? component : new Component(component);
					icomponent.template = newComponent.template = content;
					newComponent.bouer = this.bouer;

					this.insert(componentElement, newComponent, data, callback);

					if (component.keepAlive === true)
						mComponents[$name] = component;
				},
				fail: (error) => {
					Logger.error("Failed to request <" + $name + "></" + $name + "> component with path “" + component.path + "”.");
					Logger.error(buildError(error));

					if (typeof icomponent.failed !== 'function') return;
					icomponent.failed(new CustomEvent('failed'));
				}
			});
		}

		// Checking the restrictions
		if (icomponent.restrictions && icomponent.restrictions!.length > 0) {
			const blockedRestrictions: any[] = [];
			const restrictions = icomponent.restrictions.map(restriction => {
				const restrictionResult = restriction.call(this.bouer, component) as any;

				if (restrictionResult === false)
					blockedRestrictions.push(restriction)
				else if (restrictionResult instanceof Promise)
					restrictionResult
						.then(value => {
							if (value === false)
								blockedRestrictions.push(restriction)
						})
						.catch(() => blockedRestrictions.push(restriction));

				return restrictionResult;
			});

			const blockedEvent = this.addComponentEventAndEmitGlobalEvent('blocked', componentElement, component, this.bouer);
			const emitter = () => blockedEvent.emit({
				detail: {
					component: component.name,
					message: "Component “" + component.name + "” blocked by restriction(s)",
					blocks: blockedRestrictions
				}
			});

			return Promise.all(restrictions)
				.then(restrictionValues => {
					if (restrictionValues.every(value => value == true))
						mainExecutionWrapper();
					else
						emitter();
				})
				.catch(() => emitter());
		}

		return mainExecutionWrapper();
	}

	find(callback: (item: (Component<any> | IComponentOptions<any>)) => boolean) {
		const keys = Object.keys(this.components);
		for (let i = 0; i < keys.length; i++) {
			const component = this.components[keys[i]];
			if (callback(component)) return component;
		}
		return null;
	}

	/** Subscribe the hooks of the instance */
	addComponentEventAndEmitGlobalEvent(eventName: string, element: Element, component: any, context?: object) {
		const callback = component[eventName];
		this.eventHandler.emit({
			eventName: 'component:' + eventName,
			init: {
				detail: { component: component }
			}
		});

		if (typeof callback !== 'function')
			return { emit: (() => { }) }

		const emitter = this.eventHandler.on({
			eventName,
			callback: evt => callback.call(component, evt),
			attachedNode: element,
			modifiers: { once: true },
			context: context || component
		}).emit;

		return {
			emit: (init?: CustomEventInit) => emitter({
				init: init
			})
		}
	}

	private insert(componentElement: Element, component: Component<any>, data: object, callback?: <Data>(component: Component<Data>) => void) {
		const $name = toLower(componentElement.nodeName);
		const container = componentElement.parentElement;
		if (!componentElement.isConnected || !container)
			return; //Logger.warn("Insert location of component <" + $name + "></" + $name + "> not found.");

		if (isNull(component.template))
			return Logger.error("The <" + $name + "></" + $name + "> component is not ready yet to be inserted.");

		const elementSlots = createAnyEl('SlotContainer', el => {
			el.innerHTML = componentElement.innerHTML
			componentElement.innerHTML = "";
		}).build();

		const isKeepAlive = componentElement.hasAttribute('keep-alive') || (component.keepAlive ?? false);
		// Component Creation
		if (isKeepAlive === false || isNull(component.el)) {
			createEl('body', htmlSnippet => {
				htmlSnippet.innerHTML = component.template!;

				forEach([].slice.call(htmlSnippet.children), (asset: any) => {
					if (['SCRIPT', 'LINK', 'STYLE'].indexOf(asset.nodeName) === -1)
						return;

					component.assets.push(asset);
					htmlSnippet.removeChild(asset);
				});

				if (htmlSnippet.children.length === 0)
					return Logger.error(("The component <" + $name + "></" + $name + "> " +
						"seems to be empty or it has not a root element. Example: <div></div>, to be included."));

				if (htmlSnippet.children.length > 1)
					return Logger.error(("The component <" + $name + "></" + $name + "> " +
						"seems to have multiple root element, it must have only one root."));

				component.el = htmlSnippet.children[0];

				this.addComponentEventAndEmitGlobalEvent('created', component.el!, component, this.bouer);
				component.emit('created');
			});
		}

		if (isNull(component.el)) return;

		if (isFunction(callback))
			callback!(component);

		let rootElement = component.el!;

		// tranfering the attributes
		forEach(toArray(componentElement.attributes), (attr: Attr) => {
			componentElement.removeAttribute(attr.name);
			if (attr.nodeName === 'class')
				return componentElement.classList.forEach(cls => {
					rootElement.classList.add(cls);
				});

			if (attr.nodeName === 'data') {
				if (this.delimiter.run(attr.value).length !== 0)
					return Logger.error(("The “data” attribute cannot contain delimiter, " +
						"source element: <" + $name + "></" + $name + ">."));

				let inputData: dynamic = {};
				const mData = Extend.obj(data, { $data: data });

				const reactiveEvent = ReactiveEvent.on('AfterGet', reactive => {
					inputData[reactive.propertyName] = undefined;
					defineProperty(inputData, reactive.propertyName, reactive);
				});

				// If data value is empty gets the main scope value
				if (attr.value === '')
					inputData = Extend.obj(this.bouer.data);
				else {
					// Other wise, compiles the object provided
					const mInputData = IoC.Resolve<Evaluator>(this.bouer, Evaluator)!
						.exec({
							data: mData,
							expression: attr.value,
							context: this.bouer
						});

					if (!isObject(mInputData))
						return Logger.error(("Expected a valid Object Literal expression in “"
							+ attr.nodeName + "” and got “" + attr.value + "”."));

					// Adding all non-existing properties
					forEach(Object.keys(mInputData), key => {
						if (!(key in inputData))
							inputData[key] = mInputData[key];
					});
				}

				reactiveEvent.off();
				Reactive.transform({
					context: component,
					inputObject: inputData
				});

				return forEach(Object.keys(inputData), key => {
					transferProperty(component.data, inputData, key);
				});
			}

			rootElement.attributes.setNamedItem(attr);
		});

		const initializer = (component as any).init;
		if (isFunction(initializer))
			initializer.call(component);

		this.addComponentEventAndEmitGlobalEvent('beforeMount', component.el!, component)
		component.emit('beforeMount');

		container.replaceChild(rootElement, componentElement);

		let rootClassList: any = {};
		// Retrieving all the classes of the retu elements
		rootElement.classList.forEach(key => rootClassList[key] = true);

		// Changing each selector to avoid conflits
		const changeSelector = (style: HTMLStyleElement | HTMLLinkElement, styleId: string) => {
			const isStyle = (style.nodeName === 'STYLE'), rules: string[] = [];
			if (!style.sheet) return;

			const cssRules = style.sheet.cssRules;
			for (let i = 0; i < cssRules.length; i++) {
				const rule = cssRules.item(i);
				if (!rule) continue;
				const mRule = rule as dynamic;

				if (mRule.selectorText) {
					const selector = (mRule.selectorText as string).substring(1);
					const separation = rootClassList[selector] ? "" : " ";
					const uniqueIdentifier = "." + styleId;
					const selectorTextSplitted = mRule.selectorText.split(' ');

					if (selectorTextSplitted[0] === toLower(rootElement.tagName))
						selectorTextSplitted.shift();

					mRule.selectorText = uniqueIdentifier + separation + selectorTextSplitted.join(' ');
				}

				if (isStyle) rules.push(mRule.cssText);
			}
			if (isStyle) style.innerText = rules.join(' ');
		}

		const scriptsAssets = where(component.assets, asset => toLower(asset.nodeName) === 'script');
		const stylesAssets = where(component.assets, asset => toLower(asset.nodeName) !== 'script');

		const styleAttrName = 'component-style';
		// Configuring the styles
		forEach(stylesAssets, asset => {
			const mStyle = asset.cloneNode(true) as Element;

			if (mStyle instanceof HTMLLinkElement) {
				const path = component.path[0] === '/' ? component.path.substring(1) : component.path;
				mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
			}

			//Checking if this component already have styles added
			if (this.stylesController[$name]) {

				const controller = this.stylesController[$name];
				if (controller.elements.indexOf(rootElement) === -1) {
					controller.elements.push(rootElement);
					forEach(controller.styles, $style => {
						rootElement.classList.add($style.getAttribute(styleAttrName) as string);
					})
				}

				return;
			};

			const styleId = code(7, 'bouer-s');
			mStyle.setAttribute(styleAttrName, styleId);

			if ((mStyle instanceof HTMLLinkElement) && mStyle.hasAttribute('scoped'))
				mStyle.onload = evt => changeSelector((evt.target! as HTMLLinkElement), styleId);

			this.stylesController[$name] = {
				styles: [DOM.head.appendChild(mStyle)],
				elements: [rootElement]
			};

			if (!mStyle.hasAttribute('scoped')) return;

			rootElement.classList.add(styleId);
			if (mStyle instanceof HTMLStyleElement)
				return changeSelector(mStyle, styleId);
		});

		const compile = (scriptContent?: string) => {
			try {
				// Executing the mixed scripts
				IoC.Resolve<Evaluator>(this.bouer, Evaluator)!
					.execRaw((scriptContent || ''), component);

				this.addComponentEventAndEmitGlobalEvent('mounted', component.el!, component);
				component.emit('mounted');

				// TODO: Something between this two events

				this.addComponentEventAndEmitGlobalEvent('beforeLoad', component.el!, component)
				component.emit('beforeLoad');

				IoC.Resolve<Compiler>(this.bouer, Compiler)!
					.compile({
						data: Reactive.transform({
							context: component,
							inputObject: component.data
						}),
						el: rootElement,
						componentSlot: elementSlots,
						context: component,
						onDone: () => {
							this.addComponentEventAndEmitGlobalEvent('loaded', component.el!, component);
							component.emit('loaded');
						}
					});

				Task.run(stopTask => {
					if (component.el!.isConnected) return;

					component.destroy();
					stopTask();

					const stylesController = this.stylesController[component.name];
					if (!stylesController)
						return;

					const index = stylesController.elements.indexOf(component.el!);
					stylesController.elements.splice(index, 1);

					// No elements using the style
					if (stylesController.elements.length > 0)
						return;

					forEach(stylesController.styles, style =>
						forEach(toArray(DOM.head.children), item => {
							if (item === style)
								return DOM.head.removeChild(style);
						}));

					delete this.stylesController[component.name];
				});
			} catch (error) {
				Logger.error("Error in <" + $name + "></" + $name + "> component.");
				Logger.error(buildError(error));
			}
		}

		if (scriptsAssets.length === 0)
			return compile();

		// Mixing all the scripts
		const localScriptsContent: string[] = [],
			onlineScriptsContent: string[] = [],
			onlineScriptsUrls: string[] = [],
			webRequestChecker: any = {};

		// Grouping the online scripts and collecting the online url
		forEach(scriptsAssets as any, (script: HTMLScriptElement) => {
			if (script.src == '' || script.innerHTML)
				localScriptsContent.push(script.innerHTML);
			else {
				const path = component.path[0] === '/' ? component.path.substring(1) : component.path;
				script.src = pathResolver(path, script.getAttribute('src') || '');
				onlineScriptsUrls.push(script.src);
			}
		});

		// No online scripts detected
		if (onlineScriptsUrls.length == 0)
			return compile(localScriptsContent.join('\n\n'));

		// Load the online scripts and run it
		return forEach(onlineScriptsUrls, (url, index) => {
			webRequestChecker[url] = true;
			// Getting script content from a web request
			webRequest(url, {
				headers: { "Content-Type": 'text/plain' }
			}).then(response => {
				if (!response.ok) throw new Error(response.statusText);
				return response.text();
			}).then(text => {
				delete webRequestChecker[url];
				// Adding the scripts according to the defined order
				onlineScriptsContent[index] = text;

				// if there are not web requests compile the element
				if (Object.keys(webRequestChecker).length === 0)
					return compile(Extend.array(onlineScriptsContent, localScriptsContent).join('\n\n'));
			}).catch(error => {
				error.stack = "";
				Logger.error(("Error loading the <script src=\"" + url + "\"></script> in " +
					"<" + $name + "></" + $name + "> component, remove it in order to be compiled."));
				Logger.log(error);

				this.addComponentEventAndEmitGlobalEvent('failed', componentElement, component, this.bouer)
					.emit();
			});
		});
	}
}