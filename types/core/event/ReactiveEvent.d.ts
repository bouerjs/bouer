import Reactive from "../reactive/Reactive";
declare type CallbackReactiveProperty = <TProperty, TObject>(reactive: Reactive<TProperty, TObject>) => void;
declare type ReactiveEventResult = {
    eventName: keyof ReactiveKeyEvents;
    callback: CallbackReactiveProperty;
    off: () => void;
};
interface ReactiveKeyEvents {
    BeforeGet: 'BeforeGet';
    BeforeSet: 'BeforeSet';
    AfterGet: 'AfterGet';
    AfterSet: 'AfterSet';
}
export default class ReactiveEvent {
    private static BeforeGet;
    private static AfterGet;
    private static BeforeSet;
    private static AfterSet;
    static on<TKey extends keyof ReactiveKeyEvents>(eventName: TKey, callback: CallbackReactiveProperty): ReactiveEventResult;
    static off<TKey extends keyof ReactiveKeyEvents>(eventName: TKey, callback: CallbackReactiveProperty): boolean;
    static once<TKey extends keyof ReactiveKeyEvents>(eventName: TKey, callback: (event: {
        onemit?: CallbackReactiveProperty;
    }) => void): void;
    static emit<TKey extends keyof ReactiveKeyEvents, TProperty, TObject>(eventName: TKey, reactive: Reactive<TProperty, TObject>): void;
}
export {};
