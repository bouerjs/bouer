import Bouer from '../instance/Bouer';
import IoC from '../shared/helpers/IoCContainer';
import { getRootElement, where } from '../shared/helpers/Utils';
import Component from './component/Component';
import ComponentHandler from './component/ComponentHandler';

export default class ViewChild {
  static viewBy<Child extends Component>(
    bouerInstance: Bouer,
    expression: (component: Component) => boolean
  ): Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(bouerInstance).resolve(ComponentHandler)!
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, expression) as Child[];
  }

  static viewById<Child extends Component>(bouerInstance: Bouer, componentId: string):
    Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(bouerInstance).resolve(ComponentHandler)!
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, c => (c.el && getRootElement(c.el).id == componentId)) as Child[];
  }

  static viewByName<Child extends Component>(bouerInstance: Bouer, componentName: string):
    Child[] {
    // Retrieving the active component
    const activeComponents = IoC.app(bouerInstance).resolve(ComponentHandler)!
      .activeComponents;
    // Applying filter to the find the component
    return where(activeComponents, c => c.name.toLowerCase() == (componentName || '').toLowerCase()) as Child[];
  }
}