//region plugins/popups/core/sprites/sprite-character-wake.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * What happens to a character's queued popups when its sleeping sprite wakes up.
 *
 * A sprite asleep off-screen processes nothing, so the popups queued for its character in the meantime
 * are still waiting when it wakes. They describe things that happened out of sight a while ago, and
 * drawing them all at once would be a burst of stale numbers, so waking drops them. This is a seam
 * between J-Base's sleep and J-Popups' queue, which is why it is tested against the real prototypes.
 */
describe('Sprite_Character.wakeUp with J-Popups', () =>
{
  beforeAll(async () =>
  {
    // the real view layer, so the sprite prototype is the engine's own.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.J = {
      BASE: {
        Aliased: {
          Spriteset_Map: new Map(),
          Sprite_Character: new Map(),
        },
      },
      POPUPS: {
        Aliased: {
          Sprite_Character: new Map(),
        },
        // read by the layout helper the sprite file imports, the moment it loads.
        Layout: {
          RingStepX: 12,
          RingStepY: 12,
        },
      },
    };

    // J-Base first, since it owns the sleep that J-Popups extends.
    await import('../../../../../src/plugins/_base/core/sprites/Sprite_Character.js');
    await import('../../../../../src/plugins/popups/core/sprites/Sprite_Character.js');
  });

  it('wakes up with its character\'s queued popups thrown away', () =>
  {
    // Arrange - a sleeping sprite whose character had popups queued while it slept.
    const character = {
      emptyDamagePops: vi.fn(),
      acknowledgeTextPops: vi.fn(),
    };
    const sprite = Object.create(globalThis.Sprite_Character.prototype);
    sprite._character = character;
    sprite.renderable = false;

    // Act
    sprite.wakeUp();

    // Assert - the queue is emptied and its flag lowered, and the sprite is awake again.
    expect(character.emptyDamagePops).toHaveBeenCalledTimes(1);
    expect(character.acknowledgeTextPops).toHaveBeenCalledTimes(1);
    expect(sprite.renderable).toBe(true);
  });
});
//endregion plugins/popups/core/sprites/sprite-character-wake.test.js
