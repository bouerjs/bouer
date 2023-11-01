import Component from '../../core/component/Component';
import Bouer from '../../instance/Bouer';
import DataType from '../types/DataType';
import dynamic from '../types/Dynamic';
import ILifeCycleHooks from './ILifeCycleHooks';

interface IComponentOptions<Data extends {} = dynamic> extends ILifeCycleHooks<Data> {
  /** The name of the component */
  name?: string

  /** The path of the component (not required on e-entry directive) */
  path?: string;

  /** The title that should be replaced when the page is loaded */
  title?: string;

  /** The navigation url */
  route?: string;

  /** The component html template [hard code component] */
  template?: string;

  /** The default data that should be injected in the component */
  data?: DataType<Data, Component<Data>>;

  /** Allow the component the keep the last state */
  keepAlive?: boolean;

  /**
   * Allow to prefetch the component content when the application is ready.
   * Note: it overrides the global prefetch value
   */
  prefetch?: boolean;

  /** The children of the component that should inherit the `route` of the father */
  children?: (Component | IComponentOptions | (new (...args: any[]) => Component))[];

  /** Defines a list of restrictions functions of the component */
  restrictions?: (
    (this: Bouer, component: Component<Data> | IComponentOptions<Data>) => boolean | Promise<boolean>
  )[];

  /** Allow to set this component as the `default page` when the application loads */
  isDefault?: boolean;

  /** Allow to set this component as the `not found page` when no route was found */
  isNotFound?: boolean;
}

export default IComponentOptions;