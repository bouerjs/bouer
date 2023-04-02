import {
  Bouer,
  toHtml
} from '../../index';

describe('When "toJsObj" method is called (On instance)', () => {
  it('Compiles the HTML Snippet to Javascript Object Literal', () => {
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

describe('When "toJsObj" method is called (Off instance)', () => {
  it('Compiles the HTML Snippet to Javascript Object Literal', () => {
    const htmlSnippet = toHtml(`
    <form id="user-form">
        <input type="text" name="name" placeholder="Name" value="Name_1">
        <input type="text" name="username" placeholder="Username" value="Username_1">
        <input type="email" name="email" placeholder="Email" value="Email_1">
      </form>`);

    const htmlSnippetObj = Bouer.toJsObj(htmlSnippet);

    expect(htmlSnippetObj).toEqual({
      name: 'Name_1',
      username: 'Username_1',
      email: 'Email_1'
    });
  });
});