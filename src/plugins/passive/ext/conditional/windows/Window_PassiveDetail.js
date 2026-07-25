//region Window_PassiveDetail
import AutoApplyStateDisplay from '../models/AutoApplyStateDisplay.js';
import AutoInflictStateDisplay from '../models/AutoInflictStateDisplay.js';
import RemoveStateOnMoveDisplay from '../models/RemoveStateOnMoveDisplay.js';
/**
 * Extends {@link Window_PassiveDetail#drawStateHeader}.<br/>
 * Injects autoApplyState (stand condition), autoInflictState, and removeStateOnMove prose
 * under the header.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Window_PassiveDetail.set(
  'drawStateHeader',
  Window_PassiveDetail.prototype.drawStateHeader);
Window_PassiveDetail.prototype.drawStateHeader = function(state)
{
  // perform original logic (icon, name, database description).
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Window_PassiveDetail
    .get('drawStateHeader')
    .call(this, state);

  // render stand autoApplyState tags as prose with inline \\state[id] names.
  this.drawAutoApplyStandProse(state);

  // render autoInflictState tags as prose (fires when this battler inflicts a state on someone).
  this.drawAutoInflictStateProse(state);

  // render removeStateOnMove tags as prose (pairs with stand autoApplyState).
  this.drawRemoveStateOnMoveProse(state);
};

/**
 * Draws player-facing prose for each stand {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyState} tag.
 * Skipped when the state carries no stand auto-apply rules.
 * @param {RPG_State} state The state being detailed.
 */
Window_PassiveDetail.prototype.drawAutoApplyStandProse = function(state)
{
  const lines = AutoApplyStateDisplay.collectStandProseLines(state, this);

  if (lines.length === 0) return;

  const width = this.innerWidth - 4;

  lines.forEach(text =>
  {
    this.drawTextEx(text, 4, this.currentY, width);
    this.currentY += this.textSizeEx(text).height + 4;
  });
};

/**
 * Draws player-facing prose for each {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoInflictState} tag.
 * Skipped when the state carries no auto-inflict rules.
 * @param {RPG_State} state The state being detailed.
 */
Window_PassiveDetail.prototype.drawAutoInflictStateProse = function(state)
{
  const lines = AutoInflictStateDisplay.collectProseLines(state, this);

  if (lines.length === 0) return;

  const width = this.innerWidth - 4;

  lines.forEach(text =>
  {
    this.drawTextEx(text, 4, this.currentY, width);
    this.currentY += this.textSizeEx(text).height + 4;
  });
};

/**
 * Draws player-facing prose for each {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveStateOnMove} tag.
 * Skipped when the state carries no move-removal rules.
 * @param {RPG_State} state The state being detailed.
 */
Window_PassiveDetail.prototype.drawRemoveStateOnMoveProse = function(state)
{
  const lines = RemoveStateOnMoveDisplay.collectProseLines(state, this);

  if (lines.length === 0) return;

  const width = this.innerWidth - 4;

  lines.forEach(text =>
  {
    this.drawTextEx(text, 4, this.currentY, width);
    this.currentY += this.textSizeEx(text).height + 4;
  });
};
//endregion Window_PassiveDetail
