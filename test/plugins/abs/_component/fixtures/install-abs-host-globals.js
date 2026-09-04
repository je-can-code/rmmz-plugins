//region plugins/abs/_component/fixtures/install-abs-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import { installMinimalMenuUiStubs } from '../../../../setup/install-minimal-menu-ui-stubs.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';
import ExternalJsonConfigLoader from '../../../../../src/plugins/_base/core/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../../../src/plugins/_base/core/models/ExternalJsonConfigLoaderOptions.js';
import SerializableRegistry from '../../../../../src/plugins/_base/core/core/SerializableRegistry.js';

const noop = function()
{
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by both
 * _base/_metadata/initialization.js and abs/core/_metadata/initialization.js- each reads whatever these
 * two globals say *at the moment it runs* into its own plugin's Metadata.Name/Version. Call this right
 * before importing J-Base's initialization.js so J.BASE.Metadata.Version satisfies J-ABS's own
 * `requiredBaseVersion` gate.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS's own identity. Call this right
 * before importing abs/core/_metadata/initialization.js, after {@link setPluginContextToJBase} and the
 * J-Base initialization.js import it guards.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJAbs(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS';
  sandbox.__PLUGIN_VERSION__ = '4.18.0';
}

/**
 * Seeds placeholder engine classes (sprites, Scene_Map, Input, etc.), plus the $gameMap/$jabsEngine/
 * JABS_AiManager bare globals J-ABS's core files read from, for direct-import tests.
 * @param {object} sandbox The sandbox to install onto.
 */
function installAbsEnginePlaceholderGlobals(sandbox)
{
  const extraEnginePlaceholders = [
    'Game_Interpreter',
    'Game_Switches',
    'Game_Unit',
    'Spriteset_Base',
    'Spriteset_Map',
    'Sprite_Animation',
    'Sprite_AnimationMV',
    'Sprite_Gauge',
    'Sprite_HitboxPulse',
    'Sprite_MapCastGauge',
    'Sprite_MapHpGauge',
    'Input',
    'TouchInput',
    'Scene_Load',
    'Scene_Map',
    'AudioManager',
  ];

  for (const name of extraEnginePlaceholders)
  {
    if (typeof sandbox[name] !== 'function')
    {
      function Placeholder()
      {
      }

      Placeholder.prototype = {};
      sandbox[name] = Placeholder;
    }
  }

  sandbox.Spriteset_Map.prototype.createUpperLayer = noop;
  sandbox.Scene_Map.prototype.isReady = function()
  {
    return true;
  };

  sandbox.Input = sandbox.Input || {};
  sandbox.Input.dir8 = 0;
  sandbox.Input.keyMapper = sandbox.Input.keyMapper || {};
  sandbox.Input.isTriggered = function()
  {
    return false;
  };

  sandbox.$gameMap = sandbox.$gameMap || {
    width()
    {
      return 2;
    },
    height()
    {
      return 2;
    },
    tileWidth()
    {
      return 48;
    },
    tileHeight()
    {
      return 48;
    },
    distance()
    {
      return 0;
    },
    requestRefresh: noop,
  };

  sandbox.$jabsEngine = {
    absEnabled: true,
  };

  sandbox.JABS_AiManager = sandbox.JABS_AiManager || {};
  sandbox.JABS_AiManager.getBattlerByUuid = sandbox.JABS_AiManager.getBattlerByUuid || function()
  {
    return null;
  };
  sandbox.JABS_AiManager.getAlliedBattlersWithinRange = sandbox.JABS_AiManager.getAlliedBattlersWithinRange
    || function()
    {
      return [];
    };
  sandbox.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance =
    sandbox.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance || function()
    {
      return [];
    };
}

/**
 * Globals required for J-ABS's prototype-patch source files (core/objects, core/managers) to
 * evaluate when direct-imported into the real Vitest realm instead of a nested vm context. Mirrors the
 * shape of {@link installAbsEngineStubs} in engine-stubs.js (used by the VM path), but targets
 * `globalThis` by default so bare-global identifiers resolve the same way they would in a real RPG Maker
 * script-concatenation runtime.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>|null} [jAbsPluginParameterStrings]
 */
export function installAbsHostGlobals(sandbox = globalThis, jAbsPluginParameterStrings = null)
{
  if (sandbox.__absHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__absHostGlobalsInstalled = true;

  // J-ABS requires J-Base to already be loaded- same as the shipped runtime's script concatenation order.
  installJBaseHostGlobals(sandbox);

  // J-ABS's own _pluginMetadata.js reads PIXI.BLEND_MODES.ADD/NORMAL for its hitbox overlay style config.
  sandbox.PIXI.BLEND_MODES ??= { NORMAL: 0, ADD: 1 };

  // J-ABS's _pluginMetadata.js subclasses this real J-Base class- the shipped runtime concatenates
  // J-Base ahead of every extension plugin, so PluginMetadata is always a bare global by then.
  sandbox.PluginMetadata ??= PluginMetadata;

  // J.ABS.Helpers.loadExternalConfig() reads data/config.jabs.json via these two real J-Base bare globals.
  sandbox.ExternalJsonConfigLoader ??= ExternalJsonConfigLoader;
  sandbox.ExternalJsonConfigLoaderOptions ??= ExternalJsonConfigLoaderOptions;

  // several abs/core/models/*.js files register themselves against this bare global as an import-time
  // side effect (e.g. JABS_BattleMemory, JABS_HitstopData)- the shipped bundle concatenates every _base/abs
  // file into one top-level script scope, so this works there without an import.
  sandbox.SerializableRegistry ??= SerializableRegistry;

  // J-ABS's own _pluginMetadata.js hoists these namespace slices ahead of initialization.js evaluating.
  sandbox.J ||= {};
  sandbox.J.ABS = sandbox.J.ABS || {
    Directions: {
      UP: 8,
      RIGHT: 6,
      LEFT: 4,
      DOWN: 2,
      LOWERLEFT: 1,
      LOWERRIGHT: 3,
      UPPERLEFT: 7,
      UPPERRIGHT: 9,
    },
    Shapes: {
      Circle: 'circle',
      Rhombus: 'rhombus',
      Square: 'square',
      Line: 'line',
      Arc: 'arc',
    },
  };

  installMinimalMenuUiStubs(sandbox);

  const strings = jAbsPluginParameterStrings ?? {
    defaultStateSpreadTickInterval: '30',
    maxAiUpdateRange: '20',
  };

  installPluginManagerWithParams(sandbox, 'J-ABS', strings);

  sandbox.StorageManager.fsReadFile = function(path)
  {
    if (path === 'data/config.jabs.json')
    {
      return JSON.stringify({
        teams: [],
        loot: { magnetRadius: 3 },
      });
    }

    return null;
  };

  installAbsEnginePlaceholderGlobals(sandbox);
}
//endregion plugins/abs/_component/fixtures/install-abs-host-globals.js
