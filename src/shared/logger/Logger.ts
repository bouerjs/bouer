export default class Logger {
  private static prefix = '[Bouer]';

  static log(...content: any[]) {
    console.log.apply(null, [Logger.prefix].concat(content));
  }
  static error(...content: any[]) {
    console.error.apply(null, [Logger.prefix].concat(content));
  }
  static warn(...content: any[]) {
    console.warn.apply(null, [Logger.prefix].concat(content));
  }
  static info(...content: any[]) {
    console.info.apply(null, [Logger.prefix].concat(content));
  }
}