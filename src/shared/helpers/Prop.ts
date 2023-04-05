import Reactive from '../../core/reactive/Reactive';

export default class Prop {
  /**
   * Sets a property to an object
   * @param {object} obj the object to set the property
   * @param {string} propName the property name to be set
   * @param {object} descriptor the descriptor of the object
   * @returns the object with the new property
   */
  static set<T extends {}, TKey extends keyof T>(
    obj: T, propName: TKey, descriptor: PropertyDescriptor
  ) {
    Object.defineProperty(obj, propName, descriptor);
    return obj;
  }

  /**
   * Retrieves the descriptor of an property
   * @param {object} obj the object where the descriptor will be retrieved
   * @param {string} propName the property name
   * @returns the property descriptor or undefined
   */
  static descriptor<T extends {}, TKey extends keyof T>(obj: T, propName: TKey) {
    return Object.getOwnPropertyDescriptor(obj, propName);
  }

  /**
   * Makes a deep copy of a property from an object to another
   * @param {object} destination the destination object
   * @param {object} source the source object
   * @param {string} propName the property to be transfered
   */
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