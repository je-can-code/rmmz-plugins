//region Game_Event
import Escription from './../_models/Escription.js';

//region properties
/**
 * Hooks into the initialization to add our members for containing event data.
 */
J.ESCRIBE.Aliased.Game_Event.set('initMembers', Game_Event.prototype.initMembers);
Game_Event.prototype.initMembers = function()
{
  // perform original logic.
  J.ESCRIBE.Aliased.Game_Event.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with escriptions.
   */
  this._j._event ||= {};

  /**
   * Everything this event currently declares floating above itself.
   *
   * An empty list is the ordinary state and means the event describes nothing- it is also what an
   * event that used to describe something looks like after a page change, which is what lets the
   * sprite layer discover a removal by the same comparison it discovers an addition with.
   * @type {Escription[]}
   */
  this._j._event._escriptions = [];
};

/**
 * Gets everything this event declares floating above itself.
 * @returns {Escription[]} The escriptions; empty when this event describes nothing.
 */
Game_Event.prototype.escriptions = function()
{
  return this._j._event._escriptions;
};

/**
 * Sets everything this event declares floating above itself.
 * @param {Escription[]} escriptions The escriptions parsed from the current page.
 */
Game_Event.prototype.setEscriptions = function(escriptions)
{
  this._j._event._escriptions = escriptions;
};

/**
 * Whether this event declares anything floating above itself.
 * @returns {boolean}
 */
Game_Event.prototype.hasEscriptions = function()
{
  return this.escriptions().length > 0;
};
//endregion properties

/**
 * Extends the page settings for events and adds on custom parameters to this event.
 */
J.ESCRIBE.Aliased.Game_Event.set('setupPage', Game_Event.prototype.setupPage);
Game_Event.prototype.setupPage = function()
{
  // perform original logic.
  J.ESCRIBE.Aliased.Game_Event.get('setupPage')
    .call(this);

  // a new page can describe something else entirely, so re-read the comments.
  this.parseEscriptionComments();
};

/**
 * Determines whether or not we can parse the comments for escription data.
 * @returns {boolean} True if we can, false otherwise.
 */
Game_Event.prototype.canParseEscriptionComments = function()
{
  // don't try to do things with actions- they are volatile.
  if (J.ABS && (this.isJabsAction() || this.isJabsLoot())) return false;

  // don't try to parse events that aren't "present".
  if (this.pageIndex() === -1 || this.pageIndex() === -2) return false;

  // we can parse!
  return true;
};

/**
 * Parses the event comments to discern what this event describes, if anything.
 *
 * **Every `<text>` tag on the page is its own line**, in the order they were written. That falls out
 * of how RMMZ stores a comment box- one command per line- so an author writing three lines into one
 * box gets three lines above the event, which is the shape the data was already in.
 *
 * The text lines come first and the icon last, and that order is a contract rather than an
 * accident: the sprite layer pairs a sprite back to what it draws by index rather than by holding
 * the escription, so both sides have to agree on the sequence.
 */
Game_Event.prototype.parseEscriptionComments = function()
{
  // an event we are not allowed to read keeps whatever it was already saying.
  if (!this.canParseEscriptionComments()) return;

  // one view of the comments serves every tag below, which is also what lets RPGManager's note
  // cache answer the second and later reads instead of rescanning the same lines four times.
  const commentNote = this.commentNote();

  // collect whatever this page declares.
  const escriptions = [];

  // every text tag on the page becomes a line.
  const lines = RPGManager.getStringsFromNoteByRegex(commentNote, J.ESCRIBE.RegExp.Text);
  if (lines.length > 0)
  {
    // the lines share one proximity, because they are one block of text rather than several
    // independent things that happen to be stacked.
    const declaredRange = RPGManager.getNumberFromNoteByRegex(commentNote, J.ESCRIBE.RegExp.ProximityText, true);
    const proximity = declaredRange ?? Escription.ALWAYS_VISIBLE;

    lines.forEach(line => escriptions.push(new Escription(Escription.Kinds.Text, line, proximity)));
  }

  // an icon is declared by naming an index on the sheet. null rather than a sentinel is the ask
  // here, because zero is a real index and would otherwise be indistinguishable from "absent".
  const iconIndex = RPGManager.getNumberFromNoteByRegex(commentNote, J.ESCRIBE.RegExp.IconIndex, true);
  if (iconIndex !== null)
  {
    const declaredRange = RPGManager.getNumberFromNoteByRegex(commentNote, J.ESCRIBE.RegExp.ProximityIcon, true);
    const proximity = declaredRange ?? Escription.ALWAYS_VISIBLE;

    escriptions.push(new Escription(Escription.Kinds.Icon, iconIndex, proximity));
  }

  // an empty list is a legitimate answer and is how an event stops describing anything.
  this.setEscriptions(escriptions);
};

/**
 * Extends {@link Game_Event.update}.<br/>
 * Also tracks whether the player has come close enough to see this event's escriptions.
 */
J.ESCRIBE.Aliased.Game_Event.set('update', Game_Event.prototype.update);
Game_Event.prototype.update = function()
{
  // perform original logic.
  J.ESCRIBE.Aliased.Game_Event.get('update')
    .call(this);

  // keep the proximity-gated escriptions aware of where the player is standing.
  this.updateEscriptionProximity();
};

/**
 * Updates whether the player is close enough to see each proximity-gated escription.
 */
Game_Event.prototype.updateEscriptionProximity = function()
{
  // an escription with no proximity requirement is always visible, and most events have none at
  // all- either way there is no distance here worth measuring.
  const gated = this.escriptions()
    .filter(escription => escription.hasProximity());
  if (gated.length === 0) return;

  // measure once; everything on this event is exactly as far from the player as the event is.
  const distance = this.distanceFromPlayer();

  // tell each of them whether the player has arrived.
  gated.forEach(escription => escription.setPlayerNearby(escription.proximityRange() >= distance));
};
//endregion Game_Event