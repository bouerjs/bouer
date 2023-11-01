import WatchCallback from '../../definitions/types/WatchCallback';
import Reactive from '../reactive/Reactive';

export default class Watch<V, O> {
  /** the property name being watched */
  readonly property: string;
  /** the node attached to the watch */
  readonly node: Node | undefined;
  /** Reactive object containing all the reative logic */
  readonly descriptor: Reactive<V, O>;
  /** the callback that needs to be performed when there is a change */
  readonly callback: WatchCallback<V>;
  /** an action that needs to be performed when this watch instance is destroyed */
  readonly onDestroy?: () => void | undefined;

  /**
   * Default constructor
   * @param {object} descriptor the reactive descriptor instance
   * @param {Function} callback the callback that will be called on change
   * @param {object?} options watch options where the node and onDestroy function are provided
   */
  constructor(descriptor: Reactive<V, O>, callback: WatchCallback<V>, options?: {
    node?: Node,
    onDestroy?: () => void
  }) {
    this.descriptor = descriptor;
    this.property = descriptor.propName;
    this.callback = callback;

    if (options) {
      this.node = options.node;
      this.onDestroy = options.onDestroy;
    }
  }

  /**
   * Destroys/Stop the watching process
   */
  destroy = () => {
    const watchIndex = this.descriptor.watches.indexOf(this);
    if (watchIndex !== -1)
      this.descriptor.watches.splice(watchIndex, 1);
    (this.onDestroy || (() => {}))();
  };
}
