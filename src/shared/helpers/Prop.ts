import ReactivePropertyDescriptor from '../../core/reactive/Reactive';
import dynamic from '../../definitions/types/Dynamic';

export default class Prop {
  /**
   * Sets a property to an object
   * @param {object} obj the object to set the property
   * @param {string} propName the property name to be set
   * @param {object} descriptor the descriptor of the object
   * @returns the object with the new property
   */
  static set<T extends dynamic>(
    obj: T, propName: keyof T | string, descriptor: PropertyDescriptor
  ) {
    const destinationDescriptor = Prop.descriptor(obj, propName);

    if (
        (descriptor instanceof ReactivePropertyDescriptor || !('value' in descriptor)) &&
        destinationDescriptor == descriptor
      )
      return; // Ignores if the descriptor is the same

    const _obj = (obj as any);
    // If the property is not defined
    if (!(propName in _obj)) _obj[propName] = undefined;
    return Object.defineProperty(obj, propName, descriptor);
  }

  /**
   * Retrieves the descriptor of an property
   * @param {object} obj the object where the descriptor will be retrieved
   * @param {string} propName the property name
   * @returns the property descriptor or undefined
   */
  static descriptor<T extends {}>(obj: T, propName: keyof T) {
    return Object.getOwnPropertyDescriptor(obj, propName);
  }

  /**
   * Makes a deep copy of a property from an object to another
   * @param {object} destination the destination object
   * @param {object} source the source object
   * @param {string} propName the property to be transfered
   */
  static transfer<Source extends dynamic, Destination extends dynamic>(
    destination: Destination,
    source: Source,
    propName: keyof Source | string[]
  ) {
    const setter = (prop: string) => {
      const descriptor = this.descriptor(source, prop) as ReactivePropertyDescriptor<any, Source>;
      this.set(destination, propName as any, descriptor);
    };

    if (Array.isArray(propName)) {
      propName.forEach(prop => setter(prop));
      return;
    }

    setter(propName as string);
  }
};