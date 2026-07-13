//region install-crit-host-globals
import { installJBaseHostGlobals } from '../../_base/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-CriticalFactors's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJCrit(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-CriticalFactors';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Minimal stand-in for J-NaturalGrowth's Game_Battler.js additions that crit's own files alias/call
 * (`initNaturalGrowthParameters`, `calculatePlusRate`, `naturalParamBuff`). Ports the exact real
 * formulas rather than stubbing 0s, since several crit test assertions depend on the real math.
 * @param {object} sandbox
 */
export function installNaturalCompanionStubs(sandbox = globalThis)
{
  sandbox.J.NATURAL = sandbox.J.NATURAL || {};

  sandbox.Game_Battler.prototype.initNaturalGrowthParameters = function()
  {
  };

  // natural/core/objects/Game_Battler.js extends initMembers() to call initNaturalGrowthParameters()-
  // replicate that hook so crit's own aliased addition actually runs when an actor initializes.
  const previousInitMembers = sandbox.Game_Battler.prototype.initMembers;
  sandbox.Game_Battler.prototype.initMembers = function()
  {
    previousInitMembers.call(this);
    this.initNaturalGrowthParameters();
  };

  sandbox.Game_Battler.prototype.calculatePlusRate = function(baseValue, paramPlus, paramRate)
  {
    const paramFactor = ((paramRate + 100) / 100);
    const paramBase = (baseValue + paramPlus);

    return (paramBase * paramFactor) - baseValue;
  };

  sandbox.Game_Battler.prototype.naturalParamBuff = function(structure, baseParam)
  {
    const objectsToCheck = this.getAllNotes();

    return sandbox.RPGManager.getResultsFromAllNotesByRegex(objectsToCheck, structure, baseParam, this, false);
  };
}

/**
 * Globals required for J-CriticalFactors's Game_BattlerBase/Game_Battler/Game_Actor/Game_Action
 * source files to evaluate when direct-imported into the real Vitest realm instead of a nested vm
 * context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installCritHostGlobals(sandbox = globalThis)
{
  if (sandbox.__critHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__critHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // J-CriticalFactors's _pluginMetadata.js subclasses this real J-Base class.
  sandbox.PluginMetadata ??= PluginMetadata;

  // real _base Game_Actor.js's databaseData()/getNotesSources() call these vanilla engine methods;
  // the placeholder Game_Actor from installJBaseHostGlobals doesn't define any of them.
  sandbox.Game_Actor.prototype.actor = function()
  {
    return this.__actorDb ?? { id: 1, name: '', note: '', classId: 1, traits: [] };
  };

  sandbox.Game_Actor.prototype.currentClass = function()
  {
    return { note: '' };
  };

  // real _base Game_Actor.js's equippedEquips() (not the placeholder) calls this vanilla method.
  sandbox.Game_Actor.prototype.equips = function()
  {
    return [];
  };

  // RPGManager's formula-eval cache key suffix reads getLevel() off every battler (real J-LevelMaster
  // method); this family isn't testing level integration, so a fixed value is fine.
  sandbox.Game_Battler.prototype.getLevel = function()
  {
    return 1;
  };
}
//endregion install-crit-host-globals
