import Constructor from './Constructor';

type Params<S extends Constructor<any>> = S extends new (...args: infer P) => any ? P | Object : never;

export default Params;