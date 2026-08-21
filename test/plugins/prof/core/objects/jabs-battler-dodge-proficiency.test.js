//region plugins/prof/core/objects/jabs-battler-dodge-proficiency.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Dodging earns proficiency through a hook of its own rather than the ordinary action path.
 *
 * That path hangs off {@link Game_Action.apply} and requires the target to have been hit, but a dodge
 * skill targets the user with no damage and no effects - so RMMZ's own `testApply` answers false and
 * there is nothing for the proficiency check to see. Without this hook, dodging counts for nothing.
 *
 * The block is gated behind J-ABS at module load, which is why this lives in its own file: a module
 * registry holds one answer per realm, so the absent-J-ABS case needs a separate import.
 */
describe('J-Proficiency JABS_Battler dodge rewards with J-ABS (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {},
      PROF: { Aliased: { JABS_Battler: new Map() } },
    };

    function StubJabsBattler()
    {
    }

    StubJabsBattler.prototype.onDodge = function()
    {
      this.dodgedThrough = true;
    };
    globalThis.JABS_Battler = StubJabsBattler;

    await import('../../../../../src/plugins/prof/core/objects/JABS_Battler.js');
  });

  /**
   * Builds a dodging battler whose permission and gain rate are pinned.
   * @param {object} [options] The scenario to build.
   * @returns {JABS_Battler}
   */
  function makeDodger(options = {})
  {
    const {
      canGain = true,
      proficiencyAmount = 1
    } = options;

    const battler = new globalThis.JABS_Battler();
    battler.awarded = [];
    battler.getBattler = () => ({
      canGainProficiency: () => canGain,
      skillProficiencyAmount: () => proficiencyAmount,
      increaseSkillProficiency: (skillId, amount) => battler.awarded.push([ skillId, amount ]),
    });

    return battler;
  }

  /**
   * The dodge skill a battler just executed.
   * @param {number} [id] The skill's id.
   * @returns {object}
   */
  const dodgeSkill = (id = 304) => ({ id });

  describe('onDodge', () =>
  {
    it('still performs the behavior it extends', () =>
    {
      // Arrange
      const dodger = makeDodger();

      // Act
      dodger.onDodge(dodgeSkill());

      // Assert
      expect(dodger.dodgedThrough).toBe(true);
    });

    it('awards the dodge skill through the extended hook', () =>
    {
      // Arrange
      const dodger = makeDodger({ proficiencyAmount: 3 });

      // Act
      dodger.onDodge(dodgeSkill(544));

      // Assert
      expect(dodger.awarded).toEqual([ [ 544, 3 ] ]);
    });
  });

  describe('gainProficiencyFromDodging', () =>
  {
    it('awards what the battler earns from any skill use', () =>
    {
      // Arrange - a battler carrying a bonus, so a flat award and a scaled one differ.
      const dodger = makeDodger({ proficiencyAmount: 4 });

      // Act
      dodger.gainProficiencyFromDodging(dodgeSkill(304));

      // Assert
      expect(dodger.awarded).toEqual([ [ 304, 4 ] ]);
    });

    it('awards the base rate to a battler carrying no bonus', () =>
    {
      // Arrange
      const dodger = makeDodger({ proficiencyAmount: 1 });

      // Act
      dodger.gainProficiencyFromDodging(dodgeSkill(304));

      // Assert
      expect(dodger.awarded).toEqual([ [ 304, 1 ] ]);
    });

    it('awards nothing to a battler that cannot gain proficiency', () =>
    {
      // Arrange
      const dodger = makeDodger({ canGain: false });

      // Act
      dodger.gainProficiencyFromDodging(dodgeSkill());

      // Assert
      expect(dodger.awarded).toEqual([]);
    });

    it('awards nothing when the dodge resolved to no skill', () =>
    {
      // Arrange - an empty dodge slot leaves nothing to practise.
      const dodger = makeDodger();

      // Act
      dodger.gainProficiencyFromDodging(null);

      // Assert
      expect(dodger.awarded).toEqual([]);
    });
  });

  describe('canGainProficiencyFromDodging', () =>
  {
    it('permits a battler with a skill and no restriction', () =>
    {
      // Arrange & Act
      const result = makeDodger().canGainProficiencyFromDodging(dodgeSkill());

      // Assert
      expect(result).toBe(true);
    });

    it('refuses a battler barred from gaining proficiency', () =>
    {
      // Arrange & Act
      const result = makeDodger({ canGain: false }).canGainProficiencyFromDodging(dodgeSkill());

      // Assert
      expect(result).toBe(false);
    });

    it('refuses when there is no skill to practise', () =>
    {
      // Arrange & Act
      const result = makeDodger().canGainProficiencyFromDodging(null);

      // Assert
      expect(result).toBe(false);
    });
  });
});

describe('J-Proficiency JABS_Battler dodge rewards without J-ABS (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // no ABS namespace, so the whole block is skipped at import time.
    globalThis.J = { PROF: { Aliased: { JABS_Battler: new Map() } } };

    function StubJabsBattler()
    {
    }

    globalThis.JABS_Battler = StubJabsBattler;

    await import('../../../../../src/plugins/prof/core/objects/JABS_Battler.js');
  });

  it('adds nothing to the battler when J-ABS is absent', () =>
  {
    // Arrange - a turn-based game has no per-frame dodge to reward.
    // Act & Assert
    expect(globalThis.JABS_Battler.prototype.gainProficiencyFromDodging)
      .toBeUndefined();
    expect(globalThis.J.PROF.Aliased.JABS_Battler.size)
      .toBe(0);
  });
});

//endregion plugins/prof/core/objects/jabs-battler-dodge-proficiency.test.js
