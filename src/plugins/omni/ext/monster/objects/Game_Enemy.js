//region Game_Enemy
/**
 * Gets the {@link MonsterpediaObservations} associated with this enemy.
 * If none exists yet, one will be initialized.
 * @returns {MonsterpediaObservations}
 */
Game_Enemy.prototype.getMonsterPediaObservations = function()
{
  return $gameParty.getOrCreateMonsterpediaObservationsById(this.battlerId());
};

/**
 * Extends {@link #onDeath}.<br/>
 * Also updates the monsterpedia observations for this enemy.
 */
J.OMNI.EXT.MONSTER.Aliased.Game_Enemy.set('onDeath', Game_Enemy.prototype.onDeath);
Game_Enemy.prototype.onDeath = function()
{
  // perform original logic.
  J.OMNI.EXT.MONSTER.Aliased.Game_Enemy.get('onDeath')
    .call(this);

  // increment the counter for how many times we've defeated this enemy.
  this.updateMonsterpediaObservation();
};

/**
 * Updates the monsterpedia observation associated with this enemy on-death.
 */
Game_Enemy.prototype.updateMonsterpediaObservation = function()
{
  // increment the counter for how many times we've defeated this enemy.
  this.incrementDefeatCount();

  // learn the name of the enemy in the monsterpedia.
  this.learnMonsterpediaName();

  // deduce the monster family of the enemy.
  this.learnMonsterpediaFamily();

  // discern a description of the enemy.
  this.learnMonsterpediaDescription();

  // project the parameters of the enemy.
  this.learnMonsterpediaParameters();
};

/**
 * Increment the death counter for this particular enemy.
 */
Game_Enemy.prototype.incrementDefeatCount = function()
{
  // grab the observations for this enemy.
  const observations = this.getMonsterPediaObservations();

  // increment the defeat count.
  observations.numberDefeated++;
};

/**
 * Enables the visibility of the enemy's name in the monsterpedia
 * for this monster.
 */
Game_Enemy.prototype.learnMonsterpediaName = function()
{
  // grab the observations for this enemy.
  const observations = this.getMonsterPediaObservations();

  // identify the name of the enemy.
  observations.knowsName = true;
};

/**
 * Enables the visibility of the enemy's family in the monsterpedia
 * for this monster.
 */
Game_Enemy.prototype.learnMonsterpediaFamily = function()
{
  // grab the observations for this enemy.
  const observations = this.getMonsterPediaObservations();

  // deduce the monster family of the enemy.
  observations.knowsFamily = true;
};

/**
 * Enables the visibility of the enemy's description in the monsterpedia
 * for this monster.
 */
Game_Enemy.prototype.learnMonsterpediaDescription = function()
{
  // grab the observations for this enemy.
  const observations = this.getMonsterPediaObservations();

  // discern a description of the enemy.
  observations.knowsDescription = true;
};

/**
 * Enables the visibility of the enemy's parameters in the monsterpedia
 * for this monster.
 */
Game_Enemy.prototype.learnMonsterpediaParameters = function()
{
  // grab the observations for this enemy.
  const observations = this.getMonsterPediaObservations();

  // project the parameters of the enemy.
  observations.knowsParameters = true;
};

/**
 * Extends {@link #postProcessDroppedLoot}.<br/>
 * Also observes each drop dropped for monsterpedia purposes.
 *
 * Observes the **incoming** list rather than the returned one, deliberately. What arrives here is the
 * loot as this enemy's database rows describe it; what leaves may have been promoted up a drop
 * upgrade ladder into rows the enemy does not list at all. The pedia unmasks an enemy's own drop
 * entries by their base ids, so a promoted row would both credit the wrong entry and leave the real
 * one masked forever. The drop dropped- it merely also got upgraded on the way out.
 * @param {RPG_BaseItem[]} itemsFound The loot that successfully dropped, before modifiers.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {RPG_BaseItem[]}
 */
J.OMNI.EXT.MONSTER.Aliased.Game_Enemy.set('postProcessDroppedLoot', Game_Enemy.prototype.postProcessDroppedLoot);
Game_Enemy.prototype.postProcessDroppedLoot = function(itemsFound, killer = null)
{
  // observe the drops as the enemy actually listed them; an empty haul observes nothing on its own.
  itemsFound.forEach(this.observeDrop, this);

  // perform original logic.
  return J.OMNI.EXT.MONSTER.Aliased.Game_Enemy.get('postProcessDroppedLoot')
    .call(this, itemsFound, killer);
};

/**
 * Observes a given drop, and records it in the monsterpedia if applicable.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} drop The drop to observe.
 */
Game_Enemy.prototype.observeDrop = function(drop)
{
  // grab the observations of this monster.
  const observations = this.getMonsterPediaObservations();

  // extract the drop data.
  const {
    kind: dropType,
    id: dropId
  } = drop;

  // don't process the drop if its already known.
  if (observations.isDropKnown(dropType, dropId)) return;

  // observe the drop.
  observations.addKnownDrop(dropType, dropId);
};

/**
 * Observes a given element, and records it in the monsterpedia if applicable.
 * @param {number} elementId The element id to observe.
 */
Game_Enemy.prototype.observeElement = function(elementId)
{
  // grab the observations of this monster.
  const observations = this.getMonsterPediaObservations();

  // don't process the element if its already known.
  if (observations.isElementalisticKnown(elementId)) return;

  // observe the element.
  observations.addKnownElementalistic(elementId);
};
//endregion Game_Enemy