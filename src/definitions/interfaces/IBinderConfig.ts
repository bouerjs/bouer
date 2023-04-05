import IDelimiterResponse from './IDelimiterResponse';
import dynamic from '../types/Dynamic';

interface IBinderConfig {
  /** the bound node */
  node: Node,
  /** the data scope of the bind */
  data: dynamic,
  /** the parent element of the bound node */
  parent: Element,
  /** bound node name */
  nodeName: string,
  /** bound node value */
  nodeValue: string,
  /** directive argument (e-dir:argument) */
  argument?: string,
  /** delimiters fields parsed  */
  fields: IDelimiterResponse[],
  /** directive modifiers (e-dir:arg:mod1.mod2) */
  modifiers?: string[],
  /** the value o of the bound node */
  value: string
}

export default IBinderConfig;