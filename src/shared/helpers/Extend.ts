import { dynamic } from "../../types/dynamic";
import { forEach, isNull, transferProperty } from "./Utils";

export default class Extend {
  // join objects into one
  static obj(...args: object[]) {
    let out: dynamic = {};

    forEach(args, arg => {
      if (isNull(arg)) return;

      forEach(Object.keys(arg), key => {
        const propValue = (arg as any)[key];

        if (isNull(propValue))
          return;

        transferProperty(out, arg, key);
      })
    });

    return out as object;
  }

  /** Add properties to the first object extracting from the next arguments */
  static addToObj(destination: object, ...args: object[]) {
    forEach(args, arg => {
      if (isNull(arg)) return;

      forEach(Object.keys(arg), key => {
        const propValue = (arg as any)[key];

        if (isNull(propValue))
          return;

        transferProperty(destination, arg, key);
      })
    });
    return destination;
  }

  /** join arrays into one */
  static array(...args: Array<any>) {
    const out: any[] = [];
    forEach(args, arg => {
      if (isNull(arg)) return;

      forEach(Object.keys(arg), key => {

        const value = arg[key];
        if (isNull(value))
          return;

        if (Array.isArray(value)) {
          [].push.apply(out, value as never[]);
        } else {
          out.push(value);
        }
      });
    });
    return out;
  }
}
