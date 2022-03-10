import IDelimiterResponse from './IDelimiterResponse';
import dynamic from '../types/Dynamic';

interface IBinderConfig {
  node: Node,
  data: dynamic,
  parent: Element,
  nodeName: string,
  nodeValue: string,
  argument?: string,
  fields: IDelimiterResponse[],
  modifiers?: string[],
  value: string
}

export default IBinderConfig;