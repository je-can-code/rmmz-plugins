//region plugins/abs/ext/juice/sprites/sprite-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice Sprite_Character (unit, all downstream dependencies mocked)', () =>
{
  let originalUpdatePosition;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Aliased: { Sprite_Character: new Map() } } } } };

    function Sprite_Character()
    {
    }

    originalUpdatePosition = vi.fn();
    Sprite_Character.prototype.updatePosition = originalUpdatePosition;
    globalThis.Sprite_Character = Sprite_Character;

    await import('../../../../../../src/plugins/abs/ext/juice/sprites/Sprite_Character.js');
  });

  beforeEach(() =>
  {
    originalUpdatePosition.mockReset();
  });

  describe('updatePosition', () =>
  {
    it('performs the original logic then compensates y while flipping', () =>
    {
      const sprite = Object.create(globalThis.Sprite_Character.prototype);
      sprite.y = 100;
      sprite.height = 40;
      sprite._juiceFlipping = true;

      sprite.updatePosition();

      expect(originalUpdatePosition).toHaveBeenCalledTimes(1);
      expect(sprite.y).toBe(80);
    });

    it('does not adjust y when not flipping', () =>
    {
      const sprite = Object.create(globalThis.Sprite_Character.prototype);
      sprite.y = 100;
      sprite.height = 40;
      sprite._juiceFlipping = false;

      sprite.updatePosition();

      expect(sprite.y).toBe(100);
    });
  });
});
//endregion plugins/abs/ext/juice/sprites/sprite-character.test.js
