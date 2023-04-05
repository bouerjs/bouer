import dynamic from './Dynamic';

/**
 * Watch Callback
 * @param valueNew The new value
 * @param valueOld The old value
 * @param detail An object containing extra details, like the attached to a `node`
 */
type WatchCallback = <ValueNew, ValueOld>(valueNew: ValueNew, valueOld: ValueOld, detail?: dynamic) => void;

export default WatchCallback;