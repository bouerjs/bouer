import IDelimiter from './IDelimiter';

interface IDelimiterResponse {
  /** delimiter field name */
  field: string,
  /** the expression provided in the node */
  expression: string,
  /** delimiter object containing the current delimiter config */
  delimiter?: IDelimiter
}

export default IDelimiterResponse;