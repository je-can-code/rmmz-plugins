//region engine-stubs
import { DEFAULT_MAP_PLUGIN_PARAMS } from './map-plugin-params.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

/**
 * Minimal globals so {@link out/J-Map.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installMapEngineStubs(sandbox)
{
  installPluginManagerWithParams(sandbox, 'J-MAP', DEFAULT_MAP_PLUGIN_PARAMS);

  sandbox.PluginManager.__commands = sandbox.PluginManager.__commands || new Map();
  sandbox.PluginManager.registerCommand = function(pluginName, commandName, callback)
  {
    sandbox.PluginManager.__commands.set(`${pluginName}:${commandName}`, callback);
  };

  sandbox.Input = sandbox.Input || {};
  sandbox.Input.registerAction = noop;
  sandbox.Input.seedDefaultBindings = noop;
  sandbox.Input.getAllBindings = function()
  {
    return [];
  };

  sandbox.DataManager.createGameObjects = noop;

  sandbox.SceneManager = sandbox.SceneManager || {};
  sandbox.SceneManager._scene = null;

  sandbox.$gameSystem = sandbox.$gameSystem || {};
  sandbox.$gameSystem._minimapVisible = true;
  sandbox.$gameSystem.isMinimapVisible = function()
  {
    return this._minimapVisible;
  };
  sandbox.$gameSystem.showMinimap = function()
  {
    this._minimapVisible = true;
  };
  sandbox.$gameSystem.hideMinimap = function()
  {
    this._minimapVisible = false;
  };

  sandbox.$gameMap = sandbox.$gameMap || {};
  sandbox.$gameMap.isMinimapBlocked = function()
  {
    return false;
  };
  sandbox.$gameMap.tileWidth = function()
  {
    return 48;
  };
  sandbox.$gameMap.tileHeight = function()
  {
    return 48;
  };

  sandbox.$gamePlayer = sandbox.$gamePlayer || {};
  sandbox.$gamePlayer.screenX = function()
  {
    return 0;
  };
  sandbox.$gamePlayer.screenY = function()
  {
    return 0;
  };

  if (typeof sandbox.Sprite_MiniMap !== 'function')
  {
    function Sprite_MiniMap()
    {
      this.visible = true;
      this.alpha = 1.0;
      this.x = 0;
      this.y = 0;
      this.bitmap = { width: 100, height: 100 };
    }

    Sprite_MiniMap.prototype.isInFocusMode = function()
    {
      return false;
    };

    sandbox.Sprite_MiniMap = Sprite_MiniMap;
  }

  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = {
    EXT: {
      INPUT: {
        Symbols: {
          DPadUp: 'dpadUp',
          DPadDown: 'dpadDown',
        },
      },
    },
  };

  sandbox.JABS_InputAdapter = sandbox.JABS_InputAdapter || {};

  if (typeof sandbox.Game_Event !== 'function')
  {
    function Game_Event()
    {
    }

    Game_Event.prototype = {};
    Game_Event.prototype.constructor = Game_Event;
    sandbox.Game_Event = Game_Event;
  }

  sandbox.Game_Event.prototype.initMembers = function()
  {
  };
  sandbox.Game_Event.prototype.refresh = function()
  {
  };
  sandbox.Game_Event.prototype.isErased = function()
  {
    return false;
  };
  sandbox.Game_Event.prototype.isJabsLoot = function()
  {
    return false;
  };
  sandbox.Game_Event.prototype.getJabsBattler = function()
  {
    return null;
  };
  sandbox.Game_Event.prototype.isTeleportEvent = function()
  {
    return false;
  };
  sandbox.Game_Event.prototype.isQuestEvent = function()
  {
    return false;
  };
  sandbox.Game_Event.prototype.note = function()
  {
    return '';
  };
  sandbox.Game_Event.prototype.getValidCommentCommands = function()
  {
    return [];
  };

  if (typeof sandbox.Game_Map !== 'function')
  {
    function Game_Map()
    {
    }

    Game_Map.prototype = {};
    Game_Map.prototype.constructor = Game_Map;
    sandbox.Game_Map = Game_Map;
  }

  sandbox.Game_Map.prototype.initialize = noop;

  if (typeof sandbox.Game_System !== 'function')
  {
    function Game_System()
    {
    }

    Game_System.prototype = {};
    Game_System.prototype.constructor = Game_System;
    sandbox.Game_System = Game_System;
  }

  sandbox.Game_System.prototype.initMembers = noop;

  function JABS_Engine()
  {
  }

  JABS_Engine.prototype.addLootDropToMap = function()
  {
    return null;
  };
  sandbox.JABS_Engine = sandbox.JABS_Engine || JABS_Engine;

  function JABS_StandardController()
  {
  }

  JABS_StandardController.prototype.update = noop;
  sandbox.JABS_StandardController = sandbox.JABS_StandardController || JABS_StandardController;

  function Scene_Map()
  {
  }

  Scene_Map.prototype = {};
  Scene_Map.prototype.constructor = Scene_Map;
  Scene_Map.prototype.initialize = noop;
  Scene_Map.prototype.createAllWindows = noop;
  Scene_Map.prototype.update = noop;
  Scene_Map.prototype.addChild = noop;
  sandbox.Scene_Map = sandbox.Scene_Map || Scene_Map;

  function Window_JabsRemapActions()
  {
  }

  Window_JabsRemapActions.prototype = Object.create(sandbox.Window_Base.prototype);
  Window_JabsRemapActions.prototype.constructor = Window_JabsRemapActions;
  Window_JabsRemapActions.prototype.initialize = noop;
  sandbox.Window_JabsRemapActions = sandbox.Window_JabsRemapActions || Window_JabsRemapActions;
}
//endregion engine-stubs
