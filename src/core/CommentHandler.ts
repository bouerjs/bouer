import Bouer from "../instance/Bouer";
import ServiceProvider from "../shared/helpers/ServiceProvider";
import { code, DOM } from "../shared/helpers/Utils";
import Base from "./Base";

export default class CommentHandler extends Base {
  bouer: Bouer;

  constructor(bouer: Bouer) {
		super();

    this.bouer = bouer;
    ServiceProvider.add('CommentHandler', this);
  }

  /** Creates a comment with some identifier */
  create(id?: string) {
    const comment = DOM.createComment('e');
    (comment as any).id = id || code(8);
    return comment;
  }
}
