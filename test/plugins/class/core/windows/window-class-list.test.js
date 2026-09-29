//region plugins/class/core/windows/window-class-list.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { BRAWLER_ICON_INDEX, installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * The class list, against the real `Window_Command` and real actors.
 *
 * Its one piece of judgment- whether confirming does anything- is the service's, so what is checked here is
 * the wiring around it: that the rows are the ones the service chose, that they carry what the scene reads
 * back out of them, and that confirming asks the service rather than the drawn row.
 */
describe('Window_ClassList', () =>
{
  let Window_ClassList;

  /**
   * Builds a list at an ordinary size.
   * @returns {Window_ClassList} The built window.
   */
  const buildList = () => new Window_ClassList(new globalThis.Rectangle(0, 0, 400, 400));

  /**
   * Names the classes a list is showing, in order.
   * @param {Window_ClassList} window The window to read.
   * @returns {string[]} The class names.
   */
  const namesOf = window => window.commandList()
    .map(command => command.name);

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    ({ default: Window_ClassList } = await import('../../../../../src/plugins/class/core/windows/Window_ClassList.js'));
  });

  beforeEach(() =>
  {
    // actor 1 wears the starting class, with one other class unlocked.
    const actor = globalThis.$gameActors.actor(1);
    actor.initClassMembers();
    actor.changeClass(1, true);
    actor.unlockClass(2);
    globalThis.J.CLASS.Metadata.classIconIndex = 0;
  });

  describe('initMembers()', () =>
  {
    it('lists nothing until it is told whose classes to list', () =>
    {
      // Arrange
      // Act
      const window = buildList();

      // Assert
      expect(window.actor())
        .toBeNull();
      expect(window.commandList())
        .toEqual([]);
    });

    it('starts out unable to change classes', () =>
    {
      // Arrange
      // Act
      const window = buildList();

      // Assert
      expect(window.isChangingAllowed())
        .toBe(false);
    });
  });

  describe('setActor()', () =>
  {
    it('lists the classes the service chose for that actor', () =>
    {
      // Arrange
      const window = buildList();

      // Act
      window.setActor(globalThis.$gameActors.actor(1));

      // Assert- the worn class, the unlocked one, and Pathfinder, set aside for actor 1 and named only as "???".
      expect(namesOf(window))
        .toEqual([ 'Harness', 'Brawler', '???' ]);
    });
  });

  describe('setChangingAllowed()', () =>
  {
    it('remembers whether confirming may change a class', () =>
    {
      // Arrange
      const window = buildList();

      // Act
      window.setChangingAllowed(true);

      // Assert
      expect(window.isChangingAllowed())
        .toBe(true);
    });
  });

  describe('buildCommand()', () =>
  {
    it('carries the class it names, for the scene to read back out', () =>
    {
      // Arrange
      const window = buildList();

      // Act
      window.setActor(globalThis.$gameActors.actor(1));

      // Assert
      const [ , brawlerRow ] = window.commandList();
      expect(brawlerRow.ext)
        .toBe(globalThis.$dataClasses[2]);
      expect(brawlerRow.symbol)
        .toBe('class');
    });

    it('draws each class with the icon the service chose for it', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.classIconIndex = 2694;
      const window = buildList();

      // Act
      window.setActor(globalThis.$gameActors.actor(1));

      // Assert- Brawler's own icon, between two classes that have none and take the configured one.
      const icons = window.commandList()
        .map(command => command.icon);
      expect(icons)
        .toEqual([ 2694, BRAWLER_ICON_INDEX, 2694 ]);
    });

    it('draws every row enabled, since the list is for reading as much as choosing', () =>
    {
      // Arrange- nothing here can be changed into, which would dim every row if rows asked.
      const window = buildList();
      window.setChangingAllowed(false);

      // Act
      window.setActor(globalThis.$gameActors.actor(1));

      // Assert
      const enabled = window.commandList()
        .map(command => command.enabled);
      expect(enabled)
        .toEqual([ true, true, true ]);
    });

    it('colors the right edge of each row the way the row asks', () =>
    {
      // Arrange- an extension marking only Brawler, so one color for every row cannot pass.
      const window = buildList();
      window.classRightColorIndex = dataClass => (dataClass.id === 2 ? 11 : 0);

      // Act
      window.setActor(globalThis.$gameActors.actor(1));

      // Assert
      const rightColors = window.commandList()
        .map(command => command.rightColor);
      expect(rightColors)
        .toEqual([ 0, 11, 0 ]);
    });
  });

  describe('classColorIndex()', () =>
  {
    it('picks out the class being worn', () =>
    {
      // Arrange
      const window = buildList();
      window.setActor(globalThis.$gameActors.actor(1));

      // Act
      const colorIndex = window.classColorIndex(globalThis.$dataClasses[1]);

      // Assert
      expect(colorIndex)
        .toBe(6);
    });

    it('dims a class the actor has yet to unlock', () =>
    {
      // Arrange
      const window = buildList();
      window.setActor(globalThis.$gameActors.actor(1));

      // Act
      const colorIndex = window.classColorIndex(globalThis.$dataClasses[6]);

      // Assert
      expect(colorIndex)
        .toBe(7);
    });

    it('draws every other class plain', () =>
    {
      // Arrange
      const window = buildList();
      window.setActor(globalThis.$gameActors.actor(1));

      // Act
      const colorIndex = window.classColorIndex(globalThis.$dataClasses[2]);

      // Assert
      expect(colorIndex)
        .toBe(0);
    });
  });

  describe('classRightText()', () =>
  {
    it('says nothing at the right edge until an extension has something to say', () =>
    {
      // Arrange
      const window = buildList();
      window.setActor(globalThis.$gameActors.actor(1));

      // Act
      const rightText = window.classRightText(globalThis.$dataClasses[2]);

      // Assert
      expect(rightText)
        .toBe('');
    });
  });

  describe('classRightColorIndex()', () =>
  {
    it('draws the right edge plain until an extension has something to mark', () =>
    {
      // Arrange
      const window = buildList();
      window.setActor(globalThis.$gameActors.actor(1));

      // Act
      const rightColorIndex = window.classRightColorIndex(globalThis.$dataClasses[2]);

      // Assert
      expect(rightColorIndex)
        .toBe(0);
    });
  });

  describe('isCurrentItemEnabled()', () =>
  {
    it('lets a confirm through when the service agrees the class can be changed into', () =>
    {
      // Arrange
      const window = buildList();
      window.setChangingAllowed(true);
      window.setActor(globalThis.$gameActors.actor(1));
      window.selectExt(globalThis.$dataClasses[2]);

      // Act
      const isEnabled = window.isCurrentItemEnabled();

      // Assert
      expect(isEnabled)
        .toBe(true);
    });

    it('buzzes a confirm the service refuses, whatever the row looks like', () =>
    {
      // Arrange- the same row, in a list opened only to look.
      const window = buildList();
      window.setChangingAllowed(false);
      window.setActor(globalThis.$gameActors.actor(1));
      window.selectExt(globalThis.$dataClasses[2]);

      // Act
      const isEnabled = window.isCurrentItemEnabled();

      // Assert
      expect(isEnabled)
        .toBe(false);
    });
  });
});
//endregion plugins/class/core/windows/window-class-list.test.js