import Bouer from "../../Bouer";
import IComponent from "../../types/IComponent";

export default class Component implements IComponent {
  name: string
  path: string;
  title?: string;
  route?: string;
  template?: string;
  data?: object;
  children?: Array<Element>;

  /** The anchors attached to this component */
  private links?: Array<HTMLAnchorElement>;

  constructor(options: IComponent) {
    this.name = options.name;
    this.path = options.path;
    Object.assign(this, options);
  }

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
