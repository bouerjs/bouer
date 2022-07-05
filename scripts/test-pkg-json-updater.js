const fs = require('fs');
const path = require('path');

/**
 * Replace the dependency path reference after generated a new package version
 */
(function replacePkgReferenceName() {
  const baseFolderPath = 'test/usage';
  const libPkgJson = require('../package.json');
  const newPackedName = `${libPkgJson.name}-${libPkgJson.version}.tgz`
    .replace(/\//g, '-')
    .replace(/@/g, '');

  fs.readdir(baseFolderPath, (error, folders) => {
    if (error)
      return console.error('Package Updater Exception', error);

    for (const folder of folders) {
      const projectPath = path.resolve(baseFolderPath, folder, 'package.json');
      const packageJsonStringContent = fs.readFileSync(projectPath, { encoding: 'utf8' });
      const packageJsonObject = JSON.parse(packageJsonStringContent);
      const deps = packageJsonObject.dependencies || {};

      packageJsonObject.dependencies = {
        bouerjs: `file:../../../${newPackedName}`,
        ...deps
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