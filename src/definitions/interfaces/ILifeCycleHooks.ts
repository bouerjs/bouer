import Component from '../../core/component/Component';
import dynamic from '../types/Dynamic';

interface ILifeCycleHooks<Data extends {} = dynamic> {
  /**
   * The hook that should be called when the component is requested
   * @param event the called event object
   */
  requested?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called when the component is created
   * @param event the called event object
   */
  created?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is mounted
   * @param event the called event object
   */
  beforeMount?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is mounted
   * @param event the called event object
   */
  mounted?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is loaded
   * @param event the called event object
   */
  beforeLoad?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is loaded (Compiled)
   * @param event the called event object
   */
  loaded?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called before the component is destroyed
   * @param event the called event object
   */
  beforeDestroy?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called after the component is destroyed
   * @param event the called event object
   */
  destroyed?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called when the component was blocked by restrictions
   * @param event the called event object
   */
  blocked?(this: Component<Data>, event: CustomEvent): void;

  /**
   * The hook that should be called after the component request is failed
   * @param event the called event object
   */
  failed?(this: Component<Data>, event: CustomEvent): void;
}

export default ILifeCycleHooks;