import Constructor from '../definitions/types/Constructor';
import Bouer from '../instance/Bouer';
import IoC from '../shared/helpers/IoCContainer';
import { getRootElement, filter } from '../shared/helpers/Utils';
import ComponentPrototype, { Component } from './component/Component';
import ComponentHandler from './component/ComponentHandler';

export default class ViewChild {
  /**
   * Retrieves the actives components matching the a provided expression
   * @param {Bouer} app the Bouer instance
   * @param {Function} expression the expression function to match the required component
   * @returns a list of components matching the expression
   */
  static by<Child extends Component | ComponentPrototype>(
    app: Bouer,
    expression: (component: Child) => boolean
  ): Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(app).resolve(ComponentHandler)!
      .activeComponents as any[];
    // Applying filter to the find the component
    return filter(activeComponents as Child[], expression) as Child[];
  }

  /**
   * Retrieves the actives components matching class
   * @param {Bouer} app the Bouer instance
   * @param {Function} ctor the class to match
   * @returns a list of components matching the expression
   */
  static byClass<Child extends Component | ComponentPrototype>(
    app: Bouer,
    ctor: Constructor<Child>,
  ): Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(app).resolve(ComponentHandler)!
      .activeComponents as any[];
    // Applying filter to the find the component
    return filter(activeComponents as Child[], c => c instanceof ctor) as Child[];
  }

  /**
   * Retrieves the actives components matching the component name
   * @param {Bouer} app the Bouer instance
   * @param {string} name the component name
   * @returns a list of components matching the name
   */
  static byName<Child extends Component | ComponentPrototype>(app: Bouer, name: string):
    Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(app).resolve(ComponentHandler)!
      .activeComponents;
    // Applying filter to the find the component
    return filter(activeComponents, c => {
      const $proto = c instanceof Component ? c.__$proto__ : c;
      return $proto.name.toLowerCase() == (name || '').toLowerCase()
    }) as Child[];
  }
}