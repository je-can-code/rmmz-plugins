//region plugins/message/core/services/message-fade.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import MessageConfig from '../../../../../src/plugins/message/core/services/MessageConfig.js';
import MessageFade from '../../../../../src/plugins/message/core/services/MessageFade.js';

/**
 * One knob decides how fast everything leaves the screen - a message, the line behind it in the same
 * conversation, and an NPC muttering across the square. They have to agree or the screen reads as
 * three systems rather than one, so the length is asked for here and nowhere else.
 */
describe('J-Message MessageFade (direct src import)', () =>
{
  beforeEach(() =>
  {
    MessageConfig.load({});
  });

  describe('how long a fade runs', () =>
  {
    it('takes about half a second when the project has configured nothing', () =>
    {
      // Arrange & Act
      const frames = MessageFade.frames();

      // Assert
      expect(frames).toBe(30);
    });

    it('takes the length the project configured', () =>
    {
      // Arrange- a sibling section alongside, because reading the wrong one would be invisible
      // against a config holding only the section being asked for.
      MessageConfig.load({
        fade: { frames: 12 },
        chatter: { radius: 9 },
      });

      // Act
      const frames = MessageFade.frames();

      // Assert
      expect(frames).toBe(12);
    });

    it('keeps a configured zero rather than falling back over it', () =>
    {
      // Arrange- zero is a real answer, and it is how a project asks for the old instant behaviour.
      MessageConfig.load({ fade: { frames: 0 } });

      // Act
      const frames = MessageFade.frames();

      // Assert
      expect(frames).toBe(0);
    });

    it('falls back when the fade section exists but says nothing about length', () =>
    {
      // Arrange
      MessageConfig.load({ fade: {} });

      // Act
      const frames = MessageFade.frames();

      // Assert
      expect(frames).toBe(30);
    });
  });

  describe('how opaque a fade is', () =>
  {
    it('is still fully opaque before a single frame has passed', () =>
    {
      // Arrange & Act
      const alpha = MessageFade.alphaAt(0, 30);

      // Assert
      expect(alpha).toBe(1);
    });

    it('is halfway through at the halfway point', () =>
    {
      // Arrange & Act
      const alpha = MessageFade.alphaAt(15, 30);

      // Assert
      expect(alpha).toBe(0.5);
    });

    it('is gone on the last frame', () =>
    {
      // Arrange & Act
      const alpha = MessageFade.alphaAt(30, 30);

      // Assert
      expect(alpha).toBe(0);
    });

    it('stays gone past the end rather than going negative', () =>
    {
      // Arrange & Act
      const alpha = MessageFade.alphaAt(45, 30);

      // Assert- a sprite left ticking after its fade finished must not start showing through again.
      expect(alpha).toBe(0);
    });

    it('is gone immediately when the fade has no length', () =>
    {
      // Arrange & Act
      // a project that configured the fade away, which must never divide by its own zero.
      const alpha = MessageFade.alphaAt(0, 0);

      // Assert
      expect(alpha).toBe(0);
    });
  });

  describe('when a fade is done', () =>
  {
    it('is not finished partway through', () =>
    {
      // Arrange & Act
      const finished = MessageFade.isFinished(29, 30);

      // Assert
      expect(finished).toBe(false);
    });

    it('is finished on the frame it runs out', () =>
    {
      // Arrange & Act
      const finished = MessageFade.isFinished(30, 30);

      // Assert
      expect(finished).toBe(true);
    });

    it('is finished past the frame it ran out', () =>
    {
      // Arrange & Act
      const finished = MessageFade.isFinished(31, 30);

      // Assert
      expect(finished).toBe(true);
    });
  });
});
//endregion plugins/message/core/services/message-fade.test.js