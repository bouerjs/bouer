import Component from '../../core/component/Component';
import MiddlewareResult from '../../core/middleware/MiddlewareResult';
import Bouer from '../../instance/Bouer';
import CustomDirective from '../types/CustomDirective';
import IBouerConfig from './IBouerConfig';
import IComponentOptions from './IComponentOptions';
import IDelimiter from './IDelimiter';
import IMiddleware from './IMiddleware';

interface IBouerOptions<Data, GlobalData, Dependencies> {
  /** The data of the instance */
  readonly data?: Data,

  /** The data of the whole instance */
  readonly globalData?: GlobalData

  /** The configuration of the instance */
  readonly config?: IBouerConfig

  /** The components of the instance */
  readonly components?: (Component | IComponentOptions | (new (...args: any[]) => Component))[];

  /** The custom directives for this instance */
  readonly directives?: CustomDirective,

  /** The dependencies of the instance */
  readonly deps?: Dependencies,

  /** Appends delimiters to the instance */
  readonly delimiters?: IDelimiter[],

  /**
   * Middlewares that should be used in the application
   * @param configure Configures the middleware for a directive according to a specific action
   * @param app The application instance
   */
  middleware?(
    configure: (
      /** The directive to be applied */
      directive: string,
      /** The actions where it should be applied */
      actions: (
        /** Actions that will be performed on bind */
        onBind: (
          /** Configure an action to be called when the directive is bound */
          configure: (context: IMiddleware) => MiddlewareResult | Promise<MiddlewareResult>
        ) => void,
        /** Actions that will be performed on update */
        onUpdate: (
          /** Configure an action to be called when the directive is updated */
          configure: (context: IMiddleware) => MiddlewareResult | Promise<MiddlewareResult>
        ) => void
      ) => void) => void,
    app: Bouer
  ): void,

  /**
   * The hook that should be called before the component is loaded
   * @param event the called event object
   */
  beforeLoad?(event: CustomEvent): void;

  /**
   * The hook that should be called after the component is loaded (Compiled)
   * @param event the called event object
   */
  loaded?(event: CustomEvent): void;

  /**
   * The hook that should be called before the component is destroyed
   * @param event the called event object
   */
  beforeDestroy?(event: CustomEvent): void;

  /**
   * The hook that should be called after the component is destroyed
   * @param event the called event object
   */
  destroyed?(event: CustomEvent): void;
}

export default IBouerOptions;