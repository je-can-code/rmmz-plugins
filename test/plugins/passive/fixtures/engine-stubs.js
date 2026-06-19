//region engine-stubs
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';

const noop = function()
{
};

/**
 * Engine facades so {@link out/J-Passive.js} can load; complements J-Base host placeholders.
 *
 * @param {object} sandbox
 */
export function installPassiveEngineStubs(sandbox)
{
  installMinimalMenuUiStubs(sandbox);

  function Window_MoreEquipData()
  {
  }

  Window_MoreEquipData.prototype.addJabsEquipmentData = noop;
  sandbox.Window_MoreEquipData = Window_MoreEquipData;

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

  sandbox.$gameVariables = {
    _data: [],
    value(variableId)
    {
      const raw = this._data[variableId];
      if (raw === undefined || raw === null)
      {
        return 0;
      }
      return raw;
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

  function Game_Battler()
  {
  }

  Game_Battler.prototype.initMembers = function()
  {
    sandbox.Game_BattlerBase.prototype.initMembers.call(this);
    this._states = [];
  };

  Game_Battler.prototype.states = function()
  {
    return this._states.map(id => sandbox.$dataStates[id]).filter(Boolean);
  };

  Game_Battler.prototype.state = function(stateId)
  {
    return sandbox.$dataStates.at(stateId);
  };

  // maintain the BattlerBase chain so J-Base prototype extensions remain accessible.
  Object.setPrototypeOf(Game_Battler.prototype, sandbox.Game_BattlerBase.prototype);

  sandbox.Game_Battler = Game_Battler;

  function Game_Action()
  {
  }

  Game_Action.prototype.initialize = noop;
  Game_Action.prototype.apply = noop;
  sandbox.Game_Action = Game_Action;

  function Game_Actor()
  {
  }

  Object.setPrototypeOf(Game_Actor.prototype, Game_Battler.prototype);
  Game_Actor.prototype.constructor = Game_Actor;

  Game_Actor.prototype.actorId = function()
  {
    return 1;
  };

  Game_Actor.prototype.actor = function()
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

  Game_Actor.prototype.class = function()
  {
    return { note: '' };
  };

  Game_Actor.prototype.currentClass = function()
  {
    return { id: 1, note: '' };
  };

  Game_Actor.prototype.equips = function()
  {
    return [];
  };

  Game_Actor.prototype.traitObjects = function()
  {
    return [];
  };

  Game_Actor.prototype.isLearnedSkill = function(skillId)
  {
    if (!this._skills)
    {
      return false;
    }

    return this._skills.includes(skillId);
  };

  Game_Actor.prototype.skills = function()
  {
    if (!this._skills)
    {
      return [];
    }

    return this._skills
      .map(id => sandbox.$dataSkills[id])
      .filter(Boolean);
  };

  Game_Actor.prototype.onLearnNewSkill = noop;

  Game_Actor.prototype.onForgetSkill = noop;

  Game_Actor.prototype.learnSkill = function(skillId)
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

  Game_Actor.prototype.forgetSkill = function(skillId)
  {
    if (!this._skills)
    {
      return;
    }

    if (this.isLearnedSkill(skillId))
    {
      this.onForgetSkill(skillId);
      this._skills = this._skills.filter(id => id !== skillId);
    }
  };

  Game_Actor.prototype.onBattlerDataChange = noop;

  sandbox.Game_Actor = Game_Actor;

  function Game_Enemy()
  {
  }

  Object.setPrototypeOf(Game_Enemy.prototype, Game_Battler.prototype);
  Game_Enemy.prototype.constructor = Game_Enemy;

  Game_Enemy.prototype.initMembers = function()
  {
    Game_Battler.prototype.initMembers.call(this);
  };

  Game_Enemy.prototype.enemyId = function()
  {
    return 1;
  };

  Game_Enemy.prototype.enemy = function()
  {
    if (this.__enemyDb !== undefined && this.__enemyDb !== null)
    {
      return this.__enemyDb;
    }

    return { id: 1, name: '', note: '', traits: [], actions: [] };
  };

  Game_Enemy.prototype.databaseData = function()
  {
    return this.enemy();
  };

  Game_Enemy.prototype.skills = function()
  {
    return [];
  };

  Game_Enemy.prototype.traitObjects = function()
  {
    return [];
  };

  sandbox.Game_Enemy = Game_Enemy;

  function Game_Party()
  {
  }

  Game_Party.prototype.initialize = noop;
  sandbox.Game_Party = Game_Party;
}
//endregion engine-stubs
