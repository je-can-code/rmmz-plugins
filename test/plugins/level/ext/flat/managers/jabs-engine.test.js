//region plugins/level/ext/flat/managers/jabs-engine.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine (J-LEVEL-Flat) (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {},
      LEVEL: { EXT: { FLAT: { Metadata: { policyMultiplier: 1.0 } } } },
    };

    function JABS_Engine()
    {
    }

    globalThis.JABS_Engine = JABS_Engine;

    await import('../../../../../../src/plugins/level/ext/flat/managers/JABS_Engine.js');
  });

  function buildEngine(overrides = {})
  {
    const engine = Object.create(globalThis.JABS_Engine.prototype);
    return Object.assign(engine, overrides);
  }

  describe('determineExperienceGained', () =>
  {
    it('returns 0 when the reward policy gate blocks the reward', () =>
    {
      // Arrange
      const engine = buildEngine({ canGainReward: vi.fn(() => false) });
      const defeatedEnemy = { level: 10, exp: () => 5 };
      const victoriousActor = { level: 10 };

      // Act
      const result = engine.determineExperienceGained(defeatedEnemy, victoriousActor);

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the enemy carries <no:exp>, however far it outlevels the rewardee', () =>
    {
      // Arrange: the gate is open and a level 60 target would pay the full 1000 flat exp to a level 5
      // rewardee, so only the tag can be what zeroes this.
      const engine = buildEngine({ canGainReward: vi.fn(() => true) });
      const defeatedEnemy = { level: 60, exp: () => 5, hasNoExp: () => true, hasNoGold: () => false };
      const victoriousActor = { level: 5 };

      // Act
      const result = engine.determineExperienceGained(defeatedEnemy, victoriousActor);

      // Assert
      expect(result).toBe(0);
    });

    it('adds the flat level-difference experience to the enemy\'s bonus experience', () =>
    {
      // Arrange: equal levels means parity experience (25) from ExperienceManager. the enemy refuses
      // gold, the near-miss sibling, which must leave its experience alone.
      const engine = buildEngine({ canGainReward: vi.fn(() => true) });
      const defeatedEnemy = { level: 10, exp: () => 5, hasNoExp: () => false, hasNoGold: () => true };
      const victoriousActor = { level: 10 };

      // Act
      const result = engine.determineExperienceGained(defeatedEnemy, victoriousActor);

      // Assert
      expect(result).toBe(30);
    });

    it('passes the victorious actor and defeated enemy levels to the reward calculation', () =>
    {
      // Arrange: a level 5 rewardee against a level 20 target maxes out at 1000 flat exp.
      const engine = buildEngine({ canGainReward: vi.fn(() => true) });
      const defeatedEnemy = { level: 20, exp: () => 0, hasNoExp: () => false };
      const victoriousActor = { level: 5 };

      // Act
      const result = engine.determineExperienceGained(defeatedEnemy, victoriousActor);

      // Assert
      expect(result).toBe(1000);
    });
  });
});
//endregion plugins/level/ext/flat/managers/jabs-engine.test.js
