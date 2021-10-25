import IoC from "../../shared/helpers/IoC";
import { dynamic } from "../../types/dynamic";

export default class DataStore {
  wait: dynamic = {};
  data: dynamic = {};
  req: dynamic = {};

  constructor() { IoC.Register(this); }

  static set<TKey extends keyof DataStore>(key: TKey, dataKey: string, data: object) {
    IoC.Resolve<any>(DataStore.name)[key][dataKey] = data;
  }

  static get<TKey extends keyof DataStore>(key: TKey, dataKey: string, once?: boolean) {
    const result = IoC.Resolve<any>(DataStore.name)[key][dataKey];
    if (once === true) DataStore.unset(key, dataKey);
    return result;
  }

  static unset<TKey extends keyof DataStore>(key: TKey, dataKey: string) {
    delete IoC.Resolve<any>(DataStore.name)[key][dataKey]
  }
}
