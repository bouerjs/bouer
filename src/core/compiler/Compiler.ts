import IBouer from "../../definitions/interfaces/IBouer";
import IDelimiterResponse from "../../definitions/interfaces/IDelimiterResponse";
import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import Constants from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import {
	DOM,
	forEach, isFunction,
	isString,
	startWith, toArray
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Binder from "../binder/Binder";
import Component from "../component/Component";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import EventHandler from "../event/EventHandler";
import Directive from "./Directive";

export default class Compiler {
  bouer: Bouer;
  binder: Binder;
  bouerOptions: IBouer;
  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  component: ComponentHandler;


  private NODES_TO_IGNORE_IN_COMPILATION = {
    'SCRIPT': 1,
    '#comment': 8
  }

  constructor(bouer: Bouer, appOptions: IBouer) {
		this.bouer = bouer;
    this.bouerOptions = appOptions;

    this.binder = IoC.Resolve(this.bouer, Binder)!;
    this.delimiter = IoC.Resolve(this.bouer, DelimiterHandler)!;
    this.eventHandler = IoC.Resolve(this.bouer, EventHandler)!;
    this.component = IoC.Resolve(this.bouer, ComponentHandler)!;

    IoC.Register(this);
  }

  compile(options: {
    /** The element that wil be compiled */
    el: Element,
    /** The data that should be injected in the compilation */
    data?: dynamic,
    /**
     * In case of components having content inside of the definition,
     * a wrapper (Example: <div>) with the content need to be provided
     * in `componentSlot` property in order to be replaced on the compilation.
     */
    componentSlot?: Element
    /** The function that should be fired when the compilation is done */
    onDone?: (element: Element, data?: dynamic) => void,

    /** The context of this compilation process */
    context: Bouer | Component
  }) {
    const rootElement = options.el;
    const context = options.context || this.bouer;
    const data = (options.data || this.bouer.data!);

    if (!this.analize(rootElement.outerHTML))
      return rootElement;

    const directive = new Directive(this.bouerOptions.directives || {}, this, context);

    const walker = (node: Node, data: object) => {
      if (node.nodeName in this.NODES_TO_IGNORE_IN_COMPILATION)
        return;

      // First Element Attributes compilation
      if (node instanceof Element) {
        // e-skip" directive
        if (Constants.skip in node.attributes)
          return directive.skip(node);

        if (node.localName === Constants.slot && options.componentSlot) {
          const insertSlot = (slot: Element, reference: Node) => {
						const $walker = (child: Node) => {
							const cloned = child.cloneNode(true);
							rootElement.insertBefore(cloned, reference);
							walker(cloned, data);
						}

						if (slot.nodeName === 'SLOTCONTAINER')
							forEach(toArray(slot.childNodes), (child: Node) => $walker(child));
						else
							$walker(slot);

            rootElement.removeChild(reference);
          }

          if (node.hasAttribute('default')) {
            // In case of default slot insertion
            return insertSlot(options.componentSlot!, node);
          } else if (node.hasAttribute('name')) {
            // In case of target slot insertion
            const target = node.attributes.getNamedItem('name') as Attr

						return (function innerWalker(element: Element) {
							const slotValue = element.getAttribute(Constants.slot);
							if (slotValue && slotValue === target.value) {
								element.removeAttribute(Constants.slot);
								return insertSlot(element, node);
							}

							if (element.children.length === 0)
								return null;

							forEach(toArray(element.children), (child: Element) => {
								innerWalker(child);
							});
						})(options.componentSlot!);
          }
        }

        // e-def="{...}" directive
        if (Constants.def in node.attributes)
          directive.def(node.attributes.getNamedItem(Constants.def) as Attr, data);

        // e-entry="..." directive
        if (Constants.entry in node.attributes)
          directive.entry(node.attributes.getNamedItem(Constants.entry) as Attr, data);

        // wait-data="..." directive
        if (Constants.wait in node.attributes)
          return directive.wait(node.attributes.getNamedItem(Constants.wait) as Attr);

        // <component></component>
        if (this.component.check(node.localName))
          return this.component.order(node, data);

        // e-for="..." directive
        if (Constants.for in node.attributes)
          return directive.for(node.attributes.getNamedItem(Constants.for) as Attr, data);

        // e-if="..." directive
        if (Constants.if in node.attributes)
          return directive.if(node.attributes.getNamedItem(Constants.if) as Attr, data);

        // e-else-if="..." or e-else directive
        if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
          Logger.warn('The "' + Constants.elseif + '" or "' + Constants.else + '" requires an element with "' + Constants.if + '" above.');

        // e-show="..." directive
        if (Constants.show in node.attributes)
          directive.show(node.attributes.getNamedItem(Constants.show) as Attr, data);

        // e-req="..." | e-req:[id]="..."  directive
        let reqNode: any = null;
        if ((reqNode = node.attributes.getNamedItem(Constants.req) as Attr) ||
          (reqNode = toArray(node.attributes).find(attr => Constants.check(attr, Constants.req))))
          return directive.req(reqNode, data);

        // data="..." | data:[id]="..." directive
        let dataNode: any = null;
        if (dataNode = toArray(node.attributes).find((attr: Attr) => {
          const attrName = attr.name;
          // In case of data="..."
          if (attrName === Constants.data) return true;

          // In case of data:[data-id]="..."
          return startWith(attrName, Constants.data + ':');
        }))
          return directive.data(dataNode, data);

        // put="..." directive
        if (Constants.put in node.attributes)
          return directive.put(node.attributes.getNamedItem(Constants.put) as Attr, data);

        // Looping the attributes
        forEach(toArray(node.attributes), (attr: Attr) => {
          walker(attr, data);
        });
      }

      // :href="..." or !href="..." directive
      if (Constants.check(node, Constants.href))
        return directive.href(node, data);

      // e-content="..." directive
      if (Constants.check(node, Constants.content))
        return directive.content(node);

      // e-bind:[?]="..." directive
      if (Constants.check(node, Constants.bind))
        return directive.bind(node, data);

      // Custom directive
      if (Object.keys(directive.$custom).find(name => Constants.check(node, name)))
        if (directive.custom(node, data))
          return;

      // e-[?]="..." directive
      if (Constants.check(node, Constants.property) && !Constants.isConstant(node.nodeName))
        directive.property(node, data);

      // e-skeleton directive
      if (Constants.check(node, Constants.skeleton))
        directive.skeleton(node);

      // Event handler
      // on:[?]="..." directive
      if (Constants.check(node, Constants.on))
        return this.eventHandler.handle(node, data, context);

      // Property binding
      let delimitersFields: IDelimiterResponse[];
      if (isString(node.nodeValue) && (delimitersFields = this.delimiter.run(node.nodeValue!))
					&& delimitersFields.length !== 0) {
        this.binder.create({
					node: node,
					isConnected: () => rootElement.isConnected,
          fields: delimitersFields,
          context: context,
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
      options.onDone!.call(context, rootElement);

    return rootElement;
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
