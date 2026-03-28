//region JABS_Action
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
  }

  /**
   * Combines from all available sources the bonus hits for this action.
   * @returns {number}
   */
  makePiercingCount()
  {
    let pierceCount = this._baseSkill.jabsPierceCount;

    // handle skill extension bonuses.
    if (J.EXTEND)
    {
      // check if there is an underlying item to parse repeats off of.
      pierceCount += this._gameAction._item
        // skill extensions borrow from the extended skill repeats instead.
        ? this._gameAction._item._item.repeats - 1
        // no extended skill, no bonus repeats.
        : 0;
    }

    // handle other bonus hits for basic attacks.
    const isBasicAttack = [ JABS_Button.Mainhand, JABS_Button.Offhand ].includes(this.getCooldownType());
    pierceCount += this._caster.getAdditionalHits(this._baseSkill, isBasicAttack);

    return pierceCount;
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

    // anchor the AABB on the action sprite center in tiles.
    const cx = actionSprite.x;
    const cy = actionSprite.y;

    // compute inclusive bounds for the spatial index query.
    const minX = Math.floor(cx - radius);
    const minY = Math.floor(cy - radius);
    const maxX = Math.ceil(cx + radius);
    const maxY = Math.ceil(cy + radius);

    // query spatial candidates from the index.
    const candidates = JABS_AiManager.queryBattlersInAabb(minX, minY, maxX, maxY);

    // check circle distance for each candidate relative to the action sprite.
    const targets = [];
    const actionDirection = actionSprite.direction();
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
   * The main update logic for an action.
   * this includes handling the delay countdown, cleanup, the piercing, and collision.
   */
  mainUpdate()
  {
    if (!this.canMainUpdate()) return;

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

    this._isLingering = true;

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
   * Handles collision in the context of this action against in-range battlers.
   */
  processCollision()
  {
    // grab all available collision targets.
    const collisionTargets = $jabsEngine.getCollisionTargets(this);

    // check if we have any collision targets.
    if (collisionTargets.length === 0) return;

    // apply the battle effects of the action against each target.
    collisionTargets.forEach(target => $jabsEngine.applyPrimaryBattleEffects(this, target), this);

    // perform post-collision action things.
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

    // respect explicit global disable (if configured).
    if (J.ABS.Metadata.HitboxPulse.enabled === false) return;

    this.processHitboxPulse();
  }

  /**
   * Performs the hitbox pulse visualization for the action.
   */
  processHitboxPulse()
  {
    // resolve the action event that visually anchors the pulse (if available).
    const actionEvent = this.getActionSprite();

    // determine the origin/facing from either the action event (preferred) or the caster’s character as a fallback.
    // this allows sprite-less actions to still render a pulse anchored to the caster.
    let originX = 0;
    let originY = 0;
    // default to down as a safe fallback.
    let facing = 2;

    // attempt to use the action event for origin and facing when present.
    if (actionEvent)
    {
      // derive the on-screen origin in pixels (screen-space), matching tilemap parenting.
      originX = actionEvent.screenX();
      originY = actionEvent.screenY();

      // derive facing from the action event.
      facing = actionEvent.direction();
    }
    else
    {
      // action event is unavailable; fall back to the caster’s character sprite.
      // this ensures sprite-less actions still draw the pulse and respect overlays.
      const caster = this.getCaster();
      const casterCharacter = caster.getCharacter();

      // derive the on-screen origin from the caster.
      originX = casterCharacter.screenX();
      originY = casterCharacter.screenY();

      // derive facing from the caster.
      facing = casterCharacter.direction();
    }

    // derive geometry data directly from this action instance.
    const shape = this.getShape();
    const range = this.getRange();

    // optional arc width and thickness from engine helpers (if applicable).
    const degrees = actionEvent
      ? ($jabsEngine.getActionDegrees(actionEvent) || 180)
      : 180;
    const thickness = actionEvent
      ? ($jabsEngine.getActionThicknessTiles(actionEvent) || 1)
      : 1;

    // build a compact options object using the fluent API.
    const options = JABS_HitboxPulseOptions.defaults()
      .withOrigin(originX, originY)
      .withShape(shape)
      .withRange(range)
      .withFacing(facing)
      .withDegrees(degrees)
      .withThickness(thickness)
      .withFade(38, 0.42, 0.0)
      .withScale(1.00, 1.08)
      .withLine(0xFFFFFF, 0.85, 2)
      .withFill(0xFFFFFF, 0.18)
      .withBlendMode(PIXI.BLEND_MODES.ADD);

    // spawn the pulse via the static manager (layer is set up by Spriteset_Map).
    JABS_HitboxPulseManager.spawn(options);
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
   * @returns {number} The range of this action.
   */
  getRange()
  {
    return this.getBaseSkill().jabsRadius;
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
   * @returns {number} The proximity required for this action.
   */
  getProximity()
  {
    // check if the scope is "user".
    if (this.isForSelf())
    {
      // proximity for usable skills of scope "user" is unlimited.
      return 9999;
    }

    // return the proximity from the underlying skill.
    return this.getBaseSkill().jabsProximity ?? 0;
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
   * @returns {number} The thickness in tiles; defaults to 1 if not tagged.
   */
  getThicknessTiles()
  {
    return RPGManager.getNumberFromNoteByRegex(this.getBaseSkill(), J.ABS.RegExp.Thickness, true) ?? 1;
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

//endregion JABS_Action