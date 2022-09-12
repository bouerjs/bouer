import Reactive from '../../core/reactive/Reactive';

export default class Prop {
  static set<T extends {}, TKey extends keyof T>(
    obj: T, propName: TKey, descriptor: PropertyDescriptor
  ) {
    Object.defineProperty(obj, propName, descriptor);
    return obj;
  }

  static descriptor<T extends {}, TKey extends keyof T>(obj: T, propName: TKey) {
    return Object.getOwnPropertyDescriptor(obj, propName);
  }

  static transfer<Source extends {}, Destination extends {}, TKey extends keyof Source>(
    destination: Destination,
    source: Source,
    propName: TKey
  ) {
    const descriptor = Prop.descriptor(source, propName) as Reactive<any, Source>;
    const mDst = (destination as any);
    if (!(propName in destination))
      mDst[propName] = undefined;

    Prop.set(destination, propName as any, descriptor);
  }
}