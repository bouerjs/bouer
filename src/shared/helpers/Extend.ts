import dynamic from '../../definitions/types/Dynamic';
import Prop from './Prop';
import { fnEmpty, forEach, isNull } from './Utils';

export default class Extend {
  /** joins objects into one */
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

  /** add properties to the first object provided */
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

  /** joins arrays into one */
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
