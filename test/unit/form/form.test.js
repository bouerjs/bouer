import {
  Bouer,
  toHtml,
  Compiler,
  IoC
} from '../../index';

describe('When "toJsObj" method is called (On instance)', () => {
  it('Compile the HTML Snippet to Javascript Object Literal', () => {
    const context = Bouer.create();
    const htmlSnippet = toHtml(`
    <form id="user-form">
      <input type="text" name="name" placeholder="Name" value="Name_1">
      <input type="text" name="username" placeholder="Username" value="Username_1">
      <input type="email" name="email" placeholder="Email" value="Email_1">
    </form>`);

    const htmlSnippetObj = context.toJsObj(htmlSnippet);

    expect(htmlSnippetObj).toEqual({
      name: 'Name_1',
      username: 'Username_1',
      email: 'Email_1'
    });
  });
});

describe('When "e-form" directive is used', () => {
  it('Throws an error if the form entry (e-form) has invalid value in html', () => {
    let htmlSnippet = toHtml(`<form class="center" e-form></form>`);

    const context = Bouer.create({
      data: {
        personForm: {}
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);
    const logger = jest.spyOn(console, 'error');

    compiler.compile({
      data: context.data,
      context: context,
      el: htmlSnippet,
      onComponentLoad: el => {
        expect(logger).toHaveBeenCalled();
      }
    });
  });

  it('Throws an error if the form entry (e-form) has invalid value in code', () => {
    let htmlSnippet = toHtml(`<form class="center" e-form="personForm"></form>`);

    const context = Bouer.create({
      data: {
        personForm: null
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);
    const logger = jest.spyOn(console, 'error');

    compiler.compile({
      data: context.data,
      context: context,
      el: htmlSnippet,
      onComponentLoad: el => {
        expect(logger).toHaveBeenCalled();
      }
    });
  });

  it('Compile the form accoring to the schema provided by the code directive', () => {
    let htmlSnippet = toHtml(`
    <form class="center" e-form="personForm">
      <div class="input-field">
        <label> Name </label>
        <input type="text" name="name" />
        <small e-for="error of $form.get('name').errors"> {{ error.message }} </small>
      </div>
      <div class="input-field">
        <label> Email Address </label>
        <input type="text" name="email" />
        <small e-for="error of $form.get('email').errors"> {{ error.message }} </small>
      </div>

      <!-- Build an phones property as an array -->
      <div e-build:array="phones" class="card">
        <div>Phones</div>
        <div class="input-field">
          <label> Country Code </label>
          <input type="text" name="code" />
          <small e-for="error of $form.get('code').errors"> {{ error.message }} </small>
        </div>
        <div class="input-field">
          <label> Phone Number </label>
          <input type="text" name="phoneNumber"/>
          <small e-for="error of $form.get('phoneNumber').errors"> {{ error.message }} </small>
        </div>
      </div>

      <!-- Build an identification property as an object -->
      <div e-build="identification" class="card">
        <div>Identification</div>
        <div class="input-field">
          <label> ID Type </label>
            <select name="idType">
            <option value="" selected> Choose one options </option>
            <option value="ID"> Id Card </option>
            <option value="PP"> Passport </option>
            <option value="DL"> Driver's License </option>
          </select>
          <small e-for="error of $form.get('idType').errors"> {{ error.message }} </small>
        </div>
        <div class="input-field">
          <label> ID Value </label>
          <input type="text" name="idValue"/>
          <small e-for="error of $form.get('idValue').errors"> {{ error.message }} </small>
        </div>
      </div>
      <button type="submit"> Submit </button>
      <p id="output"></p>
    </form>`);

    const context = Bouer.create({
      data: {
        personForm: {
          schema: {
            name: {
              required: true,
              length: { min: 3, max: 20 },
            },
            email: {
              required: true,
              pattern: 'email',
            },
            phones: [
              {
                code: {
                  required: true,
                  length: 2,
                },
                phoneNumber: {
                  required: true,
                  length: 9,
                }
              }
            ],
            identification: {
              idType: {
                required: true,
                check: ['ID', 'PP', 'DL'],
              },
              idValue: {
                required: true,
                length: 9,
              }
            }
          }
        }
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);

    compiler.compile({
      data: context.data,
      context: context,
      el: htmlSnippet,
      onComponentLoad: el => {

        const $form = context.data.personForm;

        expect($form.validate()).toBe(false);

        expect($form.get('name').errors.length).toBeGreaterThan(0);
        expect($form.get('email').errors.length).toBeGreaterThan(0);
        expect($form.get('phones[0].code').errors.length).toBeGreaterThan(0);
        expect($form.get('phones[0].phoneNumber').errors.length).toBeGreaterThan(0);
        expect($form.get('identification.idType').errors.length).toBeGreaterThan(0);
        expect($form.get('identification.idValue').errors.length).toBeGreaterThan(0);
      }
    });
  });

  it('Compile the form accoring to the schema provided by the directive (e-schema)', () => {
    let htmlSnippet = toHtml(`
    <form class="center" e-form="personForm">
      <div class="input-field">
        <label> Name </label>
        <input type="text" name="name" e-schema="{ required: true, length: { min: 3, max: 20 }, }" />
        <small e-for="error of $form.get('name').errors"> {{ error.message }} </small>
      </div>
      <div class="input-field">
        <label> Email Address </label>
        <input type="text" name="email" e-schema="{ required: true, pattern: 'email', }"/>
        <small e-for="error of $form.get('email').errors"> {{ error.message }} </small>
      </div>

      <!-- Build an phones property as an array -->
      <div e-build:array="phones" class="card">
        <div>Phones</div>
        <div class="input-field">
          <label> Country Code </label>
          <input type="text" name="code" e-schema="{ required: true, length: 2 }" />
          <small e-for="error of $form.get('code').errors"> {{ error.message }} </small>
        </div>
        <div class="input-field">
          <label> Phone Number </label>
          <input type="text" name="phoneNumber" e-schema="{ required: true, length: 9 }" />
          <small e-for="error of $form.get('phoneNumber').errors"> {{ error.message }} </small>
        </div>
      </div>

      <!-- Build an identification property as an object -->
      <div e-build="identification" class="card">
        <div>Identification</div>
        <div class="input-field">
          <label> ID Type </label>
            <select name="idType" e-schema="{ required: true, check: ['ID', 'PP', 'DL'] }">
              <option value="" selected> Choose one options </option>
              <option value="ID"> Id Card </option>
              <option value="PP"> Passport </option>
              <option value="DL"> Driver's License </option>
            </select>
          <small e-for="error of $form.get('idType').errors"> {{ error.message }} </small>
        </div>
        <div class="input-field">
          <label> ID Value </label>
          <input type="text" name="idValue" e-schema="{ required: true, length: 9 }"/>
          <small e-for="error of $form.get('idValue').errors"> {{ error.message }} </small>
        </div>
      </div>
      <button type="submit"> Submit </button>
      <p id="output"></p>
    </form>`);

    const context = Bouer.create({
      data: {
        personForm: {}
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);

    compiler.compile({
      data: context.data,
      context: context,
      el: htmlSnippet,
      onComponentLoad: el => {

        const $form = context.data.personForm;

        expect($form.validate()).toBe(false);

        expect($form.get('name').errors.length).toBeGreaterThan(0);
        expect($form.get('email').errors.length).toBeGreaterThan(0);
        expect($form.get('phones[0].code').errors.length).toBeGreaterThan(0);
        expect($form.get('phones[0].phoneNumber').errors.length).toBeGreaterThan(0);
        expect($form.get('identification.idType').errors.length).toBeGreaterThan(0);
        expect($form.get('identification.idValue').errors.length).toBeGreaterThan(0);
      }
    });
  });

  it('Compile the form if the schema is provided by both the directive (e-schema) and the code schema, and also warn the developer', () => {
    let htmlSnippet = toHtml(`
    <form class="center" e-form="personForm">
      <div class="input-field">
        <label> Name </label>
        <input type="text" name="name" e-schema="{ required: true, length: { min: 3, max: 20 }, }" />
        <small e-for="error of $form.get('name').errors"> {{ error.message }} </small>
      </div>
      <div class="input-field">
        <label> Email Address </label>
        <input type="text" name="email" e-schema="{ required: true, pattern: 'email', }"/>
        <small e-for="error of $form.get('email').errors"> {{ error.message }} </small>
      </div>
      <button type="submit"> Submit </button>
      <p id="output"></p>
    </form>`);

    const logger = jest.spyOn(console, 'warn');

    const context = Bouer.create({
      data: {
        personForm: {
          schema: {
            name: {
              required: true,
              length: { min: 3, max: 10 },
            }
          }
        }
      }
    });

    const compiler = IoC.app(context).resolve(Compiler);

    compiler.compile({
      data: context.data,
      context: context,
      el: htmlSnippet,
      onComponentLoad: el => {
        expect(logger).toHaveBeenCalled();
      }
    });
  });
});