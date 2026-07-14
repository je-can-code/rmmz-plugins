//region install-prof-host-globals
import { installJBaseHostGlobals } from '../../_base/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';
import ExternalJsonConfigLoader from '../../../../src/plugins/_base/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../../src/plugins/_base/models/ExternalJsonConfigLoaderOptions.js';
import RPG_Skill from '../../../../src/plugins/_base/database/implementations/RPG_Skill.js';
import RPG_Enemy from '../../../../src/plugins/_base/database/implementations/RPG_Enemy.js';
import RPG_Actor from '../../../../src/plugins/_base/database/implementations/RPG_Actor.js';
import { buildVitestProficiencyConfigJson } from './prof-config-json.js';

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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Proficiency's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJProf(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Proficiency';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Builds a real {@link RPG_Skill}-shaped object for note-parsing tests.
 * @param {object} props Overrides merged onto the RPG_Skill prototype.
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
 * Mirrors {@link Scene_Boot#onDatabaseLoaded}'s proficiency-loading step, since tests never boot a
 * real scene. Populates $dataActors[1..5] (the vitest config's actorIds) then loads config JSON via
 * J.PROF.Metadata.initializeProficiencies().
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function initializeProficiencies(sandbox = globalThis)
{
  for (let i = 1; i <= 5; i++)
  {
    sandbox.$dataActors[i] = { id: i };
  }

  sandbox.J.PROF.Metadata.initializeProficiencies();
}

/**
 * Globals required for J-Proficiency's Game_Battler/Game_Actor/Game_Enemy/Game_Action.js to
 * evaluate when direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installProfHostGlobals(sandbox = globalThis)
{
  if (sandbox.__profHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__profHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // prof's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  // SkillProficiency.js calls SerializableRegistry.register(...) as an import-time side effect.
  sandbox.SerializableRegistry ??= { register() {} };

  // J_ProficiencyPluginMetadata.initializeProficiencies() reads data/config.proficiency.json via
  // these two real J-Base globals.
  sandbox.ExternalJsonConfigLoader ??= ExternalJsonConfigLoader;
  sandbox.ExternalJsonConfigLoaderOptions ??= ExternalJsonConfigLoaderOptions;

  sandbox.StorageManager.fsReadFile = function(path)
  {
    return path === 'data/config.proficiency.json'
      ? buildVitestProficiencyConfigJson()
      : null;
  };

  sandbox.TextManager.longParam = () => '';
  sandbox.IconManager = { longParam: () => 0 };

  sandbox.Game_System.prototype.onAfterLoad = noop;

  sandbox.Scene_Boot.prototype.onDatabaseLoaded = noop;

  // vanilla RMMZ Game_Actor initializes _skills; real _base Game_Actor.js doesn't (that's vanilla's
  // own job), so seed it here alongside the base Game_Battler chain. Looked up dynamically (not
  // captured) since real _base/objects/Game_Battler.js re-aliases this same prototype slot later.
  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
    this._skills = this._skills ?? [];
  };

  // vanilla RMMZ Game_Actor methods real _base Game_Actor.js's learnSkill alias needs as "original".
  sandbox.Game_Actor.prototype.isLearnedSkill = function(skillId)
  {
    return this._skills.includes(skillId);
  };
  sandbox.Game_Actor.prototype.learnSkill = function(skillId)
  {
    if (this.isLearnedSkill(skillId) === false)
    {
      this._skills.push(skillId);
    }
  };
  sandbox.Game_Actor.prototype.forgetSkill = noop;
  sandbox.Game_Actor.prototype.actorId = () => 1;
  sandbox.Game_Actor.prototype.actor = function()
  {
    return this.__actorDb ?? {
      id: 1, name: '', note: '', classId: 1, traits: [],
    };
  };
  sandbox.Game_Actor.prototype.class = () => ({ id: 1, note: '' });
  sandbox.Game_Actor.prototype.currentClass = () => ({ id: 1, note: '' });
  sandbox.Game_Actor.prototype.equips = () => [];

  sandbox.Game_Enemy.prototype.enemyId = () => 1;
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
  sandbox.Game_Enemy.prototype.skills = () => [];

  sandbox.Game_Battler.prototype.result = function()
  {
    return this._actionResult;
  };
  sandbox.Game_Battler.prototype.traitObjects = () => [];

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

  Game_Action.prototype.initialize = noop;
  Game_Action.prototype.clear = noop;
  Game_Action.prototype.setSkill = function(skillId)
  {
    this._item.initialize(sandbox.$dataSkills[skillId]);
  };
  Game_Action.prototype.apply = noop;
  Game_Action.prototype.subject = function()
  {
    return this._subject;
  };
  Game_Action.prototype.item = function()
  {
    return this._item.object();
  };
  Game_Action.prototype.isSkill = () => true;
  sandbox.Game_Action = Game_Action;
}
//endregion install-prof-host-globals
