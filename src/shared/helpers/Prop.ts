import Reactive from '../../core/reactive/Reactive';
import dynamic from '../../definitions/types/Dynamic';

export default (function Prop() {
  return {
    /**
     * Sets a property to an object
     * @param {object} obj the object to set the property
     * @param {string} propName the property name to be set
     * @param {object} descriptor the descriptor of the object
     * @returns the object with the new property
     */
    set<T extends dynamic>(
      obj: T, propName: keyof T | string, descriptor: PropertyDescriptor
    ) {
      return Object.defineProperty(obj, propName, descriptor);
    },

    /**
     * Retrieves the descriptor of an property
     * @param {object} obj the object where the descriptor will be retrieved
     * @param {string} propName the property name
     * @returns the property descriptor or undefined
     */
    descriptor<T extends {}>(obj: T, propName: keyof T) {
      return Object.getOwnPropertyDescriptor(obj, propName);
    },

    /**
     * Makes a deep copy of a property from an object to another
     * @param {object} destination the destination object
     * @param {object} source the source object
     * @param {string} propName the property to be transfered
     */
    transfer<Source extends dynamic, Destination extends dynamic>(
      destination: Destination,
      source: Source,
      propName: keyof Source
    ) {
      const descriptor = this.descriptor(source, propName) as Reactive<any, Source>;
      const mDst = (destination as any);
      if (!(propName in destination))
        mDst[propName] = undefined;

      this.set(destination, propName as any, descriptor);
    }
  };
})();