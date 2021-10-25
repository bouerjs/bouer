import Component from "../core/component/Component";
import ILifeCycleHooks from "./ILifeCycleHooks";

export default interface IComponent extends ILifeCycleHooks {
  /** The name of the component */
  name?: string

  /** The path of the component (required) */
  path?: string;

  /** The title that will be replaced when the page is loaded */
  title?: string;

  /** The navigation url */
  route?: string;

  /** The component html template [hard code component] */
  template?: string;

  /** The default data that will be injected in the component */
  data?: object;

  /** Allow the component the keep the last state */
  keepAlive?: boolean;

  /** The children of the component that will inherit the `route` of the father */
  children?: Array<IComponent>;

  /** restrictions of this component */
  restrictions?: Array<(compoment: Component) => boolean>;

  /** Allow to set this component as the `default page` when the application loads */
  isDefault?: boolean;

  /** Allow to set this component as the `not found page` when no route was found */
  isNotFound?: boolean;
}
