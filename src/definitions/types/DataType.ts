import Computed from '../../core/reactive/Computed';
import dynamic from './Dynamic';
import RenderContext from './RenderContext';

type DataType<Type extends Record<string, any> = dynamic, Context = RenderContext> = {
  [K in keyof Type]:
    // In case of a function, bind it to the context
    Type[K] extends (...args: infer A) => infer R
      ? (this: Context, ...args: A) => R
      // In case of a computed, return the EntryType | any
      : Type[K] extends Computed<infer EntryType, any> ? EntryType
        // If it is an object, recurse
        : Type[K] extends object
          ? DataType<Type[K], Context>
          // Otherwise, return the type
          : Type[K];
};

export default DataType;