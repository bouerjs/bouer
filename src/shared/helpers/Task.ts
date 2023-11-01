export default (function Task() {
  return {
    run(
      callback: (killTask: () => void) => void,
      milliseconds?: number
    ) {
      const timerId = setInterval(() => {
        callback(() => clearInterval(timerId));
      }, milliseconds || 10);
    }
  };
})();