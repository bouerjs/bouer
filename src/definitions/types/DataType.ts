type DataType<Type extends Record<string, any>, Context> = {
  [K in keyof Type]: Type[K] extends (...args: infer A) => infer R
    ? (this: Context, ...args: A) => R
    : Type[K] extends object
      ? DataType<Type[K], Context>
      : Type[K];
};

export default DataType;