import { Component } from "../../../../dist/bouer.esm.js";

export default class AppMain extends Component {
  constructor() {
    super("/components/main/main.html");
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
  }

  add() {

		console.log(this);

    const bouer = this.bouer;
    const obj = bouer.toJsObj('.form');

    if (!obj.name || !obj.url)
      return alert('Both of the fields are required.');

    this.data.socials.push(obj);

    bouer.refs.name.value = ''
    bouer.refs.url.value = ''
  }

  init() {
    this.addCSS([{
      href: "./main.css"
    }]);
  }
}