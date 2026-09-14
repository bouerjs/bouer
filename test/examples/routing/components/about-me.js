import { Component } from "../../../dist/bouer.esm.min.js";

export default class AboutMe extends Component {
  constructor() {
    super({
        route: '/me',
        path: '/components/about-me.html',
        title: 'Routing App * About Me',
      });
  }
}