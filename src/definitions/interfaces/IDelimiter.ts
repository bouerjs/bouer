interface IDelimiter {
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
  onUpdate?: (valueToSet: string, node: Node, data: object) => string,
}

export default IDelimiter;