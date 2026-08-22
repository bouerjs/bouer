var app = new Bouer('#app', {
  components: [{
    name: 'input-field',
    path: '/components/input-field.html'
  }],
  data: {
    personForm: {
      schema: {
        firstName: {
          required: true,
          length: { min: 3, max: 10 },
          // value: 'Afonso'
        },
        lastName: {
          required: true,
          length: { min: 3, max: 10 },
          // value: 'Matumona'
        },
        birthdate: {
          required: true,
          type: 'string',
          pattern: 'date',
          // value: '1999-01-01'
        },
        email: {
          required: true,
          pattern: 'email',
          // value: 'mail@example.com',
        },
        phones: [
          {
            code: {
              required: true,
              length: 2,
              // value: 'AO'
            },
            phoneNumber: {
              required: true,
              length: 9,
              // value: '123456789'
            }
          }
        ],
        identification: {
          type: {
            required: true,
            check: ['ID', 'PP', 'DL'],
            // value: 'DL'
          },
          code: {
            required: true,
            length: 9,
            // value: '924456789'
          }
        }
      }
    },
    submit: function () {
      console.log('Compiled Form', this.data.personForm);

      var form = document.querySelector('form');

      console.log(app.toJsObj(form));
      document.querySelector("#output").textContent = "Check the output in browser console"
    }
  }
});