import DelimiterResponse from "./DelimiterResponse";
import dynamic from "./Dynamic";
declare type BinderConfig = {
    node: Node;
    data: dynamic;
    parent: Element;
    nodeName: string;
    nodeValue: string;
    argument?: string;
    fields: DelimiterResponse[];
    modifiers?: string[];
    value: string;
};
export default BinderConfig;
