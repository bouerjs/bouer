import IDelimiter from "./IDelimiter";

export default interface IDelimiterResponse {
  field: string,
  expression: string,
  delimiter?: IDelimiter
}