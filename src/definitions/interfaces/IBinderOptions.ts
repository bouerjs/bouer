import RenderContext from '../types/RenderContext';
import dynamic from '../types/Dynamic';
import IDelimiterResponse from './IDelimiterResponse';
import IBinderConfig from './IBinderConfig';

interface IBinderOptions {
  /** Node to the bound */
  node: Node,

  /** The current scope data of  */
  data: dynamic,

  /** The fields having the delimiters to bind */
  fields: IDelimiterResponse[],

  /** Allow to replace the directive to the origiral one. `e-class` to `class` */
  replaceable?: boolean,

  /** The context of the binding */
  context: RenderContext,

  /** Fires whenever the data property is bound */
  onBind?: (node: Node, bindConfig: IBinderConfig) => void,

  /** Fires whenever the data property is updated */
  onUpdate?: (node: Node, bindConfig: IBinderConfig) => void,

  /** Fires whenever the data property is unbind */
  onUnbind?: (node: Node, bindConfig: IBinderConfig) => void,
}

export default IBinderOptions;