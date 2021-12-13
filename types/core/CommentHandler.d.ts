import Bouer from "../instance/Bouer";
export default class CommentHandler {
    bouer: Bouer;
    constructor(bouer: Bouer);
    /** Creates a comment with some identifier */
    create(id?: string): Comment;
}
