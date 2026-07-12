//region engine-stubs
import vm from 'node:vm';

const noop = function()
{
};

/**
 * Mirrors {@code data/config.level.json}'s shape post-migration off PluginManager parameters. Real numbers/booleans
 * now, not stringified plugin-param values, since this is read via {@link StorageManager.fsReadFile} + JSON.parse
 * (see {@link ExternalJsonConfigLoader}) rather than {@link PluginManager.parameters}.
 */
export const DEFAULT_LEVEL_CONFIG = {
  useScaling: true,
  minMultiplier: 0.10,
  maxMultiplier: 2.00,
  rewardMinMultiplier: null,
  rewardMaxMultiplier: null,
  growthMultiplier: 0.10,
  invariantUpperRange: 1,
  invariantLowerRange: 1,
  variableActorBalancer: 141,
  variableEnemyBalancer: 142,
  defaultBeyondMaxLevel: 255,
  trueMaxLevel: 1000,
  useSharedActorLevel: true,
  canonicalExpBasis: 30,
  canonicalExpExtra: 20,
  canonicalExpAccA: 30,
  canonicalExpAccB: 30,
};

export const DEFAULT_LEVEL_CONFIG_JSON = JSON.stringify(DEFAULT_LEVEL_CONFIG);

/**
 * Globals required for {@link out/J-LevelMaster.js} after host install, before {@link out/J-Base.js}.
 *
 * @param {object} sandbox
 * @param {object} [options]
 * @param {string} [options.levelConfigJson] Full JSON text for {@link StorageManager.fsReadFile}, i.e. the contents
 * of {@code data/config.level.json}. Defaults to {@link DEFAULT_LEVEL_CONFIG_JSON}.
 */
export function installLevelEngineStubs(sandbox, options = {})
{
  const { levelConfigJson = DEFAULT_LEVEL_CONFIG_JSON } = options;

  vm.runInContext(`if (typeof Number.prototype.padZero !== 'function')
{
  Number.prototype.padZero = function(length)
  {
    return String(this).padStart(length, '0');
  };
}`, sandbox);

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

  sandbox.StorageManager.fsReadFile = function()
  {
    return levelConfigJson;
  };

  sandbox.$gameVariables._data = [];
  sandbox.$gameVariables.value = function(variableId)
  {
    const raw = this._data[variableId];

    if (raw === undefined || raw === null)
    {
      return 0;
    }

    return raw;
  };

  sandbox.$gameVariables.setValue = function(variableId, value)
  {
    this._data[variableId] = value;
  };

  sandbox.JABS_AiManager = {
    postConvertMutate: noop,
  };

  sandbox.Game_System.prototype.initialize = noop;

  sandbox.Game_Event.prototype.initMembers = noop;

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;

  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);

    if (this._level === undefined || this._level === null)
    {
      this._level = 1;
    }
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
      maxLevel: 99,
      traits: [],
    };
  };

  sandbox.Game_Actor.prototype.class = function()
  {
    return { note: '', params: [] };
  };

  sandbox.Game_Actor.prototype.currentClass = function()
  {
    const classId = this.actor().classId;
    const row = sandbox.$dataClasses && sandbox.$dataClasses[classId];

    if (row !== undefined && row !== null)
    {
      return row;
    }

    return {
      id: classId,
      note: '',
      params: [ [], [], [], [], [], [], [], [] ],
    };
  };

  sandbox.Game_Actor.prototype.equippedEquips = function()
  {
    return [];
  };

  sandbox.Game_Actor.prototype.equips = function()
  {
    return [];
  };

  sandbox.Game_Actor.prototype.allStates = function()
  {
    return [];
  };

  sandbox.Game_Actor.prototype.actorId = function()
  {
    return 1;
  };

  Object.setPrototypeOf(sandbox.Game_Enemy.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Enemy.prototype.constructor = sandbox.Game_Enemy;

  sandbox.Game_Enemy.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };

  sandbox.Game_Enemy.prototype.setup = noop;

  sandbox.Game_Actor.prototype.setup = noop;

  sandbox.Game_Enemy.prototype.enemy = function()
  {
    return this._enemyDb;
  };

  sandbox.Game_Enemy.prototype.enemyId = function()
  {
    return 1;
  };

  sandbox.Game_Enemy.prototype.states = function()
  {
    return [];
  };

  sandbox.Game_Battler.prototype.traitObjects = function()
  {
    return [];
  };

  function Game_Action()
  {
  }

  Game_Action.prototype.makeDamageValue = function()
  {
    return 100;
  };

  Game_Action.prototype.subject = function()
  {
    if (this.__subject !== undefined && this.__subject !== null)
    {
      return this.__subject;
    }

    return { level: 10 };
  };

  sandbox.Game_Action = Game_Action;

  function Game_Troop()
  {
  }

  Game_Troop.prototype.expTotal = function()
  {
    return 0;
  };

  Game_Troop.prototype.deadMembers = function()
  {
    return [];
  };

  sandbox.Game_Troop = Game_Troop;

  sandbox.Game_Party.prototype.battleMembers = function()
  {
    return [];
  };

  sandbox.Sprite_Character.prototype.getBattlerName = function()
  {
    return { name: 'Slime', colorHex: '#ffffff' };
  };

  sandbox.Sprite_Character.prototype.getBattler = function()
  {
    return {
      isEnemy()
      {
        return true;
      },
      level: 7,
      shouldHideLevel()
      {
        return false;
      },
    };
  };
}
//endregion engine-stubs
