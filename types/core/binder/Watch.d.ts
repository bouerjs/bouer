import WatchCallback from "../../definitions/types/WatchCallback";
import Reactive from "../reactive/Reactive";
export default class Watch<TValue, TObject> {
    property: string;
    node: Node | undefined;
    callback: WatchCallback;
    onDestroy?: () => void | undefined;
    private reactive;
    constructor(reactive: Reactive<TValue, TObject>, callback: WatchCallback, options?: {
        node?: Node;
        onDestroy?: () => void;
    });
    destroy: () => void;
}
