export default interface IEventModifiers {
	autodestroy?: boolean;
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
	signal?: AbortSignal;
}