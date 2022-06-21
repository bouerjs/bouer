import {
  Bouer,
  Compiler,
  // sleep,
  toHtml
} from '../../index';

import {
  Component
} from '../../../src/index';

describe('Customize Component (extends)', () => {
  it('Warns when extends component and do not provide a "name" and "path"', () => {
    class ButtonComponent extends Component {
      constructor() {
        super({
          template: '<button>Custom Component</button>'
        });
      }
    }

    const fn = console.warn;
    console.warn = jest.fn();

    Bouer.create({
      components: [new ButtonComponent()],
    });

    expect(console.warn.mock.calls[0][1]).toBe('Provide a “name” to component at options.components[0] position.');
    console.warn = fn;
  });
  it('Component methods are reached with "this" keyword', async () => {
    class ButtonComponent extends Component {
      name = 'ButtonComponent';

      constructor() {
        super({
          template: '<button on:click="this.click">Custom Component</button>'
        });
      }

      click() {
        console.log('Clicked');
      }
    }

    const htmlSnippet = `
    <div>
      <ButtonComponent></ButtonComponent>
    </div>`;
    const element = toHtml(htmlSnippet);
    const context = Bouer.create({
      components: [new ButtonComponent()],
    });
    const compiler = new Compiler(context);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    const fn = console.log;
    console.log = jest.fn();
    const btn = element.children[0];
    btn.click();

    expect(console.log.mock.calls[0][0]).toBe('Clicked');
    console.log = fn;
  });
});