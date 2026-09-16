//region Game_Message
/**
 * Extends {@link clear}.<br/>
 * Also forgets who the last message was floating above.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Game_Message.set('clear', Game_Message.prototype.clear);
Game_Message.prototype.clear = function()
{
  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Game_Message.get('clear')
    .call(this);

  /**
   * The target an author named, exactly as they typed it between the brackets.
   * @type {string}
   */
  this.setBubbleTarget(String.empty);

  /**
   * The event whose page is running this message, for a target of `self`.
   * @type {number}
   */
  this.setBubbleHostEventId(0);
};

/**
 * Extends {@link add}.<br/>
 * Also lifts the pop code out of the line before the line becomes something a player reads.
 *
 * Taken out here rather than while the message is being drawn, because by then the text has been
 * measured, broken into lines and handed to a window - and a code still sitting in it has occupied
 * width, pushed a wrap and, if anything failed to consume it, been rendered to the screen. The line
 * that reaches the message should already be the line the player sees.
 * @param {string} text One line of the message.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Game_Message.set('add', Game_Message.prototype.add);
Game_Message.prototype.add = function(text)
{
  const spoken = this.extractBubbleTarget(text);

  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Game_Message.get('add')
    .call(this, spoken);
};

/**
 * Reads the pop code out of a line, remembering what it named.
 * @param {string} text One line of the message.
 * @returns {string} The line without its pop code, or the line unchanged when it had none.
 */
Game_Message.prototype.extractBubbleTarget = function(text)
{
  const match = J.MESSAGE.EXT.BUBBLES.RegExp.PopTarget.exec(text);

  // the overwhelming majority of lines in any project are not the first line of a floating message.
  if (match === null) return text;

  const [ whole, target ] = match;
  this.setBubbleTarget(target);

  return text.replace(whole, String.empty);
};

/**
 * The target an author named for this message.
 * @returns {string} The contents of their `\pop[...]`, or empty when they wrote none.
 */
Game_Message.prototype.bubbleTarget = function()
{
  return this._bubbleTarget;
};

/**
 * Sets the target an author named for this message.
 * @param {string} target The contents of their `\pop[...]`.
 */
Game_Message.prototype.setBubbleTarget = function(target)
{
  this._bubbleTarget = target;
};

/**
 * The event whose page is running this message.
 * @returns {number} The event id, or zero when no event is running one.
 */
Game_Message.prototype.bubbleHostEventId = function()
{
  return this._bubbleHostEventId;
};

/**
 * Sets the event whose page is running this message.
 * @param {number} eventId The event id.
 */
Game_Message.prototype.setBubbleHostEventId = function(eventId)
{
  this._bubbleHostEventId = eventId;
};
//endregion Game_Message