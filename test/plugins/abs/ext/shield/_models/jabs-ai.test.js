//region plugins/abs/ext/shield/_models/jabs-ai.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield JABS_AI (unit, all downstream dependencies mocked)', () =>
{
  let originalFilterForExecutorSkills;

  /**
   * The skills on hand, by id: 1 and 4 are plain, 2 bypasses shields, 3 deals bonus damage to them.
   * @type {Object<number, {hasShieldBypass: boolean, shieldBonusFormulas: string[]}>}
   */
  const skillsById = {
    1: { hasShieldBypass: false, shieldBonusFormulas: [] },
    2: { hasShieldBypass: true, shieldBonusFormulas: [] },
    3: { hasShieldBypass: false, shieldBonusFormulas: [ 'a.atk * 2' ] },
    4: { hasShieldBypass: false, shieldBonusFormulas: [] },
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { Aliased: { JABS_AI: new Map() } } } } };

    function JABS_AI()
    {
    }

    // core's executor pick, standing in as a pass-through so the test reads exactly what it was handed.
    originalFilterForExecutorSkills = vi.fn(skillsToUse => skillsToUse);
    JABS_AI.prototype.filterForExecutorSkills = originalFilterForExecutorSkills;
    globalThis.JABS_AI = JABS_AI;

    await import('../../../../../../src/plugins/abs/ext/shield/_models/JABS_AI.js');
  });

  beforeEach(() =>
  {
    originalFilterForExecutorSkills.mockClear();
  });

  /**
   * Builds a battler deciding with the skills above.
   * @returns {object}
   */
  function buildUser()
  {
    return { getSkill: skillId => skillsById[skillId] };
  }

  /**
   * Builds a target carrying the given unbroken shields.
   * @param {object[]} shieldStates The shield states the target has up.
   * @returns {object}
   */
  function buildTarget(shieldStates)
  {
    return { getBattler: () => ({ getShieldStates: () => shieldStates }) };
  }

  describe('filterForExecutorSkills', () =>
  {
    it('chooses among every skill when the target has no shield up', () =>
    {
      // Arrange- skill 2 is a breaker, so only the missing shield keeps the choice from narrowing.
      const ai = new globalThis.JABS_AI();
      const user = buildUser();
      const target = buildTarget([]);

      // Act
      const result = ai.filterForExecutorSkills([ 1, 2 ], user, target);

      // Assert
      expect(originalFilterForExecutorSkills).toHaveBeenCalledWith([ 1, 2 ], user, target);
      expect(result).toEqual([ 1, 2 ]);
    });

    it('chooses among the breakers alone while the target has a shield up', () =>
    {
      // Arrange
      const ai = new globalThis.JABS_AI();
      const user = buildUser();
      const target = buildTarget([ { shield: {} } ]);

      // Act
      const result = ai.filterForExecutorSkills([ 1, 2, 3 ], user, target);

      // Assert
      expect(originalFilterForExecutorSkills).toHaveBeenCalledWith([ 2, 3 ], user, target);
      expect(result).toEqual([ 2, 3 ]);
    });

    it('chooses among every skill when nothing on hand breaks the shield', () =>
    {
      // Arrange
      const ai = new globalThis.JABS_AI();
      const user = buildUser();
      const target = buildTarget([ { shield: {} } ]);

      // Act
      const result = ai.filterForExecutorSkills([ 1, 4 ], user, target);

      // Assert
      expect(originalFilterForExecutorSkills).toHaveBeenCalledWith([ 1, 4 ], user, target);
      expect(result).toEqual([ 1, 4 ]);
    });
  });

  describe('findShieldBreakers', () =>
  {
    it('finds no breakers while the target has no shield up', () =>
    {
      // Arrange- skills 2 and 3 would break a shield, so the missing shield is the only reason none are found.
      const ai = new globalThis.JABS_AI();

      // Act
      const result = ai.findShieldBreakers([ 1, 2, 3 ], buildUser(), buildTarget([]));

      // Assert
      expect(result).toEqual([]);
    });

    it('finds the skills that bypass a shield or bite into it', () =>
    {
      // Arrange
      const ai = new globalThis.JABS_AI();

      // Act
      const result = ai.findShieldBreakers([ 1, 2, 3, 4 ], buildUser(), buildTarget([ { shield: {} } ]));

      // Assert
      expect(result).toEqual([ 2, 3 ]);
    });
  });
});
//endregion plugins/abs/ext/shield/_models/jabs-ai.test.js