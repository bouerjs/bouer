import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "wait-data" directive', () => {
  describe('And data is not provided yet', () => {
    const context = Bouer.create();
    const compiler = IoC.app(context).resolve(Compiler);

    it('Keeps the origin state of the element unitil a data is provided', () => {
      const element = toHtml(`
      <div wait-data="wait-key">
        <h4> {{ value }} </h4>
      </div>`);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onComponentLoad: el => {
          expect(element.innerHTML).toContain('{{ value }}');

          context.$wait.set('wait-key', {
            value: 'waited value'
          });

          expect(element.innerHTML).toContain('waited value');
        }
      });
    });
  });

  describe('And data is already provided', () => {
    const context = Bouer.create();
    const compiler = IoC.app(context).resolve(Compiler);

    it('Compiles the elements right away', () => {
      const element = toHtml(`
      <div wait-data="wait-key">
        <h4> {{ value }} </h4>
      </div>`);

      context.$wait.set('wait-key', {
        value: 'waited value'
      });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onComponentLoad: el => {
          expect(element.innerHTML).not.toContain('{{ value }}');
          expect(element.innerHTML).toContain('waited value');
        }
      });
    });
  });
});