//region Game_Party
import JABS_Stance from '../_models/JABS_Stance.js';

/**
 * Extends initialization to include the ally AI configurations.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Party.set('initMembers', Game_Party.prototype.initMembers);
Game_Party.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_Party.get('initMembers')
    .call(this);

  // initialize our ally ai members.
  this.initAllyAi();
};

/**
 * Initializes additional properties associated with ally ai.
 */
Game_Party.prototype.initAllyAi = function()
{
  /**
   * All encompassing object for storing my custom properties.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * A grouping of all properties associated with the ally ai JABS extension.
   */
  this._j._abs._allyAI ||= {};

  /**
   * The key of the stance the party's allies currently take.
   *
   * The key is what gets saved, never the stance itself, so a stance retuned in a later version reaches
   * every existing save as soon as it loads.
   * @type {string}
   */
  this._j._abs._allyAI._partyStance = J.ABS.EXT.ALLYAI.Metadata.DefaultStanceType;
};

/**
 * Gets the key of the stance the party's allies currently take.
 * @returns {string}
 */
Game_Party.prototype.getPartyStance = function()
{
  return this._j._abs._allyAI._partyStance;
};

/**
 * Sets the stance the party's allies take.
 * @param {string} stanceKey The key of the stance to take.
 */
Game_Party.prototype.setPartyStance = function(stanceKey)
{
  this._j._abs._allyAI._partyStance = stanceKey;
};

/**
 * Gets the stance the party's allies currently take.
 *
 * A key that names no stance falls back to the default one. The key is saved, so a save written before a
 * stance was retired still holds that stance's key, and it should load into a sensible stance rather than
 * into none at all.
 * @returns {JABS_Stance}
 */
Game_Party.prototype.getPartyStanceType = function()
{
  // the key the party has saved.
  const stanceKey = this.getPartyStance();

  // look it up among the stances this version offers.
  const { StanceTypes } = J.ABS.EXT.ALLYAI.Metadata;
  const stance = StanceTypes.find(stanceType => stanceType.key === stanceKey);

  // a key with no stance behind it gets the default stance instead.
  return stance ?? StanceTypes[0];
};

/**
 * Gets the key of the stance a number of rungs along the ladder from the party's current one.
 *
 * The stances are listed in ladder order, from hanging back behind the leader to leading the charge ahead
 * of them, so a positive step is bolder and a negative one is safer. The ladder does not wrap around: a
 * step past either end stays on the end rung, so stepping bolder from the boldest stance never sends the
 * party all the way back to the safest one.
 * @param {number} step How many rungs to move; positive is bolder, negative is safer.
 * @returns {string} The key of the stance that many rungs along, or of the end rung if the step runs out.
 */
Game_Party.prototype.stanceKeyAlongLadder = function(step)
{
  // where the party's stance sits on the ladder.
  const { StanceTypes } = J.ABS.EXT.ALLYAI.Metadata;
  const currentRung = StanceTypes.indexOf(this.getPartyStanceType());

  // the requested rung, held to the ladder's ends.
  const lastRung = StanceTypes.length - 1;
  const nextRung = JABS_Stance.clampToRange(currentRung + step, 0, lastRung);

  // the stance on that rung.
  return StanceTypes[nextRung].key;
};

/**
 * Extends {@link Game_Party.addActor}.<br/>
 * Also updates allies to accommodate the addition of the actor.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Party.set('addActor', Game_Party.prototype.addActor);
Game_Party.prototype.addActor = function(actorId)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_Party.get('addActor')
    .call(this, actorId);

  // update all allies when adding an actor to the party.
  $gameMap.updateAllies();
};

/**
 * Extends {@link Game_Party.removeActor}.<br/>
 * Also updates allies to accommodate the removal of the actor.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Party.set('removeActor', Game_Party.prototype.removeActor);
Game_Party.prototype.removeActor = function(actorId)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_Party.get('removeActor')
    .call(this, actorId);

  // update all allies when removing an actor from the party.
  $gameMap.updateAllies();
};
//endregion Game_Party