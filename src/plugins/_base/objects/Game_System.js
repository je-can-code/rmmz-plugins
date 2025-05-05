/**
 * Extends {@link Game_System.initialize}.<br>
 * Initializes all members of this class and adds our custom members.
 */
J.BASE.Aliased.Game_System.set('initialize', Game_System.prototype.initialize);
Game_System.prototype.initialize = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_System.get('initialize')
    .call(this);

  // initialize our class members.
  this.initMembers();
};

/**
 * A hook for initializing additional members in {@link Game_System}.<br>
 */
Game_System.prototype.initMembers = function()
{
};

Game_System.prototype.gainAllEverything = function(count = 1)
{
  this.gainAllItems(count);
  this.gainAllWeapons(count);
  this.gainAllArmors(count);
};

Game_System.prototype.gainAllItems = function(count = 1)
{
  $dataItems
    .filter(this.canGainEntry)
    .forEach(entry => $gameParty.gainItem(entry, count));
};

Game_System.prototype.gainAllWeapons = function(count = 1)
{
  $dataWeapons
    .filter(this.canGainEntry)
    .forEach(entry => $gameParty.gainItem(entry, count));
};

Game_System.prototype.gainAllArmors = function(count = 1)
{
  $dataArmors
    .filter(this.canGainEntry)
    .forEach(entry => $gameParty.gainItem(entry, count));
};

/**
 * Whether or not an entry from the database can be gained in the context
 * of the various "gainAll*" methods.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} entry The database entry being gained.
 * @return {boolean} True if the entry can be gained, false otherwise.
 */
Game_System.prototype.canGainEntry = function(entry)
{
  // skip entries that are null.
  if (entry == null) return false;

  // skip entries with empty names.
  if (entry.name.trim().length === 0) return false;

  // skip entries that start with an underscore (arbitrary).
  if (entry.name.startsWith('_')) return false;

  // skip entries that start with a double equals (arbitrary).
  if (entry.name.startsWith('==')) return false;

  // skip entries that are the "empty" name (arbitrary).
  if (entry.name.includes('-- empty --')) return false;

  // we can gain it!
  return true;
};