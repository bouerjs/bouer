import { BinderConfig } from "../core/binder/Binder";

type customDirective = {
  [key: string]: {
    /** Allow to remove the directive after the binding */
    removable?: boolean,
    bind?: (node: Node, bindConfig: BinderConfig) => boolean | undefined,
    updated?: (node: Node, bindConfig: BinderConfig) => void
  }
};

export default customDirective;
