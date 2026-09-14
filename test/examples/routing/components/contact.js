import { Component } from "../../../dist/bouer.esm.min.js";

export default class Contact extends Component {
  constructor() {
    super({
      route: '/contact',
      path: '/components/contact.html',
      title: 'Routing App * Contact',
      keepAlive: true
    });
  }
}