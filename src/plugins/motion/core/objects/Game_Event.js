//region Game_Event
import MotionTagParser from '../core/MotionTagParser.js';
import CharacterMotionComposer from '../managers/CharacterMotionComposer.js';

/**
 * Extends {@link #setupPage}.<br/>
 * Reads whatever motions the newly-active page declares and hands them to the composer.
 */
J.MOTION.Aliased.Game_Event.set('setupPage', Game_Event.prototype.setupPage);
Game_Event.prototype.setupPage = function()
{
  // perform original logic.
  J.MOTION.Aliased.Game_Event.get('setupPage')
    .call(this);

  // re-read this page's motions now that we know which page is active.
  this.refreshDeclaredMotions();
};

/**
 * Declares whatever motions this event's active page asks for.
 *
 * This runs far more often than a page actually changes — `Game_Map#refresh` re-runs page setup for
 * every event on the map whenever a single self-switch flips. The composer compares the incoming
 * declarations against what it already holds and does nothing when they agree, which is what keeps
 * a room full of enemies from snapping mid-breath every time a chest is opened.
 */
Game_Event.prototype.refreshDeclaredMotions = function()
{
  const comments = this.motionCommentTexts();
  const declarations = MotionTagParser.parseComments(comments, 'page');

  CharacterMotionComposer.declare(this, 'page', declarations);
};

/**
 * The text of every parsable comment on this event's active page.
 *
 * Comment blocks in the editor are stored as one command for the first line and another for each
 * line after it, and J-Base's comment reader honours both — so a motion tag written on the third
 * line of a block is found exactly like one written on its own.
 * @returns {string[]}
 */
Game_Event.prototype.motionCommentTexts = function()
{
  const commands = this.getValidCommentCommands();

  return commands.map(command =>
  {
    const [ comment, ] = command.parameters;

    return comment;
  });
};
//endregion Game_Event