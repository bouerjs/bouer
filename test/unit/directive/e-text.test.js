import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "e-text" directive', () => {
  const context = Bouer.create({
    data: {
      message: 'Hello'
    }
  });
  const compiler = IoC.app(context).resolve(Compiler);

  it('Renders the data property value in the element content', () => {
    const element = toHtml('<h4 e-text="{{ message }}">#</h4>');

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.textContent).toContain('Hello');
      }
    });
  });

  it('Removes the directive after compilation', () => {
    const element = toHtml('<h4 e-text="{{ message }}">#</h4>');

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.hasAttribute('e-text')).toBe(false);
      }
    });
  });
});