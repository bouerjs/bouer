import Bouer from 'bouerjs';
import AppHeader from './components/header/AppHeader.js';
import AppMain from './components/main/AppMain.js';
import AppFooter from './components/footer/AppFooter.js';

import './index.html';
import './main.scss';

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