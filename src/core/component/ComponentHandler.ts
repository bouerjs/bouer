import IComponentOptions from "../../definitions/interfaces/IComponentOptions";
import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import Extend from "../../shared/helpers/Extend";
import ServiceProvider from "../../shared/helpers/ServiceProvider";
import Prop from "../../shared/helpers/Prop";
import Task from "../../shared/helpers/Task";
import {
	DOM,
	code,
	forEach,
	isNull,
	$CreateEl,
	buildError,
	isFunction,
	toLower, urlCombine,
	$CreateAnyEl,
	isObject, pathResolver, toArray,
	urlResolver, webRequest, where, ifNullReturn
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Base from "../Base";
import Compiler from "../compiler/Compiler";
import DelimiterHandler from "../DelimiterHandler";
import Evaluator from "../Evaluator";
import EventHandler from "../event/EventHandler";
import ReactiveEvent from "../event/ReactiveEvent";
import Reactive from "../reactive/Reactive";
import Routing from "../routing/Routing";
import Component from "./Component";
import ILifeCycleHooks from "../../definitions/interfaces/ILifeCycleHooks";

export default class ComponentHandler extends Base {
	private bouer: Bouer;
	// Handle all the components web requests to avoid multiple requests
	private requests: dynamic = {};
	delimiter: DelimiterHandler;
	eventHandler: EventHandler;
	components: { [key: string]: (Component<any> | IComponentOptions<any>) } = {};
	// Avoids to add multiple styles of the same component if it's already in use
	stylesController: { [key: string]: { styles: Element[], elements: Element[] }, } = {};
	serviceProvider: ServiceProvider;

	constructor(bouer: Bouer) {
		super();

		this.bouer = bouer;
		this.serviceProvider = new ServiceProvider(bouer);
		this.delimiter = this.serviceProvider.get('DelimiterHandler')!;
		this.eventHandler = this.serviceProvider.get('EventHandler')!;

		ServiceProvider.add('ComponentHandler', this);
	}

	check(nodeName: string) {
		return (nodeName in this.components);
	}

	request(path: string, response: {
		success: (content: string, url: string) => void,
		fail: (error: any, url: string) => void
	}) {
		if (!isNull(this.requests[path]))
			return this.requests[path].push(response);

		this.requests[path] = [response];

		const resolver = urlResolver(path);
		const hasBaseElement = DOM.head.querySelector('base') != null;
		const hasBaseURIInURL = resolver.baseURI === path.substring(0, resolver.baseURI.length);

		// Building the URL according to the main path
		const componentPath = urlCombine(hasBaseURIInURL ? resolver.origin : resolver.baseURI, resolver.pathname);

		webRequest(componentPath, { headers: { 'Content-Type': 'text/plain' } })
			.then(response => {
				if (!response.ok) throw new Error(response.statusText);
				return response.text();
			})
			.then(content => {
				forEach(this.requests[path], (request: dynamic) => {
					request.success(content, path);
				});
				delete this.requests[path];
			})
			.catch(error => {
				if (!hasBaseElement)
					Logger.warn("It seems like you are not using the “<base href=\"/base/components/path/\" />” " +
						"element, try to add as the first child into “<head></head>” element.");
				forEach(this.requests[path], (request: dynamic) => request.fail(error, path));
				delete this.requests[path];
			})
	}

	prepare(components: (Component<any> | IComponentOptions<any>)[], parent?: (Component<any> | IComponentOptions<any>)) {
		forEach(components, component => {

			if (isNull(component.path) && isNull(component.template))
				return Logger.warn("The component with name “" + component.name + "”" +
					(component.route ? (" and route “" + component.route + "”") : "") +
					" has not “path” or “template” property defined, " + "then it was ignored.");

			if (isNull(component.name) || !component.name) {
				const pathSplitted = component.path!.toLowerCase().split('/');
				let generatedComponentName = pathSplitted[pathSplitted.length - 1].replace('.html', '');

				// If the component name already exists generate a new one
				if (this.components[generatedComponentName])
					generatedComponentName = toLower(code(8, generatedComponentName + '-component-'));

				component.name = generatedComponentName;
			}

			if (this.components[component.name!])
				return Logger.warn("The component name “" + component.name + "” is already define, try changing the name.");

			if (!isNull(parent)) { /** TODO: Inherit the parent info */ }

			if (!isNull(component.route)) { // Completing the route
				component.route = "/" + urlCombine((isNull(parent) ? "" : parent!.route!), component.route!);
			}

			if (Array.isArray(component.children))
				this.prepare(component.children, component);

			this.serviceProvider.get<Routing>('Routing')!
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

			if (!(component.prefetch = ifNullReturn(this.bouer.config.prefetch, true)))
				return;

			return getContent(component.path);
		});
	}

	order(componentElement: Element, data: object, onComponent?: (component: Component<any>) => void) {
		const $name = toLower(componentElement.nodeName);
		const mComponents = this.components as dynamic;
		const inComponent = mComponents[$name];

		if (!inComponent) return Logger.error("No component with name “" + $name + "” registered.");

		const component = (inComponent as (Component<any> | IComponentOptions<any>));
		const iComponent = (component as IComponentOptions<any>);

		const mainExecutionWrapper = () => {
			if (component.template) {
				const newComponent = (component instanceof Component) ? component : new Component(component);
				newComponent.bouer = this.bouer;

				this.insert(componentElement, newComponent, data, onComponent);

				if (component.keepAlive === true)
					mComponents[$name] = component;
				return;
			}

			if (!component.path)
				return Logger.error("Expected a valid value in `path` or `template` got invalid value at “" + $name + "” component.");

			this.addEvent('requested', componentElement, component, this.bouer)
				.emit();

			// Make component request or Add
			this.request(component.path, {
				success: content => {
					const newComponent = (component instanceof Component) ? component : new Component(component);
					iComponent.template = newComponent.template = content;
					newComponent.bouer = this.bouer;

					this.insert(componentElement, newComponent, data, onComponent);

					if (component.keepAlive === true)
						mComponents[$name] = component;
				},
				fail: (error) => {
					Logger.error("Failed to request <" + $name + "></" + $name + "> component with path “" + component.path + "”.");
					Logger.error(buildError(error));

					this.addEvent('failed', componentElement, component, this.bouer).emit();
				}
			});
		}

		// Checking the restrictions
		if (iComponent.restrictions && iComponent.restrictions!.length > 0) {
			const blockedRestrictions: any[] = [];
			const restrictions = iComponent.restrictions.map(restriction => {
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

			const blockedEvent = this.addEvent('blocked', componentElement, component, this.bouer);
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

	find(predicate: (item: (Component<any> | IComponentOptions<any>)) => boolean) {
		const keys = Object.keys(this.components);
		for (let i = 0; i < keys.length; i++) {
			const component = this.components[keys[i]];
			if (predicate(component)) return component;
		}
		return null;
	}

	/** Subscribe the hooks of the instance */
	addEvent<Key extends keyof ILifeCycleHooks>(eventName: Key, element: Element, component: any, context?: object) {
		const callback = (component as any)[eventName];

		if (typeof callback === 'function')
			this.eventHandler.on({
				eventName,
				callback: evt => callback.call(context || component, evt),
				attachedNode: element,
				modifiers: { once: true },
				context: context || component
			});

		const emitter = (init: any) => {
			this.eventHandler.emit({
				attachedNode: element,
				once: true,
				eventName,
				init
			})

			this.eventHandler.emit({
				eventName: 'component:' + eventName,
				init: { detail: { component: component } },
				once: true
			});
		}
		return {
			emit: (init?: CustomEventInit) => emitter(init)
		}
	}

	insert(componentElement: Element, component: Component<any>, data: object, onComponent?: <Data>(component: Component<Data>) => void) {
		const $name = toLower(componentElement.nodeName);
		const container = componentElement.parentElement;
		if (!componentElement.isConnected || !container)
			return; //Logger.warn("Insert location of component <" + $name + "></" + $name + "> not found.");

		if (isNull(component.template))
			return Logger.error("The <" + $name + "></" + $name + "> component is not ready yet to be inserted.");

		const elementSlots = $CreateAnyEl('SlotContainer', el => {
			el.innerHTML = componentElement.innerHTML
			componentElement.innerHTML = "";
		}).build();

		const isKeepAlive = componentElement.hasAttribute('keep-alive') || ifNullReturn(component.keepAlive, false);
		// Component Creation
		if (isKeepAlive === false || isNull(component.el)) {
			$CreateEl('body', htmlSnippet => {
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
			});
		}

		if (isNull(component.el)) return;

		const rootElement = component.el!;
		// Adding the listeners
		const createdEvent = this.addEvent('created', component.el!, component);
		const beforeMountEvent = this.addEvent('beforeMount', component.el!, component);
		const mountedEvent = this.addEvent('mounted', component.el!, component);
		const beforeLoadEvent = this.addEvent('beforeLoad', component.el!, component);
		const loadedEvent = this.addEvent('loaded', component.el!, component);
		this.addEvent('beforeDestroy', component.el!, component);
		this.addEvent('destroyed', component.el!, component);

		const scriptsAssets = where(component.assets, asset => toLower(asset.nodeName) === 'script');
		const initializer = (component as any).init;

		if (isFunction(initializer))
			initializer.call(component);

		const compile = (scriptContent?: string) => {
			try {
				// Executing the mixed scripts
				this.serviceProvider.get<Evaluator>('Evaluator')!
					.execRaw((scriptContent || ''), component);

				createdEvent.emit();

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
							if (!(reactive.propName in inputData))
								inputData[reactive.propName] = undefined;
							Prop.set(inputData, reactive.propName, reactive);
						});

						// If data value is empty gets the main scope value
						if (attr.value === '')
							inputData = Extend.obj(this.bouer.data);
						else {
							// Other wise, compiles the object provided
							const mInputData = this.serviceProvider.get<Evaluator>('Evaluator')!
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
							data: inputData
						});

						return forEach(Object.keys(inputData), key => {
							Prop.transfer(component.data, inputData, key);
						});
					}

					rootElement.attributes.setNamedItem(attr);
				});

				beforeMountEvent.emit();
				container.replaceChild(rootElement, componentElement);
				mountedEvent.emit();

				const rootClassList: any = {};
				// Retrieving all the classes of the root element
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
						const ruleText = mRule.selectorText;
						if (ruleText) {
							const firstRule = (ruleText as string).split(' ')[0];
							const selector = (firstRule[0] == '.' || firstRule[0] == '#')
								? firstRule.substring(1) : firstRule;
							const separator = rootClassList[selector] ? "" : " ";
							const uniqueIdentifier = "." + styleId;
							const selectorTextSplitted = mRule.selectorText.split(' ');

							if (selectorTextSplitted[0] === toLower(rootElement.tagName))
								selectorTextSplitted.shift();

							mRule.selectorText = uniqueIdentifier + separator + selectorTextSplitted.join(' ');
						}

						if (isStyle) rules.push(mRule.cssText);
					}
					if (isStyle) style.innerText = rules.join(' ');
				}
				const stylesAssets = where(component.assets, asset => toLower(asset.nodeName) !== 'script');
				const styleAttrName = 'component-style';

				// Configuring the styles
				forEach(stylesAssets, asset => {
					const mStyle = asset.cloneNode(true) as Element;

					if (mStyle instanceof HTMLLinkElement) {
						const path = component.path[0] === '/' ? component.path.substring(1) : component.path;
						mStyle.href = pathResolver(path, mStyle.getAttribute('href') || '');
						mStyle.rel = "stylesheet";
					}

					// Checking if this component already have styles added
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

				beforeLoadEvent.emit();
				this.serviceProvider.get<Compiler>('Compiler')!
					.compile({
						data: Reactive.transform({ context: component, data: component.data }),
						onDone: () => {
							if (isFunction(onComponent))
								onComponent!(component);
							loadedEvent.emit();
						},
						componentSlot: elementSlots,
						context: component,
						el: rootElement,
					});

				Task.run(stopTask => {
					if (component.el!.isConnected) return;

					if (this.bouer.isDestroyed)
						return stopTask();

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
			});
		});
	}
}