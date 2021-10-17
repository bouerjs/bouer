export default class Observer {
  /**
   * Element Observer
   * @param element the target element to be observe
   * @param callback the callback that will fired when the element changes
   */
  static observe(element: Element, callback: (options: {
    element: Element,
    mutation: MutationObserver,
    records: MutationRecord[],
  }) => void) {

    const mutation = new MutationObserver(records => {
      callback({
        element: element,
        mutation: mutation,
        records: records
      })
    });

    mutation.observe(element, { childList: true });
  }
}
