import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "e-show" directive', () => {
  const htmlSnippet = `
  <div class="container">
    <p e-show="see">Visible</p>
  </div>`;

  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        see: false
      }
    });
    compiler = IoC.app(context).resolve(Compiler);
  });

  it('Adds style attribute with "display:none" value', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: el => {
        const child = el.children[0];
        expect(child.classList.contains('style'));
        expect(child.getAttribute('style')).toBe('display: none;');
      }
    });
  });

  it('Removes "display:none" from style attribute value', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: el => {
        context.data.see = true;
        const child = element.children[0];
        expect(child.getAttribute('style')).not.toBe('display: none;');
      }
    });
  });

  it('Removes the directive after compilation', () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: el => {
        const child = el.children[0];
        expect(child.hasAttribute('e-show')).toBe(false);
      }
    });
  });
});