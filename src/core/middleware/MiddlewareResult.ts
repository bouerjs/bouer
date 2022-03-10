interface MiddlewareResult<T = any> {
  data: T
  [key: string]: any
}

export default MiddlewareResult;