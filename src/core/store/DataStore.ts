import INode from '../../definitions/interfaces/INode';
import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import { forEach } from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';

export default class DataStore {
  readonly _IRT_ = true;

  wait: {
    [key: string]: {
      nodes: Element[],
      data?: dynamic,
      once?: boolean,
      context: RenderContext
    }
  } = {};
  data: dynamic = {};
  req: dynamic = {};


  element = {
    data: new WeakMap<Element, dynamic>(),
    keys: new Array<Element>()
  }

  set<TKey extends keyof DataStore>(key: TKey, dataKey: string, data: object) {
    if (key === 'wait') return Logger.warn('Only “get” is allowed for type of data');
    (this as { [k: string]: any })[key][dataKey] = data;
  }

  get<TKey extends keyof DataStore>(key: TKey, dataKey: string, once?: boolean) {
    const result = (this as { [k: string]: any })[key][dataKey];
    if (once === true) this.unset(key, dataKey);
    return result;
  }

  unset<TKey extends keyof DataStore>(key: TKey, dataKey: string) {
    delete (this as { [k: string]: any })[key][dataKey];
  }

  getNodeData(element: Element | Node, defaultData?: dynamic) {
    if (!this.element.data.has(element as Element))
      return defaultData;

    return this.element.data.get(element as Element) ?? defaultData;
  }

  addNodeData(element: Element, data: dynamic) {
    this.element.data.set(element, data);
    this.element.keys.push(element);
  }

  unlinkNodeData() {
    forEach(this.element.keys, (el:INode) => {
      const isUnlinked = !el.isConnected || (el.isActive || (() => { return false; }))();

      if (!isUnlinked)
        return;

      this.element.data.delete(el as Element);
    });
  }
}
