//region engine-stubs
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

/**
 * Minimal globals so {@link out/J-CA-Mods.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installCamodsEngineStubs(sandbox)
{
  installPluginManagerWithParams(sandbox, 'J-CA-Mods', {});

  sandbox.J = sandbox.J || {};
  sandbox.J.BASE = sandbox.J.BASE || { Helpers: {} };

  // allow tests to intercept variable modifications easily.
  sandbox.J.BASE.Helpers.modVariable = sandbox.J.BASE.Helpers.modVariable || noop;

  sandbox.JABS_Button = {
    Tool: 'tool',
    Mainhand: 'mainhand',
    Offhand: 'offhand',
  };

  function JABS_Battler()
  {
  }

  JABS_Battler.prototype.getTargetFrameText = function()
  {
    return '';
  };
  sandbox.JABS_Battler = sandbox.JABS_Battler || JABS_Battler;

  function JABS_Engine()
  {
  }

  JABS_Engine.prototype.addLootDropToMap = function(targetX, targetY, item)
  {
    return { targetX, targetY, item };
  };
  JABS_Engine.prototype.handleDefeatedEnemy = noop;
  JABS_Engine.prototype.handleDefeatedPlayer = noop;
  JABS_Engine.prototype.postExecuteSkillEffects = noop;
  JABS_Engine.prototype.executeMapAction = noop;
  JABS_Engine.prototype.handlePartyCycleMemberChanges = noop;
  sandbox.JABS_Engine = sandbox.JABS_Engine || JABS_Engine;

  if (typeof sandbox.Game_Actor !== 'function')
  {
    function Game_Actor()
    {
    }

    Game_Actor.prototype = {};
    Game_Actor.prototype.constructor = Game_Actor;
    sandbox.Game_Actor = Game_Actor;
  }

  sandbox.Game_Actor.prototype.equipSlots = function()
  {
    return [];
  };
  sandbox.Game_Actor.prototype.basicFloorDamage = function()
  {
    return 0;
  };

  if (typeof sandbox.Game_BattlerBase !== 'function')
  {
    function Game_BattlerBase()
    {
    }

    Game_BattlerBase.prototype = {};
    Game_BattlerBase.prototype.constructor = Game_BattlerBase;
    sandbox.Game_BattlerBase = Game_BattlerBase;
  }

  sandbox.Game_BattlerBase.prototype.recoverAll = noop;

  if (typeof sandbox.Game_Map !== 'function')
  {
    function Game_Map()
    {
    }

    Game_Map.prototype = {};
    Game_Map.prototype.constructor = Game_Map;
    sandbox.Game_Map = Game_Map;
  }

  sandbox.Game_Map.prototype.setup = noop;

  if (typeof sandbox.Game_Action !== 'function')
  {
    function Game_Action()
    {
    }

    Game_Action.prototype = {};
    Game_Action.prototype.constructor = Game_Action;
    sandbox.Game_Action = Game_Action;
  }

  if (typeof sandbox.Game_Enemy !== 'function')
  {
    function Game_Enemy()
    {
    }

    Game_Enemy.prototype = {};
    Game_Enemy.prototype.constructor = Game_Enemy;
    sandbox.Game_Enemy = Game_Enemy;
  }

  sandbox.Game_Enemy.prototype.dropSources = function()
  {
    return [];
  };

  if (typeof sandbox.Game_Party !== 'function')
  {
    function Game_Party()
    {
      this._actors = [];
    }

    Game_Party.prototype = {};
    Game_Party.prototype.constructor = Game_Party;
    sandbox.Game_Party = Game_Party;
  }

  sandbox.$gameParty = sandbox.$gameParty || new sandbox.Game_Party();

  if (typeof sandbox.Scene_Map !== 'function')
  {
    function Scene_Map()
    {
    }

    Scene_Map.prototype = {};
    Scene_Map.prototype.constructor = Scene_Map;
    sandbox.Scene_Map = Scene_Map;
  }

  if (typeof sandbox.Scene_Base !== 'function')
  {
    function Scene_Base()
    {
    }

    Scene_Base.prototype = {};
    Scene_Base.prototype.constructor = Scene_Base;
    sandbox.Scene_Base = Scene_Base;
  }

  if (typeof sandbox.Scene_MenuBase !== 'function')
  {
    function Scene_MenuBase()
    {
    }

    Scene_MenuBase.prototype = Object.create(sandbox.Scene_Base.prototype);
    Scene_MenuBase.prototype.constructor = Scene_MenuBase;
    sandbox.Scene_MenuBase = Scene_MenuBase;
  }
}
//endregion engine-stubs
