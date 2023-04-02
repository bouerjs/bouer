import {
  Bouer,
  Compiler,
  toHtml,
  sleep,
  IoC
} from '../../index';

describe('When element is compiled with "e-req" directive', () => {
  describe('When compiled with "of" request type', () => {
    const htmlSnippet = `
    <ul>
        <li e-req="user of users"
          on:request="requested"
          on:response="responded"
          on:fail="failed"
          on:done="done">
          {{ user.name }}
        </li>
    </ul>`;

    it('Renders all the items when the onBind has "non-promise" return', async () => {
      const requested = jest.fn();
      const responded = jest.fn();
      const done = jest.fn();

      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          requested,
          responded,
          done
        },
        middleware: (configure) => {
          configure('req', (onBind) => {
            onBind(context => {
              expect(context.detail.requestPath).toBe('users');
              expect(context.detail.requestType).toBe('of');
              return {
                data: [{
                  name: 'item'
                }]
              };
            });
          });
        }
      });
      const compiler = IoC.app(context).resolve(Compiler);

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      await sleep(5);

      expect(requested).toHaveBeenCalled();
      expect(responded).toHaveBeenCalled();
      expect(done).toHaveBeenCalled();

      const child = element.children[0];
      expect(child.textContent).toContain('item');
    });
    it('Renders all the items when the onBind has "promise" return', async () => {
      const requested = jest.fn();
      const responded = jest.fn();
      const done = jest.fn();

      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          requested,
          responded,
          done
        },
        middleware: (configure) => {
          configure('req', (onBind) => {
            onBind(context => {
              expect(context.detail.requestPath).toBe('users');
              expect(context.detail.requestType).toBe('of');
              return Promise.resolve({
                data: [{
                  name: 'item'
                }]
              });
            });
          });
        }
      });
      const compiler = IoC.app(context).resolve(Compiler);

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      await sleep(5);

      expect(requested).toHaveBeenCalled();
      expect(responded).toHaveBeenCalled();
      expect(done).toHaveBeenCalled();

      const child = element.children[0];
      expect(child.textContent).toContain('item');
    });
    it('Fails if the "promise" was rejected', async () => {
      const requested = jest.fn();
      const responded = jest.fn();
      const failed = jest.fn();
      const done = jest.fn();

      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          requested,
          responded,
          failed,
          done
        },
        middleware: (configure) => {
          configure('req', (onBind) => {
            onBind(context => {
              expect(context.detail.requestPath).toBe('users');
              expect(context.detail.requestType).toBe('of');
              return Promise.reject(new Error('Request failed'));
            });
          });
        }
      });
      const compiler = IoC.app(context).resolve(Compiler);

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      await sleep(5);

      expect(requested).toHaveBeenCalled();
      expect(responded).not.toHaveBeenCalled();
      expect(failed).toHaveBeenCalled();
      expect(done).toHaveBeenCalled();

      const child = element.children[0];
      expect(child.textContent).toContain('{{ user.name }}');
    });
  });

  describe('When compiled with "as" request type', () => {
    const htmlSnippet = `
    <ul>
        <li e-req="user as users/{{ userId }}"
          on:request="requested"
          on:response="responded"
          on:fail="failed"
          on:done="done">
          {{ user.name }}
        </li>
    </ul>`;

    it('Renders the item when the onBind has "non-promise" return', async () => {
      const requested = jest.fn();
      const responded = jest.fn();
      const done = jest.fn();

      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          userId: 1,
          requested,
          responded,
          done
        },
        middleware: (configure) => {
          configure('req', (onBind) => {
            onBind(context => {
              expect(context.detail.requestPath).toBe('users/1');
              expect(context.detail.requestType).toBe('as');
              return {
                data: {
                  name: 'item'
                }
              };
            });
          });
        }
      });
      const compiler = IoC.app(context).resolve(Compiler);

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      await sleep(5);

      expect(requested).toHaveBeenCalled();
      expect(responded).toHaveBeenCalled();
      expect(done).toHaveBeenCalled();

      const child = element.children[0];
      expect(child.textContent).toContain('item');
    });
    it('Renders the item when the onBind has "promise" return', async () => {
      const requested = jest.fn();
      const responded = jest.fn();
      const done = jest.fn();

      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          userId: 1,
          requested,
          responded,
          done
        },
        middleware: (configure) => {
          configure('req', (onBind) => {
            onBind(context => {
              expect(context.detail.requestPath).toBe('users/1');
              expect(context.detail.requestType).toBe('as');
              return Promise.resolve({
                data: {
                  name: 'item'
                }
              });
            });
          });
        }
      });
      const compiler = IoC.app(context).resolve(Compiler);

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      await sleep(5);

      expect(requested).toHaveBeenCalled();
      expect(responded).toHaveBeenCalled();
      expect(done).toHaveBeenCalled();

      const child = element.children[0];
      expect(child.textContent).toContain('item');
    });
    it('Fails if the "promise" was rejected', async () => {
      const requested = jest.fn();
      const responded = jest.fn();
      const failed = jest.fn();
      const done = jest.fn();

      const element = toHtml(htmlSnippet);
      const context = Bouer.create({
        data: {
          userId: 1,
          requested,
          responded,
          failed,
          done
        },
        middleware: (configure) => {
          configure('req', (onBind) => {
            onBind(context => {
              expect(context.detail.requestPath).toBe('users/1');
              expect(context.detail.requestType).toBe('as');
              return Promise.reject(new Error('Request failed'));
            });
          });
        }
      });
      const compiler = IoC.app(context).resolve(Compiler);

      compiler.compile({
        data: context.data,
        context: context,
        el: element
      });

      await sleep(5);

      expect(requested).toHaveBeenCalled();
      expect(responded).not.toHaveBeenCalled();
      expect(failed).toHaveBeenCalled();
      expect(done).toHaveBeenCalled();

      const child = element.children[0];
      expect(child.textContent).toContain('{{ user.name }}');
    });
  });
});