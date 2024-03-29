//region Game_Party
/**
 * Extends {@link #initialize}.<br>
 * Also initializes our jafting members.
 */
J.JAFTING.EXT.REFINE.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.JAFTING.EXT.REFINE.Aliased.Game_Party.get('initialize').call(this);

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
   * A collection of all weapons that have been refined.
   * @type {RPG_EquipItem[]}
   */
  this._j._refinement._weapons = [];

  /**
   * A collection of all armors that have been refined.
   * @type {RPG_EquipItem[]}
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
 * Gets all tracked weapons that have been refined.
 * @returns {RPG_EquipItem[]}
 */
Game_Party.prototype.getRefinedWeapons = function()
{
  return this._j._refinement._weapons;
};

/**
 * Gets all tracked armors that have been refined.
 * @returns {RPG_EquipItem[]}
 */
Game_Party.prototype.getRefinedArmors = function()
{
  return this._j._refinement._armors;
};

/**
 * Adds a newly refined weapon to the collection for tracking purposes.
 * @param {RPG_EquipItem} equip The newly refined weapon.
 */
Game_Party.prototype.addRefinedWeapon = function(equip)
{
  this._j._refinement._weapons.push(equip);
};

/**
 * Adds a newly refined armor to the collection for tracking purposes.
 * @param {RPG_EquipItem} equip The newly refined armor.
 */
Game_Party.prototype.addRefinedArmor = function(equip)
{
  this._j._refinement._armors.push(equip);
};

/**
 * Updates the $dataWeapons collection to include the player's collection of
 * refined weapons.
 */
Game_Party.prototype.refreshDatabaseWeapons = function()
{
  this.getRefinedWeapons().forEach(weapon =>
  {
    const updatedWeapon = new RPG_Weapon(weapon, weapon.index);
    $dataWeapons[updatedWeapon._key()] = updatedWeapon;
  });
};

/**
 * Updates the $dataArmors collection to include the player's collection of
 * refined armors.
 */
Game_Party.prototype.refreshDatabaseArmors = function()
{
  this.getRefinedArmors().forEach(armor =>
  {
    const updatedArmor = new RPG_Armor(armor, armor.index);
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
  return this._j._refinement._increments[refinementType];
};

/**
 * Increments the refinement index for a particular datastore.
 * @param {string} refinementType One of the refinement types.
 */
Game_Party.prototype.incrementRefinementCounter = function(refinementType)
{
  this._j._refinement._increments[refinementType]++;
};
//endregion Game_Party