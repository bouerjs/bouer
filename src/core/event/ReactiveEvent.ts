import { buildError, forEach } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Reactive from "../reactive/Reactive";

type CallbackReactiveProperty = <TProperty, TObject>(
	reactive: Reactive<TProperty,
		TObject>) => void;


type ReactiveEventResult = {
	eventName: keyof ReactiveKeyEvents,
	callback: CallbackReactiveProperty,
	off: () => void
}

interface ReactiveKeyEvents {
	BeforeGet: 'BeforeGet',
	BeforeSet: 'BeforeSet',
	AfterGet: 'AfterGet',
	AfterSet: 'AfterSet',
}

export default class ReactiveEvent {
	private static BeforeGet: CallbackReactiveProperty[] = []
	private static AfterGet: CallbackReactiveProperty[] = []
	private static BeforeSet: CallbackReactiveProperty[] = []
	private static AfterSet: CallbackReactiveProperty[] = []

	static on<TKey extends keyof ReactiveKeyEvents>(
		eventName: TKey,
		callback: CallbackReactiveProperty
	): ReactiveEventResult {

		let array = ((this as any)[eventName]) as any[];
		array.push(callback);
		return {
			eventName: eventName,
			callback: callback,
			off: () => ReactiveEvent.off(eventName, callback)
		}
	}

	static off<TKey extends keyof ReactiveKeyEvents>(
		eventName: TKey,
		callback: CallbackReactiveProperty
	): boolean {
		let array = ((this as any)[eventName] as any[]);
		array.splice(array.indexOf(callback), 1);
		return true;
	}

	static once<TKey extends keyof ReactiveKeyEvents>(
		eventName: TKey,
		callback: (event: { onemit?: CallbackReactiveProperty }) => void
	): void {
		const event: { onemit?: CallbackReactiveProperty } = {}
		const mEvent = ReactiveEvent.on(eventName, (reactive: any) => {
			if (event.onemit) event.onemit(reactive);
		});
		try {
			callback(event);
		} catch (error) {
			Logger.error(buildError(error));
		} finally {
			ReactiveEvent.off(eventName, mEvent.callback);
		}
	}

	static emit<TKey extends keyof ReactiveKeyEvents, TProperty, TObject>(
		eventName: TKey,
		reactive: Reactive<TProperty, TObject>
	): void {
		try {
			forEach(((this as any)[eventName] as any[]), evt => evt(reactive));
		} catch (error) {
			Logger.error(buildError(error));
		}
	}
}
