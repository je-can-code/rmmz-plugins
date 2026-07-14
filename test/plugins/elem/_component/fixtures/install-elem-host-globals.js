//region plugins/elem/_component/fixtures/install-elem-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/models/PluginMetadata.js';
import RPG_Skill from '../../../../../src/plugins/_base/database/implementations/RPG_Skill.js';
import RPG_Enemy from '../../../../../src/plugins/_base/database/implementations/RPG_Enemy.js';
import RPG_Actor from '../../../../../src/plugins/_base/database/implementations/RPG_Actor.js';

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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Elementalistics's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJElem(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Elementalistics';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Builds a real {@link RPG_Skill}-shaped object for note-parsing tests without going through
 * $dataSkills/DataManager loading.
 * @param {object} props Overrides merged onto the RPG_Skill prototype (id/name/note/damage/etc.).
 * @returns {RPG_Skill}
 */
export function skillData(props)
{
  return Object.assign(Object.create(RPG_Skill.prototype), props);
}

/**
 * Builds a real {@link RPG_Enemy}-shaped object for note-parsing tests.
 * @param {object} props Overrides merged onto the RPG_Enemy prototype.
 * @returns {RPG_Enemy}
 */
export function enemyData(props)
{
  return Object.assign(Object.create(RPG_Enemy.prototype), props);
}

/**
 * Builds a real {@link RPG_Actor}-shaped object for note-parsing tests.
 * @param {object} props Overrides merged onto the RPG_Actor prototype.
 * @returns {RPG_Actor}
 */
export function actorData(props)
{
  return Object.assign(Object.create(RPG_Actor.prototype), props);
}

/**
 * Globals required for J-Elementalistics's Game_Battler/Game_Actor/Game_Enemy/Game_Action.js to
 * evaluate when direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installElemHostGlobals(sandbox = globalThis)
{
  if (sandbox.__elemHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__elemHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // elem's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  sandbox.$dataSystem = {
    elements: [ null, { id: 1, name: 'F' }, { id: 2, name: 'I' } ],
  };

  // elem/core/objects/Game_Enemy.js's elementRate alias captures whatever is here as "original"
  // before overwriting it- matches vanilla RMMZ's flat 1.0 base rate.
  sandbox.Game_Enemy.prototype.elementRate = function()
  {
    return 1;
  };

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;

  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };

  sandbox.Game_Actor.prototype.actorId = function()
  {
    return 1;
  };

  sandbox.Game_Actor.prototype.actor = function()
  {
    return this.__actorDb ?? {
      id: 1, name: '', note: '', classId: 1, traits: [],
    };
  };

  // base Game_Battler.js's default databaseData() returns null; real _base Game_Actor.js normally
  // overrides this to delegate to actor() - replicate that override directly since we don't import
  // the full real Game_Actor.js here.
  sandbox.Game_Actor.prototype.databaseData = function()
  {
    return this.actor();
  };

  sandbox.Game_Actor.prototype.class = function()
  {
    return { id: 1, note: '' };
  };

  sandbox.Game_Actor.prototype.currentClass = function()
  {
    return { id: 1, note: '' };
  };

  sandbox.Game_Actor.prototype.equips = function()
  {
    return [];
  };

  Object.setPrototypeOf(sandbox.Game_Enemy.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Enemy.prototype.constructor = sandbox.Game_Enemy;

  sandbox.Game_Enemy.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };

  sandbox.Game_Enemy.prototype.enemyId = function()
  {
    return 1;
  };

  sandbox.Game_Enemy.prototype.enemy = function()
  {
    return this.__enemyDb ?? {
      id: 1, name: '', note: '', traits: [], actions: [],
    };
  };

  sandbox.Game_Enemy.prototype.databaseData = function()
  {
    return this.enemy();
  };

  sandbox.Game_Enemy.prototype.skills = function()
  {
    return [];
  };

  sandbox.Game_Battler.prototype.attackElements = function()
  {
    return [];
  };

  sandbox.Game_Battler.prototype.traitObjects = function()
  {
    return [];
  };

  // minimal Game_Item/Game_Action stand-ins- real vanilla Game_Action wraps a Game_Item internally
  // to track the acting skill/item; elem's own Game_Action.js extends this prototype further.
  function Game_Item()
  {
  }

  Game_Item.prototype.initialize = function(item)
  {
    this._item = item || null;
  };

  Game_Item.prototype.object = function()
  {
    return this._item;
  };

  sandbox.Game_Item = Game_Item;

  function Game_Action()
  {
    this._item = new Game_Item();
  }

  Game_Action.prototype.initialize = function()
  {
  };

  Game_Action.prototype.clear = function()
  {
  };

  Game_Action.prototype.setSkill = function(skillId)
  {
    this._item.initialize(sandbox.$dataSkills[skillId]);
  };

  Game_Action.prototype.subject = function()
  {
    return this._subject;
  };

  Game_Action.prototype.item = function()
  {
    return this._item.object();
  };

  sandbox.Game_Action = Game_Action;
}
//endregion plugins/elem/_component/fixtures/install-elem-host-globals.js
