import {
  Bouer,
} from '../../index';

describe('When "set" method from Bouer is called with no target object', () => {
  let context;

  beforeEach(() => {
    context = Bouer.create();
  });

  it('Adds all the properties the instance data', () => {
    context.set({
      username: 'AfonsoMatElias'
    });
    expect('username' in context.data).toBe(true);
    expect(context.data.username).toBe('AfonsoMatElias');
  });
});

describe('When "set" method from Bouer is called with target object', () => {
  let context;

  beforeEach(() => {
    context = Bouer.create({
      data: {
        person: {
          name: 'Elias',
          country: 'Angola'
        }
      }
    });
  });

  it('Adds all the properties the instance data', () => {
    context.set({
      username: 'AfonsoMatElias'
    }, context.data.person);

    expect('username' in context.data).toBe(false);
    expect('username' in context.data.person).toBe(true);
  });
});