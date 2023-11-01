export default (function Logger() {
  const prefix = '[Bouer]';
  return {
    log(l: any) {
      console.log.apply(null, [prefix].concat(Error(l) as any));
    },
    error(e: any) {
      console.error.apply(null, [prefix].concat(Error(e) as any));
    },
    warn(w: any) {
      console.warn.apply(null, [prefix].concat(Error(w) as any));
    },
    info(i: any) {
      console.info.apply(null, [prefix].concat(Error(i) as any));
    }
  };
})();