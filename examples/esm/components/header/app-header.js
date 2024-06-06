import {
  Component
} from "../../../../dist/bouer.esm.js";

export default class AppHeader extends Component {
  name = 'AppHeader';

  constructor() {
    super("/components/header/app-header.html", ['./app-header.css']);
  }
}