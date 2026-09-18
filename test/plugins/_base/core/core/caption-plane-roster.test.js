//region plugins/_base/core/core/caption-plane-roster.test.js
import { describe, expect, it } from 'vitest';
import CaptionPlaneRoster from '../../../../../src/plugins/_base/core/core/CaptionPlaneRoster.js';

/**
 * The two decisions behind the caption plane: who is on it, and who draws over whom.
 *
 * Both are identity questions - "is this particular caption already mine", "is this particular
 * sprite still on the map" - so every fixture below carries a near-miss sibling that has to survive
 * the operation. A roster holding one caption cannot tell "selects the departed one" apart from
 * "selects everything", and that is exactly the bug these functions would have.
 */
describe('CaptionPlaneRoster', () =>
{
  /**
   * Builds a stand-in for a character sprite and the caption that describes it.
   *
   * The pair is mutually linked the way the real ones are, because both halves of a reconcile
   * traverse that link in opposite directions.
   * @param {number} spriteId The identifier distinguishing this pair from its siblings.
   * @returns {{characterSprite: Object, caption: Object}}
   */
  const buildPair = spriteId =>
  {
    const caption = {
      spriteId,
    };
    const characterSprite = {
      spriteId,
      characterOverlay: () => caption,
    };

    caption.characterSprite = () => characterSprite;

    return {
      characterSprite,
      caption,
    };
  };

  describe('reconcile', () =>
  {
    it('admits a caption whose character sprite has no caption on the plane yet', () =>
    {
      // Arrange - two sprites on the map, and only the first one's caption is already rostered.
      const settled = buildPair(1);
      const arriving = buildPair(2);

      // Act.
      const result = CaptionPlaneRoster.reconcile(
        [ settled.characterSprite, arriving.characterSprite ],
        [ settled.caption ]);

      // Assert.
      expect(result.additions)
        .toEqual([ arriving.caption ]);
    });

    it('leaves a caption alone when its character sprite is already on the plane', () =>
    {
      // Arrange - both sprites on the map already have their captions rostered.
      const settled = buildPair(1);
      const alsoSettled = buildPair(2);

      // Act.
      const result = CaptionPlaneRoster.reconcile(
        [ settled.characterSprite, alsoSettled.characterSprite ],
        [ settled.caption, alsoSettled.caption ]);

      // Assert - nothing arrived, and the proof it ran at all is that nothing left either.
      expect(result.additions)
        .toEqual([]);
      expect(result.evictions)
        .toEqual([]);
    });

    it('evicts a caption whose character sprite has left the map', () =>
    {
      // Arrange - two captions rostered, and only one of their sprites is still tracked.
      const staying = buildPair(1);
      const departed = buildPair(2);

      // Act.
      const result = CaptionPlaneRoster.reconcile(
        [ staying.characterSprite ],
        [ staying.caption, departed.caption ]);

      // Assert.
      expect(result.evictions)
        .toEqual([ departed.caption ]);
    });

    it('keeps a caption whose character sprite is still on the map', () =>
    {
      // Arrange - one sprite leaves, so the survivor has a sibling that genuinely does not.
      const staying = buildPair(1);
      const departed = buildPair(2);

      // Act.
      const result = CaptionPlaneRoster.reconcile(
        [ staying.characterSprite ],
        [ staying.caption, departed.caption ]);

      // Assert - the survivor is absent from the evictions the departure produced.
      expect(result.evictions)
        .not
        .toContain(staying.caption);
      expect(result.evictions)
        .toHaveLength(1);
    });

    it('admits and evicts within a single pass', () =>
    {
      // Arrange - one sprite arrives in the same frame another one leaves.
      const staying = buildPair(1);
      const departed = buildPair(2);
      const arriving = buildPair(3);

      // Act.
      const result = CaptionPlaneRoster.reconcile(
        [ staying.characterSprite, arriving.characterSprite ],
        [ staying.caption, departed.caption ]);

      // Assert.
      expect(result.additions)
        .toEqual([ arriving.caption ]);
      expect(result.evictions)
        .toEqual([ departed.caption ]);
    });
  });

  describe('compareCaptionOrder', () =>
  {
    it('puts the lower priority tier first when the tiers differ', () =>
    {
      // Arrange - an upper-tier character sits at z 5, a normal one at z 3, and y disagrees with
      // the answer so a sort that ignored z would order these the other way round.
      const normalTier = {
        z: 3,
        y: 400,
        spriteId: 1,
      };
      const upperTier = {
        z: 5,
        y: 100,
        spriteId: 2,
      };

      // Act.
      const result = CaptionPlaneRoster.compareCaptionOrder(normalTier, upperTier);

      // Assert.
      expect(result)
        .toBe(-2);
    });

    it('puts the higher screen position first when the tiers match', () =>
    {
      // Arrange - same tier, and the farther character is higher up the screen.
      const farther = {
        z: 3,
        y: 100,
        spriteId: 1,
      };
      const nearer = {
        z: 3,
        y: 148,
        spriteId: 2,
      };

      // Act.
      const result = CaptionPlaneRoster.compareCaptionOrder(farther, nearer);

      // Assert - negative, so the farther caption draws before the nearer one covers it.
      expect(result)
        .toBe(-48);
    });

    it('falls back to construction order when tier and screen position both match', () =>
    {
      // Arrange - two characters standing on exactly the same spot in the same tier.
      const older = {
        z: 3,
        y: 240,
        spriteId: 7,
      };
      const newer = {
        z: 3,
        y: 240,
        spriteId: 9,
      };

      // Act.
      const result = CaptionPlaneRoster.compareCaptionOrder(older, newer);

      // Assert.
      expect(result)
        .toBe(-2);
    });
  });
});
//endregion plugins/_base/core/core/caption-plane-roster.test.js