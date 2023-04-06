import WatchCallback from '../../definitions/types/WatchCallback';
import Reactive from '../reactive/Reactive';

export default class Watch<Value, TObject> {
  /** the property name being watched */
  readonly property: string;
  /** the node attached to the watch */
  readonly node: Node | undefined;
  /** Reactive object containing all the reative logic */
  readonly reactive: Reactive<Value, TObject>;
  /** the callback that needs to be performed when there is a change */
  readonly callback: WatchCallback;
  /** an action that needs to be performed when this watch instance is destroyed */
  readonly onDestroy?: () => void | undefined;

  /**
   * Default constructor
   * @param {object} reactive the reactive descriptor instance
   * @param {Function} callback the callback that will be called on change
   * @param {object?} options watch options where the node and onDestroy function are provided
   */
  constructor(reactive: Reactive<Value, TObject>, callback: WatchCallback, options?: {
    node?: Node,
    onDestroy?: () => void
  }) {
    this.reactive = reactive;
    this.property = reactive.propName;
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
    const indexOfThis = this.reactive.watches.indexOf(this);
    if (indexOfThis !== -1)
      this.reactive.watches.splice(indexOfThis, 1);
    (this.onDestroy || (() => {}))();
  };
}
