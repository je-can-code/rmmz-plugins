//region plugins/passive/ext/conditional/models/state-affliction-provider.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A passive is a permanent trait wearing a state's clothing, so it must not appear in the affliction
 * strip beside things the player can wait out or cure. J-ABS owns the strip and has no notion of a
 * passive; J-Passive owns passives and has no notion of the strip. This extension is the only place
 * both halves are in scope, which is why the exclusion lives here rather than in either core.
 */
describe('J-Passive-Conditional StateAfflictionProvider augment (direct src import)', () =>
{
  let baseQualifies;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the augment aliases a bare global hoisted from J-ABS, so it has to exist before the import.
    baseQualifies = vi.fn(() => true);
    globalThis.StateAfflictionProvider = { qualifies: baseQualifies };

    globalThis.J = {
      PASSIVE: {
        EXT: {
          CONDITIONAL: { Aliased: { StateAfflictionProvider: new Map() } },
        },
      },
    };

    await import('../../../../../../src/plugins/passive/ext/conditional/models/StateAfflictionProvider.js');
  });

  beforeEach(() =>
  {
    baseQualifies.mockClear()
      .mockReturnValue(true);
  });

  /**
   * Builds a battler that reports the given state ids as passive.
   * @param {number[]} passiveStateIds The state ids this battler holds passively.
   * @returns {object}
   */
  function buildBattler(passiveStateIds)
  {
    return { isPassiveState: stateId => passiveStateIds.includes(stateId) };
  }

  it('rejects a state the battler holds passively', () =>
  {
    // Arrange
    const battler = buildBattler([ 1021 ]);

    // Act
    const qualifies = globalThis.StateAfflictionProvider.qualifies({ stateId: 1021 }, battler);

    // Assert
    expect(qualifies).toBe(false);
  });

  it('keeps an ordinary affliction the battler does not hold passively', () =>
  {
    // Arrange: the near-miss matters - the battler holds a passive, just not this one. Without it,
    // "this state is passive" and "this battler has any passive at all" would be the same program.
    const battler = buildBattler([ 1021 ]);

    // Act
    const qualifies = globalThis.StateAfflictionProvider.qualifies({ stateId: 7 }, battler);

    // Assert
    expect(qualifies).toBe(true);
  });

  it('leaves a state the base rules already rejected rejected', () =>
  {
    // Arrange: expiry and the death state are J-ABS's calls, and this augment must not resurrect
    // something core threw out. The battler holds no passives, so the only route to false is the
    // original's answer being honoured.
    baseQualifies.mockReturnValue(false);
    const battler = buildBattler([]);

    // Act
    const qualifies = globalThis.StateAfflictionProvider.qualifies({ stateId: 7 }, battler);

    // Assert
    expect(qualifies).toBe(false);
  });

  it('consults the original rather than replacing it', () =>
  {
    // Arrange
    const battler = buildBattler([]);
    const trackedState = { stateId: 7 };

    // Act
    globalThis.StateAfflictionProvider.qualifies(trackedState, battler);

    // Assert
    expect(baseQualifies).toHaveBeenCalledWith(trackedState, battler);
  });
});
//endregion plugins/passive/ext/conditional/models/state-affliction-provider.test.js
