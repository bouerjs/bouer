import { Component } from "../../../../dist/bouer.esm.js";

export default class UserItem extends Component {
  constructor() {
    super('/components/user-item/user-item.html', ['./user-item.css']);
  }

  loaded() {
  }
}