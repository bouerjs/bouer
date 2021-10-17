import Bouer from "../Bouer";
import { code, DOM, isNull } from "../shared/helpers/Utils";

export default class CommentHandler {
  /**
   * Provide the instance of the class.
   * link: https://refactoring.guru/design-patterns/singleton
   */
  static singleton: CommentHandler;

  bouer: Bouer;

  constructor(bouer: Bouer) {
    this.bouer = bouer;
    CommentHandler.singleton = this;
  }

  /** Creates a comment with some identifier */
  create(id?: string) {
    const comment = DOM.createComment('e');
    (comment as any).id = id || code(8);
    return comment;
  }

  // Gets a comment from an element
  get(id: string, element?: Element) {
    if (isNull(id)) return;
    element = element || this.bouer.el;
    return this.retrieve(element).find(comment => (comment as any).id === id);
  }

  retrieve(elem: Element) {
    if (!elem) return [];

    const filterNone = function () { return NodeFilter.FILTER_ACCEPT; };
    const iterator = DOM.createNodeIterator(elem, NodeFilter.SHOW_COMMENT, filterNone);
    const nodes = [];
    let node: any;

    while (node = iterator.nextNode()) {
      // Only adds easy nodes
      if ('id' in  node)
        nodes.push(node);
    }

    return nodes as Array<Comment>;
  }
}
