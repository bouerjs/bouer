import {
  Bouer,
  Compiler,
  toHtml,
  IoC,
  sleep
} from '../../index';

describe('When element is compiled with "e-put" directive', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        tabValue: ''
      },
      components: [
        {
          name: 'component-a',
          template: '<div>Component A</div>'
        },
        {
          name: 'component-b',
          template: '<div>Component B</div>'
        },
      ]
    });

    compiler = IoC.app(context).resolve(Compiler);
  });

  const htmlSnippet = '<div e-put="tabValue"></div>';

  it('Throws an error if the form entry (e-put) has invalid value in html', async () => {
    let htmlSnippet = toHtml(`<div e-put></div>`);

    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});

    await compiler.compile({
      data: context.data,
      context: context,
      el: htmlSnippet,
      onComponentLoad: el => {
        expect(logger).toHaveBeenCalled();
        logger.mockRestore();
      }
    });
  });

  it('Throws an error if the form entry (e-put) has invalid value', () => {
    const htmlSnippet = toHtml(`<div e-put="{{ tabValue }}"></div>`);

    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});

    compiler.compile({
      data: context.data,
      context: context,
      el: htmlSnippet,
      onComponentLoad: el => {
        expect(logger).toHaveBeenCalled();
        logger.mockRestore();
      }
    });
  });

  it('Starts with the default component "component-a" injected in the element', async () => {
    const element = toHtml(htmlSnippet);
    context.data.tabValue = 'component-a';

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: el => {

        expect(element.innerHTML).toContain('Component A');
        context.data.tabValue = 'component-b';
        expect(element.innerHTML).toContain('Component B');
        context.data.tabValue = '';
        expect(element.innerHTML).toBe('');
      }
    });

  });

  it('Starts with the empty element if the value is empty', async () => {
    const element = toHtml(htmlSnippet);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: el => {
        expect(element.innerHTML).toBe('');
      }
    });
  });
});