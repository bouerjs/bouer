import Bouer from '../../../dist/bouer.esm.js';
import About from './components/about.js';
import Contact from './components/contact.js';
import Home from './components/home.js';
import NotFound from './components/not-found.js';


var app = new Bouer('#app', {
  data: {
    version: '3.0.0',
  },
  config: {
    //usehash: false
  },
  components: [
    Home,
    About,
    Contact,
    NotFound
  ]
});