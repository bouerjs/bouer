type Props<T extends object = Record<string, any>> = {
  [Key in keyof T]: T[Key];
};

export default Props;