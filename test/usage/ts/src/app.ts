import Bouer from 'bouerjs';
import AppHeader from './components/header/AppHeader';
import AppMain from './components/main/AppMain';
import AppFooter from './components/footer/AppFooter';
import Social from './components/social/Social';

import './index.html';
import './main.scss';

new Bouer('#app', {
  data: {
    // Props
    version: '3.0.0',
    func() {
      // const _ =  this.data;
    }
  },
  components: [
    AppHeader,
    AppMain,
    AppFooter,
    Social
  ],
});