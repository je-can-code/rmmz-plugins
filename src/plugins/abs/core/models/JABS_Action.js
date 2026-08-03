//region JABS_Action
import JABS_Timer from './JABS_Timer.js';
import JABS_HitboxPulseManager from './../managers/JABS_HitboxPulseManager.js';
import JABS_Engine from './../managers/JABS_Engine.js';
import JABS_Battler from './JABS_Battler.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
import JABS_ActionOptions from './JABS_ActionOptions.js';
import JABS_ActionBuilder from './JABS_ActionBuilder.js';
/**
 * An object that binds a `Game_Action` to a `Game_Event` on the map.
 */
class JABS_Action
{
  /**
   * The minimum duration a JABS action must exist visually before cleaning it up.
   *
   * All actions should exist visually for at least 8 frames.
   * @returns {8} The minimum number of frames, 8.
   */
  static getMinimumDuration()
  {
    return 8;
  }

  /**
   * Constructor.
   * @param {Game_Action} gameAction The underlying action associated with this JABS action.
   * @param {JABS_Battler} caster The `JABS_Battler` who created this JABS action.
   * @param {boolean} isRetaliation Whether or not this is a retaliation action.
   * @param {number} direction The direction this action will face initially.
   * @param {string?} cooldownKey The cooldown key associated with this action.
   * @param {boolean=} isTerrainDamage Whether or not the action is a result of terrain damage.
   */
  constructor(gameAction, caster, isRetaliation, direction, cooldownKey, isTerrainDamage)
  {
    /**
     * The `Game_Action` to bind to the `Game_Event` and `JABS_Battler`.
     * @type {Game_Action}
     */
    this._gameAction = gameAction;

    /**
     * The base skill object, in case needed for something.
     * @type {RPG_Skill}
     */
    this._baseSkill = gameAction.item();

    /**
     * The `JABS_Battler` that used created this JABS action.
     * @type {JABS_Battler}
     */
    this._caster = caster;

    /**
     * Whether or not this action was generated as a retaliation to another battler's action.
     * @type {boolean}
     */
    this._isRetaliation = isRetaliation;

    /**
     * The direction this projectile will initially face and move.
     * @type {number}
     */
    this._facing = direction;

    /**
     * The type of action this is. Used for mapping cooldowns to the appropriate slot on the caster.
     * @type {string}
     */
    this._actionCooldownType = cooldownKey ?? J.ABS.Globals.GlobalCooldownKey;

    /**
     * Whether or not this action is a result of terrain damage.
     * @type {boolean}
     */
    this._isTerrainDamage = isTerrainDamage;

    // init other non-arg-related members.
    this.initMembers();
  }

  //region init
  /**
   * Initializes all properties on this class.
   */
  initMembers()
  {
    /**
     * The unique identifier for this action.
     *
     * All actions that are bound to an event have this.
     * @type {string}
     */
    this._uuid = J.BASE.Helpers.generateUuid();

    /**
     * Whether or not this action has collided with at least one target.
     * @type {boolean}
     */
    this._hitAtLeastOne = false;

    // initialize core functionality data.
    this.initVisuals();

    // initialize duration and expiration related data.
    this.initDuration();

    // initialize delay-related data.
    this.initDelay();

    // initialize piercing-related data.
    this.initPiercing();

    // initialize casting-related data.
    this.initCasting();
  }

  //region properties
  /**
   * Sets the cast complete.
   * @param {boolean} newCastComplete The new castComplete.
   */
  setCastComplete(newCastComplete)
  {
    // assign the cast complete.
    this._castComplete = newCastComplete;
  }

  /**
   * Gets the facing.
   * @returns {number} The facing.
   */
  facing()
  {
    // hand back the facing.
    return this._facing;
  }

  /**
   * Sets the is lingering.
   * @param {boolean} newIsLingering The new isLingering.
   */
  setIsLingering(newIsLingering)
  {
    // assign the is lingering.
    this._isLingering = newIsLingering;
  }
  //endregion properties

  //region properties
  /**
   * Gets the hit at least one.
   * @returns {boolean} The hitAtLeastOne.
   */
  isHitAtLeastOne()
  {
    // hand back the hit at least one.
    return this._hitAtLeastOne;
  }

  /**
   * Sets the hit at least one.
   * @param {boolean} newHitAtLeastOne The new hitAtLeastOne.
   */
  setHitAtLeastOne(newHitAtLeastOne)
  {
    // assign the hit at least one.
    this._hitAtLeastOne = newHitAtLeastOne;
  }

  /**
   * Gets the played self animation on defeat.
   * @returns {boolean} The playedSelfAnimationOnDefeat.
   */
  isPlayedSelfAnimationOnDefeat()
  {
    // hand back the played self animation on defeat.
    return this._playedSelfAnimationOnDefeat;
  }

  /**
   * Sets the played self animation on defeat.
   * @param {boolean} newPlayedSelfAnimationOnDefeat The new playedSelfAnimationOnDefeat.
   */
  setPlayedSelfAnimationOnDefeat(newPlayedSelfAnimationOnDefeat)
  {
    // assign the played self animation on defeat.
    this._playedSelfAnimationOnDefeat = newPlayedSelfAnimationOnDefeat;
  }

  /**
   * Gets the collision enabled.
   * @returns {boolean} The collisionEnabled.
   */
  isCollisionEnabled()
  {
    // hand back the collision enabled.
    return this._collisionEnabled;
  }

  /**
   * Sets the collision enabled.
   * @param {boolean} newCollisionEnabled The new collisionEnabled.
   */
  setCollisionEnabled(newCollisionEnabled)
  {
    // assign the collision enabled.
    this._collisionEnabled = newCollisionEnabled;
  }

  /**
   * Gets the base skill.
   * @returns {RPG_Skill} The baseSkill.
   */
  baseSkill()
  {
    // hand back the base skill.
    return this._baseSkill;
  }

  /**
   * Gets the hits per connection bonus.
   * @returns {number} The hitsPerConnectionBonus.
   */
  hitsPerConnectionBonus()
  {
    // hand back the hits per connection bonus.
    return this._hitsPerConnectionBonus;
  }

  /**
   * Gets the self animation id.
   * @returns {number} The selfAnimationId.
   */
  selfAnimationId()
  {
    // hand back the self animation id.
    return this._selfAnimationId;
  }

  /**
   * Gets the on cast animation id.
   * @returns {number} The onCastAnimationId.
   */
  onCastAnimationId()
  {
    // hand back the on cast animation id.
    return this._onCastAnimationId;
  }

  /**
   * Gets the uuid.
   * @returns {string} The uuid.
   */
  uuid()
  {
    // hand back the uuid.
    return this._uuid;
  }

  /**
   * Gets the game action.
   * @returns {Game_Action} The gameAction.
   */
  gameAction()
  {
    // hand back the game action.
    return this._gameAction;
  }

  /**
   * Gets the caster.
   * @returns {JABS_Battler} The caster.
   */
  caster()
  {
    // hand back the caster.
    return this._caster;
  }

  /**
   * Gets the action map visual note holder.
   * @returns {{ note: string }|null} The actionMapVisualNoteHolder.
   */
  actionMapVisualNoteHolder()
  {
    // hand back the action map visual note holder.
    return this._actionMapVisualNoteHolder;
  }

  /**
   * Sets the action map visual note holder.
   * @param {{ note: string }|null} newActionMapVisualNoteHolder The new actionMapVisualNoteHolder.
   */
  setActionMapVisualNoteHolder(newActionMapVisualNoteHolder)
  {
    // assign the action map visual note holder.
    this._actionMapVisualNoteHolder = newActionMapVisualNoteHolder;
  }

  /**
   * Gets the action cooldown type.
   * @returns {string} The actionCooldownType.
   */
  actionCooldownType()
  {
    // hand back the action cooldown type.
    return this._actionCooldownType;
  }

  /**
   * Sets the action cooldown type.
   * @param {string} newActionCooldownType The new actionCooldownType.
   */
  setActionCooldownType(newActionCooldownType)
  {
    // assign the action cooldown type.
    this._actionCooldownType = newActionCooldownType;
  }

  /**
   * Gets the current duration.
   * @returns {number} The currentDuration.
   */
  currentDuration()
  {
    // hand back the current duration.
    return this._currentDuration;
  }

  /**
   * Sets the current duration.
   * @param {number} newCurrentDuration The new currentDuration.
   */
  setCurrentDuration(newCurrentDuration)
  {
    // assign the current duration.
    this._currentDuration = newCurrentDuration;
  }

  /**
   * Gets the delay.
   * @returns {{_delayDuration: JABS_Timer, _triggerOnTouch: boolean, _triggerRadius: number|null}} The delay.
   */
  delay()
  {
    // hand back the delay.
    return this._delay;
  }

  /**
   * Gets the pierce times left.
   * @returns {number} The pierceTimesLeft.
   */
  pierceTimesLeft()
  {
    // hand back the pierce times left.
    return this._pierceTimesLeft;
  }

  /**
   * Sets the pierce times left.
   * @param {number} newPierceTimesLeft The new pierceTimesLeft.
   */
  setPierceTimesLeft(newPierceTimesLeft)
  {
    // assign the pierce times left.
    this._pierceTimesLeft = newPierceTimesLeft;
  }

  /**
   * Gets the pierce delay.
   * @returns {JABS_Timer} The pierceDelay.
   */
  pierceDelay()
  {
    // hand back the pierce delay.
    return this._pierceDelay;
  }

  /**
   * Gets the current linger.
   * @returns {number} The currentLinger.
   */
  currentLinger()
  {
    // hand back the current linger.
    return this._currentLinger;
  }

  /**
   * Sets the current linger.
   * @param {number} newCurrentLinger The new currentLinger.
   */
  setCurrentLinger(newCurrentLinger)
  {
    // assign the current linger.
    this._currentLinger = newCurrentLinger;
  }

  /**
   * Gets the linger max frames.
   * @returns {number} The lingerMaxFrames.
   */
  lingerMaxFrames()
  {
    // hand back the linger max frames.
    return this._lingerMaxFrames;
  }
  //endregion properties

  /**
   * Initializes visual properties.
   */
  initVisuals()
  {
    /**
     * The `Game_Event` this JABS action is bound to. Represents the visual aspect on the map.
     * @type {Game_Event}
     */
    Object.defineProperty(this, '_actionSprite',
      {
        value: null,
        enumerable: false,
        writable: true,
        configurable: true,
      });

    /**
     * The animation id to be performed on the action itself upon execution.
     * @type {number}
     */
    this._selfAnimationId = this._baseSkill.jabsSelfAnimationId ?? 0;

    /**
     * Tracks if the self animation-on-defeat has been played to prevent duplicates.
     * @type {boolean}
     */
    this._playedSelfAnimationOnDefeat = false;

    /**
     * The options used when creating this action. Includes decision-time location when applicable.
     * @type {JABS_ActionOptions|null}
     */
    this._actionOptions = null;

    /**
     * The animation id to play once on the caster when the skill executes (after any casting).
     * @type {number}
     */
    this._onCastAnimationId = this.getBaseSkill().jabsOnCastAnimationId ?? 0;

    /**
     * Stable `{ note }` blob for {@link RPGManager} when action-map Comment lines carry `<vis*>` tags.
     * Stamped once at spawn from the template event + resolved page; null when nothing to parse.
     * @type {{ note: string }|null}
     */
    this._actionMapVisualNoteHolder = null;
  }

  /**
   * Initializes duration-centric properties.
   */
  initDuration()
  {
    /**
     * The current timer on this particular action.
     * @type {number}
     */
    this._currentDuration = 0;

    /**
     * Whether or not the visual of this map action needs removing.
     * @type {boolean}
     */
    this._needsRemoval = false;

    /**
     * Whether or not this action is currently in its linger phase.
     * @type {boolean}
     */
    this._isLingering = false;

    /**
     * How many frames this action should linger visually.
     * @type {number}
     */
    this._lingerMaxFrames = this._baseSkill.jabsLinger;

    /**
     * The current linger frame counter.
     * @type {number}
     */
    this._currentLinger = 0;

    /**
     * Internal toggle used to disable collision while lingering.
     * @type {boolean}
     */
    this._collisionEnabled = true;
  }

  /**
   * Initialize data related to delayed triggers.
   */
  initDelay()
  {
    /**
     * A grouping of all properties related to the delay of this action.
     */
    // store  delay on the instance for later reads.
    this._delay = {};

    /**
     * The duration remaining before this will action will autotrigger.
     * @type {JABS_Timer}
     */
    this._delay._delayDuration = new JABS_Timer(this._baseSkill.jabsDelayDuration);

    /**
     * Whether or not this action will trigger when an enemy touches it.
     * @type {boolean}
     */
    this._delay._triggerOnTouch = this._baseSkill.jabsDelayTriggerByTouch;

    /**
     * Optional radius in tiles used only for touch-triggering during the delay window.
     * If null, the action’s normal hitbox will be used (legacy behavior).
     * @type {number|null}
     */
    this._delay._triggerRadius = this._baseSkill.jabsDelayTriggerRadius;
  }

  /**
   * Initialize data relating to piercing.
   */
  initPiercing()
  {
    /**
     * The remaining number of times this action can pierce a target.
     * @type {number}
     */
    this._pierceTimesLeft = this.makePiercingCount();

    /**
     * The base pierce delay in frames.
     * @type {number}
     */
    this._basePierceDelay = this._baseSkill.jabsPierceDelay;

    /**
     * The current pierce delay in frames.
     * @type {JABS_Timer}
     */
    this._pierceDelay = new JABS_Timer(this._basePierceDelay);

    this._pierceDelay.setCurrentTime(this._pierceDelay.getMaxTime() - 1);

    // extra full battle-effect applications per target per pierce tick, beyond the first.
    this._hitsPerConnectionBonus = this.makeHitsPerConnectionBonus();
  }

  /**
   * Builds the pierce-step budget from the skill only (connection count before the action ends).
   * @returns {number}
   */
  makePiercingCount()
  {
    return this.baseSkill().jabsPierceCount;
  }

  /**
   * Sums battler-scoped and skill-note per-connection bonus hits for this action.
   * Battler-scoped totals already include their own formula contributions (see
   * {@link Game_Battler#getBonusHitsFromSources}); the skill-note formula is evaluated
   * here instead, since only this call site has the caster available as eval context.
   * The combined total is floored once at the end, after every flat and formula source
   * has been summed, rather than flooring each contribution separately.
   * @returns {number}
   */
  makeHitsPerConnectionBonus()
  {
    const gameBattler = this.getCaster().getBattler();
    const isBasicAttack = this.getCaster().isSkillIdBasicAttack(this.getBaseSkill().id);

    const hitsGlobal = gameBattler.getBonusHitsGlobal();
    const hitsBasicOrSkill = isBasicAttack ? gameBattler.getBonusHitsBasic() : gameBattler.getBonusHitsSkill();
    const hitsFromNote = this.baseSkill().jabsBonusHitsFromSkillNote;
    const hitsFromNoteFormula = RPGManager.getResultFromNoteByRegex(
      this.baseSkill(),
      J.ABS.RegExp.BonusHitsSkillNoteFormula,
      0,
      gameBattler);

    const bonusHits = Math.floor(hitsGlobal + hitsBasicOrSkill + hitsFromNote + hitsFromNoteFormula);

    if (bonusHits < 0)
    {
      return 0;
    }

    return bonusHits;
  }

  /**
   * Gets the cached extra applications per target per pierce tick (beyond the first).
   * @returns {number}
   */
  getHitsPerConnectionBonus()
  {
    return this.hitsPerConnectionBonus();
  }

  /**
   * Initializes data relating to casting.
   */
  initCasting()
  {
    // determine the configured cast time for this action.
    const castTime = this._baseSkill.jabsCastTime;

    // determine if this action actually requires a cast time.
    const needsCast = castTime !== null && castTime > 0;

    /**
     * Whether or not this action has been casted successfully.
     * @type {boolean}
     */
    this._castComplete = !needsCast;
  }

  //endregion init

  /**
   * Executes additional logic before this action is disposed.
   */
  preCleanupHook()
  {
    // tear down any sustained hitbox pulse tied to this uuid so the layer cannot leak across swings.
    JABS_HitboxPulseManager.releaseSustainedPulse(this.getUuid());

    // handle self-targeted animations on cleanup.
    this.handleSelfAnimationOnDefeat();
  }

  /**
   * If the action has an animation to cast on oneself, then execute it.
   */
  handleSelfAnimationOnDefeat()
  {
    // handle self-targeted animations on cleanup.
    const event = this.getActionSprite();

    // check if the action has an animation to play before destroying.
    if (this.hasSelfAnimationId() && event)
    {
      event.requestAnimation(this.getSelfAnimationId());
    }
  }

  /**
   * Gets whether or not this action has a self animation id.
   * @returns {boolean}
   */
  hasSelfAnimationId()
  {
    return this.getSelfAnimationId() !== 0;
  }

  /**
   * Gets the self animation id to display on oneself when
   * performing this action.
   * @returns {number}
   */
  getSelfAnimationId()
  {
    return this.selfAnimationId();
  }

  /**
   * Performs the self animation upon this action.
   */
  performSelfAnimation()
  {
    const event = this.getActionSprite();
    if (!event) return;

    if (this.hasSelfAnimationId() && !this.isPlayedSelfAnimationOnDefeat())
    {
      event.requestAnimation(this.getSelfAnimationId());
      this.setPlayedSelfAnimationOnDefeat(true);
    }
  }

  /**
   * Gets whether or not this action has an on-cast animation id.
   * @returns {boolean}
   */
  hasOnCastAnimationId()
  {
    // non-zero indicates a configured animation.
    return this.getOnCastAnimationId() !== 0;
  }

  /**
   * Gets the on-cast animation id to display on the caster when executing this action.
   * @returns {number}
   */
  getOnCastAnimationId()
  {
    // return the cached on-cast animation id.
    return this.onCastAnimationId();
  }

  /**
   * Performs the on-cast animation on the caster.
   * @param {JABS_Battler=} caster Optional caster override; defaults to this action’s caster.
   */
  performOnCastAnimation(caster)
  {
    // determine the caster if not provided.
    const who = caster || this.getCaster();

    // only perform if a valid animation id is defined.
    if (this.hasOnCastAnimationId())
    {
      // request the one-off animation on the caster’s map character.
      who.getCharacter()
        .requestAnimation(this.getOnCastAnimationId());
    }
  }

  /**
   * Gets the `uuid` of this action.
   *
   * If one is not returned, then it is probably a direct action with no event representing it.
   * @returns {string|null}
   */
  getUuid()
  {
    return this.uuid();
  }

  /**
   * Gets the base skill this JABS action is based on.
   * @returns {RPG_Skill} The base skill of this JABS action.
   */
  getBaseSkill()
  {
    return this.baseSkill();
  }

  /**
   * The base game action this JABS action is based on.
   * @returns {Game_Action} The base game action for this action.
   */
  getAction()
  {
    return this.gameAction();
  }

  /**
   * Gets the `JABS_Battler` that created this JABS action.
   * @returns {JABS_Battler} The caster of this JABS action.
   */
  getCaster()
  {
    // grab the caster's uuid.
    const uuid = this.caster().getUuid();

    // determine the real caster, but fallback to the designated caster.
    const caster = JABS_AiManager.getBattlerByUuid(uuid) ?? this.caster();

    // return the result.
    return caster;
  }

  /**
   * Gets the cast animation id for this action.
   * @returns {number|null}
   */
  getCastAnimation()
  {
    return this.getBaseSkill().jabsCastAnimation;
  }

  /**
   * Gets whether or not the action has been cast successfully.
   * If the action does not have a cast time, this will be true by default.
   * @returns {boolean}
   */
  isCastComplete()
  {
    return this._castComplete;
  }

  /**
   * Flags the action as cast-complete.
   */
  completeCast()
  {
    this.setCastComplete(true);
  }

  /**
   * Gets whether or not this action is unparryable.
   * @returns {boolean}
   */
  isUnparryable()
  {
    return !!this.getBaseSkill().jabsUnparryable;
  }

  isHealing()
  {
    const damageType = this.getBaseSkill().damage.type;
    return [
      // hP recover.
      3,
      // mP recover.
      4,
    ].includes(damageType);
  }

  /**
   * Whether or not this action is a retaliation- meaning it will not invoke retaliation.
   * @returns {boolean} True if it is a retaliation, false otherwise.
   */
  isRetaliation()
  {
    return this._isRetaliation;
  }

  /**
   * Gets the direction this action is facing.
   * @returns {2|4|6|8|1|3|7|9}
   */
  direction()
  {
    return this.facing() || this.getActionSprite()
      .direction();
  }

  /**
   * Overrides the facing direction stored on this action.
   * Used to re-orient a volley at execution time after alignment movement
   * has shifted the caster's position relative to the target.
   * @param {2|4|6|8|1|3|7|9} direction The new facing direction.
   */
  setFacing(direction)
  {
    this._facing = direction;
  }

  /**
   * RMMZ 8-dir code (1–9 except 5) for directional `<visOffset*>` tag lookup via {@link RPG_Skill#getJabsVisOffsetFor}.
   * Uses {@link #direction} — logical travel on {@link JABS_Action}, not {@link Game_Character#direction} on the action
   * event (that can be a cardinal sprite-row stamp for `$` sheets).
   * Collapsing diagonals to a nearest cardinal was wrong: ties picked one axis arbitrarily and skipped diagonal notes /
   * the documented UR→U→R fallback chain in {@link RPG_Skill#getJabsVisOffsetFor}.
   * @returns {1|2|3|4|6|7|8|9}
   */
  getDirectionForVisOffsetTags()
  {
    return this.direction();
  }

  /**
   * Builds a synthetic multiline note from the action-map template event + active page so
   * {@link RPGManager} can parse `<vis*>` tags (optional event-level `note` on {@link RPG_MapEvent},
   * parsable Comment commands on that page).
   * @param {RPG_MapEvent} eventData Raw event blob from `$actionMap`.
   * @param {RPG_MapEventPage} pageData The resolved page used for this spawn.
   * @returns {string}
   */
  static collectSyntheticVisualNoteFromActionEventPage(eventData, pageData)
  {
    const lines = [];

    const trimmedNote = eventData && eventData.note
      ? String(eventData.note)
        .trim()
      : String.empty;

    if (trimmedNote)
    {
      lines.push(trimmedNote);
    }

    if (!pageData || !pageData.list || pageData.list.length === 0)
    {
      return lines.join('\n');
    }

    Game_Event.getValidCommentCommandsFromPage(pageData)
      .forEach(command =>
      {
        const [ comment ] = command.parameters;

        // Append the row to the working collection.
        lines.push(comment);
      });

    return lines.join('\n');
  }

  /**
   * Stamps {@link #_actionMapVisualNoteHolder} once from the template used to spawn this action’s map event.
   * @param {RPG_MapEvent} eventData Raw event blob from `$actionMap`.
   * @param {RPG_MapEventPage} pageData The resolved page used for this spawn.
   */
  stampActionMapVisualNoteFromActionEvent(eventData, pageData)
  {
    const synthetic = JABS_Action.collectSyntheticVisualNoteFromActionEventPage(eventData, pageData);

    if (!synthetic.length)
    {
      return;
    }

    // store  action map visual note holder on the instance for later reads.
    this.setActionMapVisualNoteHolder({ note: synthetic });
  }

  /**
   * Holder passed to {@link RPGManager} for merged `<vis*>` tags from the action-map template (Comment lines).
   * @returns {{ note: string }|null}
   */
  getActionMapVisualNoteHolder()
  {
    return this.actionMapVisualNoteHolder();
  }

  /**
   * Whether or not this action was a result of terrain damage.
   * @returns {boolean}
   */
  isTerrainDamage()
  {
    return this._isTerrainDamage;
  }

  /**
   * Gets the name of the cooldown for this action.
   * @returns {string} The cooldown key for this action.
   */
  getCooldownType()
  {
    return this.actionCooldownType();
  }

  /**
   * Sets the name of the cooldown for tracking on the caster.
   * @param {string} type The name of the cooldown that this leverages.
   */
  setCooldownType(type)
  {
    this.setActionCooldownType(type);
  }

  /**
   * Gets the duration in frames that this action has persisted on the map.
   */
  getDuration()
  {
    return this.currentDuration();
  }

  /**
   * Gets the max duration in frames that this action will exist on the map.
   * The skill's own base duration is scaled by the caster's projectile duration modifier
   * (from `<projectileDuration:PERCENT_POINTS>` sources) before the minimum is enforced.
   * If the duration was unset, or is set but less than the minimum, it will be the minimum.
   * @returns {number} The max duration in frames (min 8).
   */
  getMaxDuration()
  {
    // the skill's own unscaled duration in frames.
    const baseDuration = this.getBaseSkill().jabsDuration;

    // the caster's battler-wide multiplier against projectile duration.
    const durationModifier = this.getCaster()
      .getBattler()
      .getProjectileDurationModifier();

    // scale the base duration by the modifier, then enforce the floor.
    return Math.max(Math.round(baseDuration * durationModifier), JABS_Action.getMinimumDuration());
  }

  /**
   * Increments the duration for this JABS action. If the duration drops
   * to or below 0, then it will also flag this JABS action for removal.
   */
  countdownDuration()
  {
    this.setCurrentDuration(this.currentDuration() + 1);
    if (this.getMaxDuration() <= this.currentDuration())
    {
      this.setNeedsRemoval();
    }
  }

  /**
   * Gets whether or not this action is expired and should be removed.
   * @returns {boolean} True if expired and past the minimum count, false otherwise.
   */
  isActionExpired()
  {
    const isExpired = this.getMaxDuration() <= this.currentDuration();
    const minDurationElapsed = this.currentDuration() > JABS_Action.getMinimumDuration();
    return (isExpired && minDurationElapsed);
  }

  /**
   * Gets whether or not this JABS action needs removing.
   * @returns {boolean} Whether or not this action needs removing.
   */
  getNeedsRemoval()
  {
    return this._needsRemoval;
  }

  /**
   * Sets whether or not this JABS action needs removing.
   * @param {boolean} remove Whether or not to remove this JABS action.
   */
  setNeedsRemoval(remove = true)
  {
    this._needsRemoval = remove;
  }

  /**
   * Gets the `Game_Event` this JABS action is bound to.
   * The `Game_Event` represents the visual aspect of this action.
   * Returns null for direct actions that were never spatialized (no coordinates provided).
   * @returns {Game_Event|null}
   */
  getActionSprite()
  {
    return this._actionSprite;
  }

  /**
   * Binds this JABS action to a provided `Game_Event`.
   * @param {Game_Event} actionSprite The `Game_Event` to bind to this JABS action.
   */
  setActionSprite(actionSprite)
  {
    this._actionSprite = actionSprite;
  }

  /**
   * Gets the action options for this action.
   * @returns {JABS_ActionOptions|null}
   */
  getActionOptions()
  {
    // return the stored options, if any.
    return this._actionOptions;
  }

  /**
   * Sets the action options onto this action.
   * @param {JABS_ActionOptions} options The options used to create this action.
   */
  setActionOptions(options)
  {
    // persist the options used for creation.
    this._actionOptions = options;
  }

  /**
   * Decrements the pre-countdown delay timer for this action. If the action does not
   * have `touchOnTrigger`, then the action will not affect anyone until the timer expires.
   */
  countdownDelay()
  {
    this.delay()._delayDuration.update();
  }

  /**
   * Gets whether or not the delay on this action has completed.
   *
   * This also includes if an action never had a delay to begin with.
   * @returns {boolean}
   */
  isDelayCompleted()
  {
    // if we triggered the action, we aren't delaying anymore.
    if (this.hasHitAtLeastOneTarget()) return true;

    // check if the delay has completed.
    const isTimerComplete = this.delay()._delayDuration.isTimerComplete();

    // check if this action will delay until triggered.
    const willWaitEndlessly = this.isEndlessDelay();

    // if the timer is done and we're not waiting forever, the delay is completed.
    const isDelayComplete = (isTimerComplete && !willWaitEndlessly);

    // return our determination.
    return isDelayComplete;
  }

  /**
   * Automatically finishes the delay regardless of its current status.
   */
  endDelay()
  {
    this.delay()._delayDuration.forceComplete();
  }

  /**
   * Gets whether or not this action will be delayed until triggered.
   * @returns {boolean}
   */
  isEndlessDelay()
  {
    return this.delay()._delayDuration.getMaxTime() === -1;
  }

  /**
   * Gets whether or not this action will be triggered by touch, regardless of its
   * delay counter.
   *
   * If `isEndlessDelay()` applies to this action, then it will automatically
   * trigger by touch regardless of configuration.
   * @returns {boolean}
   */
  triggerOnTouch()
  {
    return this.delay()._triggerOnTouch || this.isEndlessDelay();
  }

  /**
   * Gets the configured trigger radius for this action, if any.
   * @returns {number|null} The trigger radius in tiles, or null if not provided.
   */
  getTriggerRadius()
  {
    // return the configured trigger radius, if any.
    return this.delay()._triggerRadius;
  }

  /**
   * Gets the number of times this action can potentially hit a target.
   * @returns {number} The number of times remaining that this action can hit a target.
   */
  getPiercingTimes()
  {
    return this.pierceTimesLeft();
  }

  /**
   * Reduces the pierce times count of this action by 1.
   *
   * If an action reaches zero or less, then it also sets it up for removal.
   * @param {number=} decrement The amount to reduce the pierce times count by; defaults to 1.
   */
  decrementPierceTimes(decrement = 1)
  {
    // reduce the remaining pierce count by the given amount.
    this.setPierceTimesLeft(this.pierceTimesLeft() - decrement);

    // once pierce is exhausted, transition into lingering (unless already there).
    if (this.pierceTimesLeft() <= 0 && !this.isLingering())
    {
      this.startLinger();
    }
  }

  /**
   * Determines whether or not this action is ready to pierce another target.
   * @return {boolean} True if the timer for pierce delay is completed, false otherwise.
   */
  isPierceReady()
  {
    return this.pierceDelay().isTimerComplete();
  }

  /**
   * Counts down the pierce delay timer for this action.
   * Skips the tick while the action sprite is hitstopped so that hitstop and
   * pierce delay stay in sync — the projectile freezes, moves, then freezes
   * again rather than expiring the delay mid-freeze and cascading unpredictably.
   */
  countdownPierceDelay()
  {
    // direct actions without a sprite are never hitstopped; only check when a sprite exists.
    const actionSprite = this.getActionSprite();
    if (actionSprite !== null && actionSprite.isHitstopped()) return;

    this.pierceDelay().update();
  }

  /**
   * Resets the pierce delay timer for this action.
   */
  resetPierceDelay()
  {
    this.pierceDelay().reset();
  }

  //region update
  /**
   * The overarching update logic for the action.
   */
  update()
  {
    // handle the updates before the main updates.
    this.preUpdate();

    // handle the main updating for the action.
    this.mainUpdate();

    // handle the updates after the main updates.
    this.postUpdate();
  }

  /**
   * An event hook for logic to perform before the main update of an action.
   * This includes by default the countdown for delayed activation of actions.
   */
  preUpdate()
  {
    // decrement the delay timer prior to action countdown.
    this.countdownDelay();

    // while delaying, optionally allow arming by proximity using a small radius.
    this.checkTriggerTouchAndArm();
  }

  /**
   * If this action is still delaying and configured to trigger on touch, checks a
   * smaller circular radius around the action sprite to prematurely finish the delay.
   *
   * This does not apply damage in this frame; it only completes the delay so that
   * the next update runs full collision with the real hitbox.
   */
  checkTriggerTouchAndArm()
  {
    // if the delay already completed, do nothing.
    if (this.isDelayCompleted())
    {
      return;
    }

    // if not configured for touch-triggering, do nothing.
    if (this.triggerOnTouch() === false)
    {
      return;
    }

    // if we do not have a trigger radius defined, retain legacy behavior (do nothing here).
    const radius = this.getTriggerRadius();
    if (radius === null)
    {
      return;
    }

    // if we do not have an action sprite yet, there is no spatial anchor to test.
    const actionSprite = this.getActionSprite();
    if (!actionSprite)
    {
      return;
    }

    // query any valid targets inside the trigger radius.
    const candidates = $jabsEngine.getTriggerTouchTargets(this, radius);

    // if we found any valid candidates, end the delay immediately.
    if (candidates.length > 0)
    {
      this.endDelay();
    }
  }

  /**
   * Keeps direct map actions anchored to the correct position each frame.
   *
   * When a direct skill was spatialized at decision-time (the options carry a frozen target
   * location with valid coordinates), the action event was spawned there and must stay put -
   * the hitbox lives at the target's tile, not the caster's.
   *
   * When no frozen location exists (pure proximity skills that never resolved a specific tile),
   * fall back to the original behavior and keep the event glued to the caster so the
   * caster-proximity collision path still works correctly.
   */
  syncDirectActionSpriteToCaster()
  {
    // if this is not a direct action, there is nothing to sync.
    if (!this.isDirectAction())
    {
      return;
    }

    // grab the action sprite to sync positions on.
    const actionSprite = this.getActionSprite();

    // if there is no action sprite, there is nothing to sync.
    if (!actionSprite)
    {
      return;
    }

    // read the options to check whether a frozen target location was captured at decision-time.
    const options = this.getActionOptions();
    const frozenLocation = options
      ? options.getTargetLocation()
      : null;
    const frozenX = frozenLocation
      ? frozenLocation.getX()
      : null;
    const frozenY = frozenLocation
      ? frozenLocation.getY()
      : null;

    // if a frozen target tile exists, the event was spawned there - leave it in place.
    if (frozenX !== null && frozenY !== null)
    {
      return;
    }

    // no frozen target: fall back to body-anchoring the sprite to the caster so
    // the caster-proximity collision path still works for skills without a target tile.
    const casterChar = this.getCaster()
      .getCharacter();

    // anchor the sprite to the caster's current continuous position.
    actionSprite._realX = casterChar._realX;
    actionSprite._realY = casterChar._realY;
    actionSprite._x = casterChar._x;
    actionSprite._y = casterChar._y;
  }

  /**
   * The main update logic for an action.
   * this includes handling the delay countdown, cleanup, the piercing, and collision.
   */
  mainUpdate()
  {
    // if the gating conditions for updating at all aren't met, do not update.
    if (!this.canMainUpdate()) return;

    // keep a spatialized direct action's event pinned to its resolved target tile.
    this.syncDirectActionSpriteToCaster();

    // once the pre-execution delay has elapsed, start counting down the action's own lifespan.
    if (this.isDelayCompleted())
    {
      this.countdownDuration();
    }

    // while lingering, only the fade-out timer advances; no further collision processing occurs.
    if (this.canUpdateLinger())
    {
      this.updateLinger();
      return;
    }

    // once we've overstayed our welcome (past minimum duration) and are expired or out of pierce,
    // transition into the lingering phase instead of continuing to collide.
    if (this.shouldBeginLingering())
    {
      this.startLinger();
      return;
    }

    // while the pierce delay is still ticking, do not process another collision yet.
    if (!this.isPierceReady())
    {
      this.countdownPierceDelay();
      return;
    }

    // process a fresh collision check now that all the above gates have passed. Collision is
    // only ever disabled together with lingering (see startLinger()), and canUpdateLinger()
    // already returned above whenever lingering, so canProcessCollision() is always true here.
    this.processCollision();
  }

  /**
   * Determines whether or not it is valid to perform the main update of the action.
   * @returns {boolean} True if the action should update, false otherwise.
   */
  canMainUpdate()
  {
    // if the event is a trigger action using delay, but hasn't completed, do not update.
    if (!this.triggerOnTouch() && !this.isDelayCompleted()) return false;

    // update.
    return true;
  }

  /**
   * Whether or not this action is currently in its linger phase.
   * @returns {boolean}
   */
  isLingering()
  {
    return this._isLingering;
  }

  /**
   * Whether or not the lingering fade-out timer should advance this frame, instead of running
   * collision logic. Pure alias over {@link #isLingering} for readability at the call site.
   * @returns {boolean}
   */
  canUpdateLinger()
  {
    return this.isLingering();
  }

  /**
   * Whether or not collision is currently permitted for this action. Disabled once the action
   * transitions into its lingering phase via {@link #startLinger}.
   * @returns {boolean}
   */
  canProcessCollision()
  {
    return this.isCollisionEnabled();
  }

  /**
   * Determines whether or not this action should transition into its lingering phase this frame:
   * past the minimum duration, and either expired or out of pierce hits. A pure predicate- the
   * caller ({@link #mainUpdate}) is responsible for actually invoking {@link #startLinger}.
   * @returns {boolean} True if lingering should begin now, false otherwise.
   */
  shouldBeginLingering()
  {
    // too young to consider transitioning yet, regardless of expiration/pierce state.
    if (this.getDuration() < JABS_Action.getMinimumDuration()) return false;

    // either condition alone is sufficient to justify lingering.
    return this.isActionExpired() || (this.getPiercingTimes() <= 0);
  }

  /**
   * Begins the lingering effect.
   */
  startLinger()
  {
    // already lingering; nothing further to start.
    if (this.isLingering()) return;

    // flag this action as now lingering, so future frames tick the fade-out timer instead.
    this.setIsLingering(true);

    // collision no longer applies once lingering begins.
    this.setCollisionEnabled(false);

    // play this action's self-animation, if any, as the visual cue that it has expired.
    this.performSelfAnimation();
  }

  /**
   * The current linger frame counter.
   * @returns {number}
   */
  getCurrentLinger()
  {
    return this.currentLinger();
  }

  /**
   * How many frames this action should linger visually.
   * @returns {number}
   */
  getLingerMaxFrames()
  {
    return this.lingerMaxFrames();
  }

  /**
   * Updates the lingering effect.
   */
  updateLinger()
  {
    // advance the linger fade-out counter by one frame.
    this.setCurrentLinger(this.currentLinger() + 1);

    // once the linger window has fully elapsed, clean up this action for real.
    if (this.getCurrentLinger() >= this.getLingerMaxFrames())
    {
      this.cleanup();
    }
  }

  /**
   * Cleans up this action and removes it from tracking if applicable.
   */
  cleanup()
  {
    // execute the action's pre-cleanup logic.
    this.preCleanupHook();

    // flag the action for removal.
    this.setNeedsRemoval();

    // clear out stale action events.
    $jabsEngine.clearActionEvents();
  }

  /**
   * Applies battle effects to every collision target for this pierce tick.
   * Runs `1 + getHitsPerConnectionBonus()` applications per target; stops early
   * when the target is dead or when the first application is parried.
   */
  processCollision()
  {
    const collisionTargets = $jabsEngine.getCollisionTargets(this);

    if (collisionTargets.length === 0) return;

    const applicationsPerTarget = 1 + this.getHitsPerConnectionBonus();

    collisionTargets.forEach(function(target)
    {
      for (let hitIndex = 0; hitIndex < applicationsPerTarget; hitIndex++)
      {
        if (target.isDead())
        {
          break;
        }

        $jabsEngine.applyPrimaryBattleEffects(this, target);

        const parried = target.getBattler().result().parried === true;
        if (parried)
        {
          break;
        }
      }
    }, this);

    this.onCollision();
  }

  /**
   * An event hook fired when this action collides with a target.
   */
  onCollision()
  {
    // end the delay if there was one.
    this.endDelay();

    // reset the pierce delay back to default.
    this.resetPierceDelay();

    // reduce the pierce counts by one.
    this.decrementPierceTimes();

    // check if this action has hit at least one target.
    if (!this.hasHitAtLeastOneTarget())
    {
      // execute first-hit logic.
      this.onFirstCollision();
    }
  }

  /**
   * An event hook fired when this action collides with its first target.
   */
  onFirstCollision()
  {
    // flag our first hit so we don't do this again.
    this.setHitAtLeastOne(true);
  }

  /**
   * Builds the plain options object consumed by {@link Sprite_HitboxPulse} for sustained active-shape visualization.
   * Origins intentionally mirror {@link JABS_Engine#getActionOriginPixels} so pulses agree with collision math.
   * @returns {Object}
   */
  composeHitboxPulsePlainOptions()
  {
    const meta = J.ABS.Metadata.HitboxPulse;
    const actionEvent = this.getActionSprite();

    let originX;
    let originY;
    let facing;

    if (actionEvent)
    {
      const o = JABS_Engine.getActionOriginPixels(actionEvent);
      originX = o.x;
      originY = o.y;
      facing = this.direction();
    }
    else
    {
      const casterCharacter = this.getCaster()
        .getCharacter();
      const o = JABS_Engine.getMeleeVisualOriginPixelsFromCharacter(casterCharacter);
      originX = o.x;
      originY = o.y;
      facing = casterCharacter.direction();
    }

    const degrees = actionEvent
      ? ($jabsEngine.getActionDegrees(actionEvent) || 180)
      : 180;
    const thickness = actionEvent
      ? ($jabsEngine.getActionThicknessTiles(actionEvent) || 1)
      : 1;

    const useFade = meta.useFadeAnimation === true;
    const duration = useFade
      ? meta.duration
      : 999999;
    const endAlpha = useFade
      ? meta.endAlpha
      : meta.startAlpha;
    const scaleEnd = useFade
      ? meta.scaleEnd
      : meta.scaleStart;

    return {
      x: originX,
      y: originY,
      shape: this.getShape(),
      range: this.getRange(),
      facing,
      degrees,
      thickness,
      innerRadius: this.getInnerRadius(),
      duration,
      sustained: true,
      startAlpha: meta.startAlpha,
      endAlpha,
      scaleStart: meta.scaleStart,
      scaleEnd,
      lineColor: meta.lineColor,
      lineAlpha: meta.lineAlpha,
      lineWidth: meta.lineWidth,
      fillColor: meta.fillColor,
      fillAlpha: meta.fillAlpha,
      blendMode: meta.blendMode,
    };
  }

  /**
   * An event hook for logic to perform after the main update of an action.
   */
  postUpdate()
  {
    // fade the action sprite's opacity down over the linger window, if currently lingering.
    if (this.isLingering())
    {
      // no sprite to fade yet (e.g. delayed actions), so there is nothing to update visually.
      const event = this.getActionSprite();
      if (event)
      {
        // clamp the denominator to at least 1 to avoid a divide-by-zero on a misconfigured tag.
        const max = Math.max(1, this.getLingerMaxFrames());

        // clamp the elapsed linger frames so overshoot doesn't produce a negative percentage.
        const t = Math.min(this.getCurrentLinger(), max);

        // the fraction of the linger window remaining, from 1 (just started) down to 0 (elapsed).
        const pct = 1 - (t / max);

        // scale that fraction into a real opacity value, floored at 0.
        const opacity = Math.max(0, Math.floor(255 * pct));
        event.setOpacity(opacity);
      }
    }

    // keep the transient hitbox pulse pinned to this action for every active frame after delay (hit or miss).
    JABS_HitboxPulseManager.syncSustainedActionPulse(this);
  }

  //endregion update

  /**
   * Gets whether or not this action is a direct-targeting action.
   * @returns {boolean}
   */
  isDirectAction()
  {
    return this.getBaseSkill().jabsDirect ?? false;
  }

  /**
   * Gets whether or not this action is a support action.
   * @returns {boolean}
   */
  isSupportAction()
  {
    return this.gameAction().isForFriend();
  }

  /**
   * Gets the cooldown time for this skill.
   * @returns {number} The cooldown frames of this JABS action.
   */
  getCooldown()
  {
    return this.getBaseSkill().jabsCooldown ?? 0;
  }

  /**
   * Gets the range of which this JABS action will reach.
   * Applies range modifiers from the caster's notes if the skill has an explicit radius tag.
   * @returns {number|null} The range of this action, or null if no radius is defined.
   */
  getRange()
  {
    // skills without a radius tag are not radial — skip modifier application entirely.
    const base = this.getBaseSkill().jabsRadius;
    if (base === null) return null;

    // apply buff and rate modifiers sourced from the caster's battler getters.
    return this.applyRadiusModifiers(base);
  }

  /**
   * Gets the cast time for this skill.
   * @returns {number}
   */
  getCastTime()
  {
    return this.getBaseSkill().jabsCastTime ?? 0;
  }

  /**
   * Gets the proximity to the target in order to use this JABS action.
   * Applies range modifiers from the caster's notes if the skill has an explicit proximity tag.
   * @returns {number} The proximity required for this action.
   */
  getProximity()
  {
    // check if the scope is "user".
    if (this.isForSelf())
    {
      // proximity for usable skills of scope "user" is unlimited; skip modifiers.
      return 9999;
    }

    // skills without an explicit proximity tag have no proximity requirement.
    const base = this.getBaseSkill().jabsProximity;
    if (base === null) return 0;

    // apply buff and rate modifiers sourced from the caster's battler getters.
    return this.applyProximityModifiers(base);
  }

  /**
   * Whether or not the scope of this action is "User" or not.
   * @returns {boolean}
   */
  isForSelf()
  {
    return this.getBaseSkill().scope === 11;
  }

  /**
   * Gets the shape of the hitbox for this JABS action.
   * @returns {string} The designated shape of the action.
   */
  getShape()
  {
    return this.getBaseSkill().jabsShape;
  }

  /**
   * Gets the hitbox thickness in tiles for this JABS action.
   * Applies to {@link J.ABS.Shapes.Line} and {@link J.ABS.Shapes.Wall} shapes.
   * Applies range modifiers only when an explicit <thickness:N> tag exists on the skill.
   * @returns {number} The thickness in tiles; defaults to 1 if not tagged.
   */
  getThicknessTiles()
  {
    // read the explicit tag value; null means no thickness tag was authored.
    const base = RPGManager.getNumberFromNoteByRegex(this.getBaseSkill(), J.ABS.RegExp.Thickness, true);

    // skip modifiers when no explicit tag exists; use the default unmodified.
    if (base === null) return 1;

    // apply buff and rate modifiers sourced from the caster's battler getters.
    return this.applyThicknessModifiers(base);
  }

  /**
   * Applies the caster's shared and radius-specific range modifiers to a base radius tile value.
   * @param {number} base The unmodified radius tile value.
   * @returns {number} The scaled radius tile value, floored at 0.
   */
  applyRadiusModifiers(base)
  {
    // ask the caster for each modifier component — shared buff/rate plus radius-axis extras.
    const caster = this.getAction().subject();
    const totalBuff = caster.getRangeBuff() + caster.getRadiusBuff() + this.getThisRangeBuff() + this.getThisRadiusBuff();
    const totalRate = caster.getRangeRate() + caster.getRadiusRate() + this.getThisRangeRate() + this.getThisRadiusRate();

    // floor at 0 — a negative tile value breaks collision geometry.
    return Math.max(0, (base + totalBuff) * totalRate);
  }

  /**
   * Applies the caster's shared and proximity-specific range modifiers to a base proximity tile value.
   * @param {number} base The unmodified proximity tile value.
   * @returns {number} The scaled proximity tile value, floored at 0.
   */
  applyProximityModifiers(base)
  {
    // ask the caster for each modifier component — shared buff/rate plus proximity-axis extras.
    const caster = this.getAction().subject();
    const totalBuff = caster.getRangeBuff() + caster.getProximityBuff() + this.getThisRangeBuff() + this.getThisProximityBuff();
    const totalRate = caster.getRangeRate() + caster.getProximityRate() + this.getThisRangeRate() + this.getThisProximityRate();

    // floor at 0 — a negative tile value breaks collision geometry.
    return Math.max(0, (base + totalBuff) * totalRate);
  }

  /**
   * Applies the caster's shared and thickness-specific range modifiers to a base thickness tile value.
   * @param {number} base The unmodified thickness tile value.
   * @returns {number} The scaled thickness tile value, floored at 0.
   */
  applyThicknessModifiers(base)
  {
    // ask the caster for each modifier component — shared buff/rate plus thickness-axis extras.
    const caster = this.getAction().subject();
    const totalBuff = caster.getRangeBuff() + caster.getThicknessBuff() + this.getThisRangeBuff() + this.getThisThicknessBuff();
    const totalRate = caster.getRangeRate() + caster.getThicknessRate() + this.getThisRangeRate() + this.getThisThicknessRate();

    // floor at 0 — a negative tile value breaks collision geometry.
    return Math.max(0, (base + totalBuff) * totalRate);
  }

  /**
   * Gets the flat tile bonus applied to all dimensions of this skill alone, read from this skill's
   * own note only (not the caster's getAllNotes()). Stacks additively with {@link Game_Battler#getRangeBuff}.
   * @returns {number}
   */
  getThisRangeBuff()
  {
    return RPGManager.getSumFromAllNotesByRegex([ this.getBaseSkill() ], J.ABS.RegExp.ThisRangeBuff);
  }

  /**
   * Gets the multiplicative rate applied to all dimensions of this skill alone, read from this
   * skill's own note only. Contributes (N - 1.0) deltas on top of {@link Game_Battler#getRangeRate}.
   * @returns {number}
   */
  getThisRangeRate()
  {
    const rates = RPGManager.getStringsFromNoteByRegex(this.getBaseSkill(), J.ABS.RegExp.ThisRangeRate);
    return rates.reduce((acc, rate) => acc + (Number(rate) - 1.0), 0);
  }

  /**
   * Gets the flat tile bonus applied only to this skill's own radius, read from this skill's own
   * note only. Stacks additively with {@link Game_Battler#getRadiusBuff} and {@link #getThisRangeBuff}.
   * @returns {number}
   */
  getThisRadiusBuff()
  {
    return RPGManager.getSumFromAllNotesByRegex([ this.getBaseSkill() ], J.ABS.RegExp.ThisRadiusBuff);
  }

  /**
   * Gets the multiplicative rate applied only to this skill's own radius, read from this skill's
   * own note only. Contributes (N - 1.0) deltas on top of {@link Game_Battler#getRadiusRate} and
   * {@link #getThisRangeRate}.
   * @returns {number}
   */
  getThisRadiusRate()
  {
    const rates = RPGManager.getStringsFromNoteByRegex(this.getBaseSkill(), J.ABS.RegExp.ThisRadiusRate);
    return rates.reduce((acc, rate) => acc + (Number(rate) - 1.0), 0);
  }

  /**
   * Gets the flat tile bonus applied only to this skill's own proximity, read from this skill's own
   * note only. Stacks additively with {@link Game_Battler#getProximityBuff} and {@link #getThisRangeBuff}.
   * @returns {number}
   */
  getThisProximityBuff()
  {
    return RPGManager.getSumFromAllNotesByRegex([ this.getBaseSkill() ], J.ABS.RegExp.ThisProximityBuff);
  }

  /**
   * Gets the multiplicative rate applied only to this skill's own proximity, read from this skill's
   * own note only. Contributes (N - 1.0) deltas on top of {@link Game_Battler#getProximityRate} and
   * {@link #getThisRangeRate}.
   * @returns {number}
   */
  getThisProximityRate()
  {
    const rates = RPGManager.getStringsFromNoteByRegex(this.getBaseSkill(), J.ABS.RegExp.ThisProximityRate);
    return rates.reduce((acc, rate) => acc + (Number(rate) - 1.0), 0);
  }

  /**
   * Gets the flat tile bonus applied only to this skill's own thickness, read from this skill's own
   * note only. Stacks additively with {@link Game_Battler#getThicknessBuff} and {@link #getThisRangeBuff}.
   * @returns {number}
   */
  getThisThicknessBuff()
  {
    return RPGManager.getSumFromAllNotesByRegex([ this.getBaseSkill() ], J.ABS.RegExp.ThisThicknessBuff);
  }

  /**
   * Gets the multiplicative rate applied only to this skill's own thickness, read from this skill's
   * own note only. Contributes (N - 1.0) deltas on top of {@link Game_Battler#getThicknessRate} and
   * {@link #getThisRangeRate}.
   * @returns {number}
   */
  getThisThicknessRate()
  {
    const rates = RPGManager.getStringsFromNoteByRegex(this.getBaseSkill(), J.ABS.RegExp.ThisThicknessRate);
    return rates.reduce((acc, rate) => acc + (Number(rate) - 1.0), 0);
  }

  /**
   * Gets the arc sweep in degrees for this JABS action.
   * Applies to {@link J.ABS.Shapes.Arc} shapes.
   * @returns {number} The degrees sweep; defaults to 180 if not tagged.
   */
  getDegrees()
  {
    return RPGManager.getNumberFromNoteByRegex(this.getBaseSkill(), J.ABS.RegExp.Degrees, true) ?? 180;
  }

  /**
   * Gets the knockback of this action.
   * @returns {number|null}
   */
  getKnockback()
  {
    return this.getBaseSkill().jabsKnockback;
  }

  /**
   * Gets the inner radius dead zone for this JABS action, in tiles.
   * @returns {number} The inner radius; defaults to 0 (no dead zone) if not tagged.
   */
  getInnerRadius()
  {
    return this.getBaseSkill().jabsInnerRadius ?? 0;
  }

  /**
   * Gets the event id associated with this JABS action from the action map.
   * This MUST have a numeric return value, and thus will default to eventId 1
   * on the action map if none is present.
   * @returns {number}
   */
  getActionId()
  {
    return this.getBaseSkill().jabsActionId ?? 1;
  }

  /**
   * Gets any additional aggro this skill generates.
   * @returns {number}
   */
  bonusAggro()
  {
    return this.getBaseSkill().jabsBonusAggro ?? 0;
  }

  /**
   * Gets the aggro multiplier from this skill.
   * @returns {number}
   */
  aggroMultiplier()
  {
    return this.getBaseSkill().jabsAggroMultiplier ?? 1.0;
  }

  /**
   * Gets the percent adjustment this skill applies to the caster's own already-standing aggro
   * on the target (see {@link JABS_Engine#applyAggroPercentEffect}).
   * @returns {number}
   */
  aggroPercent()
  {
    return this.getBaseSkill().jabsAggroPercent ?? 0;
  }

  /**
   * Gets the flat aggro adjustment this skill applies to every OTHER battler's standing aggro
   * on the target (see {@link JABS_Engine#applyNotMyAggroEffects}).
   * @returns {number}
   */
  notMyAggro()
  {
    return this.getBaseSkill().jabsNotMyAggro ?? 0;
  }

  /**
   * Gets the percent aggro adjustment this skill applies to every OTHER battler's standing aggro
   * on the target (see {@link JABS_Engine#applyNotMyAggroEffects}).
   * @returns {number}
   */
  notMyAggroPercent()
  {
    return this.getBaseSkill().jabsNotMyAggroPercent ?? 0;
  }

  /**
   * Whether or not this action has hit at least one target.
   * @returns {boolean}
   */
  hasHitAtLeastOneTarget()
  {
    return this.isHitAtLeastOne();
  }

  /**
   * A factory that generates builders for creating {@link JABS_Action}s.
   * @returns {JABS_ActionBuilder}
   */
  static Builder = () => new JABS_ActionBuilder();
}

export default JABS_Action;
//endregion JABS_Action