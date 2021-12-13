import dynamic from "../../definitions/types/Dynamic";
export declare function webRequest(url: string, options?: {
    body?: any;
    headers?: object;
    method?: string;
}): Promise<{
    url: string;
    ok: boolean;
    status: number;
    statusText: string;
    headers: object;
    json: () => Promise<object>;
    text: () => Promise<string>;
}>;
export declare function code(len?: number, prefix?: string, sufix?: string): string;
export declare function isNull(input: any): boolean;
export declare function isObject(input: any): boolean;
export declare function isFilledObj(input: any): boolean;
export declare function isPrimitive(input: any): boolean;
export declare function isString(input: any): boolean;
export declare function isEmptyObject(input: any): boolean;
export declare function isFunction(input: any): boolean;
export declare function trim(value: string): string;
export declare function startWith(value: string, pattern: string): boolean;
export declare function toLower(str: string): string;
export declare function toStr(input: any): any;
export declare function defineProperty<TObject>(object: TObject, property: string, descriptor: PropertyDescriptor): TObject;
export declare function transferProperty<TSourceObject, TDestinationObject>(dest: TSourceObject, src: TDestinationObject, name: string): void;
export declare function getDescriptor<TObject>(obj: TObject, prop: string): PropertyDescriptor | undefined;
export declare function findAttribute(element: Element, attributesToCheck: Array<string>, removeIfFound?: boolean): Attr | null;
export declare function forEach<TArray>(iterable: TArray[], callback?: (item: TArray, index: number) => void, context?: object): void;
export declare function where<TArray>(iterable: TArray[], callback?: (item: TArray, index: number) => any, context?: object): TArray[];
export declare function toArray(array: any): never[];
export declare function createAnyEl(elName: string, callback?: (element: HTMLElement, dom: Document) => void): {
    appendTo: (target: Element) => any;
    build: () => HTMLElement;
};
export declare function createEl<TKey extends keyof HTMLElementTagNameMap>(elName: TKey, callback?: (element: HTMLElementTagNameMap[TKey], dom: Document) => void): {
    appendTo: (target: Element) => any;
    build: () => HTMLElementTagNameMap[TKey];
};
export declare function mapper(source: dynamic, destination: dynamic): void;
export declare function urlResolver(url: string): {
    href: string;
    baseURI: string;
    protocol: string;
    host: string;
    search: string;
    hash: string;
    hostname: string;
    port: string;
    pathname: string;
    origin: string;
};
export declare function urlCombine(base: string, ...parts: string[]): string;
/**
 * Relative path resolver
 */
export declare function pathResolver(relative: string, path: string): string;
export declare function buildError(error: any): any;
/**
 * Used to Bind the `isConnected` property of a node to another
 * in order to avoid binding cleanup where the element is not in the DOM
 */
export declare function connectNode(node: Node, nodeToConnectWith: Node): Node;
export declare const DOM: Document;
export declare const GLOBAL: typeof globalThis;
export declare const anchor: HTMLAnchorElement;
