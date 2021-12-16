export default interface IEventModifiers {
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
	signal?: AbortSignal;
}