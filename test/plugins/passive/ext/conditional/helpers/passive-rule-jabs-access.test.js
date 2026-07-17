//region plugins/passive/ext/conditional/helpers/passive-rule-jabs-access.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PassiveRuleJabsAccess.enemiesTargetingMe (direct src import)', () =>
{
  let PassiveRuleJabsAccess;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { EXT: { CONDITIONAL: { Metadata: { defaultProximityTiles: 4 } } } } };
    globalThis.JABS_AiManager = {
      getBattlerByUuid: vi.fn(uuid => ({ getUuid: () => uuid })),
      getOpposingBattlers: vi.fn(() => []),
    };
    globalThis.JABS_Button = {};

    ({ default: PassiveRuleJabsAccess } = await import('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  /**
   * Builds a minimal Game_Battler-shaped stub with a resolvable map-side JABS wrapper.
   * @param {string} uuid
   * @returns {object}
   */
  function buildBattler(uuid)
  {
    return { getUuid: () => uuid };
  }

  it('returns an empty array when the battler has no map-side JABS wrapper', () =>
  {
    // Arrange
    const battler = { getUuid: undefined };

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns an empty array when no opposing battlers exist', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => []);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('excludes an opposing battler with no current target at all', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    const disengaged = { getUuid: () => 'enemy-1', getTarget: () => null };
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => [ disengaged ]);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('excludes an opposing battler currently targeting someone else', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    const targetingSomeoneElse = {
      getUuid: () => 'enemy-1',
      getTarget: () => ({ getUuid: () => 'someone-else-uuid' }),
    };
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => [ targetingSomeoneElse ]);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('includes an opposing battler currently targeting this battler', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    const targetingMe = {
      getUuid: () => 'enemy-1',
      getTarget: () => ({ getUuid: () => 'self-uuid' }),
    };
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => [ targetingMe ]);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([ targetingMe ]);
  });
});
//endregion plugins/passive/ext/conditional/helpers/passive-rule-jabs-access.test.js
