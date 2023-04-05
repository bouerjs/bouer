interface ILifeCycleHooks {
  /**
   * The hook that should be called when the component is requested
   * @param event the called event object
   */
  requested?(event: CustomEvent): void;

  /**
   * The hook that should be called when the component is created
   * @param event the called event object
   */
  created?(event: CustomEvent): void;

  /**
   * The hook that should be called before the component is mounted
   * @param event the called event object
   */
  beforeMount?(event: CustomEvent): void;

  /**
   * The hook that should be called after the component is mounted
   * @param event the called event object
   */
  mounted?(event: CustomEvent): void;

  /**
   * The hook that should be called before the component is loaded
   * @param event the called event object
   */
  beforeLoad?(event: CustomEvent): void;

  /**
   * The hook that should be called after the component is loaded (Compiled)
   * @param event the called event object
   */
  loaded?(event: CustomEvent): void;

  /**
   * The hook that should be called before the component is destroyed
   * @param event the called event object
   */
  beforeDestroy?(event: CustomEvent): void;

  /**
   * The hook that should be called after the component is destroyed
   * @param event the called event object
   */
  destroyed?(event: CustomEvent): void;

  /**
   * The hook that should be called when the component was blocked by restrictions
   * @param event the called event object
   */
  blocked?(event: CustomEvent): void;

  /**
   * The hook that should be called after the component request is failed
   * @param event the called event object
   */
  failed?(event: CustomEvent): void;
}

export default ILifeCycleHooks;