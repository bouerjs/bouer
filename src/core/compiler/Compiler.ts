import { Constants } from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import Logger from "../../shared/logger/Logger";
import { delimiterResponse } from "../../types/delimiterResponse";
import Binder from "../binder/Binder";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import EventHandler from "../event/EventHandler";
import Bouer from "../../instance/Bouer";
import Directive from "./Directive";
import {
  DOM,
  forEach,
  connectNode,
  isFunction,
  isString,
  startWith,
  isNull,
  toArray
} from "../../shared/helpers/Utils";
import customDirective from "../../types/customDirective";
import IBouer from "../../types/IBouer";

export default class Compiler {
  bouer: Bouer;
  binder: Binder;
  directive: Directive;
  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  component: ComponentHandler;

  private NODES_TO_IGNORE_IN_COMPILATION = {
    'SCRIPT': 1,
    '#comment': 8
  }

  constructor(bouer: Bouer, appOptions: IBouer) {
    IoC.Register(this);

    this.bouer = bouer;
    this.binder = IoC.Resolve('Binder')!;
    this.delimiter = IoC.Resolve('DelimiterHandler')!;
    this.eventHandler = IoC.Resolve('EventHandler')!;
    this.component = IoC.Resolve('ComponentHandler')!;
    this.directive = new Directive(appOptions.directives || {}, this);
  }

  compile(options: {
    /** The element that wil be compiled */
    el: Element,
    /** The data that will be injected in the compilation */
    data?: object,
    /**
     * In case of components having content inside of the definition,
     * a wrapper (Example: <div>) with the content need to be provided
     * in `componentContent` property in order to be replaced on the compilation.
     */
    componentSlot?: Element
    /** The function that will be fired when the compilation is done */
    onDone?: (element: Element, data?: object) => void
  }) {
    const rootElement = options.el;
    const data = (options.data || this.bouer.data!);

    if (!this.analize(rootElement.outerHTML))
      return;

    const walker = (node: Node, data: object) => {
      if (node.nodeName in this.NODES_TO_IGNORE_IN_COMPILATION)
        return;

      // First Element Attributes compilation
      if (node instanceof Element) {
        // e-ignore" directive
        if (Constants.ignore in node.attributes)
          return this.directive.ignore(node);

        if (node.localName === Constants.slot && options.componentSlot) {
          const insertSlot = (slot: Element, reference: Node) => {
            forEach(toArray(slot.childNodes), (child: Node) => {
              const cloned = child.cloneNode(true);
              rootElement.insertBefore(cloned, reference);
              walker(cloned, data);
            });
            rootElement.removeChild(reference);
          }

          if (node.hasAttribute('default')) {
            // In case of default slot insertion
            return insertSlot(options.componentSlot!, node);
          } else if (node.hasAttribute('name')) {
            // In case of target slot insertion
            const target = (node.attributes as any)['name'] as Attr;
            return forEach(toArray(options.componentSlot!.children), (child: Element) => {
              if (child.localName === Constants.slot && child.getAttribute('name') !== target.value)
                return;

              insertSlot(child, node);
            });
          }
        }

        // e-def="{...}" directive
        if (Constants.def in node.attributes)
          this.directive.def((node.attributes as any)[Constants.def], data);

        // e-entry="..." directive
        if (Constants.entry in node.attributes)
          this.directive.entry((node.attributes as any)[Constants.entry], data);

        // wait-data="..." directive
        if (Constants.wait in node.attributes)
          return this.directive.wait((node.attributes as any)[Constants.wait]);

        // <component></component>
        if (this.component.check(node.localName))
          return this.component.order(node, data);

        // e-for="..." directive
        if (Constants.for in node.attributes)
          return this.directive.for((node.attributes as any)[Constants.for], data);

        // e-if="..." directive
        if (Constants.if in node.attributes)
          return this.directive.if((node.attributes as any)[Constants.if], data);

        // e-else-if="..." or e-else directive
        if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
          Logger.warn('The "' + Constants.elseif + '" or "' + Constants.else + '" requires an element with "' + Constants.if + '" above.');

        // e-show="..." directive
        if (Constants.show in node.attributes)
          this.directive.show((node.attributes as any)[Constants.show], data);

        // e-req="..." | e-req:[id]="..."  directive
        let reqNode: any = null;
        if ((reqNode = (node.attributes as any)[Constants.req]) ||
          (reqNode = toArray(node.attributes).find(attr => Constants.check(attr, Constants.req))))
          return this.directive.req(reqNode, data);

        // data="..." | data:[id]="..." directive
        let dataNode: any = null;
        if (dataNode = toArray(node.attributes).find((attr: Attr) => {
          const attrName = attr.name;
          // In case of data="..."
          if (attrName === Constants.data) return true;

          // In case of data:[data-id]="..."
          return startWith(attrName, Constants.data + ':');
        }))
          return this.directive.data(dataNode, data);

        // put="..." directive
        if (Constants.put in node.attributes)
          return this.directive.put((node.attributes as any)[Constants.put], data);

        // Looping the attributes
        forEach(toArray(node.attributes), (attr: Attr) => {
          walker(attr, data);
        });
      }

      // :href="..." or !href="..." directive
      if (Constants.check(node, Constants.href) || Constants.check(node, Constants.ihref))
        return this.directive.href(node, data);

      // e-content="..." directive
      if (Constants.check(node, Constants.content))
        return this.directive.content(node);

      // e-bind:[?]="..." directive
      if (Constants.check(node, Constants.bind))
        return this.directive.bind(node, data);

      // Custom directive
      if (Object.keys(this.directive.$custom).find(name => Constants.check(node, name)))
        if (this.directive.custom(node, data))
          return;

      // e-[?]="..." directive
      if (Constants.check(node, Constants.property) && !Constants.isConstant(node.nodeName))
        this.directive.property(node, data);

      // e-skeleton directive
      if (Constants.check(node, Constants.skeleton))
        this.directive.skeleton(node);

      // Event handler
      // on:[?]="..." directive
      if (Constants.check(node, Constants.on))
        return this.eventHandler.handle(node, data);

      // Property binding
      let delimitersFields: delimiterResponse[];
      if (isString(node.nodeValue) && (delimitersFields = this.delimiter.run(node.nodeValue!)) && delimitersFields.length !== 0) {
        this.binder.create({
          node: connectNode(node, rootElement),
          fields: delimitersFields,
          data: data
        });
      }

      forEach(toArray(node.childNodes), (childNode: Node) =>
        walker(childNode, data))
    }

    walker(rootElement, data);

    if (rootElement.hasAttribute(Constants.silent))
      rootElement.removeAttribute(Constants.silent)

    if (isFunction(options.onDone))
      options.onDone!.call(this.bouer, rootElement);
  }

  analize(htmlSnippet: string): boolean {
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
