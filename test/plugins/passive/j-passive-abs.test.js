//region plugins/passive/j-passive-abs.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { loadPassiveAbsPluginVm } from './passive-abs-vm.js';

/**
 * {@link RPG_State} is a lexical class in the shipped bundle; expose the prototype for Object.create-based fixtures.
 *
 * @param {object} sandbox
 * @returns {object}
 */
function passiveAbsRpgStatePrototype(sandbox)
{
  return vm.runInContext('RPG_State.prototype', sandbox);
}

describe('J-Passive-ABS (out/passive/ext/J-Passive-ABS.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPassiveAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  it('metadata reads default affix chances from plugin parameters', () =>
  {
    expect(sandbox.J.PASSIVE.EXT.ABS.Metadata.defaultPrefixChance).toBe(33);
    expect(sandbox.J.PASSIVE.EXT.ABS.Metadata.defaultSuffixChance).toBe(33);
  });

  it('RPG_State#tierColorHex is null when the tier hex tag is absent', () =>
  {
    const state = Object.create(passiveAbsRpgStatePrototype(sandbox));
    state.id = 1;
    state.note = '<enemy-prefix>';

    expect(state.tierColorHex).toBe(null);
  });

  it('RPG_State#tierColorHex returns the captured hex when the tag is present', () =>
  {
    const state = Object.create(passiveAbsRpgStatePrototype(sandbox));
    state.id = 2;
    state.note = '<enemy-prefix>\n<tier-color-hex:#aabbcc>';

    expect(state.tierColorHex).toBe('#aabbcc');
  });

  it('RPG_Enemy#noRngPassives reads <no-rng-passives> on the enemy note', () =>
  {
    const enemy = Object.create(sandbox.RPG_Enemy.prototype);
    enemy.note = '<no-rng-passives>';

    expect(enemy.noRngPassives).toBe(true);
  });

  it('JABS_AiManager.shouldBlockPassivePrefixRng blocks when the enemy has noRngPassives', () =>
  {
    const enemyData = { noRngPassives: true, noRngPrefixes: false };
    const character = { eventCommentsDisablePassiveAffixPrefixRng() { return false; } };

    expect(sandbox.JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData)).toBe(true);
  });

  it('JABS_AiManager.shouldBlockPassiveSuffixRng blocks when the enemy has noRngPassives', () =>
  {
    const enemyData = { noRngPassives: true, noRngSuffixes: false };
    const character = { eventCommentsDisablePassiveAffixSuffixRng() { return false; } };

    expect(sandbox.JABS_AiManager.shouldBlockPassiveSuffixRng(character, enemyData)).toBe(true);
  });

  it('JABS_AiManager.shouldBlockPassivePrefixRng still allows prefix when only the slot tag is absent', () =>
  {
    const enemyData = { noRngPassives: false, noRngPrefixes: false };
    const character = { eventCommentsDisablePassiveAffixPrefixRng() { return false; } };

    expect(sandbox.JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData)).toBe(false);
  });

  it('resolvePassiveTierStripeColorHex returns empty when the first prefix state has no tier hex tag', () =>
  {
    const prefixState = Object.create(passiveAbsRpgStatePrototype(sandbox));
    prefixState.id = 50;
    prefixState.note = '<enemy-prefix>';
    prefixState.name = 'Tier';

    const battler = {
      isEnemy()
      {
        return true;
      },
      getPassiveStateIds()
      {
        return [ 50 ];
      },
      state(stateId)
      {
        if (stateId === 50) return prefixState;
        return null;
      },
    };

    const hex = sandbox.J.PASSIVE.EXT.ABS.Helpers.resolvePassiveTierStripeColorHex(battler);

    expect(hex).toBe('');
  });

  it('resolvePassiveTierStripeColorHex returns the hex when the prefix state defines tier-color-hex', () =>
  {
    const prefixState = Object.create(passiveAbsRpgStatePrototype(sandbox));
    prefixState.id = 51;
    prefixState.note = '<enemy-prefix>\n<tier-color-hex:#ff00aa>';
    prefixState.name = 'Tier';

    const battler = {
      isEnemy()
      {
        return true;
      },
      getPassiveStateIds()
      {
        return [ 51 ];
      },
      state(stateId)
      {
        if (stateId === 51) return prefixState;
        return null;
      },
    };

    const hex = sandbox.J.PASSIVE.EXT.ABS.Helpers.resolvePassiveTierStripeColorHex(battler);

    expect(hex).toBe('#ff00aa');
  });

  it('Game_Event#getResolvedPassiveAffixPrefixChance prefers the last event comment tag over the enemy note', () =>
  {
    const enemyData = Object.create(sandbox.RPG_Enemy.prototype);
    enemyData.note = '<passive-affix-prefix-chance:10>';

    const ev = new sandbox.Game_Event();
    ev.getValidCommentCommands = function()
    {
      return [
        { parameters: [ '<passive-affix-prefix-chance:25>' ] },
        { parameters: [ '<passive-affix-prefix-chance:40>' ] },
      ];
    };

    const chance = ev.getResolvedPassiveAffixPrefixChance(enemyData);

    expect(chance).toBe(40);
  });

  it('Game_Event#getResolvedPassiveAffixPrefixChance falls back to metadata default when no overrides apply', () =>
  {
    const enemyData = Object.create(sandbox.RPG_Enemy.prototype);
    enemyData.note = '';

    const ev = new sandbox.Game_Event();
    ev.getValidCommentCommands = function()
    {
      return [];
    };

    const chance = ev.getResolvedPassiveAffixPrefixChance(enemyData);

    expect(chance).toBe(33);
  });
});

describe('J-Passive-ABS metadata with custom plugin parameters', () =>
{
  let sandboxB;

  beforeAll(() =>
  {
    sandboxB = { console };
    loadPassiveAbsPluginVm(sandboxB, {
      'default-prefix-chance': '12',
      'default-suffix-chance': '88',
    });
  });

  afterAll(() =>
  {
    sandboxB = null;
  });

  it('honors custom default prefix and suffix chances', () =>
  {
    expect(sandboxB.J.PASSIVE.EXT.ABS.Metadata.defaultPrefixChance).toBe(12);
    expect(sandboxB.J.PASSIVE.EXT.ABS.Metadata.defaultSuffixChance).toBe(88);
  });

  it('Game_Event#getResolvedPassiveAffixPrefixChance uses the custom default when applicable', () =>
  {
    const enemyData = Object.create(sandboxB.RPG_Enemy.prototype);
    enemyData.note = '';

    const ev = new sandboxB.Game_Event();
    ev.getValidCommentCommands = function()
    {
      return [];
    };

    expect(ev.getResolvedPassiveAffixPrefixChance(enemyData)).toBe(12);
  });
});
//endregion plugins/passive/j-passive-abs.test.js