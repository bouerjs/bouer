export default class Task {
  static run = (
    callback: (killTask: () => void) => void,
    milliseconds?: number
  ) => {
    const timerId = setInterval(() => {
      callback(() => clearInterval(timerId));
    }, milliseconds || 10);
  };
}