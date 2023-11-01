import IDelimiterResponse from '../../definitions/interfaces/IDelimiterResponse';
import CustomDirective from '../../definitions/types/CustomDirective';
import RenderContext from '../../definitions/types/RenderContext';
import Bouer from '../../instance/Bouer';
import Constants from '../../shared/helpers/Constants';
import IoC from '../../shared/helpers/IoCContainer';
import {
  DOM,
  fnCall,
  forEach,
  findDirective,
  isFunction,
  isString, toArray, toLower
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Binder from '../binder/Binder';
import ComponentHandler from '../component/ComponentHandler';
import DelimiterHandler from '../DelimiterHandler';
import EventHandler from '../event/EventHandler';
import Routing from '../routing/Routing';
import Directive from './Directive';

export default class Compiler {
  readonly _IRT_ = true;
  bouer: Bouer;
  binder: Binder;
  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  component: ComponentHandler;
  directives: CustomDirective;

  private NODES_TO_IGNORE_IN_COMPILATION = {
    'SCRIPT': 1,
    '#comment': 8
  };

  constructor(
    bouer: Bouer,
    directives?: CustomDirective,
  ) {
    this.bouer = bouer;
    this.directives = directives ?? {};
    this.binder = IoC.app(bouer).resolve(Binder)!;
    this.delimiter = IoC.app(bouer).resolve(DelimiterHandler)!;
    this.eventHandler = IoC.app(bouer).resolve(EventHandler)!;
    this.component = IoC.app(bouer).resolve(ComponentHandler)!;
  }

  /**
   * Compiles an html element
   * @param {string} options the options of the compilation process
   * @returns the element compiled
   */
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
    onDone?: (this: typeof options.context, element: Element, data?: Data) => void | Promise<any>,

    /** The context of this compilation process */
    context: RenderContext,

    /* Allow to provide the connectivity source of the element to be compiled */
    isConnected?: () => boolean
  }) {
    const rootElement = options.el;
    const context = options.context || this.bouer;
    const data = (options.data || this.bouer.data!);
    const isConnected = (options.isConnected || (() => rootElement.isConnected));
    const routing = IoC.app(this.bouer).resolve(Routing)!;

    if (!rootElement)
      return Logger.error('Invalid element provided to the compiler.');

    if (!this.analize(rootElement.outerHTML))
      return rootElement;

    const directive = new Directive(this.directives || {}, this, context as RenderContext);

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

        // route-view node
        if (routing.routeView === node)
          return;

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
        return this.eventHandler.compile(node, data, context as RenderContext);

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
          context: context as RenderContext,
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
          context: context as RenderContext,
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

  analize(htmlSnippet: string) {
    const tagRegexRule = '<([a-z0-9-_]{1,}|/[a-z0-9-_]{1,})((.|\n|\r)*?)>';
    // Removing unnecessary verification
    const htmlForParser = htmlSnippet
      .replace(/<script((.|\n|\r)*?)<\/script>/gm, '<script></script>')
      .replace(/<style((.|\n|\r)*?)<\/style>/gm, '<style></style>')
      .replace(/<pre((.|\n|\r)*?)<\/pre>/gm, '<pre></pre>')
      .replace(/<code((.|\n|\r)*?)<\/code>/gm, '<code></code>')
      .replace(/<svg((.|\n|\r)*?)<\/svg>/gm, '<svg></svg>')
      .replace(/<!--((.|\n|\r)*?)-->/gm, '')
      .replace(/&nbsp;/g, '&#160;');

    const indentChar = '  ';
    const history = [];
    const tagsTree = [];
    let indentNumber = 0;
    let message = '';
    let isValid = true;

    // Getting the tags
    const tagElements = htmlForParser.match(new RegExp(tagRegexRule, 'ig')) || [];
    const selfCloseTags = new Set(
      [
        'area', 'base', 'br', 'col', 'embed',
        'hr', 'img', 'input', 'link', 'meta',
        'param', 'source', 'track', 'wbr'
      ]
    );

    for (let i = 0; i < tagElements.length; i++) {
      const tagElement = tagElements[i];
      const match = tagElement.match(new RegExp(tagRegexRule, 'i'))!;
      const tagName = toLower(match[1]);
      const isClosing = tagElement[1] === '/';

      history.push({
        tag: tagElement,
        ident: isClosing ? indentNumber : ++indentNumber,
      });

      if (selfCloseTags.has(tagName))
        continue;

      tagsTree.push({
        name: tagName,
        tag: tagElement
      });

      // In case of closing
      if (isClosing) {
        indentNumber--;

        // Keep building the tree
        if (!isValid) continue;

        const closingTag = tagsTree.pop()!;
        const openningTag = tagsTree.pop();

        if (!openningTag || openningTag.name !== closingTag.name.substring(1)) {
          indentNumber++;

          message = 'Syntax Error: Unexpected token, the openning tag `' + (openningTag!.tag || 'NoToken') +
            '` does not match with closing tag: `' + closingTag.tag + '`:\n\n';

          isValid = false;
          history.push(history[history.length - 1]);
          history[history.length - 2] = {
            tag: '<====================== Line Error ======================',
            ident: indentNumber + 1
          };
        }
        continue;
      }
    }

    if (!isValid) {
      Logger.error(message +
        history.map((h, i) => (i + 1) + '.' + Array(h.ident).fill(indentChar).join('') + h.tag).join('\n'));
    }

    return isValid;
  }
}