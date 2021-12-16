export default interface IDelimiter {
  /** The name of the delimiter */
  name: string,
  /** The delimiter structure */
  delimiter: {
    /** The open syntax */
    open: string,
    /** The close syntax */
    close: string
  },
	/** fires when the element updates */
  update?: (valueToSet: string, node: Node, data: object) => string,
}
