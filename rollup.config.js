// rollup.config.js
const config = require('./config/configs');

export default Object.keys(config.builds).map(cfg =>{
  return config.builds[cfg];
});