export default interface MiddlewareResult<T = any> {
	data: T,
	[key: string]: any
}