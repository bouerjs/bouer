import dynamic from '../../definitions/types/Dynamic';
import Property from './Property';
import { $default, filter, isNull } from './Utils';

export default class Extend {
  /**
   * Combines different object into a new one
   * @param {object} args Objects to be combined
   * @returns A new object having the properties of all the objects
   */
  static obj<T extends dynamic = dynamic>(...args: T[]) {
    const out: dynamic = {};

    filter(args, arg => {
      if (isNull(arg)) return;
      filter(Object.keys(arg), key => {
        Property.transfer(out, arg, key);
      });
    });

    return out as T;
  }

  /**
   * Adds properties to the first object provided
   * @param {object} out the object that should be added all the properties from the other one
   * @param {object} args the objects where the properties should be extracted from
   * @returns the first object with all the new properties added on
   */
  static mixin<OutType extends dynamic = dynamic, InType extends dynamic = any>(
    out: OutType, ...args: InType[]
  ) {
    // Props to mix with out object
    const props = Extend.obj.apply({}, args) as any;

    filter(Object.keys(props), key => {
      const hasOwnProp = key in out;
      Property.transfer(out, props, key);

      if (hasOwnProp) {
        const mOut = out as any;
        mOut[key] = $default(mOut[key]);
      }
    });

    return out as OutType & InType;
  }

  /**
   * Combines different arrays into a new one
   * @param {object} args arrays to be combined
   * @returns a new arrat having the items of all the arrays
   */
  static array<T extends any[] = any[]>(...args: T[]) {
    const out: T[] = [];
    filter(args, arg => {
      if (isNull(arg)) return;

      if (!Array.isArray(arg))
        return out.push(arg);

      filter(Object.keys(arg), (key: any) => {
        const value = arg[key];
        if (isNull(value))
          return;

        if (Array.isArray(value))
          [].push.apply(out, value as never[]);
        else
          out.push(value);
      });
    });
    return out as T;
  }

  /**
   * transfers the props of first object to the second and the seconds to the first
   * @param {object} t1 the first object
   * @param {object} t2 the second object
   */
  static matcher<T1 extends dynamic = dynamic, T2 extends dynamic = any>(
    t1: T1, t2: T2
  ) {

    const exec = (src: any, dst: any) => {
      filter(Object.keys(src), key => {
        if (key in dst) return;

        const hasOwnProp = key in src;
        Property.transfer(dst, src, key);
        if (hasOwnProp) {
          src[key] = $default(src[key]);
        }
      });
    };

    exec(t1, t2);
    exec(t2, t1);
  }
}