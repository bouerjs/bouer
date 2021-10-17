export default class Logger {
  private static prefix = '[Bouer]'

  static log(content: any) {
    console.log(Logger.prefix, content);
  }
  static error(content: any) {
    console.error(Logger.prefix, content);
  }
  static warn(content: any) {
    console.warn(Logger.prefix, content);
  }
  static info(content: any) {
    console.info(Logger.prefix, content);
  }
}
