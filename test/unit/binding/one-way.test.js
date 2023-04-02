import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When using a delimiter "{{ ... }}" for one way data binding', () => {
  const context = Bouer.create({
    data: {
      value: 'Printed'
    }
  });

  const compiler = IoC.app(context).resolve(Compiler);

  it('Render the property in Element <h1> content', () => {
    const htmlSnippet = '<h1>{{ value }}</h1>';
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.textContent).toContain('Printed');
      }
    });
  });
});