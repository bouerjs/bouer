type PipeFunction = (
  value: unknown,
  ...args: unknown[]
) => object | string | number | boolean | symbol | bigint | never;

type Pipe = {
  [key: string]: PipeFunction
}

export default Pipe;