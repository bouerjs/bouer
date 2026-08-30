import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import Prop from '../../shared/helpers/Prop';
import { isNull, isObject } from '../../shared/helpers/Utils';

export type EntryObjectType<Type, Context> = {
  get: (this: Context) => Type,
  set: (this: Context, value: Type) => void
};

export type EntryFnType<Type, Context> = (this: Context) => (
  EntryObjectType<Type, Context> | (String | Number | Boolean | Object | Function | null)
);

export type EntryType<Type, Context> = EntryObjectType<Type, Context> | EntryFnType<Type, Context>;

export function isComputed(input: any) {
  return input instanceof Computed && '_' in input && typeof input._ === 'function';
}

export default class Computed<Type, Context = RenderContext | any> {
  entry: EntryType<Type, Context>;

  name?: string;
  context: Context;
  source?: dynamic;

  $get?: Function;
  $set?: Function;

  constructor(entryValue: EntryType<Type, Context>) {
    this.entry = entryValue;
    this.context = undefined as any; // To avoid errors

    Prop.set(this, '_', {
      configurable: false,
      enumerable: false,
      value: (options: {
          context: Context,
          propName: string,
          propSource: dynamic
        }) => {
          this.context = options.context;
          this.name = options.propName;
          this.source = options.propSource;
        }
    });
  }

  configure() {
    if (this.$get || this.$set)
      return {
        get: this.$get,
        set: this.$set
      };

    const entry = this.entry;
    const isFnEntry = typeof entry === 'function';

    const value: any = isFnEntry
      ? (entry as EntryFnType<Type, Context>).call(this.context as any)
      : entry;

    if (isNull(value))
      throw new Error('Invalid value used as return in property '+ this.name +': “function $computed(){...}” | “$computed({...})”.');

    const isExplicit = isObject(value) && (('get' in value) || ('set' in value));

    this.$get = ((isExplicit && 'get' in value) ? value.get : (function(this: any) {
      return isFnEntry ? entry.call(this) : value;
    })).bind(this.context);
    this.$set = ((isExplicit && 'set' in value) ? value.set : (function(v: any) {})).bind(this.context);

    return {
      get: this.$get,
      set: this.$set
    };
  }

  get() {
    return this.configure().get!();
  }

  set(value: Type) {
    this.configure().set!(value);
  }
}

export function $computed<T, Context = any>(
  entryValue: EntryType<T, Context>
) {
  return new Computed<T, Context>(entryValue) as T;
}