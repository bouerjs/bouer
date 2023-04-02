import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "e-def" directive', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create();
    compiler = IoC.app(context).resolve(Compiler);
  });

  const htmlSnippet = '<h4 e-def="{ prop: \'new\' }"></h4>';

  it('Adds property to the current scope', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect('prop' in context.data).toBe(true);
      }
    });
  });

  it('Added properties have the exact value', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: _ => {
        expect(context.data.prop).toEqual('new');
      }
    });
  });

  it('Removes the directive after compilation', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.hasAttribute('e-def')).toBe(false);
      }
    });
  });
});