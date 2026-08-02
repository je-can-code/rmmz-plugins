//region Game_Party
import JaftingManager from './../managers/JaftingManager.js';

/**
 * Refinement party hooks: counters, refined-equip tracking, and `$data*` refresh helpers.<br>
 * When the last copy of a dynamic refinement row leaves the party, {@link JaftingSalvageManager} reclaims the slot and
 * writes {@link RPG_Weapon.createEmpty} / {@link RPG_Armor.createEmpty} back into `$dataWeapons` / `$dataArmors` so
 * indices stay hydrated blanks instead of `null`—keep any custom refresh paths consistent with that contract.
 */
J.JAFTING.EXT.REFINE.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.JAFTING.EXT.REFINE.Aliased.Game_Party.get('initialize')
    .call(this);

  // init the members.
  this.initJaftingRefinementMembers();
};

/**
 * Initializes all refinement-related JAFTING members of this class.
 */
Game_Party.prototype.initJaftingRefinementMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the jafting system.
   */
  this._j._refinement ||= {};

  /**
   * The provenance of every weapon that has been refined.
   * @type {JaftingRefinementLineage[]}
   */
  this._j._refinement._weapons = [];

  /**
   * The provenance of every armor that has been refined.
   * @type {JaftingRefinementLineage[]}
   */
  this._j._refinement._armors = [];

  /**
   * A collection of all current increment indices for refinable equipment types.
   * This ensures no refined equipment gets overwritten by another refined equipment.
   * @type {number}
   */
  this._j._refinement._increments = {};

  /**
   * The refinement increment index for weapons.
   * @type {number}
   */
  this._j._refinement._increments[JaftingManager.RefinementTypes.Weapon] = JaftingManager.StartingIndex;

  /**
   * The refinement increment index for armors.
   * @type {number}
   */
  this._j._refinement._increments[JaftingManager.RefinementTypes.Armor] = JaftingManager.StartingIndex;
};

/**
 * Gets the provenance of every weapon this party has refined.
 * @returns {JaftingRefinementLineage[]}
 */
Game_Party.prototype.getRefinedWeapons = function()
{
  return this._j._refinement._weapons;
};

/**
 * Gets the provenance of every armor this party has refined.
 * @returns {JaftingRefinementLineage[]}
 */
Game_Party.prototype.getRefinedArmors = function()
{
  return this._j._refinement._armors;
};

/**
 * Adds a newly refined weapon's provenance to the collection for tracking purposes.
 * @param {JaftingRefinementLineage} lineage The provenance of the newly refined weapon.
 */
Game_Party.prototype.addRefinedWeapon = function(lineage)
{
  this.getRefinedWeapons().push(lineage);
};

/**
 * Adds a newly refined armor's provenance to the collection for tracking purposes.
 * @param {JaftingRefinementLineage} lineage The provenance of the newly refined armor.
 */
Game_Party.prototype.addRefinedArmor = function(lineage)
{
  this.getRefinedArmors().push(lineage);
};

/**
 * Rebuilds every refined weapon from its provenance and writes it back into `$dataWeapons`.
 *
 * This runs on load rather than during decode on purpose. The loader steps back through
 * generations when one fails to read, so a decode that mutated `$dataWeapons` on its way to
 * throwing would leave a rejected generation's rows behind in the datastore. Replaying from a
 * post-load hook means the datastore is only ever touched by a load that actually succeeded.
 */
Game_Party.prototype.refreshDatabaseWeapons = function()
{
  this.getRefinedWeapons()
    .forEach(lineage =>
    {
      const updatedWeapon = JaftingManager.replayLineage(lineage);
      $dataWeapons[updatedWeapon._key()] = updatedWeapon;
    });
};

/**
 * Rebuilds every refined armor from its provenance and writes it back into `$dataArmors`.
 *
 * Twin of {@link Game_Party#refreshDatabaseWeapons}; the same reasoning about when it runs applies.
 */
Game_Party.prototype.refreshDatabaseArmors = function()
{
  this.getRefinedArmors()
    .forEach(lineage =>
    {
      const updatedArmor = JaftingManager.replayLineage(lineage);
      $dataArmors[updatedArmor._key()] = updatedArmor;
    });
};

/**
 * Gets the current increment for a particular datastore's latest index.
 * @param {string} refinementType One of the refinement types.
 * @returns {number}
 */
Game_Party.prototype.getRefinementCounter = function(refinementType)
{
  return this.increments()[refinementType];
};

/**
 * Increments the refinement index for a particular datastore.
 * @param {string} refinementType One of the refinement types.
 */
Game_Party.prototype.incrementRefinementCounter = function(refinementType)
{
  this.increments()[refinementType]++;
};

//region properties
/**
 * Gets how many times each item has been refined by this party.
 * @returns {Object<number, number>} The refinement count per item id.
 */
Game_Party.prototype.increments = function()
{
  // hand back the increments.
  return this._j._refinement._increments;
};
//endregion properties
//endregion Game_Party