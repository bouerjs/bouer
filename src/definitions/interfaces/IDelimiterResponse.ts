import IDelimiter from './IDelimiter';

interface IDelimiterResponse {
  /** the delimiter match expression */
  field: string,
  /** expression inside of the field */
  expression: string,
  /** delimiter object containing the current delimiter config */
  delimiter?: IDelimiter
}

export default IDelimiterResponse;