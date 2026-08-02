/* eslint-disable no-unused-vars */

//region Game_Actor
import RPG_State from './../database/implementations/RPG_State.js';
import RPG_Skill from './../database/implementations/RPG_Skill.js';
import RPG_EquipItem from './../database/core/RPG_EquipItem.js';
import RPG_Class from './../database/implementations/RPG_Class.js';
import RPG_Actor from './../database/implementations/RPG_Actor.js';
/**
 * The underlying database data for this battler.
 *
 * This allows operations to be performed against both actor and enemy indifferently.
 * @returns {number}
 */
Game_Actor.prototype.battlerId = function()
{
  return this.actorId();
};

/**
 * The underlying database data for this actor.
 * @returns {RPG_Actor}
 */
Game_Actor.prototype.databaseData = function()
{
  return this.actor();
};

//region properties
/**
 * Gets the skill ids this actor has actually learned.
 *
 * This is only the learned list. Trait-granted skills live in {@link Game_Actor#addedSkills},
 * and {@link Game_Actor#skillIds} is the union of the two.
 * @returns {number[]} The learned skill ids.
 */
Game_Actor.prototype.learnedSkillIds = function()
{
  // hand back the learned list on its own.
  return this._skills;
};

/**
 * Gets the equipped items as their `Game_Item` wrappers.
 *
 * This is deliberately not {@link Game_Actor#equips}, which unwraps each slot into its database
 * row. Anything comparing or snapshotting equipment needs the wrappers, since two different
 * wrappers can point at the same row.
 * @returns {Game_Item[]} The raw, slot-ordered equipment wrappers.
 */
Game_Actor.prototype.rawEquips = function()
{
  // hand back the wrappers rather than the rows they point at.
  return this._equips;
};
//endregion properties

/**
 * Gets the raw skill ids known to this actor.
 * Combines the actor's learned skill list with any bonus skill ids granted by traits,
 * then deduplicates so each id appears at most once.
 * @returns {number[]}
 */
Game_Actor.prototype.skillIds = function()
{
  // merge learned skills and trait-granted skill ids into a single deduplicated list.
  return [ ...new Set(this.learnedSkillIds()
    .concat(this.addedSkills())) ];
};

/**
 * Determines whether or not this actor is the leader.
 * @returns {boolean}
 */
Game_Actor.prototype.isLeader = function()
{
  return $gameParty.leader() === this;
};

/**
 * Gets all notes associated with the actor and its class.
 * @returns {[RPG_Actor,RPG_Class]}
 */
Game_Actor.prototype.getActorNotes = function()
{
  // grab reference to the actor.
  const actor = this.actor();

  // return a collection of all things related to this actor.
  return [
    // add the actor itself to the source list.
    actor,

    // add the actor's class to the source list.
    this.class(actor.classId)
  ];
};

/**
 * All sources this actor battler has available to it.
 * @returns {(RPG_Actor|RPG_State|RPG_Class|RPG_Skill|RPG_EquipItem)[]}
 */
Game_Actor.prototype.getNotesSources = function()
{
  // get the super-classes' note sources as a baseline.
  const baseNoteSources = Game_Battler.prototype.getNotesSources.call(this);

  // the list of note sources unique to actors.
  const actorUniqueNoteSources = [
    // add the actor's class to the source list.
    this.currentClass(),

    // add all of the actor's valid equips to the source list.
    ...this.equippedEquips(),
  ];

  // combine the two source lists.
  const combinedNoteSources = baseNoteSources.concat(actorUniqueNoteSources);

  // return our combination.
  return combinedNoteSources;
};

/**
 * Extends {@link #setup}.<br/>
 * Adds a hook for performing actions when an actor is setup.
 */
J.BASE.Aliased.Game_Actor.set('setup', Game_Actor.prototype.setup);
Game_Actor.prototype.setup = function(actorId)
{
  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('setup')
    .call(this, actorId);

  // execute the on-setup hook.
  this.onSetup(actorId);
};

/**
 * A hook for performing actions when an actor is setup.
 * @param {number} actorId The actor's id.
 */
Game_Actor.prototype.onSetup = function(actorId)
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Extends {@link #learnSkill}.<br/>
 * Adds a hook for performing actions when a new skill is learned.
 * If the skill is already known, it will not trigger any on-skill-learned effects.
 */
J.BASE.Aliased.Game_Actor.set('learnSkill', Game_Actor.prototype.learnSkill);
Game_Actor.prototype.learnSkill = function(skillId)
{
  // check if we don't already know the skill.
  if (!this.isLearnedSkill(skillId))
  {
    // execute the on-learn-new-skill hook.
    this.onLearnNewSkill(skillId);
  }

  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('learnSkill')
    .call(this, skillId);
};

/**
 * A hook for performing actions when an actor learns a new skill.
 * @param {number} skillId The skill id of the skill learned.
 */
Game_Actor.prototype.onLearnNewSkill = function(skillId)
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Extends {@link #learnSkill}.<br/>
 * Adds a hook for performing actions when a new skill is learned.
 * If the skill is already known, it will not trigger any on-skill-learned effects.
 */
J.BASE.Aliased.Game_Actor.set('forgetSkill', Game_Actor.prototype.forgetSkill);
Game_Actor.prototype.forgetSkill = function(skillId)
{
  // you cannot forget a skill you do not know.
  if (this.isLearnedSkill(skillId))
  {
    // execute the on-forget-skill hook.
    this.onForgetSkill(skillId);
  }

  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('forgetSkill')
    .call(this, skillId);
};

/**
 * A hook for performing actions when a battler forgets a skill.
 * @param {number} skillId The skill id of the skill forgotten.
 */
Game_Actor.prototype.onForgetSkill = function(skillId)
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Extends {@link #die}.<br/>
 * Adds a toggle of the death effects.
 */
J.BASE.Aliased.Game_Actor.set('die', Game_Actor.prototype.die);
Game_Actor.prototype.die = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('die')
    .call(this);

  // perform on-death effects.
  this.onDeath();
};

/**
 * An event hook fired when this actor dies.
 */
Game_Actor.prototype.onDeath = function()
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Extends {@link #revive}.<br/>
 * Handles on-revive effects at the actor-level.
 */
J.BASE.Aliased.Game_Actor.set('revive', Game_Actor.prototype.revive);
Game_Actor.prototype.revive = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('revive')
    .call(this);

  // perform on-revive effects.
  this.onRevive();
};

/**
 * An event hook fired when this actor revives.
 */
Game_Actor.prototype.onRevive = function()
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * An event hook fired when this actor changes their current equipment.
 */
Game_Actor.prototype.onEquipChange = function()
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Extends {@link #changeClass}.<br/>
 * Adds a hook for performing actions when the actor changes class.
 */
J.BASE.Aliased.Game_Actor.set('changeClass', Game_Actor.prototype.changeClass);
Game_Actor.prototype.changeClass = function(classId, keepExp)
{
  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('changeClass')
    .call(this, classId, keepExp);

  // perform on-class-change effects.
  this.onClassChange(classId, keepExp);
};

/**
 * An event hook fired when this actor changes classes.
 */
Game_Actor.prototype.onClassChange = function(classId, keepExp)
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Extends {@link #changeEquip}.<br/>
 * Adds a hook for performing actions when equipment on the actor has changed state.
 */
J.BASE.Aliased.Game_Actor.set('changeEquip', Game_Actor.prototype.changeEquip);
Game_Actor.prototype.changeEquip = function(slotId, item)
{
  // grab a snapshot of what the equips looked like before changing.
  const oldEquips = JsonEx.makeDeepCopy(this.rawEquips());

  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('changeEquip')
    .call(this, slotId, item);

  // determine if the equips array changed from what it was before original logic.
  const isChanged = !oldEquips.equals(this.rawEquips());

  // check if we did actually have change.
  if (isChanged)
  {
    // triggers the on-equip-change hook.
    this.onEquipChange();
  }
};

/**
 * Extends {@link #discardEquip}.<br/>
 * Adds a hook for performing actions when equipment on the actor has been discarded.
 */
J.BASE.Aliased.Game_Actor.set('discardEquip', Game_Actor.prototype.discardEquip);
Game_Actor.prototype.discardEquip = function(item)
{
  // grab a snapshot of what the equips looked like before changing.
  const oldEquips = JsonEx.makeDeepCopy(this.rawEquips());

  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('discardEquip')
    .call(this, item);

  // determine if the equips array changed from what it was before original logic.
  const isChanged = !oldEquips.equals(this.rawEquips());

  // check if we did actually have change.
  if (isChanged)
  {
    // triggers the on-equip-change hook.
    this.onEquipChange();
  }
};

/**
 * Extends {@link #forceChangeEquip}.<br/>
 * Adds a hook for performing actions when equipment on the actor has been forcefully changed.
 */
J.BASE.Aliased.Game_Actor.set('forceChangeEquip', Game_Actor.prototype.forceChangeEquip);
Game_Actor.prototype.forceChangeEquip = function(slotId, item)
{
  // grab a snapshot of what the equips looked like before changing.
  const oldEquips = JsonEx.makeDeepCopy(this.rawEquips());

  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('forceChangeEquip')
    .call(this, slotId, item);

  // determine if the equips array changed from what it was before original logic.
  const isChanged = !oldEquips.equals(this.rawEquips());

  // check if we did actually have change.
  if (isChanged)
  {
    // triggers the on-equip-change hook.
    this.onEquipChange();
  }
};

/**
 * Extends {@link #releaseUnequippableItems}.<br/>
 * Adds a hook for performing actions when equipment on the actor has been released due to internal change.
 */
J.BASE.Aliased.Game_Actor.set('releaseUnequippableItems', Game_Actor.prototype.releaseUnequippableItems);
Game_Actor.prototype.releaseUnequippableItems = function(forcing)
{
  // grab a snapshot of what the equips looked like before changing.
  const oldEquips = JsonEx.makeDeepCopy(this.rawEquips());

  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('releaseUnequippableItems')
    .call(this, forcing);

  // determine if the equips array changed from what it was before original logic.
  const isChanged = this.haveEquipsChanged(oldEquips);

  // check if we did actually have change.
  if (isChanged)
  {
    // triggers the on-equip-change hook.
    this.onEquipChange();
  }
};

/**
 * Determines whether or not the equips have changed since before.
 * @param {Game_Item[]} oldEquips The old equips collection.
 * @returns {boolean} True if there was a change in equips, false otherwise.
 */
Game_Actor.prototype.haveEquipsChanged = function(oldEquips)
{
  // if the equip lengths are different, then we definitely have change.
  if (oldEquips.length !== this.rawEquips().length) return true;

  // default to no change.
  let hasDifferentEquips = false;

  // iterate over all the old equips to compare with new.
  oldEquips.forEach((oldEquip, index) =>
  {
    // grab the equip occupying the same slot now.
    const currentEquip = this.rawEquips()[index];

    // check if their item id is the same.
    const sameItemId = oldEquip.itemId() === currentEquip.itemId();

    // check if their equip type is the same.
    const sameType = oldEquip.dataClass() === currentEquip.dataClass();

    // check if their underlying item is the same.
    const sameInnerItem = oldEquip.underlyingObject() === currentEquip.underlyingObject();

    // if all three are the same, then no change.
    if (sameItemId && sameType && sameInnerItem) return;

    // something changed.
    hasDifferentEquips = true;
  });

  return hasDifferentEquips;
};

/**
 * Overwrites the vanilla {@link #traitObjects} defined on {@link Game_Actor}.<br/>
 * Routes all calls through the cache wrapper on {@link Game_BattlerBase} so the
 * vanilla implementation — which pushes directly into the returned array — can never
 * shadow our cache layer or cause accidental mutation.
 * @returns {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_State)[]}
 */
Game_Actor.prototype.traitObjects = function()
{
  return Game_BattlerBase.prototype.traitObjects.call(this);
};

/**
 * Overwrites {@link #buildTraitObjects}.<br/>
 * Actors have additional trait-bearing sources beyond states: their actor data,
 * current class, and all currently equipped items.
 *
 * Returns a fresh array — never mutates the result of any super call — so the
 * cache in {@link #traitObjects} remains safe.
 * @returns {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_State)[]}
 */
Game_Actor.prototype.buildTraitObjects = function()
{
  return [
    // states are the base trait source for all battlers.
    ...this.states(),

    // the actor's own database entry carries traits.
    this.actor(),

    // the actor's current class also carries traits.
    this.currentClass(),

    // all currently equipped items carry traits; nulls are excluded.
    ...this.equippedEquips(),
  ];
};

/**
 * Gets all currently-equipped equips for this actor.
 * Normally, {@link #equips} includes `null`s where there may be empty equipment slots,
 * but this filters those out for you.
 * @returns {RPG_EquipItem[]}
 */
Game_Actor.prototype.equippedEquips = function()
{
  return this.equips()
    .filter(equip => !!equip);
};

/**
 * Sets the level of this actor to the given level.
 * @param {number} level The level to set this actor to.
 */
Game_Actor.prototype.setLevel = function(level)
{
  // Identify the minimum threshold of experience for the target level.
  const newExperience = this.expForLevel(level);

  // change the experience for this actor to the new level's amount.
  this.changeExp(newExperience, false);
};

/**
 * An event hook fired when this actor levels up.
 */
Game_Actor.prototype.onLevelUp = function()
{
  this.onBattlerDataChange();
};

/**
 * Extends {@link #levelUp}.<br/>
 * Adds a hook for performing actions when an the actor levels up.
 */
J.BASE.Aliased.Game_Actor.set('levelUp', Game_Actor.prototype.levelUp);
Game_Actor.prototype.levelUp = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('levelUp')
    .call(this);

  // triggers the on-level-up hook.
  this.onLevelUp();
};

/**
 * An event hook fired when this actor levels down.
 */
Game_Actor.prototype.onLevelDown = function()
{
  this.onBattlerDataChange();
};

/**
 * Extends {@link #levelDown}.<br/>
 * Adds a hook for performing actions when an the actor levels down.
 */
J.BASE.Aliased.Game_Actor.set('levelDown', Game_Actor.prototype.levelDown);
Game_Actor.prototype.levelDown = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Actor.get('levelDown')
    .call(this);

  // triggers the on-level-down hook.
  this.onLevelDown();
};

/**
 * Gets the base max tp for this actor.
 * @returns {number}
 */
Game_Actor.prototype.getBaseMaxTp = function()
{
  return J.BASE.Metadata.BaseTpMaxActors;
};

/**
 * Gets the id of this actor's current class.
 * @returns {number} The classId.
 */
Game_Actor.prototype.classId = function()
{
  // hand back the id of this actor's current class.
  return this._classId;
};

/**
 * Sets the id of this actor's current class.
 * @param {number} newClassId The new classId.
 */
Game_Actor.prototype.setClassId = function(newClassId)
{
  // assign the id of this actor's current class.
  this._classId = newClassId;
};

/**
 * Gets the accumulated experience per class id.
 * @returns {Object<number, number>} The exp.
 */
Game_Actor.prototype.exp = function()
{
  // hand back the accumulated experience per class id.
  return this._exp;
};
//endregion Game_Actor