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
          RegExp(item.delimiter.open + center + item.delimiter.close, flag || '')
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

      return {
        field: matches[0],
        expression: trim(matches[1]),
        delimiter: mDelimiter!
      };
    });
  }

  shorthand(attrName: string): IDelimiterResponse | null {
    if (isNull(attrName) || trim(attrName) === '') return null;

    const result = attrName.match(new RegExp('{([\\w{$,-}]*?)}'));

    if (!result) return null;

    return {
      field: result[0],
      expression: trim(result[1])
    };
  }
}
