import { Component } from "../../../dist/bouer.esm.min.js";

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