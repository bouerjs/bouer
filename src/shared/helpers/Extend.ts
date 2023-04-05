import dynamic from '../../definitions/types/Dynamic';
import Prop from './Prop';
import { fnEmpty, forEach, isNull } from './Utils';

export default class Extend {
  /**
   * Combines different object into a new one
   * @param {object} args Objects to be combined
   * @returns A new object having the properties of all the objects
   */
  static obj<ExtendObjectType extends dynamic = dynamic>(...args: ExtendObjectType[]) {
    const out: dynamic = {};

    forEach(args, arg => {
      if (isNull(arg)) return;
      forEach(Object.keys(arg), key => {
        Prop.transfer(out, arg, key);
      });
    });

    return out as dynamic;
  }

  /**
   * Adds properties to the first object provided
   * @param {object} out the object that should be added all the properties from the other one
   * @param {object} args the objects where the properties should be extracted from
   * @returns the first object with all the new properties added on
   */
  static mixin<MixinObjectType extends dynamic = dynamic>(out: MixinObjectType, ...args: object[]) {
    // Props to mix with out object
    const props = Extend.obj.apply(this, args) as any;
    forEach(Object.keys(props), key => {
      const hasOwnProp = key in out;
      Prop.transfer(out, props, key);

      if (hasOwnProp) {
        const mOut = out as any;
        mOut[key] = fnEmpty(mOut[key]);
      }
    });

    return out as MixinObjectType;
  }

  /**
   * Combines different arrays into a new one
   * @param {object} args arrays to be combined
   * @returns a new arrat having the items of all the arrays
   */
  static array<ExtendArrayObjectType = any>(...args: Array<ExtendArrayObjectType>) {
    const out: any[] = [];
    forEach(args, arg => {
      if (isNull(arg)) return;

      if (!Array.isArray(arg))
        return out.push(arg);

      forEach(Object.keys(arg), (key: any) => {
        const value = arg[key];
        if (isNull(value))
          return;

        if (Array.isArray(value))
          [].push.apply(out, value as never[]);
        else
          out.push(value);
      });
    });
    return out;
  }
}
