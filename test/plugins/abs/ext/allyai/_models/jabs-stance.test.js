//region plugins/abs/ext/allyai/_models/jabs-stance.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-AllyAI JABS_Stance (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_Stance;

  beforeAll(async () =>
  {
    String.empty = '';
    ({ default: JABS_Stance } = await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_Stance.js'));
  });

  /**
   * Builds a stance with the given placement and nothing else of interest.
   * @param {string} placement One of the stance placements.
   * @returns {object}
   */
  const buildStance = placement => new JABS_Stance('key', 'Name', 'Description', placement, false);

  it('assigns key, name, description, placement and whether it goes in first from the constructor', () =>
  {
    // Arrange & Act
    const stance = new JABS_Stance('meat-shield', 'Meat Shield', 'Goes first.', 'front', true);

    // Assert
    expect(stance.key).toBe('meat-shield');
    expect(stance.name).toBe('Meat Shield');
    expect(stance.description).toBe('Goes first.');
    expect(stance.placement).toBe('front');
    expect(stance.engagesFirst).toBe(true);
  });

  describe('laneFor', () =>
  {
    it('keeps the first ally in the middle lane', () =>
    {
      // Arrange & Act & Assert
      expect(JABS_Stance.laneFor(0)).toBe(0);
    });

    it('sends the second ally one lane to the negative side', () =>
    {
      // Arrange & Act & Assert
      expect(JABS_Stance.laneFor(1)).toBe(-1);
    });

    it('sends the third ally one lane to the positive side', () =>
    {
      // Arrange & Act & Assert
      expect(JABS_Stance.laneFor(2)).toBe(1);
    });

    it('sends the fourth ally two lanes out to the negative side', () =>
    {
      // Arrange & Act & Assert
      expect(JABS_Stance.laneFor(3)).toBe(-2);
    });
  });

  describe('clampToRange', () =>
  {
    it('raises a value below the range to its lowest point', () =>
    {
      // Arrange & Act & Assert
      expect(JABS_Stance.clampToRange(-5, 1, 3)).toBe(1);
    });

    it('lowers a value above the range to its highest point', () =>
    {
      // Arrange & Act & Assert
      expect(JABS_Stance.clampToRange(7, 1, 3)).toBe(3);
    });

    it('leaves a value inside the range alone', () =>
    {
      // Arrange & Act & Assert
      expect(JABS_Stance.clampToRange(2.5, 1, 3)).toBe(2.5);
    });
  });

  describe('nearestSpot', () =>
  {
    it('brings an ally behind the leader forward to the nearest point in front', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Front);

      // Act - an ally two tiles behind and drifted to the side, in the second lane.
      const spot = stance.nearestSpot(0.7, -2, -1, 0);

      // Assert - one tile in front, in its own lane.
      expect(spot).toEqual([ -1, 1 ]);
    });

    it('leaves an ally already in front of the leader where it stands along the path', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Front);

      // Act
      const spot = stance.nearestSpot(0.2, 2.4, 0, 0);

      // Assert
      expect(spot).toEqual([ 0, 2.4 ]);
    });

    it('brings an ally in front of the leader back to the nearest point behind them', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Behind);

      // Act
      const spot = stance.nearestSpot(0, 2, 1, 0);

      // Assert - one tile behind, in its own lane.
      expect(spot).toEqual([ 1, -1 ]);
    });

    it('brings an ally far behind the leader up to three tiles back', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Behind);

      // Act
      const spot = stance.nearestSpot(0, -6, 0, 0);

      // Assert
      expect(spot).toEqual([ 0, -3 ]);
    });

    it('keeps an ally beside the leader on the negative side when it stands there', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Side);

      // Act
      const spot = stance.nearestSpot(-3, 0.5, 0, 0);

      // Assert
      expect(spot).toEqual([ -1, 0.5 ]);
    });

    it('keeps an ally beside the leader on the positive side when it stands there', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Side);

      // Act
      const spot = stance.nearestSpot(2, -0.5, 0, 0);

      // Assert
      expect(spot).toEqual([ 1, -0.5 ]);
    });

    it('sends an ally standing exactly in line with the leader to the positive side', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Side);

      // Act
      const spot = stance.nearestSpot(0, 0, 0, 0);

      // Assert
      expect(spot).toEqual([ 1, 0 ]);
    });

    it('slides an ally beside the leader along its lane rather than further out', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Side);

      // Act - an ally in the third lane, far ahead.
      const spot = stance.nearestSpot(1, 9, 1, 0);

      // Assert - the third lane's slack reaches two tiles ahead, still one tile out to the side.
      expect(spot).toEqual([ 1, 2 ]);
    });
  });

  describe('nearestSpot, pulled inside the zone by an inset', () =>
  {
    it('pulls a spot in front of the leader past the near edge', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Front);

      // Act - an ally behind the leader, with a half-tile inset.
      const spot = stance.nearestSpot(0, -2, 0, 0.5);

      // Assert - a tile and a half in front, so stopping half a tile short still leaves a tile between them.
      expect(spot).toEqual([ 0, 1.5 ]);
    });

    it('pulls a spot in front of the leader back from the far edge', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Front);

      // Act
      const spot = stance.nearestSpot(0, 9, 0, 0.5);

      // Assert
      expect(spot).toEqual([ 0, 2.5 ]);
    });

    it('pulls a spot behind the leader past the near edge', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Behind);

      // Act
      const spot = stance.nearestSpot(0, 2, 0, 0.5);

      // Assert
      expect(spot).toEqual([ 0, -1.5 ]);
    });

    it('pulls a spot behind the leader back from the far edge', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Behind);

      // Act
      const spot = stance.nearestSpot(0, -9, 0, 0.5);

      // Assert
      expect(spot).toEqual([ 0, -2.5 ]);
    });

    it('stands a spot at the leader\'s side further out, and less far along', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Side);

      // Act - an ally on the negative side, well ahead of the leader.
      const spot = stance.nearestSpot(-0.2, 3, 0, 0.5);

      // Assert - a tile and a half out, and no more than half a tile ahead.
      expect(spot).toEqual([ -1.5, 0.5 ]);
    });

    it('leaves an ally comfortably inside the zone where it stands', () =>
    {
      // Arrange
      const stance = buildStance(JABS_Stance.Placements.Front);

      // Act
      const spot = stance.nearestSpot(0, 2, 0, 0.5);

      // Assert
      expect(spot).toEqual([ 0, 2 ]);
    });
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-stance.test.js
