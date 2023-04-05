interface MiddlewareResult<T = any> {
  /** The data that will be used in the directive */
  data: T,
  /** An additional fields */
  [key: string]: any
}

export default MiddlewareResult;