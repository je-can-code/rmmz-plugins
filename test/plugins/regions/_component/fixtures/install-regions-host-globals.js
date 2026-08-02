//region plugins/regions/_component/fixtures/install-regions-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

const noop = function()
{
};

export const DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS = {
  globalAllowRegions: '[]',
  globalDenyRegions: '[]',
};

export const DEFAULT_REGION_STATES_PLUGIN_PARAMS = {
  'application-delay': '15',
};

export const DEFAULT_REGION_SKILLS_PLUGIN_PARAMS = {
  'execution-delay': '60',
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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-RegionEffects's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJRegions(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-RegionEffects';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Region-Skills's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJRegionsSkills(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Region-Skills';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Region-States's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJRegionsStates(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Region-States';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * @param {object} sandbox
 * @param {object} [options]
 * @param {Record<string, string>} [options.effects]
 * @param {Record<string, string>} [options.states]
 * @param {Record<string, string>} [options.skills]
 */
export function installRegionsFamilyPluginManager(sandbox, options = {})
{
  const {
    effects = DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
    states = DEFAULT_REGION_STATES_PLUGIN_PARAMS,
    skills = DEFAULT_REGION_SKILLS_PLUGIN_PARAMS,
  } = options;

  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-RegionEffects')
      {
        return effects;
      }

      if (name === 'J-Region-States')
      {
        return states;
      }

      if (name === 'J-Region-Skills')
      {
        return skills;
      }

      return prevPm.parameters(name);
    },

    registerCommand()
    {
    },
  };
}

/**
 * Ensures {@link Game_Map} has the engine methods the region core plugin aliases.
 * @param {object} sandbox
 */
function installRegionsBaseGameMapPrototype(sandbox)
{
  const Gp = sandbox.Game_Map.prototype;

  if (typeof Gp.initialize !== 'function')
  {
    Gp.initialize = noop;
  }

  if (typeof Gp.setup !== 'function')
  {
    Gp.setup = noop;
  }

  if (typeof Gp.isPassable !== 'function')
  {
    Gp.isPassable = function()
    {
      return true;
    };
  }

  if (typeof Gp.note !== 'function')
  {
    Gp.note = function()
    {
      if (!sandbox.$dataMap)
      {
        return '';
      }

      return sandbox.$dataMap.note || '';
    };
  }

  if (typeof Gp.regionId !== 'function')
  {
    Gp.regionId = function()
    {
      return 0;
    };
  }
}

/**
 * Ensures {@link Game_Character}/{@link Game_CharacterBase} have the engine methods the region
 * extension stacks alias.
 * @param {object} sandbox
 */
function installRegionsBaseGameCharacterPrototype(sandbox)
{
  const Bp = sandbox.Game_CharacterBase.prototype;

  if (typeof Bp.initMembers !== 'function')
  {
    Bp.initMembers = noop;
  }

  if (typeof Bp.update !== 'function')
  {
    Bp.update = noop;
  }

  if (typeof Bp.regionId !== 'function')
  {
    Bp.regionId = function()
    {
      return 0;
    };
  }

  const Cp = sandbox.Game_Character.prototype;

  if (typeof Cp.initMembers !== 'function')
  {
    Cp.initMembers = function()
    {
      Bp.initMembers.call(this);
    };
  }

  if (typeof Cp.update !== 'function')
  {
    Cp.update = function()
    {
      Bp.update.call(this);
    };
  }

  if (typeof Cp.isVehicle !== 'function')
  {
    Cp.isVehicle = function()
    {
      return false;
    };
  }

  if (typeof Cp.isVisible !== 'function')
  {
    Cp.isVisible = function()
    {
      return true;
    };
  }

  if (typeof Cp.hasJabsBattler !== 'function')
  {
    Cp.hasJabsBattler = function()
    {
      return false;
    };
  }

  if (typeof Cp.getJabsBattler !== 'function')
  {
    Cp.getJabsBattler = function()
    {
      return null;
    };
  }

  if (typeof Cp.requestAnimation !== 'function')
  {
    Cp.requestAnimation = noop;
  }
}

/**
 * Minimal {@link JABS_Engine} constructor so `regions/ext/skills/managers/JABS_Engine.js` can patch
 * the prototype (`setMapDamageBattler`/`getMapDamageBattler` aren't exercised directly by these
 * tests, which drive `$jabsEngine` as a plain object instead- this stub only needs to exist so the
 * import succeeds).
 * @param {object} sandbox
 */
function installJabsEngineStub(sandbox)
{
  if (typeof sandbox.JABS_Engine === 'function')
  {
    return;
  }

  function JABS_Engine()
  {
  }

  JABS_Engine.prototype = {};

  sandbox.JABS_Engine = JABS_Engine;
}

/**
 * Minimal {@link JABS_Timer} so region extensions can construct timers without loading J-ABS.
 * @param {object} sandbox
 */
function installJabsTimerStub(sandbox)
{
  if (typeof sandbox.JABS_Timer === 'function')
  {
    return;
  }

  function JABS_Timer(timerMax = 0)
  {
    this._timerMax = timerMax;
    this._timer = 0;
    this._timerComplete = false;
  }

  JABS_Timer.prototype.update = function()
  {
    if (this._timerComplete === true)
    {
      return;
    }

    this._timer += 1;

    if (this._timer >= this._timerMax)
    {
      this._timerComplete = true;
    }
  };

  JABS_Timer.prototype.isTimerComplete = function()
  {
    return this._timerComplete === true;
  };

  JABS_Timer.prototype.reset = function()
  {
    this._timer = 0;
    this._timerComplete = false;
  };

  sandbox.JABS_Timer = JABS_Timer;
}

/**
 * Globals required for the J-RegionEffects core plugin's prototype-patch source files to evaluate
 * when direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} [regionEffectsParams]
 */
export function installRegionsCoreHostGlobals(sandbox = globalThis, regionEffectsParams = DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS)
{
  if (sandbox.__regionsCoreHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__regionsCoreHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // J-RegionEffects's/J-Region-Skills's/J-Region-States's _pluginMetadata.js subclass this real
  // J-Base class.
  sandbox.PluginMetadata ??= PluginMetadata;

  installRegionsFamilyPluginManager(sandbox, { effects: regionEffectsParams });
  installRegionsBaseGameMapPrototype(sandbox);

  sandbox.$dataMap = sandbox.$dataMap || { note: '' };
}

/**
 * Globals required for the J-Regions-States extension's prototype-patch source files to evaluate
 * when direct-imported, on top of {@link installRegionsCoreHostGlobals}.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installRegionsStatesStackHostGlobals(sandbox = globalThis)
{
  installRegionsCoreHostGlobals(sandbox);
  installJabsTimerStub(sandbox);
  installRegionsBaseGameCharacterPrototype(sandbox);
}

/**
 * Globals required for the J-Regions-Skills extension's prototype-patch source files to evaluate
 * when direct-imported, on top of {@link installRegionsCoreHostGlobals}.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installRegionsSkillsStackHostGlobals(sandbox = globalThis)
{
  installRegionsCoreHostGlobals(sandbox);
  installJabsEngineStub(sandbox);
  installJabsTimerStub(sandbox);
  installRegionsBaseGameCharacterPrototype(sandbox);

  sandbox.$jabsEngine = {
    mapDamageBattler: null,

    getMapDamageBattler()
    {
      return this.mapDamageBattler;
    },

    setMapDamageBattler(dummyEnemyId, isFriendly)
    {
      this.mapDamageBattler = {
        dummyEnemyId,
        isFriendly,
        getBattlerId()
        {
          return dummyEnemyId;
        },
        isFriendlyTeam()
        {
          return true;
        },
      };
    },

    forceMapAction()
    {
      this.__forceMapActionCalls = this.__forceMapActionCalls || [];
      this.__forceMapActionCalls.push(Array.from(arguments));
    },
  };
}
//endregion plugins/regions/_component/fixtures/install-regions-host-globals.js
