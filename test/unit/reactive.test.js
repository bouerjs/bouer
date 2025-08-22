import {
  Bouer
} from '../index';

describe('Reactivity Transformation', () => {
  it('Transform all the properties of an object to a reactive properties and map object only once', () => {

    const person = {
      name: 'John Doe',
      age: 31,
      children: [
        {
          name: 'Elias',
          age: 12,
          father: null
        },
        {
          name: 'Maria',
          age: 8,
          father: null
        }
      ]
    };

    for (let i = 0; i < person.children.length; i++)
      person.children[i].father = person;

    const context = Bouer.create({
      data: { person }
    });

    expect(context.data.person).toBe(person);
    expect(context.data.person.name).toBe(person.name);
    expect(context.data.person.age).toBe(person.age);
    expect(context.data.person.children).toBe(person.children);
    expect(context.data.person.children[0]).toBe(person.children[0]);
    expect(context.data.person.children[0].name).toBe(person.children[0].name);
    expect(context.data.person.children[0].age).toBe(person.children[0].age);
    expect(context.data.person.children[0].father).toBe(person.children[0].father);
    expect(context.data.person.children[1]).toBe(person.children[1]);
    expect(context.data.person.children[1].name).toBe(person.children[1].name);
    expect(context.data.person.children[1].age).toBe(person.children[1].age);
    expect(context.data.person.children[1].father).toBe(person.children[1].father);
  });
});