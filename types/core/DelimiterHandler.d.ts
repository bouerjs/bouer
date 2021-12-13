import Bouer from "../browser";
import Delimiter from "../definitions/types/Delimiter";
import DelimiterResponse from "../definitions/types/DelimiterResponse";
export default class DelimiterHandler {
    delimiters: Array<Delimiter>;
    bouer: Bouer;
    constructor(delimiters: Array<Delimiter>, bouer: Bouer);
    add(item: Delimiter): void;
    remove(name: string): void;
    run(content: string): DelimiterResponse[];
}
