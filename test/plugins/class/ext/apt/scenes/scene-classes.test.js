//region plugins/class/ext/apt/scenes/scene-classes.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installClassAptRealm } from '../_component/fixtures/install-class-apt-realm.js';

/**
 * The learnings window J-Classes-Aptitude places beside the class scene's parameters.
 */
describe('Scene_Classes (J-Classes-Aptitude)', () =>
{
  let Window_ClassLearnings;

  beforeAll(async () =>
  {
    await installClassAptRealm();

    ({ default: Window_ClassLearnings } = await import(
      '../../../../../../src/plugins/class/ext/apt/windows/Window_ClassLearnings.js'));
    await import('../../../../../../src/plugins/class/ext/apt/scenes/Scene_Classes.js');
  });

  describe('sideWindowDefinitions()', () =>
  {
    it('places J-Aptitude\'s ladder beside the parameters, as the only window there', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Classes();
      const rectangle = new globalThis.Rectangle(0, 0, 749, 960);

      // Act
      const definitions = scene.sideWindowDefinitions();

      // Assert- J-Classes places nothing of its own, so the learnings are the one window beside the parameters.
      expect(definitions)
        .toHaveLength(1);
      expect(definitions[0].createWindow(rectangle))
        .toBeInstanceOf(Window_ClassLearnings);
    });
  });
});
//endregion plugins/class/ext/apt/scenes/scene-classes.test.js