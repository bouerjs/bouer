import Bouer from '../instance/Bouer';
import Constants from '../shared/helpers/Constants';
import ServiceProvider from '../shared/helpers/ServiceProvider';
import { $CreateEl, ifNullStop, DOM, forEach, toArray } from '../shared/helpers/Utils';
import Base from './Base';

export default class Skeleton extends Base {
  bouer: Bouer;
  style: HTMLStyleElement;
  backgroudColor: string = '';
  waveColor: string = '';
  defaultBackgroudColor: string = '#E2E2E2';
  defaultWaveColor: string = '#ffffff5d';
  identifier: string = 'bouer';

  constructor(bouer: Bouer) {
    super();

    this.reset();
    this.bouer = bouer;
    this.style = $CreateEl('style', el => el.id = this.identifier).build();

    ServiceProvider.add('Skeleton', this);
  }

  private reset() {
    this.backgroudColor = this.defaultBackgroudColor;
    this.waveColor = this.defaultWaveColor;
  }

  init(color?: { wave?: string, background?: string }) {
    if (!this.style) return;
    if (!DOM.getElementById(this.identifier))
      DOM.head.appendChild(this.style);

    if (!this.style.sheet) return;

    for (let i = 0; i < this.style.sheet.cssRules.length; i++)
      this.style.sheet!.deleteRule(i);

    if (color) {
      this.backgroudColor = color.background || this.defaultBackgroudColor;
      this.waveColor = color.wave || this.defaultWaveColor;
    } else {
      this.reset();
    }

    const dir = Constants.skeleton;
    const bgc = this.backgroudColor;
    const wvc = this.waveColor;
    const rules = [
      '[--s]{ display: none!important; }',

      '[' + dir + '] { background-color: ' + bgc + '!important; position: relative!important; overflow: hidden; }',

      '[' + dir + '],[' + dir + '] * { color: transparent!important; }',

      '[' + dir + ']::before, [' + dir + ']::after { content: ""; position: absolute; top: 0; left: 0; right: 0; ' +
      'bottom: 0; display: block; }',

      '[' + dir + ']::before { background-color: ' + bgc + '!important; z-index: 1;}',

      '[' + dir + ']::after { transform: translateX(-100%); background: linear-gradient(90deg, transparent, ' + wvc +
      ', transparent); animation: loading 1.5s infinite; z-index: 2; }',

      '@keyframes loading { 100% { transform: translateX(100%); } }',

      '@-webkit-keyframes loading { 100% { transform: translateX(100%); } }'
    ];
    forEach(rules, rule => this.style.sheet!.insertRule(rule));
  }

  clear(id?: string) {
    id = (id ? ('="' + id + '"') : '');
    const appEl = ifNullStop(this.bouer.el);
    const skeletons = toArray(appEl.querySelectorAll('[' + Constants.skeleton + id + ']'));
    forEach(skeletons, (el: Element) => el.removeAttribute(Constants.skeleton));
  }
}
