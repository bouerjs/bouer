export default interface ILifeCycleHooks {
  /** The hook that should be called when the component was blocked by restrictions */
  blocked?: (event: CustomEvent) => void;

  /** The hook that should be called when the component is requested */
  requested?: (event: CustomEvent) => void;

  /** The hook that should be called when the component is created */
  created?: (event: CustomEvent) => void;

  /** The hook that should be called before the component is mounted */
  beforeMount?: (event: CustomEvent) => void;

  /** The hook that should be called after the component is mounted */
  mounted?: (event: CustomEvent) => void;

  /** The hook that should be called before the component is loaded */
  beforeLoad?: (event: CustomEvent) => void;

  /** The hook that should be called after the component is loaded (Compiled) */
  loaded?: (event: CustomEvent) => void;

  /** The hook that should be called before the component is destroyed */
  beforeDestroy?: (event: CustomEvent) => void;

  /** The hook that should be called after the component is destroyed */
  destroyed?: (event: CustomEvent) => void;

  /** The hook that should be called after the component request is failed */
  failed?: (event: CustomEvent) => void;
}