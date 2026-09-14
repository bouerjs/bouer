/* eslint-disable no-unused-vars */

// Data Property Typing
import { $form, $field, Component, FormHandler, $computed, $createApp, prop } from '../src';
import { $inert } from '../src/core/reactive/Reactive';

const app = $createApp('', {
  data: {
    firstName: 'John',
    lastName: 'Doe',
    fullName: $computed({
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
  constructor() { super(''); }

  firstName = 'Josh';
  lastName = 'Doe';
  yearOfBirth = 1990;

  fullName = $computed({
    get() {
      return this.firstName + ' ' + this.lastName;
    },
    set(value) {
      const names = value.split(' ');
      this.firstName = names[0];
      this.lastName = names[names.length - 1];
    },
  });

  age = $computed(function () {
    return {
      get() {
        return new Date().getFullYear() - this.yearOfBirth;
      },
      set(value) {
        this.yearOfBirth = new Date().getFullYear() - value;
      }
    };
  });
}

const component = new PersonComponent();

component.fullName = 'John Doe';

class RegisterUser extends Component {
  webClient: XMLHttpRequest = $inert(new XMLHttpRequest());
  form: FormHandler = $form({
    firstName: $field({
      required: true,
      length: { min: 3, max: 10 },
    }),
    lastName: $field({
      required: true,
      length: { min: 3, max: 10 }
    }),
    birthdate: $field({
      required: true,
      pattern: 'date'
    }),
    email: $field({
      required: true,
      pattern: 'email'
    })
  });

  types1 = prop.required<string[]>();
  types2 = prop.optional<string>('');

  constructor(webClient: any) {
    super({
      path: './user/register.user.html',
      route: '/user/register',
    });
    this.webClient = webClient;
  }

  submit() {
    if (!this.form.validate()) return;

    const webClient = this.webClient;
    const user = this.form.toObject();

    webClient.open('POST', 'user/register', true);
    webClient.send(JSON.stringify(user));
  }
}