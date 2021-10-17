import { isNull } from "./helpers/Utils";

export default class Extensions {
  static value(el: HTMLElement | Element, name: string, set?: string): string | number | boolean | undefined | null {

    if (!isNull(set)) {
      el.setAttribute(name, set!);
      return el.getAttribute(name);
    }

    if (name in el)
      return (el as any)[name];

    return el.getAttribute(name) || (el as any).innerText;
  }
}
