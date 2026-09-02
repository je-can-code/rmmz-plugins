//region plugins/escribe/core/_models/escription.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The one thing an event declares floating above itself.
 *
 * Everything downstream- parsing, the per-frame proximity sweep, sprite construction and the fade-
 * reads its decisions off this model, so a wrong answer here is invisible right up until a label
 * either follows the player around the map or never appears at all.
 */
describe('Escription', () =>
{
  let Escription;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.String.empty = '';

    ({ default: Escription } = await import('../../../../../src/plugins/escribe/core/_models/Escription.js'));
  });

  /**
   * Builds a text escription with the given proximity requirement.
   * @param {number} proximityRange The tiles the player must be within, or ALWAYS_VISIBLE.
   * @returns {Escription}
   */
  const buildText = proximityRange => new Escription(Escription.Kinds.Text, 'a rusty old chest', proximityRange);

  describe('constructor', () =>
  {
    it('holds the kind, content and proximity it was built with', () =>
    {
      // Arrange & Act
      const escription = new Escription(Escription.Kinds.Icon, 208, 4);

      // Assert
      expect(escription.kind()).toBe(Escription.Kinds.Icon);
      expect(escription.content()).toBe(208);
      expect(escription.proximityRange()).toBe(4);
    });

    it('starts with the player assumed absent, so a gated escription is born hidden', () =>
    {
      // Arrange & Act
      const escription = buildText(3);

      // Assert
      expect(escription.isPlayerNearby()).toBe(false);
    });
  });

  describe('hasProximity', () =>
  {
    it('has none when the range sits at the always-visible sentinel', () =>
    {
      // Arrange
      const escription = buildText(Escription.ALWAYS_VISIBLE);

      // Act
      const result = escription.hasProximity();

      // Assert
      expect(result).toBe(false);
    });

    it('has some the moment the range names a real distance', () =>
    {
      // Arrange- zero is a legitimate range meaning "stand on it", and is the boundary that
      // separates a requirement from the -1 that means there is none.
      const escription = buildText(0);

      // Act
      const result = escription.hasProximity();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('setPlayerNearby', () =>
  {
    it('records that the player has arrived', () =>
    {
      // Arrange
      const escription = buildText(3);

      // Act
      escription.setPlayerNearby(true);

      // Assert
      expect(escription.isPlayerNearby()).toBe(true);
    });
  });

  describe('isVisible', () =>
  {
    it('is always visible when there is no proximity to satisfy', () =>
    {
      // Arrange- the player is explicitly recorded as absent, so only the missing requirement can
      // be what makes this visible.
      const escription = buildText(Escription.ALWAYS_VISIBLE);
      escription.setPlayerNearby(false);

      // Act
      const result = escription.isVisible();

      // Assert
      expect(result).toBe(true);
    });

    it('is visible when gated and the player is near', () =>
    {
      // Arrange
      const escription = buildText(3);
      escription.setPlayerNearby(true);

      // Act
      const result = escription.isVisible();

      // Assert
      expect(result).toBe(true);
    });

    it('is hidden when gated and the player is away', () =>
    {
      // Arrange
      const escription = buildText(3);
      escription.setPlayerNearby(false);

      // Act
      const result = escription.isVisible();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('key', () =>
  {
    it('names the kind, the content and the proximity together', () =>
    {
      // Arrange
      const escription = new Escription(Escription.Kinds.Icon, 208, 4);

      // Act
      const result = escription.key();

      // Assert
      expect(result).toBe('icon:208:4');
    });

    it('separates two escriptions that differ only by proximity', () =>
    {
      // Arrange- same kind, same words; only the gating differs, and it decides whether the sprite
      // is built hidden, so the signature has to tell them apart.
      const ungated = buildText(Escription.ALWAYS_VISIBLE);
      const gated = buildText(3);

      // Act
      const results = [ ungated.key(), gated.key() ];

      // Assert
      expect(results).toEqual([ 'text:a rusty old chest:-1', 'text:a rusty old chest:3' ]);
    });
  });
});
//endregion plugins/escribe/core/_models/escription.test.js