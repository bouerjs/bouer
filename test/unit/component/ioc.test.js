import {
  Bouer,
  Compiler,
  Component,
  toHtml,
  IoC,
  $inert
} from '../../index.js';

describe('Dependency Injection - IoC Container', () => {

  class WebClient {
    constructor(url) {
      this.url = url;
    }

    url = null;
  }

  class CustomComponent extends Component {
    webClient = $inert();

    constructor(webClient) {
      super({
        template: '<h1>Testing...</h1>',
      });

      this.webClient = webClient;
    }
  }

  it('Fail to inject the dependency if none of them are registered', async () => {
    const htmlSnippet = `
    <div id="app">
      <CustomComponent></CustomComponent>
    </div>`;
    const element = toHtml(htmlSnippet);

    const context = Bouer.create({
      components: [CustomComponent]
    });

    const compiler = IoC.app(context).resolve(Compiler);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: () => {
        const customComponent = context.$components.viewByName(CustomComponent.name)[0];
        expect(customComponent.webClient).toBe(undefined);
      }
    });
  });

  it('Fail to inject the dependency if only the `WebClient` is registered, and not the `CustomComponent`', async () => {
    const htmlSnippet = `
    <div id="app">
      <CustomComponent></CustomComponent>
    </div>`;
    const element = toHtml(htmlSnippet);

    const context = Bouer.create({
      components: [CustomComponent],
      mounted: function () {
        IoC.app(this).add(WebClient, ['http://localhost:5000/api']);
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: () => {
        const customComponent = context.$components.viewByName(CustomComponent.name)[0];
        expect(customComponent.webClient).toBe(undefined);
      }
    });
  });

  it('Injects the dependency as expected if boths the `CustomComponent` and `webClient` is registered as dependency', async () => {
    const htmlSnippet = `
    <div id="app">
      <CustomComponent></CustomComponent>
    </div>`;
    const element = toHtml(htmlSnippet);

    const context = Bouer.create({
      components: [CustomComponent],
      mounted: function () {
        IoC.app(this).add(WebClient, ['http://localhost:5000/api']);
        IoC.app(this).add(CustomComponent, [WebClient]);
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: () => {
        const customComponent = context.$components.viewByName(CustomComponent.name)[0];
        expect(customComponent.webClient).toBeInstanceOf(WebClient);
      }
    });
  });

  it('Also injects the dependency as expected if `webClient` is registered global as dependency', async () => {
    const htmlSnippet = `
    <div id="app">
      <CustomComponent></CustomComponent>
    </div>`;
    const element = toHtml(htmlSnippet);

    const context = Bouer.create({
      components: [CustomComponent],
      mounted: function () {
        // Global Dependency
        IoC.add(WebClient, ['http://localhost:5000/api']);

        // Instance Dependency
        IoC.app(this).add(CustomComponent, [WebClient]);
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);

    await compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onComponentLoad: () => {
        const customComponent = context.$components.viewByClass(CustomComponent)[0];
        expect(customComponent.webClient).toBeInstanceOf(WebClient);
      }
    });
  });
});