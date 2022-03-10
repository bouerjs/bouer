import IDelimiter from './IDelimiter';

interface IDelimiterResponse {
  field: string,
  expression: string,
  delimiter?: IDelimiter
}

export default IDelimiterResponse;