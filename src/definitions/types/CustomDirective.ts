import IBinderConfig from '../interfaces/IBinderConfig';

type CustomDirective = {
  [key: string]: {
    /** Allow to remove the directive after the bind */
    removable?: boolean,
    onBind?: (node: Node, bindConfig: IBinderConfig) => boolean | undefined,
    onUnbind?: (node: Node, bindConfig: IBinderConfig) => void,
    onUpdate?: (node: Node, bindConfig: IBinderConfig) => void,
  }
};

export default CustomDirective;