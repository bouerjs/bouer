import MiddlewareResult from '../../core/middleware/MiddlewareResult';
import IMiddleware from './IMiddleware';

interface IMiddlewareObject {
  onBind?: (context: IMiddleware, next: () => void) => MiddlewareResult | Promise<MiddlewareResult>,
  onUpdate?: (context: IMiddleware, next: () => void) => MiddlewareResult | Promise<MiddlewareResult>
}

export default IMiddlewareObject;