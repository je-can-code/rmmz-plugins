//region plugins/prof/ext/knowledge/_component/fixtures/install-knowledge-host-globals.js
import { installProfHostGlobals } from '../../../../_component/fixtures/install-prof-host-globals.js';

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to the knowledge extension's identity.
 *
 * These are read once, at import time, by the extension's own initialization.js- so the flip has to
 * happen between importing J-Proficiency's initialization and importing this one's.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJKnowledge(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Proficiency-Knowledge';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals the knowledge extension needs on top of what J-Proficiency's own fixture installs.
 *
 * The extension writes to a party, hands out database rows, and records its outcome in a variable and a
 * switch, none of which J-Proficiency itself ever touches- so those four are stood up here.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installKnowledgeHostGlobals(sandbox = globalThis)
{
  installProfHostGlobals(sandbox);

  if (sandbox.__knowledgeHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__knowledgeHostGlobalsInstalled = true;

  // the exchange resolves its output against the real datastores; 503 is a near-miss that must never
  // be handed over by an exchange naming 501 or 502.
  sandbox.$dataItems = [ null ];
  sandbox.$dataItems[501] = { id: 501, name: 'Vitest Blueprint Scrap' };
  sandbox.$dataItems[502] = { id: 502, name: 'Vitest Pattern Diagram' };
  sandbox.$dataItems[503] = { id: 503, name: 'Vitest Decoy' };
  sandbox.$dataWeapons = [ null ];
  sandbox.$dataWeapons[601] = { id: 601, name: 'Vitest Weapon' };
  sandbox.$dataArmors = [ null ];
  sandbox.$dataArmors[701] = { id: 701, name: 'Vitest Armor' };

  function Game_Party()
  {
  }

  Game_Party.prototype.initialize = function()
  {
    this.initMembers();
  };
  Game_Party.prototype.initMembers = function()
  {
  };
  Game_Party.prototype.gainItem = function(item, amount)
  {
    this.__gainedItems ||= [];
    this.__gainedItems.push({
      item,
      amount,
    });
  };
  sandbox.Game_Party = Game_Party;

  sandbox.$gameVariables = {
    __values: new Map(),
    setValue(variableId, value)
    {
      this.__values.set(variableId, value);
    },
    value(variableId)
    {
      return this.__values.get(variableId);
    },
  };

  sandbox.$gameSwitches = {
    __values: new Map(),
    setValue(switchId, value)
    {
      this.__values.set(switchId, value);
    },
    value(switchId)
    {
      return this.__values.get(switchId);
    },
  };
}

/**
 * Stands up a fresh party carrying no knowledge at all.
 *
 * Each test gets its own, because a balance left behind by a previous test would let an assertion pass
 * on knowledge nobody in that test earned.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @returns {Game_Party}
 */
export function freshParty(sandbox = globalThis)
{
  const party = new sandbox.Game_Party();

  party.initialize();

  sandbox.$gameParty = party;

  return party;
}
//endregion plugins/prof/ext/knowledge/_component/fixtures/install-knowledge-host-globals.js