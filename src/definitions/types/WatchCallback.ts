import dynamic from "./Dynamic";

type WatchCallback = <ValueNew, ValueOld>(valueNew: ValueNew, valueOld: ValueOld, detail?: dynamic) => void;

export default WatchCallback;