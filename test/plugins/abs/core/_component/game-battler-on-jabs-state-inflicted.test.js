//region plugins/abs/core/_component/game-battler-on-jabs-state-inflicted.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal battler stub exposing only what {@link Game_Battler#handleAddingJabsState}
 * touches, so the hook can be exercised without a full JABS_State/JABS_Engine pipeline.
 * @returns {object}
 */
function buildMinimalBattler()
{
  const battler = {
    isStateAddable: () => true,
    isStateAffected: () => false,
    addNewState: vi.fn(),
    refresh: vi.fn(),
    resetStateCounts: vi.fn(),
    addJabsState: vi.fn(),
    onJabsStateInflicted: vi.fn(),
    cancelLinedUpActionIfForbidden: vi.fn(),
    flagSkillSlotsForRefresh: vi.fn(),
    _result: { pushAddedState: vi.fn() },
  };

  // vanilla Game_Battler accessor the production code reads its action result through.
  battler.result = () => battler._result;

  // bind the real handleAddingJabsState implementation onto this plain mock object.
  battler.handleAddingJabsState = globalThis.Game_Battler.prototype.handleAddingJabsState;

  return battler;
}

describe('J-ABS Game_Battler#onJabsStateInflicted (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js').default} */
  let JABS_AiManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // the same module instance Game_Battler imported, so its lookup can be answered for a test.
    ({ default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
  });

  it('fires onJabsStateInflicted with the state id and attacker after tracking is settled', () =>
  {
    // Arrange
    const battler = buildMinimalBattler();
    const attacker = { name: 'attacker' };

    // Act
    battler.handleAddingJabsState(14, attacker);

    // Assert- fired after JABS tracking is registered, not before.
    expect(battler.onJabsStateInflicted).toHaveBeenCalledWith(14, attacker);
    const [ inflictedOrder ] = battler.onJabsStateInflicted.mock.invocationCallOrder;
    const [ trackedOrder ] = battler.addJabsState.mock.invocationCallOrder;
    expect(inflictedOrder).toBeGreaterThan(trackedOrder);
  });

  it('fires again on reapplication, unlike a first-application-only hook', () =>
  {
    // Arrange- simulate the state already being affected (a reapplication, not a first application).
    const battler = buildMinimalBattler();
    battler.isStateAffected = () => true;
    const attacker = { name: 'attacker' };

    // Act
    battler.handleAddingJabsState(14, attacker);
    battler.handleAddingJabsState(14, attacker);

    // Assert- addNewState is only for first applications; reapplication should skip it entirely.
    expect(battler.onJabsStateInflicted).toHaveBeenCalledTimes(2);
    expect(battler.addNewState).not.toHaveBeenCalled();
  });

  it('registers a first-time application with vanilla tracking before handing off to JABS', () =>
  {
    // Arrange- isStateAffected is false, which is what makes this a first application rather
    // than the reapplication covered above.
    const battler = buildMinimalBattler();
    const attacker = { name: 'attacker' };

    // Act
    battler.handleAddingJabsState(14, attacker);

    // Assert- vanilla's own bookkeeping has to run for a state it has never seen, and the
    // battler has to be refreshed so the new state's traits take effect.
    expect(battler.addNewState).toHaveBeenCalledWith(14, attacker);
    expect(battler.refresh).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the state is not addable', () =>
  {
    // Arrange
    const battler = buildMinimalBattler();
    battler.isStateAddable = () => false;

    // Act
    battler.handleAddingJabsState(14, { name: 'attacker' });

    // Assert
    expect(battler.onJabsStateInflicted).not.toHaveBeenCalled();
  });

  it('the default hook itself is a no-op extension point', () =>
  {
    // Arrange
    const battler = Object.create(globalThis.Game_Battler.prototype);

    // Act & Assert
    expect(() => battler.onJabsStateInflicted(14, { name: 'attacker' })).not.toThrow();
  });

  it('asks whether the state forbids what the battler lined up once its tracking is settled', () =>
  {
    // Arrange
    const battler = buildMinimalBattler();

    // Act
    battler.handleAddingJabsState(14, { name: 'attacker' });

    // Assert- asked about the state just added, after JABS started tracking it.
    expect(battler.cancelLinedUpActionIfForbidden).toHaveBeenCalledWith(14);
    const [ askedOrder ] = battler.cancelLinedUpActionIfForbidden.mock.invocationCallOrder;
    const [ trackedOrder ] = battler.addJabsState.mock.invocationCallOrder;
    expect(askedOrder).toBeGreaterThan(trackedOrder);
  });

  describe('cancelLinedUpActionIfForbidden', () =>
  {
    // the states the battler below sees: 30 paralyzes, 31 only roots, 32 mutes and 33 disables.
    const STATES = {
      30: { jabsParalyzed: true, jabsRooted: false, jabsMuted: false, jabsDisarmed: false },
      31: { jabsParalyzed: false, jabsRooted: true, jabsMuted: false, jabsDisarmed: false },
      32: { jabsParalyzed: false, jabsRooted: false, jabsMuted: true, jabsDisarmed: false },
      33: { jabsParalyzed: false, jabsRooted: false, jabsMuted: false, jabsDisarmed: true },
    };

    /**
     * Builds a battler that sees the states above, and whose map presence is told.
     * @param {object|null} jabsBattler The map presence the lookup answers with.
     * @returns {{ battler: object, lookup: Function }}
     */
    function buildHeldBattler(jabsBattler)
    {
      const battler = Object.create(globalThis.Game_Battler.prototype);
      battler.getUuid = () => 'held-uuid';
      battler.state = stateId => STATES[stateId];
      const lookup = vi.fn(uuid => (uuid === 'held-uuid' ? jabsBattler : null));
      return { battler, lookup };
    }

    /**
     * Builds a map presence with something lined up, answering whether the given state forbids its windup as told.
     * @param {boolean} forbidden What it answers about its windup.
     * @returns {object}
     */
    function buildPresence(forbidden)
    {
      return { cancelLinedUpAction: vi.fn(), hasForbiddenWindupLinedUp: vi.fn(() => forbidden) };
    }

    /**
     * Runs the given act with the battler lookup answering through the given stand-in, restoring it afterwards.
     * @param {Function} lookup The stand-in lookup.
     * @param {Function} act The act to run.
     */
    function withLookup(lookup, act)
    {
      const original = JABS_AiManager.getBattlerByUuid;
      JABS_AiManager.getBattlerByUuid = lookup;
      try
      {
        act();
      }
      finally
      {
        JABS_AiManager.getBattlerByUuid = original;
      }
    }

    it('cancels whatever a battler on the map had lined up when the state paralyzes it, windup or not', () =>
    {
      // Arrange- nothing lined up would count as a forbidden windup, so only the paralysis can cancel.
      const jabsBattler = buildPresence(false);
      const { battler, lookup } = buildHeldBattler(jabsBattler);

      // Act
      withLookup(lookup, () => battler.cancelLinedUpActionIfForbidden(30));

      // Assert
      expect(lookup).toHaveBeenCalledWith('held-uuid');
      expect(jabsBattler.cancelLinedUpAction).toHaveBeenCalledTimes(1);
    });

    it('cancels a windup the state forbids when the state mutes or disables', () =>
    {
      // Arrange
      const jabsBattler = buildPresence(true);
      const { battler, lookup } = buildHeldBattler(jabsBattler);

      // Act
      withLookup(lookup, () => battler.cancelLinedUpActionIfForbidden(32));

      // Assert- the windup was judged against the muting state itself.
      expect(jabsBattler.hasForbiddenWindupLinedUp).toHaveBeenCalledWith(STATES[32]);
      expect(jabsBattler.cancelLinedUpAction).toHaveBeenCalledTimes(1);
    });

    it('leaves alone what the state does not forbid when it mutes or disables', () =>
    {
      // Arrange
      const jabsBattler = buildPresence(false);
      const { battler, lookup } = buildHeldBattler(jabsBattler);

      // Act
      withLookup(lookup, () => battler.cancelLinedUpActionIfForbidden(33));

      // Assert- it asked, and nothing was cancelled.
      expect(jabsBattler.hasForbiddenWindupLinedUp).toHaveBeenCalledWith(STATES[33]);
      expect(jabsBattler.cancelLinedUpAction).not.toHaveBeenCalled();
    });

    it('leaves a battler alone when the state only roots it', () =>
    {
      // Arrange- the battler is on the map and would call anything forbidden, so only the state can keep it from
      // cancelling.
      const jabsBattler = buildPresence(true);
      const { battler, lookup } = buildHeldBattler(jabsBattler);

      // Act
      withLookup(lookup, () => battler.cancelLinedUpActionIfForbidden(31));

      // Assert
      expect(lookup).not.toHaveBeenCalled();
      expect(jabsBattler.cancelLinedUpAction).not.toHaveBeenCalled();
    });

    it('does nothing for a paralyzed battler with no presence on the map', () =>
    {
      // Arrange
      const { battler, lookup } = buildHeldBattler(null);

      // Act
      withLookup(lookup, () => battler.cancelLinedUpActionIfForbidden(30));

      // Assert- it looked for the battler on the map and found nothing to cancel.
      expect(lookup).toHaveBeenCalledWith('held-uuid');
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-on-jabs-state-inflicted.test.js
