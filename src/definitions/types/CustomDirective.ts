import IBinderConfig from "../interfaces/IBinderConfig";

type CustomDirective = {
  [key: string]: {
    /** Allow to remove the directive after the bind */
    removable?: boolean,
    bind?: (node: Node, bindConfig: IBinderConfig) => boolean | undefined,
		unbind?: (node: Node, bindConfig: IBinderConfig) => void,
    update?: (node: Node, bindConfig: IBinderConfig) => void,
  }
};

export default CustomDirective;