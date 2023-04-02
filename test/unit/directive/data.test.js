import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "data" directive', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        message: 'hello from bouer',
        layer: {
          message: 'bouer is cool'
        }
      }
    });

    compiler = IoC.app(context).resolve(Compiler);
  });

  it('Injects the data provided', () => {
    const element = toHtml(`
    <div data="{ value: 'hello injected' }">
      <h4> {{ value }} </h4>
    </div>`);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('hello injected');
      }
    });
  });

  it('Injects the root data', () => {
    const element = toHtml(`
    <div data>
      <h4> {{ message }} </h4>
    </div>`);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('hello from bouer');
      }
    });
  });

  it('Mix and inject data', () => {
    const element = toHtml(`
    <div data="$mixin({ name: 'bouer' }, { autor: 'AfonsoMatElias' })">
      <h4> {{ name }}, Creator: {{ autor }} </h4>
    </div>`);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('bouer, Creator: AfonsoMatElias');
      }
    });
  });

  it('Mix and inject with current data', () => {
    const element = toHtml(`
    <div data="layer">
      <div data="$mixin($data, { emoji: '🤙' })">
        <h4> {{ message }} {{ emoji }}  </h4>
      </div>
    </div>`);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('bouer is cool 🤙');
      }
    });
  });

  it('Mix and inject with root data', () => {
    const element = toHtml(`
    <div data="layer">
      <div data="$mixin($root, { emoji: '🤙' })">
        <h4> {{ message }} {{ emoji }}  </h4>
      </div>
    </div>`);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('hello from bouer 🤙');
      }
    });
  });
});