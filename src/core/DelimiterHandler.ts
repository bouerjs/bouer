import Bouer from "../browser";
import Delimiter from "../definitions/types/Delimiter";
import DelimiterResponse from "../definitions/types/DelimiterResponse";
import IoC from "../shared/helpers/IoC";
import { isNull, trim } from "../shared/helpers/Utils";

export default class DelimiterHandler {
  delimiters: Array<Delimiter> = [];
	bouer: Bouer;

  constructor(delimiters: Array<Delimiter>, bouer: Bouer) {
		this.bouer = bouer;
    this.delimiters = delimiters;

    IoC.Register(this);
  }

  add(item: Delimiter) {
    this.delimiters.push(item);
  }

  remove(name: string) {
    const index = this.delimiters.findIndex(item => item.name === name);
    this.delimiters.splice(index, 1);
  }

  run(content: string): DelimiterResponse[] {
    if (isNull(content) || trim(content) === '') return [];
    let mDelimiter: Delimiter | null = null;

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
