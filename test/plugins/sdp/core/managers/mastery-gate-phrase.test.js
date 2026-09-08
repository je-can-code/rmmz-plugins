//region plugins/sdp/core/managers/mastery-gate-phrase.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * A gate is frequently the identity of a strip rather than a footnote, so the phrase has to name the
 * condition rather than a bare number. Each kind is pinned against a sibling of the same family, so a
 * lookup that ignored the kind would not survive.
 */
describe('MasteryGatePhrase (direct src import)', () =>
{
  let MasteryGatePhrase;

  const skillWithNote = (note) => ({ note });

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', { value: '', configurable: true });

    ({ default: MasteryGatePhrase } = await import(
      '../../../../../src/plugins/sdp/core/managers/MasteryGatePhrase.js'));
  });

  //region phraseFor
  describe('phraseFor', () =>
  {
    it('phrases a below-threshold gate with its resource', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[hpBelow, 20]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('below 20% Life');
    });

    it('phrases an above-threshold gate in the other direction', () =>
    {
      // Arrange: the near-miss sibling, differing only in direction.
      const skill = skillWithNote('<passiveSourceRule:[hpAbove, 75]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('above 75% Life');
    });

    it('names the resource the gate actually reads', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[mpBelow, 30]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('below 30% Magi');
    });

    it('phrases an elapsed-time gate in seconds', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[sinceLastMoved, 180]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('3 seconds');
    });

    it('phrases a recent-event gate in seconds too', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[attackedWithin, 90]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('1.5 seconds');
    });

    it('phrases a cooldown gate as a readiness condition', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[allOffCooldown]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('every skill ready');
    });

    it('phrases an ally gate by its distance', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[alliesNearby, 1, 6]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('6 tiles');
    });

    it('falls back to a vague reach when the ally gate names no distance', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[alliesNearby, 1]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBe('nearby');
    });

    it('answers null for a skill carrying no gate at all', () =>
    {
      // Arrange
      const skill = skillWithNote('<passive:[1234]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBeNull();
    });

    it('answers null for a gate kind it has no words for', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[slotOnCooldown, 1]>');

      // Act
      const result = MasteryGatePhrase.phraseFor(skill);

      // Assert
      expect(result).toBeNull();
    });
  });
  //endregion phraseFor

  //region colorKindFor
  describe('colorKindFor', () =>
  {
    it('calls an elapsed-time gate a measure', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[sinceLastMoved, 180]>');

      // Act
      const result = MasteryGatePhrase.colorKindFor(skill);

      // Assert
      expect(result).toBe('measure');
    });

    it('calls a recent-event gate a measure too', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[attackedWithin, 90]>');

      // Act
      const result = MasteryGatePhrase.colorKindFor(skill);

      // Assert
      expect(result).toBe('measure');
    });

    it('calls an ally-distance gate a measure', () =>
    {
      // Arrange
      const skill = skillWithNote('<passiveSourceRule:[alliesNearby, 1, 6]>');

      // Act
      const result = MasteryGatePhrase.colorKindFor(skill);

      // Assert
      expect(result).toBe('measure');
    });

    it('calls a resource threshold a stat', () =>
    {
      // Arrange: the near-miss sibling, a gate that reads as a percentage rather than a distance.
      const skill = skillWithNote('<passiveSourceRule:[hpBelow, 20]>');

      // Act
      const result = MasteryGatePhrase.colorKindFor(skill);

      // Assert
      expect(result).toBe('stat');
    });

    it('calls a skill carrying no gate a stat', () =>
    {
      // Arrange
      const skill = skillWithNote('<passive:[1234]>');

      // Act
      const result = MasteryGatePhrase.colorKindFor(skill);

      // Assert
      expect(result).toBe('stat');
    });
  });
  //endregion colorKindFor

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new MasteryGatePhrase()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/sdp/core/managers/mastery-gate-phrase.test.js