import Component from '../../core/component/Component';
import Bouer from '../../instance/Bouer';
import Constructor from '../types/Constructor';
import DataType from '../types/DataType';
import ILifeCycleHooks from './ILifeCycleHooks';

interface IComponentOptions<Data extends {} = {}> extends ILifeCycleHooks {
  /** The name of the component */
  readonly name?: string

  /** The path of the component (not required on e-entry directive) */
  readonly path?: string;

  /** The title that should be replaced when the page is loaded */
  readonly title?: string;

  /** The navigation url */
  readonly route?: string;

  /** The component html template [hard code component] */
  readonly template?: string;

  /** The default data that should be injected in the component */
  readonly data?: DataType<Data, this>;

  /** Allow the component the keep the last state */
  readonly keepAlive?: boolean;

  /**
   * Allow to prefetch the component content when the application is ready.
   * Note: it overrides the global prefetch value
   */
  readonly prefetch?: boolean;

  /** The children of the component that should inherit the `route` of the father */
  readonly children?: (Component | IComponentOptions | Constructor<Component>)[];

  /** Defines a list of restrictions functions of the component */
  readonly restrictions?: (
    (this: Bouer, component: Component | IComponentOptions) => boolean | Promise<boolean>
  )[];

  /** Allow to set this component as the `default page` when the application loads */
  readonly isDefault?: boolean;

  /** Allow to set this component as the `not found page` when no route was found */
  readonly isNotFound?: boolean;
}

export default IComponentOptions;