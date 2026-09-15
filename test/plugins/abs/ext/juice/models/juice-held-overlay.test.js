//region plugins/abs/ext/juice/models/juice-held-overlay.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * JuiceHeldOverlay.js is a value object holding one held-overlay request. Its only logic is
 * isCurrentFor(), which decides whether a sprite already shows this overlay as currently requested;
 * JuiceWeaponSwingMotionEffect is mocked per the "unit tier mocks all downstream file-external
 * dependencies" convention, since which presets ignore facing is that class's own question.
 */
describe('JuiceHeldOverlay (unit, JuiceWeaponSwingMotionEffect mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/models/JuiceHeldOverlay.js').default} */
  let JuiceHeldOverlay;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.String.empty ??= '';

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceWeaponSwingMotionEffect.js', () => ({
      default: { isFacingAgnostic: motionType => motionType === 'present' },
    }));

    ({ default: JuiceHeldOverlay } =
      await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceHeldOverlay.js'));
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
   * Builds a real declaration with sane, overridable arguments.
   * @param {object} [overrides] Named overrides for constructor args.
   * @returns {{declaration: object, character: object}}
   */
  function buildDeclaration(overrides = {})
  {
    const character = overrides.character ?? buildCharacter();
    const declaration = new JuiceHeldOverlay(
      character,
      overrides.sourceKey ?? 'command',
      overrides.iconIndex ?? 195,
      overrides.motionType ?? 'present',
      overrides.durationFrames ?? 20,
      overrides.repeatCount ?? 1,
      overrides.arcSpanDegrees ?? 120
    );

    return { declaration, character };
  }

  describe('constructor', () =>
  {
    it('keeps everything it was asked to remember', () =>
    {
      // Arrange / Act
      const { declaration, character } = buildDeclaration({
        sourceKey: 'cutscene',
        iconIndex: 87,
        motionType: 'spin',
        durationFrames: 45,
        repeatCount: 3,
        arcSpanDegrees: 200,
      });

      // Assert
      expect(declaration.character()).toBe(character);
      expect(declaration.sourceKey()).toEqual('cutscene');
      expect(declaration.iconIndex()).toEqual(87);
      expect(declaration.motionType()).toEqual('spin');
      expect(declaration.durationFrames()).toEqual(45);
      expect(declaration.repeatCount()).toEqual(3);
      expect(declaration.arcSpanDegrees()).toEqual(200);
    });

    it('starts with nothing drawing it', () =>
    {
      // Arrange / Act
      const { declaration } = buildDeclaration();

      // Assert
      expect(declaration.effect()).toEqual(null);
      expect(declaration.facing()).toEqual(0);
    });
  });

  describe('setEffect()', () =>
  {
    it('attaches a live effect', () =>
    {
      // Arrange
      const { declaration } = buildDeclaration();
      const effect = { parentSprite: () => null };

      // Act
      declaration.setEffect(effect);

      // Assert
      expect(declaration.effect()).toBe(effect);
    });
  });

  describe('setFacing()', () =>
  {
    it('records the facing an effect was built against', () =>
    {
      // Arrange
      const { declaration } = buildDeclaration();

      // Act
      declaration.setFacing(6);

      // Assert
      expect(declaration.facing()).toEqual(6);
    });
  });

  describe('isCurrentFor()', () =>
  {
    it('is false when nothing is drawing the overlay yet', () =>
    {
      // Arrange
      const { declaration } = buildDeclaration();
      const sprite = { name: 'a-sprite' };

      // Act / Assert
      expect(declaration.isCurrentFor(sprite)).toEqual(false);
    });

    it('is false when something is drawing it on a different sprite', () =>
    {
      // Arrange: the shape a rebuilt map scene produces - a live effect on a sprite now discarded.
      const { declaration } = buildDeclaration();
      const oldSprite = { name: 'the-torn-down-sprite' };
      const newSprite = { name: 'the-fresh-sprite' };
      declaration.setEffect({ parentSprite: () => oldSprite });
      declaration.setFacing(2);

      // Act / Assert
      expect(declaration.isCurrentFor(newSprite)).toEqual(false);
    });

    it('is false when the character has turned under an aimed preset', () =>
    {
      // Arrange: stab-forward points where the character was looking when it was built.
      const character = buildCharacter(4);
      const { declaration } = buildDeclaration({ character, motionType: 'stab-forward' });
      const sprite = { name: 'a-sprite' };
      declaration.setEffect({ parentSprite: () => sprite });
      declaration.setFacing(2);

      // Act / Assert
      expect(declaration.isCurrentFor(sprite)).toEqual(false);
    });

    it('is true after a turn under a preset that ignores facing', () =>
    {
      // Arrange: present lifts the icon straight up the screen, so a turn changes nothing about it
      // and rebuilding would restart the ease - the icon visibly dropping and climbing again.
      const character = buildCharacter(4);
      const { declaration } = buildDeclaration({ character, motionType: 'present' });
      const sprite = { name: 'a-sprite' };
      declaration.setEffect({ parentSprite: () => sprite });
      declaration.setFacing(2);

      // Act / Assert
      expect(declaration.isCurrentFor(sprite)).toEqual(true);
    });

    it('is true on the right sprite at the right facing', () =>
    {
      // Arrange
      const character = buildCharacter(4);
      const { declaration } = buildDeclaration({ character, motionType: 'stab-forward' });
      const sprite = { name: 'a-sprite' };
      declaration.setEffect({ parentSprite: () => sprite });
      declaration.setFacing(4);

      // Act / Assert
      expect(declaration.isCurrentFor(sprite)).toEqual(true);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-held-overlay.test.js