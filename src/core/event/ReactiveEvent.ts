import { buildError, forEach, isNull } from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Reactive from '../reactive/Reactive';

type CallbackReactiveProperty = <TProperty, TObject>(
  descriptor: Reactive<TProperty, TObject>
) => void;


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
  private static events: { [key: string]: CallbackReactiveProperty[] } = {};

  static on<TKey extends keyof ReactiveKeyEvents>(
    eventName: TKey,
    callback: CallbackReactiveProperty
  ): ReactiveEventResult {
    if (isNull(this.events[eventName]))
      this.events[eventName] = [];

    this.events[eventName].push(callback);

    return {
      eventName: eventName,
      callback: callback,
      off: () => ReactiveEvent.off(eventName, callback)
    };
  }

  static off<TKey extends keyof ReactiveKeyEvents>(
    eventName: TKey,
    callback: CallbackReactiveProperty
  ): boolean {
    const events = this.events[eventName] || [];
    events.splice(events.indexOf(callback), 1);
    return true;
  }

  static once<TKey extends keyof ReactiveKeyEvents>(
    eventName: TKey,
    callback: (event: { onemit?: CallbackReactiveProperty }) => void
  ): void {
    const event: { onemit?: CallbackReactiveProperty } = {};
    const mEvent = ReactiveEvent.on(eventName, (descriptor: any) => {
      if (event.onemit) event.onemit(descriptor);
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
    descriptor: Reactive<TProperty, TObject>
  ): void {
    try {
      forEach((this.events[eventName] || []), evt => evt(descriptor));
    } catch (error) {
      Logger.error(buildError(error));
    }
  }
}
