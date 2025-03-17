import Bouer from "../../dist/bouer.esm.js";
import AppMain from "./components/main/app-main.js";

new Bouer('#app', {
  components: [ AppMain ],
  pipes: {
    upper(value) {
      return value.toUpperCase();
    },
    currency(value, p1) {
      return p1 + ' ' + value;
    }
  }
});