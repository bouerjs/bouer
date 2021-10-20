import Bouer from "../instance/Bouer";
import { anchor, forEach, http, urlCombine, urlResolver } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Component from "./Component";
import IComponent from "../../types/IComponent";
import Extend from "../../shared/helpers/Extend";
import BouerEvent from "../event/BouerEvent";

export default class ComponentHandler {
  /**
   * Provide the instance of the class.
   * link: https://refactoring.guru/design-patterns/singleton
   */
  static singleton: ComponentHandler;

  private bouer: Bouer;
  private components: Component[] | IComponent[] = [];

  constructor(bouer: Bouer, components?: IComponent[]) {
    ComponentHandler.singleton = this;
    this.bouer = bouer;

    if (components) this.prepare(components);
  }

  check(nodeName: string) {
    return (nodeName.toLowerCase() in this.components);
  }

  prepare = (components: IComponent[]) => {
    forEach(components, item => {
      let component = item;
      if (!(component instanceof Component))
        component = new Component(component);

      const mComponent = (component as Component);
      mComponent.bouer = this.bouer;
      (components as any)[item.name] = item; // Setting an index

      this.components.push(mComponent);
      (this.components as any)[item.name] = mComponent;
    });
  }

  order(componentElement: Element, data: object) {
    const $name = componentElement.nodeName.toLowerCase();
    const componentsAsAny = this.components as any;
    let hasComponent = componentsAsAny[$name];
    if (!hasComponent)
      return Logger.error("No component with name \"" + $name + "\" registered.");

    const icomponent = (hasComponent as IComponent);
    const mData = Extend.obj(data, { $this: data });

    if (icomponent.template) {
      const component = new Component(icomponent);
      component.insert(componentElement, mData);

      if (component.keepAlive === true)
        componentsAsAny[$name] = component;
      return;
    }

    const urlPath = urlCombine(urlResolver(anchor.baseURI).baseURI, icomponent.path);
    if (typeof icomponent.requested === 'function')
      icomponent.requested(new BouerEvent({ type: 'requested' }));

    http(urlPath, { headers: { 'Content-Type': 'text/plain' } })
      .then(result => result.text())
      .then(text => {
        icomponent.template = text;

        const component = new Component(icomponent);
        component.insert(componentElement, mData);

        if (component.keepAlive === true)
          componentsAsAny[$name] = component;
      })
      .catch(error => {
        error.stack = "";
        Logger.log(error);
        if (typeof icomponent.failed === 'function')
          icomponent.failed(new BouerEvent({ type: 'failed' }));
      });
  }
}
