//region JABS_Engine

/**
 * The enemy used by the engine for map damage skill executions.
 * @type {JABS_Battler}
 */
JABS_Engine.prototype.mapDamageBattler = null;

/**
 * The enemy used by the engine for map damage skill executions.
 * @type {JABS_Battler}
 */
JABS_Engine.prototype.getMapDamageBattler = function()
{
  return this.mapDamageBattler;
};

/**
 * Initializes a new {@link JABS_Battler} based on the given id.<br/>
 * This dummy enemy is used for things like forced skill executions on
 * the map needing an enemy to execute.
 * @param {number} dummyEnemyId The id of the enemy in the database to represent the dummy.
 * @param {boolean} isFriendly Whether or not this dummy is an allied dummy.
 */
JABS_Engine.prototype.setMapDamageBattler = function(dummyEnemyId, isFriendly)
{
  const coreData = JABS_BattlerCoreData.Builder()
    .setBattlerId(dummyEnemyId)
    .isDummy(isFriendly)
    .build();
  this.mapDamageBattler = new JABS_Battler(
    $gamePlayer, // irrelevant, but should be some event/character on the current map.
    $gameEnemies.enemy(dummyEnemyId),
    coreData);
};
//endregion JABS_Engine