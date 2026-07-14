//region plugins/abs/ext/input/scenes/scene-menu.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Input Scene_Menu (unit, all downstream dependencies mocked)', () =>
{
  let originalCreateCommandWindow;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Aliased: { Scene_Menu: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/input/scenes/Scene_JabsRemap.js', () => ({ default: class {} }));

    globalThis.SceneManager = { push: vi.fn() };

    function Scene_Menu()
    {
    }

    originalCreateCommandWindow = vi.fn();
    Scene_Menu.prototype.createCommandWindow = originalCreateCommandWindow;
    globalThis.Scene_Menu = Scene_Menu;

    await import('../../../../../../src/plugins/abs/ext/input/scenes/Scene_Menu.js');
  });

  beforeEach(() =>
  {
    originalCreateCommandWindow.mockReset();
    globalThis.SceneManager.push.mockReset();
  });

  describe('createCommandWindow', () =>
  {
    it('performs the original logic then wires the jabsRemap handler', async () =>
    {
      // Arrange
      const { default: Scene_JabsRemap } = await import('../../../../../../src/plugins/abs/ext/input/scenes/Scene_JabsRemap.js');
      const setHandler = vi.fn();
      const scene = Object.create(globalThis.Scene_Menu.prototype);
      scene._commandWindow = { setHandler };

      // Act
      scene.createCommandWindow();

      // Assert
      expect(originalCreateCommandWindow).toHaveBeenCalledTimes(1);
      expect(setHandler).toHaveBeenCalledWith('jabsRemap', expect.any(Function));

      // Act again- invoke the registered handler and confirm it pushes the remap scene.
      const [ , handler ] = setHandler.mock.calls[0];
      handler();

      // Assert
      expect(globalThis.SceneManager.push).toHaveBeenCalledWith(Scene_JabsRemap);
    });
  });
});
//endregion plugins/abs/ext/input/scenes/scene-menu.test.js
