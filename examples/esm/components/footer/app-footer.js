import {
  Component
} from "../../../../dist/bouer.esm.js";

export default class AppFooter extends Component {
  constructor() {
    super("/components/footer/app-footer.html");
  }
  init() {
    this.addAssets(['./app-footer.css']);
  }
}