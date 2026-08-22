import { on } from 'events';
import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When "Compiler.compile" method is called', () => {
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

    compiler = IoC.app(context).resolve(Compiler);
    element = toHtml(htmlSnippet);
  });
  it('Compiles the element according to the "data" provided', () => {
    const callback = jest.fn();

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: el => {
        expect(el.textContent).toContain('Printed');
        callback();
      }
    });

    expect(callback).toHaveBeenCalled();
  });
});

describe('When "Compiler.analize" method is called', () => {
  let context = Bouer.create();
  let compiler = IoC.app(context).resolve(Compiler);

  it('Return "true" if the htmlSnippet is valid', () => {

    let result = compiler.analize(`
      <div class="header">
        <span>
          <a :href="/home">Home</a> &nbsp;
          <a :href="/about">About</a> &nbsp;
          <a :href="/contact">Contact</a>
        </span>
      </div>
    `);

    expect(result).toBe(true);
  });

  it('Compiles the element according to the "data" provided', () => {
    const logger = jest.spyOn(console, 'error');

    const result = compiler.analize(
`<div class="header">
  <span>
    <a :href="/home">Home</a> &nbsp;
    <a :href="/about">About</a> &nbsp;
    <a :href="/contact">Contact
  </span>
</div>`
);

    expect(result).toBe(false);
    expect(logger).toHaveBeenCalled();
    expect(logger.mock.calls[0][1]).toContain('Syntax Error');
  });
});