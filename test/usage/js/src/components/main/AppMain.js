import { Component } from 'bouerjs';
import style from './AppMain.scss';
import html from './AppMain.html';

export default class AppMain extends Component {
  constructor() {
    super(html);
  }

  data = {
    socials: [{
      name: 'Twitter',
      url: 'www.twitter.com/bouerjs'
    },
    {
      name: 'Reddit',
      url: 'www.reddit.com/bouerjs'
    }
    ],
  };

  add() {
    const bouer = this.bouer;
    const obj = bouer.toJsObj('.form');

    if (!obj.name || !obj.url)
      return alert('Both of the fields are required.');

    this.data.socials.push(obj);

    bouer.refs.name.value = '';
    bouer.refs.url.value = '';
  }

  init() {
    this.addAssets([style]);
  }
}