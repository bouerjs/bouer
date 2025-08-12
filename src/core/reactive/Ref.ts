import Component from '../component/Component';
import Reactive from './Reactive';

export default class Ref<Type = any> {

  private readonly _IRT_? = true;
  private context?: Component;
  name?: string;
  value?: Type;

  constructor(value?: Type) {
    this.value = value;
    this.name = undefined as any;
    this.context = undefined as any;
  }

  get?() {
    return this.value;
  }

  set?(value: Type) {
    this.value = value;
  }

  __?(...args: any[]) {
    if (args.length == 0) return;

    this.name = args[0];
    this.context = args[1] as Component;

    if ( this.name == undefined || this.context == undefined)
      return;

    Reactive.transform({
      context: this.context,
      keys: ['value'],
      data: this
    });
  }
}