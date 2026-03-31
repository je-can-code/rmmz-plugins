//region engine-stubs
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

export const DEFAULT_LOG_PLUGIN_PARAMS = {
  defaultInactivityTime: '60',
};

/**
 * Minimal globals so {@link out/J-Log.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installLogEngineStubs(sandbox)
{
  installPluginManagerWithParams(sandbox, 'J-Log', DEFAULT_LOG_PLUGIN_PARAMS);

  sandbox.__logPluginCommands = sandbox.__logPluginCommands || new Map();
  sandbox.PluginManager.registerCommand = function(pluginName, commandName, callback)
  {
    sandbox.__logPluginCommands.set(`${pluginName}:${commandName}`, callback);
  };

  sandbox.DataManager.createGameObjects = noop;

  sandbox.Graphics.boxWidth = sandbox.Graphics.boxWidth || 1280;
  sandbox.Graphics.boxHeight = sandbox.Graphics.boxHeight || 720;
  sandbox.Graphics.verticalPadding = sandbox.Graphics.verticalPadding || 0;

  if (typeof sandbox.Rectangle !== 'function')
  {
    function Rectangle(x, y, width, height)
    {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    sandbox.Rectangle = Rectangle;
  }

  sandbox.ImageManager = sandbox.ImageManager || {};
  sandbox.ImageManager.iconWidth = 32;
  sandbox.ImageManager.iconHeight = 32;
  sandbox.ImageManager.loadSystem = function()
  {
    return {};
  };

  if (typeof sandbox.Scene_Map !== 'function')
  {
    function Scene_Map()
    {
    }

    Scene_Map.prototype = {};
    Scene_Map.prototype.constructor = Scene_Map;
    sandbox.Scene_Map = Scene_Map;
  }

  sandbox.Scene_Map.prototype.initialize = noop;
  sandbox.Scene_Map.prototype.createAllWindows = noop;
  sandbox.Scene_Map.prototype.addWindow = noop;

  // minimal window classes referenced by scene/window definitions.
  sandbox.Window_Base.prototype.initialize = sandbox.Window_Base.prototype.initialize || noop;
  sandbox.Window_Base.prototype.update = sandbox.Window_Base.prototype.update || noop;

  function Window_Command()
  {
  }

  Window_Command.prototype = Object.create(sandbox.Window_Base.prototype);
  Window_Command.prototype.constructor = Window_Command;
  sandbox.Window_Command = sandbox.Window_Command || Window_Command;

  sandbox.Window_Command.prototype.initialize = sandbox.Window_Command.prototype.initialize || noop;
  sandbox.Window_Command.prototype.isScrollEnabled = sandbox.Window_Command.prototype.isScrollEnabled || function()
  {
    return true;
  };
  sandbox.Window_Command.prototype.smoothScrollTo = sandbox.Window_Command.prototype.smoothScrollTo || noop;
  sandbox.Window_Command.prototype.itemRectWithPadding = sandbox.Window_Command.prototype.itemRectWithPadding
    || function()
    {
      return { x: 0 };
    };
  sandbox.Window_Command.prototype.processDrawIcon = sandbox.Window_Command.prototype.processDrawIcon || noop;
  sandbox.Window_Command.prototype.update = sandbox.Window_Command.prototype.update || noop;
  sandbox.Window_Command.prototype.clearCommandList = sandbox.Window_Command.prototype.clearCommandList || noop;
  sandbox.Window_Command.prototype.addBuiltCommand = sandbox.Window_Command.prototype.addBuiltCommand || noop;
  sandbox.Window_Command.prototype.commandList = sandbox.Window_Command.prototype.commandList || function()
  {
    return [];
  };
  sandbox.Window_Command.prototype.smoothScrollDown = sandbox.Window_Command.prototype.smoothScrollDown || noop;
  sandbox.Window_Command.prototype.refresh = sandbox.Window_Command.prototype.refresh || noop;
  sandbox.Window_Command.prototype.hasCommands = sandbox.Window_Command.prototype.hasCommands || function()
  {
    return true;
  };

  sandbox.$gameMessage = sandbox.$gameMessage || {};
  sandbox.$gameMessage.isBusy = function()
  {
    return false;
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
}
//endregion engine-stubs
