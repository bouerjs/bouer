export default (function Logger() {
  const prefix = '[Bouer]';
  return {
    log(l: any) {
      console.log(prefix, l);
    },
    error(e: any) {
      console.error(prefix, e);
    },
    warn(w: any) {
      console.warn(prefix, w);
    },
    info(i: any) {
      console.info(prefix, i);
    }
  };
})();