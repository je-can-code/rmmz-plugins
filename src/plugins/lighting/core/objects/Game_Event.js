//region Game_Event
import LightingTagParser from '../core/LightingTagParser.js';
import ScreenLightingComposer from '../managers/ScreenLightingComposer.js';

/**
 * Extends {@link #setupPage}.<br/>
 * Reads whatever lights the newly-active page declares and hands them to the composer.
 */
J.LIGHTING.Aliased.Game_Event.set('setupPage', Game_Event.prototype.setupPage);
Game_Event.prototype.setupPage = function()
{
  // perform original logic.
  J.LIGHTING.Aliased.Game_Event.get('setupPage')
    .call(this);

  // re-read this page's lights now that we know which page is active.
  this.refreshDeclaredLights();
};

/**
 * Declares whatever lights this event's active page asks for.
 *
 * A page is the right home for a light because a light is a thing that can stop. An unlit torch is
 * page one with no tag; setting it alight is a self-switch and page two, and the light arrives with
 * the page that describes a burning torch. Nothing has to register the event as ignitable, and
 * nothing has to remember to put the light out.
 *
 * This runs far more often than a page actually changes - `Game_Map#refresh` re-runs page setup for
 * every event on the map whenever a single self-switch flips anywhere. The composer compares the
 * incoming declarations against what it already holds and does nothing when they agree.
 */
Game_Event.prototype.refreshDeclaredLights = function()
{
  const sourceKey = this.lightingSourceKey();
  const comments = this.lightingCommentTexts();
  const declarations = LightingTagParser.parseComments(comments, this, sourceKey);

  ScreenLightingComposer.declareLights(sourceKey, declarations);
};

/**
 * The source key under which this event's lights are declared.
 *
 * Every event needs its own key because the composer holds one set of declarations for the whole
 * screen rather than one per character. A shared `page` key would mean each torch on a map wiped out
 * the one declared before it, and the last event to refresh would be the only thing still burning.
 * @returns {string}
 */
Game_Event.prototype.lightingSourceKey = function()
{
  return `page:${this.eventId()}`;
};

/**
 * The text of every parsable comment on this event's active page.
 *
 * Comment blocks in the editor are stored as one command for the first line and another for each
 * line after it, and J-Base's comment reader honours both - so a light tag written on the third line
 * of a block is found exactly like one written on its own.
 * @returns {string[]}
 */
Game_Event.prototype.lightingCommentTexts = function()
{
  const commands = this.getValidCommentCommands();

  return commands.map(command =>
  {
    const [ comment, ] = command.parameters;

    return comment;
  });
};
//endregion Game_Event