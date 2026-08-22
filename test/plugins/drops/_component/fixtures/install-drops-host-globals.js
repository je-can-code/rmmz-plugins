//region plugins/drops/_component/fixtures/install-drops-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

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
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-DropsControl's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJDrops(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-DropsControl';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-DropsControl's Game_Battler/Game_Actor/Game_Enemy/Game_Party.js and
 * database/RPG_Enemy.js to evaluate when direct-imported into the real Vitest realm instead of a
 * nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installDropsHostGlobals(sandbox = globalThis)
{
  if (sandbox.__dropsHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__dropsHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // drops's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-DropsControl', {});

  sandbox.$dataItems = [];
  sandbox.$dataWeapons = [];
  sandbox.$dataArmors = [];

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;
  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };
  sandbox.Game_Actor.prototype.actorId = () => 1;
  sandbox.Game_Actor.prototype.actor = function()
  {
    return this.__actorDb ?? {
      id: 1, name: '', note: '', classId: 1, traits: [],
    };
  };
  sandbox.Game_Actor.prototype.databaseData = function()
  {
    return this.actor();
  };
  sandbox.Game_Actor.prototype.class = () => ({ note: '' });
  sandbox.Game_Actor.prototype.currentClass = () => ({ note: '' });
  sandbox.Game_Actor.prototype.equips = () => [];

  Object.setPrototypeOf(sandbox.Game_Enemy.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Enemy.prototype.constructor = sandbox.Game_Enemy;
  sandbox.Game_Enemy.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };
  sandbox.Game_Enemy.prototype.enemy = function()
  {
    return this._enemyDb;
  };
  sandbox.Game_Enemy.prototype.databaseData = function()
  {
    return this.enemy();
  };
  sandbox.Game_Enemy.prototype.dropItemRate = function()
  {
    return sandbox.$gameParty.hasDropItemDouble() ? 2 : 1;
  };
  sandbox.Game_Enemy.prototype.itemObject = function(kind, dataId)
  {
    if (kind === 1) return sandbox.$dataItems[dataId];
    if (kind === 2) return sandbox.$dataWeapons[dataId];
    if (kind === 3) return sandbox.$dataArmors[dataId];
    return null;
  };
  sandbox.Game_Enemy.prototype.gold = function()
  {
    return this.enemy().gold;
  };

  function Game_Party()
  {
    this.__battleMembers = [];
    this.__reserveMembers = [];
  }

  // the roster and the active battle party are genuinely different lists in the engine, and the
  // reward strategies exist precisely to choose between them - a stand-in that answered both with
  // the same array would make "the combat party" and "everyone" indistinguishable. A test that
  // benches nobody still sees the old behavior, since reserves default to empty.
  Game_Party.prototype.members = function()
  {
    return [ ...this.__battleMembers, ...this.__reserveMembers ];
  };
  Game_Party.prototype.battleMembers = function()
  {
    return this.__battleMembers || [];
  };
  Game_Party.prototype.leader = function()
  {
    const m = this.members();
    return m.length === 0 ? null : m[0];
  };
  Game_Party.prototype.hasDropItemDouble = () => false;
  sandbox.Game_Party = Game_Party;
  sandbox.$gameParty = new Game_Party();
}
//endregion plugins/drops/_component/fixtures/install-drops-host-globals.js
