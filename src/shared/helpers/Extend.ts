import dynamic from "../../definitions/types/Dynamic";
import Prop from "./Prop";
import { forEach, isNull } from "./Utils";

export default class Extend {
  // join objects into one
  static obj(...args: object[]) {
    let out: dynamic = {};

    forEach(args, arg => {
      if (isNull(arg)) return;
      forEach(Object.keys(arg), key => {
        Prop.transfer(out, arg, key);
      })
    });

    return out as object;
  }

  /** join arrays into one */
  static array(...args: Array<any>) {
    const out: any[] = [];
    forEach(args, arg => {
      if (isNull(arg)) return;

      if (!Array.isArray(arg))
        return out.push(arg);

      forEach(Object.keys(arg), (key:any) => {

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
