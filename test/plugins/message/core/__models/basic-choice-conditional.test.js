//region plugins/message/core/__models/basic-choice-conditional.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import BasicChoiceConditional
  from '../../../../../src/plugins/message/core/__models/BasicChoiceConditional.js';

/**
 * A conditional decides whether a single choice appears in a message window, so every one of these
 * branches is the difference between an option the player can see and one they cannot. The pairs
 * below matter more than they look: each type has an id to match against, and with only the
 * matching id ever supplied, "this is the right actor" and "there is an actor at all" are the same
 * program - a conditional that had degraded into the second would show every party-gated choice to
 * everybody.
 */
describe('J-Messages BasicChoiceConditional (direct src import)', () =>
{
  /**
   * Installs a party whose leader is the given actor id, or no leader at all.
   * @param {number|null} leaderActorId The actor id leading the party, or null for an empty party.
   */
  function installPartyLedBy(leaderActorId)
  {
    globalThis.$gameParty = {
      leader: () => (leaderActorId === null)
        ? null
        : { actorId: () => leaderActorId },
    };
  }

  beforeEach(() =>
  {
    installPartyLedBy(1);

    globalThis.$gameSwitches = {
      _values: {},
      value(switchId)
      {
        return this._values[ switchId ] === true;
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.$gameParty;
    delete globalThis.$gameSwitches;
  });

  //region leader conditionals
  describe('the leader conditional', () =>
  {
    it('is met when the named actor is leading the party', () =>
    {
      // Arrange
      installPartyLedBy(4);
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.Leader, 4);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(true);
    });

    it('is not met when a different actor is leading the party', () =>
    {
      // Arrange: there is a leader, just not this one - which is the case that separates matching
      // the named actor from merely having somebody in front.
      installPartyLedBy(9);
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.Leader, 4);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(false);
    });

    it('is not met when the party has no leader at all', () =>
    {
      // Arrange: an empty party is reachable between a wipe and a game over, and asking a null
      // leader for its actor id would throw rather than answer.
      installPartyLedBy(null);
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.Leader, 4);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBeFalsy();
    });
  });

  describe('the not-leader conditional', () =>
  {
    it('is met when somebody other than the named actor is leading', () =>
    {
      // Arrange
      installPartyLedBy(9);
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.NotLeader, 4);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(true);
    });

    it('is not met when the named actor is the one leading', () =>
    {
      // Arrange
      installPartyLedBy(4);
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.NotLeader, 4);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(false);
    });

    it('is not met when the party has no leader at all', () =>
    {
      // Arrange: with nobody leading, "somebody other than this actor leads" has no one to be
      // true of - the absence is not the same as a mismatch.
      installPartyLedBy(null);
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.NotLeader, 4);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBeFalsy();
    });
  });
  //endregion leader conditionals

  //region switch conditionals
  describe('the switch-on conditional', () =>
  {
    it('is met when the named switch is on', () =>
    {
      // Arrange
      globalThis.$gameSwitches._values[ 12 ] = true;
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.SwitchOn, 12);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(true);
    });

    it('is not met when the named switch is off', () =>
    {
      // Arrange
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.SwitchOn, 12);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(false);
    });

    it('reads the switch it was given rather than any switch that happens to be on', () =>
    {
      // Arrange: a neighbouring switch is on and the named one is not, so a conditional that had
      // stopped honouring its own id would answer true here.
      globalThis.$gameSwitches._values[ 13 ] = true;
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.SwitchOn, 12);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(false);
    });
  });

  describe('the switch-off conditional', () =>
  {
    it('is met when the named switch is off', () =>
    {
      // Arrange
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.SwitchOff, 12);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(true);
    });

    it('is not met when the named switch is on', () =>
    {
      // Arrange: this is the case that keeps the switch-off arm distinguishable from the fall
      // through at the bottom, which answers true for anything it does not recognise.
      globalThis.$gameSwitches._values[ 12 ] = true;
      const conditional = new BasicChoiceConditional(BasicChoiceConditional.Types.SwitchOff, 12);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(false);
    });
  });
  //endregion switch conditionals

  describe('an unrecognised conditional type', () =>
  {
    it('is met, so an unknown condition never hides a choice', () =>
    {
      // Arrange: failing open is deliberate - a typo in a conditional should leave the option
      // visible rather than silently removing it from a conversation with no trace.
      const conditional = new BasicChoiceConditional('not-a-real-type', 4);

      // Act
      const met = conditional.isMet();

      // Assert
      expect(met).toBe(true);
    });
  });
});
//endregion plugins/message/core/__models/basic-choice-conditional.test.js
