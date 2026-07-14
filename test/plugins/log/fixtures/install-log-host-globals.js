//region install-log-host-globals
import { installJBaseHostGlobals } from '../../_base/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

const noop = function()
{
};

export const DEFAULT_LOG_PLUGIN_PARAMS = {
  defaultInactivityTime: '60',
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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Log's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJLog(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Log';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-Log's DataManager/pluginCommands/Window_MapLog.js to evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installLogHostGlobals(sandbox = globalThis)
{
  if (sandbox.__logHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__logHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // log's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-Log', DEFAULT_LOG_PLUGIN_PARAMS);

  // pluginCommands.js registers real commands as an import-time side effect; capture them.
  sandbox.__logPluginCommands = sandbox.__logPluginCommands || new Map();
  sandbox.PluginManager.registerCommand = function(pluginName, commandName, callback)
  {
    sandbox.__logPluginCommands.set(`${pluginName}:${commandName}`, callback);
  };

  // DataManager.js's createGameObjects alias captures whatever's here as "original".
  sandbox.DataManager.createGameObjects = noop;

  // log/managers/DataManager.js assigns these as bare (undeclared) globals; pre-seed them so the
  // strict-mode module assignment resolves against an existing globalThis property.
  sandbox.$actionLogManager = null;
  sandbox.$diaLogManager = null;
  sandbox.$lootLogManager = null;

  sandbox.Graphics.boxWidth ??= 1280;
  sandbox.Graphics.boxHeight ??= 720;
  sandbox.Graphics.verticalPadding ??= 0;

  function Rectangle(x, y, width, height)
  {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  sandbox.Rectangle = sandbox.Rectangle || Rectangle;

  sandbox.ImageManager = sandbox.ImageManager || {};
  sandbox.ImageManager.iconWidth = 32;
  sandbox.ImageManager.iconHeight = 32;
  sandbox.ImageManager.loadSystem = () => ({});

  sandbox.Scene_Map.prototype.initialize = noop;
  sandbox.Scene_Map.prototype.createAllWindows = noop;
  sandbox.Scene_Map.prototype.addWindow = noop;

  sandbox.Window_Base.prototype.initialize = sandbox.Window_Base.prototype.initialize || noop;
  sandbox.Window_Base.prototype.update = sandbox.Window_Base.prototype.update || noop;

  // Window_Command is not one of installJBaseHostGlobals's placeholder classes.
  function Window_Command()
  {
  }

  Window_Command.prototype = Object.create(sandbox.Window_Base.prototype);
  Window_Command.prototype.constructor = Window_Command;
  sandbox.Window_Command = sandbox.Window_Command || Window_Command;

  sandbox.Window_Command.prototype.initialize = sandbox.Window_Command.prototype.initialize || noop;
  sandbox.Window_Command.prototype.isScrollEnabled = sandbox.Window_Command.prototype.isScrollEnabled || (() => true);
  sandbox.Window_Command.prototype.smoothScrollTo = sandbox.Window_Command.prototype.smoothScrollTo || noop;
  sandbox.Window_Command.prototype.itemRectWithPadding = sandbox.Window_Command.prototype.itemRectWithPadding
    || (() => ({ x: 0 }));
  sandbox.Window_Command.prototype.processDrawIcon = sandbox.Window_Command.prototype.processDrawIcon || noop;
  sandbox.Window_Command.prototype.update = sandbox.Window_Command.prototype.update || noop;
  sandbox.Window_Command.prototype.clearCommandList = sandbox.Window_Command.prototype.clearCommandList || noop;
  sandbox.Window_Command.prototype.addBuiltCommand = sandbox.Window_Command.prototype.addBuiltCommand || noop;
  sandbox.Window_Command.prototype.commandList = sandbox.Window_Command.prototype.commandList || (() => []);
  sandbox.Window_Command.prototype.smoothScrollDown = sandbox.Window_Command.prototype.smoothScrollDown || noop;
  sandbox.Window_Command.prototype.refresh = sandbox.Window_Command.prototype.refresh || noop;
  sandbox.Window_Command.prototype.hasCommands = sandbox.Window_Command.prototype.hasCommands || (() => true);

  sandbox.$gameMessage = sandbox.$gameMessage || {};
  sandbox.$gameMessage.isBusy = () => false;

  sandbox.$gamePlayer = sandbox.$gamePlayer || {};
  sandbox.$gamePlayer.screenX = () => 0;
  sandbox.$gamePlayer.screenY = () => 0;
}
//endregion install-log-host-globals
