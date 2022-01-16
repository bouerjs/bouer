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
	serviceProvider: ServiceProvider;

  constructor(bouer: Bouer) {
		super();

		this.bouer = bouer;
		this.serviceProvider = new ServiceProvider(bouer);
		this.serviceProvider.add('DataStore', this);
	}

  set<TKey extends keyof DataStore>(key: TKey, dataKey: string, data: object) {
    if (key === 'wait') return Logger.warn("Only “get” is allowed for type of data");
    this.serviceProvider.get<any>('DataStore')[key][dataKey] = data;
  }

  get<TKey extends keyof DataStore>(key: TKey, dataKey: string, once?: boolean) {
    const result = this.serviceProvider.get<any>('DataStore')[key][dataKey];
    if (once === true) this.unset(key, dataKey);
    return result;
  }

  unset<TKey extends keyof DataStore>(key: TKey, dataKey: string) {
    delete this.serviceProvider.get<any>('DataStore')[key][dataKey]
  }
}
