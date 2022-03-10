import RenderContext from '../types/RenderContext';
import dynamic from '../types/Dynamic';
import IDelimiterResponse from './IDelimiterResponse';

interface IBinderOptions {
  /** Node to the bound */
  node: Node,

  /** The current scope data of  */
  data: dynamic,

  /** The fields having the delimiters to bind */
  fields: IDelimiterResponse[],

  /** Allow to replace the directive to the origiral one. `e-class` to `class` */
  isReplaceProperty?: boolean,

  /** The context of the binding */
  context: RenderContext,

  /** Allow to check if the bound element/parent-element is still connected to the DOM  */
  isConnected: () => boolean,

  /** Fires whenever the data property is updated */
  onUpdate?: (value: any, node: Node) => void,
}

export default IBinderOptions;