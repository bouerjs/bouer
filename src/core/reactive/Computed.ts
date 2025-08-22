import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import { isNull, isObject } from '../../shared/helpers/Utils';

export type EntryObjectType<Type, Context> = {
  get: (this: Context) => Type,
  set: (this: Context, value: Type) => void
};

export type EntryFnType<Type, Context> = (this: Context) => (
  EntryObjectType<Type, Context> | (String | Number | Boolean | Object | Function | null)
);

export type EntryType<Type, Context> = EntryObjectType<Type, Context> | EntryFnType<Type, Context>;

export default class Computed<Type, Context = RenderContext | any> {
  // readonly _IRT_ = true;
  entryValue: EntryType<Type, Context>;

  context: Context;
  srcObject?: dynamic;
  propName?: string;

  $get?: Function;
  $set?: Function;

  constructor(entryValue: EntryType<Type, Context>) {
    this.entryValue = entryValue;
    this.context = undefined as any; // To avoid errors
  }

  configure() {
    if (this.$get || this.$set)
      return {
        get: this.$get,
        set: this.$set
      };

    const isFunctionEntry = typeof this.entryValue === 'function';

    const value: any = isFunctionEntry
      ? (this.entryValue as EntryFnType<Type, Context>).call(this.context as any)
      : this.entryValue;

    if (isNull(value))
      throw new Error('Invalid value used as return in “function $computed(){...}” | “new Computed(...)”.');

    const isExplicit = isObject(value) && (('get' in value) || ('set' in value));

    this.$get = ((isExplicit && 'get' in value) ? value.get : (() => value)).bind(this.context);
    this.$set = ((isExplicit && 'set' in value) ? value.set : ((v: any) => {})).bind(this.context);

    return {
      get: this.$get,
      set: this.$set
    };
  }

  __(options: {
    context: Context,
    propName: string,
    propSource: dynamic
  }) {
    this.context = options.context;
    this.propName = options.propName;
    this.srcObject = options.propSource;
  }

  get() {
    return this.configure().get!();
  }

  set(value: Type) {
    this.configure().set!(value);
  }
}