type Delimiter = {
  /** The name of the delimiter */
  name: string,
  /** The delimiter structure */
  delimiter: {
    /** The open syntax */
    open: string,
    /** The close syntax */
    close: string
  },
  action?: (valueToSet: string, node: Node, data: object) => string
}
export default Delimiter;
