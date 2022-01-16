import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import ServiceProvider from "../../shared/helpers/ServiceProvider";
import Logger from "../../shared/logger/Logger";
import Base from "../Base";

export default class DataStore extends Base {
  wait: { [key: string]: { nodes: Element[], data?: object } } = {};
  data: dynamic = {};
  req: dynamic = {};
	bouer: Bouer;

  constructor(bouer: Bouer) {
		super();

		this.bouer = bouer;
		ServiceProvider.add('DataStore', this);
	}

  set<TKey extends keyof DataStore>(key: TKey, dataKey: string, data: object) {
    if (key === 'wait') return Logger.warn("Only “get” is allowed for type of data");
    ServiceProvider.get<any>(this.bouer, 'DataStore')[key][dataKey] = data;
  }

  get<TKey extends keyof DataStore>(key: TKey, dataKey: string, once?: boolean) {
    const result = ServiceProvider.get<any>(this.bouer, 'DataStore')[key][dataKey];
    if (once === true) this.unset(key, dataKey);
    return result;
  }

  unset<TKey extends keyof DataStore>(key: TKey, dataKey: string) {
    delete ServiceProvider.get<any>(this.bouer, 'DataStore')[key][dataKey]
  }
}
