interface IEventModifiers {
  /**
   * Allow to mark the event to destroy in case of the node that where already removed and the event
   * is still alive
   */
  autodestroy?: boolean;
  /**
   * Allow to mark that the event will be dispatched to the registered listener before
   * being dispatched. Please check the link for better understanding:
   * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
   */
  capture?: boolean;
  /**
   * Allow to mark that the event will be dispatched only once. Please check the link for better understanding:
   * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
   */
  once?: boolean;
  /**
   * Allow to mark hat the function specified by listener will never call preventDefault().
   * Please check the link for better understanding:
   * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
   */
  passive?: boolean;
  /**
   * Allow to mark that the listener will be removed when the given AbortSignal object's abort() method is called.
   * Please check the link for better understanding:
   * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
   */
  signal?: AbortSignal;
}

export default IEventModifiers;