//region plugins/apt/ext/typed/_component/rpg-enemy-typed-ap-rewards.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('RPG_Enemy#typedApRewards (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    // mirrors the real J.APT.EXT.TYPED.RegExp.ApTypedReward from
    // src/plugins/apt/ext/typed/_metadata/initialization.js- keep these two in lockstep.
    globalThis.J = { APT: { EXT: { TYPED: { RegExp: {
      ApTypedReward: /<apTyped:[ ]?(\[\d+,[ ]?[A-Za-z]+,[ ]?[A-Za-z0-9_\- ]+])>/gi,
    } } } } };

    // isolates this test from ApManager.resolveDomainId's real $dataSystem-backed name lookup-
    // that resolution is its own concern; this file only proves the ApTypedReward regex/destructure
    // shape is correct end-to-end. RPG_Enemy.js lowercases the domain before calling this, so the
    // mock must match against the lowercased form, not the tag's authored casing.
    globalThis.ApManager = {
      resolveDomainId: vi.fn((domain, idOrName) =>
      {
        if (domain === 'element' && idOrName === 'fire') return 4;
        if (domain === 'weapontype' && idOrName === 'sword') return 7;
        return NaN;
      }),
    };

    function RPG_Enemy()
    {
    }

    globalThis.RPG_Enemy = RPG_Enemy;

    // patches globalThis.RPG_Enemy.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/apt/ext/typed/database/RPG_Enemy.js');
  });

  /**
   * Builds a minimal RPG_Enemy-like object exposing the real prototype method under test.
   * @param {string} note
   * @returns {object}
   */
  function buildEnemy(note)
  {
    return Object.assign(Object.create(globalThis.RPG_Enemy.prototype), {
      id: 1, meta: {}, note,
    });
  }

  it('parses the documented 3-value <apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]> shape correctly', () =>
  {
    // Arrange
    const enemy = buildEnemy('<apTyped:[6, element, fire]>');

    // Act
    const rewards = enemy.typedApRewards();

    // Assert
    expect(rewards).toHaveLength(1);
    expect(rewards[0].amount).toBe(6);
    expect(rewards[0].domain).toBe('element');
    expect(rewards[0].id).toBe(4);
  });

  it('parses multiple <apTyped> tags on the same enemy independently', () =>
  {
    // Arrange
    const enemy = buildEnemy('<apTyped:[6, element, fire]>\n<apTyped:[3, weaponType, sword]>');

    // Act
    const rewards = enemy.typedApRewards();

    // Assert
    expect(rewards).toHaveLength(2);
    expect(rewards[1].amount).toBe(3);
    expect(rewards[1].domain).toBe('weapontype');
    expect(rewards[1].id).toBe(7);
  });

  it('drops entries whose domain/idOrName does not resolve to a finite id', () =>
  {
    // Arrange
    const enemy = buildEnemy('<apTyped:[6, element, unknownElement]>');

    // Act
    const rewards = enemy.typedApRewards();

    // Assert
    expect(rewards).toHaveLength(0);
  });

  it('returns an empty array when the enemy has no apTyped tags at all', () =>
  {
    // Arrange
    const enemy = buildEnemy('<someOtherTag:[1]>');

    // Act
    const rewards = enemy.typedApRewards();

    // Assert
    expect(rewards).toHaveLength(0);
  });
});
//endregion plugins/apt/ext/typed/_component/rpg-enemy-typed-ap-rewards.test.js
