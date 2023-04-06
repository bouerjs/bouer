import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
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
}
