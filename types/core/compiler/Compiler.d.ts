import IBouer from "../../definitions/interfaces/IBouer";
import Bouer from "../../instance/Bouer";
import Binder from "../binder/Binder";
import ComponentHandler from "../component/ComponentHandler";
import DelimiterHandler from "../DelimiterHandler";
import EventHandler from "../event/EventHandler";
export default class Compiler {
    bouer: Bouer;
    binder: Binder;
    bouerOptions: IBouer;
    delimiter: DelimiterHandler;
    eventHandler: EventHandler;
    component: ComponentHandler;
    private NODES_TO_IGNORE_IN_COMPILATION;
    constructor(bouer: Bouer, appOptions: IBouer);
    compile(options: {
        /** The element that wil be compiled */
        el: Element;
        /** The data that should be injected in the compilation */
        data?: object;
        /**
         * In case of components having content inside of the definition,
         * a wrapper (Example: <div>) with the content need to be provided
         * in `componentSlot` property in order to be replaced on the compilation.
         */
        componentSlot?: Element;
        /** The function that should be fired when the compilation is done */
        onDone?: (element: Element, data?: object) => void;
        /** The context of this compilation process */
        context: object;
    }): Element;
    analize(htmlSnippet: string): boolean;
}
