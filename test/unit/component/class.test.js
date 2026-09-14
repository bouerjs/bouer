import {
  Bouer,
  Compiler,
  toHtml,
  IoC,
  $inert,
  prop
} from '../../index.js';

import {
  Component,
  ViewChild
} from '../../../src/index';

describe('Customize Component (extends)', () => {
  it('Component properties and methods are reached without "this" keyword', async () => {
    class ButtonComponent extends Component {
      constructor() {
        super({
          template: '<button on:click="click">{{ text }}</button>'
        });
      }

      text = 'Submit Buttom';

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
    const logger = jest.spyOn(console, 'log').mockImplementation(() => {});
    const compiler = IoC.app(context).resolve(Compiler);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: () => {
        const btn = element.children[0];

        btn.click();

        expect(logger).toHaveBeenCalledWith('Clicked');
        logger.mockRestore();
      }
    });

  });

  it('Component properties are reactive after the component is created', async () => {
    class InputComponent extends Component {
      text = '<empty>';

      constructor() {
        super({
          template: '<input e-bind="text"/>'
        });
      }
    }

    class ButtonComponent extends Component {
      count = 0;

      constructor() {
        super({
          template: '<button on:click="click">Clicked: {{ count }}</button>'
        });
      }


      click() {
        this.count++;
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

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: (el) => {
        const inputComponentInstance = ViewChild.byName(context, InputComponent.name)[0];

        // Checking the values in
        expect(inputComponentInstance.text).toBe('<empty>');
        expect(element.children[1].textContent).toBe('Clicked: 0');

        const input = element.children[0];
        const btn = element.children[1];

        // Updating the inputs
        input.value = 'Input Value Changed';
        input.dispatchEvent(new Event('input'));
        btn.click();

        // Checking the values
        expect(input.value).toBe(inputComponentInstance.text);
        expect(btn.textContent).toBe('Clicked: 1');
      }
    });
  });

  it('Component $inert properties are not reactive and accessable passing in InertVariable class', async () => {
    class InputComponent extends Component {
      label = $inert('Full Name');
      text = '<empty>';

      constructor() {
        super({
          template: `
            <div class="input-field">
              <label for="name">{{ label }}</label>
              <input id="name" e-bind="text"/>
            </div>
          `
        });
      }
    }

    const htmlSnippet = `
    <div class="form">
      <InputComponent></InputComponent>
    </div>`;
    const element = toHtml(htmlSnippet);
    const context = Bouer.create({
      components: [InputComponent],
    });
    const compiler = IoC.app(context).resolve(Compiler);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: (el) => {
        const inputComponentInstance = ViewChild.byName(context, InputComponent.name)[0];

        // Checking the values in
        expect(inputComponentInstance.label).toBe(el.querySelector('label').textContent);
        expect(inputComponentInstance.text).toBe(el.querySelector('input').value);

        inputComponentInstance.label = 'New Label';
        inputComponentInstance.text = 'New Value';

        // Checking the values
        expect(el.querySelector('label').textContent).toBe('Full Name');
        expect(el.querySelector('input').value).toBe('New Value');
        expect(inputComponentInstance.text).toBe(el.querySelector('input').value);
      }
    });
  });

  it('Component `prop` properties are extracted from the data', async () => {
    class InputComponent extends Component {
      label = prop.required();
      text = prop.optional('');

      constructor() {
        super({
          template: `
            <div class="input-field">
              <label for="name">{{ label }}</label>
              <input id="name" e-bind="text"/>
            </div>
          `
        });
      }
    }

    const htmlSnippet = `
    <div class="form">
      <InputComponent data="{ label: 'Full Name' }"></InputComponent>
    </div>`;
    const element = toHtml(htmlSnippet);
    const context = Bouer.create({
      components: [InputComponent],
    });
    const compiler = IoC.app(context).resolve(Compiler);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: (el) => {
        const inputComponentInstance = ViewChild.byClass(context, InputComponent)[0];

        // Checking the values in
        expect(inputComponentInstance.label).toBe('Full Name');
        expect(inputComponentInstance.label).toBe(el.querySelector('label').textContent);
        expect(inputComponentInstance.text).toBe('');

        inputComponentInstance.label = 'New Label';
        inputComponentInstance.text = 'New Value';

        // Checking the values
        expect(el.querySelector('label').textContent).toBe('New Label');
        expect(el.querySelector('input').value).toBe('New Value');
        expect(inputComponentInstance.text).toBe(el.querySelector('input').value);
      }
    });
  });

  it('Log error if `prop.required` property is not found in data', async () => {
    class InputComponent extends Component {
      label = prop.required();
      text = prop.optional('');

      constructor() {
        super({
          template: `
            <div class="input-field">
              <label for="name">{{ label }}</label>
              <input id="name" e-bind="text"/>
            </div>
          `
        });
      }
    }

    const htmlSnippet = `
    <div class="form">
      <InputComponent></InputComponent>
    </div>`;
    const element = toHtml(htmlSnippet);
    const context = Bouer.create({
      components: [InputComponent],
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: (el) => {
        const inputComponentInstance = ViewChild.byClass(context, InputComponent)[0];

        expect(inputComponentInstance.label).toBeUndefined();
        expect(logger.mock.calls[0][1]).toBe('The property “label” is required, please inject it via data directive.');
        logger.mockRestore();
      }
    });
  });
});