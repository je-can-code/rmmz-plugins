//region engine-stubs
/**
 * Minimal engine facades so {@link out/J-DropsControl.js} can load and patch prototypes.
 * {@link out/J-Base.js} supplies {@link RPG_Enemy} and {@link RPG_DropItem}.
 *
 * @param {object} sandbox Target object that will become the VM global object.
 */
export function installDropsEngineStubs(sandbox)
{
  const prev = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-Base')
      {
        return prev.parameters('J-Base');
      }

      return {};
    },
  };

  if (!sandbox.Math)
  {
    sandbox.Math = {
      abs: Math.abs,
      floor: Math.floor,
      max: Math.max,
      min: Math.min,
      random: Math.random,
      round: Math.round,
      randomInt(max)
      {
        return Math.floor(Math.random() * max);
      },
    };
  }
  else if (typeof sandbox.Math.randomInt !== 'function')
  {
    sandbox.Math.randomInt = function(max)
    {
      return Math.floor(Math.random() * max);
    };
  }

  sandbox.$dataItems = [];
  sandbox.$dataWeapons = [];
  sandbox.$dataArmors = [];

  function Game_Battler()
  {
  }

  Game_Battler.prototype.initMembers = function()
  {
    this._states = [];
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
    return { note: '' };
  };

  Game_Actor.prototype.equips = function()
  {
    return [];
  };

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

  Game_Enemy.prototype.enemy = function()
  {
    return this._enemyDb;
  };

  Game_Enemy.prototype.dropItemRate = function()
  {
    return sandbox.$gameParty.hasDropItemDouble()
      ? 2
      : 1;
  };

  Game_Enemy.prototype.itemObject = function(kind, dataId)
  {
    if (kind === 1)
    {
      return sandbox.$dataItems[dataId];
    }

    if (kind === 2)
    {
      return sandbox.$dataWeapons[dataId];
    }

    if (kind === 3)
    {
      return sandbox.$dataArmors[dataId];
    }

    return null;
  };

  Game_Enemy.prototype.gold = function()
  {
    return this.enemy().gold;
  };

  Game_Enemy.prototype.makeDropItems = function()
  {
    const rate = this.dropItemRate();

    return this.enemy().dropItems.reduce((r, di) =>
    {
      if (di.kind > 0 && Math.random() * di.denominator < rate)
      {
        return r.concat(this.itemObject(di.kind, di.dataId));
      }

      return r;
    }, []);
  };

  sandbox.Game_Enemy = Game_Enemy;

  function Game_Party()
  {
    this.__battleMembers = [];
  }

  Game_Party.prototype.members = function()
  {
    return this.__battleMembers || [];
  };

  Game_Party.prototype.battleMembers = function()
  {
    return this.__battleMembers || [];
  };

  Game_Party.prototype.leader = function()
  {
    const m = this.members();

    if (m.length === 0)
    {
      return null;
    }

    return m[0];
  };

  Game_Party.prototype.hasDropItemDouble = function()
  {
    return false;
  };

  sandbox.Game_Party = Game_Party;
  sandbox.$gameParty = new Game_Party();
}
//endregion engine-stubs
