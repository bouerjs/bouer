import Bouer from "../instance/Bouer";
export default class Skeleton {
    bouer: Bouer;
    style: HTMLStyleElement;
    backgroudColor: string;
    waveColor: string;
    defaultBackgroudColor: string;
    defaultWaveColor: string;
    identifier: string;
    constructor(bouer: Bouer);
    private reset;
    init(color?: {
        wave?: string;
        background?: string;
    }): void;
    clear(id?: string): void;
}
