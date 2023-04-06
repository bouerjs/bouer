import {
  Bouer,
  Compiler,
  sleep,
  toHtml,
  IoC
} from '../../index';

describe('When element is compiled with "e-for" directive', () => {
  let context;
  let compiler;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        todos: ['wake up', 'eat', 'code', 'repeat'],
      }
    });
    compiler = IoC.app(context).resolve(Compiler);
  });

  describe('When compiled with no filters', () => {
    const htmlSnippet = `
    <ul class="container">
      <li e-for="todo of todos">{{ todo }}</li>
    </ul>`;
    it('Renders all the items', () => {
      const element = toHtml(htmlSnippet);

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
        onDone: el => {
          for (let i = 0; i < el.children.length; i++) {
            const child = el.children[i];
            const todo = context.data.todos[i];
            expect(child.textContent).toBe(todo);
          }
        }
      });
    });
  });

  describe('When compiled with "where" filters', () => {
    it('Renders all the items according to "where:property"', async () => {
      const htmlSnippet = `
      <ul class="container">
        <li e-for="todo of todos | where:search">{{ todo }}</li>
      </ul>`;
      const element = toHtml(htmlSnippet);

      context.set({
        search: 'a'
      });

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      const data = context.data;

      function test() {
        const todos = data.todos.filter(todo => todo.includes(data.search));
        for (let i = 0; i < todos.length; i++) {
          const child = element.children[i];
          const todo = todos[i];
          expect(child.textContent).toBe(todo);
        }
      }

      test();

      data.search = 'ea';
      await sleep(1);

      test();
    });

    it('Renders all the items according to "where:function"', async () => {
      const htmlSnippet = `
      <ul class="container">
        <li e-for="todo of todos | where:fnSearch">{{ todo }}</li>
      </ul>`;
      const element = toHtml(htmlSnippet);

      context.set({
        search: 'a',
        fnSearch(list) {
          return list.filter(todo => todo.includes(this.data.search));
        }
      });

      compiler.compile({
        data: context.data,
        context: context,
        el: element,
      });

      const data = context.data;

      function test() {
        const todos = data.todos.filter(todo => todo.includes(data.search));
        for (let i = 0; i < todos; i++) {
          const child = element.children[i];
          const todo = todos[i];
          expect(child.textContent).toBe(todo);
        }
      }

      test();

      data.search = 'ea';

      await sleep(1);
      test();
    });

    it('Renders all the items according to "where:property:name"', async () => {
      const htmlSnippet = `
      <ul class="container">
        <li e-for="todo of todosObj | where:search:name">{{ todo.name }}</li>
      </ul>`;
      const element = toHtml(htmlSnippet);

      context.set({
        todosObj: [
          {
            name: 'wake up',
            isDone: true
          },
          {
            name: 'eat',
            isDone: true
          },
          {
            name: 'code',
            isDone: true
          },
          {
            name: 'repeat',
            isDone: true
          }
        ],
        search: 'a',
        fnSearch(list) {
          return list.filter(todo => todo.name.includes(this.data.search));
        }
      });

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      const data = context.data;

      function test() {
        const todos = data.todosObj.filter(x => x.name.includes(data.search));
        for (let i = 0; i < todos; i++) {
          const child = element.children[i];
          const todo = todos[i];
          expect(child.textContent).toBe(todo);
        }
      }

      test();

      data.search = 'ea';
      await sleep(1);

      test();
    });
  });

  it('Removes the directive after compilation', () => {
    const element = toHtml(`
    <ul class="container">
      <li e-for="todo of todos">{{ todo }}</li>
    </ul>`);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.children[0].hasAttribute('e-for')).toBe(false);
      }
    });
  });
});