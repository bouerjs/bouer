import Component from "../core/component/Component";
import Bouer from "../core/instance/Bouer";
import customDirective from "./customDirective";
import dynamic from "./dynamic";
import IBouerConfig from "./IBouerConfig";
import IComponent from "./IComponent";
import IInterceptor from "./IInterceptor";

export default interface IBouer {
  /** The data of the instance */
  data?: object

  /** The data of the whole instance */
  globalData?: object

  /** The configuration of the instance */
  config?: IBouerConfig

  /** The compoment the will be loaded to the instance */
  components?: (IComponent | Component)[];

  /** The custum directives for this instance */
  directives?: customDirective,

  /** The dependencies of the instance */
  dependencies?: dynamic,

  // /** Appends delimiters to the instance */
  // delimiters?: delimiter[],

  /** Middlewares that will be used in the application */
  interceptor?: (
    intercept: (
      action: string,
      callback: (context: IInterceptor) => void
    ) => void,
    app: Bouer
  ) => void;

  /** The hook that will be called before the component is loaded */
  beforeLoad?(event: CustomEvent): void;

  /** The hook that will be called after the component is loaded (Compiled) */
  loaded?(event: CustomEvent): void;

  /** The hook that will be called after the component is destroyed */
  destroyed?(event: CustomEvent): void;
}
