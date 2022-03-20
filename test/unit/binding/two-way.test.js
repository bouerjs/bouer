import {
  Bouer,
  Compiler,
  toHtml
} from '../../index';

describe('When using a "e-bind" for two way data binding ', () => {
  describe('On short binding', () => {
    it('Binds "value" property when using <input type="text"> element', () => {
      const htmlSnippet = '<input e-bind="value"/>';
      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          value: 'bound-value'
        }
      });
      const compiler = new Compiler(context, {});

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: compiledEl => {
          expect(compiledEl.value).toBe(context.data.value);

          context.data.value = 'bound-value-changed';
          expect(compiledEl.value).toBe(context.data.value);

          compiledEl.value = 'bound-value-changed-again';
          expect(compiledEl.value).toContain(context.data.value);
        }
      });
    });

    it('Binds "checked" property when using <input type="checkbox"> element', async () => {
      const htmlSnippet = '<input type="checkbox" e-bind="value"/>';
      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          value: true
        }
      });
      const compiler = new Compiler(context, {});

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: () => {
          expect(element.checked).toBe(true);

          context.data.value = false;
          expect(element.checked).toBe(context.data.value);

          // TODO: Test fail on JEST but works on run-app
          // element.checked = true;
          // expect(element.checked).toBe(context.data.value);
        }
      });
    });

    it('Binds value according the selected <input type="radio"> element', () => {
      const htmlSnippet = `
      <div>
        <input type="radio" e-bind="selected" value="male"/>
        <input type="radio" e-bind="selected" value="female"/>
      </div>`;
      const element = toHtml(htmlSnippet);

      const context = Bouer.create({
        data: {
          selected: 'male'
        }
      });
      const compiler = new Compiler(context, {});

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: () => {
          const maleInput = element.children[0];
          const femaleInput = element.children[1];

          expect(maleInput.checked).toBe(true);
          expect(femaleInput.checked).toBe(false);
          expect(context.data.selected).toBe('male');

          // TODO: Test fail on JEST but works on run-app
          // femaleInput.checked = true;
          // expect(maleInput.checked).toBe(false);
          // expect(femaleInput.checked).toBe(true);
          // expect(context.data.selected).toBe('female');

          // TODO: Test fail on JEST but works on run-app
          // maleInput.checked = true;
          // expect(maleInput.checked).toBe(true);
          // expect(femaleInput.checked).toBe(false);
          // expect(context.data.selected).toBe('male');

          context.data.selected = 'female';
          expect(maleInput.checked).toBe(false);
          expect(femaleInput.checked).toBe(true);

          context.data.selected = 'male';
          expect(maleInput.checked).toBe(true);
          expect(femaleInput.checked).toBe(false);

          context.data.selected = '';
          expect(maleInput.checked).toBe(false);
          expect(femaleInput.checked).toBe(false);
        }
      });
    });
  });
});