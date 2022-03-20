import {
  Bouer,
  Compiler,
  sleep,
  toHtml
} from '../../index';

describe('When "compile" method is called', () => {
  const htmlSnippet = '<h1>{{ value }}</h1>';
  let context;
  let compiler;
  let element;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        value: 'Printed'
      }
    });

    compiler = new Compiler(context, {});
    element = toHtml(htmlSnippet);
  });
  it('Compiles the element according to the "data" provided', async () => {
    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(1);
    expect(element.textContent).toContain('Printed');
  });

  it('Runs "onDone" function when it\'s done', () => {
    const callback = jest.fn();

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: callback
    });

    expect(callback).toHaveBeenCalled();
  });
});