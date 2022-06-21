import {
  Bouer,
  Compiler,
  toHtml
} from '../../index';

describe('When element is compiled with "{attr}" directive (ShortHand Directive)', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        title: 'value-rendered',
      }
    });
    compiler = new Compiler(context);
  });

  const htmlSnippet = '<h4 {title}>Value</h4>';

  it('Creates "title" attribute and rendered the value', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.getAttribute('title')).toBe('value-rendered');
      }
    });
  });

  it('Removes "{title}" attribute', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.hasAttribute('{title}')).toBe(false);
      }
    });
  });
});