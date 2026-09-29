//region plugins/class/core/scenes/scene-menu.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * The main menu's wiring for the class command, against the real `Scene_Menu`.
 */
describe('Scene_Menu (J-Classes)', () =>
{
  let Scene_Classes;

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    ({ default: Scene_Classes } = await import('../../../../../src/plugins/class/core/scenes/Scene_Classes.js'));
    await import('../../../../../src/plugins/class/core/scenes/Scene_Menu.js');
  });

  beforeEach(() =>
  {
    globalThis.SceneManager._scene = new globalThis.Scene_Base();
    globalThis.SceneManager._nextScene = null;
    globalThis.SceneManager._stack = [];
    globalThis.$gameSwitches.clear();
    globalThis.J.CLASS.Metadata.menuChangeSwitchId = 0;
  });

  describe('createCommandWindow()', () =>
  {
    it('answers the class command from the menu it builds', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Menu();

      // Act
      scene.create();

      // Assert
      expect(scene.commandWindow()
        .isHandled('classes'))
        .toBe(true);
    });

    it('keeps the menu\'s own handlers, since the original still builds the window', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Menu();

      // Act
      scene.create();

      // Assert
      expect(scene.commandWindow()
        .isHandled('item'))
        .toBe(true);
    });
  });

  describe('commandClasses()', () =>
  {
    it('opens the class scene only to look when the menu may not change classes', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Menu();

      // Act
      scene.commandClasses();

      // Assert
      const nextScene = globalThis.SceneManager._nextScene;
      expect(nextScene.constructor)
        .toBe(Scene_Classes);
      expect(nextScene.isChangingAllowed())
        .toBe(false);
    });

    it('opens the class scene able to change classes when the menu is allowed to', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuChangeSwitchId = 9;
      globalThis.$gameSwitches.setValue(9, true);
      const scene = new globalThis.Scene_Menu();

      // Act
      scene.commandClasses();

      // Assert
      expect(globalThis.SceneManager._nextScene.isChangingAllowed())
        .toBe(true);
    });
  });
});
//endregion plugins/class/core/scenes/scene-menu.test.js