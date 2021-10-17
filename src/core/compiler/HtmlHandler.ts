import Bouer from "../../Bouer";
import Extensions from "../../shared/Extensions";
import { Constants } from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import {
  DOM,
  connectNode,
  findAttribute,
  forEach,
  isEmptyObject,
  isFilledObj,
  isFunction,
  isNull,
  isObject,
  isString,
  trim
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Binder from "../binder/Binder";
import DelimiterHandler, { DelimiterResult } from "../DelimiterHandler";
import EventHandler from "../event/EventHandler";
import Directive from "./Directive";

export default class HtmlHandler {
  /**
   * Provide the instance of the class.
   * link: https://refactoring.guru/design-patterns/singleton
   */
  public static singleton: HtmlHandler;

  private bouer: Bouer;
  private binder: Binder;
  private directive: Directive;
  private delimiter: DelimiterHandler;
  private eventHandler: EventHandler;
  private NODES_TO_IGNORE_IN_COMPILATION = {
    'SCRIPT': 1,
    '#comment': 8
  }

  constructor(bouer: Bouer) {
    HtmlHandler.singleton = this;

    this.bouer = bouer;
    this.delimiter = DelimiterHandler.singleton;
    this.eventHandler = EventHandler.singleton;
    this.binder = Binder.singleton;

    this.directive = new Directive(bouer, this);
  }

  toJsObj(input: any,
    options?: {
      names?: string,
      values?: string
    }, onSet?: (builtObject: object, propName: string, value: any, element: Element) => void): object {
    let element: Element | undefined = undefined;
    const instance = this;
    // If it's not a HTML Element, just return
    if ((input instanceof Element))
      element = input;
    // If the element is an object
    else if (isObject(input))
      return input;
    // If it's a string try to get the element
    else if (isString(input)) {
      try {
        element = this.bouer.el.querySelector(input);
      } catch {
        // Unknown element type
        return input
      }
    }

    // If the element is not
    if (isNull(element))
      throw Logger.error("Invalid element passed in app.toJsObj(...)");

    // Clear [ ] and , and return an array of the names provided
    const clear = (value: string): Array<string> => {
      return value.split(',').map(item => trim(item.replace('[', '').replace(']', '')));
    }

    options = options || {};

    const mNames = clear(options.names || '[name]');
    const mValues = clear(options.values || '[value]');

    const tryGetValue = (el: Element): string | number | boolean | undefined => {
      let val: string | number | boolean | undefined | null = undefined;

      mValues.find((field: string) => {
        return (val = Extensions.value(el, field)) ? true : false;
      });

      return val;
    }

    const objBuilder = (element: Element) => {
      let builtObject: any = {};

      // Elements that skipped on serialization process
      let escapes: any = { BUTTON: true };
      let checkables: any = { checkbox: true, radio: true };

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
            onSet!.call(instance, builtObject, propName, value, el);
        }

        forEach([].slice.call(el.children), (child: Element) => {
          if (!findAttribute(child, [Constants.build]))
            walker(child);
        });

      })(element);

      return builtObject;
    }

    const builtObject = objBuilder(element!);
    const builds = [].slice.call(element!.querySelectorAll(`[${Constants.build}]`));

    forEach(builds, (buildElement: Element) => {
      // Getting the e-build attr value
      const fullPath = Extensions.value(buildElement, Constants.build) as string;
      const isBuildAsArray = buildElement.hasAttribute(Constants.array);
      const builderObjValue = objBuilder(buildElement);

      // If the object is empty (has all fields with `null` value)
      if (!isFilledObj(builderObjValue)) return;

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
              lastLayer[leadElement] = [Extend.obj(objPropertyValue, builderObjValue)];
            } else if (Array.isArray(objPropertyValue)) {
              objPropertyValue.push(builderObjValue);
            } else {
              lastLayer[leadElement] = [builderObjValue];
            }
          } else {
            isNull(objPropertyValue) ?
              // Set the new property
              lastLayer[leadElement] = builderObjValue :
              // Spread and add the new fields into the object
              lastLayer[leadElement] = Extend.obj(objPropertyValue, builderObjValue);
          }
          if (isFunction(onSet))
            onSet!.call(instance, lastLayer, leadElement, builderObjValue, buildElement);

          return;
        }

        if (Array.isArray(objPropertyValue)) {
          return forEach(objPropertyValue, function (item: any) {
            objStructurer(splittedPath.join('.'), item);
          });
        }

        objStructurer(splittedPath.join('.'), lastLayer[leadElement]);
      })(fullPath, builtObject);
    });

    return builtObject;
  }

  compile(options: {
    /** The element that wil be compiled */
    el: Element
    /** The data that will be injected in the compilation */
    data?: object
    /** The function that will be fired when the compilation is done */
    onDone?: (element: Element) => void
  }) {
    const rootElement = options.el;
    const data = (options.data || this.bouer.data!);

    if (!this.analizer(rootElement.outerHTML))
      return;

    const walker = (node: Node, data: object) => {
      if (node.nodeName in this.NODES_TO_IGNORE_IN_COMPILATION)
        return;

      // First Element Attributes compilation
      if (node instanceof Element) {
        // e-ignore" directive
        if (Constants.ignore in node.attributes)
          return this.directive.ignore(node);

        // e-def="{...}" directive
        if (Constants.def in node.attributes)
          this.directive.def((node.attributes as any)[Constants.def], data);

        // wait-data="..." directive
        if (Constants.wait in node.attributes)
          return this.directive.wait((node.attributes as any)[Constants.wait], data);

        // e-copy="..." directive
        if (Constants.copy in node.attributes)
          this.directive.copy(node);

        // data="..." directive
        if (Constants.data in node.attributes)
          return this.directive.data((node.attributes as any)[Constants.data], data);

        // e-for="..." directive
        if (Constants.for in node.attributes)
          return this.directive.for((node.attributes as any)[Constants.for], data)
            .connect(rootElement);

        // e-if="..." directive
        if (Constants.if in node.attributes)
          return this.directive.if((node.attributes as any)[Constants.if], data);

        // e-else-if="..." or e-else directive
        if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
          Logger.warn('The "' + Constants.elseif + '" or "' + Constants.else + '" requires an element with "' + Constants.if + '" above.');

        // e-show="..." directive
        if (Constants.show in node.attributes)
          return this.directive.show((node.attributes as any)[Constants.show], data)
            .connect(rootElement);

        // <component> directive
        if (Constants.component in node.attributes)
          return this.directive.component((node.attributes as any)[Constants.component], data);

        // e-req="..." | e-req:[id]="..."  directive
        let reqNode: any = null;
        if ((reqNode = (node.attributes as any)[Constants.req]) ||
            (reqNode = [].slice.call(node.attributes).find(attr => Constants.check(attr, Constants.req))))
          return this.directive.req(reqNode, data);

        // :href="..." or !href="..." directive
        if ((Constants.href in node.attributes) || (Constants.ihref in node.attributes))
          return this.directive.href((node.attributes as any)[Constants.href], data)
            .connect(rootElement);

        // Looping the attributes
        forEach([].slice.call(node.attributes), (attr: Attr) => {
          walker(attr, data);
        });
      }

      // e-content="..." directive
      if (Constants.check(node, Constants.content))
        return this.directive.content(node);

      // e-bind:[?]="..." directive
      if (Constants.check(node, Constants.bind))
        return this.directive.bind(node, data)
          .connect(rootElement);

      // e-[?]="..." directive
      if (Constants.check(node, Constants.property) && !Constants.isConstant(node.nodeName))
        this.directive.property(node, data)
          .connect(rootElement);

      // Event handler
      // on:[?]="..." directive
      if (Constants.check(node, Constants.on))
        return this.eventHandler.handle(node, data);

      // Property binding
      let delimitersFields: DelimiterResult[];
      if (isString(node.nodeValue) && (delimitersFields = this.delimiter.run(node.nodeValue!)) && delimitersFields.length !== 0) {
        this.binder.create({
          node: connectNode(node, rootElement),
          fields: delimitersFields,
          data: data
        });
      }

      // Looping the nodes if exists
      let childNode: Node | null = node.childNodes[0];
      do {
        if (!childNode) break;
        walker(childNode, data);
      } while (childNode = childNode.nextSibling)
    }

    walker(rootElement, data);

    if (isFunction(options.onDone))
      options.onDone!.call(this.bouer, rootElement);
  }

  analizer(htmlSnippet: string): boolean {
    return true;

    const parser = new DOMParser();
    const htmlForParser = `<xml>${htmlSnippet}</xml>`
      .replace(/(src|href)=".*?&.*?"/g, '$1=""')
      .replace(/<script[sS]+?<\/script>/gm, '<script></script>')
      .replace(/<style[sS]+?<\/style>/gm, '<style></style>')
      .replace(/<pre[sS]+?<\/pre>/gm, '<pre></pre>')
      .replace(/&nbsp;/g, '&#160;');

    const doc = parser.parseFromString(htmlForParser, 'text/xml');
    const xmlContainer = DOM.createElement('xml');
    xmlContainer.innerHTML = doc.documentElement.outerHTML;
    const parsererror = xmlContainer.querySelector('parsererror');

    if (parsererror) {
      Logger.error('HTML Snippet:\n' + htmlSnippet.split(/\n/).map((line, column) => `${column + 1}: ${line}`).join('\n'));
      return false;
    }
    return true;
  }
}
