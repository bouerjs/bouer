import Bouer from "../../instance/Bouer";
export default class Converter {
    bouer: Bouer;
    constructor(bouer: Bouer);
    htmlToJsObj(input: any, options?: {
        names?: string;
        values?: string;
    }, onSet?: (builtObject: object, propName: string, value: any, element: Element) => void): object;
}
