//region Window_PassiveDetail
import ConditionalNotetagDescriptions from '../core/describeConditionalNotetags.js';

/**
 * Extends {@link Window_PassiveDetail#drawStateHeader}.<br/>
 * Also draws, under the header, a line for every tag of this plugin's on the state: what it grants or uses on its own
 * and on what condition, what gates or counts its passives, and what takes its stacks away. The words are the game's,
 * from its tag lines config.
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

  // then a line for each of this plugin's tags on the state.
  this.drawConditionalLines(state);
};

/**
 * Draws the line describing each of this plugin's tags on the state, one beneath the next, in the order the plugin
 * lists them.
 *
 * Every line arrives as finished text, so the window only draws it: what a line says, and whether a tag says anything
 * at all, is up to the describers and the config.
 * @param {RPG_State} state The state being detailed.
 */
Window_PassiveDetail.prototype.drawConditionalLines = function(state)
{
  // only this plugin's tags, since the other plugins' effects have sections of their own.
  const structures = ConditionalNotetagDescriptions.structures();
  const lines = NotetagDescriber.linesForTags(state, structures);

  const width = this.innerWidth - 4;

  // each line beneath the last, with a little room before the next.
  lines.forEach(({ text }) =>
  {
    this.drawWrappedLine(text, width);
    this.currentY += 4;
  });
};

/**
 * Draws one line across the panel, carried onto the rows beneath it when it is too long for one rather than running
 * off the panel's edge.
 * @param {string} text The line, text codes and all.
 * @param {number} width The width the line may take.
 */
Window_PassiveDetail.prototype.drawWrappedLine = function(text, width)
{
  // the line broken wherever it would run past the panel, keeping any color or bold across the break.
  const pieces = TextWrapper.wrapStyled(text, width, piece => this.textSizeEx(piece).width);

  // each piece beneath the last, as tall as it draws.
  pieces.forEach(piece =>
  {
    this.drawTextEx(piece, 4, this.currentY, width);
    this.currentY += this.textSizeEx(piece).height;
  });
};
//endregion Window_PassiveDetail