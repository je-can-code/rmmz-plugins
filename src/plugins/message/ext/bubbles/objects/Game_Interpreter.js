//region Game_Interpreter
/**
 * Extends {@link command101}.<br/>
 * Also tells the message which event is running it.
 *
 * `\pop[self]` means "whoever is speaking this line", and the interpreter is the only thing that
 * knows. By the time a window is involved the message has been handed over as text and the event it
 * came from is no longer part of the conversation, so the id is stashed on the way past.
 * @param {Array} params The parameters of the Show Text command.
 * @returns {boolean}
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Game_Interpreter.set('command101', Game_Interpreter.prototype.command101);
Game_Interpreter.prototype.command101 = function(params)
{
  // set before the original rather than after, because the original is what gathers the text lines -
  // and gathering a line is where its pop code gets read.
  $gameMessage.setBubbleHostEventId(this.eventId());

  // perform original logic.
  return J.MESSAGE.EXT.BUBBLES.Aliased.Game_Interpreter.get('command101')
    .call(this, params);
};
//endregion Game_Interpreter