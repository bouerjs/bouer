import Bouer from "../instance/Bouer";
export default class Evaluator {
    private global;
    private bouer;
    constructor(bouer: Bouer);
    private createWindow;
    execRaw(expression: string, context?: object): void;
    exec(options: {
        data: object;
        expression: string;
        isReturn?: boolean;
        aditional?: object;
        args?: any[];
        context: object;
    }): any;
}
