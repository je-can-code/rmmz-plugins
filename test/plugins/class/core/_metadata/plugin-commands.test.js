//region plugins/class/core/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * J-Classes' plugin commands, called the way an event calls them: through the engine's own dispatcher,
 * with every argument a string, exactly as the editor stores it.
 */
describe('J-Classes plugin commands', () =>
{
  let Scene_Classes;

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    ({ default: Scene_Classes } = await import('../../../../../src/plugins/class/core/scenes/Scene_Classes.js'));
    await import('../../../../../src/plugins/class/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    // a scene to push from, and an empty stack to push onto.
    globalThis.SceneManager._scene = new globalThis.Scene_Base();
    globalThis.SceneManager._nextScene = null;
    globalThis.SceneManager._stack = [];
    globalThis.$gameActors.actor(1)
      .initClassMembers();
  });

  describe('call-scene', () =>
  {
    it('opens the class scene able to change classes when told to allow it', () =>
    {
      // Arrange
      const args = { allowChanging: 'true' };

      // Act
      globalThis.PluginManager.callCommand(null, 'J-Classes', 'call-scene', args);

      // Assert
      const nextScene = globalThis.SceneManager._nextScene;
      expect(nextScene.constructor)
        .toBe(Scene_Classes);
      expect(nextScene.isChangingAllowed())
        .toBe(true);
    });

    it('opens the class scene only to look when told not to allow changing', () =>
    {
      // Arrange- the editor stores false as the string "false", which is truthy on its own.
      const args = { allowChanging: 'false' };

      // Act
      globalThis.PluginManager.callCommand(null, 'J-Classes', 'call-scene', args);

      // Assert
      const nextScene = globalThis.SceneManager._nextScene;
      expect(nextScene.constructor)
        .toBe(Scene_Classes);
      expect(nextScene.isChangingAllowed())
        .toBe(false);
    });
  });

  describe('unlock-classes', () =>
  {
    it('unlocks every listed class for the named actor, in the order listed', () =>
    {
      // Arrange- the editor stores a class list as a JSON array of stringy ids.
      const args = {
        actorId: '1',
        classIds: '["3","2"]',
      };

      // Act
      globalThis.PluginManager.callCommand(null, 'J-Classes', 'unlock-classes', args);

      // Assert
      expect(globalThis.$gameActors.actor(1)
        .unlockedClassIds())
        .toEqual([ 3, 2 ]);
    });

    it('unlocks nothing for any other actor', () =>
    {
      // Arrange
      const secondActor = globalThis.$gameActors.actor(2);
      secondActor.initClassMembers();
      const args = {
        actorId: '1',
        classIds: '["3"]',
      };

      // Act
      globalThis.PluginManager.callCommand(null, 'J-Classes', 'unlock-classes', args);

      // Assert
      expect(secondActor.unlockedClassIds())
        .toEqual([]);
    });
  });
});
//endregion plugins/class/core/_metadata/plugin-commands.test.js