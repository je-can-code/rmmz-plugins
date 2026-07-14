//region plugins/diff/_component/fixtures/install-diff-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/models/PluginMetadata.js';
import ExternalJsonConfigLoader from '../../../../../src/plugins/_base/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../../../src/plugins/_base/models/ExternalJsonConfigLoaderOptions.js';
import { buildVitestDifficultyConfigJson } from './diff-config-json.js';

const noop = function()
{
};

export const DEFAULT_DIFF_PLUGIN_PARAMS = {
  initialPoints: '10',
  defaultDifficulty: 'vitest_diff',
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * _base/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Difficulty's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJDiff(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Difficulty';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-Difficulty's Game_System/Game_Temp/Game_Actor/Game_Enemy/Game_Map.js to
 * evaluate when direct-imported into the real Vitest realm instead of a nested vm context. Only the
 * object files actually under test get imported, so (unlike the old VM bundle-eval) the Scene_Difficulty/
 * Window_Difficulty* UI chain never needs stubbing at all.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {string} [diffConfigJson] Full JSON text for StorageManager.fsReadFile (data/config.difficulty.json).
 */
export function installDiffHostGlobals(sandbox = globalThis, diffConfigJson = buildVitestDifficultyConfigJson())
{
  if (sandbox.__diffHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__diffHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // diff's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  // J_DiffPluginMetadata.initializeDifficulties() reads data/config.difficulty.json via these two
  // real J-Base globals.
  sandbox.ExternalJsonConfigLoader ??= ExternalJsonConfigLoader;
  sandbox.ExternalJsonConfigLoaderOptions ??= ExternalJsonConfigLoaderOptions;

  installPluginManagerWithParams(sandbox, 'J-Difficulty', DEFAULT_DIFF_PLUGIN_PARAMS);

  sandbox.StorageManager.fsReadFile = function()
  {
    return diffConfigJson;
  };

  sandbox.TextManager.param = () => '';
  sandbox.TextManager.bparamDescription = () => '';
  sandbox.TextManager.xparam = () => '';
  sandbox.TextManager.xparamDescription = () => '';
  sandbox.TextManager.sparam = () => '';
  sandbox.TextManager.sparamDescription = () => '';
  sandbox.TextManager.rewardParam = () => '';
  sandbox.TextManager.rewardDescription = () => '';
  sandbox.TextManager.sdpPoints = () => '';

  // Game_System.js's initialize alias captures whatever's here as "original" before overwriting it.
  sandbox.Game_System.prototype.initialize = noop;

  // Game_Temp.js's initMembers alias captures whatever's here as "original" before overwriting it;
  // installJBaseHostGlobals's Game_Temp placeholder has an empty prototype with no default.
  sandbox.Game_Temp.prototype.initMembers = noop;

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;
  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };
  sandbox.Game_Actor.prototype.param = () => 100;
  sandbox.Game_Actor.prototype.sparam = () => 100;
  sandbox.Game_Actor.prototype.xparam = () => 100;

  Object.setPrototypeOf(sandbox.Game_Enemy.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Enemy.prototype.constructor = sandbox.Game_Enemy;
  sandbox.Game_Enemy.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };
  sandbox.Game_Enemy.prototype.param = () => 100;
  sandbox.Game_Enemy.prototype.sparam = () => 100;
  sandbox.Game_Enemy.prototype.xparam = () => 100;
  sandbox.Game_Enemy.prototype.exp = () => 50;
  sandbox.Game_Enemy.prototype.gold = () => 25;

  // Game_Map.js's encounterStep alias captures whatever's here as "original" before overwriting it.
  sandbox.Game_Map.prototype.encounterStep = () => 30;
}
//endregion plugins/diff/_component/fixtures/install-diff-host-globals.js
