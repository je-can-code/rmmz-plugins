//region plugins/hud/ext/target/objects/game-event.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('Game_Event (J-HUD-TargetFrame) (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      HUD: {
        EXT: {
          TARGET: {
            Metadata: { EnableHP: true, EnableMP: true, EnableTP: true },
            RegExp: {
              TargetFrameText: /<targetFrameText:([\w :"'.!+\-*/\\]*)>/i,
              TargetFrameIcon: /<targetFrameIcon:(\d+)>/i,
              HideTargetFrame: /<hideTargetFrame>/i,
              HideTargetText: /<hideTargetFrameText>/i,
              HideTargetHP: /<hideTargetHpBar>/i,
              HideTargetMP: /<hideTargetMpBar>/i,
              HideTargetTP: /<hideTargetTpBar>/i,
            },
          },
        },
      },
    };

    function Game_Event()
    {
    }

    globalThis.Game_Event = Game_Event;

    await import('../../../../../../src/plugins/hud/ext/target/objects/Game_Event.js');
  });

  function buildEvent(commentCommands = [])
  {
    const event = Object.create(globalThis.Game_Event.prototype);
    event.getValidCommentCommands = () => commentCommands;
    return event;
  }

  function commentOf(text)
  {
    return { parameters: [ text ] };
  }

  describe('getTargetFrameText', () =>
  {
    it('returns the empty string when there are no comment commands', () =>
    {
      // Arrange
      const event = buildEvent([]);

      // Act & Assert
      expect(event.getTargetFrameText()).toBe(String.empty);
    });

    it('extracts the text from a matching comment command', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<targetFrameText:hello there>') ]);

      // Act & Assert
      expect(event.getTargetFrameText()).toBe('hello there');
    });

    it('returns the empty string when no comment command matches', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<somethingElse>') ]);

      // Act & Assert
      expect(event.getTargetFrameText()).toBe(String.empty);
    });

    it('lets a later matching comment command override an earlier one', () =>
    {
      // Arrange
      const event = buildEvent([
        commentOf('<targetFrameText:first>'),
        commentOf('<targetFrameText:second>'),
      ]);

      // Act & Assert
      expect(event.getTargetFrameText()).toBe('second');
    });
  });

  describe('getTargetFrameIcon', () =>
  {
    it('returns 0 when there are no comment commands', () =>
    {
      // Arrange
      const event = buildEvent([]);

      // Act & Assert
      expect(event.getTargetFrameIcon()).toBe(0);
    });

    it('extracts the icon index from a matching comment command', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<targetFrameIcon:64>') ]);

      // Act & Assert
      expect(event.getTargetFrameIcon()).toBe(64);
    });

    it('returns 0 when no comment command matches', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<somethingElse>') ]);

      // Act & Assert
      expect(event.getTargetFrameIcon()).toBe(0);
    });
  });

  describe('canShowTargetFrame', () =>
  {
    it('returns true by default when there are no comment commands', () =>
    {
      // Arrange
      const event = buildEvent([]);

      // Act & Assert
      expect(event.canShowTargetFrame()).toBe(true);
    });

    it('returns false when a comment command hides the target frame', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<hideTargetFrame>') ]);

      // Act & Assert
      expect(event.canShowTargetFrame()).toBe(false);
    });

    it('returns true when no comment command matches', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<somethingElse>') ]);

      // Act & Assert
      expect(event.canShowTargetFrame()).toBe(true);
    });
  });

  describe('showTargetHpBar', () =>
  {
    it('falls back to the plugin metadata default when there are no comment commands', () =>
    {
      // Arrange
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableHP = false;
      const event = buildEvent([]);

      // Act & Assert
      expect(event.showTargetHpBar()).toBe(false);

      // cleanup
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableHP = true;
    });

    it('returns false when a comment command hides the hp bar', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<hideTargetHpBar>') ]);

      // Act & Assert
      expect(event.showTargetHpBar()).toBe(false);
    });

    it('returns the metadata default when no comment command matches', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<somethingElse>') ]);

      // Act & Assert
      expect(event.showTargetHpBar()).toBe(true);
    });
  });

  describe('showTargetMpBar', () =>
  {
    it('falls back to the plugin metadata default when there are no comment commands', () =>
    {
      // Arrange
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableMP = false;
      const event = buildEvent([]);

      // Act & Assert
      expect(event.showTargetMpBar()).toBe(false);

      // cleanup
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableMP = true;
    });

    it('returns false when a comment command hides the mp bar', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<hideTargetMpBar>') ]);

      // Act & Assert
      expect(event.showTargetMpBar()).toBe(false);
    });

    it('returns the metadata default when no comment command matches', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<somethingElse>') ]);

      // Act & Assert
      expect(event.showTargetMpBar()).toBe(true);
    });
  });

  describe('showTargetTpBar', () =>
  {
    it('falls back to the plugin metadata default when there are no comment commands', () =>
    {
      // Arrange
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableTP = false;
      const event = buildEvent([]);

      // Act & Assert
      expect(event.showTargetTpBar()).toBe(false);

      // cleanup
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableTP = true;
    });

    it('returns false when a comment command hides the tp bar', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<hideTargetTpBar>') ]);

      // Act & Assert
      expect(event.showTargetTpBar()).toBe(false);
    });

    it('returns the metadata default when no comment command matches', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<somethingElse>') ]);

      // Act & Assert
      expect(event.showTargetTpBar()).toBe(true);
    });
  });

  describe('showTargetText', () =>
  {
    it('returns true by default when there are no comment commands', () =>
    {
      // Arrange
      const event = buildEvent([]);

      // Act & Assert
      expect(event.showTargetText()).toBe(true);
    });

    it('returns false when a comment command hides the target text', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<hideTargetFrameText>') ]);

      // Act & Assert
      expect(event.showTargetText()).toBe(false);
    });

    it('returns true when no comment command matches', () =>
    {
      // Arrange
      const event = buildEvent([ commentOf('<somethingElse>') ]);

      // Act & Assert
      expect(event.showTargetText()).toBe(true);
    });
  });
});
//endregion plugins/hud/ext/target/objects/game-event.test.js
