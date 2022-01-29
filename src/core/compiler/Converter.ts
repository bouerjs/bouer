import Constants from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import ServiceProvider from "../../shared/helpers/ServiceProvider";
import Logger from "../../shared/logger/Logger";
import Bouer from "../../instance/Bouer";
import {
	findAttribute,
	forEach,
	isEmptyObject,
	isFilledObj,
	isFunction,
	isNull,
	isObject,
	isString,
	toArray,
	trim
} from "../../shared/helpers/Utils";
import Base from "../Base";


export default class Converter extends Base {
	bouer: Bouer;

	constructor(bouer: Bouer) {
		super();

		this.bouer = bouer;
		ServiceProvider.add('Converter', this);
	}

	htmlToJsObj(input: string | HTMLElement,
		options?: {
			names?: string,
			values?: string
		}, onSet?: (builtObject: object, propName: string, value: any, element: Element) => void): object | null {
		let element: Element | undefined = undefined;
		const instance = this;
		// If it's not a HTML Element, just return
		if ((input instanceof HTMLElement))
			element = input;
		// If it's a string try to get the element
		else if (typeof input === 'string') {
			try {
				const $el = this.bouer.el.querySelector(input);
				if (!$el) return null;
				element = $el;
			} catch {
				// Unknown element type
				return null;
			}
		}

		// If the element is not
		if (isNull(element))
			throw Logger.error("Invalid element passed in app.toJsObj(...).");

		options = options || {};

		// Clear [ ] and , and return an array of the names provided
		const mNames = (options.names || '[name]').replace(/\[|\]/g, '').split(',');
		const mValues = (options.values || '[value]').replace(/\[|\]/g, '').split(',');

		const getter = (el: Element, fieldName: string): any => {
			if (fieldName in el) return (el as any)[fieldName];
			return el.getAttribute(fieldName) || (el as any).innerText;
		}

		const tryGetValue = (el: Element): any => {
			let val: string | number | boolean | undefined | null = undefined;
			mValues.find((field: string) => (val = getter(el, field)) ? true : false);
			return val;
		}

		const objBuilder = (element: Element) => {
			let builtObject: any = {};

			// Elements that skipped on serialization process
			const escapes: any = { BUTTON: true };
			const checkables: any = { checkbox: true, radio: true };

			(function walker(el: Element) {
				let attr = findAttribute(el, mNames);
				if (attr) {
					let propName = attr.value;

					if (escapes[el.tagName] === true) return;

					if ((el instanceof HTMLInputElement) && (checkables[el.type] === true && el.checked === false))
						return;

					let propOldValue = builtObject[propName];
					let isBuildAsArray = el.hasAttribute(Constants.array);
					let value = tryGetValue(el);

					if (isBuildAsArray) {
						(propOldValue) ?
							// Add item to the array
							builtObject[propName] = Extend.array(propOldValue, value) :
							// Set the new value
							builtObject[propName] = [value];
					} else {
						(propOldValue) ?
							// Spread and add properties
							builtObject[propName] = Extend.array(propOldValue, value) :
							// Set the new value
							builtObject[propName] = value;
					}
					// Calling on set function
					if (isFunction(onSet))
						onSet!.call(instance.bouer, builtObject, propName, value, el);
				}

				forEach(toArray(el.children), (child: Element) => {
					if (!findAttribute(child, [Constants.build]))
						walker(child);
				});
			})(element);

			return builtObject;
		}

		const builtObject = objBuilder(element!);
		const builds = toArray(element!.querySelectorAll(`[${Constants.build}]`));

		forEach(builds, (buildElement: Element) => {
			// Getting the e-build attr value
			const buildPath = getter(buildElement, Constants.build) as string;
			const isBuildAsArray = buildElement.hasAttribute(Constants.array);
			const builtObjValue = objBuilder(buildElement);

			// If the object is empty (has all fields with `null` value)
			if (!isFilledObj(builtObjValue)) return;

			(function objStructurer(remainPath, lastLayer) {
				const splittedPath = remainPath.split('.');
				const leadElement = splittedPath[0];

				// Remove the lead element of the array
				splittedPath.shift();

				const objPropertyValue = lastLayer[leadElement];

				if (isNull(objPropertyValue))
					lastLayer[leadElement] = {};

				// If it's the last element of the array
				if (splittedPath.length === 0) {
					if (isBuildAsArray) {
						// Handle Array
						if (isObject(objPropertyValue) && !isEmptyObject(objPropertyValue)) {
							lastLayer[leadElement] = [Extend.obj(objPropertyValue, builtObjValue)];
						} else if (Array.isArray(objPropertyValue)) {
							objPropertyValue.push(builtObjValue);
						} else {
							lastLayer[leadElement] = [builtObjValue];
						}
					} else {
						isNull(objPropertyValue) ?
							// Set the new property
							lastLayer[leadElement] = builtObjValue :
							// Spread and add the new fields into the object
							lastLayer[leadElement] = Extend.obj(objPropertyValue, builtObjValue);
					}
					if (isFunction(onSet))
						onSet!.call(instance.bouer, lastLayer, leadElement, builtObjValue, buildElement);

					return;
				}

				if (Array.isArray(objPropertyValue)) {
					return forEach(objPropertyValue, item => {
						objStructurer(splittedPath.join('.'), item);
					});
				}

				objStructurer(splittedPath.join('.'), lastLayer[leadElement]);
			})(buildPath, builtObject);
		});

		return builtObject;
	}
}