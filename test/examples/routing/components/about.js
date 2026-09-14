import { Component } from "../../../dist/bouer.esm.min.js";
import AboutMe from "./about-me.js";

export default class About extends Component {
  constructor() {
    super({
      route: '/about',
      path: '/components/about.html',
      title: 'Routing App * About',
      children: [AboutMe]
    });
  }
}