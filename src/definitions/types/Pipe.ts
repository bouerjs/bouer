type R = object|string|number|boolean|symbol|bigint|never;

type Pipe = {
  [key: string]: (...args: unknown[]) => R
}

export default Pipe;