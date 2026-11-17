//region plugins/sdp/core/managers/sdp-blackout-cache.test.js
import { describe, expect, it } from 'vitest';
import SdpBlackoutCache from '../../../../../src/plugins/sdp/core/managers/SdpBlackoutCache.js';

/**
 * The readings live in a static WeakMap keyed by actor, so they carry over from one test to the next within this file.
 * Each test therefore builds its own actors, which no earlier test can have left a reading for.
 */
describe('SdpBlackoutCache', () =>
{
  describe('isCurrentFor()', () =>
  {
    it('has nothing current for an actor never read, even beside one read from the same notes', () =>
    {
      // Arrange: a sibling actor was read from this very list, so a reading looked up by the notes alone would
      // wrongly count as current for an actor never read.
      const notes = [ { note: '<sdpBlackout>' } ];
      SdpBlackoutCache.record({ name: 'sibling' }, notes, true);
      const actor = { name: 'never read' };

      // Act
      const isCurrent = SdpBlackoutCache.isCurrentFor(actor, notes);

      // Assert
      expect(isCurrent).toBe(false);
    });

    it('is current only for the very list the reading was taken from', () =>
    {
      // Arrange: a second list holding an identical note, as J-Base builds after any data change; it is the list's
      // identity that says the notes may have changed, never a comparison of what is in them.
      const actor = { name: 'read once' };
      const readNotes = [ { note: '<sdpBlackout>' } ];
      const newerNotes = [ { note: '<sdpBlackout>' } ];
      SdpBlackoutCache.record(actor, readNotes, true);

      // Act
      const currentForRead = SdpBlackoutCache.isCurrentFor(actor, readNotes);
      const currentForNewer = SdpBlackoutCache.isCurrentFor(actor, newerNotes);

      // Assert
      expect(currentForRead).toBe(true);
      expect(currentForNewer).toBe(false);
    });
  });

  describe('isBlackedOut()', () =>
  {
    it('answers what each actor\'s latest reading found, kept apart from every other actor\'s', () =>
    {
      // Arrange: one actor read twice, the newer reading reversing the older; a sibling read the opposite way.
      const actor = { name: 'read twice' };
      const sibling = { name: 'sibling' };
      const notes = [ { note: '' } ];
      SdpBlackoutCache.record(actor, notes, true);
      SdpBlackoutCache.record(sibling, notes, true);
      SdpBlackoutCache.record(actor, notes, false);

      // Act
      const actorResult = SdpBlackoutCache.isBlackedOut(actor);
      const siblingResult = SdpBlackoutCache.isBlackedOut(sibling);

      // Assert
      expect(actorResult).toBe(false);
      expect(siblingResult).toBe(true);
    });
  });
});
//endregion plugins/sdp/core/managers/sdp-blackout-cache.test.js