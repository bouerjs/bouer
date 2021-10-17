import Bouer from "../Bouer";
import Component from "../core/component/Component";

export type ComponentDefinition = Array<{ name: string, path: string }> | Array<Component>

export default interface IComponent {
  /** The name of the component */
  name: string

  /** The path of the component (required) */
  path: string;

  /** The title that will be replaced when the page is loaded */
  title?: string;

  /** The navigation url */
  route?: string;

  /** The component html template [hard code component] */
  template?: string;

  /** The default data that will be injected in the component */
  data?: object;

  /** The children of the component that will inherit the `route` of the father */
  children?: Array<Element>;

  /** restrictions of this component */
  restrictions?: Array<(compoment: Component) => boolean>;

  /** The hook that will be called when the component is requested */
  requested?: (bouer: Bouer) => void;

  /** The hook that will be called before the component is mounted */
  beforeMount?: (bouer: Bouer) => void;

  /** The hook that will be called after the component is mounted */
  mounted?: (bouer: Bouer) => void;

  /** The hook that will be called before the component is loaded */
  beforeLoad?: (bouer: Bouer) => void;

  /** The hook that will be called after the component is loaded (Compiled) */
  loaded?: (bouer: Bouer) => void;

  /** The hook that will be called before the component is destroyed */
  beforeDestroy?: (bouer: Bouer) => void;

  /** The hook that will be called after the component is destroyed */
  destroyed?: (bouer: Bouer) => void;

  /** The hook that will be called after the component request is failed */
  failed?: (bouer: Bouer) => void;
}
