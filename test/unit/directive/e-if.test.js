import {
  Bouer,
  Compiler,
  sleep,
  toHtml
} from '../../index';

describe('When element is compiled with "e-if" directive', () => {
  const htmlSnippet = `
  <div class="container">
    <p e-if="see">Visible</p>
  </div>`;

  it('Removes the element from the DOM if value is "false"', () => {
    const context = Bouer.create({
      data: {
        see: false
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).not.toContain('Visible');
      }
    });
  });

  it('Keep the element from the DOM if value is "true"', () => {
    const context = Bouer.create({
      data: {
        see: true
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('Visible');
      }
    });
  });
});

describe('When element is compiled with "e-if" and "e-else" directives', () => {
  const htmlSnippet = `
  <div class="container">
    <p e-if="see">If-Block</p>
    <p e-else>Else-Block</p>
  </div>`;

  it('Shows `if-element` if the value is `true` and removes `else-element`', () => {
    const context = Bouer.create({
      data: {
        see: true
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('If-Block');
        expect(el.innerHTML).not.toContain('Else-Block');
      }
    });
  });

  it('Shows `else-element` if the value is `false` and removes `if-element`', () => {
    const context = Bouer.create({
      data: {
        see: false
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('Else-Block');
        expect(el.innerHTML).not.toContain('If-Block');
      }
    });
  });
});

describe('When element is compiled with "e-if", "e-else-if" and "e-else" directives', () => {
  const htmlSnippet = `
  <div class="container">
    <p e-if="value == 0">Single-If-Block</p>
    <p e-else-if="value == 1">Else-If-Block</p>
    <p e-else>Else-Block</p>
  </div>`;

  it('Shows "if-element" if the value is "0" and removess others (e-else-if, e-else)', () => {
    const context = Bouer.create({
      data: {
        value: 0
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).toContain('Single-If-Block');
        expect(el.innerHTML).not.toContain('Else-If-Block');
        expect(el.innerHTML).not.toContain('Else-Block');
      }
    });
  });

  it('Shows "else-if-element" if the value is "1" and remove others (e-if, e-else)', () => {
    const context = Bouer.create({
      data: {
        value: 1
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).not.toContain('Single-If-Block');
        expect(el.innerHTML).toContain('Else-If-Block');
        expect(el.innerHTML).not.toContain('Else-Block');
      }
    });
  });

  it('Shows "else-element" if the value is different from "0" and "1" and remove others (e-if, e-else-if)', () => {
    const context = Bouer.create({
      data: {
        value: 2
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element,
      onDone: el => {
        expect(el.innerHTML).not.toContain('Single-If-Block');
        expect(el.innerHTML).not.toContain('Else-If-Block');
        expect(el.innerHTML).toContain('Else-Block');
      }
    });
  });

  it('Re-render the "if-chaining" elements when the value changes', async () => {
    const context = Bouer.create({
      data: {
        value: 0
      }
    });
    const compiler = new Compiler(context);
    const element = toHtml(htmlSnippet);

    compiler.compile({
      data: context.data,
      context: context,
      el: element
    });

    await sleep(5);

    const blocks = [
      {
        directive: 'e-if',
        content: 'Single-If-Block'
      },
      {
        directive: 'e-else-if',
        content: 'Else-If-Block'
      },
      {
        directive: 'e-else',
        content: 'Else-Block'
      }
    ];
    for (let i = 0; i < blocks.length; i++) {
      context.data.value = i;
      await sleep(5);

      const blockValue = blocks[i].content;
      expect(element.innerHTML).toContain(blockValue);
      expect(blocks[i].directive in element.attributes).toBe(false);
    }
  });
});