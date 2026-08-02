//region plugins/passive/_component/fixtures/install-passive-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import { installMinimalMenuUiStubs } from '../../../../setup/install-minimal-menu-ui-stubs.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

const noop = function()
{
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by both
 * _base/_metadata/initialization.js and passive/core/_metadata/initialization.js.
 * Call this right before importing J-Base's initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Passive's own identity. Call
 * this right before importing passive/core/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJPassive(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Passive';
  sandbox.__PLUGIN_VERSION__ = '2.1.0';
}

/**
 * Globals required for J-Passive's prototype-patch source files (core/objects/*.js,
 * core/managers/*.js) to evaluate when direct-imported into the real Vitest realm instead of a
 * nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installPassiveHostGlobals(sandbox = globalThis)
{
  if (sandbox.__passiveHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__passiveHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  sandbox.PluginMetadata ??= PluginMetadata;

  installMinimalMenuUiStubs(sandbox);

  if (typeof sandbox.Array.prototype.has !== 'function')
  {
    sandbox.Array.prototype.has = function(entry)
    {
      return this.includes(entry);
    };
  }

  function Window_MoreEquipData()
  {
  }

  Window_MoreEquipData.prototype.addJabsEquipmentData = noop;
  sandbox.Window_MoreEquipData = Window_MoreEquipData;

  sandbox.$gameVariables = {
    _data: [],
    value(variableId)
    {
      const raw = this._data[variableId];
      return raw === undefined || raw === null ? 0 : raw;
    },
    setValue(variableId, value)
    {
      this._data[variableId] = value;
    },
  };

  sandbox.$gameParty = {
    passiveStates()
    {
      return [];
    },
  };

  // this lightweight fixture doesn't load the real J-ABS Game_Battler roll-threading
  // augmentations, so stub sentinel (no bonus) implementations directly.
  sandbox.Game_Battler.prototype.getPositiveRolls = function() { return 0; };
  sandbox.Game_Battler.prototype.getNegativeRolls = function() { return 0; };
  sandbox.Game_Battler.prototype.getPositiveRollsForSkill = function() { return 0; };
  sandbox.Game_Battler.prototype.getNegativeRollsForSkill = function() { return 0; };
  sandbox.Game_Battler.prototype.isVeryLucky = function() { return false; };
  sandbox.Game_Battler.prototype.isVeryCursed = function() { return false; };

  // real RMMZ base-game behavior for these is data-driven from engine state this lightweight
  // fixture doesn't model; passive/core/objects/Game_Battler.js aliases whatever is here at
  // import time, so tests control the "original" result per-instance via the `__base*` fields
  // below instead of shadowing the (post-patch) prototype methods themselves.
  sandbox.Game_Battler.prototype.databaseData = function() { return this.__baseDatabaseData ?? {}; };
  sandbox.Game_Battler.prototype.allStates = function() { return this.__baseStates ?? []; };
  sandbox.Game_Battler.prototype.skills = function() { return this.__baseSkills ?? []; };
  sandbox.Game_Battler.prototype.state = function(stateId) { return (this.__statesById ?? {})[stateId] ?? null; };
  sandbox.Game_Battler.prototype.allStateIds = function() { return this.__baseStateIds ?? []; };
  sandbox.Game_Battler.prototype.isStateAddable = function(stateId)
  {
    return this.__baseUnaddableStateIds ? !this.__baseUnaddableStateIds.includes(stateId) : true;
  };
  sandbox.Game_Battler.prototype.onStateAdded = function(stateId)
  {
    this.__onStateAddedCalls ??= [];
    this.__onStateAddedCalls.push(stateId);
  };
  sandbox.Game_Battler.prototype.removeState = function(stateId)
  {
    this.__removeStateCalls ??= [];
    this.__removeStateCalls.push(stateId);
  };
  sandbox.Game_Battler.prototype.onStateRemoval = function(stateId)
  {
    this.__onStateRemovalCalls ??= [];
    this.__onStateRemovalCalls.push(stateId);
  };

  sandbox.Game_Actor.prototype.actorId = function()
  {
    return 1;
  };

  // aliased at import time by passive/core/objects/Game_Actor.js; keep as a real no-op so the
  // aliasing captures a callable "original" rather than undefined.
  sandbox.Game_Actor.prototype.onSetup = noop;

  sandbox.Game_Actor.prototype.actor = function()
  {
    return this.__actorDb ?? { id: 1, name: '', note: '', classId: 1, traits: [] };
  };

  sandbox.Game_Actor.prototype.class = function()
  {
    return { note: '' };
  };

  sandbox.Game_Actor.prototype.currentClass = function()
  {
    return { id: 1, note: '' };
  };

  sandbox.Game_Actor.prototype.equips = function()
  {
    return [];
  };

  sandbox.Game_Actor.prototype.traitObjects = function()
  {
    return [];
  };

  sandbox.Game_Actor.prototype.isLearnedSkill = function(skillId)
  {
    if (!this._skills) return false;
    return this._skills.includes(skillId);
  };

  sandbox.Game_Actor.prototype.skills = function()
  {
    if (!this._skills) return [];
    return this._skills.map(id => sandbox.$dataSkills[id]).filter(Boolean);
  };

  sandbox.Game_Actor.prototype.onLearnNewSkill = noop;
  sandbox.Game_Actor.prototype.onForgetSkill = noop;

  sandbox.Game_Actor.prototype.learnSkill = function(skillId)
  {
    if (!this._skills)
    {
      this._skills = [];
    }

    if (this.isLearnedSkill(skillId) === false)
    {
      this.onLearnNewSkill(skillId);
      this._skills.push(skillId);
    }
  };

  sandbox.Game_Actor.prototype.forgetSkill = function(skillId)
  {
    if (!this._skills) return;

    if (this.isLearnedSkill(skillId))
    {
      this.onForgetSkill(skillId);
      this._skills = this._skills.filter(id => id !== skillId);
    }
  };

  sandbox.Game_Actor.prototype.onBattlerDataChange = noop;

  sandbox.Game_Enemy.prototype.enemyId = function()
  {
    return 1;
  };

  sandbox.Game_Enemy.prototype.enemy = function()
  {
    return this.__enemyDb ?? { id: 1, name: '', note: '', traits: [], actions: [] };
  };

  sandbox.Game_Enemy.prototype.databaseData = function()
  {
    return this.enemy();
  };

  sandbox.Game_Enemy.prototype.skills = function()
  {
    return [];
  };

  sandbox.Game_Enemy.prototype.traitObjects = function()
  {
    return [];
  };

  sandbox.Game_Party.prototype.initialize = noop;

  // J-Base defines this hook and calls it from an aliased `initialize`; plugins adding party state
  // alias the hook rather than `initialize`, so it has to exist here for their chain to capture.
  sandbox.Game_Party.prototype.initMembers = noop;
}

/**
 * Builds the same `__passiveTestFixtures` factory helpers the VM harness used to install as a bare
 * global, backed by the real RPG_* prototypes so note/meta parsing works for real.
 * @param {{
 *   RPG_Actor: Function, RPG_Class: Function, RPG_Skill: Function,
 *   RPG_State: Function, RPG_Weapon: Function, RPG_Enemy: Function,
 * }} rpgClasses The real RPG_* classes, imported directly by the caller.
 * @returns {object}
 */
export function buildPassiveTestFixtures(rpgClasses)
{
  const { RPG_Actor, RPG_Class, RPG_Skill, RPG_State, RPG_Weapon, RPG_Enemy } = rpgClasses;

  return {
    actorData(props)
    {
      return Object.assign(Object.create(RPG_Actor.prototype), props);
    },
    classData(props)
    {
      return Object.assign(Object.create(RPG_Class.prototype), props);
    },
    skillData(props)
    {
      return Object.assign(Object.create(RPG_Skill.prototype), props);
    },
    stateData(props)
    {
      return Object.assign(Object.create(RPG_State.prototype), props);
    },
    weaponData(props)
    {
      return Object.assign(Object.create(RPG_Weapon.prototype), props);
    },
    enemyData(props)
    {
      return Object.assign(Object.create(RPG_Enemy.prototype), props);
    },
  };
}
//endregion plugins/passive/_component/fixtures/install-passive-host-globals.js
