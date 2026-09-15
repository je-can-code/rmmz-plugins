//region plugins/abs/ext/juice/managers/juice-held-overlay-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JuiceHeldOverlayManager.js is a static class over a WeakMap of held-overlay requests. The two
 * collaborators that touch sprites — JuiceWeaponSwingOverlay and JuiceMotionManager — are mocked
 * per the "unit tier mocks all downstream file-external dependencies" convention, so what is under
 * test here is purely the bookkeeping: who is holding what, when it needs rebuilding, and what
 * comes down before what goes up. JuiceHeldOverlay is a dependency-free value object and is
 * imported for real.
 */
describe('JuiceHeldOverlayManager (unit, sprite collaborators mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHeldOverlayManager.js').default} */
  let JuiceHeldOverlayManager;

  /** @type {import('vitest').Mock} */
  const playPreset = vi.fn();

  /** @type {import('vitest').Mock} */
  const discardEffect = vi.fn();

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.String.empty ??= '';

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceWeaponSwingOverlay.js', () => ({
      default: { playPreset },
    }));
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: { discardEffect },
    }));

    ({ default: JuiceHeldOverlayManager } =
      await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHeldOverlayManager.js'));
  });

  beforeEach(() =>
  {
    playPreset.mockReset();
    discardEffect.mockReset();
  });

  /**
   * Builds a fake character facing a given direction.
   * @param {number} [direction] The facing to report.
   * @returns {object} A fake character.
   */
  function buildCharacter(direction = 2)
  {
    return { direction: () => direction };
  }

  /**
   * Builds a fake sprite bound to a character.
   * @param {object} character The character the sprite draws.
   * @returns {object} A fake sprite.
   */
  function buildSprite(character)
  {
    return { character: () => character };
  }

  /**
   * Builds a fake effect that reports a given parent sprite.
   * @param {object} parentSprite The sprite the effect is drawn on.
   * @returns {object} A fake effect.
   */
  function buildEffect(parentSprite)
  {
    return {
      parentSprite: () => parentSprite,
      flagHeld: vi.fn(),
      durationFrames: () => 20,
      setFrame: vi.fn(),
    };
  }

  /**
   * Declares a held overlay with sane, overridable arguments.
   * @param {object} character The character to hold the icon up.
   * @param {object} [overrides] Named overrides.
   */
  function declareOverlay(character, overrides = {})
  {
    JuiceHeldOverlayManager.declare(
      character,
      overrides.sourceKey ?? 'command',
      overrides.iconIndex ?? 195,
      overrides.motionType ?? 'present',
      overrides.durationFrames ?? 20,
      overrides.repeatCount ?? 1,
      overrides.arcSpanDegrees ?? 120
    );
  }

  describe('materializeFor()', () =>
  {
    it('does nothing for a character holding nothing', () =>
    {
      // Arrange
      const sprite = buildSprite(buildCharacter());

      // Act
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(playPreset).not.toHaveBeenCalled();
    });

    it('builds the overlay for a character holding one', () =>
    {
      // Arrange
      const character = buildCharacter(4);
      const sprite = buildSprite(character);
      declareOverlay(character, { iconIndex: 87, motionType: 'spin', durationFrames: 30, repeatCount: 2 });
      playPreset.mockReturnValue(buildEffect(sprite));

      // Act
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(playPreset).toHaveBeenCalledWith(sprite, 87, 'spin', 30, 2, 120, 4);
    });

    it('flags the overlay it builds as held', () =>
    {
      // Arrange: an overlay that is not flagged tears itself down the moment it stops moving.
      const character = buildCharacter();
      const sprite = buildSprite(character);
      const effect = buildEffect(sprite);
      declareOverlay(character);
      playPreset.mockReturnValue(effect);

      // Act
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(effect.flagHeld).toHaveBeenCalledTimes(1);
    });

    it('leaves an overlay alone that is already drawn on this sprite at this facing', () =>
    {
      // Arrange
      const character = buildCharacter();
      const sprite = buildSprite(character);
      declareOverlay(character);
      playPreset.mockReturnValue(buildEffect(sprite));
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Act
      JuiceHeldOverlayManager.materializeFor(sprite);
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(playPreset).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the overlay onto a replacement sprite', () =>
    {
      // Arrange: what a rebuilt map scene looks like from here - same character, new sprite.
      const character = buildCharacter();
      const oldSprite = buildSprite(character);
      const newSprite = buildSprite(character);
      declareOverlay(character);
      playPreset.mockReturnValue(buildEffect(oldSprite));
      JuiceHeldOverlayManager.materializeFor(oldSprite);
      playPreset.mockReturnValue(buildEffect(newSprite));

      // Act
      JuiceHeldOverlayManager.materializeFor(newSprite);

      // Assert
      expect(playPreset).toHaveBeenCalledTimes(2);
      const [ , secondCall ] = playPreset.mock.calls;
      expect(secondCall.at(0)).toBe(newSprite);
    });

    it('rebuilds an aimed overlay when the character turns under it', () =>
    {
      // Arrange: the geometry is resolved at spawn, so a turn is the one thing that invalidates it.
      let facing = 2;
      const character = { direction: () => facing };
      const sprite = buildSprite(character);
      declareOverlay(character, { motionType: 'stab-forward' });
      playPreset.mockReturnValue(buildEffect(sprite));
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Act
      facing = 6;
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(playPreset).toHaveBeenCalledTimes(2);
      const [ , secondCall ] = playPreset.mock.calls;
      expect(secondCall.at(6)).toEqual(6);
    });

    it('leaves a facing-agnostic overlay alone when the character turns under it', () =>
    {
      // Arrange: rebuilding a present would restart its ease, dropping the raised icon on a turn.
      let facing = 2;
      const character = { direction: () => facing };
      const sprite = buildSprite(character);
      declareOverlay(character, { motionType: 'present' });
      playPreset.mockReturnValue(buildEffect(sprite));
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Act
      facing = 6;
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(playPreset).toHaveBeenCalledTimes(1);
    });

    it('plays the raise the first time an overlay is drawn', () =>
    {
      // Arrange
      const character = buildCharacter();
      const sprite = buildSprite(character);
      const effect = buildEffect(sprite);
      declareOverlay(character);
      playPreset.mockReturnValue(effect);

      // Act
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(effect.setFrame).not.toHaveBeenCalled();
    });

    it('starts a rebuilt overlay already parked at its final pose', () =>
    {
      // Arrange: closing the menu rebuilds the spriteset, and replaying the raise would look like
      // the character dropping the icon and lifting it again for no reason.
      const character = buildCharacter();
      const oldSprite = buildSprite(character);
      const newSprite = buildSprite(character);
      declareOverlay(character);
      playPreset.mockReturnValue(buildEffect(oldSprite));
      JuiceHeldOverlayManager.materializeFor(oldSprite);
      const rebuilt = buildEffect(newSprite);
      playPreset.mockReturnValue(rebuilt);

      // Act
      JuiceHeldOverlayManager.materializeFor(newSprite);

      // Assert
      expect(rebuilt.setFrame).toHaveBeenCalledWith(20);
    });

    it('discards the outgoing effect before building its replacement', () =>
    {
      // Arrange
      const character = buildCharacter();
      const oldSprite = buildSprite(character);
      const newSprite = buildSprite(character);
      const stale = buildEffect(oldSprite);
      declareOverlay(character);
      playPreset.mockReturnValue(stale);
      JuiceHeldOverlayManager.materializeFor(oldSprite);
      playPreset.mockReturnValue(buildEffect(newSprite));

      // Act
      JuiceHeldOverlayManager.materializeFor(newSprite);

      // Assert
      expect(discardEffect).toHaveBeenCalledWith(stale);
    });

    it('builds every overlay a character is holding, not merely the first', () =>
    {
      // Arrange: two sources holding two icons is the case a single-entry store would fail.
      const character = buildCharacter();
      const sprite = buildSprite(character);
      declareOverlay(character, { sourceKey: 'command', iconIndex: 11 });
      declareOverlay(character, { sourceKey: 'cutscene', iconIndex: 22 });
      playPreset.mockReturnValue(buildEffect(sprite));

      // Act
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(playPreset).toHaveBeenCalledTimes(2);
      const icons = playPreset.mock.calls.map(call => call.at(1));
      expect(icons).toEqual([ 11, 22 ]);
    });
  });

  describe('declare()', () =>
  {
    it('replaces what a source was already holding rather than stacking', () =>
    {
      // Arrange
      const character = buildCharacter();
      const sprite = buildSprite(character);
      declareOverlay(character, { iconIndex: 11 });
      playPreset.mockReturnValue(buildEffect(sprite));
      JuiceHeldOverlayManager.materializeFor(sprite);
      playPreset.mockClear();

      // Act
      declareOverlay(character, { iconIndex: 22 });
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      expect(playPreset).toHaveBeenCalledTimes(1);
      const [ firstCall ] = playPreset.mock.calls;
      expect(firstCall.at(1)).toEqual(22);
    });

    it('takes down the live effect of what it replaces', () =>
    {
      // Arrange
      const character = buildCharacter();
      const sprite = buildSprite(character);
      const stale = buildEffect(sprite);
      declareOverlay(character, { iconIndex: 11 });
      playPreset.mockReturnValue(stale);
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Act
      declareOverlay(character, { iconIndex: 22 });

      // Assert
      expect(discardEffect).toHaveBeenCalledWith(stale);
    });

    it('leaves another source on the same character alone', () =>
    {
      // Arrange
      const character = buildCharacter();
      const sprite = buildSprite(character);
      declareOverlay(character, { sourceKey: 'cutscene', iconIndex: 11 });
      declareOverlay(character, { sourceKey: 'command', iconIndex: 22 });
      playPreset.mockReturnValue(buildEffect(sprite));

      // Act
      declareOverlay(character, { sourceKey: 'command', iconIndex: 33 });
      JuiceHeldOverlayManager.materializeFor(sprite);

      // Assert
      const icons = playPreset.mock.calls.map(call => call.at(1));
      expect(icons).toEqual([ 11, 33 ]);
    });
  });

  describe('withdraw()', () =>
  {
    it('does nothing for a character that has never held anything', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      JuiceHeldOverlayManager.withdraw(character, 'command');

      // Assert
      expect(discardEffect).not.toHaveBeenCalled();
    });

    it('does nothing when a different source is the one holding something', () =>
    {
      // Arrange
      const character = buildCharacter();
      const sprite = buildSprite(character);
      declareOverlay(character, { sourceKey: 'cutscene' });
      playPreset.mockReturnValue(buildEffect(sprite));
      JuiceHeldOverlayManager.materializeFor(sprite);
      playPreset.mockClear();

      // Act
      JuiceHeldOverlayManager.withdraw(character, 'command');

      // Assert
      expect(discardEffect).not.toHaveBeenCalled();
      JuiceHeldOverlayManager.materializeFor(sprite);
      expect(playPreset).not.toHaveBeenCalled();
    });

    it('takes down the live effect and forgets the request', () =>
    {
      // Arrange
      const character = buildCharacter();
      const sprite = buildSprite(character);
      const effect = buildEffect(sprite);
      declareOverlay(character);
      playPreset.mockReturnValue(effect);
      JuiceHeldOverlayManager.materializeFor(sprite);
      playPreset.mockClear();

      // Act
      JuiceHeldOverlayManager.withdraw(character, 'command');

      // Assert
      expect(discardEffect).toHaveBeenCalledWith(effect);
      JuiceHeldOverlayManager.materializeFor(sprite);
      expect(playPreset).not.toHaveBeenCalled();
    });

    it('forgets a request that no sprite ever drew', () =>
    {
      // Arrange: declared while off-screen and withdrawn before anything rendered it.
      const character = buildCharacter();
      const sprite = buildSprite(character);
      declareOverlay(character);

      // Act
      JuiceHeldOverlayManager.withdraw(character, 'command');

      // Assert
      expect(discardEffect).not.toHaveBeenCalled();
      JuiceHeldOverlayManager.materializeFor(sprite);
      expect(playPreset).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/juice/managers/juice-held-overlay-manager.test.js