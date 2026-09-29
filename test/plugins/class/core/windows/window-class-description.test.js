//region plugins/class/core/windows/window-class-description.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearDrawnText, drawnText } from '../../../../setup/rmmz-view-harness.js';
import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * The strip across the top of the class scene, drawn for real from a class J-Base built out of its raw row.
 */
describe('Window_ClassDescription', () =>
{
  let Window_ClassDescription;

  /**
   * Builds the strip at the size the scene gives it.
   * @returns {Window_ClassDescription} The built window.
   */
  const buildStrip = () => new Window_ClassDescription(new globalThis.Rectangle(0, 0, 1498, 108));

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    ({ default: Window_ClassDescription } = await import(
      '../../../../../src/plugins/class/core/windows/Window_ClassDescription.js'));
  });

  beforeEach(() =>
  {
    clearDrawnText();
  });

  describe('showClass()', () =>
  {
    it('shows the description of the class it is pointed at, whoever is wearing it', () =>
    {
      // Arrange- actor 2 wears Void, which says nothing about Brawler's description.
      const strip = buildStrip();

      // Act
      strip.showClass(globalThis.$gameActors.actor(2), 2);

      // Assert- one line of the strip for each line of the description.
      expect(strip.getText())
        .toBe('Hits first.\nAsks later.');
      expect(drawnText)
        .toEqual([ 'Hits first.', 'Asks later.' ]);
    });
  });
});
//endregion plugins/class/core/windows/window-class-description.test.js