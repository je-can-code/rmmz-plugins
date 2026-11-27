//region plugins/abs/ext/food/models/jabs-state.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The state that is expiring, a food chain's phase in some tests and not in others.
 * @type {number}
 */
const EXPIRING_STATE_ID = 251;

/**
 * The next phase the expiring state names.
 * @type {number}
 */
const NEXT_STATE_ID = 252;

describe('J-ABS-Food JABS_State (unit, all downstream dependencies mocked)', () =>
{
  /**
   * J-ABS's own landing count, standing in for the shared roll the alias defers to.
   * @type {import('vitest').Mock}
   */
  let originalResolveExpiryLandingCount;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { Aliased: { JABS_State: new Map() } } } } };

    function JABS_State()
    {
    }

    originalResolveExpiryLandingCount = vi.fn();
    JABS_State.prototype.resolveExpiryLandingCount = originalResolveExpiryLandingCount;
    globalThis.JABS_State = JABS_State;

    await import('../../../../../../src/plugins/abs/ext/food/models/JABS_State.js');
  });

  beforeEach(() =>
  {
    // the roll J-ABS would make answers with a count no food chain link ever lands, so either answer is unmistakable.
    originalResolveExpiryLandingCount.mockReset();
    originalResolveExpiryLandingCount.mockReturnValue(7);
  });

  /**
   * Builds a tracked expiring state whose bearer sees it carrying the given food chain type. Everything else answers
   * the other way- the source's view of the expiring state, and the bearer's view of any other state- so reading the
   * state through the wrong battler, or reading the wrong state, shows.
   * @param {string|null} bearerChainType The food chain type the bearer's view of the expiring state carries, if any.
   * @returns {object}
   */
  function buildTrackedState(bearerChainType)
  {
    const otherChainType = bearerChainType === null
      ? 'protein'
      : null;

    /**
     * Builds one battler's view of a state, carrying the given food chain type.
     * @param {number} stateId The id of the state being viewed.
     * @param {string|null} chainType The food chain type the view carries, if any.
     * @returns {object}
     */
    const view = (stateId, chainType) => ({ id: stateId, jabsFoodChainType: chainType });

    const jabsState = Object.create(globalThis.JABS_State.prototype);
    jabsState.stateId = EXPIRING_STATE_ID;
    jabsState.battler = {
      state: stateId => view(stateId, stateId === EXPIRING_STATE_ID ? bearerChainType : otherChainType),
    };
    jabsState.source = { state: stateId => view(stateId, otherChainType) };

    return jabsState;
  }

  describe('resolveExpiryLandingCount', () =>
  {
    it('lands a food chain link\'s next phase exactly once, without ever consulting the roll', () =>
    {
      // Arrange
      const jabsState = buildTrackedState('protein');

      // Act
      const landingCount = jabsState.resolveExpiryLandingCount(NEXT_STATE_ID, 40);

      // Assert
      expect(landingCount).toBe(1);
      expect(originalResolveExpiryLandingCount).not.toHaveBeenCalled();
    });

    it('leaves any other state\'s follow-up to the roll J-ABS makes, with the same follow-up and chance', () =>
    {
      // Arrange
      const jabsState = buildTrackedState(null);

      // Act
      const landingCount = jabsState.resolveExpiryLandingCount(NEXT_STATE_ID, 40);

      // Assert
      expect(landingCount).toBe(7);
      expect(originalResolveExpiryLandingCount).toHaveBeenCalledWith(NEXT_STATE_ID, 40);
    });
  });

  describe('isFoodChainLink', () =>
  {
    it('is true for a state its bearer sees carrying a food chain type', () =>
    {
      // Arrange- the source sees no food chain type on the state, so reading the source's view shows.
      const jabsState = buildTrackedState('protein');

      // Act
      const isLink = jabsState.isFoodChainLink();

      // Assert
      expect(isLink).toBe(true);
    });

    it('is false for a state its bearer sees carrying no food chain type', () =>
    {
      // Arrange- the source sees a food chain type on the state, so reading the source's view shows.
      const jabsState = buildTrackedState(null);

      // Act
      const isLink = jabsState.isFoodChainLink();

      // Assert
      expect(isLink).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/food/models/jabs-state.test.js