import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

import {
  Component,
  ViewChild
} from '../../../src/index';
import Ref from '../../../src/core/reactive/Ref';

describe('Customize Component (extends)', () => {
  it('Component methods are reached with "this" keyword', () => {
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
      components: [ButtonComponent],
    });
    const compiler = IoC.app(context).resolve(Compiler);

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

  it('Component properties are reactive if used the Ref class', () => {
    class InputComponent extends Component {
      name = 'InputComponent';
      text = new Ref('<empty>');

      constructor() {
        super({
          template: '<input e-bind="this.text"/>'
        });
      }
    }

    class ButtonComponent extends Component {
      name = 'ButtonComponent';
      count = new Ref(0);

      constructor() {
        super({
          template: '<button on:click="this.click">Clicked: {{ this.count }}</button>'
        });
      }

      click() {
        this.count.set(
          this.count.get() + 1
        );
      }
    }

    const htmlSnippet = `
    <div>
      <InputComponent></InputComponent>
      <ButtonComponent></ButtonComponent>
    </div>`;
    const element = toHtml(htmlSnippet);
    const context = Bouer.create({
      components: [
        InputComponent,
        ButtonComponent
      ],
    });
    const compiler = IoC.app(context).resolve(Compiler);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    const inputComponentInstance = ViewChild.byName(context, InputComponent.name)[0];

    // Checking the values in
    expect(inputComponentInstance.text.get()).toBe('<empty>');
    expect(element.children[1].textContent).toBe('Clicked: 0');

    const input = element.children[0];
    const btn = element.children[1];

    // Updating the inputs
    input.value = 'Input Value Changed';
    input.dispatchEvent(new Event('input'));
    btn.click();

    // Checking the values
    expect(input.value).toBe(inputComponentInstance.text.get());
    expect(btn.textContent).toBe('Clicked: 1');
  });
});