export default class Logger {
  private static prefix = '[Bouer]';

  static log(...content: any[]) {
    content.unshift(Logger.prefix);
    console.log.apply(null, content);
  }
  static error(...content: any[]) {
    content.unshift(Logger.prefix);
    console.error.apply(null, content);
  }
  static warn(...content: any[]) {
    content.unshift(Logger.prefix);
    console.warn.apply(null, content);
  }
  static info(...content: any[]) {
    content.unshift(Logger.prefix);
    console.info.apply(null, content);
  }
}