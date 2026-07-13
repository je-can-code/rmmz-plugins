//region install-level-host-globals
import { installJBaseHostGlobals } from '../../_base/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';
import ExternalJsonConfigLoader from '../../../../src/plugins/_base/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../../src/plugins/_base/models/ExternalJsonConfigLoaderOptions.js';
import { DEFAULT_LEVEL_CONFIG_JSON } from './engine-stubs.js';

const noop = function()
{
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by both
 * _base/_metadata/initialization.js and level/core/_metadata/initialization.js.
 * Call this right before importing J-Base's initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-LevelMaster's own identity. Call this
 * right before importing level/core/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJLevel(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-LevelMaster';
  sandbox.__PLUGIN_VERSION__ = '1.3.1';
}

/**
 * Globals required for J-LevelMaster's prototype-patch source files (core/objects/*.js,
 * core/managers/*.js) to evaluate when direct-imported into the real Vitest realm instead of a nested
 * vm context. Mirrors the shape of {@link installLevelEngineStubs} in engine-stubs.js (used by the VM
 * path), but targets `globalThis` by default so bare-global identifiers resolve the same way they would
 * in a real RPG Maker script-concatenation runtime.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {string} [levelConfigJson] Full JSON text for StorageManager.fsReadFile (data/config.level.json).
 */
export function installLevelHostGlobals(sandbox = globalThis, levelConfigJson = DEFAULT_LEVEL_CONFIG_JSON)
{
  if (sandbox.__levelHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__levelHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // J-LevelMaster's _pluginMetadata.js subclasses this real J-Base class.
  sandbox.PluginMetadata ??= PluginMetadata;

  // J.LEVEL.Helpers.loadExternalConfig() reads data/config.level.json via these two real J-Base globals.
  sandbox.ExternalJsonConfigLoader ??= ExternalJsonConfigLoader;
  sandbox.ExternalJsonConfigLoaderOptions ??= ExternalJsonConfigLoaderOptions;

  if (typeof sandbox.Number.prototype.padZero !== 'function')
  {
    sandbox.Number.prototype.padZero = function(length)
    {
      return String(this).padStart(length, '0');
    };
  }

  // real RMMZ engine method (rmmz_core.js)- LevelScaling.calculate() relies on it.
  if (typeof sandbox.Number.prototype.clamp !== 'function')
  {
    sandbox.Number.prototype.clamp = function(min, max)
    {
      return Math.min(Math.max(this, min), max);
    };
  }

  sandbox.StorageManager.fsReadFile = function()
  {
    return levelConfigJson;
  };

  sandbox.$gameVariables._data = [];
  sandbox.$gameVariables.value = function(variableId)
  {
    const raw = this._data[variableId];
    return raw === undefined || raw === null ? 0 : raw;
  };
  sandbox.$gameVariables.setValue = function(variableId, value)
  {
    this._data[variableId] = value;
  };

  sandbox.JABS_AiManager = sandbox.JABS_AiManager || { postConvertMutate: noop };

  const extraEnginePlaceholders = [ 'Game_Troop', 'Sprite_Character' ];
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

  sandbox.Game_System.prototype.initialize = noop;
  sandbox.Game_Event.prototype.initMembers = noop;
  sandbox.Game_Temp.prototype.initMembers = noop;

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;
  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
    if (this._level === undefined || this._level === null)
    {
      this._level = 1;
    }
  };
  sandbox.Game_Actor.prototype.actor = function()
  {
    return this.__actorDb ?? { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
  };
  sandbox.Game_Actor.prototype.class = function()
  {
    return { note: '', params: [] };
  };
  sandbox.Game_Actor.prototype.currentClass = function()
  {
    const classId = this.actor().classId;
    const row = sandbox.$dataClasses && sandbox.$dataClasses[classId];
    return row ?? { id: classId, note: '', params: [ [], [], [], [], [], [], [], [] ] };
  };
  sandbox.Game_Actor.prototype.equippedEquips = function()
  {
    return [];
  };
  sandbox.Game_Actor.prototype.equips = function()
  {
    return [];
  };
  sandbox.Game_Actor.prototype.allStates = function()
  {
    return [];
  };
  sandbox.Game_Actor.prototype.actorId = function()
  {
    return 1;
  };
  sandbox.Game_Actor.prototype.setup = noop;

  Object.setPrototypeOf(sandbox.Game_Enemy.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Enemy.prototype.constructor = sandbox.Game_Enemy;
  sandbox.Game_Enemy.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };
  sandbox.Game_Enemy.prototype.setup = noop;
  sandbox.Game_Enemy.prototype.enemy = function()
  {
    return this._enemyDb;
  };
  sandbox.Game_Enemy.prototype.enemyId = function()
  {
    return 1;
  };
  sandbox.Game_Enemy.prototype.states = function()
  {
    return [];
  };

  sandbox.Game_Battler.prototype.traitObjects = function()
  {
    return [];
  };

  sandbox.Game_Action.prototype.makeDamageValue = function()
  {
    return 100;
  };
  sandbox.Game_Action.prototype.subject = function()
  {
    return this.__subject ?? { level: 10 };
  };

  sandbox.Game_Troop.prototype.expTotal = function()
  {
    return 0;
  };
  sandbox.Game_Troop.prototype.deadMembers = function()
  {
    return [];
  };

  sandbox.Game_Party.prototype.battleMembers = function()
  {
    return [];
  };

  sandbox.Sprite_Character.prototype.getBattlerName = function()
  {
    return { name: 'Slime', colorHex: '#ffffff' };
  };
  sandbox.Sprite_Character.prototype.getBattler = function()
  {
    return {
      isEnemy: () => true,
      level: 7,
      shouldHideLevel: () => false,
    };
  };
}
//endregion install-level-host-globals
