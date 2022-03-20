import {
  Bouer,
  toHtml,
} from '../../index';

describe('When "toJsObj" method is called (On instance)', () => {
  it('Compiles the HTML Snippet to Javascript Object Literal', () => {
    const context = Bouer.create();
    const htmlSnippet = toHtml(`
    <form id="user-form">
      <input type="text" name="name" placeholder="Name">
      <input type="text" name="username" placeholder="Username">
      <input type="email" name="email" placeholder="Email">
    </form>`);

    const htmlSnippetObj = context.toJsObj(htmlSnippet);

    expect(htmlSnippetObj).toEqual({
      name: '',
      username: '',
      email: ''
    });
  });
});

describe('When "toJsObj" method is called (Off instance)', () => {
  it('Compiles the HTML Snippet to Javascript Object Literal', () => {
    const htmlSnippet = toHtml(`
    <form id="user-form">
        <input type="text" name="name" placeholder="Name">
        <input type="text" name="username" placeholder="Username">
        <input type="email" name="email" placeholder="Email">
      </form>`);

    const htmlSnippetObj = Bouer.toJsObj(htmlSnippet);

    expect(htmlSnippetObj).toEqual({
      name: '',
      username: '',
      email: ''
    });
  });
});