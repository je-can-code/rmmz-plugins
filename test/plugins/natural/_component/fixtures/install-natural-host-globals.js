//region plugins/natural/_component/fixtures/install-natural-host-globals.js
import PluginMetadata from '../../../../../src/plugins/_base/models/PluginMetadata.js';

const noop = function()
{
};

export const DEFAULT_NATURAL_PLUGIN_PARAMS = {
  actorBaseTp: '42',
  enemyBaseTp: '17',
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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-NaturalGrowth's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJNatural(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-NaturalGrowth';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-NaturalGrowth's Game_Battler/Game_Actor/Game_Enemy/Game_Party/Scene_Equip/
 * Window_EquipItem.js to evaluate when direct-imported into the real Vitest realm instead of a
 * nested vm context. Builds a from-scratch battler chain rather than reusing installJBaseHostGlobals's
 * placeholders, mirroring the original VM fixture (natural pins its own paramBase/xparam/sparam/
 * getBaseMaxTp defaults deliberately, ahead of real _base's aliasing on top).
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} [naturalPluginParameterStrings] `PluginManager.parameters('J-NaturalGrowth')` shape.
 */
export function installNaturalHostGlobals(sandbox = globalThis, naturalPluginParameterStrings = DEFAULT_NATURAL_PLUGIN_PARAMS)
{
  if (sandbox.__naturalHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__naturalHostGlobalsInstalled = true;

  sandbox.PluginMetadata ??= PluginMetadata;

  const prevPm = sandbox.PluginManager;
  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-Base')
      {
        return prevPm ? prevPm.parameters('J-Base') : { actorBaseTp: '0', enemyBaseTp: '100' };
      }

      return naturalPluginParameterStrings;
    },
  };

  sandbox.$gameVariables = { _data: [] };

  function Game_BattlerBase()
  {
  }

  Game_BattlerBase.knownBaseParameterIds = () => [ 0, 1, 2, 3, 4, 5, 6, 7 ];
  Game_BattlerBase.knownExParameterIds = () => [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
  Game_BattlerBase.knownSpParameterIds = () => [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

  // no-op so J.BASE.Aliased.Game_BattlerBase has a real function to save (not undefined).
  Game_BattlerBase.prototype.initMembers = function()
  {
  };

  sandbox.Game_BattlerBase = Game_BattlerBase;

  function Game_Battler()
  {
  }

  Game_Battler.prototype.initMembers = function()
  {
    Game_BattlerBase.prototype.initMembers.call(this);
    this._states = [];
  };
  Game_Battler.prototype.paramBase = () => 0;
  Game_Battler.prototype.xparam = () => 0;
  Game_Battler.prototype.sparam = () => 0;
  Game_Battler.prototype.getBaseMaxTp = () => 0;
  Game_Battler.prototype.getBaseMaxTpBonuses = () => 0;

  // J-Level adds getLevel() in production; stubs must match the interface.
  Game_Battler.prototype.getLevel = function()
  {
    return this.level ?? 1;
  };

  // maintain the BattlerBase chain so J-Base prototype extensions remain accessible.
  Object.setPrototypeOf(Game_Battler.prototype, Game_BattlerBase.prototype);

  sandbox.Game_Battler = Game_Battler;

  function Game_Actor()
  {
  }

  Object.setPrototypeOf(Game_Actor.prototype, Game_Battler.prototype);
  Game_Actor.prototype.constructor = Game_Actor;

  Game_Actor.prototype.setup = noop;
  Game_Actor.prototype.onBattlerDataChange = function()
  {
    // mirror the real _base implementation: drop every battler-scoped JCache entry for this
    // battler. Looked up dynamically off sandbox (set by the test after importing JCache in the
    // same post-vi.resetModules() epoch as _base/objects/Game_Battler.js) rather than a static
    // top-level import here, since a static import would resolve to a stale module instance whose
    // JCache._battlerCaches set is disjoint from the one Game_Battler.js/RPGManager registered into.
    sandbox.JCache?.invalidateAllForBattler(this);
  };
  Game_Actor.prototype.actorId = () => 1;
  Game_Actor.prototype.actor = function()
  {
    return this.__actorDb ?? {
      id: 1, name: '', note: '', classId: 1, traits: [],
    };
  };
  Game_Actor.prototype.class = () => ({ note: '' });
  Game_Actor.prototype.currentClass = () => ({ note: '' });
  Game_Actor.prototype.equips = () => [];
  Game_Actor.prototype.paramBase = () => 10;
  Game_Actor.prototype.xparam = () => 0.25;
  Game_Actor.prototype.sparam = () => 1;
  Game_Actor.prototype.levelUp = noop;

  Object.defineProperty(Game_Actor.prototype, 'level', {
    configurable: true,
    get()
    {
      return this._level ?? 1;
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
    return (typeof J === 'undefined' || !J.NATURAL)
      ? 100
      : J.NATURAL.Metadata.BaseTpMaxActors;
  };

  sandbox.Game_Actor = Game_Actor;

  function Game_Enemy()
  {
  }

  Object.setPrototypeOf(Game_Enemy.prototype, Game_Battler.prototype);
  Game_Enemy.prototype.constructor = Game_Enemy;

  Game_Enemy.prototype.setup = noop;
  Game_Enemy.prototype.onBattlerDataChange = noop;
  Game_Enemy.prototype.paramBase = () => 0;
  Game_Enemy.prototype.xparam = () => 0;
  Game_Enemy.prototype.sparam = () => 0;
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
    return (typeof J === 'undefined' || !J.NATURAL)
      ? 50
      : J.NATURAL.Metadata.BaseTpMaxEnemies;
  };

  sandbox.Game_Enemy = Game_Enemy;

  function Game_Party()
  {
  }

  Game_Party.prototype.gainItem = noop;
  Game_Party.prototype.members = () => [];
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
//endregion plugins/natural/_component/fixtures/install-natural-host-globals.js
