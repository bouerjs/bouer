import IDelimiterResponse from '../../definitions/interfaces/IDelimiterResponse';
import CustomDirective from '../../definitions/types/CustomDirective';
import RenderContext from '../../definitions/types/RenderContext';
import Bouer from '../../instance/Bouer';
import Constants from '../../shared/helpers/Constants';
import ServiceProvider from '../../shared/helpers/ServiceProvider';
import {
  DOM,
  fnCall,
  forEach,
  findDirective,
  isFunction,
  isString, toArray
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Base from '../Base';
import Binder from '../binder/Binder';
import ComponentHandler from '../component/ComponentHandler';
import DelimiterHandler from '../DelimiterHandler';
import EventHandler from '../event/EventHandler';
import Directive from './Directive';

export default class Compiler extends Base {
  bouer: Bouer;
  binder: Binder;
  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  component: ComponentHandler;
  directives: CustomDirective;
  serviceProvider: ServiceProvider;

  private NODES_TO_IGNORE_IN_COMPILATION = {
    'SCRIPT': 1,
    '#comment': 8
  };

  constructor(bouer: Bouer, directives?: CustomDirective) {
    super();

    this.bouer = bouer;
    this.serviceProvider = new ServiceProvider(bouer);
    this.directives = directives ?? {};

    this.binder = this.serviceProvider.get('Binder')!;
    this.delimiter = this.serviceProvider.get('DelimiterHandler')!;
    this.eventHandler = this.serviceProvider.get('EventHandler')!;
    this.component = this.serviceProvider.get('ComponentHandler')!;

    ServiceProvider.add('Compiler', this);
  }

  compile<Data>(options: {
    /** The element that wil be compiled */
    el: Element,

    /** The data that should be injected in the compilation */
    data?: Data,

    /**
     * In case of components having content inside of the definition,
     * a wrapper (Example: <div>) with the content need to be provided
     * in `componentSlot` property in order to be replaced on the compilation.
     */
    componentSlot?: Element,

    /** The function that should be fired when the compilation is done */
    onDone?: (element: Element, data?: Data) => void | Promise<any>,

    /** The context of this compilation process */
    context: RenderContext,

    /* Allow to provide the connectivity source of the element to be compiled */
    isConnected?: () => boolean
  }) {
    const rootElement = options.el;
    const context = options.context || this.bouer;
    const data = (options.data || this.bouer.data!);
    const isConnected = (options.isConnected || (() => rootElement.isConnected));

    if (!rootElement)
      return Logger.error('Invalid element provided to the compiler.');

    if (!this.analize(rootElement.outerHTML))
      return rootElement;

    const directive = new Directive(this.directives || {}, this, context);

    const walker = (node: Node, data: object) => {
      if (node.nodeName in this.NODES_TO_IGNORE_IN_COMPILATION)
        return;

      // First Element Attributes compilation
      if (node instanceof Element) {
        // e-skip directive
        if (Constants.skip in node.attributes)
          return directive.skip(node);

        // In case of slots
        if ((node.localName.toLowerCase() === Constants.slot || node.tagName.toLowerCase() === Constants.slot)
          && options.componentSlot) {
          const componentSlot = options.componentSlot;
          const insertSlot = (slot: Element, reference: Node) => {
            const $Walker = (child: Node) => {
              const cloned = child.cloneNode(true);
              reference.parentNode!.insertBefore(cloned, reference);
              walker(cloned, data);
            };

            if (slot.nodeName === 'SLOTCONTAINER' || slot.nodeName === 'SLOT')
              forEach(toArray(slot.childNodes), (child: Node) => $Walker(child));
            else
              $Walker(slot);

            reference.parentNode!.removeChild(reference);
          };

          if (node.hasAttribute('default')) {
            if (componentSlot.childNodes.length == 0)
              return;

            // In case of default slot insertion
            return insertSlot(componentSlot, node);
          } else if (node.hasAttribute('name')) {
            // In case of target slot insertion
            const target = node.attributes.getNamedItem('name') as Attr;

            return (function $Walker(element: Element) {
              const slotValue = element.getAttribute(Constants.slot);
              if (slotValue && slotValue === target.value) {
                element.removeAttribute(Constants.slot);
                return insertSlot(element, node);
              }

              if (element.children.length === 0)
                return null;

              forEach(toArray(element.children), (child: Element) => {
                $Walker(child);
              });
            })(componentSlot);
          }
        }

        // e-def="{...}" directive
        if (Constants.def in node.attributes)
          directive.def(findDirective(node, Constants.def)!, data);

        // e-entry="..." directive
        if (Constants.entry in node.attributes)
          directive.entry(findDirective(node, Constants.entry)!, data);

        // wait-data="..." directive
        if (Constants.wait in node.attributes)
          return directive.wait(findDirective(node, Constants.wait)!);

        // e-for="..." directive
        if (Constants.for in node.attributes)
          return directive.for(findDirective(node, Constants.for)!, data);

        // <component></component>
        if (this.component.check(node.localName))
          return this.component.order(node, data);

        // e-if="..." directive
        if (Constants.if in node.attributes)
          return directive.if(findDirective(node, Constants.if)!, data);

        // e-else-if="..." or e-else directive
        if ((Constants.elseif in node.attributes) || (Constants.else in node.attributes))
          Logger.warn('The “' + Constants.elseif + '” or “' + Constants.else +
            '” requires an element with “' + Constants.if + '” above.');

        // e-show="..." directive
        if (Constants.show in node.attributes)
          directive.show(findDirective(node, Constants.show)!, data);

        // e-req="..." | e-req:[id]="..."  directive
        let reqNode: Attr | null = null;
        if ((reqNode = findDirective(node, Constants.req)))
          return directive.req(reqNode, data);

        // data="..." | data:[id]="..." directive
        let dataNode: Attr | null = null;
        if (dataNode = findDirective(node, Constants.data))
          return directive.data(dataNode, data);

        // put="..." directive
        if (Constants.put in node.attributes)
          return directive.put(findDirective(node, Constants.put) as Attr, data);

        // Looping the attributes
        forEach(toArray(node.attributes), (attr: Attr) => {
          walker(attr, data);
        });
      }

      // :href="..." or !href="..." directive
      if (Constants.check(node, Constants.href))
        return directive.href(node, data);

      // e-text="..." directive
      if (Constants.check(node, Constants.text))
        return directive.text(node);

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
        return this.eventHandler.compile(node, data, context);

      // ShortHand directive: {title}
      let delimiterField: IDelimiterResponse | null;
      if ((delimiterField = this.delimiter.shorthand(node.nodeName))) {
        const element = ((node as any).ownerElement || node.parentNode) as Element;
        const attr = DOM.createAttribute('e-' + delimiterField.expression);

        attr.value = '{{ ' + delimiterField.expression + ' }}';

        element.attributes.setNamedItem(attr);
        element.attributes.removeNamedItem(delimiterField.field);

        return this.binder.create({
          node: attr,
          isConnected: isConnected,
          fields: [{ expression: delimiterField.expression, field: attr.value }],
          context: context,
          data: data
        });
      }

      // Property binding
      let delimitersFields: IDelimiterResponse[];
      if (isString(node.nodeValue) && (delimitersFields = this.delimiter.run(node.nodeValue!))
        && delimitersFields.length !== 0) {
        this.binder.create({
          node: node,
          isConnected: isConnected,
          fields: delimitersFields,
          context: context,
          data: data
        });
      }

      forEach(toArray(node.childNodes), (childNode: Node) =>
        walker(childNode, data));
    };

    walker(rootElement, data);

    if (rootElement.hasAttribute && rootElement.hasAttribute(Constants.silent))
      rootElement.removeAttribute(Constants.silent);

    if (isFunction(options.onDone)) {
      fnCall(options.onDone!.call(context, rootElement));
    }

    this.eventHandler.emit({
      eventName: Constants.builtInEvents.compile,
      attachedNode: rootElement,
      once: true,
      init: { detail: data }
    });

    return rootElement;
  }

  analize(htmlSnippet: string): boolean {
    return true;

    // const parser = new DOMParser();
    // const htmlForParser = `<xml>${htmlSnippet}</xml>`
    //   .replace(/(src|href)=".*?&.*?"/g, '$1=""')
    //   .replace(/<script[sS]+?<\/script>/gm, '<script></script>')
    //   .replace(/<style[sS]+?<\/style>/gm, '<style></style>')
    //   .replace(/<pre[sS]+?<\/pre>/gm, '<pre></pre>')
    //   .replace(/&nbsp;/g, '&#160;');

    // const doc = parser.parseFromString(htmlForParser, 'text/xml');
    // const xmlContainer = DOM.createElement('xml');
    // xmlContainer.innerHTML = doc.documentElement.outerHTML;
    // const parsererror = xmlContainer.querySelector('parsererror');

    // if (parsererror) {
    //   Logger.error('HTML Snippet:\n' + htmlSnippet.split(/\n/)
    //  .map((line, column) => `${column + 1}: ${line}`).join('\n'));
    //   return false;
    // }
    // return true;
  }
}
