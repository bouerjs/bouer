import Component from "../core/component/Component";
import Bouer from "../core/instance/Bouer";
import IBouerConfig from "./IBouerConfig";
import IComponent from "./IComponent";

export default interface IBouer {
  /** The data of the instance */
  data?: object

  /** The data of the whole instance */
  globalData?: object

  /** The configuration of the instance */
  config?: IBouerConfig

  /** The compoment the will be loaded to the instance */
  components?: (IComponent | Component)[];

  /** The dependencies of the instance */
  dependencies?: any[]

  /** The hook that will be called before the component is mounted */
  beforeMount?(element: Element, bouer: Bouer): void;

  /** The hook that will be called after the component is mounted */
  mounted?(element: Element, bouer: Bouer): void;

  /** The hook that will be called before the component is loaded */
  beforeLoad?(element: Element, bouer: Bouer): void;

  /** The hook that will be called after the component is loaded (Compiled) */
  loaded?(element: Element, bouer: Bouer): void;

  /** The hook that will be called after the component is destroyed */
  destroyed?(element: Element, bouer: Bouer): void;
}
