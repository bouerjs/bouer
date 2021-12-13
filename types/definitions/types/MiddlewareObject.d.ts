import IMiddleware from "../interfaces/IMiddleware";
declare type MiddlewareObject = {
    bind?: (context: IMiddleware, next: () => void) => Promise<any>;
    update?: (context: IMiddleware, next: () => void) => Promise<any>;
};
export default MiddlewareObject;
