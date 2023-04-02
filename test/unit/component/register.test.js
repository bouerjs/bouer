import {
  Bouer,
  Compiler,
  sleep,
  toHtml,
  IoC
} from '../../index';

describe('When using "e-entry" directive', () => {
  it('Copies/Register the element with the directive', () => {
    const htmlSnippet = `
    <div>
      <label e-entry="copied-el">Element</label>
    </div>`;
    const context = Bouer.create();
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: () => {
        expect(context.$components.get('copied-el')).toBeDefined();
      }
    });
  });
  it('Paste/Insert the element (component) at the requested position', async () => {
    const htmlSnippet = `
    <div>
      <label e-entry="copied-el">Element</label>
      <copied-el></copied-el>
    </div>`;
    const context = Bouer.create();
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element
    });

    await sleep(5);
    const copiedEl = element.children[1];

    expect(copiedEl.tagName).toBe('LABEL');
    expect(copiedEl.tagName).not.toBe('COPIED-EL');
    expect(copiedEl.innerHTML).toBe('Element');
  });
});

describe('When added to the instance component options', () => {
  it('Warns when extends component and do not provide a "name" and "path"', () => {
    const fn = console.warn;
    console.warn = jest.fn();

    Bouer.create({
      components: [{
        template: '<div>Element</div>'
      }],
    });

    expect(console.warn.mock.calls[0][1]).toBe('Provide a “name” to component at options.components[0] position.');
    console.warn = fn;
  });
  it('Register the component with "template" property', () => {
    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: '<div>Element</div>'
      }]
    });

    expect(context.$components.get('my-component')).toBeDefined();
  });
  it('Insert the element (component) at the requested position', async () => {
    const htmlSnippet = `
    <div>
      <my-component></my-component>
    </div>`;
    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: '<div>Element</div>'
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(5);
    const copiedElComponent = context.$components.get('my-component');
    const componentEl = element.children[0];

    expect(componentEl.tagName).toBe('DIV');
    expect(componentEl.outerHTML.trim()).toBe(copiedElComponent.template.trim());
  });
});

describe('When using the component options', () => {
  it('Inject "data" if provided in the options', async () => {
    const htmlSnippet = `
    <div>
      <my-component></my-component>
    </div>`;
    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: '<div>{{ value }}</div>',
        data: {
          value: 'Compiled value'
        }
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(5);
    const componentEl = element.children[0];
    expect(componentEl.textContent).toContain('Compiled value');
  });
  it('Fires the hooks if provided in the options', async () => {
    const htmlSnippet = `
    <div>
      <my-component></my-component>
    </div>`;

    const created = jest.fn();
    const beforeMount = jest.fn();
    const mounted = jest.fn();
    const beforeLoad = jest.fn();
    const loaded = jest.fn();
    const beforeDestroy = jest.fn();
    const destroyed = jest.fn();
    let component;

    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: '<div>Element</div>',
        created,
        beforeMount,
        loaded: function () {
          loaded();
          component = this;
        },
        mounted,
        beforeLoad,
        beforeDestroy,
        destroyed
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(5);
    expect(created).toHaveBeenCalled();
    expect(beforeMount).toHaveBeenCalled();
    expect(mounted).toHaveBeenCalled();
    expect(beforeLoad).toHaveBeenCalled();
    expect(loaded).toHaveBeenCalled();

    component.destroy();

    expect(beforeDestroy).toHaveBeenCalled();
    expect(destroyed).toHaveBeenCalled();
  });
});

describe('When using the component <script>', () => {
  it('Executes script tags if exists', async () => {
    const htmlSnippet = `
    <div>
      <my-component></my-component>
    </div>`;
    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: `
        <div>Element</div>
        <script>
          console.log('Script executed');
        </script>`,
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    const log = console.log;
    console.log = jest.fn();

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(5);
    expect(console.log).toHaveBeenCalled();
    expect(console.log.mock.calls[0][0]).toBe('Script executed');
    console.log = log;
  });
  it('Adds hooks to component instance when using "this.on(...)" method', async () => {
    const htmlSnippet = `
    <div>
      <my-component></my-component>
    </div>`;

    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: `
        <div>Element</div>
        <script>
          this.on('mounted', () => console.log('mounted'))
        </script>`,
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);
    const log = console.log;
    console.log = jest.fn();

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(5);
    expect(console.log.mock.calls[0][0]).toBe('mounted');
    console.log = log;
  });
  it('Exports "data" the component element when using "this.export(...)" method', async () => {
    const htmlSnippet = `
    <div>
      <my-component></my-component>
    </div>`;

    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: `
        <div>{{ value }}</div>
        <script>
          this.export({
            value: 'exported-value'
          })
        </script>`,
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(5);
    expect(element.children[0].textContent).toContain('exported-value');
  });
});

describe('When using component slots', () => {
  it('Injects the component "body" when using <slot default>', async () => {
    const htmlSnippet = `
    <div>
      <my-component>
        <label>Injected</label>
      </my-component>
    </div>`;
    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: `
        <div>
          <slot default></slot>
        </div>`,
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element
    });

    await sleep(5);
    expect(element.children[0].innerHTML).toContain('Injected');
  });
  it('Injects the element <el slot="..."> body in component body to target <slot name="...">', async () => {
    const htmlSnippet = `
    <div>
      <my-component>
        <span slot="target-1">
          <label>Injected-target-1</label>
        </span>
        <span slot="target-2">
          <label>Injected-target-2</label>
        </span>
      </my-component>
    </div>`;
    const context = Bouer.create({
      components: [{
        name: 'my-component',
        template: `
        <div>
          <slot name="target-1"></slot>
          <slot name="target-2"></slot>
        </div>`,
      }]
    });
    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
    });

    await sleep(5);
    const child = element.children[0];

    expect(child.tagName).toBe('DIV');
    expect(child.tagName).not.toBe('MY-COMPONENT');

    const span1 = child.children[0];
    const span2 = child.children[1];

    expect(span1.tagName).toBe('SPAN');
    expect(span2.tagName).toBe('SPAN');

    expect('slot' in span1.attributes).toBe(false);
    expect('slot' in span2.attributes).toBe(false);

    expect(span1.textContent).toContain('Injected-target-1');
    expect(span2.textContent).toContain('Injected-target-2');
  });
  it('Injects and replace the element <slot slot="..."> body in component body to target <slot name="...">',
    async () => {
      const htmlSnippet = `
    <div>
      <my-component>
        <slot slot="target-1">
          <label>Injected-target-1</label>
        </slot>
        <slot slot="target-2">
          <label>Injected-target-2</label>
        </slot>
      </my-component>
    </div>`;
      const context = Bouer.create({
        components: [{
          name: 'my-component',
          template: `
        <div>
          <slot name="target-1"></slot>
          <slot name="target-2"></slot>
        </div>`,
        }]
      });
      const compiler = IoC.app(context).resolve(Compiler);
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
      });

      await sleep(5);
      const child = element.children[0];

      expect(child.tagName).toBe('DIV');
      expect(child.tagName).not.toBe('MY-COMPONENT');

      const label1 = child.children[0];
      const label2 = child.children[1];

      expect(label1.tagName).toBe('LABEL');
      expect(label2.tagName).toBe('LABEL');
      expect(label1.textContent).toContain('Injected-target-1');
      expect(label2.textContent).toContain('Injected-target-2');
    });
});