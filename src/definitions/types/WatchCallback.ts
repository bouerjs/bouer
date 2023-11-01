import dynamic from './Dynamic';
import RenderContext from './RenderContext';

/**
 * Watch Callback
 * @param valueNew The new value
 * @param valueOld The old value
 * @param detail An object containing extra details, like the attached to a `node`
 */
type WatchCallback<V = any> = (
  this: RenderContext, valueNew: V, valueOld: V | undefined, detail?: dynamic
) => void;

export default WatchCallback;