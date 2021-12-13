import BinderConfig from "../../definitions/types/BinderConfig";
import DelimiterResponse from "../../definitions/types/DelimiterResponse";
import dynamic from "../../definitions/types/Dynamic";
import WatchCallback from "../../definitions/types/WatchCallback";
import Bouer from "../../instance/Bouer";
import Evaluator from "../Evaluator";
import Watch from "./Watch";
export default class Binder {
    bouer: Bouer;
    evaluator: Evaluator;
    binds: Watch<any, any>[];
    private DEFAULT_BINDER_PROPERTIES;
    private BindingDirection;
    constructor(bouer: Bouer);
    create(options: {
        node: Node;
        data: dynamic;
        fields: DelimiterResponse[];
        isReplaceProperty?: boolean;
        context: object;
        onUpdate?: (value: any, node: Node) => void;
    }): BinderConfig;
    onPropertyChange(propertyName: string, callback: WatchCallback, targetObject?: object): null;
    onPropertyInScopeChange(watchable: (app: Bouer) => void): Watch<any, any>[];
    /** Creates a process for unbind properties when it does not exists anymore in the DOM */
    private cleanup;
}
