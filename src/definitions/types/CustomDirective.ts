import IBinderConfig from '../interfaces/IBinderConfig';

type CustomDirective = {
  [key: string]: {
    /** Allow to remove the directive after the bind */
    removable?: boolean,
    /**
     * An action that will be performed on bind
     * @param {Node} node the node attached to the process
     * @param {object} bindConfig the binder configuration
     * @returns
     *  - if the method returns `true` it will end the compiler process of the node
     *  - if the method returns `false` it will continue the compiler process of the node
     *  - if `null` or `void` it will assume as `false`
     */
    onBind?: (node: Node, bindConfig: IBinderConfig) => boolean | undefined,
    /**
     * An action that will be performed on unbind
     * @param {Node} node the node attached to the process
     * @param {object} bindConfig the binder configuration
     */
    onUnbind?: (node: Node, bindConfig: IBinderConfig) => void,
    /**
     * An action that will be performed on value update
     * @param {Node} node the node attached to the process
     * @param {object} bindConfig the binder configuration
     */
    onUpdate?: (node: Node, bindConfig: IBinderConfig) => void,
  }
};

export default CustomDirective;