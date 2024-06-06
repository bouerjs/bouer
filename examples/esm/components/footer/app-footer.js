import {
  Component
} from "../../../../dist/bouer.esm.js";

export default class AppFooter extends Component {
  name = 'AppFooter';

  constructor() {
    super("/components/footer/app-footer.html", ['./app-footer.css']);
  }
}