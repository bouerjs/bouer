// rollup.config.js
import { builds } from './scripts/config.js';

export default Object.keys(builds).map(cfg => builds[cfg]);