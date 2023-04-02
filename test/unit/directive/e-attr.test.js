import {
  Bouer,
  Compiler,
  sleep,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "e-[attr]" directive', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        value: 'value-rendered',
        isVisible: true,
        classList: {
          'loading': true,
          'is-green': true,
          'rounded-border': true
        }
      }
    });
    compiler = IoC.app(context).resolve(Compiler);
  });

  // Normal rendering
  describe('On e-title render', () => {
    const htmlSnippet = '<h4 e-title="{{ value }}">Value</h4>';

    it('Creates `title` attribute and rendered the value', () => {
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

    it('Removes `e-title` attribute', () => {
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect(el.hasAttribute('e-title')).toBe(false);
        }
      });
    });
  });

  // Object literal rendering
  describe('On e-class render with Object Literal', () => {
    it('Creates `class` attribute, add the className and removes if the value change', async () => {
      const htmlSnippet = '<h4 e-class="{ \'visible\': isVisible  }">Value</h4>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect(el.getAttribute('class')).toBe('visible');
        }
      });

      await sleep(5);
      context.data.isVisible = false;

      await sleep(5);
      expect('class' in element.attributes).toBe(false);
    });

    it('Adds to `classList` and removes if the value change', async () => {
      const htmlSnippet = '<h4 class="green" e-class="{ \'visible\': isVisible  }">Value</h4>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect(el.classList.contains('green')).toBe(true);
          expect(el.classList.contains('visible')).toBe(true);
        }
      });

      await sleep(5);
      context.data.isVisible = false;

      await sleep(5);
      expect(element.classList.contains('green')).toBe(true);
      expect(element.classList.contains('visible')).toBe(false);
    });

    it('Removes `e-class` attribute', () => {
      const htmlSnippet = '<h4 e-class="{ \'visible\': isVisible  }">Value</h4>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect(el.hasAttribute('e-class')).toBe(false);
        }
      });
    });
  });

  // Reactive object rendering
  describe('On e-class render with reactive object', () => {
    const htmlSnippet = '<h4 e-class="classList">Value</h4>';

    it('Creates "class" attribute, add the classNames and remove each class on change', async () => {
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect(el.hasAttribute('class')).toBe(true);
        }
      });

      const classes = ['loading', 'is-green', 'rounded-border'];

      // Check if all the classNames are in the class attribute
      for (const cls of classes) {
        expect(element.classList.contains(cls)).toBe(true);
      }

      // Removes classes one by one and check if it was really removed
      for (const cls of classes) {
        context.data.classList[cls] = false;
        await sleep(5);
        expect(element.classList.contains(cls)).toBe(false);
      }

      // After all, remove the as well
      expect('class' in element.attributes).toBe(false);
    });

    it('Removes "e-class" attribute', () => {
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect(el.hasAttribute('e-class')).toBe(false);
        }
      });
    });
  });
});