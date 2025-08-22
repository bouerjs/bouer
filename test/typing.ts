/* eslint-disable no-unused-vars */

// Data Property Typing
import Bouer, { Component, Computed } from '../src';

const app = new Bouer('', {
  data: {
    firstName: 'John',
    lastName: 'Doe',
    fullName: new Computed({
      get() {
        return this.data.firstName + ' ' + this.data.lastName;
      },
      set(value) {
        const names = value.split(' ');
        this.data.firstName = names[0];
        this.data.lastName = names[names.length - 1];
      }
    })
  }
});

app.data.firstName = 'Mario';
app.data.lastName = 'Andrew';

app.data.fullName = 'Luij Niet';


class PersonComponent extends Component {
  constructor() {
    super('');
  }

  firstName = 'Josh';
  lastName = 'Doe';
  yearOfBirth = 1990;

  fullName = new Computed({
    get() {
      return this.firstName + ' ' + this.lastName;
    },
    set(value) {
      const names = value.split(' ');
      this.firstName = names[0];
      this.lastName = names[names.length - 1];
    },
  });

  data = {
    age: new Computed(function () {
      return {
        get() {
          return new Date().getFullYear() - this.yearOfBirth;
        },
        set(value) {
          this.yearOfBirth = new Date().getFullYear() - value;
        }
      };
    })
  };
}

const component = new PersonComponent();

component.fullName.set('John Doe');