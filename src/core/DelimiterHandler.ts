import IoC from "../shared/helpers/IoC";
import { isNull, trim } from "../shared/helpers/Utils";
import delimiter from "../types/delimiter";
import delimiterResponse from "../types/delimiterResponse";

export default class DelimiterHandler {
  delimiters: Array<delimiter> = [];

  constructor(delimiters: Array<delimiter>) {
    IoC.Register(this);

    this.delimiters = delimiters;
  }

  add(item: delimiter) {
    this.delimiters.push(item);
  }

  remove(name: string) {
    const index = this.delimiters.findIndex(item => item.name === name);
    this.delimiters.splice(index, 1);
  }

  run(content: string): delimiterResponse[] {
    if (isNull(content) || trim(content) === '') return [];
    let mDelimiter: delimiter | null = null;

    const checkContent = (text: string, flag?: string): RegExpMatchArray | undefined => {
      const center = '([\\S\\s]*?)';
      for (var i = 0; i < this.delimiters.length; i++) {
        const delimiter = this.delimiters[i];
        const result = text.match(
          RegExp(delimiter.delimiter.open + center + delimiter.delimiter.close, flag || '')
        );
        if (result) {
          mDelimiter = delimiter;
          return result;
        }
      }
    }

    const result = checkContent(content, 'g');
    if (!result) return [];

    return result.map(function (item) {
      const matches = checkContent(item) as RegExpMatchArray;
      return {
        field: matches[0],
        expression: trim(matches[1]),
        delimiter: mDelimiter!
      }
    });
  }
}
