import IDelimiterResponse from '../../definitions/interfaces/IDelimiterResponse';
import INode from '../../definitions/interfaces/INode';
import CustomDirective from '../../definitions/types/CustomDirective';
import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import Bouer from '../../instance/Bouer';
import Constants from '../../shared/helpers/Constants';
import Extend from '../../shared/helpers/Extend';
import IoC from '../../shared/helpers/IoCContainer';
import {
  $default,
  findDirective,
  findOneBy,
  fnCallResolver,
  forEach,
  isString, toArray, toLower
} from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Binder from '../binder/Binder';
import ComponentHandler from '../component/ComponentHandler';
import DelimiterHandler from '../DelimiterHandler';
import EventHandler from '../event/EventHandler';
import FormSchema from '../form/FormSchema';
import Routing from '../routing/Routing';
import DataStore from '../store/DataStore';
import Directive from './Directive';

export type CompilationHooks = {
  beforeCompile?: (this: RenderContext, element: Node, data?: dynamic) => void | Promise<any>,
  /** The function that should be fired after the compilation ends */
  afterCompile?: (this: RenderContext, element: Node, data?: dynamic) => void | Promise<any>
};

export default class Compiler {
  readonly _IRT_ = true;
  bouer: Bouer;
  binder: Binder;
  delimiter: DelimiterHandler;
  eventHandler: EventHandler;
  component: ComponentHandler;
  directives: CustomDirective;
  dataStore: DataStore;

  private NODES_TO_IGNORE_IN_COMPILATION = {
    'SCRIPT': 1,
    '#comment': 8
  };

  constructor(
    bouer: Bouer,
    binder: Binder,
    delimiterHandler: DelimiterHandler,
    eventHandler: EventHandler,
    componentHandler: ComponentHandler,
    directives?: CustomDirective
  ) {
    this.bouer = bouer;
    this.directives = directives ?? {};
    this.binder = binder;
    this.delimiter = delimiterHandler;
    this.eventHandler = eventHandler;
    this.component = componentHandler;
    this.dataStore = IoC.app(bouer).resolve(DataStore)!;
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

    /** The function that should be fired before the compilation started */
    beforeCompile?: (this: typeof options.context, element: Node, data?: Data) => void | Promise<any>,
    /** The function that should be fired after the compilation ends */
    afterCompile?: (this: typeof options.context, element: Node, data?: Data) => void | Promise<any>,
    /** The function that should be fired when the compilation is done */
    onComponentLoad?: (this: typeof options.context, element: Element, data?: Data) => void | Promise<any>,

    /** The context of this compilation process */
    context: RenderContext,

    directivesToIgnore?: string[]
  }) {
    const rootElement = options.el;
    const context = options.context || this.bouer;
    const data = (options.data || this.bouer.data!);
    const routing = IoC.app(this.bouer).resolve(Routing)!;

    const directivesToIgnore = options.directivesToIgnore || [];

    const beforeCompile = options.beforeCompile || $default;
    const afterCompile = options.afterCompile || $default;
    const onComponentLoad = options.onComponentLoad || $default;


    const getElementData = (node: Element | Node, defaultData: dynamic) => {
      if (!(node instanceof Element)) return defaultData;
      return this.dataStore.getNodeData(node, defaultData)!;
    }

    if (!rootElement)
      return Logger.error('Invalid element provided to the compiler.');

    const iNode = rootElement as INode;
    const isActive = iNode.isActive = iNode.isActive ?? (() => rootElement.isConnected);

    if (!this.analize(rootElement.outerHTML))
      return rootElement;

    const directive = new Directive(this, this.directives || {}, context);
    const loadingComponents: Promise<any>[] = [];

    fnCallResolver(
      beforeCompile!.call(context,rootElement, data as any)
    );

    const walker = (currentNode: Node, scopeData: object): any => {
      if (currentNode.nodeName in this.NODES_TO_IGNORE_IN_COMPILATION)
        return;

      // Intercept Directive by node
      if (directivesToIgnore.indexOf(currentNode.nodeName) >= 0)
        return;

      // First Element Attributes compilation
      if (currentNode instanceof Element) {
        const attributes = currentNode.attributes;

        // e-skip directive
        if (Constants.skip in attributes)
          return directive.skip(currentNode);

        // Intercept Directive in the Element
        if (findOneBy(directivesToIgnore, (dir) => dir in attributes))
          return;

        // e-def="{...}" directive
        if (Constants.def in attributes)
          directive.def(findDirective(currentNode, Constants.def)!, scopeData);

        // e-entry="..." directive | <component />
        if (Constants.entry in attributes)
          directive.entry(findDirective(currentNode, Constants.entry)!, scopeData);

        // wait-data="..." directive
        if (Constants.wait in attributes)
          return directive.wait(findDirective(currentNode, Constants.wait)!, {
            beforeCompile: beforeCompile as any,
            afterCompile: afterCompile as any
          });

        // e-form directive
        if (Constants.form.property in attributes)
          return directive.form(findDirective(currentNode, Constants.form.property)!, scopeData);

        if (FormSchema.isBuild(currentNode)) {
          return walker(currentNode, Extend.obj(scopeData, {
            $form: new FormSchema({ currentNode, scopeData })
          }));
        }

        // e-for="..." directive
        if (Constants.for in attributes)
          return directive.for(findDirective(currentNode, Constants.for)!, scopeData, {
            beforeCompile: beforeCompile as any,
            afterCompile: afterCompile as any
          });

        // <component />
        if (this.component.check(currentNode.localName)) {
          return loadingComponents.push(new Promise((resolver, reject) => {
            this.component.order({
              directivesToIgnore: directivesToIgnore,
              context: context,
              componentElement: currentNode,
              data: scopeData,

              compilationHooks: {
                beforeCompile: beforeCompile as any,
                afterCompile: afterCompile as any,
              },

              onComponentLoad(component) { resolver(component); },
              onComponentFail() { reject(currentNode); },
            })
          }));
        }

        // e-if="..." directive
        if (Constants.if in attributes)
          return directive.if(findDirective(currentNode, Constants.if)!, scopeData, {
            beforeCompile: beforeCompile as any,
            afterCompile: afterCompile as any
          });

        // e-else-if="..." or e-else directive
        if ((Constants.elseif in attributes) || (Constants.else in attributes))
          Logger.warn('The “' + Constants.elseif + '” or “' + Constants.else +
            '” requires an element with “' + Constants.if + '” above.');

        // e-show="..." directive
        if (Constants.show in attributes)
          directive.show(findDirective(currentNode, Constants.show)!, scopeData);

        // e-req="..." | e-req:[id]="..."  directive
        let reqNode: Attr | null = null;
        if ((reqNode = findDirective(currentNode, Constants.req)))
          return directive.req(reqNode, scopeData, {
            beforeCompile: beforeCompile as any,
            afterCompile: afterCompile as any
          });

        // data="..." | data:[id]="..." directive
        let dataNode: Attr | null = null;
        if ((dataNode = findDirective(currentNode, Constants.data)) )
          return directive.data(dataNode, scopeData, {
            beforeCompile: beforeCompile as any,
            afterCompile: afterCompile as any
          });

        // put="..." directive
        if (Constants.put in attributes)
          return directive.put(findDirective(currentNode, Constants.put)!, scopeData, {
            beforeCompile: beforeCompile as any,
            afterCompile: afterCompile as any
          });

        // route-view node
        if (routing.routeView === currentNode)
          return;

        // Looping the attributes
        forEach(toArray(attributes), (attr: Attr) => walker(attr, scopeData));
      }

      // :href="..." or !href="..." directive
      if (Constants.check(currentNode, Constants.href))
        return directive.href(currentNode, scopeData);

      // e-text="..." directive
      if (Constants.check(currentNode, Constants.text))
        return directive.text(currentNode);

      // e-bind:[?]="..." directive
      if (Constants.check(currentNode, Constants.bind))
        return directive.bind(currentNode, scopeData);

      // Custom directive
      let isCustomDirective = false;
      if (isCustomDirective = Object.keys(directive.customDirectives).find(name => Constants.check(currentNode, name)) != null)
        if (directive.custom(currentNode, scopeData))
          return;

      // e-[?]="..." directive
      if (Constants.check(currentNode, Constants.property) && !isCustomDirective)
        directive.property(currentNode, scopeData);

      // e-skeleton directive
      if (Constants.check(currentNode, Constants.skeleton))
        directive.skeleton(currentNode);

      // Event handler
      // on:[?]="..." directive
      if (Constants.check(currentNode, Constants.on))
        return this.eventHandler.compile(currentNode, scopeData, context as RenderContext);

      // ShortHand directive: {title}
      let delimiterField: IDelimiterResponse | null;
      if (delimiterField = this.delimiter.shorthand(currentNode.nodeName)) {
        const element = ((currentNode as any).ownerElement || currentNode.parentNode) as Element;

        const attrName = 'e-' + delimiterField.expression;
        element.setAttribute(attrName, delimiterField.field);

        const attr = element.attributes.getNamedItem(attrName)! as INode;
        attr.isActive = isActive;
        element.attributes.removeNamedItem(currentNode.nodeName);

        return this.binder.create({
          node: attr,
          fields: [delimiterField],
          context: context as RenderContext,
          data: scopeData
        });
      }

      // Property binding
      let delimitersFields: IDelimiterResponse[];
      if (isString(currentNode.nodeValue) && (delimitersFields = this.delimiter.run(currentNode.nodeValue!))
        && delimitersFields.length !== 0) {
        this.binder.create({
          node: currentNode,
          fields: delimitersFields,
          context: context as RenderContext,
          data: scopeData
        });
      }

      const dataToUse = getElementData(currentNode, scopeData);
      forEach(toArray(currentNode.childNodes), (childNode: INode) => {
        childNode.isActive = isActive;

        fnCallResolver(// Before Compile the element...
          beforeCompile!.call(context, childNode, dataToUse as any)
        );

        // Executing...
        walker(childNode, dataToUse);

        fnCallResolver( // After Compile the element...
          afterCompile!.call(context, childNode, dataToUse as any)
        );
      });
    };

    walker(rootElement, getElementData(rootElement, data));

    fnCallResolver( // After Compile the element...
      afterCompile!.call( context, rootElement, data as any)
    );

    if (rootElement.hasAttribute && rootElement.hasAttribute(Constants.silent))
      rootElement.removeAttribute(Constants.silent);

    const onCompilationFinished = () => {
      this.eventHandler.emit({
        eventName: Constants.builtInEvents.compile,
        attachedNode: rootElement,
        once: true,
        init: { detail: data }
      });

      const dt: any = data;
      fnCallResolver(onComponentLoad!.call(context, rootElement, dt));
    };

    if (loadingComponents.length == 0)
      onCompilationFinished();
    else
      Promise.all(loadingComponents)
        .then(() => onCompilationFinished())
        .catch(() => onCompilationFinished());

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
          const lastOne = history[history.length - 1];
          lastOne.ident--; // reducing the ident
          indentNumber = lastOne.ident - 1;
        }
        continue;
      }
    }

    if (!isValid) {
      Logger.error(message +
        history.map(
          (h, i) => ((i + 1) + '').padStart(3, ' ') + ' | ' +
            Array(h.ident)
              .fill(indentChar)
              .join('') + h.tag)
              .join('\n')
        );
    }

    return isValid;
  }
}