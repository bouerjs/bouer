import Bouer from "../../dist/bouer.esm.js";
import AppHeader from "./components/header/app-header.js";
import UserItem from "./components/user-item/user-item.js";
import AppMain from "./components/main/app-main.js";
import AppFooter from "./components/footer/app-footer.js";

new Bouer('#app', {
  components: [
    new AppHeader(),
    new UserItem(),
    new AppMain(),
    new AppFooter()
  ]
});