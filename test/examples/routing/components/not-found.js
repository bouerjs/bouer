import { Component } from "../../../../dist/bouer.esm.js";

export default class NotFound extends Component {
  constructor() {
    super({
      route: '/notfound',
      path: '/components/notfound.html',
      title: 'Routing App * Home',
      isNotFound: true
    });
  }
}