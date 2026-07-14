//region install-extend-host-globals
import { installJBaseHostGlobals } from '../../_base/fixtures/install-j-base-host-globals.js';
import { installJabsOnChanceEffectGlobalStub } from '../../_base/fixtures/install-jabs-onchance-stub.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

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
  sandbox.__PLUGIN_VERSION__ = '3.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Extend's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJExtend(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Extend';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-Extend's Game_Action/JABS_SkillSlotManager.js and database/RPG_Skill.js to
 * evaluate when direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installExtendHostGlobals(sandbox = globalThis)
{
  if (sandbox.__extendHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__extendHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // extend's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  // RPGManager.getOnChanceEffectsFromDatabaseObject(s) instantiates JABS_OnChanceEffect, which
  // lives in JABS, not J-Base.
  installJabsOnChanceEffectGlobalStub(sandbox);

  sandbox.$dataSkills = [];

  function Game_Item()
  {
  }

  Game_Item.prototype.initialize = function(item)
  {
    this._dataClass = '';
    this._item = item || null;
  };
  Game_Item.prototype.object = function()
  {
    return this._item;
  };
  Game_Item.prototype.setObject = function(obj)
  {
    this._item = obj;
  };
  sandbox.Game_Item = Game_Item;

  function Game_Action()
  {
    this._item = new Game_Item();
  }

  Game_Action.prototype.initialize = noop;
  Game_Action.prototype.clear = noop;
  Game_Action.prototype.setSkill = function(skillId)
  {
    this._item.initialize(sandbox.$dataSkills[skillId]);
  };
  Game_Action.prototype.setItemObject = function(itemObject)
  {
    this._item.setObject(itemObject);
  };
  Game_Action.prototype.apply = noop;
  Game_Action.prototype.applyItemUserEffect = noop;
  Game_Action.prototype.subject = () => null;
  Game_Action.prototype.item = function()
  {
    return this._item.object();
  };
  sandbox.Game_Action = Game_Action;

  function JABS_SkillSlotManager()
  {
  }

  JABS_SkillSlotManager.prototype.filterActionSkills = () => true;
  sandbox.JABS_SkillSlotManager = JABS_SkillSlotManager;

  sandbox.Game_Actor.prototype.learnSkill = noop;
  sandbox.Game_Actor.prototype.forgetSkill = noop;
  sandbox.Game_Actor.prototype.skill = function(skillId)
  {
    return sandbox.$dataSkills[skillId];
  };
  sandbox.Game_Actor.prototype.allStates = () => [];
  sandbox.Game_Actor.prototype.addState = function(stateId)
  {
    this.__addedStates = this.__addedStates || [];
    this.__addedStates.push(stateId);
  };
  sandbox.Game_Actor.prototype.getPositiveRollsForSkill = () => 0;
  sandbox.Game_Actor.prototype.getNegativeRolls = () => 0;
  sandbox.Game_Actor.prototype.getNegativeRollsForSkill = () => 0;

  sandbox.Game_Enemy.prototype.learnSkill = noop;
  sandbox.Game_Enemy.prototype.skill = function(skillId)
  {
    return sandbox.$dataSkills[skillId];
  };
  sandbox.Game_Enemy.prototype.allStates = () => [];
  sandbox.Game_Enemy.prototype.addState = function(stateId)
  {
    this.__addedStates = this.__addedStates || [];
    this.__addedStates.push(stateId);
  };
  sandbox.Game_Enemy.prototype.getPositiveRollsForSkill = () => 0;
  sandbox.Game_Enemy.prototype.getNegativeRolls = () => 0;
  sandbox.Game_Enemy.prototype.getNegativeRollsForSkill = () => 0;

  sandbox.Game_Action.prototype.applyStates = function(target, effects)
  {
    if (effects.length)
    {
      effects.forEach(effect =>
      {
        if (effect.shouldTrigger())
        {
          target.addState(effect.skillId, this.subject());
        }
      });
    }
  };
}
//endregion install-extend-host-globals
