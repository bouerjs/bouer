import Reactive from '../../core/reactive/Reactive';

export default class Prop {
  static set<T extends {}>(obj: T, propName: string, descriptor: PropertyDescriptor) {
    Object.defineProperty(obj, propName, descriptor);
    return obj;
  }

  static descriptor<T extends {}>(obj: T, propName: string) {
    return Object.getOwnPropertyDescriptor(obj, propName);
  }

  static transfer<Source extends {}, Destination extends {}>(
    destination: Source,
    source: Destination,
    propName: string
  ) {
    const descriptor = Prop.descriptor(source, propName) as Reactive<any, Source>;
    const mDst = (destination as any);
    if (!(propName in destination))
      mDst[propName] = undefined;

    Prop.set(destination, propName, descriptor);
  }
}