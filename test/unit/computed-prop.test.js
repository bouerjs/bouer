import {
  Bouer,
  Compiler,
  toHtml,
  Computed,
  IoC,
  $computed,
  Component,
  ViewChild
} from '../index';


describe('When using a computed property', () => {

  describe('When using function $computed approach', () => {
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
      it('Renders the value when used in a delimiter', () => {
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
      it('Renders the value when used in a delimiter', () => {
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
      it('Renders the value when used in a delimiter', () => {
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

  describe('When using class approach', () => {
    let context;
    let compiler;

    beforeEach(() => {
      context = Bouer.create({
        data: {
          value: 'Printed',

          _valueFn: new Computed(function () {
            return this.data.value;
          }),

          _valueObj: new Computed({
            get: function () {
              return this.data.value;
            },
            set: function (v) {
              this.data.value = v || '';
            }
          }),

          _valueFnGetSet: new Computed(function () {
            return {
              get: function () {
                return this.data.value;
              },
              set: function (v) {
                this.data.value = v || '';
              }
            };
          })
        }
      });

      compiler = IoC.app(context).resolve(Compiler);
    });

    describe('When using function with inferred get', () => {
      it('Renders the value when used in a delimiter', () => {
        const htmlSnippet = '<h1>{{ _valueFn }}</h1>';
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
        const htmlSnippet = '<h1>{{ _valueFn }}</h1>';
        const element = toHtml(htmlSnippet);

        compiler.compile({
          data: context.data,
          context: context,
          el: element,
          onDone: compiledEl => {
            context.data._valueFn = 'new-value-printed';
            expect(compiledEl.innerHTML).toContain('Printed');
          }
        });
      });
    });

    describe('When using an object definition with `get` and `set`', () => {
      it('Renders the value when used in a delimiter', () => {
        const htmlSnippet = '<h1>{{ _valueObj }}</h1>';
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
        const htmlSnippet = '<h1>{{ _valueObj }}</h1>';
        const element = toHtml(htmlSnippet);

        compiler.compile({
          data: context.data,
          context: context,
          el: element,
          onDone: compiledEl => {
            context.data._valueObj = 'new-value-printed';
            expect(compiledEl.innerHTML).toContain('new-value-printed');
          }
        });
      });
    });

    describe('When using a function definition returning an object with `get` and `set`', () => {
      it('Renders the value when used in a delimiter', () => {
        const htmlSnippet = '<h1>{{ _valueFnGetSet }}</h1>';
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
        const htmlSnippet = '<h1>{{ _valueFnGetSet }}</h1>';
        const element = toHtml(htmlSnippet);

        compiler.compile({
          data: context.data,
          context: context,
          el: element,
          onDone: compiledEl => {
            context.data._valueFnGetSet = 'new-value-printed';
            expect(compiledEl.innerHTML).toContain('new-value-printed');
          }
        });
      });
    });
  });

  describe('When using in a Component', () => {
    describe('When using in data property', () => {
      it('Component properties are reactive when using Computed property', () => {
        class InputComponent extends Component {
          name = 'InputComponent';
          mText = '<empty>';

          data = {
            text: $computed({
              get: () => this.mText,
              set: (v) => this.mText = v
            })
          };

          constructor() {
            super({
              template: '<input e-bind="text"/>'
            });
          }
        }

        const htmlSnippet = `
          <div>
            <InputComponent></InputComponent>
          </div>`;
        const element = toHtml(htmlSnippet);
        const context = Bouer.create({
          components: [
            InputComponent
          ],
        });

        const compiler = IoC.app(context).resolve(Compiler);

        compiler.compile({
          data: context.data,
          context: context,
          el: element,
        });

        const inputComponentInstance = ViewChild.byName(context, InputComponent.name)[0];

        // Checking the values in
        expect(inputComponentInstance.data.text).toBe('<empty>');

        const input = element.children[0];

        // Updating the inputs
        input.value = 'Input Value Changed';
        input.dispatchEvent(new Event('input'));

        // Checking the values
        expect(input.value).toBe(inputComponentInstance.mText);
        expect(input.value).toBe(inputComponentInstance.data.text);
      });
    });

    describe('When using in instance property', () => {
      it('Component properties are reactive when using Computed property', () => {
        class InputComponent extends Component {
          name = 'InputComponent';
          mText = '<empty>';

          text = $computed({
            get: () => this.mText,
            set: (v) => this.mText = v
          });

          constructor() {
            super({
              template: '<input e-bind="this.text"/>'
            });
          }
        }

        const htmlSnippet = `
          <div>
            <InputComponent></InputComponent>
          </div>`;
        const element = toHtml(htmlSnippet);
        const context = Bouer.create({
          components: [
            InputComponent
          ],
        });

        const compiler = IoC.app(context).resolve(Compiler);


        compiler.compile({
          data: context.data,
          context: context,
          el: element,
        });

        const inputComponentInstance = ViewChild.byName(context, InputComponent.name)[0];

        // Checking the values in
        expect(inputComponentInstance.text.get()).toBe('<empty>');

        const input = element.children[0];

        // Updating the inputs
        input.value = 'Input Value Changed';
        input.dispatchEvent(new Event('input'));

        // Checking the values
        expect(input.value).toBe(inputComponentInstance.mText);
        expect(input.value).toBe(inputComponentInstance.text.get());
      });
    });
  });
});