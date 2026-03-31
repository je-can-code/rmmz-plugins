//region engine-stubs
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';

import { buildVitestDifficultyConfigJson } from './diff-config-json.js';

const VITEST_DIFFICULTY_CONFIG_JSON = buildVitestDifficultyConfigJson();

const noop = function()
{
};

export const DEFAULT_DIFF_PLUGIN_PARAMS = {
  initialPoints: '10',
  defaultDifficulty: 'vitest_diff',
};

/**
 * Globals required for {@link out/J-Difficulty.js} after host install, before {@link out/J-Base.js}.
 *
 * @param {object} sandbox
 */
export function installDiffEngineStubs(sandbox)
{
  installMinimalMenuUiStubs(sandbox);

  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-Difficulty')
      {
        return DEFAULT_DIFF_PLUGIN_PARAMS;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  sandbox.StorageManager.fsReadFile = function()
  {
    return VITEST_DIFFICULTY_CONFIG_JSON;
  };

  sandbox.Game_System.prototype.initialize = noop;

  sandbox.TextManager.param = function()
  {
    return '';
  };

  sandbox.TextManager.bparamDescription = function()
  {
    return '';
  };

  sandbox.TextManager.xparam = function()
  {
    return '';
  };

  sandbox.TextManager.xparamDescription = function()
  {
    return '';
  };

  sandbox.TextManager.sparam = function()
  {
    return '';
  };

  sandbox.TextManager.sparamDescription = function()
  {
    return '';
  };

  sandbox.TextManager.rewardParam = function()
  {
    return '';
  };

  sandbox.TextManager.rewardDescription = function()
  {
    return '';
  };

  sandbox.TextManager.sdpPoints = function()
  {
    return '';
  };

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;

  Object.setPrototypeOf(sandbox.Game_Enemy.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Enemy.prototype.constructor = sandbox.Game_Enemy;

  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };

  sandbox.Game_Enemy.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };

  sandbox.Game_Actor.prototype.param = function()
  {
    return 100;
  };

  sandbox.Game_Actor.prototype.sparam = function()
  {
    return 100;
  };

  sandbox.Game_Actor.prototype.xparam = function()
  {
    return 100;
  };

  sandbox.Game_Enemy.prototype.param = function()
  {
    return 100;
  };

  sandbox.Game_Enemy.prototype.sparam = function()
  {
    return 100;
  };

  sandbox.Game_Enemy.prototype.xparam = function()
  {
    return 100;
  };

  sandbox.Game_Enemy.prototype.exp = function()
  {
    return 50;
  };

  sandbox.Game_Enemy.prototype.gold = function()
  {
    return 25;
  };

  sandbox.Game_Map.prototype.encounterStep = function()
  {
    return 30;
  };
}
//endregion engine-stubs
