import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// Create a require helper to safely load JSON files in Node ESM
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

/**
 * Replace the dependency path reference after generating a new package version
 */
(function replacePkgReferenceName() {
  const baseFolderPath = 'test/usage';

  const newPackedName = `${pkg.name}-${pkg.version}.tgz`
    .replace(/\//g, '-')
    .replace(/@/g, '');

  fs.readdir(baseFolderPath, (error, folders) => {
    if (error) {
      return console.error('Package Updater Exception', error);
    }

    for (const folder of folders) {
      const projectPath = path.resolve(
        baseFolderPath,
        folder,
        'package.json'
      );

      if (!fs.existsSync(projectPath)) continue;

      const packageJsonStringContent = fs.readFileSync(
        projectPath,
        { encoding: 'utf8' }
      );

      const packageJsonObject = JSON.parse(packageJsonStringContent);
      const deps = packageJsonObject.dependencies || {};

      packageJsonObject.dependencies = {
        ...deps,
        bouerjs: `file:../../../${newPackedName}`
      };

      fs.writeFileSync(
        projectPath,
        JSON.stringify(packageJsonObject, null, 2),
        {
          encoding: 'utf8'
        }
      );
    }
  });
})();