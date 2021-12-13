import IMiddleware from "../../definitions/interfaces/IMiddleware";
import MiddlewareConfigActions from "../../definitions/types/MiddlewareConfigActions";
import Bouer from "../../instance/Bouer";
export default class Middleware {
    private middlewareConfigContainer;
    bouer: Bouer;
    constructor(bouer: Bouer);
    run: (directive: string, runnable: {
        type: 'bind' | 'update';
        action: (middleware: (context: IMiddleware, callbacks: {
            success: (response: any) => void;
            fail: (error: any) => void;
            done: () => void;
        }) => void) => void;
        default?: (() => void) | undefined;
    }) => void;
    register: (directive: string, actions: MiddlewareConfigActions) => void;
}
