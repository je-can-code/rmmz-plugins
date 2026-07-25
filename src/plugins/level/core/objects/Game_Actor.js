import GrowthCurveFormula from "../managers/GrowthCurveFormula.js";

//region Game_Actor
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes this plugin's members.
 */
J.LEVEL.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Actor.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._level ||= {};

  /**
   * The calculated max level of this actor.
   * @type {number}
   */
  this._j._level._realMaxLevel = J.LEVEL.EditorMaxLevel;
};

Game_Actor.prototype.getRealMaxLevel = function()
{
  return this._j._level._realMaxLevel;
};

Game_Actor.prototype.setRealMaxLevel = function(newRealLevel)
{
  this._j._level._realMaxLevel = newRealLevel;
};

J.LEVEL.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Actor.get('onBattlerDataChange')
    .call(this);

  this.updateRealMaxLevel();
  this.refreshLevel();
};

Game_Actor.prototype.updateRealMaxLevel = function()
{
  const newMaxLevel = this.calculateRealMaxLevel();
  this.setRealMaxLevel(newMaxLevel);
};

Game_Actor.prototype.calculateRealMaxLevel = function()
{
  // grab the defined max level for this actor.
  const baseMaxLevel = this.baseMaxLevel();

  // grab the boosts to max level found across the actor.
  const maxLevelBoosts = this.maxLevelBoost();

  // if there are no boosts, then don't do any unnecessary math.
  if (maxLevelBoosts === 0) return baseMaxLevel;

  // sum the two max levels together.
  const maxLevelSum = baseMaxLevel + maxLevelBoosts;

  // can't be higher level than the defined cap.
  const cappedMaxLevel = Math.min(maxLevelSum, J.LEVEL.Metadata.trueMaxLevel);

  // have to be at least level 1.
  const normalizedMaxLevel = Math.max(cappedMaxLevel, 1);

  // return the overall normalized max level.
  return normalizedMaxLevel;
};

/**
 * Overwrites {@link #maxLevel}.<br/>
 * Recalculates the max level based on the possibility of a modified max level.
 * @returns {number}
 */
Game_Actor.prototype.maxLevel = function()
{
  return this.getRealMaxLevel();
};

/**
 * Gets the max level boost from all available notes for this battler.
 * @returns {number|null}
 */
Game_Actor.prototype.maxLevelBoost = function()
{
  return RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.LEVEL.RegExp.MaxLevelBoost);
};

/**
 * The base max level for a given actor. If it is set below 99 in the database, it'll just be that value. If it is set
 * to 99, then it'll return what is defined in the plugin parameters.
 * @returns {number}
 */
Game_Actor.prototype.baseMaxLevel = function()
{
  // if the actor has less than 99, then obey their max level settings.
  if (this.actor().maxLevel < 99) return this.actor().maxLevel;

  // return our defined beyond max level.
  return J.LEVEL.Metadata.defaultBeyondMaxLevel;
};

/**
 * Overwrites {@link #paramBase}.<br/>
 * Potentially fetches "beyond max data" for when ones level is beyond the editor max of 99.
 * @param {number} paramId The paramId to fetch the data for.
 * @returns {number}
 */
Game_Actor.prototype.paramBase = function(paramId)
{
  const rawLevel = Math.floor(this.getLevel());
  const editorMax = J.LEVEL.EditorMaxLevel;

  if (rawLevel <= editorMax)
  {
    const row = this.currentClass().params[paramId];
    const idx = Math.min(Math.max(rawLevel, 0), row.length - 1);
    return row[idx];
  }

  if ($gameTemp.hasCachedBeyondMaxData() === false)
  {
    $gameTemp.buildBeyondMaxData();
  }

  const params = $gameTemp.getBeyondMaxData(this.currentClass().id);
  const beyondRow = params[paramId];
  const beyondIdx = Math.min(rawLevel, beyondRow.length - 1);
  return beyondRow[beyondIdx];
};

/**
 * Extends {@link #maxTp}.<br/>
 * When the actor's current class carries an `<mtpGrowthCurve:[formula]>` tag, that formula is the
 * sole source of this actor's MTP at every level- it replaces J-Base's flat `base + tag-sum`
 * calculation entirely (no additive stacking with `<maxTp:N>`/`<mtpBuffPlus:[...]>`), since MTP has no
 * `params[]` array to defer to for any level range the way the 8 base params do. Falls through to the
 * original calculation unchanged when the current class has no such tag.
 * @returns {number}
 */
J.LEVEL.Aliased.Game_Actor.set('maxTp', Game_Actor.prototype.maxTp);
Game_Actor.prototype.maxTp = function()
{
  const growthCurveFormula = GrowthCurveFormula.readMtpForClass(this.currentClass());

  if (growthCurveFormula)
  {
    return Math.max(0, Math.round(GrowthCurveFormula.evaluate(growthCurveFormula, this.getLevel())));
  }

  // perform original logic.
  return J.LEVEL.Aliased.Game_Actor.get('maxTp')
    .call(this);
};

/**
 * The base or default level for this battler.
 * Actors have a level tracker, so we'll use that for the base.
 * @returns {number}
 */
Game_Actor.prototype.getBattlerBaseLevel = function()
{
  return this._level;
};

/**
 * Gets all database sources we can get levels from.
 *
 * Uses {@link #getAllNotes} so the result benefits from the notes cache and
 * includes all note-bearing sources — database data, class, skills, equips,
 * and all states (including passives). This also opens the door for skills
 * to grant level bonuses via the level tag, which is intentional.
 * @returns {RPG_BaseItem[]}
 */
Game_Actor.prototype.getLevelSources = function()
{
  return this.getAllNotes();
};

/**
 * The variable level modifier for this actor.
 * @returns {number}
 */
Game_Actor.prototype.getLevelBalancer = function()
{
  // check if we have a variable set for the fixed balancing.
  if (J.LEVEL.Metadata.actorBalanceVariable)
  {
    // return the adjustment from the variable value instead.
    return $gameVariables.value(J.LEVEL.Metadata.actorBalanceVariable);
  }

  // we don't have any balancing required.
  return 0;
};

//region single level across classes
/**
 * Extends {@link #initExp}.<br/>
 * When single-level-across-classes is enabled, initializes exp as a synced value instead of
 * only seeding the current class's slot.
 */
J.LEVEL.Aliased.Game_Actor.set('initExp', Game_Actor.prototype.initExp);
Game_Actor.prototype.initExp = function()
{
  // if this actor is using the vanilla per-class exp tracking, then do not get involved.
  if (J.LEVEL.Metadata.useSharedActorLevel === false)
  {
    // perform original logic and stop here.
    J.LEVEL.Aliased.Game_Actor.get('initExp')
      .call(this);
    return;
  }

  // seed every class's exp slot with the same starting value so they all agree from the outset.
  this.setSyncedExp(this.currentLevelExp());
};

/**
 * Extends {@link #changeExp}.<br/>
 * When single-level-across-classes is enabled, writes the new exp value to every class's slot
 * instead of just the current one, so switching classes never desyncs from this exp change.
 */
J.LEVEL.Aliased.Game_Actor.set('changeExp', Game_Actor.prototype.changeExp);
Game_Actor.prototype.changeExp = function(exp, show)
{
  // if this actor is using the vanilla per-class exp tracking, then do not get involved.
  if (J.LEVEL.Metadata.useSharedActorLevel === false)
  {
    // perform original logic and stop here.
    J.LEVEL.Aliased.Game_Actor.get('changeExp')
      .call(this, exp, show);
    return;
  }

  // clamp the incoming exp to a sane non-negative floor, same as vanilla.
  const clampedExp = Math.max(exp, 0);

  // write the same clamped exp to every class's slot instead of just the current one.
  this.setSyncedExp(clampedExp);

  // remember the level prior to this exp change so we know whether to show a level-up later.
  const lastLevel = this._level;

  // remember the skill list prior to this exp change so newly-learned skills can be identified.
  const lastSkills = this.skills();

  // climb levels for as long as we have enough exp for the next one and haven't hit the cap.
  while (!this.isMaxLevel() && this.currentExp() >= this.nextLevelExp())
  {
    // level up once; this may also apply natural growths and learn new skills via other plugins.
    this.levelUp();
  }

  // conversely, drop levels for as long as we don't even have enough exp for our current level.
  while (this.currentExp() < this.currentLevelExp())
  {
    // level down once.
    this.levelDown();
  }

  // if we were asked to show the level-up display and we actually gained a level, show it.
  if (show && this._level > lastLevel)
  {
    // display the level-up screen, listing off whatever new skills were picked up along the way.
    this.displayLevelUp(this.findNewSkills(lastSkills));
  }

  // refresh this actor so all derived data (params, caches, etc) reflects the new level/exp.
  this.refresh();
};

/**
 * Extends {@link #changeClass}.<br/>
 * When single-level-across-classes is enabled, no longer resets level/exp on class change- the
 * actor's level is shared across all classes, so there is nothing to reset or re-derive. Also
 * retroactively backfills the destination class's learnings up to the current level.
 */
J.LEVEL.Aliased.Game_Actor.set('changeClass', Game_Actor.prototype.changeClass);
Game_Actor.prototype.changeClass = function(classId, keepExp)
{
  // if this actor is using the vanilla per-class exp tracking, then do not get involved.
  if (J.LEVEL.Metadata.useSharedActorLevel === false)
  {
    // perform original logic (including the onClassChange hook it triggers) and stop here.
    J.LEVEL.Aliased.Game_Actor.get('changeClass')
      .call(this, classId, keepExp);
    return;
  }

  // swap the active class outright; level/exp are shared, so there is nothing to reset here.
  this._classId = classId;

  // grant every learning the new class has at or below our current level, same as a fresh actor
  // would receive via initSkills()- otherwise a high-level actor entering a brand new class would
  // skip past all of that class's low-level learnings without ever triggering them.
  this.backfillLearningsForCurrentLevel();

  // manually invoke the class-change hook so other plugins extending it (e.g. J-Passive) still
  // fire correctly, since we intentionally did not call through to the vanilla+_base logic above.
  this.onClassChange(classId, keepExp);

  // refresh this actor so all derived data reflects the new class.
  this.refresh();
};

/**
 * Grants every learning on the currently active class whose level requirement is already met by
 * this actor's current level. Safe to call repeatedly- {@link Game_Actor.learnSkill} is a no-op
 * for skills already known.
 */
Game_Actor.prototype.backfillLearningsForCurrentLevel = function()
{
  // iterate every learning defined on the currently active class.
  this.currentClass().learnings.forEach(learning =>
  {
    // if our current level already meets or exceeds this learning's requirement, grant it.
    if (learning.level <= this._level)
    {
      // learn the skill; this is a no-op if already known.
      this.learnSkill(learning.skillId);
    }
  }, this);
};

/**
 * Writes the given exp value to every class's exp slot, keeping them all in agreement. This keeps
 * {@link Game_Actor._exp} shaped exactly like vanilla (an object keyed by classId) for
 * compatibility with anything that expects that shape, while ensuring there is effectively only
 * one level per actor regardless of which class happens to be active.
 * @param {number} exp The exp value to write to every class's slot.
 */
Game_Actor.prototype.setSyncedExp = function(exp)
{
  // iterate every class defined in the database.
  $dataClasses.forEach(rpgClass =>
  {
    // skip the blank zeroth entry that RMMZ always includes.
    if (!rpgClass) return;

    // write the same exp value into this class's slot.
    this._exp[rpgClass.id] = exp;
  }, this);
};

/**
 * Overwrites {@link #expForLevel}.<br/>
 * When single-level-across-classes is enabled, uses a canonical, class-independent exp curve
 * instead of pulling basis/extra/acceleration values from the currently active class. This is only
 * the honest default for when nothing else defines a curve- J-Level-Flat, for example, also plainly
 * overwrites expForLevel and loads after this plugin, so its definition simply replaces this one
 * entirely at load time (the same load-order-wins mechanics as any other plugin overwrite), not a
 * chained alias call.
 * @param {number} level The level to calculate the required exp for.
 * @returns {number}
 */
Game_Actor.prototype.expForLevel = function(level)
{
  // if this actor is using the vanilla per-class exp curve, then do not get involved.
  if (J.LEVEL.Metadata.useSharedActorLevel === false)
  {
    // fall back to the vanilla per-class curve, sourced from the current class's expParams.
    const [ basis, extra, accA, accB ] = this.currentClass().expParams;
    return Math.round(
      (basis * Math.pow(level - 1, 0.9 + accA / 250) * level * (level + 1)) /
      (6 + Math.pow(level, 2) / 50 / accB) +
      (level - 1) * extra);
  }

  // use the same proven curve shape as vanilla, but sourced from plugin parameters instead of
  // whichever class happens to be active- so switching classes never changes the curve mid-climb.
  const basis = J.LEVEL.Metadata.canonicalExpBasis;
  const extra = J.LEVEL.Metadata.canonicalExpExtra;
  const accA = J.LEVEL.Metadata.canonicalExpAccA;
  const accB = J.LEVEL.Metadata.canonicalExpAccB;
  return Math.round(
    (basis * Math.pow(level - 1, 0.9 + accA / 250) * level * (level + 1)) /
    (6 + Math.pow(level, 2) / 50 / accB) +
    (level - 1) * extra);
};
//endregion single level across classes
//endregion Game_Actor