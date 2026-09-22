//region plugins/elem/_component/game-action-slayer.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enemyData,
  installElemHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJElem,
} from './fixtures/install-elem-host-globals.js';

/**
 * A slayer bonus is the one element tag keyed on what the *target* is rather than on what the attack
 * is made of, which is what makes "I have studied undead, so I kill undead faster" expressible at
 * all. These tests pin both halves: which targets qualify, and where the multiplier lands.
 */
describe('J-Elementalistics slayer bonuses (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installElemHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');

    setPluginContextToJElem();
    await import('../../../../src/plugins/elem/core/_metadata/initialization.js');

    await import('../../../../src/plugins/elem/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/elem/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/elem/core/objects/Game_Enemy.js');
    await import('../../../../src/plugins/elem/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    // the shared fixture only declares a couple of elements, and element rates are sized by this
    // list- so the family ids these tests use have to actually exist in it.
    globalThis.$dataSystem.elements = [
      '', 'Cut', 'Poke', 'Blunt', 'Heat', 'Liquid', 'Air', 'Ground', 'Energy', 'Void', 'Typeless',
      'vs Undead', 'vs Reptile', 'vs Aquatic', 'vs Slime', 'vs Plant', 'vs Beast', ];
  });

  /**
   * Builds an attacker carrying the given note, which is where slayer bonuses are authored.
   * @param {string} note The note block granting the slayer bonuses.
   * @returns {Game_Battler}
   */
  function attackerWithNote(note)
  {
    const attacker = new Game_Battler();
    attacker.getAllNotes = () => [ enemyData({ note }) ];

    return attacker;
  }

  /**
   * Builds a target whose database row carries the given element rate traits.
   * @param {Array<{code: number, dataId: number, value: number}>} traits The element rate traits.
   * @returns {Game_Battler}
   */
  function targetWithRates(traits)
  {
    const target = new Game_Battler();
    target.databaseData = () => enemyData({ traits });

    return target;
  }

  /**
   * Builds an element rate trait.
   * @param {number} dataId The element id.
   * @param {number} value The rate multiplier.
   * @returns {{code: number, dataId: number, value: number}}
   */
  function elementRate(dataId, value)
  {
    return {
      code: 11,
      dataId,
      value,
    };
  }

  describe('isTargetInElementalFamily', () =>
  {
    it('counts a target weak to the element as a member of that family', () =>
    {
      // Arrange
      const attacker = attackerWithNote('');
      const target = targetWithRates([ elementRate(11, 2) ]);

      // Act
      const result = attacker.isTargetInElementalFamily(target, 11);

      // Assert
      expect(result).toBe(true);
    });

    it('does not count a target that is neutral to the element', () =>
    {
      // Arrange- a near-miss sibling: the target is tagged for a different family entirely.
      const attacker = attackerWithNote('');
      const target = targetWithRates([ elementRate(16, 2) ]);

      // Act
      const result = attacker.isTargetInElementalFamily(target, 11);

      // Assert
      expect(result).toBe(false);
    });

    it('does not count a target that resists the element', () =>
    {
      // Arrange- resistance is the opposite of membership, not a weaker form of it.
      const attacker = attackerWithNote('');
      const target = targetWithRates([ elementRate(11, 0.25) ]);

      // Act
      const result = attacker.isTargetInElementalFamily(target, 11);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('slayerMultiplierAgainst', () =>
  {
    it('answers a neutral multiplier when the attacker has no slayer bonuses', () =>
    {
      // Arrange
      const attacker = attackerWithNote('<boostElement:[4, 50]>');
      const target = targetWithRates([ elementRate(11, 2) ]);

      // Act
      const result = attacker.slayerMultiplierAgainst(target);

      // Assert
      expect(result).toBe(1);
    });

    it('applies a bonus whose family the target belongs to', () =>
    {
      // Arrange
      const attacker = attackerWithNote('<slayer:[11, 50]>');
      const target = targetWithRates([ elementRate(11, 2) ]);

      // Act
      const result = attacker.slayerMultiplierAgainst(target);

      // Assert
      expect(result).toBe(1.5);
    });

    it('ignores a bonus whose family the target does not belong to', () =>
    {
      // Arrange- the attacker has studied undead, but this is a beast.
      const attacker = attackerWithNote('<slayer:[11, 50]>');
      const target = targetWithRates([ elementRate(16, 2) ]);

      // Act
      const result = attacker.slayerMultiplierAgainst(target);

      // Assert
      expect(result).toBe(1);
    });

    it('compounds two bonuses that both apply to the target', () =>
    {
      // Arrange- a hybrid target belonging to both studied families.
      const attacker = attackerWithNote('<slayer:[11, 50]>\n<slayer:[16, 50]>');
      const target = targetWithRates([ elementRate(11, 2), elementRate(16, 2) ]);

      // Act
      const result = attacker.slayerMultiplierAgainst(target);

      // Assert
      expect(result).toBe(2.25);
    });

    it('applies only the matching half when the target belongs to one of two studied families', () =>
    {
      // Arrange- the near-miss sibling bonus must be evaluated and rejected.
      const attacker = attackerWithNote('<slayer:[11, 50]>\n<slayer:[16, 50]>');
      const target = targetWithRates([ elementRate(16, 2) ]);

      // Act
      const result = attacker.slayerMultiplierAgainst(target);

      // Assert
      expect(result).toBe(1.5);
    });

    it('applies a negative percent as a penalty', () =>
    {
      // Arrange
      const attacker = attackerWithNote('<slayer:[11, -25]>');
      const target = targetWithRates([ elementRate(11, 2) ]);

      // Act
      const result = attacker.slayerMultiplierAgainst(target);

      // Assert
      expect(result).toBe(0.75);
    });
  });

  describe('makeDamageValue', () =>
  {
    /**
     * Builds an action whose underlying damage is a fixed, known amount.
     * @param {Game_Battler} attacker The battler swinging.
     * @param {number} baseDamage The damage the rest of the pipeline would have produced.
     * @returns {Game_Action}
     */
    function actionDealing(attacker, baseDamage)
    {
      const action = new Game_Action(attacker);
      action.subject = () => attacker;

      // stand in for the entire vanilla and J-ABS damage pipeline beneath this alias.
      J.ELEM.Aliased.Game_Action.set('makeDamageValue', () => baseDamage);

      return action;
    }

    it('scales the finished damage by the slayer multiplier', () =>
    {
      // Arrange
      const attacker = attackerWithNote('<slayer:[11, 50]>');
      const target = targetWithRates([ elementRate(11, 2) ]);
      const action = actionDealing(attacker, 200);

      // Act
      const result = action.makeDamageValue(target, false);

      // Assert
      expect(result).toBe(300);
    });

    it('leaves damage untouched when no slayer bonus applies', () =>
    {
      // Arrange
      const attacker = attackerWithNote('<slayer:[11, 50]>');
      const target = targetWithRates([ elementRate(16, 2) ]);
      const action = actionDealing(attacker, 200);

      // Act
      const result = action.makeDamageValue(target, false);

      // Assert
      expect(result).toBe(200);
    });

    it('rounds the scaled damage back to an integer', () =>
    {
      // Arrange- 33 * 1.5 is 49.5, which must not leak a fraction into the damage pool.
      const attacker = attackerWithNote('<slayer:[11, 50]>');
      const target = targetWithRates([ elementRate(11, 2) ]);
      const action = actionDealing(attacker, 33);

      // Act
      const result = action.makeDamageValue(target, false);

      // Assert
      expect(result).toBe(50);
    });
  });
});
//endregion plugins/elem/_component/game-action-slayer.test.js
