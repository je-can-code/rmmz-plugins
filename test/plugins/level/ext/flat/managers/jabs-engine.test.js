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

    it('adds the flat level-difference experience to the enemy\'s bonus experience', () =>
    {
      // Arrange: equal levels means parity experience (25) from ExperienceManager.
      const engine = buildEngine({ canGainReward: vi.fn(() => true) });
      const defeatedEnemy = { level: 10, exp: () => 5 };
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
      const defeatedEnemy = { level: 20, exp: () => 0 };
      const victoriousActor = { level: 5 };

      // Act
      const result = engine.determineExperienceGained(defeatedEnemy, victoriousActor);

      // Assert
      expect(result).toBe(1000);
    });
  });
});
//endregion plugins/level/ext/flat/managers/jabs-engine.test.js
