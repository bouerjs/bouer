import Constants from '../../shared/helpers/Constants';
import Extend from '../../shared/helpers/Extend';
import Logger from '../../shared/logger/Logger';
import {
  buildError,
  DOM,
  findAttribute,
  fnCall,
  forEach,
  isEmptyObject,
  isFilledObj,
  isFunction,
  isNull,
  isObject,
  toArray,
} from '../../shared/helpers/Utils';
import dynamic from '../../definitions/types/Dynamic';


export default class Converter {
  readonly _IRT_ = true;
  static htmlToJsObj(input: string | HTMLElement,
    options?: {
      names?: string,
      values?: string
    },
    onSet?: (
      builtObject: object, propName: string, value: any, element: Element
    ) => void
  ): object | null {
    let element: Element | undefined = undefined;
    // If it's not a HTML Element, just return
    if ((input instanceof HTMLElement))
      element = input;
    // If it's a string try to get the element
    else if (typeof input === 'string') {
      try {
        const $el = DOM.querySelector(input);
        if (!$el) {
          Logger.error('Element with "' + input + '" selector Not Found.');
          return null;
        }
        element = $el;
      } catch (error) {
        // Unknown error
        Logger.error(buildError(error));
        return null;
      }
    }

    // If the element is not
    if (isNull(element))
      throw Logger.error('Invalid element provided at app.toJsObj(> "' + input + '" <).');

    options = options || {};

    // Remove `[ ]` and `,` and return an array of the names provided
    const mNames = (options.names || '[name]').replace(/\[|\]/g, '').split(',');
    const mValues = (options.values || '[value]').replace(/\[|\]/g, '').split(',');

    const getValue = (el: Element, fieldName: string) => {
      if (fieldName in el) return (el as any)[fieldName];
      return el.getAttribute(fieldName) || (el as any).innerText;
    };

    const tryGetValue = (el: Element) => {
      let val: string | number | boolean | undefined | null = undefined;
      mValues.find((field: string) => (val = getValue(el, field)) ? true : false);
      return val;
    };

    const objBuilder = (element: Element) => {
      const builtObject: dynamic = {};

      // Elements that skipped on serialization process
      const escapes: dynamic = { BUTTON: true };
      const checkables: dynamic = { checkbox: true, radio: true };

      (function walker(el: Element) {
        const attr = findAttribute(el, mNames);
        if (attr) {
          const propName = attr.value;

          if (escapes[el.tagName] === true) return;

          if ((el instanceof HTMLInputElement) && (checkables[el.type] === true && el.checked === false))
            return;

          const propOldValue = builtObject[propName];
          const isBuildAsArray = el.hasAttribute(Constants.array);
          const value = tryGetValue(el);

          if (value !== '') {
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
          }

          // Calling on set function
          if (isFunction(onSet))
            fnCall(onSet!(builtObject, propName, value, el));
        }

        forEach(toArray(el.children), (child: Element) => {
          if (!findAttribute(child, [Constants.build]))
            walker(child);
        });
      })(element);

      return builtObject;
    };

    const builtObject = objBuilder(element!);
    const builds = toArray(element!.querySelectorAll(`[${Constants.build}]`));

    forEach(builds, (buildElement: Element) => {
      // Getting the e-build attr value
      const buildPath = getValue(buildElement, Constants.build) as string;
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
            fnCall(onSet!(lastLayer, leadElement, builtObjValue, buildElement));

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