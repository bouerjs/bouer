import {
  Component
} from "../../../../dist/bouer.esm.js";

export default class AppMain extends Component {
  name = 'AppMain';

  constructor() {
    super("/components/main/app-main.html", ['./app-main.css']);
  }

  data = {
    $user: {}
  }

  loaded() {
    this.data.$user = {
      name: 'afonso matumona',
      username: 'ame',
      age: 16
    };
  }
}