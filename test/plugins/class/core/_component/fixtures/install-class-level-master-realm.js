//region plugins/class/core/_component/fixtures/install-class-level-master-realm.js
import { DEFAULT_LEVEL_CONFIG_JSON } from '../../../../level/_component/fixtures/engine-stubs.js';
import { installClassCoreRealm } from './install-class-core-realm.js';

/**
 * Stands up the class realm with J-LevelMaster's curve reader beside it: its bootstrap, which holds the tag a
 * Max Tech curve is read by, and `GrowthCurveFormula`, the global J-Classes reads the curve through.
 *
 * Only those two, and both from source. The rest of J-LevelMaster changes how an actor levels and what their
 * parameters are worth past level 99, which nothing J-Classes measures depends on, and which would change every
 * actor this realm builds.
 *
 * J-LevelMaster reads its configuration file as its bootstrap runs, and the engine reads files through
 * `StorageManager`. So for as long as the bootstrap runs, and no longer, the file reads as J-LevelMaster's own
 * test defaults.
 * @returns {Promise<void>}
 */
export async function installClassLevelMasterRealm()
{
  await installClassCoreRealm({}, async () =>
  {
    // J-LevelMaster's configuration, read once as its bootstrap runs.
    const readFile = globalThis.StorageManager.fsReadFile;
    globalThis.StorageManager.fsReadFile = () => DEFAULT_LEVEL_CONFIG_JSON;

    // the build-time defines J-LevelMaster's bootstrap reads.
    globalThis.__PLUGIN_NAME__ = 'J-LevelMaster';
    globalThis.__PLUGIN_VERSION__ = '1.3.1';
    await import('../../../../../../src/plugins/level/core/_metadata/initialization.js');
    globalThis.StorageManager.fsReadFile = readFile;

    // J-LevelMaster's classes are globals once its bundle loads, which is how J-Classes reaches them.
    ({ default: globalThis.GrowthCurveFormula } = await import(
      '../../../../../../src/plugins/level/core/managers/GrowthCurveFormula.js'));
  });
}
//endregion plugins/class/core/_component/fixtures/install-class-level-master-realm.js
