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
    this._lingerMaxFrames = this._baseSkill.jabsLinger ?? 10;

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
    this._delay._delayDuration = new JABS_Timer(this._baseSkill.jabsDelayDuration ?? 0);

    /**
     * Whether or not this action will trigger when an enemy touches it.
     * @type {boolean}
     */
    this._delay._triggerOnTouch = this._baseSkill.jabsDelayTriggerByTouch ?? false;

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
    return this._baseSkill.jabsPierceCount;
  }

  /**
   * Sums battler-scoped and skill-note per-connection bonus hits for this action.
   * @returns {number}
   */
  makeHitsPerConnectionBonus()
  {
    const gameBattler = this.getCaster().getBattler();
    const isBasicAttack = this.getCaster().isSkillIdBasicAttack(this.getBaseSkill().id);

    const hitsGlobal = gameBattler.getBonusHitsGlobal();
    const hitsBasicOrSkill = isBasicAttack ? gameBattler.getBonusHitsBasic() : gameBattler.getBonusHitsSkill();
    const hitsFromNote = this._baseSkill.jabsBonusHitsFromSkillNote;

    const bonusHits = hitsGlobal + hitsBasicOrSkill + hitsFromNote;

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
    return this._hitsPerConnectionBonus;
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
    return this._selfAnimationId;
  }

  /**
   * Performs the self animation upon this action.
   */
  performSelfAnimation()
  {
    const event = this.getActionSprite();
    if (!event) return;

    if (this.hasSelfAnimationId() && !this._playedSelfAnimationOnDefeat)
    {
      event.requestAnimation(this.getSelfAnimationId());
      this._playedSelfAnimationOnDefeat = true;
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
    return this._onCastAnimationId;
  }

  /**
   * Performs the on-cast animation on the caster.
   * @param {JABS_Battler=} caster Optional caster override; defaults to this action’s caster.
   */
  performOnCastAnimation(caster)
  {
    // determine the caster if not provided.
    const who = caster || this.getCaster();

    // validate a caster exists.
    if (!who) return;

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
    return this._uuid;
  }

  /**
   * Gets the base skill this JABS action is based on.
   * @returns {RPG_Skill} The base skill of this JABS action.
   */
  getBaseSkill()
  {
    return this._baseSkill;
  }

  /**
   * The base game action this JABS action is based on.
   * @returns {Game_Action} The base game action for this action.
   */
  getAction()
  {
    return this._gameAction;
  }

  /**
   * Gets the `JABS_Battler` that created this JABS action.
   * @returns {JABS_Battler} The caster of this JABS action.
   */
  getCaster()
  {
    // grab the caster's uuid.
    const uuid = this._caster.getUuid();

    // determine the real caster, but fallback to the designated caster.
    const caster = JABS_AiManager.getBattlerByUuid(uuid) ?? this._caster;

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
    this._castComplete = true;
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
    return this._facing || this.getActionSprite()
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

    if (eventData && eventData.note && String(eventData.note).trim())
    {
      lines.push(String(eventData.note).trim());
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
    this._actionMapVisualNoteHolder = { note: synthetic };
  }

  /**
   * Holder passed to {@link RPGManager} for merged `<vis*>` tags from the action-map template (Comment lines).
   * @returns {{ note: string }|null}
   */
  getActionMapVisualNoteHolder()
  {
    return this._actionMapVisualNoteHolder;
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
    return this._actionCooldownType;
  }

  /**
   * Sets the name of the cooldown for tracking on the caster.
   * @param {string} type The name of the cooldown that this leverages.
   */
  setCooldownType(type)
  {
    this._actionCooldownType = type;
  }

  /**
   * Gets the duration in frames that this action has persisted on the map.
   */
  getDuration()
  {
    return this._currentDuration;
  }

  /**
   * Gets the max duration in frames that this action will exist on the map.
   * If the duration was unset, or is set but less than the minimum, it will be the minimum.
   * @returns {number} The max duration in frames (min 8).
   */
  getMaxDuration()
  {
    return Math.max(this.getBaseSkill().jabsDuration, JABS_Action.getMinimumDuration());
  }

  /**
   * Increments the duration for this JABS action. If the duration drops
   * to or below 0, then it will also flag this JABS action for removal.
   */
  countdownDuration()
  {
    this._currentDuration++;
    if (this.getMaxDuration() <= this._currentDuration)
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
    const isExpired = this.getMaxDuration() <= this._currentDuration;
    const minDurationElapsed = this._currentDuration > JABS_Action.getMinimumDuration();
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
   * @returns {Game_Event}
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
    this._delay._delayDuration.update();
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
    const isTimerComplete = this._delay._delayDuration.isTimerComplete();

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
    this._delay._delayDuration.forceComplete();
  }

  /**
   * Gets whether or not this action will be delayed until triggered.
   * @returns {boolean}
   */
  isEndlessDelay()
  {
    return this._delay._delayDuration.getMaxTime() === -1;
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
    return this._delay._triggerOnTouch || this.isEndlessDelay();
  }

  /**
   * Gets the configured trigger radius for this action, if any.
   * @returns {number|null} The trigger radius in tiles, or null if not provided.
   */
  getTriggerRadius()
  {
    // return the configured trigger radius, if any.
    return this._delay._triggerRadius ?? null;
  }

  /**
   * Checks a small circular radius around the action sprite for potential targets
   * solely to determine whether an action should arm during its delay phase.
   *
   * This does not apply damage; it only identifies whether any valid battlers are
   * within the supplied radius.
   *
   * @param {JABS_Action} jabsAction The action to evaluate.
   * @param {number} radius The trigger radius in tiles.
   * @returns {JABS_Battler[]} A list of potential targets inside the trigger radius.
   */
  getTriggerTouchTargets(jabsAction, radius)
  {
    // read core references for filtering.
    const casterJabsBattler = jabsAction.getCaster();

    // we only support spatial checks around an action sprite.
    const actionSprite = jabsAction.getActionSprite();
    if (!actionSprite)
    {
      return [];
    }

    /**
     * Basic candidate filter: can be hit, in-scope for the action, and not
     * an inanimate target (when the caster is an enemy).
     * @param {JABS_Battler} battler The candidate battler.
     * @returns {boolean} True if valid for proximity trigger, false otherwise.
     */
    const canActionConnectWithBattler = battler =>
    {
      // this battler is untargetable.
      if (!battler.canActionConnect())
      {
        return false;
      }

      // respect core scope constraints (friend/enemy/grounding, etc.).
      if (!battler.isWithinScope(jabsAction, battler, false))
      {
        return false;
      }

      // enemies should not react to inanimate targets.
      if (casterJabsBattler.isEnemy() && battler.isInanimate())
      {
        return false;
      }

      // this candidate is valid.
      return true;
    };

    // anchor the AABB on the action sprite’s continuous map coords (tile getters round under pixel movement).
    const cx = actionSprite._realX;
    const cy = actionSprite._realY;

    // compute inclusive bounds for the spatial index query.
    const minX = Math.floor(cx - radius);
    const minY = Math.floor(cy - radius);
    const maxX = Math.ceil(cx + radius);
    const maxY = Math.ceil(cy + radius);

    // query spatial candidates from the index.
    const candidates = JABS_AiManager.queryBattlersInAabb(minX, minY, maxX, maxY);

    // check circle distance for each candidate relative to the action sprite.
    const targets = [];
    // circle collision ignores facing, but keep logical dir8 for parity with shaped actions.
    const actionDirection = jabsAction.direction();
    candidates
      .filter(canActionConnectWithBattler, this)
      .forEach(battler =>
      {
        // retrieve the battler's character for spatial testing.
        const sprite = battler.getCharacter();

        // reuse the engine's circle collision helper.
        const inCircle = this.isTargetWithinRange(
          actionDirection,
          sprite,
          actionSprite,
          radius,
          J.ABS.Shapes.Circle,
        );

        // collect if inside the trigger radius.
        if (inCircle)
        {
          targets.push(battler);
        }
      }, this);

    // return any battlers that were inside the trigger radius.
    return targets;
  }

  /**
   * Gets the number of times this action can potentially hit a target.
   * @returns {number} The number of times remaining that this action can hit a target.
   */
  getPiercingTimes()
  {
    return this._pierceTimesLeft;
  }

  /**
   * Reduces the pierce times count of this action by 1.
   *
   * If an action reaches zero or less, then it also sets it up for removal.
   * @param {number=} decrement The amount to reduce the pierce times count by; defaults to 1.
   */
  decrementPierceTimes(decrement = 1)
  {
    this._pierceTimesLeft -= decrement;
    if (this._pierceTimesLeft <= 0)
    {
      if (!this._isLingering)
      {
        this.startLinger();
      }
    }
  }

  /**
   * Determines whether or not this action is ready to pierce another target.
   * @return {boolean} True if the timer for pierce delay is completed, false otherwise.
   */
  isPierceReady()
  {
    return this._pierceDelay.isTimerComplete();
  }

  /**
   * Counts down the pierce delay timer for this action.
   */
  countdownPierceDelay()
  {
    this._pierceDelay.update();
  }

  /**
   * Resets the pierce delay timer for this action.
   */
  resetPierceDelay()
  {
    this._pierceDelay.reset();
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
    if (!this.canMainUpdate()) return;

    this.syncDirectActionSpriteToCaster();

    if (this.isDelayCompleted())
    {
      this.countdownDuration();
    }

    if (this._isLingering)
    {
      this.updateLinger();
      return;
    }

    if (this.isReadyForCleanup())
    {
      return;
    }

    if (!this.isPierceReady())
    {
      this.countdownPierceDelay();
      return;
    }

    if (this._collisionEnabled)
    {
      this.processCollision();
    }
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
   * Determines whether or not to cleanup the action.
   * @returns {boolean} True if the action should be cleaned up, false otherwise.
   */
  isReadyForCleanup()
  {
    if (this.getDuration() < JABS_Action.getMinimumDuration()) return false;

    if (this._isLingering)
    {
      if (this._currentLinger >= this._lingerMaxFrames)
      {
        this.cleanup();
        return true;
      }

      return false;
    }

    const expired = this.isActionExpired();
    const outOfPierce = this.getPiercingTimes() <= 0;
    if (expired || outOfPierce)
    {
      this.startLinger();
      return false;
    }

    return false;
  }

  /**
   * Begins the lingering effect.
   */
  startLinger()
  {
    if (this._isLingering) return;

    // store  is lingering on the instance for later reads.
    this._isLingering = true;

    // store  collision enabled on the instance for later reads.
    this._collisionEnabled = false;

    this.performSelfAnimation();
  }

  /**
   * Updates the lingering effect.
   */
  updateLinger()
  {
    this._currentLinger++;

    if (this._currentLinger >= this._lingerMaxFrames)
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
    this._hitAtLeastOne = true;
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
    if (this._isLingering)
    {
      const event = this.getActionSprite();
      if (event)
      {
        const max = Math.max(1, this._lingerMaxFrames);
        const t = Math.min(this._currentLinger, max);
        const pct = 1 - (t / max);
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
    return this._gameAction.isForFriend();
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
    const totalBuff = caster.getRangeBuff() + caster.getRadiusBuff();
    const totalRate = caster.getRangeRate() + caster.getRadiusRate();

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
    const totalBuff = caster.getRangeBuff() + caster.getProximityBuff();
    const totalRate = caster.getRangeRate() + caster.getProximityRate();

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
    const totalBuff = caster.getRangeBuff() + caster.getThicknessBuff();
    const totalRate = caster.getRangeRate() + caster.getThicknessRate();

    // floor at 0 — a negative tile value breaks collision geometry.
    return Math.max(0, (base + totalBuff) * totalRate);
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
   * Whether or not this action has hit at least one target.
   * @returns {boolean}
   */
  hasHitAtLeastOneTarget()
  {
    return this._hitAtLeastOne;
  }

  /**
   * A factory that generates builders for creating {@link JABS_Action}s.
   * @returns {JABS_ActionBuilder}
   */
  static Builder = () => new JABS_ActionBuilder();
}

export default JABS_Action;
//endregion JABS_Action