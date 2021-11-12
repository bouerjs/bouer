// rollup.config.js
const config = require('./scripts/config');

export default Object.keys(config.builds).map(cfg =>{
  return config.builds[cfg];
});