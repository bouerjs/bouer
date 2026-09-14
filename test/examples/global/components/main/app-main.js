import { Component } from "../../../../dist/bouer.esm.js";

export default class AppMain extends Component {
  constructor() {
    super("/components/main/app-main.html", ['./app-main.css']);
  }

  $product = {}

  loaded() {
    this.$product = {
      name: 'Coca Cola',
      price: 6
    };
  }
}