import IMiddleware from "../interfaces/IMiddleware";
declare type MiddlewareConfigActions = (bind: (configure: (context: IMiddleware) => Promise<any>) => void, update: (configure: (context: IMiddleware) => Promise<any>) => void) => void;
export default MiddlewareConfigActions;
