import IMiddlewareResult from '../../core/middleware/IMiddlewareResult';
import Bouer from '../../instance/Bouer';
import IMiddleware from './IMiddleware';

interface IMiddlewareObject {
  onBind?: (this: Bouer, context: IMiddleware, next: () => void) => IMiddlewareResult | Promise<IMiddlewareResult>,
  onUpdate?: (this: Bouer, context: IMiddleware, next: () => void) => IMiddlewareResult | Promise<IMiddlewareResult>
}

export default IMiddlewareObject;