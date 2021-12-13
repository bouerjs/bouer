import WatchCallback from "../../definitions/types/WatchCallback";
import Watch from "../binder/Watch";
export default class Reactive<TValue, TObject> implements PropertyDescriptor {
    propertyName: string;
    propertyValue: TValue;
    propertySource: TObject;
    propertyDescriptor: PropertyDescriptor | undefined;
    watches: Array<Watch<TValue, TObject>>;
    isComputed: boolean;
    context: object;
    computedGetter?: () => any;
    computedSetter?: (value: TValue) => void;
    constructor(options: {
        propertyName: string;
        sourceObject: TObject;
        context: object;
    });
    get: () => TValue;
    set: (value: TValue) => void;
    onChange(callback: WatchCallback, node?: Node): Watch<TValue, TObject>;
    static transform: <TObject_1>(options: {
        context: object;
        inputObject: TObject_1;
        reactiveObj?: Reactive<any, any> | undefined;
    }) => any;
}
