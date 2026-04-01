//region engine-stubs
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

import {
  DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
  DEFAULT_REGION_SKILLS_PLUGIN_PARAMS,
  DEFAULT_REGION_STATES_PLUGIN_PARAMS,
} from './regions-plugin-params.js';

const noop = function()
{
};

/**
 * Ensures {@link Game_Map} has engine methods the region plugins alias.
 *
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
 * Base {@link Game_Character} / {@link Game_CharacterBase} for region extension stacks.
 *
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
 * Minimal {@link JABS_Engine} constructor so {@link J-Regions-Skills.js} can patch the prototype.
 *
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
 *
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
 * @param {object} sandbox
 * @param {Record<string, string>} regionEffectsParams
 */
export function installRegionsCoreEngineStubs(sandbox, regionEffectsParams)
{
  installPluginManagerWithParams(sandbox, 'J-RegionEffects', regionEffectsParams);
  installRegionsBaseGameMapPrototype(sandbox);
  sandbox.$dataMap = sandbox.$dataMap || { note: '' };
}

/**
 * @param {object} sandbox
 */
export function installRegionsStatesStackEngineStubs(sandbox)
{
  installRegionsFamilyPluginManager(sandbox, {
    effects: DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
    states: DEFAULT_REGION_STATES_PLUGIN_PARAMS,
  });
  installJabsTimerStub(sandbox);
  installRegionsBaseGameMapPrototype(sandbox);
  installRegionsBaseGameCharacterPrototype(sandbox);
  sandbox.$dataMap = sandbox.$dataMap || { note: '' };
}

/**
 * @param {object} sandbox
 */
export function installRegionsSkillsStackEngineStubs(sandbox)
{
  installRegionsFamilyPluginManager(sandbox, {
    effects: DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
    skills: DEFAULT_REGION_SKILLS_PLUGIN_PARAMS,
  });
  installJabsEngineStub(sandbox);
  installJabsTimerStub(sandbox);
  installRegionsBaseGameMapPrototype(sandbox);
  installRegionsBaseGameCharacterPrototype(sandbox);
  sandbox.$dataMap = sandbox.$dataMap || { note: '' };

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
//endregion engine-stubs
