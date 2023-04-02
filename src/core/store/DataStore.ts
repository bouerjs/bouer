import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import Bouer from '../../instance/Bouer';
import Logger from '../../shared/logger/Logger';
import Base from '../Base';

export default class DataStore extends Base {
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

  constructor(bouer: Bouer) {
    super();
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
}
