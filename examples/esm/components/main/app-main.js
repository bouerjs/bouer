import {
  Component
} from "../../../../dist/bouer.esm.js";

export default class AppMain extends Component {
  name = 'AppMain';

  constructor() {
    super("/components/main/app-main.html");
  }

  data = {
    users: [{
        name: 'Afonso Matumona',
        username: 'AfonsoMatElias'
      },
      {
        name: 'Bouer',
        username: 'bouerjs'
      },
    ]
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

  init() {
    this.addAssets(['./app-main.css']);
  }
}