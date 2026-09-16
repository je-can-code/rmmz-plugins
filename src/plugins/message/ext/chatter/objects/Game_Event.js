//region Game_Event
import ChatterManager from '../managers/ChatterManager.js';
import ChatterTagParser from '../services/ChatterTagParser.js';

/**
 * Extends {@link #setupPage}.<br/>
 * Reads whatever chatter the newly-active page declares and hands it to the manager.
 */
J.MESSAGE.EXT.CHATTER.Aliased.Game_Event.set('setupPage', Game_Event.prototype.setupPage);
Game_Event.prototype.setupPage = function()
{
  // perform original logic.
  J.MESSAGE.EXT.CHATTER.Aliased.Game_Event.get('setupPage')
    .call(this);

  // re-read this page's chatter now that we know which page is active.
  this.refreshDeclaredChatter();
};

/**
 * Declares whatever this event's active page has to say for itself.
 *
 * A page is the right home for chatter for the same reason it is the right home for a light: chatter
 * is a thing that can stop. A merchant who has closed up for the night is page two with no tags, and
 * the muttering ends with the page that described somebody willing to mutter. Nothing has to register
 * the event as chatty, and nothing has to remember to shut it up.
 */
Game_Event.prototype.refreshDeclaredChatter = function()
{
  const comments = this.chatterCommentTexts();
  const profile = ChatterTagParser.parseComments(comments);
  const token = ChatterManager.eventToken(this.eventId());

  ChatterManager.declare(token, profile);
};

/**
 * The text of every parsable comment on this event's active page.
 *
 * Comment blocks in the editor are stored as one command for the first line and another for each
 * line after it, and J-Base's comment reader honours both - so a chatter line written as the third
 * line of a block is found exactly like one written on its own.
 * @returns {string[]}
 */
Game_Event.prototype.chatterCommentTexts = function()
{
  const commands = this.getValidCommentCommands();

  return commands.map(command =>
  {
    const [ comment, ] = command.parameters;

    return comment;
  });
};
//endregion Game_Event