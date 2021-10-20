import BouerEvent from "../core/event/BouerEvent";

export default interface ILifeCycleHooks {
  /** The hook that will be called when the component is requested */
  requested?: (event: BouerEvent) => void;

  /** The hook that will be called when the component is created */
  created?: (event: BouerEvent) => void;

  /** The hook that will be called before the component is mounted */
  beforeMount?: (event: BouerEvent) => void;

  /** The hook that will be called after the component is mounted */
  mounted?: (event: BouerEvent) => void;

  /** The hook that will be called before the component is loaded */
  beforeLoad?: (event: BouerEvent) => void;

  /** The hook that will be called after the component is loaded (Compiled) */
  loaded?: (event: BouerEvent) => void;

  /** The hook that will be called before the component is destroyed */
  beforeDestroy?: (event: BouerEvent) => void;

  /** The hook that will be called after the component is destroyed */
  destroyed?: (event: BouerEvent) => void;

  /** The hook that will be called after the component request is failed */
  failed?: (event: BouerEvent) => void;
}
