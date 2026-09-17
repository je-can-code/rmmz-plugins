//region plugins/message/ext/bubbles/services/bubble-conversation.test.js
import { describe, expect, it } from 'vitest';

import BubbleConversation from '../../../../../../src/plugins/message/ext/bubbles/services/BubbleConversation.js';

/**
 * Every case here neutralizes the two conditions it is not about. A conversation is held open by any
 * one of three things, so a test that left a second one in its blocking state would pass whether or
 * not the guard it names still existed.
 */
describe('J-Message-Bubbles BubbleConversation (direct src import)', () =>
{
  describe('shouldRelease', () =>
  {
    it('releases once the player has control back', () =>
    {
      // Arrange
      const isHoldingBubbles = true;
      const isEventRunning = false;
      const isMessageBusy = false;

      // Act
      const result = BubbleConversation.shouldRelease(isHoldingBubbles, isEventRunning, isMessageBusy);

      // Assert
      expect(result).toBe(true);
    });

    it('releases nothing when nobody has spoken', () =>
    {
      // Arrange- the ordinary state of a map with no conversation on it.
      const isHoldingBubbles = false;
      const isEventRunning = false;
      const isMessageBusy = false;

      // Act
      const result = BubbleConversation.shouldRelease(isHoldingBubbles, isEventRunning, isMessageBusy);

      // Assert
      expect(result).toBe(false);
    });

    it('holds the conversation open while its event is still running', () =>
    {
      // Arrange- the gap between two lines, where the event is pacing its characters around.
      const isHoldingBubbles = true;
      const isEventRunning = true;
      const isMessageBusy = false;

      // Act
      const result = BubbleConversation.shouldRelease(isHoldingBubbles, isEventRunning, isMessageBusy);

      // Assert
      expect(result).toBe(false);
    });

    it('holds the conversation open while a message with no event behind it is being read', () =>
    {
      // Arrange- a parallel process or a scripted message, which no event is running.
      const isHoldingBubbles = true;
      const isEventRunning = false;
      const isMessageBusy = true;

      // Act
      const result = BubbleConversation.shouldRelease(isHoldingBubbles, isEventRunning, isMessageBusy);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-conversation.test.js