//region plugins/motion/_component/game-event-motion.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installMotionComponentGlobals,
  setMotionConfig,
  setPluginContextToJBase,
  setPluginContextToJMotion,
} from './fixtures/install-motion-component-globals.js';

describe('Game_Event motion declarations (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    vi.resetModules();

    installMotionComponentGlobals();
    setMotionConfig({});

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Event.js');

    setPluginContextToJMotion();
    await import('../../../../src/plugins/motion/core/_metadata/initialization.js');

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../src/plugins/motion/core/core/MotionTypeRegistry.js');
    ({ default: MotionChannels } =
      await import('../../../../src/plugins/motion/core/core/MotionChannels.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    await import('../../../../src/plugins/motion/core/objects/Game_Event.js');
  });

  /** @type {Object} */
  let event;

  beforeEach(() =>
  {
    event = new globalThis.Game_Event();
    event.commentCommands = [];
  });

  /**
   * Turns comment text into the command shape an event page actually holds.
   * @param {string[]} comments The comment lines.
   * @returns {Object[]}
   */
  const asCommentCommands = comments => comments.map(comment => ({ code: 108, parameters: [ comment ] }));

  describe('setupPage', () =>
  {
    it('still performs the engine\'s own page setup', () =>
    {
      // Act
      event.setupPage();

      // Assert
      expect(event.pageSetupRan).toBe(true);
    });

    it('declares the motions the active page asks for', () =>
    {
      // Arrange
      event.commentCommands = asCommentCommands([ '<motion:[sway, 8, 100, sync]>' ]);

      // Act
      event.setupPage();
      const composition = CharacterMotionComposer.compose(event);

      // Assert
      // one frame into a synced 100-frame sway of 8px, observed rather than derived.
      expect(CharacterMotionComposer.hasMotion(event)).toBe(true);
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(0.5023, 4);
    });

    it('declares several motions from one page', () =>
    {
      // Arrange
      event.commentCommands = asCommentCommands([
        '<motion:[sway, 8, 100, sync]>',
        '<enemyId:12>',
        '<motion:[float, 20, 100, sync]>',
      ]);

      // Act
      event.setupPage();
      const ticks = 25;
      let composition = null;
      for (let index = 0; index < ticks; index++)
      {
        composition = CharacterMotionComposer.compose(event);
      }

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-10, 10);
    });

    it('declares nothing for a page holding no motion tags', () =>
    {
      // Arrange
      event.commentCommands = asCommentCommands([ '<enemyId:12>', '<sight:5>' ]);

      // Act
      event.setupPage();

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('stamps the declarations as coming from the page, so a state cannot remove them', () =>
    {
      // Arrange
      event.commentCommands = asCommentCommands([ '<motion:[sway, 8, 100, sync]>' ]);
      event.setupPage();

      // Act
      CharacterMotionComposer.removeDeclarations(event, 'state:1');

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(true);
    });

    it('leaves a running motion undisturbed when the same page is set up again', () =>
    {
      // Arrange
      event.commentCommands = asCommentCommands([ '<motion:[sway, 8, 100, sync]>' ]);
      event.setupPage();
      const ticks = 25;
      for (let index = 0; index < ticks; index++)
      {
        CharacterMotionComposer.compose(event);
      }

      // Act
      event.setupPage();
      const composition = CharacterMotionComposer.compose(event);

      // Assert
      // a rebuilt effect would be back at the start of its cycle reading zero; this one is not.
      expect(composition.valueFor(MotionChannels.OFFSET_X)).not.toBeCloseTo(0, 5);
    });

    it('swaps the motions over when the page genuinely changes', () =>
    {
      // Arrange
      event.commentCommands = asCommentCommands([ '<motion:[sway, 8, 100, sync]>' ]);
      event.setupPage();

      // Act
      event.commentCommands = asCommentCommands([ '<motion:[float, 20, 100, sync]>' ]);
      event.setupPage();
      const ticks = 50;
      let composition = null;
      for (let index = 0; index < ticks; index++)
      {
        composition = CharacterMotionComposer.compose(event);
      }

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-20, 10);
    });
  });

  describe('motionCommentTexts', () =>
  {
    it('hands back the text of every parsable comment on the page', () =>
    {
      // Arrange
      event.commentCommands = asCommentCommands([ '<motion:[breathe]>', '<enemyId:12>' ]);

      // Act
      const texts = event.motionCommentTexts();

      // Assert
      expect(texts).toEqual([ '<motion:[breathe]>', '<enemyId:12>' ]);
    });
  });
});
//endregion plugins/motion/_component/game-event-motion.test.js