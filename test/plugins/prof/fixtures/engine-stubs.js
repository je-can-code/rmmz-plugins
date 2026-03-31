//region engine-stubs
const noop = function()
{
};

/**
 * Stubs for {@link out/J-Proficiency.js}: storage config, actor/enemy init chain, action/item, managers.
 *
 * @param {object} sandbox
 * @param {() => string} readProfConfig returns JSON text for {@link StorageManager.fsReadFile}
 */
export function installProfEngineStubs(sandbox, readProfConfig)
{
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  sandbox.StorageManager.fsReadFile = function(path)
  {
    if (path === 'data/config.proficiency.json')
    {
      return readProfConfig();
    }

    return null;
  };

  sandbox.TextManager.longParam = function()
  {
    return '';
  };

  sandbox.IconManager = {
    longParam()
    {
      return 0;
    },
  };

  function Game_System()
  {
  }

  Game_System.prototype.onAfterLoad = noop;
  sandbox.Game_System = Game_System;

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;

  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
    this._skills = [];
  };

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

  sandbox.Game_Actor.prototype.actorId = function()
  {
    return 1;
  };

  sandbox.Game_Actor.prototype.actor = function()
  {
    if (this.__actorDb !== undefined && this.__actorDb !== null)
    {
      return this.__actorDb;
    }

    return {
      id: 1,
      name: '',
      note: '',
      classId: 1,
      traits: [],
    };
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
    if (this.__enemyDb !== undefined && this.__enemyDb !== null)
    {
      return this.__enemyDb;
    }

    return { id: 1, name: '', note: '', traits: [], actions: [] };
  };

  sandbox.Game_Enemy.prototype.databaseData = function()
  {
    return this.enemy();
  };

  sandbox.Game_Enemy.prototype.skills = function()
  {
    return [];
  };

  sandbox.Game_Battler.prototype.result = function()
  {
    return this._actionResult;
  };

  sandbox.Game_Battler.prototype.traitObjects = function()
  {
    return [];
  };

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

  Game_Action.prototype.isSkill = function()
  {
    return true;
  };

  sandbox.Game_Action = Game_Action;
}
//endregion engine-stubs
