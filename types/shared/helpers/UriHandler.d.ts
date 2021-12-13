import dynamic from "../../definitions/types/Dynamic";
export default class UriHandler {
    url: string;
    constructor(url?: string);
    params(urlPattern?: string): dynamic;
    add(params: dynamic): string;
    remove(param: {
        key: string;
        type?: string;
    }): {
        key: string;
        type?: string | undefined;
    };
}
