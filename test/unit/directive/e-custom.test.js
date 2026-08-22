import {
  Bouer,
  Compiler,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "e-[custom]" directive', () => {
  const context = Bouer.create({
    data: {
      value: 'testing...'
    },
    directives: {
      'e-testing-dir': {
        onBind: (node, bindConfig) => {
          bindConfig.parent.textContent = 'Hello from directive: ' + bindConfig.nodeName + ' with value: ' + bindConfig.value;
        },
        onUpdate: (node, bindConfig) => {
          bindConfig.parent.textContent = 'Someone updated me: ' + bindConfig.nodeName + ' new value: ' + bindConfig.value
        }
      }
    }
  });

  const compiler = IoC.app(context).resolve(Compiler);

  it('Compiles the directive and perform the hooks onBind and onUpdate', () => {
    const element = toHtml('<h4 e-testing-dir="{{ value }}">#</h4>');

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: el => {
        expect(el.textContent).not.toContain('#');
        expect(el.textContent).toContain('Hello from directive: e-testing-dir with value: testing...');

        context.data.value = 'updated value';
        expect(el.textContent).toContain('Someone updated me: e-testing-dir new value: updated value');
      }
    });
  });
});