import ComponentPrototype from '../../core/component/Component';

interface ILifeCycleHooks {
  /**
   * The hook that should be called when the component is requested
   * @param event the called event object
   */
  requested?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called when the component is created
   * @param event the called event object
   */
  created?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is mounted
   * @param event the called event object
   */
  beforeMount?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is mounted
   * @param event the called event object
   */
  mounted?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is loaded
   * @param event the called event object
   */
  beforeLoad?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is loaded (Compiled)
   * @param event the called event object
   */
  loaded?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is destroyed
   * @param event the called event object
   */
  beforeDestroy?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is destroyed
   * @param event the called event object
   */
  destroyed?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called when the component was blocked by restrictions
   * @param event the called event object
   */
  blocked?(this: ComponentPrototype, event: CustomEvent): void;

  /**
   * The hook that should be called after the component request is failed
   * @param event the called event object
   */
  failed?(this: ComponentPrototype, event: CustomEvent): void;
}

export default ILifeCycleHooks;