import Bouer from '../instance/Bouer';
import IoC from '../shared/helpers/IoCContainer';
import { getRootElement, where } from '../shared/helpers/Utils';
import Component from './component/Component';
import ComponentHandler from './component/ComponentHandler';

export default class ViewChild {
  /**
   * Retrieves the actives components matching the a provided expression
   * @param {Bouer} bouer the app instance
   * @param {Function} expression the expression function to match the required component
   * @returns a list of components matching the expression
   */
  static by<Child extends Component>(
    bouer: Bouer,
    expression: (component: Component) => boolean
  ): Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(bouer).resolve(ComponentHandler)!
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, expression) as Child[];
  }

  /**
   * Retrieves the active component matching the component element or the root element id
   * @param {Bouer} bouer the app instance
   * @param {string} id the id o the component
   * @returns The Component or null
   */
  static byId<Child extends Component>(bouer: Bouer, id: string):
    Child | null {
    // Retrieving the active component
    const activeComponents = IoC.app(bouer).resolve(ComponentHandler)!
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, c => (c.el && getRootElement(c.el).id == id))[0] as Child;
  }

  /**
   * Retrieves the actives components matching the component name
   * @param {Bouer} bouer the app instance
   * @param {string} name the component name
   * @returns a list of components matching the name
   */
  static byName<Child extends Component>(bouer: Bouer, name: string):
    Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(bouer).resolve(ComponentHandler)!
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, c => c.name.toLowerCase() == (name || '').toLowerCase()) as Child[];
  }
}