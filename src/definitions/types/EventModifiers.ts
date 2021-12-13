type EventModifiers = {
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
	signal?: AbortSignal;
}

export default EventModifiers;