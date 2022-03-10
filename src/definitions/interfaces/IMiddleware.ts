import IBinderConfig from './IBinderConfig';
import dynamic from '../types/Dynamic';

interface IMiddleware<Detail = dynamic> {
  /** binder configuration of the directive */
  binder: IBinderConfig;

  /** some extra detail of the middleware config */
  detail: Detail;
}

export default IMiddleware;