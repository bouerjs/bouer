import {
  Component
} from "../../../../dist/bouer.esm.js";

export default class AppHeader extends Component {
  constructor() {
    super("/components/header/app-header.html");
  }
  init() {
    this.addAssets(['./app-header.css']);
  }
}