import Reactive from "../reactive/Reactive";

export type CallbackWatch = <TNewValue, TOldValue>(newValue: TNewValue, oldValue: TOldValue) => void;

export default class Watch<TValue, TObject> {
  property: string;
  node: Node | undefined;
  callback: CallbackWatch;
  onDestroy?: () => void | undefined;

  private reactive: Reactive<TValue, TObject>;

  constructor(reactive: Reactive<TValue, TObject>, callback: CallbackWatch, options?: {
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
