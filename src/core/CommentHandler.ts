import Bouer from "../instance/Bouer";
import { code, DOM, isNull } from "../shared/helpers/Utils";
import IoC from "../shared/helpers/IoC";

export default class CommentHandler {
  bouer: Bouer;

  constructor(bouer: Bouer) {
    this.bouer = bouer;

    IoC.Register(this);
  }

  /** Creates a comment with some identifier */
  create(id?: string) {
    const comment = DOM.createComment('e');
    (comment as any).id = id || code(8);
    return comment;
  }
}
