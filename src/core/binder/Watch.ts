import WatchCallback from "../../definitions/types/WatchCallback";
import Reactive from "../reactive/Reactive";

export default class Watch<Value, TObject> {
  readonly property: string;
  readonly node: Node | undefined;
  readonly reactive: Reactive<Value, TObject>;
  readonly callback: WatchCallback;
  readonly onDestroy?: () => void | undefined;


  constructor(reactive: Reactive<Value, TObject>, callback: WatchCallback, options?: {
    node?: Node,
    onDestroy?: () => void
  }) {
    this.reactive = reactive;
    this.property = reactive.propertyName;
    this.callback = callback;

    if (options) {
      this.node = options.node;
      this.onDestroy = options.onDestroy;
    }
  }

  destroy = () => {
    const indexOfThis = this.reactive.watches.indexOf(this);
    if (indexOfThis !== -1)
      this.reactive.watches.splice(indexOfThis, 1);
    if (this.onDestroy) this.onDestroy();
  }
}
