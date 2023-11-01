import Component from '../../core/component/Component';
import IMiddlewareResult from '../../core/middleware/IMiddlewareResult';
import Bouer from '../../instance/Bouer';
import CustomDirective from '../types/CustomDirective';
import IBouerConfig from './IBouerConfig';
import IComponentOptions from './IComponentOptions';
import IDelimiter from './IDelimiter';
import IMiddleware from './IMiddleware';
import DataType from '../types/DataType';
import dynamic from '../types/Dynamic';


interface IBouerOptions<Data extends dynamic, GlobalData extends dynamic, Dependencies extends dynamic> {
  /** The data of the instance */
  readonly data?: DataType<Data, Bouer<Data, GlobalData, Dependencies>>,

  /** The data of the whole instance */
  readonly globalData?: DataType<GlobalData, Bouer<Data, GlobalData, Dependencies>>

  /** The configuration of the instance */
  readonly config?: IBouerConfig

  /** The components of the instance */
  readonly components?: (Component | IComponentOptions | (new (...args: any[]) => Component))[];

  /** The custom directives for this instance */
  readonly directives?: CustomDirective,

  /** The dependencies of the instance */
  readonly deps?: Dependencies;

  /** Appends delimiters to the instance */
  readonly delimiters?: IDelimiter[],

  /**
   * Middlewares that should be used in the application
   * @param subscribe subscribes a middleware for a directive according to a specific action
   * @param app the application instance
   */
  middleware?(
    this: Bouer<Data, GlobalData, Dependencies>,
    subscribe: (
      this: Bouer<Data, GlobalData, Dependencies>,
      /** The directive to be applied */
      directive: string,
      /** The actions where it should be applied */
      actions: (
        /** Actions that will be performed on bind */
        onBind: (
          /** Configure an action to be called when the directive is bound */
          configure: (
            this: Bouer<Data, GlobalData, Dependencies>,
            context: IMiddleware
          ) => IMiddlewareResult | Promise<IMiddlewareResult>
        ) => void,
        /** Actions that will be performed on update */
        onUpdate: (
          /** Configure an action to be called when the directive is updated */
          configure: (
            this: Bouer<Data, GlobalData, Dependencies>,
            context: IMiddleware
          ) => IMiddlewareResult | Promise<IMiddlewareResult>
        ) => void
      ) => void) => void,
    app: Bouer
  ): void,

  /**
   * The hook that should be called before the component is loaded
   * @param event the called event object
   */
  beforeLoad?(this: Bouer<Data, GlobalData, Dependencies>, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is loaded (Compiled)
   * @param event the called event object
   */
  loaded?(this: Bouer<Data, GlobalData, Dependencies>, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is destroyed
   * @param event the called event object
   */
  beforeDestroy?(this: Bouer<Data, GlobalData, Dependencies>, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is destroyed
   * @param event the called event object
   */
  destroyed?(this: Bouer<Data, GlobalData, Dependencies>, event: CustomEvent): void;
}

export default IBouerOptions;