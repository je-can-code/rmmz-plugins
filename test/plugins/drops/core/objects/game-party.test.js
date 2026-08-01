//region plugins/drops/core/objects/game-party.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * The party's contribution to reward rates is a sum of what its members carry, and which members
 * count depends on a configured strategy. Two things matter here and both have bitten this code:
 * the strategy has to fail loudly rather than silently considering nobody, and the drop bonus is
 * a bonus rather than a multiplier - the identity value belongs to the enemy, not to the party.
 * Gold works the other way round and multiplies, so its base of one is correct.
 */
describe('J-DropsControl Game_Party (direct src import)', () =>
{
  let DropsPartyStrategy;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Party.js');

    ({ default: DropsPartyStrategy } = await import('../../../../../src/plugins/drops/core/models/DropsPartyStrategy.js'));
  });

  /**
   * Builds an actor stand-in contributing fixed reward bonuses.
   * @param {string} name A label to identify the member by in assertions.
   * @param {number} dropBonus The drop multiplier bonus this member contributes.
   * @param {number} goldBonus The gold multiplier bonus this member contributes.
   * @returns {object}
   */
  function makeMember(name, dropBonus = 0, goldBonus = 0)
  {
    return {
      name,
      getDropMultiplierBonus: () => dropBonus,
      getGoldMultiplier: () => goldBonus,
    };
  }

  let party;

  beforeEach(() =>
  {
    party = new globalThis.Game_Party();
    party.__battleMembers = [];
  });

  //region strategy resolution
  describe('dropsStrategyMembers', () =>
  {
    it('considers only the leader under the ABS strategy', () =>
    {
      // Arrange: an action battle system has one character on the field, so only they can
      // reasonably influence what the things they killed drop.
      party.__battleMembers = [ makeMember('lead'), makeMember('second') ];
      globalThis.$gameParty = party;

      // Act
      const members = party.dropsStrategyMembers(DropsPartyStrategy.AbsStyle);

      // Assert
      expect(members.map(member => member.name)).toEqual([ 'lead' ]);
    });

    it('considers the active battle party under the combat strategy', () =>
    {
      // Arrange
      party.__battleMembers = [ makeMember('lead'), makeMember('second') ];
      globalThis.$gameParty = party;

      // Act
      const members = party.dropsStrategyMembers(DropsPartyStrategy.CombatPartyStyle);

      // Assert
      expect(members.map(member => member.name)).toEqual([ 'lead', 'second' ]);
    });

    it('considers everyone including reserves under the full party strategy', () =>
    {
      // Arrange
      party.__battleMembers = [ makeMember('lead'), makeMember('second') ];
      globalThis.$gameParty = party;

      // Act
      const members = party.dropsStrategyMembers(DropsPartyStrategy.FullPartyStyle);

      // Assert
      expect(members.map(member => member.name)).toEqual([ 'lead', 'second' ]);
    });

    it('refuses to run at all on a strategy it does not recognize', () =>
    {
      // Arrange: a misconfigured plugin parameter would otherwise consider nobody, quietly
      // stripping every reward bonus for the rest of the playthrough with nothing to point at.
      globalThis.$gameParty = party;

      // Act
      const act = () => party.dropsStrategyMembers('not-a-real-strategy');

      // Assert
      expect(act).toThrow(/Unrecognized drops party strategy/);
    });

    it('names the offending strategy in the failure', () =>
    {
      // Arrange
      globalThis.$gameParty = party;

      // Act
      const act = () => party.dropsStrategyMembers('typo-style');

      // Assert
      expect(act).toThrow(/typo-style/);
    });
  });

  describe('strategy delegation', () =>
  {
    it('resolves gold members through the shared strategy', () =>
    {
      // Arrange: gold and loot consider the same people; only the multiplier they feed differs.
      party.__battleMembers = [ makeMember('lead'), makeMember('second') ];
      globalThis.$gameParty = party;

      // Act
      const members = party.goldMultiplierMembers(DropsPartyStrategy.AbsStyle);

      // Assert
      expect(members.map(member => member.name)).toEqual([ 'lead' ]);
    });

    it('resolves drop members through the shared strategy', () =>
    {
      // Arrange
      party.__battleMembers = [ makeMember('lead'), makeMember('second') ];
      globalThis.$gameParty = party;

      // Act
      const members = party.dropMultiplierMembers(DropsPartyStrategy.AbsStyle);

      // Assert
      expect(members.map(member => member.name)).toEqual([ 'lead' ]);
    });
  });
  //endregion strategy resolution

  //region drop multiplier
  describe('getPartyDropMultiplier', () =>
  {
    it('contributes nothing at all from a party carrying no bonuses', () =>
    {
      // Arrange: this is the value the enemy ADDS to its own base rate of one. Contributing a
      // one here as well would sum two identities into two and double every drop in the game.
      party.__battleMembers = [ makeMember('lead'), makeMember('second') ];
      globalThis.$gameParty = party;

      // Act
      const result = party.getPartyDropMultiplier();

      // Assert
      expect(result).toBe(0);
    });

    it('sums the bonuses of every considered member', () =>
    {
      // Arrange
      party.__battleMembers = [ makeMember('lead', 0.25), makeMember('second', 0.1) ];
      globalThis.$gameParty = party;

      // Act
      const result = party.getPartyDropMultiplier();

      // Assert
      expect(result).toBeCloseTo(0.35, 10);
    });

    it('contributes nothing from an empty party', () =>
    {
      // Arrange
      globalThis.$gameParty = party;

      // Act
      const result = party.getPartyDropMultiplier();

      // Assert
      expect(result).toBe(0);
    });
  });
  //endregion drop multiplier

  //region gold multiplier
  describe('getGoldMultiplier', () =>
  {
    it('starts from a neutral multiplier, since gold is scaled rather than summed onto', () =>
    {
      // Arrange: the enemy multiplies its gold by this, so a party with no bonuses has to
      // leave the amount untouched rather than zeroing it.
      party.__battleMembers = [ makeMember('lead'), makeMember('second') ];
      globalThis.$gameParty = party;

      // Act
      const result = party.getGoldMultiplier();

      // Assert
      expect(result).toBe(1);
    });

    it('adds each member bonus on top of the neutral multiplier', () =>
    {
      // Arrange
      party.__battleMembers = [ makeMember('lead', 0, 0.5), makeMember('second', 0, 0.25) ];
      globalThis.$gameParty = party;

      // Act
      const result = party.getGoldMultiplier();

      // Assert
      expect(result).toBeCloseTo(1.75, 10);
    });
  });
  //endregion gold multiplier
});
//endregion plugins/drops/core/objects/game-party.test.js