//region install-sdp-host-globals
import { installJBaseHostGlobals } from '../../_base/fixtures/install-j-base-host-globals.js';
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';
import ExternalJsonConfigLoader from '../../../../src/plugins/_base/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../../src/plugins/_base/models/ExternalJsonConfigLoaderOptions.js';
import PluginVersion from '../../../../src/plugins/_base/models/PluginVersion.js';
import SerializableRegistry from '../../../../src/plugins/_base/core/SerializableRegistry.js';

const noop = function()
{
};

export const DEFAULT_SDP_PLUGIN_PARAMS = {
  menuSwitch: '104',
  sdpIcon: '306',
  victoryText: 'SDP points earned!',
  menuCommandName: 'Distribute',
  menuCommandIcon: '2563',
  sdpUnitSingular: 'panel',
  sdpUnitPlural: 'panels',
  sdpPointsDisplayName: 'SDP',
  showInBoth: 'false',
  sdpDefaultCommonBase: '0',
  sdpDefaultCommonFlat: '70',
  sdpDefaultCommonMult: '1.06',
  sdpDefaultMagicalBase: '0',
  sdpDefaultMagicalFlat: '235',
  sdpDefaultMagicalMult: '1.06',
  sdpDefaultRareBase: '0',
  sdpDefaultRareFlat: '1180',
  sdpDefaultRareMult: '1.06',
  sdpDefaultEpicBase: '0',
  sdpDefaultEpicFlat: '4320',
  sdpDefaultEpicMult: '1.06',
  sdpDefaultLegendaryBase: '0',
  sdpDefaultLegendaryFlat: '11900',
  sdpDefaultLegendaryMult: '1.06',
  sdpDefaultGodlikeBase: '0',
  sdpDefaultGodlikeFlat: '30500',
  sdpDefaultGodlikeMult: '1.06',
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by both
 * _base/_metadata/initialization.js and sdp/core/_metadata/initialization.js.
 * Call this right before importing J-Base's initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-SDP's own identity. Call this
 * right before importing sdp/core/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJSdp(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-SDP';
  sandbox.__PLUGIN_VERSION__ = '3.1.0';
}

/**
 * Globals required for J-SDP's prototype-patch source files (core/objects/*.js, core/managers/*.js,
 * core/models/*.js) to evaluate when direct-imported into the real Vitest realm instead of a nested vm
 * context. Mirrors the shape of the legacy `installSdpEngineStubs` (used by the VM path), but targets
 * `globalThis` by default so bare-global identifiers resolve the same way they would in a real RPG Maker
 * script-concatenation runtime.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {string} [sdpConfigJson] Full JSON text for StorageManager.fsReadFile (data/config.sdp.json).
 */
export function installSdpHostGlobals(sandbox = globalThis, sdpConfigJson = '{"subgroups":[],"sdps":[]}')
{
  if (sandbox.__sdpHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__sdpHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // J-SDP's _pluginMetadata.js subclasses this real J-Base class.
  sandbox.PluginMetadata ??= PluginMetadata;

  // J_SdpPluginMetadata#initializePanels() reads data/config.sdp.json via these real J-Base globals.
  sandbox.ExternalJsonConfigLoader ??= ExternalJsonConfigLoader;
  sandbox.ExternalJsonConfigLoaderOptions ??= ExternalJsonConfigLoaderOptions;

  // J_SdpPluginMetadata.#hasMinimumBaseVersion() compares against J.BASE.Metadata.Version via this.
  sandbox.PluginVersion ??= PluginVersion;

  // sdp/core/models/PanelRanking.js registers itself for save/load via this real J-Base global.
  sandbox.SerializableRegistry ??= SerializableRegistry;

  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-SDP')
      {
        return DEFAULT_SDP_PLUGIN_PARAMS;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  sandbox.StorageManager.fsReadFile = function()
  {
    return sdpConfigJson;
  };

  sandbox.SoundManager.playRecovery = noop;

  installMinimalMenuUiStubs(sandbox);

  function BattleManagerCtor()
  {
  }

  BattleManagerCtor.makeRewards = noop;
  BattleManagerCtor.gainRewards = noop;
  BattleManagerCtor.displayRewards = noop;

  sandbox.BattleManager = BattleManagerCtor;

  sandbox.IconManager = {
    longParam()
    {
      return '';
    },
  };

  sandbox.TextManager.longParam = function()
  {
    return '';
  };

  sandbox.TextManager.longParamDescription = function()
  {
    return '';
  };

  sandbox.Game_Action.prototype.applyGlobal = noop;
  sandbox.Game_Action.prototype.apply = noop;

  // sdp's own Game_Actor.js aliases these onto whatever the "base" already provides; the real
  // _base/objects/Game_Actor.js doesn't define param/xparam/sparam/maxTp (those are vanilla engine
  // methods), so these defaults stand in for the vanilla engine the same way the VM harness did.
  sandbox.Game_Actor.prototype.onBattlerDataChange = noop;

  sandbox.Game_Actor.prototype.param = function()
  {
    return 0;
  };

  sandbox.Game_Actor.prototype.xparam = function()
  {
    return 0;
  };

  sandbox.Game_Actor.prototype.sparam = function()
  {
    return 0;
  };

  sandbox.Game_Actor.prototype.maxTp = function()
  {
    return 0;
  };

  sandbox.Game_Enemy.prototype.extraDrops = function()
  {
    return [];
  };

  sandbox.Game_Enemy.prototype.findLoot = function()
  {
    return null;
  };

  sandbox.Game_Party.prototype.initialize = noop;

  sandbox.$gameActors = {
    _byId: {},
    actor(id)
    {
      const a = this._byId[id];
      if (a === undefined || a === null)
      {
        return null;
      }

      return a;
    },
    actors()
    {
      return Object.keys(this._byId)
        .map(k => this._byId[k])
        .filter(a => a !== undefined && a !== null);
    },
  };

  sandbox.Game_Player.prototype.useOnPickup = noop;

  sandbox.Game_System.prototype.initialize = noop;

  function Game_Troop()
  {
  }

  Game_Troop.prototype.deadMembers = function()
  {
    return [];
  };

  sandbox.Game_Troop = Game_Troop;
}
//endregion install-sdp-host-globals
