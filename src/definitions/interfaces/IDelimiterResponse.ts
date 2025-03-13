import IDelimiter from './IDelimiter';

interface IDelimiterResponse {
  /** the delimiter match expression */
  field: string,
  /** expression inside of the field */
  expression: string,
  /** delimiter object containing the current delimiter config */
  delimiter?: IDelimiter,
  /** all the pipes used in the delimiter */
  pipes: {
    /** The function that will be executed */
    fn: string;
    /** The arguments that will be passed to the function */
    args: unknown[];
  }[]
}

export default IDelimiterResponse;