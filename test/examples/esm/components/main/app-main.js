import { Component } from "../../../../dist/bouer.esm.js";
import { Injectable } from "../../../../src/index.js";

@Injectable
class AppMain extends Component {
  constructor() {
    super('/components/main/app-main.html', ['./app-main.css']);
  }

  users = [{
      name: 'Afonso Matumona',
      username: 'AfonsoMatElias'
    },
    {
      name: 'Bouer',
      username: 'bouerjs'
    }
  ];

  loaded() {

  }

  add() {
    const bouer = this.bouer;
    const obj = bouer.toJsObj('.form');

    if (!obj.name || !obj.username)
      return alert('Both of the fields are required.');

    this.data.users.push(obj);

    bouer.refs.name.value = ''
    bouer.refs.username.value = ''
  }
}

export default AppMain;