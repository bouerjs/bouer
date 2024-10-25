import Component from '../../core/component/Component';
import { MiddlewareConfigType } from '../../core/middleware/Middleware';
import Bouer from '../../instance/Bouer';
import Constructor from '../types/Constructor';
import CustomDirective from '../types/CustomDirective';
import DataType from '../types/DataType';
import IBouerConfig from './IBouerConfig';
import IComponentOptions from './IComponentOptions';
import IDelimiter from './IDelimiter';

interface IBouerOptions<
  Data extends {} = {},
  Global extends {} = {},
  Deps extends {} = {}
> {
  /** The data of the instance */
  readonly data?: DataType<Data, Bouer>,

  /** The data of the whole instance */
  readonly globalData?: DataType<Global, Bouer>

  /** The configuration of the instance */
  readonly config?: IBouerConfig

  /** The components of the instance */
  readonly components?: (Component | IComponentOptions | Constructor<Component>)[];

  /** The custom directives for this instance */
  readonly directives?: CustomDirective,

  /** The dependencies of the instance */
  readonly deps?: DataType<Deps, Bouer>;

  /** Appends delimiters to the instance */
  readonly delimiters?: IDelimiter[],

  /**
   * Middlewares that should be used in the application
   * @param subscribe subscribes a middleware for a directive according to a specific action
   * @param app the application instance
   */
  middleware?(
    this: Bouer,
    subscribe: (
      this: Bouer,
      /** The directive to be applied */
      directive: string,
      /** The actions where it should be applied */
      actions: (
        /** Actions that will be performed on bind */
        onBind: MiddlewareConfigType,
        /** Actions that will be performed on update */
        onUpdate: MiddlewareConfigType
      ) => void) => void,
    app: Bouer
  ): void,

  /**
   * The hook that should be called before the component is loaded
   * @param event the called event object
   */
  beforeLoad?(this: Bouer, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is loaded (Compiled)
   * @param event the called event object
   */
  loaded?(this: Bouer, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is destroyed
   * @param event the called event object
   */
  beforeDestroy?(this: Bouer, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is destroyed
   * @param event the called event object
   */
  destroyed?(this: Bouer, event: CustomEvent): void;
}

export default IBouerOptions;