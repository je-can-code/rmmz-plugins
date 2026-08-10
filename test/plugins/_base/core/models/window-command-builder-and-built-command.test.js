//region plugins/_base/models/window-command-builder-and-built-command.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('WindowCommandBuilder / BuiltWindowCommand (direct src import)', () =>
{
  let WindowCommandBuilder;
  let BuiltWindowCommand;
  let MenuSection;

  beforeAll(async () =>
  {
    String.empty = '';

    // both the builder and the command validate against this as a bare global, the way the shipped
    // bundle hoists it.
    ({ default: MenuSection } = await import('../../../../../src/plugins/_base/core/models/MenuSection.js'));
    globalThis.MenuSection = MenuSection;

    ({ default: BuiltWindowCommand } = await import('../../../../../src/plugins/_base/core/models/BuiltWindowCommand.js'));
    ({ default: WindowCommandBuilder } = await import('../../../../../src/plugins/_base/core/models/WindowCommandBuilder.js'));
  });

  describe('WindowCommandBuilder', () =>
  {
    it('seeds the name via the constructor', () =>
    {
      // Arrange & Act
      const command = new WindowCommandBuilder('Attack').build();

      // Assert
      expect(command.name).toBe('Attack');
    });

    it('defaults every other field when nothing else is set', () =>
    {
      // Arrange & Act
      const command = new WindowCommandBuilder('Attack').build();

      // Assert
      expect(command.symbol).toBe('');
      expect(command.enabled).toBe(true);
      expect(command.ext).toBeNull();
      expect(command.icon).toBe(0);
      expect(command.color).toBe(0);
      expect(command.rightText).toBe('');
      expect(command.rightColor).toBe(0);
      expect(command.helpText).toBe('');
      expect(command.isSubtext).toBe(true);
      expect(command.faceData).toEqual([ '', -1 ]);
    });

    it('builds a fully-configured command from every fluent setter', () =>
    {
      // Arrange
      const extensionData = { questId: 5 };

      // Act
      const command = new WindowCommandBuilder('Investigate')
        .setSymbol('investigate')
        .setEnabled(false)
        .setExtensionData(extensionData)
        .setIconIndex(87)
        .setColorIndex(3)
        .setRightText('->')
        .setRightColorIndex(2)
        .addTextLine('line one')
        .setHelpText('Investigate the area.')
        .setFaceName('Actor1')
        .setFaceIndex(2)
        .build();

      // Assert
      expect(command.name).toBe('Investigate');
      expect(command.symbol).toBe('investigate');
      expect(command.enabled).toBe(false);
      expect(command.ext).toBe(extensionData);
      expect(command.icon).toBe(87);
      expect(command.color).toBe(3);
      expect(command.rightText).toBe('->');
      expect(command.rightColor).toBe(2);
      expect(command.subText).toEqual([ 'line one' ]);
      expect(command.helpText).toBe('Investigate the area.');
      expect(command.faceData).toEqual([ 'Actor1', 2 ]);
    });

    it('addTextLine appends a single line to the existing lines', () =>
    {
      // Arrange & Act
      const command = new WindowCommandBuilder('Cmd')
        .addTextLine('a')
        .addTextLine('b')
        .build();

      // Assert
      expect(command.subText).toEqual([ 'a', 'b' ]);
    });

    it('addTextLines appends multiple lines to the existing lines', () =>
    {
      // Arrange & Act
      const command = new WindowCommandBuilder('Cmd')
        .addTextLine('a')
        .addTextLines([ 'b', 'c' ])
        .build();

      // Assert
      expect(command.subText).toEqual([ 'a', 'b', 'c' ]);
    });

    it('setTextLines replaces the lines outright', () =>
    {
      // Arrange & Act
      const command = new WindowCommandBuilder('Cmd')
        .addTextLine('a')
        .setTextLines([ 'x', 'y' ])
        .build();

      // Assert
      expect(command.subText).toEqual([ 'x', 'y' ]);
    });

    it('flagAsMultiline marks the additional lines as multiline instead of subtext', () =>
    {
      // Arrange & Act
      const command = new WindowCommandBuilder('Cmd')
        .addTextLine('a')
        .flagAsMultiline()
        .build();

      // Assert
      expect(command.isSubtext).toBe(false);
      expect(command.lines).toEqual([ 'a' ]);
      expect(command.subText).toEqual([]);
    });

    it('flagAsSubText marks the additional lines as subtext instead of multiline', () =>
    {
      // Arrange & Act
      const command = new WindowCommandBuilder('Cmd')
        .addTextLine('a')
        .flagAsMultiline()
        .flagAsSubText()
        .build();

      // Assert
      expect(command.isSubtext).toBe(true);
      expect(command.subText).toEqual([ 'a' ]);
      expect(command.lines).toEqual([]);
    });
  });

  describe('BuiltWindowCommand', () =>
  {
    it('applies every constructor default when only name/symbol are provided', () =>
    {
      // Arrange & Act
      const command = new BuiltWindowCommand('Attack', 'attack');

      // Assert
      expect(command.name).toBe('Attack');
      expect(command.symbol).toBe('attack');
      expect(command.enabled).toBe(true);
      expect(command.ext).toBeNull();
      expect(command.icon).toBe(0);
      expect(command.color).toBe(0);
      expect(command.rightText).toBe('');
      expect(command.rightColor).toBe(0);
      expect(command.helpText).toBe('');
      expect(command.faceData).toEqual([ '', -1 ]);
    });

    it('destructures the provided faceData tuple into name/index', () =>
    {
      // Arrange & Act
      const command = new BuiltWindowCommand(
        'Attack', 'attack', true, null, 0, 0, '', 0, [], '', true, [ 'Actor3', 5 ],
      );

      // Assert
      expect(command.faceData).toEqual([ 'Actor3', 5 ]);
    });
  });

  describe('subText / lines (isSubtext toggle)', () =>
  {
    it('subText returns the lines and lines returns empty when isSubtext is true', () =>
    {
      // Arrange & Act
      const command = new BuiltWindowCommand('Cmd', 'cmd', true, null, 0, 0, '', 0, [ 'a' ], '', true);

      // Assert
      expect(command.subText).toEqual([ 'a' ]);
      expect(command.lines).toEqual([]);
    });

    it('lines returns the lines and subText returns empty when isSubtext is false', () =>
    {
      // Arrange & Act
      const command = new BuiltWindowCommand('Cmd', 'cmd', true, null, 0, 0, '', 0, [ 'a' ], '', false);

      // Assert
      expect(command.lines).toEqual([ 'a' ]);
      expect(command.subText).toEqual([]);
    });
  });

  //region which half of a split menu a command belongs to
  describe('menuSection', () =>
  {
    it('carries a section set through the builder onto the built command', () =>
    {
      // Arrange- assigned after construction rather than as a thirteenth positional parameter,
      // which every existing call site would otherwise have had to grow.
      // Act
      const command = new WindowCommandBuilder('Files')
        .setMenuSection(MenuSection.Party)
        .build();

      // Assert
      expect(command.menuSection).toBe(MenuSection.Party);
    });

    it('carries an actor-scoped section just as readily', () =>
    {
      // Arrange
      // Act
      const command = new WindowCommandBuilder('Equip')
        .setMenuSection(MenuSection.Actor)
        .build();

      // Assert
      expect(command.menuSection).toBe(MenuSection.Actor);
    });

    it('leaves the safe default in place when handed something that is not a section', () =>
    {
      // Arrange- a typo in a section name would otherwise put the command in a menu half that does
      // not exist, and it would simply stop being drawn anywhere.
      const command = new WindowCommandBuilder('Files').build();
      const original = command.menuSection;

      // Act
      command.menuSection = 'not-a-real-section';

      // Assert
      expect(command.menuSection).toBe(original);
    });
  });
  //endregion which half of a split menu a command belongs to
});
//endregion plugins/_base/models/window-command-builder-and-built-command.test.js
