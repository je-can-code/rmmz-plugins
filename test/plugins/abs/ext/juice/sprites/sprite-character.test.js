//region plugins/abs/ext/juice/sprites/sprite-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Sprite_Character.js is a prototype-patch file, so the engine class is stood up as a bare global
 * with a spied original and the source is imported for its side effects. JuiceHeldOverlayManager is
 * mocked per the "unit tier mocks all downstream file-external dependencies" convention; what is
 * under test here is the wiring, not the bookkeeping behind it.
 */
describe('J-ABS-Juice Sprite_Character (unit, all downstream dependencies mocked)', () =>
{
  let originalUpdate;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Aliased: { Sprite_Character: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHeldOverlayManager.js', () => ({
      default: { materializeFor: vi.fn() },
    }));

    function Sprite_Character()
    {
    }

    originalUpdate = vi.fn();
    Sprite_Character.prototype.update = originalUpdate;
    globalThis.Sprite_Character = Sprite_Character;

    await import('../../../../../../src/plugins/abs/ext/juice/sprites/Sprite_Character.js');
  });

  beforeEach(async () =>
  {
    const { default: JuiceHeldOverlayManager } =
      await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHeldOverlayManager.js');

    originalUpdate.mockReset();
    JuiceHeldOverlayManager.materializeFor.mockReset();
  });

  describe('update', () =>
  {
    it('performs the original logic before restoring held overlays', async () =>
    {
      // Arrange: the engine assigns position every frame, so anything written ahead of it is lost.
      const { default: JuiceHeldOverlayManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHeldOverlayManager.js');
      const callOrder = [];
      originalUpdate.mockImplementation(() => callOrder.push('original'));
      JuiceHeldOverlayManager.materializeFor.mockImplementation(() => callOrder.push('overlays'));
      const sprite = Object.create(globalThis.Sprite_Character.prototype);

      // Act
      sprite.update();

      // Assert
      expect(callOrder).toEqual([ 'original', 'overlays' ]);
    });
  });

  describe('updateHeldJuiceOverlays', () =>
  {
    it('hands the sprite itself to the overlay manager', async () =>
    {
      // Arrange: the manager resolves the character off the sprite, so the sprite is what it needs.
      const { default: JuiceHeldOverlayManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHeldOverlayManager.js');
      const sprite = Object.create(globalThis.Sprite_Character.prototype);

      // Act
      sprite.updateHeldJuiceOverlays();

      // Assert
      expect(JuiceHeldOverlayManager.materializeFor).toHaveBeenCalledWith(sprite);
    });
  });
});
//endregion plugins/abs/ext/juice/sprites/sprite-character.test.js