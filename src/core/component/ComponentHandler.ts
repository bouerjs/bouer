import Bouer from "../../Bouer";

export default class ComponentHandler {
  /**
   * Provide the instance of the class.
   * link: https://refactoring.guru/design-patterns/singleton
   */
  public static singleton: ComponentHandler;

  bouer: Bouer;
  components: any = {}


  constructor(bouer: Bouer) {
    ComponentHandler.singleton = this;

    this.bouer = bouer;
  }
}
