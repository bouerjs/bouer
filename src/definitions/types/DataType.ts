type DataType<T extends Record<string, any>, C> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (this: C, ...args: A) => R
    : T[K] extends object
      ? DataType<T[K], C>
      : T[K];
};

export default DataType;