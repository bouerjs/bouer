import { Constants } from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import Logger from "../../shared/logger/Logger";
import { delimiterResponse } from "../../types/delimiterResponse";
import Binder from "../binder/Binder";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import EventHandler from "../event/EventHandler";
import Bouer from "../instance/Bouer";
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

export default class Compiler {
  private bouer: Bouer;
  private binder: Binder;
  private directive: Directive;
  private delimiter: DelimiterHandler;
  private eventHandler: EventHandler;
  private component: ComponentHandler;

  private NODES_TO_IGNORE_IN_COMPILATION = {
    'SCRIPT': 1,
    '#comment': 8
  }

  constructor(bouer: Bouer) {
    IoC.Register(this);

    this.bouer = bouer;
    this.binder = IoC.Resolve('Binder')!;
    this.delimiter = IoC.Resolve('DelimiterHandler')!;
    this.eventHandler = IoC.Resolve('EventHandler')!;
    this.component = IoC.Resolve('ComponentHandler')!;
    this.directive = new Directive(bouer, this);
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
    componentContent?: Element
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

        if (node.localName === Constants.tagContent && options.componentContent) {
          const insertContent = (content: Element, reference: Node) => {
            forEach(toArray(content.childNodes), (child: Node) => {
              const cloned = child.cloneNode(true);
              rootElement.insertBefore(cloned, reference);
              walker(cloned, data);
            });
            rootElement.removeChild(reference);
          }

          if (node.hasAttribute('default')) {
            // In case of default content insertion
            return insertContent(options.componentContent!, node);
          } else if (node.hasAttribute('target')) {
            // In case of target content insertion
            const target = (node.attributes as any)['target'] as Attr;
            return forEach(toArray(options.componentContent!.children), (child: Element) => {
              if (child.localName === Constants.tagContent && child.getAttribute('target') !== target.value)
                return;

              insertContent(child, node);
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

        // <component></component>
        if (this.component.check(node.localName))
          return this.component.order(node, data);

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

      // e-[?]="..." directive
      if (Constants.check(node, Constants.property) && !Constants.isConstant(node.nodeName))
        this.directive.property(node, data);

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
