//region engine-stubs
/**
 * Minimal engine facades so {@link out/J-NaturalGrowth.js} can load and patch prototypes.
 *
 * @param {object} sandbox Target object that will become the VM global object.
 * @param {Record<string, string>} pluginParameterStrings String values as RMMZ would provide.
 */
export function installNaturalEngineStubs(sandbox, pluginParameterStrings)
{
  const prev = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-Base')
      {
        return prev.parameters('J-Base');
      }

      return pluginParameterStrings;
    },
  };

  sandbox.$gameVariables = {
    _data: [],
  };

  function Game_BattlerBase()
  {
  }

  Game_BattlerBase.knownBaseParameterIds = function()
  {
    return [ 0, 1, 2, 3, 4, 5, 6, 7 ];
  };

  Game_BattlerBase.knownExParameterIds = function()
  {
    return [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
  };

  Game_BattlerBase.knownSpParameterIds = function()
  {
    return [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
  };

  sandbox.Game_BattlerBase = Game_BattlerBase;

  function noop()
  {
  }

  function Game_Battler()
  {
  }

  Game_Battler.prototype.initMembers = function()
  {
    this._states = [];
  };
  Game_Battler.prototype.paramBase = function()
  {
    return 0;
  };
  Game_Battler.prototype.xparam = function()
  {
    return 0;
  };
  Game_Battler.prototype.sparam = function()
  {
    return 0;
  };

  Game_Battler.prototype.getBaseMaxTp = function()
  {
    return 0;
  };

  Game_Battler.prototype.getBaseMaxTpBonuses = function()
  {
    return 0;
  };

  sandbox.Game_Battler = Game_Battler;

  function Game_Actor()
  {
  }

  Object.setPrototypeOf(Game_Actor.prototype, Game_Battler.prototype);
  Game_Actor.prototype.constructor = Game_Actor;

  Game_Actor.prototype.setup = noop;
  Game_Actor.prototype.onBattlerDataChange = noop;

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
    return { note: '' };
  };

  Game_Actor.prototype.equips = function()
  {
    return [];
  };

  Game_Actor.prototype.paramBase = function()
  {
    return 10;
  };

  Game_Actor.prototype.xparam = function()
  {
    return 0.25;
  };

  Game_Actor.prototype.sparam = function()
  {
    return 1;
  };

  Game_Actor.prototype.levelUp = noop;

  Object.defineProperty(Game_Actor.prototype, 'level', {
    configurable: true,
    get()
    {
      if (this._level !== undefined && this._level !== null)
      {
        return this._level;
      }

      return 1;
    },
  });

  Object.defineProperty(Game_Actor.prototype, 'lvl', {
    configurable: true,
    get()
    {
      return this.level;
    },
  });

  Game_Actor.prototype.getBaseMaxTp = function()
  {
    if (typeof J === 'undefined')
    {
      return 100;
    }

    return J.NATURAL.Metadata.BaseTpMaxActors;
  };

  sandbox.Game_Actor = Game_Actor;

  function Game_Enemy()
  {
  }

  Object.setPrototypeOf(Game_Enemy.prototype, Game_Battler.prototype);
  Game_Enemy.prototype.constructor = Game_Enemy;

  Game_Enemy.prototype.setup = noop;
  Game_Enemy.prototype.onBattlerDataChange = noop;

  Game_Enemy.prototype.paramBase = function()
  {
    return 0;
  };

  Game_Enemy.prototype.xparam = function()
  {
    return 0;
  };

  Game_Enemy.prototype.sparam = function()
  {
    return 0;
  };

  Game_Enemy.prototype.enemy = function()
  {
    return this._enemyDb;
  };

  Game_Enemy.prototype.exp = function()
  {
    return this._enemyDb.exp;
  };

  Game_Enemy.prototype.gold = function()
  {
    return this._enemyDb.gold;
  };

  Game_Enemy.prototype.sdpPoints = function()
  {
    return this._enemyDb.sdpPoints;
  };

  Game_Enemy.prototype.getBaseMaxTp = function()
  {
    if (typeof J === 'undefined')
    {
      return 50;
    }

    return J.NATURAL.Metadata.BaseTpMaxEnemies;
  };

  sandbox.Game_Enemy = Game_Enemy;

  function Game_Party()
  {
  }

  Game_Party.prototype.gainItem = noop;
  Game_Party.prototype.members = function()
  {
    return [];
  };
  sandbox.Game_Party = Game_Party;

  function Scene_Equip()
  {
  }

  Scene_Equip.prototype.executeEquipChange = noop;
  sandbox.Scene_Equip = Scene_Equip;

  function Window_EquipItem()
  {
  }

  Window_EquipItem.prototype.postEquipSetupActorClone = noop;
  sandbox.Window_EquipItem = Window_EquipItem;
}
//endregion engine-stubs
