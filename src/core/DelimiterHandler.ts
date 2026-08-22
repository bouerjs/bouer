import Bouer from '../instance/Bouer';
import IDelimiter from '../definitions/interfaces/IDelimiter';
import IDelimiterResponse from '../definitions/interfaces/IDelimiterResponse';
import { isNull, trim } from '../shared/helpers/Utils';

export default class DelimiterHandler {
  delimiters: IDelimiter[] = [];
  bouer: Bouer;

  constructor(bouer: Bouer, delimiters: IDelimiter[]) {
    this.bouer = bouer;
    this.delimiters = delimiters;
  }

  add(item: IDelimiter) {
    this.delimiters.push(item);
  }

  remove(name: string) {
    const index = this.delimiters.findIndex(item => item.name === name);
    this.delimiters.splice(index, 1);
  }

  run(content: string): IDelimiterResponse[] {
    if (isNull(content) || trim(content) === '') return [];
    let mDelimiter: IDelimiter | null = null;

    const checkContent = (text: string, flag?: string): RegExpMatchArray | undefined => {
      const center = '([\\S\\s]*?)';

      for (let i = 0; i < this.delimiters.length; i++) {
        const item = this.delimiters[i];
        const result = text.match(
          new RegExp(item.delimiter.open + center + item.delimiter.close, flag || '')
        );

        if (result) {
          mDelimiter = item;
          return result;
        }
      }
    };

    const result = checkContent(content, 'g');
    if (!result) return [];

    return result.map(item => {
      const matches = checkContent(item) as RegExpMatchArray;

      const delimiterField = matches[0];
      const delimiterExpression = matches[1];

      // Composing the expression: price | currency:$ -> [ price, currency:$ ]
      const expressionComposed = delimiterExpression.trim().split(' | ').map(e => trim(e));

      // Extracting the field only
      const expression = expressionComposed.shift()!;

      // Builing the pipes structure
      const pipes = expressionComposed.map(e => {
        // currency:$ -> currency [ $ ]
        const args = e.split(':');
        const fn = args.shift()!;

        return {
          fn: fn,
          args: args as unknown[]
        };
      });

      return {
        field: delimiterField,
        expression: trim(expression),
        delimiter: mDelimiter!,
        pipes: pipes
      };
    });
  }

  shorthand(attrName: string): IDelimiterResponse | null {
    if (isNull(attrName) || trim(attrName) === '') return null;

    const match = attrName.match(new RegExp('{([\\w{$,-}]*?)}'));
    if (!match) return null;

    return this.run('{{' + trim(match[1]) + '}}')[0];
  }
}
