import { isNull, trim } from "../shared/helpers/Utils";

export type Delimiter = {
  /** The name of the delimiter */
  name: string,
  /** The delimiter structure */
  delimiter: {
    /** The open syntax */
    open: string,
    /** The close syntax */
    close: string
  },
  action?: (valueToSet: string, node: Node, data: object) => string
}

export type DelimiterResult = {
  field: string,
  expression: string,
  delimiter?: Delimiter
}

export default class DelimiterHandler {
  /**
   * Provide the instance of the class.
   * link: https://refactoring.guru/design-patterns/singleton
   */
  static singleton: DelimiterHandler;
  delimiters: Array<Delimiter> = [];

  constructor(delimiters: Array<Delimiter>) {
    this.delimiters = delimiters;

    DelimiterHandler.singleton = this;
  }

  add(item: Delimiter) {
    this.delimiters.push(item);
  }

  remove(name: string) {
    const index = this.delimiters.findIndex(item => item.name === name);
    this.delimiters.splice(index, 1);
  }

  run(content: string): DelimiterResult[] {
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
