//region engine-stubs
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';

const noop = function()
{
};

export const DEFAULT_APT_PLUGIN_PARAMS = {
  'menu-switch': '0',
  'max-level-threshold': '-1',
};

/**
 * Globals for {@link out/apt/J-Aptitude.js} after {@link out/J-Base.js}.
 *
 * @param {object} sandbox
 */
export function installAptEngineStubs(sandbox)
{
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-Aptitude')
      {
        return DEFAULT_APT_PLUGIN_PARAMS;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = {
    Metadata: {
      Version: '4.6.0',
    },
  };

  function JABS_Engine()
  {
  }

  JABS_Engine.prototype.gainBasicRewards = noop;

  sandbox.JABS_Engine = JABS_Engine;

  installMinimalMenuUiStubs(sandbox);

  function Scene_Menu()
  {
  }

  Object.setPrototypeOf(Scene_Menu.prototype, sandbox.Scene_MenuBase.prototype);
  Scene_Menu.prototype.constructor = Scene_Menu;
  Scene_Menu.prototype.createCommandWindow = noop;

  sandbox.Scene_Menu = Scene_Menu;

  function Window_MenuCommand()
  {
  }

  Object.setPrototypeOf(Window_MenuCommand.prototype, sandbox.Window_Command.prototype);
  Window_MenuCommand.prototype.constructor = Window_MenuCommand;
  Window_MenuCommand.prototype.addOriginalCommands = noop;

  sandbox.Window_MenuCommand = Window_MenuCommand;

  sandbox.BattleManager = {
    makeRewards: noop,
    gainRewards: noop,
  };

  function Game_Troop()
  {
  }

  Game_Troop.prototype.deadMembers = function()
  {
    return [];
  };

  sandbox.Game_Troop = Game_Troop;

  sandbox.Game_Actor.prototype.onBattlerDataChange = noop;

  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
    this._skills = [];
  };

  sandbox.Game_Actor.prototype.isDead = function()
  {
    return false;
  };

  sandbox.Game_Actor.prototype.learnSkill = function(skillId)
  {
    if (this._skills.includes(skillId) === false)
    {
      this._skills.push(skillId);
    }
  };

  sandbox.Game_Actor.prototype.isLearnedSkill = function(skillId)
  {
    return this._skills.includes(skillId);
  };

  sandbox.Game_Actor.prototype.skill = function(skillId)
  {
    return sandbox.$dataSkills[skillId];
  };

  sandbox.Game_Battler.prototype.databaseData = function()
  {
    return {
      apPoints: 0,
    };
  };
}
//endregion engine-stubs
