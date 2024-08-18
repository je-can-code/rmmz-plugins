//region Game_Interpreter
/**
 * Extends {@link setupChoices}.<br/>
 * Backs up the original choices identified by the completed setup.
 */
J.MESSAGE.Aliased.Game_Interpreter.set('setupChoices', Game_Interpreter.prototype.setupChoices);
Game_Interpreter.prototype.setupChoices = function(params)
{
  // perform original choice setup logic.
  J.MESSAGE.Aliased.Game_Interpreter.get('setupChoices').call(this, params);

  // also backup the original options.
  $gameMessage.backupChoices();

  // add a hook for evaluating visibility of choices.
  this.evaluateChoicesForVisibility(params);
};

/**
 * A hook for evaluating visibility of choices programmatically.
 * @param {rm.types.EventCommand[]} params The choices parameters being setup.
 */
Game_Interpreter.prototype.evaluateChoicesForVisibility = function(params)
{
};

/**
 * Sets a choice to be hidden- or not. The choiceIndex parameter is 0-based. Set the shouldHide parameter to true for a
 * given choice to hide it.
 * @param {number} choiceIndex The 1-based number of the choice.
 * @param {boolean=} shouldHide Whether or not the choice should be hidden; defaults to true.
 */
Game_Interpreter.prototype.setChoiceHidden = function(choiceIndex, shouldHide = true)
{
  // hide it- or don't.
  $gameMessage.hideChoice(choiceIndex, shouldHide);
};
//endregion Game_Interpreter