import { Component } from "../../../../dist/bouer.esm.js";

export default class Home extends Component {
  constructor() {
    super({
      route: '/home',
      path: '/components/home.html',
      title: 'Routing App * Home',
      isDefault: true,
    });
  }
}