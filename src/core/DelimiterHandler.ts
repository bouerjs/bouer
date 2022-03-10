import Bouer from '../instance/Bouer';
import IDelimiter from '../definitions/interfaces/IDelimiter';
import IDelimiterResponse from '../definitions/interfaces/IDelimiterResponse';
import ServiceProvider from '../shared/helpers/ServiceProvider';
import { isNull, trim } from '../shared/helpers/Utils';
import Base from './Base';

export default class DelimiterHandler extends Base {
  delimiters: Array<IDelimiter> = [];
  bouer: Bouer;

  constructor(delimiters: Array<IDelimiter>, bouer: Bouer) {
    super();

    this.bouer = bouer;
    this.delimiters = delimiters;
    ServiceProvider.add('DelimiterHandler', this);
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
        const delimiter = this.delimiters[i];
        const result = text.match(
          RegExp(delimiter.delimiter.open + center + delimiter.delimiter.close, flag || '')
        );

        if (result) {
          mDelimiter = delimiter;
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
