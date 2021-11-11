import Bouer from "../../dist/bouer.esm.js";
import AppHeader from "./components/header/header.js";
import AppMain from "./components/main/main.js";
import AppFooter from "./components/footer/footer.js";

new Bouer('#app', {
  data: {
    // Props
    version: '3.0.0',
  },
  components: [
    new AppHeader(),
    new AppMain(),
    new AppFooter()
  ]
});