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

  sandbox.Game_Battler = Game_Battler;

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

  Game_Actor.prototype.skills = function()
  {
    return [];
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
