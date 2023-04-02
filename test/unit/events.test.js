import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../index';

describe('Standard events', () => {
  let context;
  let compiler;

  describe('When compiled with a standard event', () => {
    it('Removes on:click event attr after compilation', () => {
      const htmlSnippet = '<button on:click="click">Click</button>';
      const element = toHtml(htmlSnippet);

      context = Bouer.create();
      compiler = IoC.app(context).resolve(Compiler);

      context.set({ click() { } });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect('on:click' in el.attributes).toBe(false);
        }
      });
    });

    it('Calls on:click callback function when clicked', () => {
      const htmlSnippet = '<button on:click="click">Click</button>';
      const element = toHtml(htmlSnippet);

      const click = jest.fn();
      context.set({ click });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          el.click();
          el.click();
          expect(click).toHaveBeenCalledTimes(2);
        }
      });
    });

    it('Calls on:click once if "once" modifier was defined', () => {
      const htmlSnippet = '<button on:click.once="click">Click</button>';
      const element = toHtml(htmlSnippet);

      context = Bouer.create();
      compiler = IoC.app(context).resolve(Compiler);

      const click = jest.fn();
      context.set({ click });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          el.click();
          el.click();
          expect(click).toHaveBeenCalledTimes(1);
        }
      });
    });
  });

  describe('When compiled with a custom event', () => {
    it('Removes on:mycustom event attr after compilation', () => {
      const htmlSnippet = '<p on:mycustom="mycustom">...</p>';
      const element = toHtml(htmlSnippet);

      context = Bouer.create();
      compiler = IoC.app(context).resolve(Compiler);

      context.set({ mycustom() { } });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect('on:mycustom' in el.attributes).toBe(false);
        }
      });
    });

    it('Calls on:mycustom callback function when dispatch', () => {
      const htmlSnippet = '<p on:mycustom="callback">...</p>';
      const element = toHtml(htmlSnippet);

      context = Bouer.create();
      compiler = IoC.app(context).resolve(Compiler);

      const callback = jest.fn();
      context.set({ callback });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          context.emit('mycustom');
          context.emit('mycustom');
          expect(callback).toHaveBeenCalledTimes(2);
        }
      });
    });

    it('Calls on:mycustom once if "once" modifier was defined', () => {
      const htmlSnippet = '<p on:mycustom.once="callback">...</p>';
      const element = toHtml(htmlSnippet);

      context = Bouer.create();
      compiler = IoC.app(context).resolve(Compiler);

      const callback = jest.fn();
      context.set({ callback });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          context.emit('mycustom');
          context.emit('mycustom');
          expect(callback).toHaveBeenCalledTimes(1);
        }
      });
    });
  });
});