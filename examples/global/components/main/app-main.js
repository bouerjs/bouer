import {
  Component
} from "../../../../dist/bouer.esm.js";

export default class AppMain extends Component {
  name = 'AppMain';

  constructor() {
    super("/components/main/app-main.html", ['./app-main.css']);
  }

  data = {
    $product: {}
  }

  loaded() {
    this.data.$product = {
      name: 'Coca Cola',
      price: 6
    };
  }
}