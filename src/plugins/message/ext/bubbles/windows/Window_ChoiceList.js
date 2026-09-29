//region Window_ChoiceList
import BubblePlacement from '../services/BubblePlacement.js';

/**
 * Extends {@link #windowX}.<br/>
 * Also keeps the choices with a floating message, lined up with its bubble rather than with an edge of the screen.
 *
 * The engine stacks the choices under or over the message window wherever that window is, but measures across from the
 * screen- so beside a bubble floating over its speaker, the choices sat at the bubble's height and at the screen's far
 * edge. The Show Choices position still decides where they go; it just means the bubble's left, middle or right now.
 * @returns {number}
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Window_ChoiceList.set('windowX', Window_ChoiceList.prototype.windowX);
Window_ChoiceList.prototype.windowX = function()
{
  const messageWindow = this.messageWindow();

  // a message in its usual box keeps the choices where the engine puts them.
  if (messageWindow.isFloatingMessage() === false)
  {
    // perform original logic.
    return J.MESSAGE.EXT.BUBBLES.Aliased.Window_ChoiceList.get('windowX')
      .call(this);
  }

  // a floating one keeps them with its bubble.
  const positionType = $gameMessage.choicePositionType();
  const choicesWidth = this.windowWidth();

  return BubblePlacement.choicesX(positionType, messageWindow.x, messageWindow.width, choicesWidth, Graphics.boxWidth);
};
//endregion Window_ChoiceList