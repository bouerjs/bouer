import { forEach } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Reactive from "../reactive/Reactive";

type CallbackReactiveProperty = <TProperty, TObject>(reactive: Reactive<TProperty, TObject>) => void;
type CallbackReactiveArray = <TProperty, TObject>(reactive: Reactive<TProperty, TObject>, method: string, options: { arrayNew: any[]; arrayOld: any[]; }) => void;

interface ReactivePropertyEvents {
  BeforeGet: 'BeforeGet',
  BeforeSet: 'BeforeSet',
  AfterGet: 'AfterGet',
  AfterSet: 'AfterSet',
}

interface ReactiveArrayEvents {
  BeforeArrayChanges: 'BeforeArrayChanges',
  AfterArrayChanges: 'AfterArrayChanges',
}

type ReactiveEventResult<TCallback> = {
  eventName: keyof ReactiveArrayEvents,
  callback: TCallback,
}

export default class ReactiveEvent {
  private static BeforeGet: CallbackReactiveProperty[] = []
  private static AfterGet: CallbackReactiveProperty[] = []
  private static BeforeSet: CallbackReactiveProperty[] = []
  private static AfterSet: CallbackReactiveProperty[] = []

  private static BeforeArrayChanges: CallbackReactiveArray[] = []
  private static AfterArrayChanges: CallbackReactiveArray[] = []

  static on<TKey extends keyof ReactivePropertyEvents>(
    eventName: TKey,
    callback: CallbackReactiveProperty
  ): ReactiveEventResult<CallbackReactiveProperty>;
  static on<TKey extends keyof ReactiveArrayEvents>(
    eventName: TKey,
    callback: CallbackReactiveArray,
  ): ReactiveEventResult<CallbackReactiveArray>;
  static on(
    eventName: any,
    callback: any
  ): ReactiveEventResult<CallbackReactiveProperty> | ReactiveEventResult<CallbackReactiveArray> {
    let array = ((this as any)[eventName]) as any[];
    array.push(callback);
    return {
      eventName,
      callback
    }
  }

  static off<TKey extends keyof ReactivePropertyEvents>(
    eventName: TKey,
    callback: CallbackReactiveProperty
  ): ReactiveEventResult<CallbackReactiveProperty>;
  static off<TKey extends keyof ReactiveArrayEvents>(
    eventName: TKey,
    callback: CallbackReactiveArray
  ): ReactiveEventResult<CallbackReactiveArray>;
  static off(
    eventName: any,
    callback: any
  ): ReactiveEventResult<CallbackReactiveProperty> | ReactiveEventResult<CallbackReactiveArray> {
    let array = ((this as any)[eventName] as any[]);
    array.splice(array.indexOf(callback), 1);
    return {
      eventName,
      callback
    }
  }

  static emit<TKey extends keyof ReactivePropertyEvents, TProperty, TObject>(
    eventName: TKey,
    reactive: Reactive<TProperty, TObject>
  ): void;
  static emit<TKey extends keyof ReactiveArrayEvents, TProperty, TObject>(
    eventName: TKey,
    reactive: Reactive<TProperty, TObject>,
    method: string,
    options: { arrayNew: any[]; arrayOld: any[]; }
  ): void;
  static emit(eventName: any, reactive: any, method?: any, options?: any): void {
    try {
      forEach(((this as any)[eventName] as any[]), evt => evt(reactive, method, options));
    } catch (error: any) {
      error.stack = '';
      Logger.error(error);
    }
  }
}
