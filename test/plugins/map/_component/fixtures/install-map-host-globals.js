//region plugins/map/_component/fixtures/install-map-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';
import { DEFAULT_MAP_PLUGIN_PARAMS } from './map-plugin-params.js';

const noop = function()
{
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * _base/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-MAP's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJMap(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-MAP';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-MAP's DataManager/Game_Event/Game_Map/Game_System/Scene_Map/pluginCommands
 * to evaluate when direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} [mapPluginParameterStrings] `PluginManager.parameters('J-MAP')` shape.
 */
export function installMapHostGlobals(sandbox = globalThis, mapPluginParameterStrings = DEFAULT_MAP_PLUGIN_PARAMS)
{
  if (sandbox.__mapHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__mapHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // map's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-MAP', mapPluginParameterStrings);

  // pluginCommands.js calls PluginManager.registerCommand(...) as an import-time side effect;
  // capture registrations so tests can invoke them directly.
  sandbox.PluginManager.__commands = sandbox.PluginManager.__commands || new Map();
  sandbox.PluginManager.registerCommand = function(pluginName, commandName, callback)
  {
    sandbox.PluginManager.__commands.set(`${pluginName}:${commandName}`, callback);
  };

  sandbox.Input = sandbox.Input || {};
  sandbox.Input.registerAction = noop;
  sandbox.Input.seedDefaultBindings = noop;
  sandbox.Input.getAllBindings = () => [];

  // DataManager.js's createGameObjects alias captures whatever's here as "original" before
  // overwriting it; installJBaseHostGlobals's DataManager stub has no such method.
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
  sandbox.$gameMap.isMinimapBlocked = () => false;
  sandbox.$gameMap.tileWidth = () => 48;
  sandbox.$gameMap.tileHeight = () => 48;

  sandbox.$gamePlayer = sandbox.$gamePlayer || {};
  sandbox.$gamePlayer.screenX = () => 0;
  sandbox.$gamePlayer.screenY = () => 0;

  function Sprite_MiniMap()
  {
    this.visible = true;
    this.alpha = 1.0;
    this.x = 0;
    this.y = 0;
    this.bitmap = { width: 100, height: 100 };
  }

  Sprite_MiniMap.prototype.isInFocusMode = () => false;
  sandbox.Sprite_MiniMap = sandbox.Sprite_MiniMap || Sprite_MiniMap;

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

  sandbox.Game_Event.prototype.initMembers = noop;
  sandbox.Game_Event.prototype.refresh = noop;
  sandbox.Game_Event.prototype.isErased = () => false;
  sandbox.Game_Event.prototype.isJabsLoot = () => false;
  sandbox.Game_Event.prototype.getJabsBattler = () => null;
  sandbox.Game_Event.prototype.isTeleportEvent = () => false;
  sandbox.Game_Event.prototype.isQuestEvent = () => false;
  sandbox.Game_Event.prototype.note = () => '';
  sandbox.Game_Event.prototype.getValidCommentCommands = () => [];

  sandbox.Game_Map.prototype.initialize = function()
  {
    this.initMembers();
  };

  // J-Base adds this hook and calls it from an aliased `initialize`; plugins adding state to
  // this host alias the hook rather than `initialize`, so their chain needs it to exist.
  sandbox.Game_Map.prototype.initMembers = noop;

  sandbox.Game_System.prototype.initMembers = noop;

  // real vanilla RMMZ method (rmmz_scenes.js), normally provided by _base/scenes/Scene_Base.js;
  // stubbed directly here since nothing else under test needs the rest of that file.
  sandbox.Scene_Map.prototype.isMapScene = () => true;
  sandbox.Scene_Map.prototype.initialize = noop;
  sandbox.Scene_Map.prototype.createAllWindows = noop;
  sandbox.Scene_Map.prototype.update = noop;
  sandbox.Scene_Map.prototype.addChild = noop;

  function JABS_Engine()
  {
  }

  JABS_Engine.prototype.addLootDropToMap = () => null;
  sandbox.JABS_Engine = sandbox.JABS_Engine || JABS_Engine;
}
//endregion plugins/map/_component/fixtures/install-map-host-globals.js
