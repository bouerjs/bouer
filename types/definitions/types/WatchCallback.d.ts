declare type WatchCallback = <TNewValue, TOldValue>(newValue: TNewValue, oldValue: TOldValue) => void;
export default WatchCallback;
