//region plugins/class/core/windows/window-menu-command.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * The class command in the main menu, built by the real `Window_MenuCommand`.
 */
describe('Window_MenuCommand (J-Classes)', () =>
{
  let originalAddOriginalCommands;

  /**
   * Builds the main menu's command window the way the menu scene does.
   * @returns {Window_MenuCommand} The built window.
   */
  const buildMenu = () => new globalThis.Window_MenuCommand(new globalThis.Rectangle(0, 0, 400, 800));

  /**
   * Finds the class command in a built menu.
   * @param {Window_MenuCommand} window The menu to search.
   * @returns {BuiltWindowCommand|undefined} The class command, when the menu has one.
   */
  const classesCommandOf = window => window.commandList()
    .find(command => command.symbol === 'classes');

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    await import('../../../../../src/plugins/class/core/windows/Window_MenuCommand.js');
    originalAddOriginalCommands = globalThis.J.CLASS.Aliased.Window_MenuCommand.get('addOriginalCommands');
  });

  beforeEach(() =>
  {
    globalThis.$gameSwitches.clear();
    globalThis.J.CLASS.Metadata.menuSwitchId = 0;
    globalThis.J.CLASS.Metadata.commandName = 'Classes';
    globalThis.J.CLASS.Metadata.commandIconIndex = 186;
  });

  afterEach(() =>
  {
    // put back the original the alias calls through to, whichever test replaced it.
    globalThis.J.CLASS.Aliased.Window_MenuCommand.set('addOriginalCommands', originalAddOriginalCommands);
  });

  describe('addOriginalCommands()', () =>
  {
    it('still adds whatever the menu adds before it', () =>
    {
      // Arrange
      const original = vi.fn();
      globalThis.J.CLASS.Aliased.Window_MenuCommand.set('addOriginalCommands', original);

      // Act
      buildMenu();

      // Assert
      expect(original)
        .toHaveBeenCalled();
    });

    it('adds the class command to the actor column while it is visible', () =>
    {
      // Arrange
      // Act
      const menu = buildMenu();

      // Assert
      const command = classesCommandOf(menu);
      expect(command.name)
        .toBe('Classes');
      expect(command.icon)
        .toBe(186);
      expect(command.menuSection)
        .toBe('actor');
    });

    it('leaves the class command out while its switch is off', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuSwitchId = 7;
      globalThis.$gameSwitches.setValue(7, false);

      // Act
      const menu = buildMenu();

      // Assert
      expect(classesCommandOf(menu))
        .toBeUndefined();
    });
  });

  describe('buildClassesCommand()', () =>
  {
    it('explains the command for the help strip', () =>
    {
      // Arrange
      const menu = buildMenu();

      // Act
      const command = menu.buildClassesCommand();

      // Assert
      expect(command.helpText)
        .toBe('Review what each of this character\'s classes does and teaches.');
    });
  });
});
//endregion plugins/class/core/windows/window-menu-command.test.js