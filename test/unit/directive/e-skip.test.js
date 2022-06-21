import {
  Bouer,
  Compiler,
  sleep,
  toHtml
} from '../../index';

describe('When element is compiled with "e-skip" directive', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        value: 'value-rendered'
      }
    });
    compiler = new Compiler(context);
  });

  const htmlSnippet = '<h4 e-skip>{{ value }}</h4>';

  it('Ignore the element compilation', async () => {
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.textContent).toContain('{{ value }}');
      }
    });

    await sleep(5);
    expect(element.textContent).toContain('{{ value }}');
  });
});