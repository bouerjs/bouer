import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
export default class DataStore {
    wait: {
        [key: string]: {
            nodes: Element[];
            data?: object;
        };
    };
    data: dynamic;
    req: dynamic;
    bouer: Bouer;
    constructor(bouer: Bouer);
    set<TKey extends keyof DataStore>(key: TKey, dataKey: string, data: object): void;
    get<TKey extends keyof DataStore>(key: TKey, dataKey: string, once?: boolean): any;
    unset<TKey extends keyof DataStore>(key: TKey, dataKey: string): void;
}
