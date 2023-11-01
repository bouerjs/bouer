import {
  Bouer,
  Compiler,
  IoC,
  toHtml,
  sleep
} from '../../index';

import {
  Component
} from '../../../src/index';

class Person extends Component {
  name = 'Person';

  constructor() {
    super({
      template: '<div> {{ name }} </div>'
    });
  }

  data = {
    name: 'Elias',
    address: {
      city: 'Luanda',
      country: 'Angola'
    }
  };
}

describe('When "set" method from Component is called with no target object', () => {
  it('Adds all the properties the instance data', async () => {
    const context = Bouer.create({
      components: [Person]
    });

    const htmlSnippet = `
    <div>
      <Person id="person"></Person>
    </div>`;

    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: {},
      context: context,
      el: element,
    });

    await sleep(1);

    const person = context.$components.viewById('person');

    person.set({
      age: 12
    });

    expect('age' in person.data).toBe(true);
  });
});

describe('When "set" method from Component is called with target object', () => {
  it('Adds all the properties the instance data', async () => {
    const context = Bouer.create({
      components: [Person]
    });

    const htmlSnippet = `
    <div>
      <Person id="person"></Person>
    </div>`;

    const compiler = IoC.app(context).resolve(Compiler);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: {},
      context: context,
      el: element,
    });

    await sleep(1);

    const person = context.$components.viewById('person');

    person.set({
      code: 'AO'
    }, person.data.address);

    expect('code' in person.data).toBe(false);
    expect('code' in person.data.address).toBe(true);
  });
});