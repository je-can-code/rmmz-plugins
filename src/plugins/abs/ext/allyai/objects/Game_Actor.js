//region Game_Actor
import JABS_AllyAI from './../_models/JABS_AllyAI.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Also tracks JABS ally AI.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_Actor.get('initMembers')
    .call(this);

  // init the additional members.
  this.initAllyAiMembers();
};

/**
 * Initializes all members associated with the JABS extension of Ally AI.
 */
Game_Actor.prototype.initAllyAiMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  // policy step inside init ally ai members.
  this._j ||= {};

  // policy step inside init ally ai members.
  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  // policy step inside init ally ai members.
  /**
   * A grouping of all properties associated with the ally AI extension.
   */
  this._j._abs._allyAi ||= {};

  // policy step inside init ally ai members.
  /**
   * The currently selected Ally AI mode.
   * @type {JABS_AllyAI|null}
   */
  this._j._abs._allyAi._mode = new JABS_AllyAI(JABS_AllyAI.presets.GENERALIST.key);
};

/**
 * Extends {@link #setup}.<br/>
 * Also initializes ally AI.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Actor.set('setup', Game_Actor.prototype.setup);
Game_Actor.prototype.setup = function(actorId)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_Actor.get('setup')
    .call(this, actorId);

  // also initialize the ally's AI.
  this.initAllyAI();
};

/**
 * Initializes the ally ai for this battler.
 */
Game_Actor.prototype.initAllyAI = function()
{
  // grab the default ally AI mode for this actor.
  const defaultAllyAiMode = this.getDefaultAllyAI();

  // apply the default preset to this ally's AI.
  this.setAllyAIPreset(defaultAllyAiMode);
};

/**
 * Get the current ally AI mode for this ally.
 * @returns {JABS_AllyAI}
 */
Game_Actor.prototype.getAllyAI = function()
{
  if (!this._j._abs._allyAi)
  {
    this.initAllyAiMembers();
  }

  // hand back this._j._abs._allyAi._mode to the caller.
  return this._j._abs._allyAi._mode;
}

/**
 * Applies an ally AI preset to this ally by preset key.
 * @param {string} presetKey The key of the preset to apply.
 */
Game_Actor.prototype.setAllyAIPreset = function(presetKey)
{
  this._j._abs._allyAi._mode.applyPreset(presetKey);
};

/**
 * Gets the default ally AI mode associated with an actor.
 * The priority for the AI mode is class > actor > default.
 * @returns {string}
 */
Game_Actor.prototype.getDefaultAllyAI = function()
{
  // if there is no actor id, then don't try this yet.
  if (!this._actorId) return null;

  // extract the ally ai mode from the actor.
  const actorMode = RPGManager.getStringFromNoteByRegex(
    this.actor(),
    J.ABS.EXT.ALLYAI.RegExp.DefaultAi,
    true);

  // extract the ally ai mode from the class.
  const classMode = RPGManager.getStringFromNoteByRegex(
    this.currentClass(),
    J.ABS.EXT.ALLYAI.RegExp.DefaultAi,
    true);

  // priority is class > actor > default, for ally ai mode.
  const allyAiMode = classMode ?? actorMode;

  // validate the preset provided.
  if (JABS_AllyAI.validatePreset(allyAiMode))
  {
    // if validation succeeds, then return what was in the notes.
    return allyAiMode;
  }

  // return the default of "generalist" for ally ai.
  return JABS_AllyAI.presets.GENERALIST.key;
};

/**
 * Gets all skill slots that have skills assigned to them- excluding the tool slot.
 * @returns {JABS_SkillSlot[]}
 */
Game_Actor.prototype.getValidSkillSlotsForAlly = function()
{
  // hand back this.getSkillSlotManager() to the caller.
  return this.getSkillSlotManager()
    .getEquippedAllySlots();
};
//endregion Game_Actor