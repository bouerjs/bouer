import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../index';

describe('When using a computed property', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        value: 'Printed',
        _valueGet: function $computed() {
          return this.data.value;
        },
        _valuePartialGet: function $computed() {
          return {
            get: () => this.data.value,
          };
        },
        _valuePartialSet: function $computed() {
          return {
            set: (v) => this.data.value = v || ''
          };
        },
        _valueFull: function $computed() {
          return {
            get: () => this.data.value,
            set: (v) => this.data.value = v || ''
          };
        },
      }
    });

    compiler = IoC.app(context).resolve(Compiler);
  });

  describe('When using inferred get', () => {
    it('Renders the value if used in a delimiter', () => {
      const htmlSnippet = '<h1>{{ _valueGet }}</h1>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          expect(el.innerHTML).toContain('Printed');
        }
      });
    });

    it('Keeps UI old state if I try to set it value', () => {
      const htmlSnippet = '<h1>{{ _valueGet }}</h1>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: compiledEl => {
          context.data._valueGet = 'new-value-printed';
          expect(compiledEl.innerHTML).toContain('Printed');
        }
      });
    });
  });

  describe('When using with partial "get" only', () => {
    it('Renders the value if used in a delimiter', () => {
      const htmlSnippet = '<h1>{{ _valuePartialGet }}</h1>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: compiledEl => {
          expect(compiledEl.innerHTML).toContain('Printed');
        }
      });
    });

    it('Keeps UI old state if I try to set it value', () => {
      const htmlSnippet = '<h1>{{ _valuePartialGet }}</h1>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: compiledEl => {
          context.data._valuePartialGet = 'new-value-printed';
          expect(compiledEl.innerHTML).toContain('Printed');
        }
      });
    });
  });

  describe('When using with partial `set` only', () => {
    it('Changes the source property value and UI if I try to set it value', () => {
      const htmlSnippet = '<h1>{{ value }}</h1>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: compiledEl => {
          context.data._valuePartialSet = 'new-value-printed';
          expect(compiledEl.innerHTML).toContain('new-value-printed');
        }
      });
    });
  });

  describe('When using full definition `get` and `set`', () => {
    it('Renders the value if used in a delimiter', () => {
      const htmlSnippet = '<h1>{{ _valueFull }}</h1>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: compiledEl => {
          expect(compiledEl.innerHTML).toContain('Printed');
        }
      });
    });

    it('Changes UI state if I set it value', () => {
      const htmlSnippet = '<h1>{{ _valueFull }}</h1>';
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: compiledEl => {
          context.data._valueFull = 'new-value-printed';
          expect(compiledEl.innerHTML).toContain('new-value-printed');
        }
      });
    });
  });
});