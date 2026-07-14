//region plugins/omni/core/objects/_component/game-system.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Scene_Omnipedia is a heavy UI import (windows/scene chain); mock it so the direct import of
 * Game_System.js doesn't have to pull in the whole scene graph just to reach `Scene_Omnipedia.callScene`.
 */
vi.mock('../../../../../../src/plugins/omni/core/scenes/Scene_Omnipedia.js', () => ({
  default: { callScene: vi.fn() },
}));

import Scene_Omnipedia from '../../../../../../src/plugins/omni/core/scenes/Scene_Omnipedia.js';

describe('Game_System (omni core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();
    vi.clearAllMocks();

    function Game_System()
    {
    }

    globalThis.Game_System = Game_System;
    globalThis.SoundManager = { playBuzzer: vi.fn() };

    // the file under test- patches globalThis.Game_System.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/omni/core/objects/Game_System.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_System;
    delete globalThis.SoundManager;
  });

  describe('canCallOmnipediaScene', () =>
  {
    it('always returns true', () =>
    {
      const system = new globalThis.Game_System();

      expect(system.canCallOmnipediaScene()).toBe(true);
    });
  });

  describe('callOmnipediaScene', () =>
  {
    it('calls the omnipedia scene when it can be called', () =>
    {
      const system = new globalThis.Game_System();

      system.callOmnipediaScene();

      expect(Scene_Omnipedia.callScene).toHaveBeenCalled();
    });

    it('calls the omnipedia scene when force is true, even if canCallOmnipediaScene would say no', () =>
    {
      const system = new globalThis.Game_System();
      system.canCallOmnipediaScene = () => false;

      system.callOmnipediaScene(true);

      expect(Scene_Omnipedia.callScene).toHaveBeenCalled();
    });

    it('plays a buzzer instead of calling the scene when it cannot be called and not forced', () =>
    {
      const system = new globalThis.Game_System();
      system.canCallOmnipediaScene = () => false;

      system.callOmnipediaScene();

      expect(Scene_Omnipedia.callScene).not.toHaveBeenCalled();
      expect(globalThis.SoundManager.playBuzzer).toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/core/objects/_component/game-system.test.js
