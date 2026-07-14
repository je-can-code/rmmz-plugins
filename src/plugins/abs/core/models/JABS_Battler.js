//region JABS_Battler
import JABS_Action from './JABS_Action.js';
import JABS_ActionOptions from './JABS_ActionOptions.js';
import JABS_ActionSpawner from './../managers/JABS_ActionSpawner.js';
import JABS_Aggro from './JABS_Aggro.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
import JABS_BattlerCoreData from './JABS_BattlerCoreData.js';
import JABS_BattlerRole from './JABS_BattlerRole.js';
import JABS_Cooldown from './JABS_Cooldown.js';
import JABS_EnemyAI from './JABS_EnemyAI.js';
import JABS_GlobalCooldown from './JABS_GlobalCooldown.js';
import JABS_GuardData from './JABS_GuardData.js';
import JABS_Location from './JABS_Location.js';
import JABS_SkillSlot from './JABS_SkillSlot.js';
import JABS_TeamRules from './../managers/JABS_TeamRules.js';
import JABS_Timer from './JABS_Timer.js';

/**
 * An object that represents the binding of a `Game_Event` to a `Game_Battler`.
 * This can be for either the player, an ally, or an enemy.
 */
class JABS_Battler
{
  /**
   * Constructor.
   * @param {Game_Event|Game_Player|Game_Follower} event The event the battler is bound to.
   * @param {Game_Actor|Game_Enemy} battler The battler data itself.
   * @param {JABS_BattlerCoreData} battlerCoreData The core data for the battler.
   */
  constructor(event, battler, battlerCoreData)
  {
    this.initialize(event, battler, battlerCoreData);
  }

  //region initialization
  /**
   * Initializes this JABS battler.
   * @param {Game_Event} event The event the battler is bound to.
   * @param {Game_Actor|Game_Enemy} battler The battler data itself.
   * @param {JABS_BattlerCoreData} battlerCoreData The core data for the battler.
   */
  initialize(event, battler, battlerCoreData)
  {
    /**
     * The character/sprite that represents this battler on the map.
     * @type {Game_Event|Game_Player|Game_Follower}
     */
    this._event = event;

    /**
     * The battler data that represents this battler's stats and information.
     * @type {Game_Actor|Game_Enemy}
     */
    this._battler = battler;

    /**
     * Whether or not the battler is hidden.
     * Hidden AI-controlled battlers (like enemies) will not take action, nor will they
     * be targetable.
     * @type {boolean}
     */
    this._hidden = false;

    // initialize the sectioned battler properties.
    this.initCoreData(battlerCoreData);
    this.initFromNotes();
    this.initGeneralInfo();
    this.initDodgeInfo();
    this.initBattleInfo();
    this.initIdleInfo();
    this.initCooldowns();
    this.initPoseInfo();
  };

  /**
   * Initializes the battler's core data from the comments.
   * @param {JABS_BattlerCoreData} battlerCoreData The battler core data driving this step.
   */
  initCoreData(battlerCoreData)
  {
    /**
     * The id of the battler in the database.
     * @type {number}
     */
    this._battlerId = battlerCoreData.battlerId();

    /**
     * The team that this battler fights for.
     * @type {number}
     */
    this._team = battlerCoreData.team();

    /**
     * The distance this battler requires before it will engage with a non-allied target.
     * @type {number}
     */
    this._sightRadius = battlerCoreData.sightRange();

    /**
     * The boost this battler gains to their sight range while alerted.
     * @type {number}
     */
    this._alertedSightBoost = battlerCoreData.alertedSightBoost();

    /**
     * The distance this battler will allow for its target to be from itself before it disengages.
     * @type {number}
     */
    this._pursuitRadius = battlerCoreData.pursuitRange();

    /**
     * The boost this battler gains to their pursuit range while alerted.
     * @type {number}
     */
    this._alertedPursuitBoost = battlerCoreData.alertedPursuitBoost();

    /**
     * The duration in frames that this battler remains in an alerted state.
     * @type {number}
     */
    this._alertDuration = battlerCoreData.alertDuration();

    /**
     * The explicit guardian engagement range for this battler.
     * Null when not tagged; guardian falls back to the largest ward pursuit in that case.
     * @type {number|null}
     */
    this._guardRange = battlerCoreData.guardRange();

    /**
     * The `JABS_EnemyAI` of this battler.
     * Only utilized by AI (duh).
     * @type {JABS_EnemyAI}
     */
    this._aiMode = battlerCoreData.ai();

    /**
     * Whether or not this battler is allowed to move around while idle.
     * @type {boolean}
     */
    this._canIdle = battlerCoreData.canIdle();

    /**
     * Whether or not this battler's hp bar is visible.
     * @type {boolean}
     */
    this._showHpBar = battlerCoreData.showHpBar();

    /**
     * Whether or not this battler's map affliction strip is visible.
     * @type {boolean}
     */
    this._showStates = battlerCoreData.showStates();

    /**
     * Whether or not this battler's name is visible.
     * @type {boolean}
     */
    this._showBattlerName = battlerCoreData.showBattlerName();

    /**
     * Whether or not this battler is invincible, rendering them unable
     * to be collided with by map actions.
     * @type {boolean}
     */
    this._invincible = battlerCoreData.isInvincible();

    /**
     * Whether or not this battler is inanimate.
     * Inanimate battlers don't move, can't be alerted, and have no hp bar.
     * Ideal for destructibles like crates or traps.
     * @type {boolean}
     */
    this._inanimate = battlerCoreData.isInanimate();

    /**
     * The structural coordination role for this battler.
     * Enemies read from core data (which reflects event-comment overrides with database fallback).
     * Actors and the player default to an empty role.
     * @type {JABS_BattlerRole}
     */
    this._battlerRole = battlerCoreData.battlerRole();
  };

  /**
   * Initializes the properties of this battler that are directly derived from notes.
   */
  initFromNotes()
  {
    /**
     * The number of frames to fulfill the "prepare" phase of a battler's engagement.
     * Only utilized by AI.
     * @type {number}
     */
    this._prepareMax = this.getPrepareTime();
  };

  /**
   * Initializes the properties of this battler that are not related to anything in particular.
   */
  initGeneralInfo()
  {
    /**
     * Whether or not the movement for this battler is locked.
     * @type {boolean}
     */
    this._movementLock = false;

    /**
     * The timer that designates the "wait" for this battler.
     * While this timer is active, this battler will "wait" until it completes
     * before taking any action.
     * @type {JABS_Timer}
     */
    // store  wait timer on the instance for later reads.
    this._waitTimer = new JABS_Timer(0);

    /**
     * The timer that designates the duration between engagement updates.
     * This is not a publicly exposed timer, statically defined at 30 frames per update.
     *
     * This is because engagement calculations are the most expensive
     * update to perform on a per-frame basis by a longshot in the entirety of JABS
     * due to the number of mathematical distance calculations performed.
     * @type {JABS_Timer}
     */
    this._engagementTimer = new JABS_Timer(15);
  };

  /**
   * Initialize the dodge-related information for this battler.
   */
  initDodgeInfo()
  {
    /**
     * The distance in steps/tiles/squares that the dodge will move the battler.
     * @type {number}
     */
    this._dodgeSteps = 0;

    /**
     * Whether or not this battler is dodging.
     * @type {boolean}
     */
    this._dodging = false;

    /**
     * The direction of which this battler is dodging.
     * Always `0` until a dodge is executed.
     * @type {number}
     */
    this._dodgeDirection = 0;

    /**
     * The current frame of the dodge animation.
     * @type {number}
     */
    this._dodgeFrame = 0;

    /**
     * The window of frames that the battler is invincible.
     * @type {[number, number]|null}
     */
    this._dodgeIframes = null;
  };

  /**
   * Initializes all properties that don't require input parameters.
   */
  initBattleInfo()
  {
    /**
     * The id of the last skill that was executed by this battler.
     * @type {number}
     */
    this._lastUsedSkillId = 0;

    /**
     * The key of the slot that was last performed.
     * @type {string}
     */
    this._lastUsedSlot = String.empty;

    /**
     * First engine frame at which AI may attempt the pending combo follow-up (fair pacing).
     * Zero means no gate is armed.
     * @type {number}
     */
    this._aiComboHumanizedReadyFrame = 0;

    /**
     * Earliest frame ({@link Graphics.frameCount}) at which AI may roll another defensive dodge interrupt.
     * @type {number}
     */
    this._aiDefensiveDodgeReadyFrame = 0;

    /**
     * Earliest frame ({@link Graphics.frameCount}) at which ally AI may roll another defensive guard raise.
     * @type {number}
     */
    this._aiAllyDefensiveGuardReadyFrame = 0;

    /**
     * Engine frame when ally AI last raised guard (for max-hold release); zero when not tracking.
     * @type {number}
     */
    this._aiAllyGuardRaiseFrame = 0;

    /**
     * The current phase of AI battling that this battler is in.
     * Only utilized by AI.
     * @type {number}
     */
    this._phase = 1;

    /**
     * The counter for preparing an action to execute for the AI.
     * Only utilized by AI.
     * @type {number}
     */
    this._prepareCounter = 0;

    /**
     * Whether or not this battler is finished with its "prepare" time and ready to
     * advance to phase 2 of combat.
     * @type {boolean}
     */
    this._prepareReady = false;

    /**
     * The counter for after a battler's action is executed.
     * Only utilized by AI.
     * @type {number}
     */
    this._postActionCooldown = 0;

    /**
     * The number of frames a skill requires as cooldown when executed by AI.
     * Only utilized by AI.
     * @type {number}
     */
    this._postActionCooldownMax = 0;

    /**
     * Whether or not this battler is ready to return to it's prepare phase.
     * Only utilized by AI.
     * @type {boolean}
     */
    this._postActionCooldownComplete = true;

    /**
     * The number of frames a skill requires prior to execution.
     * @type {number}
     */
    this._castTimeCountdown = 0;

    /**
     * Whether or not this battler is currently in a casting state.
     * @type {boolean}
     */
    this._casting = false;

    /**
     * The skill id being repeatedly executed by an active channel; 0 when not channeling.
     * @type {number}
     */
    this._channelSkillId = 0;

    /**
     * The number of frames remaining until the next channel tick fires.
     * @type {number}
     */
    this._channelTickCountdown = 0;

    /**
     * The number of frames remaining in the active channel's total duration.
     * @type {number}
     */
    this._channelDurationRemaining = 0;

    /**
     * Whether or not this battler is currently channeling a skill.
     * @type {boolean}
     */
    this._channeling = false;

    /**
     * The decided vessel `JABS_Action` that originated the active channel- retained so its
     * cooldown type/effective cooldown can be looked up whether the channel completes naturally
     * or is cut short by {@link JABS_Battler#interrupt}.
     * @type {JABS_Action|null}
     */
    this._channelSourceAction = null;

    /**
     * Whether or not this battler is engaged in combat with a target.
     * @type {boolean}
     */
    this._engaged = false;

    /**
     * Whether or not this battler can actually engage with any targets.
     * @type {boolean}
     */
    this._engagementLock = false;

    /**
     * The targeted `JABS_Battler` that this battler is attempting to battle with.
     * @type {JABS_Battler}
     */
    this._target = null;

    /**
     * The `JABS_Battler` that was last hit by any action from this battler.
     * @type {JABS_Battler}
     */
    this._lastHit = null;

    /**
     * The targeted `JABS_Battler` that this battler is aiming to support.
     * @type {JABS_Battler}
     */
    this._allyTarget = null;

    /**
     * Whether or not this target is alerted. Alerted targets have an expanded
     * sight and pursuit range.
     * @type {boolean}
     */
    this._alerted = false;

    /**
     * The counter for managing alertedness.
     * @type {number}
     */
    this._alertedCounter = 0;

    /**
     * A snapshot of the coordinates of the battler who triggered the alert
     * at the time this battler was alerted.
     * @type {[number, number]}
     */
    this._alertedCoordinates = [ 0, 0 ];

    /**
     * Whether or not the battler is in position to execute an action.
     * Only utilized by AI.
     * @type {boolean}
     */
    this._inPosition = false;

    /**
     * The action decided by this battler. Remains `null` until an action is selected
     * in combat.
     * Only utilized by AI.
     * @type {JABS_Action[]}
     */
    this._decidedAction = null;

    /**
     * A queue of actions pending execution from a designated leader.
     * @type {number|null}
     */
    this._leaderDecidedAction = null;

    /**
     * The `uuid` of the leader that is leading this battler.
     * This is only used for followers to prevent multiple leaders for commanding them.
     * @type {string}
     */
    this._leaderUuid = String.empty;

    /**
     * A collection of `uuid`s from all follower battlers this battler is leading.
     * If this battler's AI does not contain the "leader" trait, this is unused.
     * @type {string[]}
     */
    this._followers = [];

    /**
     * The counter that governs slip effects like regeneration or poison.
     * @type {number}
     */
    this._regenCounter = 1;

    /**
     * Whether or not this battler is guarding.
     * @type {boolean}
     */
    this._isGuarding = false;

    /**
     * The flat amount to reduce damage by when guarding.
     * @type {number}
     */
    this._guardFlatReduction = 0;

    /**
     * The percent amount to reduce damage by when guarding.
     * @type {number}
     */
    this._guardPercReduction = 0;

    /**
     * The number of frames at the beginning of activating guarding where
     * the first hit will be parried instead.
     * @type {number}
     */
    this._parryWindow = 0;

    /**
     * The id of the skill to retaliate with when successfully precise-parrying.
     * @type {number[]}
     */
    this._counterParryIds = [];

    /**
     * The id of the skill to retaliate with when successfully guarding.
     * @type {number}
     */
    this._counterGuardIds = 0;

    /**
     * The id of the skill associated with the guard data.
     * @type {number}
     */
    this._guardSkillId = 0;

    /**
     * Whether or not this battler is in a state of dying.
     * @type {boolean}
     */
    this._dying = false;

    /**
     * All currently tracked battler's aggro for this battler.
     * @type {JABS_Aggro[]}
     */
    this._aggros = [];

    /**
     * Frames remaining that this battler is considered “in combat”.
     * @type {number}
     */
    this._inCombatCountdown = 0;

    /**
     * Default window for the in‑combat countdown (60fps × seconds).
     * @type {number}
     */
    // 10s default.
    this._inCombatWindowMax = 600;
  };

  /**
   * Initializes the properties of this battler that are related to idling/phase0.
   */
  initIdleInfo()
  {
    /**
     * The initial `x` coordinate of where this battler was placed in the RMMZ editor or
     * was when the map was recreated (in the instance the RM user is leveraging a plugin that persists
     * event location after a map transfer).
     * @type {number}
     */
    // store  home x on the instance for later reads.
    this._homeX = this._event._x;

    /**
     * The initial `y` coordinate of where this battler was placed in the RMMZ editor or
     * was when the map was recreated (in the instance the RM user is leveraging a plugin that persists
     * event location after a map transfer).
     * @type {number}
     */
    // store  home y on the instance for later reads.
    this._homeY = this._event._y;

    /**
     * Whether or not this battler is identified as idle. Idle battlers are not
     * currently engaged, but instead executing their phase 0 movement pattern based on AI.
     * Only utilized by AI.
     * @type {boolean}
     */
    this._idle = true;

    /**
     * The counter for frames until this battler's idle action is ready.
     * Only utilized by AI.
     * @type {number}
     */
    this._idleActionCount = 0;

    /**
     * The number of frames until this battler's idle action is ready.
     * Only utilized by AI.
     * @type {number}
     */
    this._idleActionCountMax = 30;

    /**
     * Whether or not the idle action is ready to execute.
     * Only utilized by AI.
     * @type {boolean}
     */
    this._idleActionReady = false;
  };

  /**
   * Initializes the cooldowns for this battler.
   */
  initCooldowns()
  {
    // grab the battler for use.
    const battler = this.getBattler();

    // setup the skill slots for the enemy.
    battler.getSkillSlotManager()
      .setupSlots(battler);
  };
  //endregion initialization

  //region _reference
  /**
   * Reassigns the character to something else.
   * @param {Game_Event|Game_Player|Game_Follower} newCharacter The new character to assign.
   */
  setCharacter(newCharacter)
  {
    this._event = newCharacter;
  };

  /**
   * Gets the battler's name.
   * @returns {string}
   */
  battlerName()
  {
    return this.getBattlerDatabaseData().name;
  };

  /**
   * Events that have no actual conditions associated with them may have a -1 index.
   * Ignore that if that's the case.
   */
  hasEventActions()
  {
    // only events can have event commands.
    if (!this.isEvent()) return false;

    const event = this.getCharacter();
    return event._pageIndex !== -1;
  };

  /**
   * Destroys this battler by removing it from tracking and erasing the character.
   */
  destroy()
  {
    // set the battler as invincible to prevent further hitting.
    this.setInvincible();

    // remove the battler from tracking.
    JABS_AiManager.removeBattler(this);

    // grab the character.
    const character = this.getCharacter();

    // erase the underlying character.
    character.erase();

    // flag the sprite for removal.
    character.setActionSpriteNeedsRemoving();
  };

  /**
   * Reveals this battler onto the map.
   */
  revealHiddenBattler()
  {
    this._hidden = false;
  };

  /**
   * Hides this battler from the current battle map.
   */
  hideBattler()
  {
    this._hidden = true;
  };

  /**
   * Whether or not this battler is hidden on the current battle map.
   */
  isHidden()
  {
    return this._hidden;
  };

  /**
   * Whether or not this battler is in a state of dying.
   * @returns {boolean}
   */
  isDying()
  {
    return this._dying;
  };

  /**
   * Sets whether or not this battler is in a state of dying.
   * @param {boolean} dying The new state of dying.
   */
  setDying(dying)
  {
    this._dying = dying;
  };

  /**
   * Calculates whether or not this battler should continue fighting it's target.
   * @param {JABS_Battler} target The target we're trying to see.
   * @param {number} distance The distance from this battler to the target.
   * @returns {boolean}
   */
  inPursuitRange(target, distance)
  {
    // grab the current pursuit radius.
    let pursuitRadius = this.getPursuitRadius();

    // apply the modification from the actor, if any.
    const visionMultiplier = target.getBattler()
      .getVisionModifier();

    // apply the multiplier to the base.
    pursuitRadius *= visionMultiplier;

    // return whether or not we're in range.
    return (distance <= pursuitRadius);
  };

  /**
   * Calculates whether or not this battler should engage the nearest battler.
   * @param {JABS_Battler} target The target we're trying to see.
   * @param {number} distance The distance from this battler to the target.
   * @returns {boolean}
   */
  inSightRange(target, distance)
  {
    // grab the sight for this battler.
    const sightRadius = this.getSightRadius();

    // apply the modification from the actor, if any.
    const modifiedSight = this.applyVisionMultiplier(target, sightRadius);

    // determine whether or not the target is in sight.
    const isInSightRange = (distance <= modifiedSight);

    // return the answer.
    return isInSightRange;
  };

  /**
   * Determines whether or not this battler is "out of range" of a given target.
   * At or beyond the designated range usually results in dropping cognition of one another.
   * @param {JABS_Battler} target The target to check if within range of.
   * @returns {boolean} True if this battler is out of range of the target, false otherwise.
   */
  outOfRange(target)
  {
    // if the target is invalid, then they are out of range.
    if (!target) return true;

    // if they are actually out of update range, then they are out of range.
    if (this.distanceToDesignatedTarget(target) > JABS_AiManager.maxAiRange) return true;

    // they are not out of range.
    return false;
  };

  /**
   * Applies the vision multiplier against the base vision radius in question.
   * @param {JABS_Battler} target The target we're trying to see.
   * @param {number} originalRadius The original vision radius.
   */
  applyVisionMultiplier(target, originalRadius)
  {
    // get this battler's vision multiplier factor.
    const visionMultiplier = target.getBattler()
      .getVisionModifier();

    // calculate the new radius.
    const modifiedVisionRadius = (originalRadius * visionMultiplier);

    // return our calculation.
    return modifiedVisionRadius;
  };

  /**
   * Gets this battler's unique identifier.
   * @returns {string}
   */
  getUuid()
  {
    // if there is problems with the battler, return nothing.
    if (!this.getBattler()) return String.empty;

    return this.getBattler()
      .getUuid();
  };

  /**
   * Gets whether or not this battler has any pending actions decided
   * by this battler's leader.
   */
  hasLeaderDecidedActions()
  {
    // if you don't have a leader, you don't perform the actions.
    if (!this.hasLeader()) return false;

    return this._leaderDecidedAction;
  };

  /**
   * Gets the next skill id from the queue of leader-decided actions.
   * Also removes it from the current queue.
   * @returns {number}
   */
  getNextLeaderDecidedAction()
  {
    const action = this._leaderDecidedAction;
    this.clearLeaderDecidedActionsQueue();
    return action;
  };

  /**
   * Adds a new action decided by the leader for the follower to perform.
   * @param {number} skillId The skill id decided by the leader.
   */
  setLeaderDecidedAction(skillId)
  {
    this._leaderDecidedAction = skillId;
  };

  /**
   * Clears all unused leader-decided actions that this follower had pending.
   */
  clearLeaderDecidedActionsQueue()
  {
    this._leaderDecidedAction = null;
  };

  /**
   * Gets the leader's `uuid` of this battler.
   */
  getLeader()
  {
    return this._leaderUuid;
  };

  /**
   * Gets the battler for this battler's leader.
   * @returns {JABS_Battler}
   */
  getLeaderBattler()
  {
    if (this._leaderUuid)
    {
      return JABS_AiManager.getBattlerByUuid(this._leaderUuid);
    }

    return null;

  };

  /**
   * Sets the `uuid` of the leader of this battler.
   * @param {string} newLeader The leader's `uuid`.
   */
  setLeader(newLeader)
  {
    const leader = JABS_AiManager.getBattlerByUuid(newLeader);
    if (leader)
    {
      this._leaderUuid = newLeader;
      leader.addFollower(this.getUuid());
    }
  };

  /**
   * Gets whether or not this battler has a leader.
   * Only battlers with the ai-trait of `follower` can have leaders.
   * @returns {boolean}
   */
  hasLeader()
  {
    return !!this._leaderUuid;
  };

  /**
   * Gets all followers associated with this battler.
   * Only leaders can have followers.
   * @return {string[]} The `uuid`s of all followers.
   */
  getFollowers()
  {
    return this._followers;
  };

  /**
   * Gets the whole battler of the follower matching the `uuid` provided.
   * @param {string} followerUuid The `uuid` of the follower to find.
   * @returns {JABS_Battler}
   */
  getFollowerByUuid(followerUuid)
  {
    // if we don't have followers, just return null.
    if (!this.hasFollowers()) return null;

    // search through the followers to find the matching battler.
    const foundUuid = this._followers.find(uuid => uuid === followerUuid);
    if (foundUuid)
    {
      return JABS_AiManager.getBattlerByUuid(foundUuid);
    }

    return null;

  };

  /**
   * Adds a follower to the leader's collection.
   * @param {string} newFollowerUuid The new uuid of the follower now being tracked.
   */
  addFollower(newFollowerUuid)
  {
    const found = this.getFollowerByUuid(newFollowerUuid);
    if (found)
    {
      console.error('this follower already existed within the follower list.');
    }
    // otherwise fall back to the alternate path.
    else
    {
      this._followers.push(newFollowerUuid);
    }
  };

  /**
   * Clears all current followers from this battler.
   */
  clearFollowers()
  {
    // first de-assign leadership from all followers for this leader...
    this._followers.forEach(followerUuid =>
    {
      $gameMap.clearLeaderDataByUuid(followerUuid);
    });

    // ...then empty the collection.
    this._followers.splice(0, this._followers.length);
  };

  /**
   * Removes this follower's leader.
   */
  clearLeader()
  {
    // get the leader's uuid for searching.
    const leaderUuid = this.getLeader();
    // if found, remove this follower from that leader.
    if (leaderUuid)
    {
      const uuid = this.getUuid();
      // in some instances, "this" may not be alive anymore so handle that.
      if (!uuid) return;

      const leader = JABS_AiManager.getBattlerByUuid(leaderUuid);
      if (!leader) return;

      leader.removeFollowerByUuid(uuid);
    }
  };

  /**
   * Removes a follower from it's current leader.
   * @param {string} uuid The `uuid` of the follower to remove from the leader.
   */
  removeFollowerByUuid(uuid)
  {
    const index = this._followers.indexOf(uuid);
    if (index !== -1)
    {
      this._followers.splice(index, 1);
    }
  };

  /**
   * Removes the leader data from this battler.
   */
  clearLeaderData()
  {
    this.setLeader('');
    this.clearLeaderDecidedActionsQueue();
  };

  /**
   * Gets whether or not this battler has followers.
   * Only battlers with the AI trait of "leader" will have followers.
   * @returns {boolean}
   */
  hasFollowers()
  {
    // if you're not a leader, you can't have followers.
    if (!this.getBattlerRole().leader) return false;

    return this._followers.length > 0;
  };

  /**
   * Gets the database data for this battler.
   * @returns {RPG_Actor|RPG_Enemy} The battler data.
   */
  getBattlerDatabaseData()
  {
    // if somehow we don't have a battler, return an empty object.
    if (!this.getBattler()) return {};

    //
    return this.getBattler()
      .databaseData();
  };

  /**
   * Determines if this battler is facing its target.
   * @param {Game_Character} target The target `Game_Character` to check facing for.
   */
  isFacingTarget(target)
  {
    const userDir = this.getCharacter()
      .direction();
    const targetDir = target.direction();

    switch (userDir)
    {
      case J.ABS.Directions.DOWN:
        return targetDir === J.ABS.Directions.UP;
      case J.ABS.Directions.UP:
        return targetDir === J.ABS.Directions.DOWN;
      case J.ABS.Directions.LEFT:
        return targetDir === J.ABS.Directions.RIGHT;
      case J.ABS.Directions.RIGHT:
        return targetDir === J.ABS.Directions.LEFT;
    }

    return false;
  };

  /**
   * Whether or not this battler is actually the `Game_Player`.
   * @returns {boolean}
   */
  isPlayer()
  {
    return this.getCharacter()
      .isPlayer();
  };

  /**
   * Whether or not this battler is a `Game_Actor`.
   * The player counts as a `Game_Actor`, too.
   * @returns {boolean}
   */
  isActor()
  {
    return (this.isPlayer() || this.getBattler().isActor());
  };

  /**
   * Whether or not this battler is based on a follower.
   * @returns {boolean}
   */
  isFollower()
  {
    return this.getCharacter()
      .isFollower();
  };

  /**
   * Whether or not this battler is a `Game_Enemy`.
   * @returns {boolean}
   */
  isEnemy()
  {
    return (this.getBattler().isEnemy());
  };

  /**
   * Whether or not this battler is based on an event.
   * @returns {boolean}
   */
  isEvent()
  {
    return this.getCharacter()
      .isEvent();
  };

  /**
   * Compares the user with a provided target team to see if they are the same.
   * @param {number} targetTeam The id of the team to check.
   * @returns {boolean} True if the user and target are on the same team, false otherwise.
   */
  isSameTeam(targetTeam)
  {
    return (this.getTeam() === targetTeam);
  };

  /**
   * Gets whether or not the provided target team is considered "friendly".
   * @param {number} targetTeam The id of the team to check.
   * @returns {boolean}
   */
  isFriendlyTeam(targetTeam)
  {
    // friendly is decided by the centralized team rules.
    return JABS_TeamRules.isFriendly(this.getTeam(), targetTeam);
  };

  /**
   * Gets whether or not the provided target team is considered "opposing".
   * @param {number} targetTeam The id of the team to check.
   * @returns {boolean}
   */
  isOpposingTeam(targetTeam)
  {
    // opposition is decided by the centralized team rules.
    return JABS_TeamRules.isOpposed(this.getTeam(), targetTeam);
  };

  /**
   * Gets this battler's team id.
   * @returns {number}
   */
  getTeam()
  {
    return this._team;
  };

  /**
   * Gets the phase of battle this battler is currently in.
   * The player does not have any phases.
   * @returns {number} The phase this `JABS_Battler` is in.
   */
  getPhase()
  {
    return this._phase;
  };

  /**
   * Gets whether or not this battler is invincible.
   * @returns {boolean}
   */
  isInvincible()
  {
    return this._invincible;
  };

  /**
   * Gets whether or not this battler is inanimate.
   * @returns {boolean}
   */
  isInanimate()
  {
    return this._inanimate;
  };

  /**
   * Sets this battler to be invincible, rendering them unable to be collided
   * with by map actions of any kind.
   * @param {boolean} invincible True if uncollidable, false otherwise (default: true).
   */
  setInvincible(invincible = true)
  {
    this._invincible = invincible;
  };

  /**
   * Sets the phase of battle that this battler should be in.
   * @param {number} newPhase The new phase the battler is entering.
   */
  setPhase(newPhase)
  {
    this._phase = newPhase;
  };

  /**
   * Resets the phase of this battler back to one and resets all flags.
   */
  resetPhases()
  {
    this.setPhase(1);
    this._prepareReady = false;
    this._prepareCounter = 0;
    // store  post action cooldown complete on the instance for later reads.
    this._postActionCooldownComplete = false;
    this.setDecidedAction(null);
    this.setAllyTarget(null);
    this.setInPosition(false);
    this.clearAiComboHumanizedReadyFrame();
    this._aiDefensiveDodgeReadyFrame = 0;
    // store  ai ally defensive guard ready frame on the instance for later reads.
    this._aiAllyDefensiveGuardReadyFrame = 0;
    this._aiAllyGuardRaiseFrame = 0;
  };

  /**
   * Gets whether or not this battler is in position for a given skill.
   * @returns {boolean}
   */
  isInPosition()
  {
    return this._inPosition;
  };

  /**
   * Sets this battler to be identified as "in position" to execute their
   * decided skill.
   * @param {boolean} inPosition The in position driving this step.
   */
  setInPosition(inPosition = true)
  {
    this._inPosition = inPosition;
  };

  /**
   * Gets whether or not this battler has decided an action.
   * @returns {boolean}
   */
  isActionDecided()
  {
    return this._decidedAction !== null;
  };

  /**
   * Gets the battler's decided action.
   * @returns {JABS_Action[]|null}
   */
  getDecidedAction()
  {
    return this._decidedAction;
  };

  /**
   * Sets this battler's decided action to this action.
   * @param {JABS_Action[]} action The action this battler has decided on.
   */
  setDecidedAction(action)
  {
    this._decidedAction = action;
  };

  /**
   * Clears this battler's decided action.
   */
  clearDecidedAction()
  {
    this._decidedAction = null;
  };

  /**
   * Resets the idle action back to a not-ready state.
   */
  resetIdleAction()
  {
    this._idleActionReady = false;
  };

  /**
   * Returns the `Game_Character` that this `JABS_Battler` is bound to.
   * For the player, it'll return a subclass instead: `Game_Player`.
   * @returns {Game_Event|Game_Player|Game_Follower} The event this `JABS_Battler` is bound to.
   */
  getCharacter()
  {
    return this._event;
  };

  /**
   * Returns the `Game_Battler` that this `JABS_Battler` represents.
   *
   * This may be either a `Game_Actor`, or `Game_Enemy`.
   * @returns {Game_Actor|Game_Enemy} The `Game_Battler` this battler represents.
   */
  getBattler()
  {
    return this._battler;
  };

  /**
   * Whether or not the event is actually loaded and valid.
   * @returns {boolean} True if the event is valid (non-player) and loaded, false otherwise.
   */
  isEventReady()
  {
    const character = this.getCharacter();
    if (character.isPlayer())
    {
      return false;
    }

    return !!character.event();

  };

  /**
   * The radius a battler of a different team must enter to cause this unit to engage.
   * @returns {number} The sight radius for this `JABS_Battler`.
   */
  getSightRadius()
  {
    let sight = this._sightRadius;
    if (this.isAlerted())
    {
      sight += this._alertedSightBoost;
    }

    return sight;
  };

  /**
   * The maximum distance a battler of a different team may reach before this unit disengages.
   * @returns {number} The pursuit radius for this `JABS_Battler`.
   */
  getPursuitRadius()
  {
    let pursuit = this._pursuitRadius;
    if (this.isAlerted())
    {
      pursuit += this._alertedPursuitBoost;
    }

    return pursuit;
  };

  /**
   * Gets the explicit guard range for this battler, if tagged.
   * Only relevant for guardian-role enemies; actors always return null.
   * When null, the guardian falls back to the largest pursuit radius among allied wards.
   * @returns {number|null}
   */
  getGuardRange()
  {
    return this._guardRange;
  };

  /**
   * Sets whether or not this battler is engaged.
   * @param {boolean} isEngaged Whether or not this battler is engaged.
   */
  setEngaged(isEngaged)
  {
    this._engaged = isEngaged;
  };

  /**
   * Whether or not this `JABS_Battler` is currently engaged in battle with a target.
   * @returns {boolean} Whether or not this battler is engaged.
   */
  isEngaged()
  {
    return this._engaged;
  };

  /**
   * Engage battle with the target battler.
   * @param {JABS_Battler} target The target this battler is engaged with.
   */
  engageTarget(target)
  {
    // this battler cannot engage with targets right now.
    if (this.isEngagementLocked()) return;

    // enable engagement.
    this.setIdle(false);
    this.setEngaged(true);

    // setup the target and their aggro.
    this.setTarget(target);
    this.addUpdateAggro(target.getUuid(), 0);

    // check if this is an actor-based character.
    if (this.isActor())
    {
      // disable walking through walls while the follower is engaged.
      this.getCharacter()
        .setThrough(false);
    }

    // if we're alerted, also clear the alert state.
    this.clearAlert();

    // perform on-engage effects.
    this.onEngage();
  };

  /**
   * A hook to perform all side effects of engaging a target.
   * Extensions may alias this to add telemetry, custom visuals, or other behavior.
   */
  onEngage()
  {
    this.showBalloon(J.ABS.Balloons.Exclamation);
  };

  /**
   * Disengage from the target.
   */
  disengageTarget()
  {
    // fire the hook before state is cleared so it can inspect engagement status.
    this.onDisengage();

    // clear any targeting.
    this.setTarget(null);
    this.setAllyTarget(null);

    // disable being engaged.
    this.setEngaged(false);

    // disable the alert when disengaging.
    this.clearAlert();

    // remove leader/follower data.
    this.clearFollowers();
    this.clearLeaderData();

    // forget decided action.
    this.clearDecidedAction();

    // reset all the phases back to default.
    this.resetPhases();
  };

  /**
   * A hook to perform all side effects of disengaging from a target.
   * Extensions may alias this to add telemetry, custom visuals, or other behavior.
   */
  onDisengage()
  {
    // only react to genuine disengagements, not initialization resets.
    if (!this.isEngaged()) return;

    if (J.ABS.Metadata.ShowDisengageBalloon === false) return;
    this.showBalloon(J.ABS.Metadata.DisengageBalloonId);
  };

  /**
   * Gets whether or not this battler is currently barred from engagement.
   * @returns {boolean}
   */
  isEngagementLocked()
  {
    return this._engagementLock;
  };

  /**
   * Locks engagement.
   * Disables the ability for this battler to acquire a target and do battle.
   */
  lockEngagement()
  {
    this._engagementLock = true;
  };

  /**
   * Unlocks engagement.
   * Allows this battler to engage with targets and do battle.
   */
  unlockEngagement()
  {
    this._engagementLock = false;
  };

  /**
   * Gets the current target of this battler.
   * @returns {JABS_Battler|null}
   */
  getTarget()
  {
    return this._target;
  };

  /**
   * Sets the target of this battler.
   * @param {JABS_Battler} newTarget The new target.
   */
  setTarget(newTarget)
  {
    this._target = newTarget;
  };

  /**
   * Gets the last battler struck by this battler.
   * @returns {JABS_Battler}
   */
  getBattlerLastHit()
  {
    if (this._lastHit && this._lastHit.isDead())
    {
      // if the last hit battler was defeated or something, remove it.
      this.setBattlerLastHit(null);
    }

    return this._lastHit;
  };

  /**
   * Sets the last battler struck by this battler.
   * @param {JABS_Battler} battlerLastHit The battler that is being set as last struck.
   */
  setBattlerLastHit(battlerLastHit)
  {
    this._lastHit = battlerLastHit;

    // the player-controlled character cannot have a target by normal means due
    // to them not being controlled by AI. However, their "last hit" is basically
    // the same thing, so assign their target as well.
    if (this.isPlayer())
    {
      this.setTarget(this._lastHit);
    }
  };

  /**
   * Gets whether or not this has a last battler hit currently stored.
   * @returns {boolean}
   */
  hasBattlerLastHit()
  {
    return !!this.getBattlerLastHit();
  };

  /**
   * Clears the last battler hit tracker from this battler.
   */
  clearBattlerLastHit()
  {
    this.setBattlerLastHit(null);
    this.setLastBattlerHitCountdown(0);

    // when clearing the last battler hit, also remove the player's target that
    // was likely added via the above function of "setBattlerLastHit".
    if (this.isPlayer())
    {
      this.setTarget(null);
    }
  };

  /**
   * Sets the last battler hit countdown.
   * @param {number} duration The duration in frames (60/s).
   */
  setLastBattlerHitCountdown(duration = 900)
  {
    this._lastHitCountdown = duration;
  };

  /**
   * Counts down the last hit counter.
   * @returns {boolean}
   */
  countdownLastHit()
  {
    if (this._lastHitCountdown <= 0)
    {
      this._lastHitCountdown = 0;
      if (this.hasBattlerLastHit())
      {
        this.clearBattlerLastHit();
      }
    }

    if (this._lastHitCountdown > 0)
    {
      this._lastHitCountdown--;
    }
  };

  /**
   * Gets whether or not this battler is dead inside.
   * @returns {boolean}
   */
  isDead()
  {
    const battler = this.getBattler();

    if (!battler)
    {
      // has no battler.
      return true;
    }
    else if (!JABS_AiManager.getBattlerByUuid(battler.getUuid()))
    {
      // battler isn't on the map.
      return true;
    }
    else if (battler.isDead() || this.isDying())
    {
      // battler is actually dead.
      return true;
    }
    // battler is OK!
    return false;

  };

  /**
   * Gets the current allied target of this battler.
   * @returns {JABS_Battler}
   */
  getAllyTarget()
  {
    return this._allyTarget;
  };

  /**
   * Sets the allied target of this battler.
   * @param {JABS_Battler} newAlliedTarget The new target.
   */
  setAllyTarget(newAlliedTarget)
  {
    this._allyTarget = newAlliedTarget;
  };

  /**
   * Determines the distance from this battler and the point.
   * @param {number|null} x2 The x coordinate to check.
   * @param {number|null} y2 The y coordinate to check.
   * @returns {number|null} The distance from the battler to the point.
   */
  distanceToPoint(x2, y2)
  {
    if ((x2 ?? y2) === null) return null;
    const x1 = this.getX();
    const y1 = this.getY();
    const distance = Math.hypot(x2 - x1, y2 - y1)
      .toFixed(2);
    return parseFloat(distance);
  };

  /**
   * Determines distance from this battler and the target.
   * @param {JABS_Battler} target The target that this battler is checking distance against.
   * @returns {number|null} The distance from this battler to the provided target.
   */
  distanceToDesignatedTarget(target)
  {
    if (!target) return null;

    return this.distanceToPoint(target.getX(), target.getY());
  };

  /**
   * Determines distance from this battler and the current target.
   * @returns {number|null} The distance.
   */
  distanceToCurrentTarget()
  {
    const target = this.getTarget();
    if (!target) return null;

    return this.distanceToPoint(target.getX(), target.getY());
  };

  /**
   * Determines distance from this battler and the current ally target.
   * @returns {number|null} The distance.
   */
  distanceToAllyTarget()
  {
    const target = this.getAllyTarget();
    if (!target) return null;

    return this.distanceToPoint(target.getX(), target.getY());
  };

  /**
   * A shorthand reference to the distance this battler is from it's home.
   * @returns {number} The distance.
   */
  distanceToHome()
  {
    return this.distanceToPoint(this._homeX, this._homeY);
  };

  /**
   * Gets whether or not this battler will move around while idle.
   * @returns {boolean}
   */
  canIdle()
  {
    return this._canIdle;
  };

  /**
   * Gets whether or not this battler should show its hp bar.
   * @returns {boolean}
   */
  showHpBar()
  {
    return this._showHpBar;
  };

  /**
   * Gets whether or not this battler should show its map affliction strip.
   * @returns {boolean}
   */
  showStates()
  {
    return this._showStates;
  };

  /**
   * Gets whether or not this battler should show its name.
   * @returns {boolean}
   */
  showBattlerName()
  {
    return this._showBattlerName;
  };

  /**
   * Gets whether or not this battler is in an `alerted` state.
   * @returns {boolean} True if this battler is alerted, false otherwise.
   */
  isAlerted()
  {
    return this._alerted;
  };

  /**
   * Sets the alerted state for this battler.
   * @param {boolean} alerted The new alerted state (default = true).
   */
  setAlerted(alerted = true)
  {
    this._alerted = alerted;
  };

  /**
   * Gets whether or not this battler is in an `alerted` state.
   * @returns {number} The duration remaining for this alert state.
   */
  getAlertDuration()
  {
    return this._alertDuration;
  };

  /**
   * Sets the alerted counter to this number of frames.
   * @param {number} alertedFrames The duration in frames for how long to be alerted.
   */
  setAlertedCounter(alertedFrames)
  {
    this._alertedCounter = alertedFrames;
    if (this._alertedCounter > 0)
    {
      this.setIdle(false);
      this.setAlerted();
    }
    else if (this._alertedCounter <= 0)
    {
      this.setAlerted(false);
    }
  };

  /**
   * Gets the alerted coordinates.
   * @returns {[number, number]} The `[x, y]` of the alerter.
   */
  getAlertedCoordinates()
  {
    return this._alertedCoordinates;
  };

  /**
   * Sets the alerted coordinates.
   * @param {number} x The `x` of the alerter.
   * @param {number} y The `y` of the alerter.
   */
  setAlertedCoordinates(x, y)
  {
    this._alertedCoordinates = [ x, y ];
  };

  /**
   * Whether or not this battler is at it's home coordinates.
   * @returns {boolean} True if the battler is home, false otherwise.
   */
  isHome()
  {
    return (this._event.x === this._homeX && this._event.y === this._homeY);
  };

  /**
   * Returns the X coordinate of the event portion's initial placement.
   * @returns {number} The X coordinate of this event's home.
   */
  getHomeX()
  {
    return this._homeX;
  };

  /**
   * Returns the Y coordinate of the event portion's initial placement.
   * @returns {number} The Y coordinate of this event's home.
   */
  getHomeY()
  {
    return this._homeY;
  };

  /**
   * Returns the X coordinate of the event.
   * @returns {number} The X coordinate of this event.
   */
  getX()
  {
    return this.getCharacter()._realX;
  };

  /**
   * Returns the Y coordinate of the event.
   * @returns {number} The Y coordinate of this event.
   */
  getY()
  {
    return this.getCharacter()._realY;
  };

  /**
   * Retrieves the AI associated with this battler.
   * @returns {JABS_EnemyAI} This battler's AI.
   */
  getAiMode()
  {
    return this._aiMode;
  };

  /**
   * Gets the structural coordination role of this battler.
   * Enemies read from their notetags; actors and the player return a default empty role.
   * @returns {JABS_BattlerRole}
   */
  getBattlerRole()
  {
    return this._battlerRole;
  };

  /**
   * Gets this follower's leader's AI.
   * @returns {JABS_EnemyAI} This battler's leader's AI.
   */
  getLeaderAiMode()
  {
    // if we don't have a leader, don't.
    if (!this.hasLeader()) return null;

    const leader = JABS_AiManager.getBattlerByUuid(this.getLeader());
    if (!leader) return null;

    return leader.getAiMode();
  };

  /**
   * Tries to move this battler away from its current target.
   * This may fail if the battler is pinned in a corner or something.
   */
  moveAwayFromTarget()
  {
    const battler = this.getCharacter();
    const target = this.getTarget();
    if (!target) return;
    const character = target.getCharacter();

    battler.moveAwayFromCharacter(character);
  };

  /**
   * Tries to move this battler away from its current target.
   *
   * There is no pathfinding away, but if its not able to move directly
   * away, it will try a different direction to wiggle out of corners.
   */
  smartMoveAwayFromTarget()
  {
    const battler = this.getCharacter();
    const target = this.getTarget();
    if (!target) return;

    // ai steering must not stack with forced dodge tiles / dodge speed or allies rocket diagonally.
    if (this.isDodging())
    {
      return;
    }

    if (this.guarding())
    {
      return;
    }

    battler.moveAwayFromCharacter(target.getCharacter());
    if (!battler.isMovementSucceeded())
    {
      const threatDir = battler.reverseDir(battler.direction());
      let newDir = (Math.randomInt(4) + 1) * 2;
      while (newDir === threatDir)
      {
        newDir = (Math.randomInt(4) + 1) * 2;
      }
      battler.moveStraight(newDir);
    }
  };

  /**
   * Tries to move this battler towards its current target.
   */
  smartMoveTowardTarget()
  {
    const target = this.getTarget();
    if (!target) return;

    this.smartMoveTowardCoordinates(target.getX(), target.getY());
  };

  /**
   * Tries to move this battler towards its ally target.
   */
  smartMoveTowardAllyTarget()
  {
    const target = this.getAllyTarget();
    if (!target) return;

    this.smartMoveTowardCoordinates(target.getX(), target.getY());
  };

  /**
   * Tries to move this battler toward a set of coordinates.
   * @param {number} x The `x` coordinate to reach.
   * @param {number} y The `y` coordinate to reach.
   */
  smartMoveTowardCoordinates(x, y)
  {
    // formation / idle / ai paths defer until endDodge clears dodge speed and forced steps finish.
    if (this.isDodging())
    {
      return;
    }

    if (this.guarding())
    {
      return;
    }

    const character = this.getCharacter();
    const nextDir = character.findDiagonalDirectionTo(x, y);

    if (character.isDiagonalDirection(nextDir))
    {
      const [ horz, vert ] = character.getDiagonalDirections(nextDir);
      character.moveDiagonally(horz, vert);
    }
    else
    {
      character.moveStraight(nextDir);
    }
  };

  /**
   * Turns this battler towards it's current target.
   */
  turnTowardTarget()
  {
    const character = this.getCharacter();
    const target = this.getTarget();
    if (!target) return;

    character.turnTowardCharacter(target.getCharacter());
  };

  /**
   * Whether or not the battler is able to use attacks based on states.
   * @returns {boolean} True if the battler can attack, false otherwise.
   */
  canBattlerUseAttacks()
  {
    const states = this.getBattler()
      .states();
    if (!states.length)
    {
      return true;
    }

    const disabled = states.find(state => (state.jabsDisarmed || state.jabsParalyzed));
    return !disabled;

  };

  /**
   * Whether or not the battler is able to use skills based on states.
   * @returns {boolean} True if the battler can use skills, false otherwise.
   */
  canBattlerUseSkills()
  {
    const states = this.getBattler()
      .states();
    if (!states.length)
    {
      return true;
    }

    const muted = states.find(state => (state.jabsMuted || state.jabsParalyzed));
    return !muted;

  };

  /**
   * Gets the skill id of the last skill that this battler executed.
   * @returns {number}
   */
  getLastUsedSkillId()
  {
    return this._lastUsedSkillId;
  };

  /**
   * Sets the skill id of the last skill that this battler executed.
   * @param {number} skillId The skill id of the last skill used.
   */
  setLastUsedSkillId(skillId)
  {
    this._lastUsedSkillId = skillId;
  };

  /**
   * Gets the key of the last used slot.
   * @returns {string}
   */
  getLastUsedSlot()
  {
    return this._lastUsedSlot;
  };

  /**
   * Sets the last used slot to the given slot key.
   * @param {string} slotKey The key of the last slot used.
   */
  setLastUsedSlot(slotKey)
  {
    this._lastUsedSlot = slotKey;
  };

  /**
   * Gets the id of the battler associated with this battler
   * that has been assigned via the battler core data.
   * @returns {number}
   */
  getBattlerId()
  {
    return this._battlerId;
  };

  /**
   * Gets the skill id of the next combo action in the sequence.
   * @returns {number} The skill id of the next combo action.
   */
  getComboNextActionId(cooldownKey)
  {
    const nextComboId = this.getBattler()
      .getSkillSlotManager()
      .getSlotComboId(cooldownKey);

    return nextComboId;
  };

  /**
   * Sets the skill id for the next combo action in the sequence.
   * @param {string} cooldownKey The cooldown key to check readiness for.
   * @param {number} nextComboId The skill id for the next combo action.
   */
  setComboNextActionId(cooldownKey, nextComboId)
  {
    this.getBattler()
      .getSkillSlotManager()
      .setSlotComboId(cooldownKey, nextComboId);
  };

  /**
   * Arms the first frame at which AI-controlled battlers may press the pending combo link (humanized pacing).
   * @param {number} frameNumber Global {@link Graphics.frameCount} threshold.
   */
  setAiComboHumanizedReadyFrame(frameNumber)
  {
    this._aiComboHumanizedReadyFrame = frameNumber;
  };

  /**
   * Clears AI combo timing pressure when the chain slot resets or phases reset.
   */
  clearAiComboHumanizedReadyFrame()
  {
    this._aiComboHumanizedReadyFrame = 0;
  };

  /**
   * Whether AI combo humanization allows attempting the follow-up this frame.
   * @returns {boolean}
   */
  isAiComboHumanizationTimingReady()
  {
    if (this._aiComboHumanizedReadyFrame <= 0)
    {
      return true;
    }

    return Graphics.frameCount >= this._aiComboHumanizedReadyFrame;
  };

  /**
   * Determines whether or not at least one slot has a combo skill id pending.
   * @returns {boolean} True if at least one slot's combo skill id is pending, false otherwise.
   */
  hasComboReady()
  {
    return this.getBattler()
      .getSkillSlotManager()
      .getAllSlots()
      // Test whether any row satisfies this predicate.
      .some(slot => slot.comboId !== 0);
  };

  /**
   * Gets all skills that are available to this enemy battler.
   * These skills disclude "extend" skills and non-combo-starter skills.
   * @returns {number[]} The skill ids available to this enemy.
   */
  getSkillIdsFromEnemy()
  {
    // grab the database data for this enemy.
    const battlerActions = this.getBattler()
      .enemy().actions;

    // a filter function for building the skill to check if it should be filtered.
    const filtering = action =>
    {
      // determine the skill of this action.
      const skill = this.getBattler()
        .skill(action.skillId);

      // determine if we're keeping it.
      const keep = this.aiSkillFilter(skill);

      // return what we found out.
      return keep;
    };

    // determine the valid actions available for this enemy.
    const validActions = battlerActions.filter(filtering, this);

    // extract all the skill ids of the actions.
    const validSkillIds = validActions.map(action => action.skillId);

    // return the list of filtered skill ids this battler can use.
    return validSkillIds;
  };

  /**
   * Determine whether or not this skill is a valid skill for selection by the {@link JABS_AiManager}.<br>
   * @param {RPG_Skill} skill The skill being verified.
   * @returns {boolean} True if the skill is chooseable by the AI "at random", false otherwise.
   */
  aiSkillFilter(skill)
  {
    // extract the combo data points.
    const {
      jabsComboAction,
      jabsComboStarter,
      jabsAiSkillExclusion,
    } = skill;

    // this skill is explicitly excluded from the skill pool.
    if (jabsAiSkillExclusion) return false;

    // determine if this skill is a combo action.
    const isCombo = !!jabsComboAction;

    // determine if this skill is a combo starter.
    const isComboStarter = !!jabsComboStarter;

    // we can only include combo starter combo skills.
    const isNonComboStarterSkill = (isCombo && !isComboStarter);

    // combo skills that are not combo starters are excluded from the skill pool.
    if (isNonComboStarterSkill) return false;

    // valid skill!
    return true;
  };

  /**
   * Retrieves the skillId of the basic attack for this enemy.
   * @returns {number} The skillId of the basic attack.
   */
  getEnemyBasicAttack()
  {
    return this.getBattler()
      .basicAttackSkillId();
  };

  /**
   * Gets all skill ids that this battler has access to, including the basic attack.
   * @returns {number[]}
   */
  getAllSkillIdsFromEnemy()
  {
    // grab all the added skills.
    const skills = this.getSkillIdsFromEnemy();

    // grab this enemy's basic attack.
    const basicAttackSkillId = this.getEnemyBasicAttack();

    // add the basic attack to the list of skills.
    skills.push(basicAttackSkillId);

    // return the built list.
    return skills;
  };

  /**
   * Forces a display of a emoji balloon above this battler's head.
   * @param {number} balloonId The id of the balloon to display on this character.
   */
  showBalloon(balloonId)
  {
    $gameTemp.requestBalloon(this._event, balloonId);
  };

  /**
   * Displays an animation on the battler.
   * @param {number} animationId The id of the animation to play on the battler.
   */
  showAnimation(animationId)
  {
    this.getCharacter()
      .requestAnimation(animationId);
  };

  /**
   * Checks if there is currently an animation playing on this character.
   * @returns {boolean} True if there is an animation playing, false otherwise.
   */
  isShowingAnimation()
  {
    return this.getCharacter()
      .isAnimationPlaying();
  };

  /**
   * Flags this battler as in‑combat for the full window.
   */
  enterCombat()
  {
    // set the in‑combat countdown to the window max.
    this.setInCombatCountdown(this.getCombatWindowMax());
  };

  /**
   * Gets the remaining frames for the in‑combat countdown.
   * @returns {number}
   */
  getInCombatCountdown()
  {
    // return the number of frames remaining while in combat.
    return this._inCombatCountdown || 0;
  };

  /**
   * Gets the remaining in‑combat time in seconds with one decimal.
   * @returns {number}
   */
  getCombatSecondsRemaining()
  {
    // convert remaining frames to seconds (60fps) with one decimal place.
    const seconds = (this.getInCombatCountdown() / 60).toFixed(1);

    // return the remaining seconds as a number.
    return parseFloat(seconds);
  };

  /**
   * Gets whether or not this battler is currently considered in‑combat.
   * @returns {boolean}
   */
  isInCombat()
  {
    // honor the forced combat flag.
    if ($jabsEngine.forcedCombat === true) return true;

    // a positive countdown means still in combat.
    if (this._inCombatCountdown > 0) return true;

    // nothing combat-related is happening.
    return false;
  };

  /**
   * Gets the default in‑combat window duration.
   * @returns {number}
   */
  getCombatWindowMax()
  {
    // return the configured max (fallback guards against legacy saves).
    return this._inCombatWindowMax || 600;
  };

  /**
   * Sets the default in‑combat window duration.
   * @param {number} frames The number of frames to use for the window.
   */
  setCombatWindowMax(frames)
  {
    // clamp to zero minimum.
    this._inCombatWindowMax = Math.max(0, frames);
  };

  /**
   * Sets the current in‑combat countdown window.
   * @param {number} frames The number of frames remaining.
   */
  setInCombatCountdown(frames)
  {
    // clamp to zero minimum.
    this._inCombatCountdown = Math.max(0, frames);
  };

  /**
   * Counts down the in‑combat timer.
   */
  countdownCombat()
  {
    // stop counting if finished.
    if (this._inCombatCountdown <= 0)
    {
      this._inCombatCountdown = 0;
      return;
    }

    // opportunistically compress the countdown when combat is truly clear.
    // This reduces long tails after one‑shot wipes or non-retaliated kills.
    // Tail length is 120 frames (2.0s) by default.
    this._maybeShortenCombatTail(120);

    // tick the countdown.
    this._inCombatCountdown--;
  };

  /**
   * Optionally clamps the in‑combat countdown to a short tail when there are
   * no living enemies with aggro on the party.
   * @param {number} tailFrames The maximum tail to leave when calm (in frames).
   */
  _maybeShortenCombatTail(tailFrames)
  {
    // do not lengthen; only clamp if the window is larger than our tail.
    if (this._inCombatCountdown <= tailFrames)
    {
      return;
    }

    // establish the full combat window for comparison.
    const windowMax = this.getCombatWindowMax();

    // define a grace period to allow AI aggro to register after (re)entering combat.
    const graceFrames = 15;

    // determine if we are within the grace window (i.e., just re/entered combat).
    const withinGraceWindow = this._inCombatCountdown > (windowMax - graceFrames);
    if (withinGraceWindow)
    {
      return;
    }

    // if nobody is aggroed to the party, compress the combat tail.
    if (JABS_AiManager.anyLivingEnemiesAggroedToParty() === false)
    {
      this._inCombatCountdown = tailFrames;
    }
  };
  //endregion _reference

  //region statics
  /**
   * Generates a `JABS_Battler` based on the current leader of the party.
   * Also assigns the controller inputs for the player.
   */
  static createPlayer()
  {
    // grab the leader of the party.
    const battler = $gameParty.leader();

    // if they are ready to be initialized, then do so.
    const actorId = battler
      ? battler.actorId()
      : 0;
    const coreData = JABS_BattlerCoreData.Builder()
      .setBattlerId(actorId)
      .isPlayer()
      .build();

    // return the created player.
    return new JABS_Battler($gamePlayer, battler, coreData);
  };

  // TODO: parameterize this on a per-enemy basis?
  /**
   * If a battler is less than this distance from the target, they are considered "close".
   * @type {number}
   */
  static closeDistance = 3.0;

  /**
   * If a battler is more than this distance from the target, they are considered "far".
   * @type {number}
   */
  static farDistance = 5.0;

  /**
   * Determines if the battler is close to the target based on distance.
   * @param {number} distance The distance away from the target.
   */
  static isClose(distance)
  {
    return distance <= JABS_Battler.closeDistance;
  };

  /**
   * Determines if the battler is at a safe range from the target based on distance.
   * @param {number} distance The distance away from the target.
   */
  static isSafe(distance)
  {
    return (distance > JABS_Battler.closeDistance) && (distance <= JABS_Battler.farDistance);
  };

  /**
   * Determines if the battler is far away from the target based on distance.
   * @param {number} distance The distance away from the target.
   */
  static isFar(distance)
  {
    return distance > JABS_Battler.farDistance;
  };

  /**
   * Determines whether or not the skill id is a guard-type skill or not.
   * @param id {number} The id of the skill to check.
   * @returns {boolean} True if it is a guard skill, false otherwise.
   */
  static isGuardSkillById(id)
  {
    // if there is no id to check, then it is not a dodge skill.
    if (!id) return false;

    // if the skill type is not "guard skill", then this is not a guard skill.
    if ($dataSkills[id].stypeId !== J.ABS.DefaultValues.GuardSkillTypeId) return false;

    // its a guard skill!
    return true;
  };

  /**
   * Determines whether or not the skill id is a dodge-type skill or not.
   * @param id {number} The id of the skill to check.
   * @returns {boolean} True if it is a dodge skill, false otherwise.
   */
  static isDodgeSkillById(id)
  {
    // if there is no id to check, then it is not a dodge skill.
    if (!id) return false;

    // if the skill type is not "dodge skill", then this is not a dodge skill.
    if ($dataSkills[id].stypeId !== J.ABS.DefaultValues.DodgeSkillTypeId) return false;

    // its a dodge skill!
    return true;
  };

  /**
   * Determines whether or not the skill id is a weapon-type skill or not.
   * @param id {number} The id of the skill to check.
   * @returns {boolean}
   */
  static isWeaponSkillById(id)
  {
    // if there is no id to check, then it is not a weapon skill.
    if (!id) return false;

    // if the skill type is not "weapon skill", then this is not a weapon skill.
    if ($dataSkills[id].stypeId !== J.ABS.DefaultValues.WeaponSkillTypeId) return false;

    // its a weapon skill!
    return true;
  };

  /**
   * Determines whether or not a skill should be visible
   * in the jabs combat skill assignment menu.
   * @param skill {RPG_Skill} The skill to check.
   * @returns {boolean}
   */
  static isSkillVisibleInCombatMenu(skill)
  {
    // invalid skills are not visible in the combat skill menu.
    if (!skill) return false;

    // explicitly hidden skills are not visible in the combat skill menu.
    if (skill.jabsHiddenFromMenus) return false;

    // dodge skills are not visible in the combat skill menu.
    if (JABS_Battler.isDodgeSkillById(skill.id)) return false;

    // guard skills are not visible in the combat skill menu.
    if (JABS_Battler.isGuardSkillById(skill.id)) return false;

    // weapon skills are not visible in the combat skill menu.
    if (JABS_Battler.isWeaponSkillById(skill.id)) return false;

    // skills explicitly opted into the offhand assignment list are surfaced there
    // instead of the combat menu, to avoid a single skill bleeding across both menus.
    if (skill.jabsOffhandEligible) return false;

    // show this skill!
    return true;
  };

  /**
   * Determines whether or not a skill should be visible
   * in the jabs offhand skill assignment menu.
   *
   * The offhand quick menu only surfaces learned skills that explicitly opt into
   * offhand selection. Equipment-provided offhand skills are injected elsewhere
   * by the actor, so they do not participate in this learned-skill filter.
   *
   * Dodge, guard, hidden, and generic weapon skills are excluded from this list.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {boolean}
   */
  static isSkillVisibleInOffhandMenu(skill)
  {
    // invalid skills are not visible in the offhand menu.
    if (!skill) return false;

    // explicitly hidden skills are not visible in the offhand menu.
    if (skill.jabsHiddenFromMenus) return false;

    // dodge skills belong to the dodge slot, not the offhand.
    if (JABS_Battler.isDodgeSkillById(skill.id)) return false;

    // guard skills are configured via equipment, not via the player-pinned offhand list.
    if (JABS_Battler.isGuardSkillById(skill.id)) return false;

    // generic weapon skills are still equipment-driven; they are not blanket-pickable.
    if (JABS_Battler.isWeaponSkillById(skill.id)) return false;

    // learned skills must opt in explicitly via the offhandEligible notetag.
    return skill.jabsOffhandEligible === true;
  };

  /**
   * Determines whether or not a skill should be visible
   * in the jabs dodge skill assignment menu.
   * @param skill {RPG_Skill} The skill to check.
   * @returns {boolean}
   */
  static isSkillVisibleInDodgeMenu(skill)
  {
    // invalid skills are not visible in the dodge menu.
    if (!skill) return false;

    // explicitly hidden skills are not visible in the dodge menu.
    if (skill.jabsHiddenFromMenus) return false;

    // non-dodge skills are not visible in the dodge menu.
    if (!JABS_Battler.isDodgeSkillById(skill.id)) return false;

    // show this skill!
    return true;
  };


  /**
   * Gets the team id for allies, including the player.
   * @returns {0}
   */
  static allyTeamId()
  {
    return 0;
  };

  /**
   * Gets the team id for enemies.
   * @returns {1}
   */
  static enemyTeamId()
  {
    return 1;
  };

  /**
   * Gets the team id for neutral parties.
   * @returns {2}
   */
  static neutralTeamId()
  {
    return 2;
  };

  /**
   * Gets the distance that allies are detected and can extend away from the player.
   * @returns {number}
   */
  static allyRubberbandRange()
  {
    return parseFloat(10 + J.ABS.Metadata.AllyRubberbandAdjustment);
  };
  //endregion statics

  //region updates
  /**
   * Things that are battler-respective and should be updated on their own.
   */
  update()
  {
    // don't update map battlers if JABS is disabled.
    if (!$jabsEngine.absEnabled) return;

    this.updateCooldowns();
    this.updateTimers();
    this.updateEngagement();
    this.updateRegen();
    this.updateDodging();
    this.updateDeathHandling();
    this.updateSelfInterruptOnMove();
  };

  /**
   * Self-interrupts an in-flight cast/channel the instant the player expresses movement intent.
   *
   * Watches the same raw input signals any movement implementation itself reads (directional
   * input, an active click-to-move destination) rather than hooking a specific movement method-
   * this project's pixel-movement plugin fully overwrites `Game_Player.moveByInput` rather than
   * aliasing it, so hooking that (or `executeMove`, which it never calls) would be fragile to
   * plugin load order. Reading raw input also naturally excludes forced displacement (knockback,
   * pull-forward, jumps) from ever counting as a self-interrupt, since none of those touch
   * `Input`/`$gameTemp`'s destination state.
   */
  updateSelfInterruptOnMove()
  {
    // only the player expresses movement intent through input; AI battlers already refrain from
    // moving while busy via their own explicit isCastingOrChanneling() gates.
    if (!this.isPlayer()) return;

    // nothing to interrupt if not busy, or if this specific cast/channel roots the player anyway.
    if (!this.isCastingOrChanneling()) return;
    if (this.hasUninterruptibleMovementLock()) return;

    // check the same raw signals a movement implementation would consult to decide to move.
    const wantsToMove = (Input.dir8 > 0) || $gameTemp.isDestinationValid();
    if (!wantsToMove) return;

    // cancel the in-flight cast/channel; full effective cooldown penalty applies.
    this.interrupt(100, true);
  };

  /**
   * Process any queued actions and execute them.
   */
  processQueuedActions()
  {
    // if we cannot process actions, then do not.
    if (!this.canProcessQueuedActions()) return;

    // gather the most recent decided action.
    const decidedActions = this.getDecidedAction();

    // grab the primary action for potential option lookups.
    const primaryAction = decidedActions.at(0);

    // set the last skill used to be the skill we just used.
    this.setLastUsedSkillId(primaryAction.getBaseSkill().id);

    // set the last slot used to be the slot of the skill we just used.
    this.setLastUsedSlot(primaryAction.getCooldownType());

    // vessel skills carrying a `<channel:[...]>` tag divert into the channel state machine
    // instead of executing normally- the decided action is retained (not cleared) for the
    // duration of the channel so busy-gates/gauges/label lookups keep working.
    if (primaryAction.getBaseSkill().jabsChannel.length)
    {
      this.beginChannel(primaryAction);
      return;
    }

    // resolve the coordinates to execute this action at.
    const [ targetX, targetY ] = this.resolveActionTargetCoordinates(primaryAction);

    // execute the action.
    $jabsEngine.executeMapActions(this, decidedActions, targetX, targetY);

    // clear the queued action.
    this.clearDecidedAction();
  };

  /**
   * Resolves the `[x, y]` coordinates to execute the given action at: a frozen decision-time
   * location takes priority, falling back to live direct-action resolution otherwise.
   * @param {JABS_Action} action The action to resolve target coordinates for.
   * @returns {[number|null, number|null]} The resolved coordinates, or `[null, null]`.
   */
  resolveActionTargetCoordinates(action)
  {
    // initialize target coordinates as null to preserve legacy behavior if not resolved.
    let targetX = null;
    let targetY = null;

    // without an action, there is nothing to resolve.
    if (!action) return [ targetX, targetY ];

    // grab the action options for this action.
    const options = action.getActionOptions();

    // try to read a frozen target location from the options.
    const loc = options
      ? options.getTargetLocation()
      : null;

    // if a frozen location exists, extract coordinates from it.
    if (loc)
    {
      // extract the frozen coordinates.
      targetX = loc.getX();
      targetY = loc.getY();
    }

    // if we still don't have coordinates, perform live resolution (legacy behavior).
    if (targetX === null || targetY === null)
    {
      // resolve the target coordinates for this action if applicable.
      const [ x, y ] = this.resolveDirectActionTargetCoordinates(action);

      // assign the resolved coordinates, if any.
      targetX = x;
      targetY = y;
    }

    return [ targetX, targetY ];
  };

  /**
   * Check if we can process any queued actions.
   * @returns {boolean}
   */
  canProcessQueuedActions()
  {
    // check if we have an action decided.
    if (!this.isActionDecided()) return false;

    // check if we're still casting actions.
    if (this.isCasting()) return false;

    // an active channel resolves its own ticks on its own timer; nothing further to process here.
    if (this.isChanneling()) return false;

    // validate that non-players are in-position.
    if (!this.isPlayer() && !this.isInPosition()) return false;

    // we can process all the actions!
    return true;
  };

  /**
   * Resolves the [x, y] coordinates to spatialize a direct action, if applicable.
   * If resolution is not applicable or not possible, returns [ null, null ].
   * @param {JABS_Action} primaryAction The primary action being executed.
   * @returns {[number|null, number|null]} The resolved [x, y] coordinates or [null, null].
   */
  resolveDirectActionTargetCoordinates(primaryAction)
  {
    // default the coordinates to nulls.
    let x = null;
    let y = null;

    // if there is no action or the action is not direct, do not resolve.
    if (!primaryAction || !primaryAction.isDirectAction()) return [ x, y ];

    // extract the underlying game action for scope checks.
    const gameAction = primaryAction.getAction();

    // if the action targets self, resolve to the caster's location.
    if (gameAction.isForUser())
    {
      // use the caster's current tile.
      x = this.getX();
      y = this.getY();

      // return the resolved coordinates.
      return [ x, y ];
    }

    // if the action targets allies, attempt to resolve using an ally target if available.
    if (gameAction.isForFriend())
    {
      // grab the ally target if supported.
      const allyTarget = this.getAllyTarget();

      // if an ally target exists, use their current tile.
      if (allyTarget)
      {
        x = allyTarget.getX();
        y = allyTarget.getY();

        // return the resolved coordinates.
        return [ x, y ];
      }
    }

    // for opponents (or everyone), run the full priority chain using the base skill.
    const opponentTarget = this.resolveDirectOpponentTarget(primaryAction.getBaseSkill());

    // if the chain found a candidate, use their coordinates.
    if (opponentTarget)
    {
      x = opponentTarget.getX();
      y = opponentTarget.getY();
    }

    // return whatever we resolved (or nulls if not resolved).
    return [ x, y ];
  };

  /**
   * Resolves [x,y] for a direct skill at decision-time using the battler’s current/known target context.
   * Returns [null, null] if this is not applicable.
   * @param {RPG_Skill} skill The skill being decided.
   * @returns {[number|null, number|null]} The resolved coordinates, or [null, null].
   */
  resolveDirectActionTargetCoordinatesForSkill(skill)
  {
    // default to nulls.
    let x = null;
    let y = null;

    // if not a direct skill, do not resolve.
    if (!skill.jabsDirect) return [ x, y ];

    // create a temporary Game_Action to leverage scope helpers.
    const ga = new Game_Action(this.getBattler(), false);
    ga.setSkill(skill.id);

    // self-targeting anchors to caster.
    if (ga.isForUser())
    {
      // spatialize onto the caster.
      x = this.getX();
      y = this.getY();
      return [ x, y ];
    }

    // ally-targeting tries explicit ally target only.
    if (ga.isForFriend())
    {
      // grab any selected ally target.
      const allyTarget = this.getAllyTarget();

      // if found, use ally tile.
      if (allyTarget)
      {
        x = allyTarget.getX();
        y = allyTarget.getY();
        return [ x, y ];
      }

      // no ally target selected; do not guess a random ally.
      return [ x, y ];
    }

    // for opponents (or everyone), run the full priority chain.
    const opponentTarget = this.resolveDirectOpponentTarget(skill);

    // freeze whichever target won the priority contest.
    if (opponentTarget)
    {
      x = opponentTarget.getX();
      y = opponentTarget.getY();
    }

    // return what we got (possibly nulls).
    return [ x, y ];
  };

  /**
   * Resolves the best opponent target for a direct skill using the five-tier priority chain.
   * Performs a single spatial scan upfront; all scan-based tiers filter that shared list
   * rather than re-querying the spatial index independently.
   *
   * Priority order:
   *   1. Closest state-bearing opponent (requires {@link jabsDirectStateTarget}).
   *   2. Known non-inanimate target (getTarget / getBattlerLastHit, within range).
   *   3. Closest non-inanimate opponent from the proximity scan.
   *   4. Known inanimate target (getTarget / getBattlerLastHit, within range).
   *   5. Closest inanimate opponent from the proximity scan (covers training dummies etc.).
   *
   * Returns null only when absolutely no candidate exists within range.
   * @param {RPG_Skill} skill The direct skill being resolved.
   * @returns {JABS_Battler|null} The winning target, or null if none found.
   */
  resolveDirectOpponentTarget(skill)
  {
    // the proximity limit gates all tiers of the chain.
    const proximityLimit = skill.jabsProximity ?? 0;

    // read the optional state-anchor id — null skips the state tier entirely.
    const stateTargetId = skill.jabsDirectStateTarget;

    // perform a single spatial scan; tiers 1, 3, and 5 all filter this shared list.
    const candidates = proximityLimit > 0
      ? JABS_AiManager.getBattlersWithinRange(this, proximityLimit)
      : [];

    // walk the five-tier priority chain.
    return this.resolveDirectTargetByState(stateTargetId, candidates)
      ?? this.resolveDirectTargetNonInanimate(proximityLimit)
      ?? this.resolveDirectTargetViaScan(candidates)
      ?? this.resolveDirectTargetInanimateFallback(proximityLimit)
      ?? this.resolveDirectTargetInanimateScan(candidates);
  };

  /**
   * Filters the pre-built candidate list for the closest opponent currently afflicted
   * with the given state. This is the highest-priority tier for direct skills that
   * carry a {@link jabsDirectStateTarget} tag, ensuring the skill snaps to the "pinned"
   * target before considering anything else in the chain.
   * @param {number|null} stateId The state ID to search for; null skips this tier entirely.
   * @param {JABS_Battler[]} candidates The pre-scanned battlers within proximity.
   * @returns {JABS_Battler|null} The closest state-bearing opponent within range, or null.
   */
  resolveDirectTargetByState(stateId, candidates)
  {
    // if no state id is configured, there is nothing to scan for.
    if (!stateId) return null;

    // find the closest opponent carrying the target state.
    let closest = null;
    let closestDistance = Infinity;

    for (const candidate of candidates)
    {
      // skip self and same-team battlers.
      if (candidate === this) continue;
      if (candidate.isEnemy() === this.isEnemy()) continue;

      // skip battlers not afflicted with the target state.
      if (!candidate.getBattler().isStateAffected(stateId)) continue;

      // track the closest qualifying candidate.
      const distance = this.distanceToDesignatedTarget(candidate);
      if (distance < closestDistance)
      {
        closestDistance = distance;
        closest = candidate;
      }
    }

    // return the closest found, or null if none qualify.
    return closest;
  };

  /**
   * Checks the explicit target and last-hit battler, returning the first one that is
   * non-inanimate and within the given proximity limit.
   * @param {number} proximityLimit The max tile distance allowed; 0 means uncapped.
   * @returns {JABS_Battler|null} The first qualifying non-inanimate known target, or null.
   */
  resolveDirectTargetNonInanimate(proximityLimit)
  {
    // evaluate getTarget() then getBattlerLastHit() in priority order.
    const known = [ this.getTarget(), this.getBattlerLastHit() ];

    for (const candidate of known)
    {
      // skip null slots and inanimate targets.
      if (!candidate || candidate.isInanimate()) continue;

      // skip candidates that fall outside the configured proximity cap.
      const distance = this.distanceToDesignatedTarget(candidate);
      if (proximityLimit !== 0 && distance > proximityLimit) continue;

      // first qualifying candidate wins.
      return candidate;
    }

    // no non-inanimate known target found within range.
    return null;
  };

  /**
   * Filters the pre-built candidate list for the closest non-inanimate opponent.
   * Used when known targets are inanimate or out of range, so a direct skill
   * cannot accidentally lock onto a barrel while real enemies are nearby.
   * @param {JABS_Battler[]} candidates The pre-scanned battlers within proximity.
   * @returns {JABS_Battler|null} The closest qualifying non-inanimate opponent, or null.
   */
  resolveDirectTargetViaScan(candidates)
  {
    // find the closest non-inanimate opponent among the candidates.
    let closest = null;
    let closestDistance = Infinity;

    for (const candidate of candidates)
    {
      // skip self, inanimate targets, and same-team battlers.
      if (candidate === this) continue;
      if (candidate.isInanimate()) continue;
      if (candidate.isEnemy() === this.isEnemy()) continue;

      // track the closest qualifying candidate.
      const distance = this.distanceToDesignatedTarget(candidate);
      if (distance < closestDistance)
      {
        closestDistance = distance;
        closest = candidate;
      }
    }

    // return the closest found, or null if the area is clear.
    return closest;
  };

  /**
   * Filters the pre-built candidate list for the closest inanimate opponent.
   * This is the last resort when all non-inanimate tiers have come up empty —
   * covers training dummies, barrels, and other inanimate targets that are
   * genuinely the only thing in range.
   * @param {JABS_Battler[]} candidates The pre-scanned battlers within proximity.
   * @returns {JABS_Battler|null} The closest inanimate opponent, or null.
   */
  resolveDirectTargetInanimateScan(candidates)
  {
    // find the closest inanimate opponent among the candidates.
    let closest = null;
    let closestDistance = Infinity;

    for (const candidate of candidates)
    {
      // skip self and same-team battlers; inanimate is required this time.
      if (candidate === this) continue;
      if (!candidate.isInanimate()) continue;
      if (candidate.isEnemy() === this.isEnemy()) continue;

      // track the closest qualifying candidate.
      const distance = this.distanceToDesignatedTarget(candidate);
      if (distance < closestDistance)
      {
        closestDistance = distance;
        closest = candidate;
      }
    }

    // return the closest found, or null if no inanimate opponents are nearby.
    return closest;
  };

  /**
   * Last-resort fallback: returns the explicit target or last-hit battler even if they are
   * inanimate, as long as they are within the proximity limit. This preserves intentional
   * use of direct skills on inanimate objects when no live opponents are present.
   * @param {number} proximityLimit The max tile distance allowed; 0 means uncapped.
   * @returns {JABS_Battler|null} The first known target within range, regardless of
   *   inanimate status, or null if none qualify.
   */
  resolveDirectTargetInanimateFallback(proximityLimit)
  {
    // prefer explicit target, then last-hit.
    const candidate = this.getTarget() ?? this.getBattlerLastHit();

    // no known candidate exists.
    if (!candidate) return null;

    // check the candidate falls within range.
    const distance = this.distanceToDesignatedTarget(candidate);
    if (proximityLimit !== 0 && distance > proximityLimit) return null;

    // return the inanimate candidate as the last resort.
    return candidate;
  };

  /**
   * Updates all cooldowns for this battler.
   */
  updateCooldowns()
  {
    this.getBattler()
      .getSkillSlotManager()
      .updateCooldowns(this.isCastingOrChanneling());
  };

  /**
   * Updates all timers for this battler.
   */
  updateTimers()
  {
    this.processWaitTimer();
    this.processAlertTimer();
    this.processParryTimer();
    this.processLastHitTimer();
    this.processCombatTimer();
    this.processCastingTimer();
    this.processChannelingTimer();
    this.processEngagementTimer();
  };

  /**
   * Updates the timer for "waiting".
   */
  processWaitTimer()
  {
    this._waitTimer.update();
  };

  /**
   * Updates the timer for "alerted".
   */
  processAlertTimer()
  {
    // if alerted, update the alert timer.
    if (this.isAlerted())
    {
      this.countdownAlert();
    }
  };

  /**
   * Updates the timer for "parrying".
   */
  processParryTimer()
  {
    // if parrying, update the parry timer.
    if (this.parrying())
    {
      this.getCharacter()
        .requestAnimation(131);
      this.countdownParryWindow();
    }
  };

  /**
   * Updates the timer for "last hit".
   */
  processLastHitTimer()
  {
    // if this battler has a last hit, update the last hit timer.
    if (this.hasBattlerLastHit())
    {
      this.countdownLastHit();
    }
  };

  /**
   * Updates the timer for "in combat".
   */
  processCombatTimer()
  {
    // if in combat, update the combat timer.
    if (this.isInCombat())
    {
      this.countdownCombat();
    }
  };

  /**
   * Updates the timer for "casting".
   */
  processCastingTimer()
  {
    // if casting, update the cast timer.
    if (this.isCasting())
    {
      // process the cast countdown.
      this.countdownCastTime();

      // check if we are no longer casting because we completed the cast timer.
      if (!this.isCasting())
      {
        this.onCastComplete();
      }
    }
  };

  /**
   * Hook triggered when an action's cast was completed.
   */
  onCastComplete()
  {
    // grab the primary decided action.
    const decidedActions = this.getDecidedAction();

    // if we somehow don't have an action, do not proceed.
    if (!decidedActions) return;

    // extract the primary action.
    const [ decidedAction, ] = decidedActions;

    // flag the action as having completed its cast time.
    decidedAction.completeCast();
  };

  /**
   * Begins channeling a `<channel:[SKILL_ID, TOTAL_DURATION]>` vessel skill: pays its cost once,
   * then repeatedly executes the child skill every tick until the full duration elapses or the
   * channel is cut short by {@link JABS_Battler#interrupt}. The vessel's own damage/effects are
   * never invoked- authoring a real effect onto a channel skill is a no-op by design.
   * @param {JABS_Action} action The decided vessel action carrying the `<channel>` tag.
   */
  beginChannel(action)
  {
    const skill = action.getBaseSkill();
    const [ channelSkillId, totalDuration ] = skill.jabsChannel;

    // pay the vessel's cost once, upfront- every tick thereafter is free of cost.
    $jabsEngine.paySkillCosts(this, action);

    // record this execution in the caster's skill history for history-based bonuses,
    // matching what a normal (non-channel) execution would log.
    $jabsEngine.logSkillExecution(this.getUuid(), skill.id, skill.stypeId);

    // retain the source action for cooldown lookups at completion/interrupt time.
    this._channelSourceAction = action;
    this._channelSkillId = channelSkillId;
    this._channelDurationRemaining = totalDuration;
    this._channelTickCountdown = skill.jabsChannelTickSpeed;
    this._channeling = true;
  };

  /**
   * Updates the timer for "channeling".
   */
  processChannelingTimer()
  {
    // if not channeling, there is nothing to update.
    if (!this.isChanneling()) return;

    // count down until the next repeated execution of the channel's child skill first- a tick
    // due on the exact same frame the duration expires still fires (e.g. <channel:[25, 180]>
    // with a tick speed of 30 fires all 6 ticks, including the one landing on frame 180).
    this._channelTickCountdown--;
    if (this._channelTickCountdown <= 0)
    {
      this.executeChannelTick();

      // reset using the vessel's own tick speed (may itself be a plugin-param fallback).
      this._channelTickCountdown = this._channelSourceAction.getBaseSkill().jabsChannelTickSpeed;
    }

    // count down the total channel duration; once it expires, the channel is over.
    this._channelDurationRemaining--;
    if (this._channelDurationRemaining <= 0)
    {
      this.onChannelComplete();
      return;
    }
  };

  /**
   * Fires one repeated execution of the channel's child skill, resolving its target the same way
   * the vessel skill itself would- a frozen target/location for `<targeted>` skills, or live
   * resolution otherwise.
   */
  executeChannelTick()
  {
    const [ targetX, targetY ] = this.resolveActionTargetCoordinates(this._channelSourceAction);
    $jabsEngine.forceMapAction(this, this._channelSkillId, false, targetX, targetY);
  };

  /**
   * Hook triggered when a channel's total duration elapses uninterrupted. Fires the optional
   * `<onChannelComplete:[SKILL_ID, ...]>` payoff skill(s), then applies the vessel skill's normal
   * effective cooldown- exactly as if it had just executed normally.
   */
  onChannelComplete()
  {
    const sourceAction = this._channelSourceAction;

    this.endChannel();

    // fire each payoff skill for free, resolved the same way the channel's ticks were.
    const [ targetX, targetY ] = this.resolveActionTargetCoordinates(sourceAction);
    sourceAction.getBaseSkill().jabsOnChannelComplete
      .forEach(skillId => $jabsEngine.forceMapAction(this, skillId, false, targetX, targetY));

    // apply the vessel's own normal effective cooldown, same as any other skill finishing.
    $jabsEngine.applyCooldownCounters(this, sourceAction);

    // the channel is done occupying this battler; release the decided action slot.
    this.clearDecidedAction();
  };

  /**
   * Tears down channel state without applying any cooldown or firing any payoff- shared cleanup
   * between natural completion and interruption.
   */
  endChannel()
  {
    this._channeling = false;
    this._channelSkillId = 0;
    this._channelTickCountdown = 0;
    this._channelDurationRemaining = 0;
  };

  /**
   * Gets whether or not this battler is currently channeling a skill.
   * @returns {boolean}
   */
  isChanneling()
  {
    return this._channeling;
  };

  /**
   * Gets the number of frames remaining in the active channel's total duration.
   * @returns {number}
   */
  getChannelDurationRemaining()
  {
    return this._channelDurationRemaining;
  };

  /**
   * Gets whether or not this battler is occupied by either a cast or a channel- the shared
   * "busy" predicate consulted anywhere a new action/charge/parry decision needs to be blocked
   * while committed to one of these two states.
   * @returns {boolean}
   */
  isCastingOrChanneling()
  {
    return this.isCasting() || this.isChanneling();
  };

  /**
   * Whether or not the currently in-flight cast/channel roots this battler in place, per its own
   * `<cannotMoveToInterrupt>` tag. Always false when not casting/channeling at all.
   * @returns {boolean}
   */
  hasUninterruptibleMovementLock()
  {
    // not casting or channeling means there is nothing to be rooted by.
    if (!this.isCastingOrChanneling()) return false;

    // consult the in-flight skill's own opt-in root tag.
    const decidedActions = this.getDecidedAction();
    const skill = decidedActions
      ? decidedActions.at(0).getBaseSkill()
      : null;
    return skill
      ? skill.jabsCannotMoveToInterrupt
      : false;
  };

  /**
   * Cancels an in-flight cast or channel prematurely.
   *
   * For a cast, the decided action is discarded before it ever executes- the skill simply never
   * fires. For a channel, state is torn down immediately- ticks that already fired stand, but no
   * further ticks and no `<onChannelComplete>` payoff occur.
   *
   * A cooldown penalty is always applied to the interrupted skill's own slot: the full effective
   * cooldown for a self-interrupt (moving away), or that cooldown scaled by `magnifierPct` for an
   * external interrupt (hit by an `<interrupt:MAGNIFIER>` skill).
   * @param {number} magnifierPct The percent of the effective cooldown to apply; ignored (treated
   * as 100) when `isSelfInterrupt` is true.
   * @param {boolean} isSelfInterrupt Whether this interrupt was caused by the caster choosing to
   * move, rather than by an external hit.
   */
  interrupt(magnifierPct = 100, isSelfInterrupt = false)
  {
    // determine which in-flight action is being interrupted, and tear down the relevant state.
    let sourceAction = null;
    if (this.isChanneling())
    {
      sourceAction = this._channelSourceAction;
      this.endChannel();
    }
    else if (this.isCasting())
    {
      const decidedActions = this.getDecidedAction();
      sourceAction = decidedActions ? decidedActions.at(0) : null;
      this._casting = false;
      this.setCastTimeCountdown(0);
    }

    // nothing was actually in-flight; there is nothing to penalize.
    if (!sourceAction) return;

    // self-interrupt always eats the full effective cooldown; external interrupt scales by the
    // attacking skill's own magnifier.
    const penaltyPct = isSelfInterrupt
      ? 100
      : magnifierPct;
    const penalty = sourceAction.getCooldown() * (penaltyPct / 100);
    $jabsEngine.applyCooldownValueForSkill(this, sourceAction, penalty);

    // the interrupted skill never executes; release the decided action slot.
    this.clearDecidedAction();
  };

  /**
   * Updates the timer for "engagement".
   *
   * This is an important timer that prevents recalculating distances for all
   * battlers on the map every frame.
   */
  processEngagementTimer()
  {
    this._engagementTimer.update();
  };

  /**
   * Monitors all other battlers and determines if they are engaged or not.
   */
  updateEngagement()
  {
    // ai engagement is blocked for players and while the game is paused.
    if (!this.canUpdateEngagement()) return;

    // grab the nearest target to this battler.
    const target = JABS_AiManager.getClosestOpposingBattler(this);

    // if we're unable to engage the target, do not engage.
    if (!this.canEngageTarget(target)) return;

    // determine the distance to the target from this battler.
    const distance = this.distanceToDesignatedTarget(target);

    // process engagement handling.
    this.handleEngagement(target, distance);

    // reset the engagement timer.
    this._engagementTimer.reset();
  };

  /**
   * If this battler is the player, a hidden battler, an inanimate battler, or the abs is paused, then
   * prevent engagement updates.
   * @returns {boolean}
   */
  canUpdateEngagement()
  {
    // if JABS is paused, we do not update engagement.
    if ($jabsEngine.absPause) return false;

    // the player cannot engage.
    if (this.isPlayer()) return false;

    // inanimate battlers cannot engage.
    if (this.isInanimate()) return false;

    // if the engagement timer is not ready, we cannot update.
    if (!this._engagementTimer.isTimerComplete()) return false;

    // if we're already engaged, no need to further update engagement- its confusing.
    if (this.isEngaged()) return false;

    // if we are unable to alter engagement, don't update engagement.
    if (this.isEngagementLocked()) return false;

    // engage!
    return true;
  };

  /**
   * Determines if this battler can engage the given target.
   * @param {JABS_Battler} target The potential target to engage.
   * @returns {boolean} True if we can engage this target, false otherwise.
   */
  canEngageTarget(target)
  {
    // you cannot engage with nothing.
    if (!target) return false;

    // you cannot engage with yourself.
    if (target.getUuid() === this.getUuid()) return false;

    // engage!
    return true;
  };

  /**
   * Process the engagement with the given target and distance.
   * @param {JABS_Battler} target The target in question for engagement.
   * @param {number} distance The distance between this battler and the target.
   */
  handleEngagement(target, distance)
  {
    // check if we're already engaged.
    if (this.isEngaged())
    {
      // if engaged already, check if maybe we should now disengage.
      if (this.shouldDisengage(target, distance))
      {
        // disengage combat with the target.
        this.disengageTarget();
      }
    }
    // we aren't engaged yet.
    else
    {
      // check if we should now engage this target based on the given distance.
      if (this.shouldEngage(target, distance))
      {
        // engage in combat with the target.
        this.engageTarget(target);
      }
    }
  };

  /**
   * Determines whether or not this battler should disengage from it's target.
   * @param {JABS_Battler} target The target to potentially disengage from.
   * @param {number} distance The distance in number of tiles.
   * @returns {boolean}
   */
  shouldDisengage(target, distance)
  {
    // check if we're out of pursuit range with this target.
    const isOutOfRange = !this.inPursuitRange(target, distance);

    // return the findings.
    return isOutOfRange;
  };

  /**
   * Determines whether or not this battler should engage to the nearest target.
   * @param {JABS_Battler} target The target to potentially engage.
   * @param {number} distance The distance in number of tiles.
   * @returns {boolean}
   */
  shouldEngage(target, distance)
  {
    // check if we're in range of sight with the target.
    const isInSightRange = this.inSightRange(target, distance);
    if (isInSightRange === false) return false;

    // sentinels only pick up targets within their home territory; this mirrors the
    // leash check in hasSentinelTargetExceededHomeRange so engage and leash use the
    // same reference point and never produce an immediate engage-then-disengage cycle.
    if (this.getBattlerRole().sentinel)
    {
      const distanceFromHome = target.distanceToPoint(this.getHomeX(), this.getHomeY());
      if (distanceFromHome > this.getSightRadius()) return false;
    }

    return true;
  };

  /**
   * Updates the dodge skill.
   */
  updateDodging()
  {
    // if we cannot update dodge, do not.
    if (!this.canUpdateDodge()) return;

    // cancel the dodge if we got locked down.
    this.handleDodgeCancel();

    // force dodge move while dodging.
    this.handleDodgeMovement();

    // if the dodge is over, end the dodging.
    this.handleDodgeEnd();
  };

  /**
   * Determine whether or not this battler can update its dodging.
   * @returns {boolean}
   */
  canUpdateDodge()
  {
    // followers/enemies run the same dodge step + endDodge cleanup as the leader once executeDodgeSkill fires.
    // gating on isPlayer() prevented endDodge from ever running for allies, leaving dodge speed stuck on forever.
    return this.isDodging();
  };

  /**
   * Handles the ending of dodging if the battler is interrupted.
   */
  handleDodgeCancel()
  {
    // check if we really should cancel dodging.
    if (!this.shouldCancelDodge()) return;

    // end the dodging.
    this.endDodge();
  };

  /**
   * Checks if we should cancel the dodge.
   * @returns {boolean}
   */
  shouldCancelDodge()
  {
    // if the battler cannot move, then we should cancel dodging.
    if (!this.canBattlerMove()) return true;

    // nothing is canceling the dodge.
    return false;
  };

  /**
   * Handles the forced movement while dodging.
   */
  handleDodgeMovement()
  {
    // update the iframes for the dodge.
    this.updateDodgeIFrames()

    // if we cannot dodge move, do not.
    if (!this.canDodgeMove()) return;

    // perform the movement.
    this.executeDodgeMovement();
  };

  /**
   * Updates the dodge iframes, and applies windowed invincibility.
   */
  updateDodgeIFrames()
  {
    // only process i‑frames while actively dodging.
    if (!this.isDodging()) return;

    // advance the dodge frames.
    this.incrementDodgeFrame();

    // grab the iframes window.
    const iframesWindow = this.getDodgeIFrames();

    // if there isn't an iframe window, then don't update them.
    if (iframesWindow === null) return;

    // destructure the iframe window into its start and end frames.
    const [ startF, endF ] = iframesWindow;

    // grab the current frame.
    const currentFrame = this.getDodgeFrame();

    // apply windowed invincibility.
    const inWindow = (currentFrame >= startF && currentFrame <= endF);
    this.setInvincible(inWindow);
  };

  /**
   * Determines whether or not this character can be forced to dodge move.
   * @returns {boolean}
   */
  canDodgeMove()
  {
    // if the character is currently moving, don't dodge move.
    if (this.getCharacter()
      .isMoving())
    {
      return false;
    }

    // if the battler cannot move, don't dodge move.
    if (!this.canBattlerMove()) return false;

    // if we are out of dodge steps, don't dodge move.
    if (this.getDodgeSteps() <= 0) return false;

    // if we are not dodging, don't dodge move.
    if (!this.isDodging()) return false;

    // we can dodge move!
    return true;
  };

  /**
   * Performs the forced dodge movement in the direction of the dodge.
   */
  executeDodgeMovement()
  {
    const character = this.getCharacter();
    const direction = this.getDodgeDirection();

    // move the character based on their direction.
    if (character.isDiagonalDirection(direction))
    {
      character.moveDiagonally(direction);
    }
    else if (character.isStraightDirection(direction))
    {
      character.moveStraight(direction);
    }

    // reduce the dodge steps.
    this.decrementDodgeSteps();
  };

  /**
   * Handles the conclusion of the dodging if necessary.
   */
  handleDodgeEnd()
  {
    // keep i‑frames evaluated every tick even if we didn’t step this frame.
    this.updateDodgeIFrames();

    // check if we even should end the dodge.
    if (!this.shouldEndDodge()) return;

    // conclude the dodge.
    this.endDodge();
  };

  /**
   * Determines wehether or not to end the dodging.
   * @returns {boolean}
   */
  shouldEndDodge()
  {
    // if we are out of dodge steps and we're done moving, end the dodge.
    if (this.getDodgeSteps() <= 0 && !this.getCharacter()
      .isMoving())
    {
      return true;
    }

    // KEEP DODGING.
    return false;
  };

  /**
   * Stops the dodge and resets the values to default.
   */
  endDodge()
  {
    // stop the dodge.
    this.setDodging(false);

    // set dodge steps to 0 regardless of what they are.
    this.setDodgeSteps(0);

    // disable the invincibility from dodging.
    this.setInvincible(false);

    // explicitly clear the dodge speed modifier to avoid residual boosts.
    this.getCharacter().setDodgeModifier(0);

    // reset the dodge frames.
    this.setDodgeFrame(0);

    // reset the dodge Iframes.
    this.setDodgeIFrames(0);
  };

  /**
   * Handles when this enemy battler is dying.
   */
  updateDeathHandling()
  {
    // don't do this for actors/players.
    if (this.isActor()) return;

    // do nothing if we are waiting.
    if (this.isWaiting()) return;

    // if the event is erased officially, ignore it.
    if (this.getCharacter()
      .isErased())
    {
      return;
    }

    // if we are dying, self-destruct.
    if (this.isDying() && !$gameMap.isEventRunning())
    {
      this.destroy();
    }
  };
  //endregion updates

  //region aggro
  /**
   * Adjust the currently engaged target based on aggro.
   */
  adjustTargetByAggro()
  {
    // don't process aggro for inanimate battlers.
    if (this.isInanimate()) return;

    // extract the uuid of the current highest aggro.
    const highestAggroUuid = this.getHighestAggro()
      .uuid();

    // check if we currently don't have a target.
    if (!this.getTarget())
    {
      // grab the battler for that uuid.
      const newTarget = JABS_AiManager.getBattlerByUuid(highestAggroUuid);

      // make sure the battler exists before setting it.
      if (newTarget)
      {
        // set it.
        this.setTarget(newTarget);
      }

      // stop processing .
      return;
    }

    // if the target is no longer valid, disengage and end combat.
    this.removeAggroIfInvalid(this.getTarget()
      .getUuid());

    const allAggros = this.getAggrosSortedHighestToLowest();

    // if there is no aggros remaining, disengage.
    if (allAggros.length === 0)
    {
      this.disengageTarget();
      return;
    }

    // if there is only 1 aggro remaining
    if (allAggros.length === 1)
    {
      // if there is no target, just stop that shit.
      if (!this.getTarget()) return;

      // grab the uuid of the first aggro in the list.
      const zerothAggroUuid = allAggros.at(0)
        .uuid();

      // check to see if the last aggro in the list belongs to the current target.
      if (!(this.getTarget()
        .getUuid() === zerothAggroUuid))
      {
        // if it doesn't, then get that battler.
        const newTarget = JABS_AiManager.getBattlerByUuid(zerothAggroUuid);
        if (newTarget)
        {
          // then switch to that target!
          this.setTarget(newTarget);
        }
        else
        {
          // if the battler doesn't exist but the aggro does, purge it.
          this.removeAggro(zerothAggroUuid);
        }
      }

      // stop processing.
      return;
    }

    // if you still don't have a target but have multiple aggros, then just give up.
    if (!this.getTarget()) return;

    // filtered aggros containing only aggros of enemies that are nearby.
    const filteredAggros = allAggros.filter(aggro =>
    {
      // the battler associated with the aggro.
      const potentialTarget = JABS_AiManager.getBattlerByUuid(aggro.uuid());

      // if the target is invalid somehow, then it is not a valid aggro.
      if (!potentialTarget) return false;

      // if the target is too far away, don't consider it.
      if (this.getPursuitRadius() < this.distanceToDesignatedTarget(potentialTarget)) return false;

      // this aggro target is fine!
      return true;
    });

    // all aggro'd targets are too far, don't adjust targets.
    if (filteredAggros.length === 0) return;

    // find the highest aggro target currently being tracked.
    const highestAggroTargetUuid = filteredAggros.at(0)
      .uuid();

    // grab the current target of this battler at the moment.
    const currentTargetUuid = this.getTarget()
      .getUuid();

    // if the current target isn't the highest target, then switch!
    if (highestAggroTargetUuid !== currentTargetUuid)
    {
      // find the new target to change to that has more aggro than the current target.
      const newTarget = JABS_AiManager.getBattlerByUuid(highestAggroTargetUuid);

      // if we can't find the target on the map somehow, then try to remove it from the list of aggros.
      if (!newTarget)
      {
        // get the index to remove...
        this.removeAggro(highestAggroTargetUuid);
      }
      else
      {
        // we found it, let's engage!
        this.engageTarget(newTarget);
      }
    }

    // the current target IS the highest aggro! Continue as-usual.
  };

  /**
   * Gets all aggros on this battler.
   * @returns {JABS_Aggro[]}
   */
  getAllAggros()
  {
    return this._aggros;
  };

  /**
   * Gets the highest aggro currently tracked by this battler.
   * If the top two highest aggros are the same, this will add +1 to one of them
   * and use that instead to prevent infinite looping.
   * @returns {JABS_Aggro}
   */
  getHighestAggro()
  {
    // grab the aggros pre-sorted.
    const sortedAggros = this.getAggrosSortedHighestToLowest();

    // validate we have aggros.
    if (sortedAggros.length === 0)
    {
      // no aggros means no highest.
      return null;
    }

    // check if we only have a single aggro tracked.
    if (sortedAggros.length === 1)
    {
      // return that one aggro.
      return sortedAggros.at(0);
    }

    // otherwise, grab the first and second highest aggros.
    const [ highestAggro, secondHighestAggro, ] = sortedAggros;

    // check if the top two aggros are the same.
    if (highestAggro.aggro === secondHighestAggro.aggro)
    {
      // modify the first one by 1 to actually be higher.
      highestAggro.modAggro(1, true);
    }

    // return the result.
    return highestAggro;
  };

  /**
   * Gets all the aggros for this battler, sorted from highest to lowest.
   * @returns {JABS_Aggro[]}
   */
  getAggrosSortedHighestToLowest()
  {
    // a sorting function for determining the highest aggro from a collection.
    const sorting = (a, b) =>
    {
      if (a.aggro < b.aggro)
      {
        return 1
      }
      else if (a.aggro > b.aggro)
      {
        return -1;
      }

      return 0;
    };

    // grab the aggros.
    const aggros = this.getAllAggros();

    // sort them by their aggro rating.
    aggros.sort(sorting);

    // return the sorted aggros.
    return aggros;
  };

  /**
   * If the target is invalid somehow, then stop tracking its aggro.
   * @param {string} uuid The uuid of the target to potentially invalidate aggro for.
   */
  removeAggroIfInvalid(uuid)
  {
    // check if any of the captured conditions are true.
    if (this.isAggroInvalid(uuid))
    {
      // remove the aggro from this battler's tracking.
      this.removeAggro(uuid);
    }
  };

  /**
   * Determines whether or not this battler's aggro against a given target is invalid.
   * @param {string} uuid The uuid of the target to potentially invalidate aggro for.
   * @returns {boolean} True if the aggro is invalid, false otherwise.
   */
  isAggroInvalid(uuid)
  {
    // grab the battler from tracking.
    const battler = JABS_AiManager.getBattlerByUuid(uuid);

    // if the battler doesn't exist, then the aggro is invalid.
    if (!battler) return true;

    // if the battler is actually dead, then the aggro is invalid.
    if (battler.isDead()) return true;

    // if the battler is too far from this battler, then the aggro is invalid.
    if (battler.outOfRange(this)) return true;

    // the aggro must be valid.
    return false;
  };

  /**
   * Removes a single aggro by its `uuid`.
   * @param {string} uuid The `uuid` of the aggro to remove.
   */
  removeAggro(uuid)
  {
    // get the index to remove...
    const indexToRemove = this._aggros.findIndex(aggro => aggro.uuid() === uuid);
    if (indexToRemove > -1)
    {
      // if currently engaged with the dead target, then disengage.
      if (this.getTarget()
        .getUuid() === uuid)
      {
        this.disengageTarget();
      }

      // ...and remove it.
      this._aggros.splice(indexToRemove, 1);
    }
  };

  /**
   * Adds a new aggro tracker to this battler, or updates an existing one.
   * @param {string} uuid The unique identifier of the target.
   * @param {number} aggroValue The amount of aggro being modified.
   * @param {boolean} forced If provided, then this application will bypass locks.
   */
  addUpdateAggro(uuid, aggroValue, forced = false)
  {
    // if the aggro is locked, don't adjust it.
    if (this.getBattler()
      .isAggroLocked() && !forced)
    {
      return;
    }

    const foundAggro = this.aggroExists(uuid);
    if (foundAggro)
    {
      foundAggro.modAggro(aggroValue, forced);
    }
    else
    {
      const newAggro = new JABS_Aggro(uuid);
      newAggro.setAggro(aggroValue, forced);
      this._aggros.push(newAggro);
    }
  };

  /**
   * Resets the aggro for a particular target.
   * @param {string} uuid The unique identifier of the target to reset.
   * @param {boolean} forced If provided, then this application will bypass locks.
   */
  resetOneAggro(uuid, forced = false)
  {
    // if the aggro is locked, don't adjust it.
    if (this.getBattler()
      .isAggroLocked() && !forced)
    {
      return;
    }

    const foundAggro = this.aggroExists(uuid);
    if (foundAggro)
    {
      foundAggro.resetAggro(forced);
    }
    else
    {
      // if the uuid provided is empty, then do nothing with it.
      if (!uuid) return;

      // otherwise, create a new aggro for this battler.
      this.addUpdateAggro(uuid, 0, forced);
    }
  };

  /**
   * Resets all aggro on this battler.
   * @param {string} uuid The unique identifier of the target resetting this battler's aggro.
   * @param {boolean} forced If provided, then this application will bypass locks.
   */
  resetAllAggro(uuid, forced = false)
  {
    // if the aggro is locked, don't adjust it.
    if (this.getBattler()
      .isAggroLocked() && !forced)
    {
      return;
    }

    // reset the aggro of the battler that triggered this reset to prevent pursuit.
    this.resetOneAggro(uuid, forced);

    // and reset all aggros this battler has.
    this._aggros.forEach(aggro => aggro.resetAggro(forced));
  };

  /**
   * Gets an aggro by its unique identifier.
   * If the aggro doesn't exist, then returns undefined.
   * @param {string} uuid The unique identifier of the target resetting this battler's aggro.
   * @returns {JABS_Aggro}
   */
  aggroExists(uuid)
  {
    return this._aggros.find(aggro => aggro.uuid() === uuid);
  };
  //endregion aggro

  //region dodging
  /**
   * Gets whether or not this battler is dodging.
   * @returns {boolean} True if currently dodging, false otherwise.
   */
  isDodging()
  {
    return this._dodging;
  };

  /**
   * Sets whether or not this battler is dodging.
   * @param {boolean} dodging Whether or not the battler is dodging (default = true).
   */
  setDodging(dodging)
  {
    this._dodging = dodging;
  };

  /**
   * Gets the direction that the battler will be moved when dodging.
   * @returns {number}
   */
  getDodgeDirection()
  {
    return this._dodgeDirection;
  };

  /**
   * Sets the direction that the battler will be moved when dodging.
   * @param {2|4|6|8|1|3|7|9} direction The numeric direction to be moved.
   */
  setDodgeDirection(direction)
  {
    this._dodgeDirection = direction;
  };

  /**
   * Gets the number of dodge steps remaining to be stepped whilst dodging.
   * @returns {number}
   */
  getDodgeSteps()
  {
    return this._dodgeSteps;
  };

  /**
   * Sets the number of steps that will be force-moved when dodging.
   * @param {number} stepCount The number of steps to dodge.
   */
  setDodgeSteps(stepCount)
  {
    this._dodgeSteps = stepCount;
  };

  /**
   * Decrements the dodge steps remaining.
   */
  decrementDodgeSteps()
  {
    this._dodgeSteps--;
  };

  /**
   * Gets the current frame of the dodge animation.
   * @returns {number}
   */
  getDodgeFrame()
  {
    return this._dodgeFrame;
  };

  /**
   * Sets the current frame of the dodge animation.
   * @param {number} frame The dodge frame.
   */
  setDodgeFrame(frame)
  {
    this._dodgeFrame = frame;
  };

  /**
   * Increments the dodge frame.
   */
  incrementDodgeFrame()
  {
    this._dodgeFrame++;
  };

  /**
   * Gets the iframe window for this dodge, or null if there is none.
   * @returns {[number, number]|null}
   */
  getDodgeIFrames()
  {
    return this._dodgeIframes;
  };

  /**
   * Sets the number of iframes the dodge has.
   * @param {number} frames The number of iframes.
   */
  setDodgeIFrames(frames)
  {
    this._dodgeIFrames = frames;
  };

  /**
   * Tries to execute the battler's dodge skill.
   * Checks to see if costs are payable before executing.
   */
  tryDodgeSkill()
  {
    // grab the battler.
    const battler = this.getBattler();

    // grab the resolved skill id for the dodge slot, applying any active transform.
    const skillId = battler.getResolvedSkillId(JABS_Button.Dodge);

    // if we have no skill id in the dodge slot, then do not dodge.
    if (!skillId) return;

    // grab the skill for the given dodge skill id.
    const skill = this.getSkill(skillId);

    // determine if it can be paid.
    if (battler.canPaySkillCost(skill))
    {
      // execute the skill in the dodge slot.
      this.executeDodgeSkill(skill);
    }
  };

  /**
   * Executes the provided dodge skill.
   * @param {RPG_Skill} skill The RPG item representing the dodge skill.
   * @param {number} [forcedDirection8] When set, skips movement-note inference (AI rolls away from a threat vector).
   */
  executeDodgeSkill(skill, forcedDirection8)
  {
    // dodge and held guard share the body; drop guard so dodge movement and speed stack cleanly.
    if (this.guarding())
    {
      this.executeGuard(false, JABS_Button.Offhand);
    }

    // set up any parsed i‑frame window; not applied yet pending semantics.
    this.setDodgeIFrames(skill.jabsIFrames);

    // apply invincibility now if using the full‑duration flag.
    this.setInvincible(skill.jabsInvincibleDodge);

    // apply the move speed modifier for the dodge.
    this.getCharacter()
      .setDodgeModifier(skill.jabsDodgeSpeed);

    // set the number of steps this dodge will move you.
    this.setDodgeSteps(skill.jabsDodgeSteps);

    // set the direction to be dodging in.
    let dodgeDirection;
    if (forcedDirection8 !== undefined && forcedDirection8 !== null)
    {
      dodgeDirection = forcedDirection8;
    }
    else
    {
      dodgeDirection = this.determineDodgeDirection(skill.jabsMoveType);
    }

    this.setDodgeDirection(dodgeDirection);

    // also execute the mobility skill’s action payload.
    const actionOptions = JABS_ActionOptions.Builder()
      .setCooldownKey(JABS_Button.Dodge)
      .build();

    // create the action(s) from the dodge skill.
    const actions = this.createJabsActionFromSkill(skill.id, actionOptions);

    // ensure the cooldown key is present on each action (mirrors main/offhand path).
    actions.forEach(a => a.setCooldownType(JABS_Button.Dodge));

    // execute the actions immediately; this applies costs/cooldowns/animations properly.
    $jabsEngine.executeMapActions(this, actions);

    // trigger the dodge!
    this.setDodging(true);
  };

  /**
   * AI-only: spends dodge toward open tile away from an opposing battler when interrupt logic demands it.
   * @param {JABS_Battler} threatBattler The hostile pressure source.
   * @returns {boolean} True when dodge map actions actually fired.
   */
  tryExecuteAiEmergencyDodgeAwayFrom(threatBattler)
  {
    const battler = this.getBattler();

    // get the resolved skill id for the dodge slot, applying any active transform.
    const skillId = battler.getResolvedSkillId(JABS_Button.Dodge);

    if (!skillId)
    {
      return false;
    }

    if (!JABS_Battler.isDodgeSkillById(skillId))
    {
      return false;
    }

    if (!this.canExecuteSkill(skillId))
    {
      return false;
    }

    const skill = this.getSkill(skillId);

    if (!battler.canPaySkillCost(skill))
    {
      return false;
    }

    const chr = this.getCharacter();
    const threatChr = threatBattler.getCharacter();
    const towardThreat = chr.findDirectionTo(threatChr.x, threatChr.y);
    const awayFromThreat = chr.reverseDir(towardThreat);

    this.executeDodgeSkill(skill, awayFromThreat);

    return true;
  };

  /**
   * Whether one dodge step in the given eight-way direction is passable for this character.
   * Prefers Pixelistics collision probes when present.
   * @param {Game_Character} character The character that will step.
   * @param {number} direction8 Eight-way direction constant.
   * @returns {boolean}
   */
  canDirectionalDodgeStepPass(character, direction8)
  {
    // diagonal directions require a decomposed passability check against both axes.
    if (character.isDiagonalDirection(direction8))
    {
      const [ horz, vert ] = character.getDiagonalDirections(direction8);
      return character.canPassDiagonally(character._x, character._y, horz, vert);
    }

    // cardinal directions use the standard passability check.
    return character.canPass(character._x, character._y, direction8);
  };

  /**
   * Scores eight-way directions by alignment with fleeing away from a unit threat vector.
   * @param {number} ux Unit X component away from threat (world space).
   * @param {number} uy Unit Y component away from threat (world space).
   * @returns {{d: number, s: number}[]} Sorted best-first for dodge preference.
   */
  static buildDirectionalDodgeScores(ux, uy)
  {
    const rows = [
      { d: J.ABS.Directions.UP, vx: 0, vy: -1 },
      { d: J.ABS.Directions.DOWN, vx: 0, vy: 1 },
      { d: J.ABS.Directions.LEFT, vx: -1, vy: 0 },
      { d: J.ABS.Directions.RIGHT, vx: 1, vy: 0 },
      { d: J.ABS.Directions.UPPERLEFT, vx: -1, vy: -1 },
      { d: J.ABS.Directions.UPPERRIGHT, vx: 1, vy: -1 },
      { d: J.ABS.Directions.LOWERLEFT, vx: -1, vy: 1 },
      { d: J.ABS.Directions.LOWERRIGHT, vx: 1, vy: 1 },
    ];

    const scored = rows.map(({ d, vx, vy }) => ({
      d,
      s: vx * ux + vy * uy,
    }));

    // Order rows so later logic can assume stable sequencing.
    scored.sort((a, b) => b.s - a.s);

    return scored;
  };

  /**
   * Directional dodge for non-leader battlers: flee passable directions away from the best threat,
   * never preferring toward-negative alignment before exhausting safer options.
   * @returns {number} Eight-way direction code.
   */
  pickAiDirectionalDodgeDirection()
  {
    const character = this.getCharacter();
    const threat = JABS_AiManager.getClosestOpposingBattler(this)
      || JABS_AiManager.findDefensiveThreatBattler(this);

    if (!threat || threat.isDead())
    {
      return character.direction();
    }

    const tx = threat.getX();
    const ty = threat.getY();
    const dxAway = character.x - tx;
    const dyAway = character.y - ty;
    const magSq = dxAway * dxAway + dyAway * dyAway;

    if (magSq < 0.0001)
    {
      return character.reverseDir(character.direction());
    }

    const mag = Math.sqrt(magSq);
    const ux = dxAway / mag;
    const uy = dyAway / mag;
    const scored = JABS_Battler.buildDirectionalDodgeScores(ux, uy);

    const pickWithFloor = minScore =>
    {
      for (let i = 0; i < scored.length; i++)
      {
        if (scored[i].s < minScore)
        {
          continue;
        }

        if (this.canDirectionalDodgeStepPass(character, scored[i].d))
        {
          return scored[i].d;
        }
      }

      return 0;
    };

    let chosen = pickWithFloor(0.01);

    if (chosen)
    {
      return chosen;
    }

    chosen = pickWithFloor(-0.2);

    if (chosen)
    {
      return chosen;
    }

    chosen = pickWithFloor(-999);

    if (chosen)
    {
      return chosen;
    }

    return character.direction();
  };

  /**
   * Translates a dodge skill type into a direction to move.
   * @param {'forward'|'backward'|'directional'} moveType The type of dodge skill the player is using.
   */
  determineDodgeDirection(moveType)
  {
    const character = this.getCharacter();

    switch (moveType)
    {
      case J.ABS.Notetags.MoveType.Forward:
        return character.direction();

      case J.ABS.Notetags.MoveType.Backward:
        return character.reverseDir(character.direction());

      case J.ABS.Notetags.MoveType.Directional:
        if (character.isPlayer())
        {
          if (Input.dir8 === 0)
          {
            return character.direction();
          }

          return Input.dir8;
        }

        return this.pickAiDirectionalDodgeDirection();

      default:
        return character.direction();
    }
  };
  //endregion dodging

  //region guarding
  /**
   * Whether or not the precise-parry window is active.
   * @returns {boolean}
   */
  parrying()
  {
    return this._parryWindow > 0;
  };

  /**
   * Sets the battlers precise-parry window frames.
   * @param {number} parryFrames The number of frames available for precise-parry.
   */
  setParryWindow(parryFrames)
  {
    if (parryFrames < 0)
    {
      this._parryWindow = 0;
    }
    else
    {
      // store  parry window on the instance for later reads.
      this._parryWindow = parryFrames;
    }
  };

  /**
   * Get whether or not this battler is currently guarding.
   * @returns {boolean}
   */
  guarding()
  {
    return this._isGuarding;
  };

  /**
   * Set whether or not this battler is currently guarding.
   * @param {boolean} isGuarding True if the battler is guarding, false otherwise.
   */
  setGuarding(isGuarding)
  {
    this._isGuarding = isGuarding;
  };

  /**
   * The flat amount to reduce damage by when guarding.
   * @returns {number}
   */
  flatGuardReduction()
  {
    if (!this.guarding()) return 0;

    return this._guardFlatReduction;
  };

  /**
   * Sets the battler's flat reduction when guarding.
   * @param {number} flatReduction The flat amount to reduce when guarding.
   */
  setFlatGuardReduction(flatReduction)
  {
    this._guardFlatReduction = flatReduction;
  };

  /**
   * The percent amount to reduce damage by when guarding.
   * @returns {number}
   */
  percGuardReduction()
  {
    if (!this.guarding()) return 0;

    return this._guardPercReduction;
  };

  /**
   * Sets the battler's percent reduction when guarding.
   * @param {number} percReduction The percent amount to reduce when guarding.
   */
  setPercGuardReduction(percReduction)
  {
    this._guardPercReduction = percReduction;
  };

  /**
   * Checks to see if retrieving the counter-guard skill id is appropriate.
   * @returns {number[]}
   */
  counterGuard()
  {
    return this.guarding()
      ? this.counterGuardIds()
      : [];
  };

  /**
   * Gets the id of the skill for counter-guarding.
   * @returns {number[]}
   */
  counterGuardIds()
  {
    return this._counterGuardIds;
  };

  /**
   * Sets the battler's retaliation id for guarding.
   * @param {number[]} counterGuardSkillIds The skill id to counter with while guarding.
   */
  setCounterGuard(counterGuardSkillIds)
  {
    this._counterGuardIds = counterGuardSkillIds;
  };

  /**
   * Checks to see if retrieving the counter-parry skill id is appropriate.
   * @returns {number[]}
   */
  counterParry()
  {
    return this.guarding()
      ? this.counterParryIds()
      : [];
  };

  /**
   * Gets the ids of the skill for counter-parrying.
   * @returns {number[]}
   */
  counterParryIds()
  {
    return this._counterParryIds;
  };

  /**
   * Sets the id of the skill to retaliate with when successfully precise-parrying.
   * @param {number[]} counterParrySkillIds The skill ids of the counter-parry skill.
   */
  setCounterParry(counterParrySkillIds)
  {
    this._counterParryIds = counterParrySkillIds;
  };

  /**
   * Gets the guard skill id most recently assigned.
   * @returns {number}
   */
  getGuardSkillId()
  {
    return this._guardSkillId;
  };

  /**
   * Sets the guard skill id to a designated skill id.
   *
   * This gets removed when guarding/parrying.
   * @param guardSkillId
   */
  setGuardSkillId(guardSkillId)
  {
    this._guardSkillId = guardSkillId;
  };

  /**
   * Gets all data associated with guarding for this battler.
   * @returns {JABS_GuardData|null}
   */
  getGuardData(cooldownKey)
  {
    // shorthand the battler of which we're getting data for.
    const battler = this.getBattler();

    // determine the resolved skill in the given slot, applying any active transform.
    const skillId = battler.getResolvedSkillId(cooldownKey);

    // if we have no skill to guard with, then we don't guard.
    if (!skillId) return null;

    // if the skill isn't a guard skill, then it won't have guard data.
    if (!JABS_Battler.isGuardSkillById(skillId)) return null;

    // get the skill.
    const skill = this.getSkill(skillId);

    // check also to make sure we can use the guard skill in the slot.
    const canUse = battler.meetsSkillConditions(skill);

    // if we cannot use the guard skill due to constraints, then we don't guard.
    if (!canUse) return null;

    // return the guard data off the skill.
    return skill.jabsGuardData;
  };

  /**
   * Determines whether or not the skill slot is a guard-type skill or not.
   * @param {string} cooldownKey The key to determine if its a guard skill or not.
   * @returns {boolean} True if it is a guard skill, false otherwise.
   */
  isGuardSkillByKey(cooldownKey)
  {
    // get the resolved skill in the given slot, applying any active transform.
    const skillId = this.getBattler()
      .getResolvedSkillId(cooldownKey);

    // if we don't hve a skill id, it isn't a guard skill.
    if (!skillId) return false;

    // if it it isn't a guard skill by its id, then ... it isn't a guard skill.
    if (!JABS_Battler.isGuardSkillById(skillId)) return false;

    // its a guard skill!
    return true;
  };

  /**
   * Triggers and maintains the guard state.
   * @param {boolean} guarding True if the battler is guarding, false otherwise.
   * @param {string} skillSlot The skill slot to build guard data from.
   */
  executeGuard(guarding, skillSlot)
  {
    // if we're still guarding, and already in a guard state, don't reset.
    if (guarding && this.guarding()) return;

    // if not guarding anymore, turn off the guard state.
    if (!guarding && this.guarding())
    {
      // stop guarding.
      this.endGuarding();

      // stop processing.
      return;
    }

    // if we aren't guarding now, and weren't guarding before, don't do anything.
    if (!guarding) return;

    // if not guarding, wasn't guarding before, but want to guard, then let's guard!
    const guardData = this.getGuardData(skillSlot);

    // if we cannot guard, then don't try.
    if (!guardData || !guardData.canGuard()) return;

    // begin guarding!
    this.startGuarding(skillSlot);
  };

  /**
   * Begin guarding with the given skill slot.
   * @param {string} skillSlot The skill slot containing the guard data.
   */
  startGuarding(skillSlot)
  {
    // grab the guard data.
    const guardData = this.getGuardData(skillSlot);

    // begin guarding!
    this.setGuarding(true);
    this.setFlatGuardReduction(guardData.flatGuardReduction);
    this.setPercGuardReduction(guardData.percGuardReduction);
    this.setCounterGuard(guardData.counterGuardIds);
    this.setCounterParry(guardData.counterParryIds);
    this.setGuardSkillId(guardData.skillId);

    // calculate parry frames, include eva bonus to parry.
    const totalParryFrames = this.getBonusParryFrames(guardData) + guardData.parryDuration;

    // if the guarding skill has a parry window, apply those frames once.
    if (guardData.canParry()) this.setParryWindow(totalParryFrames);
  };

  /**
   * Ends the guarding stance for this battler.
   */
  endGuarding()
  {
    // end the guarding tracker.
    this.setGuarding(false);

    // reset ally ai guard timing so max-hold does not fire on the next stance.
    this._aiAllyGuardRaiseFrame = 0;

    // remove any remaining parry time.
    this.setParryWindow(0);

    // stop posing.
    this.endAnimation();
  };

  /**
   * Abstraction of the definition of how to determine what the bonus to parry frames is.
   * @param {JABS_GuardData} guardData The guard data.
   * @returns {number}
   */
  getBonusParryFrames(guardData)
  {
    return Math.floor((1 + this.getBattler().per) * guardData.parryDuration);
  };

  /**
   * Counts down the parry window that occurs when guarding is first activated.
   */
  countdownParryWindow()
  {
    if (this.parrying())
    {
      this._parryWindow--;
    }

    if (this._parryWindow < 0)
    {
      this._parryWindow = 0;
    }
  };
  //endregion guarding

  //region map
  /**
   * Performs a preliminary check to see if the target is actually able to be hit.
   * @returns {boolean} True if actions can potentially connect, false otherwise.
   */
  canActionConnect()
  {
    // this battler is untargetable.
    if (this.isInvincible()) return false;

    // precise timing allows for battlers to hit other battlers the instant they
    // meet event conditions, and that is not grounds to hit enemies.
    if (this.getCharacter()
      .isJabsAction())
    {
      return false;
    }

    // invisible followers are not combat-eligible; actions pass through them.
    if (this.isFollower() && this.getCharacter().isVisible() === false) return false;

    // passes all the criteria.
    return true;
  };

  /**
   * Determines whether or not this battler is available as a target based on the
   * provided action's scopes.
   * @param {JABS_Action} action The action to check validity for.
   * @param {JABS_Battler} target The potential candidate for hitting with this action.
   * @param {boolean} alreadyHitOne Whether or not this action has already hit a target.
   */
  // eslint-disable-next-line complexity
  isWithinScope(
    action,
    target,
    alreadyHitOne = false
  )
  {
    const user = action.getCaster();
    const gameAction = action.getAction();
    const scopeAlly = gameAction.isForFriend();
    const scopeOpponent = gameAction.isForOpponent();
    const scopeSingle = gameAction.isForOne();
    const scopeSelf = gameAction.isForUser();
    const scopeMany = gameAction.isForAll();
    const scopeEverything = gameAction.isForEveryone();
    const scopeAllAllies = scopeAlly && scopeMany;
    const scopeAllOpponents = scopeOpponent && scopeMany;

    const targetIsSelf = (user.getUuid() === target.getUuid() || (action.getAction()
      .isForUser()));
    const actionIsSameTeam = JABS_TeamRules.isFriendly(user.getTeam(), this.getTeam());
    const targetIsOpponent = JABS_TeamRules.isOpposed(user.getTeam(), this.getTeam());

    // scope is for 1 target, and we already found one.
    if (scopeSingle && alreadyHitOne)
    {
      return false;
    }

    // the caster and target are the same.
    if (targetIsSelf && (scopeSelf || scopeAlly || scopeAllAllies || scopeEverything))
    {
      return true;
    }

    // action is from one of the target's allies.
    // inanimate battlers cannot be targeted by their allies with direct skills.
    if (actionIsSameTeam && (scopeAlly || scopeAllAllies || scopeEverything)
      && !(action.isDirectAction() && target.isInanimate()))
    {
      return true;
    }

    // action is for enemy battlers and scope is for opponents.
    if (targetIsOpponent && (scopeOpponent || scopeAllOpponents || scopeEverything))
    {
      return true;
    }

    // meets no criteria, target is not within scope of this action.
    return false;
  };

  /**
   * Creates a new collection of JABS actions from a skill id.
   * @param {number} skillId The id of the skill to create the JABS actions from.
   * @param {JABS_ActionOptions=} actionOptions The options associated with this action.
   * @returns {JABS_Action[]} The JABS actions based on the skill id provided.
   */
  createJabsActionFromSkill(
    skillId,
    actionOptions = JABS_ActionOptions.Default()
  )
  {
    // create the underlying skill for the action.
    const action = new Game_Action(this.getBattler(), false);

    // set the skill which also applies all applicable overlays.
    action.setSkill(skillId);

    // grab the potentially extended skill.
    const skill = this.getSkill(skillId);

    // resolve the formation for this skill; defaults to "line" if not provided.
    const formation = $jabsEngine.resolveProjectileFormationForSkill(skill);

    // resolve the projectile count for this skill; defaults to 1 if not provided.
    const projectileCount = $jabsEngine.resolveProjectileCountForSkill(skill);

    // generate the spoke directions based on facing, formation, and count.
    // use the battler hook so pixel vector aim can supply a true 8-dir base while
    // the map character's direction() stays cardinal for sprite facing.
    const facing = this.getProjectileSpawnBaseDirection();
    const projectileDirections = $jabsEngine.determineActionDirections(facing, formation, projectileCount);

    // calculate how many actions will be generated to accommodate the directions.
    const actions = this.convertProjectileDirectionsToActions(projectileDirections, action, actionOptions);

    // stamp resolved cast duration on the shared game action so every hit tick can scale damage.
    // uses JABS_Action.getCastTime() (includes J-ABS-Timing cast speed when that ext is loaded).
    const castFrames = actions.length > 0 ? actions[0].getCastTime() : 0;
    action.setResolvedCastTimeFrames(castFrames);

    // return the generated actions.
    return actions;
  };

  /**
   * Generates actions for each projectile direction given.
   * Applies lateral spawn offsets per spoke to create parallel lanes for any count (odd/even),
   * including diagonals, while remaining 8-dir/tile-native.
   * @param {number[]} projectileDirections The directions that should be mapped to actions.
   * @param {Game_Action} action The underlying action data.
   * @param {JABS_ActionOptions} actionOptions The options for this action.
   * @returns {JABS_Action[]}
   */
  convertProjectileDirectionsToActions(
    projectileDirections,
    action,
    actionOptions
  )
  {
    // delegate to the shared action spawner for volley construction.
    return JABS_ActionSpawner.buildVolley(this, projectileDirections, action, actionOptions);
  };

  /**
   * Resolves the 8-direction base used when building projectile spokes for a skill.
   * Defaults to the map character's {@link Game_CharacterBase#direction}; extensions
   * (e.g. J-ABS-Pixelistics) may override to read analog / vector movement instead.
   * @returns {number} A JABS direction code (2/4/6/8/1/3/7/9).
   */
  getProjectileSpawnBaseDirection()
  {
    // standard tile-facing is the historical source for line / formation forward.
    return this.getCharacter()
      .direction();
  };

  /**
   * Constructs the attack data from this battler's skill slot.
   * @param {string} cooldownKey The cooldown key.
   * @returns {JABS_Action[]} The constructed JABS actions.
   */
  getAttackData(cooldownKey)
  {
    // grab the underlying battler.
    const battler = this.getBattler();

    // get the resolved skill id to execute (transform applied if applicable, combo if queued).
    const skillId = this.getSkillIdForAction(cooldownKey);

    // if there isn't one, then we don't do anything.
    if (!skillId) return [];

  // check costs against the resolved skill — that is what will actually fire.
  if (!battler.meetsSkillConditions(battler.skill(skillId))) return [];

  // check that the battler has permission to use this slot.
  // the raw base slot id is checked so transforms do not require learning the target skill.
  if (!this.battlerHasPermissionForSlot(cooldownKey)) return [];

    // build action options with the cooldown key.
    const builder = JABS_ActionOptions.Builder()
      .setCooldownKey(cooldownKey);

    // attempt decision-time spatialization for direct skills lacking <directLock>.
    const skill = this.getSkill(skillId);
    if (skill.jabsDirect && !skill.jabsDirectLock)
    {
      // resolve a stable snapshot of [x,y] at decision time.
      const [ x, y ] = this.resolveDirectActionTargetCoordinatesForSkill(skill);

      // if resolved, capture into the location on the options.
      if (x !== null && y !== null)
      {
        // create a JABS_Location for the snapshot.
        const frozenLocation = JABS_Location.Builder()
          .setX(x)
          .setY(y)
          .build();

        // assign the frozen location to the options.
        builder.setLocation(frozenLocation);
      }
    }

    // finalize the options.
    const actionOptions = builder.build();

    // otherwise, use the skill from the slot to build an action.
    return this.createJabsActionFromSkill(skillId, actionOptions);
  };

  /**
   * Determines whether the battler has permission to initiate an action from the given slot.
   *
   * For combo follow-ups the combo skill was already validated when the combo was armed, so
   * no additional check is needed here. For a base slot execution, permission is granted when
   * the battler knows the raw equipped skill — the transform target does not need to be
   * learned, as the transform tag itself acts as the implicit permission grant.
   * @param {string} slot The slot key to check permission for.
   * @returns {boolean} True when the battler may proceed to build and execute an action.
   */
  battlerHasPermissionForSlot(slot)
  {
    // combo skills are pre-validated at arm time; no extra check needed.
    if (this.getComboNextActionId(slot) !== 0)
    {
      return true;
    }

    // for the base slot, check the raw equipped skill id so the transform target
    // does not require a separate hasSkill entry to be usable.
    const battler = this.getBattler();
    const baseSkillId = battler.getEquippedSkillId(slot);
    return battler.hasSkill(baseSkillId);
  };

  /**
   * Gets the next skill id to create an action from for the given slot.
   *
   * When a combo is queued, the combo id is returned as-is — combo chains are already
   * sourced from the resolved (transformed) skill's own notetags and should not be
   * re-transformed. For the base slot case the skill id is passed through
   * {@link Game_Battler#getResolvedSkillId} so that any active skill transform is applied
   * before the action is built.
   * @param {string} slot The slot for the skill to check.
   * @returns {number}
   */
  getSkillIdForAction(slot)
  {
    // grab the underlying battler.
    const battler = this.getBattler();

    // check if a combo follow-up is queued for this slot.
    if (this.getComboNextActionId(slot) !== 0)
    {
      // return the pending combo id; combo skills are pre-resolved from the starter's notetags.
      return this.getComboNextActionId(slot);
    }

    // no combo pending — return the resolved skill id so transforms are applied.
    return battler.getResolvedSkillId(slot);
  };

  /**
   * Consumes an item and performs its effects.
   * @param {number} toolId The id of the tool/item to be used.
   * @param {boolean} isLoot Whether or not this is a loot pickup.
   */
  // eslint-disable-next-line complexity
  applyToolEffects(
    toolId,
    isLoot = false
  )
  {
    // grab the item data.
    const item = $dataItems.at(toolId);

    // grab this battler.
    const battler = this.getBattler();

    // force the player to use the item.
    battler.consumeItem(item);

    // flag the slot for refresh.
    battler.getSkillSlotManager()
      .getToolSlot()
      .flagSkillSlotForRefresh();

    // also generate an action based on this tool.
    const gameAction = new Game_Action(battler, false);
    gameAction.setItem(toolId);

    // handle scopes of the tool.
    const scopeNone = gameAction.item().scope === 0;
    const scopeSelf = gameAction.isForUser();
    const scopeAlly = gameAction.isForFriend();
    const scopeOpponent = gameAction.isForOpponent();
    const scopeSingle = gameAction.isForOne();
    const scopeAll = gameAction.isForAll();
    const scopeEverything = gameAction.isForEveryone();

    const scopeAllAllies = scopeEverything || (scopeAll && scopeAlly);
    const scopeAllOpponents = scopeEverything || (scopeAll && scopeOpponent);
    const scopeOneAlly = (scopeSingle && scopeAlly);
    const scopeOneOpponent = (scopeSingle && scopeOpponent);

    // apply tool effects based on scope.
    if (scopeSelf || scopeOneAlly)
    {
      this.applyToolToPlayer(toolId);
    }
    else if (scopeEverything)
    {
      this.applyToolForAllAllies(toolId);
      this.applyToolForAllOpponents(toolId);
    }
    else if (scopeOneOpponent)
    {
      this.applyToolForOneOpponent(toolId);
    }
    else if (scopeAllAllies)
    {
      this.applyToolForAllAllies(toolId);
    }
    else if (scopeAllOpponents)
    {
      this.applyToolForAllOpponents(toolId);
    }
    else if (scopeNone)
    {
      // do nothing, the item has no scope and must be relying purely on the skillId.
    }
    else
    {
      console.warn(`unhandled scope for tool: [ ${gameAction.item().scope} ]!`);
    }

    // applies common events that may be a part of an item's effect.
    gameAction.applyGlobal();

    // create the log for the tool use.
    this.createToolLog(item);

    // extract the cooldown and skill id from the item.
    const {
      jabsCooldown: itemCooldown,
      jabsSkillId: itemSkillId
    } = item;

    // it was an item with a skill attached.
    if (itemSkillId)
    {
      const mapAction = this.createJabsActionFromSkill(itemSkillId);
      mapAction.forEach(action =>
      {
        action.setCooldownType(JABS_Button.Tool);
        $jabsEngine.executeMapAction(this, action);
      });
    }

    // if the last item was consumed, unequip it.
    if (!isLoot && !$gameParty.items()
      .includes(item))
    {
      // remove the item from the slot.
      battler.getSkillSlotManager()
        .clearSlot(JABS_Button.Tool);

      // build a lot for it.
      const lastUsedItemLog = new LootLogBuilder()
        .setupUsedLastItem(item.id)
        .build();
      $lootLogManager.addLog(lastUsedItemLog);
    }
    else
    {
      // it is an item with a custom cooldown.
      if (itemCooldown)
      {
        if (!isLoot) this.modCooldownCounter(JABS_Button.Tool, itemCooldown);
      }

      // it was an item, didn't have a skill attached, and didn't have a cooldown.
      if (!itemCooldown && !itemSkillId && !isLoot)
      {
        this.modCooldownCounter(JABS_Button.Tool, J.ABS.DefaultValues.CooldownlessItems);
      }
    }
  };

  /**
   * Consumes an item from the usable-item slot and performs its effects.
   * Mirrors {@link applyToolEffects} exactly but operates on {@link JABS_Button.UsableItem}
   * instead of {@link JABS_Button.Tool}.
   * @param {number} itemId The id of the item to be used.
   * @param {boolean} isLoot Whether or not this is a loot pickup.
   */
  // eslint-disable-next-line complexity
  applyUsableItemEffects(
    itemId,
    isLoot = false
  )
  {
    // grab the item data.
    const item = $dataItems.at(itemId);

    // grab this battler.
    const battler = this.getBattler();

    // force the player to use the item.
    battler.consumeItem(item);

    // flag the slot for refresh.
    battler.getSkillSlotManager()
      .getUsableItemSlot()
      .flagSkillSlotForRefresh();

    // also generate an action based on this item.
    const gameAction = new Game_Action(battler, false);
    gameAction.setItem(itemId);

    // handle scopes of the item.
    const scopeNone = gameAction.item().scope === 0;
    const scopeSelf = gameAction.isForUser();
    const scopeAlly = gameAction.isForFriend();
    const scopeOpponent = gameAction.isForOpponent();
    const scopeSingle = gameAction.isForOne();
    const scopeAll = gameAction.isForAll();
    const scopeEverything = gameAction.isForEveryone();

    const scopeAllAllies = scopeEverything || (scopeAll && scopeAlly);
    const scopeAllOpponents = scopeEverything || (scopeAll && scopeOpponent);
    const scopeOneAlly = (scopeSingle && scopeAlly);
    const scopeOneOpponent = (scopeSingle && scopeOpponent);

    // apply item effects based on scope.
    if (scopeSelf || scopeOneAlly)
    {
      this.applyToolToPlayer(itemId);
    }
    else if (scopeEverything)
    {
      this.applyToolForAllAllies(itemId);
      this.applyToolForAllOpponents(itemId);
    }
    else if (scopeOneOpponent)
    {
      this.applyToolForOneOpponent(itemId);
    }
    else if (scopeAllAllies)
    {
      this.applyToolForAllAllies(itemId);
    }
    else if (scopeAllOpponents)
    {
      this.applyToolForAllOpponents(itemId);
    }
    else if (scopeNone)
    {
      // do nothing, the item has no scope and must be relying purely on the skillId.
    }
    else
    {
      console.warn(`unhandled scope for usable item: [ ${gameAction.item().scope} ]!`);
    }

    // applies common events that may be a part of the item's effect.
    gameAction.applyGlobal();

    // create the log for the item use.
    this.createToolLog(item);

    // extract the cooldown and skill id from the item.
    const {
      jabsCooldown: itemCooldown,
      jabsSkillId: itemSkillId
    } = item;

    // it was an item with a skill attached.
    if (itemSkillId)
    {
      const mapAction = this.createJabsActionFromSkill(itemSkillId);
      mapAction.forEach(action =>
      {
        action.setCooldownType(JABS_Button.UsableItem);
        $jabsEngine.executeMapAction(this, action);
      });
    }

    // if the last item was consumed, unequip it.
    if (!isLoot && !$gameParty.items()
      .includes(item))
    {
      // remove the item from the slot.
      battler.getSkillSlotManager()
        .clearSlot(JABS_Button.UsableItem);

      // build a log for it.
      const lastUsedItemLog = new LootLogBuilder()
        .setupUsedLastItem(item.id)
        .build();
      $lootLogManager.addLog(lastUsedItemLog);
    }
    else
    {
      // it is an item with a custom cooldown.
      if (itemCooldown)
      {
        if (!isLoot) this.modCooldownCounter(JABS_Button.UsableItem, itemCooldown);
      }

      // it was an item, didn't have a skill attached, and didn't have a cooldown.
      if (!itemCooldown && !itemSkillId && !isLoot)
      {
        this.modCooldownCounter(JABS_Button.UsableItem, J.ABS.DefaultValues.CooldownlessItems);
      }
    }
  };

  /**
   * Applies the effects of the tool against the leader.
   * @param {number} toolId The id of the tool/item being used.
   */
  applyToolToPlayer(toolId)
  {
    // apply tool effects against player.
    const battler = this.getBattler();
    const gameAction = new Game_Action(battler, false);
    gameAction.setItem(toolId);
    gameAction.apply(battler);

    // display popup from item.
    this.onItemApplied(gameAction, toolId);

    // show tool animation.
    this.showAnimation($dataItems.at(toolId).animationId);
  };

  /**
   * Lifecycle event: an item was applied as a tool by this battler on a target.
   * Extended by optional plugins (e.g. J-Popups-ABS) to surface map feedback.
   * @param {Game_Action} gameAction The action describing the tool's effect.
   * @param {number} itemId The id of the item/tool used.
   * @param {JABS_Battler} target The target for calculating damage; defaults to self.
   */
  onItemApplied(_gameAction, _itemId, _target = this)
  {};

  /**
   * Applies the effects of the tool against all allies on the team.
   * @param {number} toolId The id of the tool/item being used.
   */
  applyToolForAllAllies(toolId)
  {
    const battlers = $gameParty.battleMembers();
    if (battlers.length > 1)
    {
      // remove the leader, because that's the player.
      battlers.shift();
      battlers.forEach(battler =>
      {
        const gameAction = new Game_Action(battler, false);
        gameAction.setItem(toolId);
        gameAction.apply(battler);
      });
    }

    // also apply effects to player/leader.
    this.applyToolToPlayer(toolId);
  };

  /**
   * Applies the effects of the tool against all opponents on the map.
   * @param {number} toolId The id of the tool/item being used.
   */
  applyToolForOneOpponent(toolId)
  {
    const item = $dataItems[toolId];
    let jabsBattler = this.getTarget();
    if (!jabsBattler)
    {
      // if we don't have a target, get the last hit battler instead.
      jabsBattler = this.getBattlerLastHit();
    }

    if (!jabsBattler)
    {
      // if we don't have a last hit battler, then give up on this.
      return;
    }

    // grab the battler being affected by this item.
    const battler = jabsBattler.getBattler();

    // create the game action based on the data.
    const gameAction = new Game_Action(battler, false);

    // apply the effects against the battler.
    gameAction.apply(battler);

    // generate the text popup for the item usage on the target.
    this.onItemApplied(gameAction, toolId, jabsBattler);
  };

  /**
   * Applies the effects of the tool against all opponents on the map.
   * @param {number} toolId The id of the tool/item being used.
   */
  applyToolForAllOpponents(toolId)
  {
    const battlers = JABS_AiManager.getEnemyBattlers();
    battlers.forEach(jabsBattler =>
    {
      // grab the battler being affected by this item.
      const battler = jabsBattler.getBattler();

      // create the game action based on the data.
      const gameAction = new Game_Action(battler, false);

      // apply the effects against the battler.
      gameAction.apply(battler);

      // generate the text popup for the item usage on the target.
      this.onItemApplied(gameAction, toolId, jabsBattler);
    }, this);
  };

  /**
   * Creates the text log entry for executing an tool effect.
   * @param {RPG_Item} item The tool being used in the log.
   */
  createToolLog(item)
  {
    // if not enabled, skip this.
    if (!J.LOG) return;

    // construct tool used log for the next step in this routine.
    const toolUsedLog = new LootLogBuilder()
      .setupUsedItem(item.id)
      .build();
    $lootLogManager.addLog(toolUsedLog);
  };

  /**
   * Executes the pre-defeat processing for a battler.
   * @param {JABS_Battler} victor The battler that defeated this battler.
   */
  performPredefeatEffects(victor)
  {
    // handle death animations first.
    this.handleOnDeathAnimations();

    // handle the skills executed when this battler is defeated.
    this.handleOnOwnDefeatSkills(victor);

    // handle skills executed when the victor defeats a target.
    this.handleOnTargetDefeatSkills(victor);
  };

  /**
   * Handles the on-death animations associated with this battler.
   */
  handleOnDeathAnimations()
  {
    // grab the loser battler.
    const battler = this.getBattler();

    // check if this is an actor with a death effect.
    if (battler.isActor() && battler.needsDeathEffect())
    {
      // perform the actor death animation.
      this.handleActorOnDeathAnimation();
    }
    // if not actor, then check for an enemy.
    else if (battler.isEnemy())
    {
      // perform the enemy death animation.
      this.handleEnemyOnDeathAnimation();
    }
  };

  /**
   * Handles the on-death animation for actors.
   * Since actors will persist as followers after defeat, they require additional
   * logic to prevent the repeated loop of death animation.
   */
  handleActorOnDeathAnimation()
  {
    // perform the actor death animation.
    this.showAnimation(152);

    // flag the death effect as "performed".
    this.getBattler()
      .toggleDeathEffect();
  };

  /**
   * Handle the on-death animation for enemies.
   * Since they are instantly removed after, their logic doesn't require
   * toggling of battler death effects.
   */
  handleEnemyOnDeathAnimation()
  {
    // perform the enemy death animation.
    this.showAnimation(151);
  };

  /**
   * Handles the execution of any on-own-defeat skills the defeated battler may possess.
   * @param {JABS_Battler} victor The battler that defeated this battler.
   */
  handleOnOwnDefeatSkills(victor)
  {
    // grab the loser battler.
    const battler = this.getBattler();

    // grab all of the loser battler's on-death skills to execute.
    const onOwnDefeatSkills = battler.onOwnDefeatSkillIds();

    // an iterator function for executing all relevant on-own-defeat skills.
    const forEacher = onDefeatSkill =>
    {
      // extract out the data points from the skill.
      const { skillId } = onDefeatSkill;

      // roll the dice and see if we should trigger this on-own-death skill.
      if (onDefeatSkill.shouldTrigger())
      {
        // extract whether or not this on-defeat skill should be cast from the target.
        const castFromTarget = onDefeatSkill.appearOnTarget();

        // check if the skill should be cast from the target.
        if (castFromTarget)
        {
          // execute it from the target!
          $jabsEngine.forceMapAction(this, skillId, false, victor.getX(), victor.getY());
        }
        // it should be cast from the victor.
        else
        {
          // execute it from the caster like default.
          $jabsEngine.forceMapAction(this, skillId, false);
        }
      }
    };

    // iterate over each of the on-death skills.
    onOwnDefeatSkills.forEach(forEacher, this);
  };

  /**
   * Handles the execution of any on-target-defeat skills the victorious battler may possess.
   * @param {JABS_Battler} victor The battler that defeated this battler.
   */
  handleOnTargetDefeatSkills(victor)
  {
    // grab all of the victor battler's on-target-defeat skills.
    const onTargetDefeatSkills = victor.getBattler()
      .onTargetDefeatSkillIds();

    // an iterator function for executing all relevant on-target-defeat skills.
    const forEacher = onDefeatSkill =>
    {
      // extract out the data points from the skill.
      const { skillId } = onDefeatSkill;

      // roll the dice and see if we should trigger this on-target-defeat skill.
      if (onDefeatSkill.shouldTrigger())
      {
        // extract whether or not this on-defeat skill should be cast from the target.
        const castFromTarget = onDefeatSkill.appearOnTarget();

        // check if the skill should be cast from the target.
        if (castFromTarget)
        {
          // execute it from the target!
          $jabsEngine.forceMapAction(victor, skillId, false, this.getX(), this.getY());
        }
        // it should be cast from the victor.
        else
        {
          // execute it from the caster like default.
          $jabsEngine.forceMapAction(victor, skillId, false);
        }
      }
    };

    // iterate over each the on-target-defeat skills.
    onTargetDefeatSkills.forEach(forEacher, this);
  };

  /**
   * Handles the execution of any on-evade skills this battler may possess.
   * The attacker who was evaded is used as the seed target; the skill's own scope
   * determines actual targeting, so AoE or self-targeting skills ignore the seed.
   * @param {JABS_Battler|null} jabsAttacker The battler whose attack was evaded, or null.
   */
  handleOnEvadeSkills(jabsAttacker)
  {
    // grab all the execute-on-evade skills from the underlying battler's notes.
    const executeEffects = this.getBattler().onEvadeExecuteEffects();

    // if there are none, there is nothing to do.
    if (executeEffects.length === 0) return;

    // an iterator function for firing all relevant on-evade skills.
    const forEacher = executeEffect =>
    {
      // extract the skill id from the effect.
      const { skillId } = executeEffect;

      // this is a purely self-scoped proc- the evader is both the roller and the recipient.
      const evaderBattler = this.getBattler();
      const skill = executeEffect.baseSkill(evaderBattler);
      const positiveRolls = 1 + evaderBattler.getPositiveRollsForSkill(skill);
      const negativeRolls = evaderBattler.getNegativeRollsForSkill(skill);

      // resolve how many times this proc's action should execute (Accumulate Mode/Encore aware).
      const procCount = executeEffect.resolveProcCount(positiveRolls, negativeRolls, evaderBattler);

      // fire the skill once per success.
      for (let i = 0; i < procCount; i++)
      {
        // if we have an attacker, fire the skill toward their position as the seed target.
        if (jabsAttacker)
        {
          // use the attacker's map position as the seed; skill scope takes over from there.
          $jabsEngine.forceMapAction(this, skillId, false, jabsAttacker.getX(), jabsAttacker.getY());
        }
        else
        {
          // no attacker reference available — fire from the evader with no seed target.
          $jabsEngine.forceMapAction(this, skillId, false);
        }
      }
    };

    // iterate over each on-evade execute effect.
    executeEffects.forEach(forEacher, this);
  };

  /**
   * Executes the post-defeat processing for a defeated battler.
   * @param {JABS_Battler} victor The battler that defeated this battler.
   */
  performPostdefeatEffects(_victor)
  {
    // check if the defeated battler is an actor.
    if (this.isActor())
    {
      // flag them for death.
      this.setDying(true);
    }
  };
  //endregion map

  //region movement
  /**
   * Gets whether or not this battler's movement is locked.
   * @returns {boolean} True if the battler's movement is locked, false otherwise.
   */
  isMovementLocked()
  {
    return this._movementLock;
  };

  /**
   * Sets the battler's movement lock.
   * @param {boolean} locked Whether or not the battler's movement is locked (default = true).
   */
  setMovementLock(locked = true)
  {
    this._movementLock = locked;
  };

  /**
   * Whether or not the battler is able to move.
   * A variety of things can impact the ability for a battler to move.
   * @returns {boolean} True if the battler can move, false otherwise.
   */
  canBattlerMove()
  {
    // battlers cannot move if they are movement locked by choice (rotating/guarding/etc).
    if (this.isMovementLocked()) return false;

    // battlers cannot move if they are movement locked by state.
    if (this.isMovementLockedByState()) return false;

    // battler can move!
    return true;
  };

  /**
   * Checks all states to see if any are movement-locking.
   * @returns {boolean} True if there is at least one locking movement, false otherwise.
   */
  isMovementLockedByState()
  {
    // grab the states to check for movement-blocking effects.
    const states = this.getBattler()
      .states();

    // if we have no states,
    if (!states.length) return false;

    // check all our states to see if any are blocking movement.
    const lockedByState = states.some(state => (state.jabsRooted || state.jabsParalyzed));

    // return what we found.
    return lockedByState;
  };
  //endregion movement

  //region readiness
  /**
   * Initializes a cooldown with the given key.
   * @param {string} cooldownKey The key of this cooldown.
   * @param {number} duration The duration to initialize this cooldown with.
   */
  initializeCooldown(cooldownKey, duration)
  {
    // grab the slot being worked with.
    const skillSlot = this.getBattler()
      .getSkillSlot(cooldownKey);

    // if we don't have a slot, then do not process.
    if (!skillSlot) return;

    // set the skillslot's cooldown frames to the default.
    skillSlot.getCooldown()
      .setFrames(duration);
  };

  /**
   * Gets the cooldown data for a given cooldown key.
   * @param {string} cooldownKey The cooldown to lookup.
   * @returns {JABS_Cooldown}
   */
  getCooldown(cooldownKey)
  {
    // grab the slot of the given key.
    const skillSlot = this.getBattler()
      .getSkillSlot(cooldownKey);

    // check that there is a skill slot.
    if (!skillSlot)
    {
      console.warn('omg');

      // TODO: make sure enemies get assigned their slots.

      return null;
    }

    return skillSlot.getCooldown();
  };

  /**
   * Gets the cooldown and skill slot data for a given key.
   * @param {string} key The slot to get the data for.
   * @returns {{ cooldown: JABS_Cooldown, skillslot: JABS_SkillSlot }}
   */
  getActionKeyData(key)
  {
    const cooldown = this.getCooldown(key);
    const skillslot = this.getBattler()
      .getSkillSlot(key);

    if (!cooldown || !skillslot) return null;

    return {
      cooldown,
      skillslot
    }
  };

  /**
   * Whether or not this battler has finished it's post-action cooldown phase.
   * @returns {boolean} True if the battler is cooled down, false otherwise.
   */
  isPostActionCooldownComplete()
  {
    if (this._postActionCooldownComplete)
    {
      // we are ready to do idle things.
      return true;
    }

    if (this._postActionCooldown <= this._postActionCooldownMax)
    {
      // we are still charging up...
      this._postActionCooldown++;
      return false;
    }
    this._postActionCooldownComplete = true;
    this._postActionCooldown = 0;

    // we are ready to finish phase3!
    return true;

  };

  /**
   * Starts the post-action cooldown for this battler.
   * @param {number} cooldown The cooldown duration.
   */
  startPostActionCooldown(cooldown)
  {
    this._postActionCooldownComplete = false;
    this._postActionCooldown = 0;
    this._postActionCooldownMax = cooldown;
  };

  /**
   * Retrieves the battler's idle state.
   * @returns {boolean} True if the battler is idle, false otherwise.
   */
  isIdle()
  {
    return this._idle;
  };

  /**
   * Sets whether or not this battler is idle.
   * @param {boolean} isIdle True if this battler is idle, false otherwise.
   */
  setIdle(isIdle)
  {
    this._idle = isIdle;
  };

  /**
   * Whether or not this battler is ready to perform an idle action.
   * @returns {boolean} True if the battler is idle-ready, false otherwise.
   */
  isIdleActionReady()
  {
    if (this._idleActionReady)
    {
      // we are ready to do idle things.
      return true;
    }

    if (this._idleActionCount <= this._idleActionCountMax)
    {
      // we are still charging up...
      this._idleActionCount++;
      return false;
    }
    this._idleActionReady = true;
    this._idleActionCount = 0;

    // we are ready to idle!
    return true;

  };

  /**
   * Whether or not the skilltype has a base or combo cooldown ready.
   * @param {string} cooldownKey The cooldown key to check readiness for.
   * @returns {boolean} True if the given skilltype is ready, false otherwise.
   */
  isSkillTypeCooldownReady(cooldownKey)
  {
    const isAnyReady = this.getBattler()
      .getSkillSlotManager()
      .isAnyCooldownReadyForSlot(cooldownKey);
    return isAnyReady;
  };

  /**
   * Modifies the cooldown for this key by a given amount.
   * @param {string} cooldownKey The key of this cooldown.
   * @param {number} duration The duration of this cooldown.
   */
  modCooldownCounter(cooldownKey, duration)
  {
    this.getCooldown(cooldownKey)
      .modBaseFrames(duration);
  };

  /**
   * Set the cooldown timer to a designated number.
   * @param {string} cooldownKey The key of this cooldown.
   * @param {number} duration The duration of this cooldown.
   */
  setCooldownCounter(cooldownKey, duration)
  {
    this.getCooldown(cooldownKey)
      .setFrames(duration);
  };

  /**
   * Resets this battler's combo information.
   * @param {string} cooldownKey The key of this cooldown.
   */
  resetComboData(cooldownKey)
  {
    this.getBattler()
      .getSkillSlotManager()
      .getSkillSlotByKey(cooldownKey)
      .resetCombo();
  };

  /**
   * Sets the combo frames to be a given value.
   * @param {string} cooldownKey The key associated with the cooldown.
   * @param {number} duration The number of frames until this combo action is ready.
   */
  setComboFrames(cooldownKey, duration)
  {
    this.getCooldown(cooldownKey)
      .setComboFrames(duration);
  };

  /**
   * Sets the combo expiry window on the cooldown for the given slot.
   * The countdown begins immediately — from the moment the skill fires — regardless of the combo delay.
   * Pass zero to set no deadline.
   * @param {string} cooldownKey The slot key.
   * @param {number} frames Frames until the combo auto-clears if unused.
   */
  setComboExpireFrames(cooldownKey, frames)
  {
    this.getCooldown(cooldownKey)
      .setComboExpireFrames(frames);
  };

  /**
   * Whether or not this battler is ready to take action of any kind.
   * @returns {boolean} True if the battler is ready, false otherwise.
   */
  isActionReady()
  {
    if (this._prepareReady)
    {
      // we are ready to take action.
      return true;
    }

    if (this._prepareCounter < this._prepareMax)
    {
      // we are still charging up...
      this._prepareCounter++;
      return false;
    }

    // store  prepare ready on the instance for later reads.
    this._prepareReady = true;
    this._prepareCounter = 0;
    // we are charged up now!
    return true;

  };

  /**
   * Determines the number of frames between opportunity to take the next action.
   * This maps to time spent in phase1 of JABS AI.
   * @returns {number} The number of frames between actions.
   */
  getPrepareTime()
  {
    return this.getBattler()
      .prepareTime();
  };

  /**
   * Determines whether or not a skill can be executed based on restrictions or not.
   * This is used by AI. Also enforces the battler-wide global cooldown: GCD-subject skills return false
   * while the shared timer is active.
   * @param {number} chosenSkillId The skill id to be executed.
   * @returns {boolean} True if this skill can be executed, false otherwise.
   */
  canExecuteSkill(chosenSkillId)
  {
    // if there is no chosen skill, then we obviously cannot execute it.
    if (!chosenSkillId) return false;

    // check if the battler can use skills.
    const canUseSkills = this.canBattlerUseSkills();

    // check if the battler can use basic attacks.
    const canUseAttacks = this.canBattlerUseAttacks();

    // if can't use basic attacks or skills, then autofail.
    if (!canUseSkills && !canUseAttacks)
    {
      return false;
    }

    // check if the chosen skill is the enemy's basic attack.
    const isBasicAttack = this.isSkillIdBasicAttack(chosenSkillId);

    // check if basic attacks are blocked plus this being a basic attack.
    if (!canUseAttacks && isBasicAttack)
    {
      // if the skill is a basic attack, but the battler can't attack, then fail.
      return false;
    }

    // if the skill is an assigned skill, but the battler can't use skills, then fail.
    if (!canUseSkills && !isBasicAttack)
    {
      return false;
    }

    // check if this battler can pay the costs for the given skill id.
    if (!this.canPaySkillCost(chosenSkillId))
    {
      // cannot pay the cost.
      return false;
    }

    // build the cooldown key based on the skill data.
    const skillSlotKey = this.getCooldownKeyBySkillId(chosenSkillId);

    // check to make sure we have a key.
    if (!skillSlotKey)
    {
      // if there is no key, then this skill clearly isn't ready.
      return false;
    }

    // grab the cooldown itself.
    const cooldown = this.getCooldown(skillSlotKey);

    // check if the skill was actually a remembered effective skill from a follower.
    if (!cooldown)
    {
      // please stop trying to cast your follower's skills.
      console.warn(this, skillSlotKey);
      console.trace();
      return false;
    }

    // check if the chosen skill is actually a combo for this slot.
    const isCombo = this.getBattler()
      .getSkillSlot(skillSlotKey).comboId === chosenSkillId;

    // check if the base is off cooldown yet.
    if (!isCombo && !cooldown.isBaseReady())
    {
      // cooldown is not ready yet.
      return false;
    }

    if (JABS_GlobalCooldown.isGlobalBlockingSkillId(this, chosenSkillId))
    {
      return false;
    }

    // cast the skill!
    return true;
  };

  /**
   * Gets the key of the cooldown based on the given skill id from this battler.
   * @param {number} skillId The id of the skill to retrieve a key for.
   * @returns {null|string} Null if the skill wasn't found in the slots, the key otherwise.
   */
  getCooldownKeyBySkillId(skillId)
  {
    // handle accordingly for enemies.
    if (this.isEnemy())
    {
      // resolve semantic slots (dodge / offhand guard) before the legacy per-skill key.
      const slot = this.getBattler()
        .findSlotForSkillId(skillId);

      if (slot)
      {
        return slot.key;
      }

      const skill = this.getSkill(skillId);

      if (!skill)
      {
        return null;
      }

      // fallback: arbitrary key used for non-slot skills (see setupEnemySlots).
      return `${skill.id}-${skill.name}`;
    }
    // handle accordingly for actors.
    else if (this.isActor())
    {
      // grab the first slot that the id lives in.
      const slot = this.getBattler()
        .findSlotForSkillId(skillId);

      // if there is no slot with this skill, then its not a basic attack.
      if (!slot) return null;

      // return the found key.
      return slot.key;
    }

    // if somehow it is neither actor nor enemy, then return global.
    return J.ABS.Globals.GlobalCooldownKey;
  };

  /**
   * Determines whether or not the given skill id is actually a basic attack
   * skill used by this battler. Basic attack includes main and off hands.
   * @param {number} skillId The skill id to check.
   * @returns {boolean} True if the skill is a basic attack, false otherwise.
   */
  isSkillIdBasicAttack(skillId)
  {
    // handle accordingly if an enemy.
    if (this.isEnemy())
    {
      // grab the enemy basic attack.
      const basicAttackSkillId = this.getEnemyBasicAttack();

      // check if the chosen skill is the enemy's basic attack.
      return (skillId === basicAttackSkillId);
    }
    // handle accordingly if an actor.
    else if (this.isActor())
    {
      // grab the first slot that the id lives in.
      const slot = this.getBattler()
        .findSlotForSkillId(skillId);

      // if there is no slot with this skill, then its not a basic attack.
      if (!slot) return false;

      // if the slot key matches our mainhand, then it is a basic attack.
      return (slot.key === JABS_Button.Mainhand || slot.key === JABS_Button.Offhand);
    }

    // handle accordingly if not actor or enemy.
    console.warn(`non-actor/non-enemy checked for basic attack.`, this);
    return false;
  };

  /**
   * Gets the proper skill based on the skill id.
   * Accommodates J-SkillExtend and/or J-Passives.
   * @param {number} skillId The skill id to retrieve.
   * @returns {RPG_Skill|null}
   */
  getSkill(skillId)
  {
    // check to make sure we actually have a skill id first.
    if (!skillId)
    {
      // return null if we do not.
      return null;
    }

    // return the skill assocaited with the underlying battler.
    return this.getBattler()
      .skill(skillId);
  };

  /**
   * Determines whether or not this battler can pay the cost of a given skill id.
   * Accommodates skill extensions.
   * @param {number} skillId The skill id to check.
   * @returns {boolean} True if this battler can pay the cost, false otherwise.
   */
  canPaySkillCost(skillId)
  {
    // if the skill cost is more than the battler has resources for, then fail.
    const skill = this.getSkill(skillId);

    // check if the battler can pay the cost.
    if (!this.getBattler()
      .canPaySkillCost(skill))
    {
      return false;
    }

    // we can pay the cost!
    return true;
  };
  //endregion readiness

  //region regeneration
  /**
   * Updates all regenerations. Ticks at a dynamically-resolved interval instead of a fixed rate-
   * natural HRG/MRG/TRG is typed as {@link J_AbsPluginMetadata.NaturalRegenTickType} so the same
   * flat/percent tick speed modifiers that affect state slip ticking can reach it too.
   */
  updateRegen()
  {
    // check if we are able to update the RG.
    if (!this.canUpdateRegen()) return;

    //
    this.performRegeneration();
    this.setRegenCounter(this.getNaturalRegenTickInterval());
  };

  /**
   * Resolves how many frames elapse between natural regeneration ticks for this battler.<br/>
   * Uses the same base-plus-flat-then-percent formula as per-state slip ticking, evaluated
   * against this battler itself (natural regen has no external "source" to speak of), and typed
   * as the plugin-configured natural regen tick type so type-scoped modifiers can reach it.
   * @returns {number}
   */
  getNaturalRegenTickInterval()
  {
    // shorthand the battler and the configured natural regen type.
    const battler = this.getBattler();
    const naturalRegenType = J.ABS.Metadata.NaturalRegenTickType;

    // resolve the base interval and layer on this battler's own flat/percent modifiers.
    const baseInterval = J.ABS.Metadata.DefaultStateTickInterval;
    const flatModifier = battler.tickSpeedFlatModifier();
    const percentModifier = battler.tickSpeedPercentModifier([ naturalRegenType ]);

    // apply the flat modifier first, then the combined percent modifier.
    const modifiedInterval = (baseInterval + flatModifier) / (1 + (percentModifier / 100));

    // never let the interval drop below the tunable floor, and never below 1 frame regardless.
    const tunableFloor = Math.max(J.ABS.Metadata.MinimumStateTickInterval, 1);

    return Math.max(Math.round(modifiedInterval), tunableFloor);
  };

  /**
   * Determines whether or not the regeneration can be updated.
   * @returns {boolean}
   */
  canUpdateRegen()
  {
    // check if the regen is even ready for this battler.
    if (!this.isRegenReady()) return false;

    // if its ready but
    if (this.getBattler()
      .isDead())
    {
      return false;
    }

    return true;
  };

  /**
   * Whether or not the regen tick is ready.
   * @returns {boolean} True if its time for a regen tick, false otherwise.
   */
  isRegenReady()
  {
    if (this.getRegenCounter() <= 0)
    {
      this.setRegenCounter(0);
      return true;
    }

    this.decrementRegenCounter();
    return false;
  };

  /**
   * Gets the current count on the regen counter.
   * @returns {number}
   */
  getRegenCounter()
  {
    return this._regenCounter;
  };

  /**
   * Decrements the regen counter by one.
   */
  decrementRegenCounter()
  {
    this.setRegenCounter(this.getRegenCounter() - 1);
  };

  /**
   * Sets the regen counter to a given number.
   * @param {number} count The count to set the regen counter to.
   */
  setRegenCounter(count)
  {
    this._regenCounter = count;
  };

  /**
   * Performs the natural regeneration handled by JABS, and prunes any orphaned states found
   * along the way. State slip ticking no longer happens here- each {@link JABS_State} now
   * ticks on its own dynamically-resolved cadence and calls {@link #processStateTick} directly.
   */
  performRegeneration()
  {
    // if we have no battler, don't bother.
    const battler = this.getBattler();
    if (!battler) return;

    // handle our natural rgs since we have a battler.
    this.processNaturalRegens();

    // if we have no states, don't bother.
    const states = battler.allStates();
    if (!states.length) return;

    // clean-up all the states that are somehow applied but not tracked; the boolean result no
    // longer feeds a regen filter, but the removal side-effect for orphaned states still matters.
    states.forEach(this.shouldProcessState, this);
  };

  /**
   * Processes the natural regeneration of this battler.
   *
   * This includes all HRG/MRG/TRG derived from any extraneous source.
   */
  processNaturalRegens()
  {
    // check if this battler's natural regen should be reduced.
    const isReduced = this.isNaturalRegenReduced();

    // process the natural hp/mp regens, possibly reduced.
    this.processNaturalHpRegen(isReduced);
    this.processNaturalMpRegen(isReduced);
    this.processNaturalTpRegen(isReduced);
  };

  /**
   * Checks if the natural regeneration should be reduced for this battler.
   * @returns {boolean}
   */
  isNaturalRegenReduced()
  {
    // enemies are not impacted by reduced natural regen.
    if (this.isEnemy()) return false;

    // if combat is globally forced (boss phases, etc), always reduced for non‑enemies.
    if ($jabsEngine.forcedCombat === true) return true;

    // in-combat allies will be actors that are presently engaged.
    if (this.isActor() && this.isInCombat()) return true;

    // no reason to reduce natural regen.
    return false;
  };

  /**
   * Calculate the per5seconds regeneration rate and reduce it if applicable. By default, this should be roughly 5% of
   * the base100 regeneration value, and 20% of that value if reduced.
   * @param {number} baseValue The base regeneration value.
   * @param {boolean} isReduced Whether or not this regeneration value should be reduced.
   * @returns {number}
   */
  calculatedRegen(baseValue, isReduced = false)
  {
    // calculate the amount applied each regen tick; tick rate is resolved dynamically (see getNaturalRegenTickInterval).
    let calculatedValue = (baseValue * 100) * 0.05;
    if (isReduced)
    {
      // only 20% of your natural HP regen is available while reduced.
      calculatedValue *= 0.20;
    }

    // fix the value to two decimal places.
    return parseFloat(calculatedValue.toFixed(2)) ?? 0;
  };

  /**
   * Processes the natural HRG for this battler.
   */
  processNaturalHpRegen(isReduced)
  {
    // shorthand the battler.
    const battler = this.getBattler();

    // check if we need to regenerate.
    if (battler.hp < battler.mhp)
    {
      // extract the regens rates.
      const {
        hrg,
        rec
      } = battler;

      // calculate the per-tick bonus; total DPS now scales with however fast this battler's natural regen ticks.
      const naturalHp5 = this.calculatedRegen(hrg, isReduced) * rec;

      // execute the gain.
      battler.gainHp(naturalHp5);
    }
  };

  /**
   * Processes the natural MRG for this battler.
   */
  processNaturalMpRegen(isReduced)
  {
    // shorthand the battler.
    const battler = this.getBattler();

    // check if we need to regnerate.
    if (battler.mp < battler.mmp)
    {
      // extract the regens rates.
      const {
        mrg,
        rec
      } = battler;

      // calculate the per-tick bonus; total DPS now scales with however fast this battler's natural regen ticks.
      const naturalMp5 = this.calculatedRegen(mrg, isReduced) * rec;

      // execute the gain.
      battler.gainMp(naturalMp5);
    }
  };

  /**
   * Processes the natural TRG for this battler.
   */
  processNaturalTpRegen(isReduced)
  {
    // shorthand the battler.
    const battler = this.getBattler();

    // check if we need to regenerate.
    if (battler.tp < battler.maxTp())
    {
      // extract the regens rates.
      const {
        trg,
        rec
      } = battler;

      // calculate the per-tick bonus; total DPS now scales with however fast this battler's natural regen ticks.
      const naturalTp5 = this.calculatedRegen(trg, isReduced) * rec;

      // execute the gain.
      battler.gainTp(naturalTp5);
    }
  };

  /**
   * Applies a single slip/regen tick for one state. Called by the owning {@link JABS_State}
   * whenever its own dynamically-resolved tick counter elapses- there is no longer a shared
   * battler-wide divisor, so a state ticking faster than another deals/heals proportionally more
   * over time. That's the intended power lever of a faster tick speed.
   * @param {RPG_State} state The state whose slip tags should be applied for this tick.
   */
  processStateTick(state)
  {
    // grab the battler we're working with.
    const battler = this.getBattler();

    // a dead battler has nothing left to slip/regen.
    if (!battler || battler.isDead()) return;

    // default the regenerations to the battler's innate regens.
    const { rec } = battler;
    const perResource = [ this.stateSlipHp(state), this.stateSlipMp(state), this.stateSlipTp(state) ];

    for (let index = 0; index < 3; index++)
    {
      let regen = perResource[index];

      if (!regen)
      {
        continue;
      }

      if (regen > 0)
      {
        regen *= rec;
      }

      this.applySlipEffect(regen, index);

      const displayAmount = -regen;

      this.onSlipRegenTick(displayAmount, index, state.id);
    }
  };

  /**
   * Determines if a state should be processed or not for slip effects.
   * @param {RPG_State} state The state to check if needing processing.
   * @returns {boolean} True if we should process this state, false otherwise.
   */
  shouldProcessState(state)
  {
    // grab the battler we're working with.
    const battler = this.getBattler();

    // grab the state we're working with.
    const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), state.id);

    // validate the state exists.
    if (!trackedState)
    {
      // untracked states could be passive states the battler is owning.
      if (battler.isPassiveState(state.id)) return true;

      // when loading a file that was saved with a state, we encounter a weird issue
      // where the state is still on the battler but not in temporary memory as a
      // JABS tracked state. In this case, we remove it.
      battler.removeState(state.id);
      return false;
    }

    // don't process states if they have no metadata.
    // the RG from states is a part of the base, now.
    if (!state.meta) return false;

    return true;
  };

  /**
   * Processes a single state and returns its tag-based hp regen value.
   * @param {RPG_State} state The state to process.
   * @returns {number} The hp regen from this state.
   */
  stateSlipHp(state)
  {
    // grab the battler we're working with.
    const battler = this.getBattler();

    // the running total of the hp-per-5 amount from states.
    let tagHp5 = 0;

    // deconstruct the data out of the state.
    const {
      jabsSlipHpFlatPerFive: hpPerFiveFlat,
      jabsSlipHpPercentPerFive: hpPerFivePercent,
      jabsSlipHpFormulaPerFive: hpPerFiveFormula,
    } = state;

    // if the flat tag exists, use it.
    tagHp5 += hpPerFiveFlat;

    // if the percent tag exists, use it.
    tagHp5 += battler.mhp * (hpPerFivePercent / 100);

    // if the formula tag exists, use it.
    if (hpPerFiveFormula)
    {
      // add the slip formula to the running total.
      tagHp5 += this.calculateStateSlipFormula(hpPerFiveFormula, battler, state);
    }

    // return the per-five.
    return tagHp5;
  };

  /**
   * Processes a single state and returns its tag-based mp regen value.
   * @param {RPG_State} state The state to process.
   * @returns {number} The mp regen from this state.
   */
  stateSlipMp(state)
  {
    // grab the battler we're working with.
    const battler = this.getBattler();

    // the running total of the mp-per-5 amount from states.
    let tagMp5 = 0;

    // deconstruct the data out of the state.
    const {
      jabsSlipMpFlatPerFive: mpPerFiveFlat,
      jabsSlipMpPercentPerFive: mpPerFivePercent,
      jabsSlipMpFormulaPerFive: mpPerFiveFormula,
    } = state;

    // if the flat tag exists, use it.
    tagMp5 += mpPerFiveFlat;

    // if the percent tag exists, use it.
    tagMp5 += battler.mmp * (mpPerFivePercent / 100);

    // if the formula tag exists, use it.
    if (mpPerFiveFormula)
    {
      // add the slip formula to the running total.
      tagMp5 += this.calculateStateSlipFormula(mpPerFiveFormula, battler, state);
    }

    // return the per-five.
    return tagMp5;
  };

  /**
   * Processes a single state and returns its tag-based tp regen value.
   * @param {RPG_State} state The state to process.
   * @returns {number} The tp regen from this state.
   */
  stateSlipTp(state)
  {
    // grab the battler we're working with.
    const battler = this.getBattler();

    // default slip to zero.
    let tagTp5 = 0;

    // deconstruct the data out of the state.
    const {
      jabsSlipTpFlatPerFive: tpPerFiveFlat,
      jabsSlipTpPercentPerFive: tpPerFivePercent,
      jabsSlipTpFormulaPerFive: tpPerFiveFormula,
    } = state;

    // if the flat tag exists, use it.
    tagTp5 += tpPerFiveFlat;

    // if the percent tag exists, use it.
    tagTp5 += battler.maxTp() * (tpPerFivePercent / 100);

    // if the formula tag exists, use it.
    if (tpPerFiveFormula)
    {
      // add the slip formula to the running total.
      tagTp5 += this.calculateStateSlipFormula(tpPerFiveFormula, battler, state);
    }

    // return the per-five.
    return tagTp5;
  };

  /**
   * Calculates the value of a slip-based formula.
   * This is where the source and afflicted are determined before {@link eval}uating the
   * formula with the necessary context to evaluate a formula.
   * @param {string} formula The string containing the formula to parse.
   * @param {Game_Battler} battler The battler that is afflicted with the slip effect.
   * @param {RPG_State} state The state representing this slip effect.
   * @returns {number} The result of the formula representing the slip effect value.
   */
  calculateStateSlipFormula(formula, battler, state)
  {
    // pull the state associated with the battler.
    const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), state.id);

    // initialize the source and afflicted with oneself.
    let sourceBattler = battler;
    let afflictedBattler = battler;

    // check if the trackedState was present.
    if (trackedState)
    {
      // update the source and afflicted with the tracked data instead.
      sourceBattler = trackedState.source;
      afflictedBattler = trackedState.battler;
    }

    // calculate the total for this slip formula.
    const total = this.slipEval(formula, sourceBattler, afflictedBattler, state);

    // return the result.
    return total;
  };

  /**
   * Performs an {@link eval} on the provided formula with the given parameters as scoped context
   * to calculate a formula-based slip values. Also provides a weak safety net to ensure that no
   * garbage values get returned, or raises exceptions if the formula is invalidly written.
   * @param {string} formula The string containing the formula to parse.
   * @param {Game_Battler} sourceBattler The battler that applied this state to the target.
   * @param {Game_Battler} afflictedBattler The target battler afflicted with this state.
   * @param {RPG_State} state The state associated with this slip effect.
   * @returns {number} The output of the formula (multiplied by `-1`) to
   */
  slipEval(formula, sourceBattler, afflictedBattler, state)
  {
    // variables for contextual eval() (RPG slip formula bindings: a, b, v, s).
    // the one who applied the state.
    const a = sourceBattler;
    // this battler, afflicted by the state.
    const b = afflictedBattler;
    // access to variables if you need it.
    const v = $gameVariables._data;
    // access to the state itself if you need it.
    const s = state;

    // add a safety net for people who write broken formulas.
    let result;
    try
    {
      // evaluate the slip formula with the scoped context — result is negated because slip is negative.
      result = new Function('a', 'b', 'v', 's', `return (${formula})`)(a, b, v, s) * -1;

      // check if the eval() produced garbage output despite not throwing.
      if (!Number.isFinite(result))
      {
        console.warn('result was: ', result);

        // throw, and then catch to properly log in the next block.
        throw new Error('Invalid formula.');
      }
    }
    catch (err)
    {
      console.warn(`failed to eval() this formula: [ ${formula} ]`);
      console.trace();
      throw err;
    }

    // we prefer to work with integers for slip.
    const formattedResult = Math.round(result);

    // return the calculated result.
    return formattedResult;
  };

  /**
   * Applies the regeneration amount to the appropriate parameter.
   * @param {number} amount The regen amount.
   * @param {number} type The regen type- identified by index.
   */
  applySlipEffect(amount, type)
  {
    // grab the battler.
    const battler = this.getBattler();

    // pivot on the slip type.
    switch (type)
    {
      case 0:
        battler.gainHp(amount);
        break;
      case 1:
        battler.gainMp(amount);
        break;
      case 2:
        battler.gainTp(amount);
        break;
    }
  };

  /**
   * Hook after slip/regen math is applied; extensions may show pops or other feedback.
   * @param {number} displayAmount Amount passed to popup builders after sign normalization.
   * @param {0|1|2} type HP / MP / TP index.
   * @param {number} [stateId] Database state id when this tick came from {@link #processStateTick}.
   */
  onSlipRegenTick(_displayAmount, _type, _stateId)
  {
  };
  //endregion regeneration

  //region timers
  /**
   * Sets the battler's wait duration to a number. If this number is greater than
   * zero, then the battler must wait before doing anything else.
   * @param {number} wait The duration for this battler to wait.
   */
  setWaitCountdown(wait)
  {
    // reset the wait timer to start over.
    this._waitTimer.reset();

    // set the wait timer's max to a new time.
    this._waitTimer.setMaxTime(wait);
  };

  /**
   * Gets whether or not this battler is currently waiting.
   * @returns {boolean} True if waiting, false otherwise.
   */
  isWaiting()
  {
    return !this._waitTimer.isTimerComplete();
  };

  /**
   * Counts down the duration for this battler's cast time.
   */
  countdownCastTime()
  {
    this.performCastAnimation();
    if (this._castTimeCountdown > 0)
    {
      this._castTimeCountdown--;
      // exit early without a payload.
      return;
    }

    if (this._castTimeCountdown <= 0)
    {
      this._casting = false;
      this._castTimeCountdown = 0;
    }
  };

  /**
   * Performs the cast animation if possible on this battler.
   */
  performCastAnimation()
  {
    // check if we can perform a cast animation.
    if (!this.canPerformCastAnimation()) return;

    // get the cast animation id.
    const animationId = this.getDecidedAction()[0].getCastAnimation();

    // show the animation.
    this.showAnimation(animationId);
  };

  /**
   * Determines whether or not we can perform a cast animation.
   * @returns {boolean}
   */
  canPerformCastAnimation()
  {
    // if we don't have a decided action somehow, then don't do cast animation things.
    if (!this.getDecidedAction()) return false;

    // if we don't have a cast animation, then don't do cast animation things.
    if (!this.getDecidedAction()[0].getCastAnimation()) return false;

    // don't show casting animations while other animations are playing on you.
    if (this.isShowingAnimation()) return false;

    // show cast animations!
    return true;
  };

  /**
   * Sets the cast time duration to a number. If this number is greater than
   * zero, then the battler must spend this duration in frames casting before
   * executing the skill.
   * @param {number} castTime The duration in frames to spend casting.
   */
  setCastCountdown(castTime)
  {
    this.setCastTimeCountdown(castTime);
    if (this.getCastTimeCountdown() > 0)
    {
      this._casting = true;
    }

    if (this.getCastTimeCountdown() <= 0)
    {
      this._casting = false;
      this.setCastTimeCountdown(0);
    }
  };

  /**
   * Gets whether or not this battler is currently casting a skill.
   * @returns {boolean}
   */
  isCasting()
  {
    return this._casting;
  };

  /**
   * Gets the current cast timer count.
   * @returns {number}
   */
  getCastTimeCountdown()
  {
    return this._castTimeCountdown;
  };

  /**
   * Sets the current cast timer count.
   * @param {number} castTime The new cast time.
   */
  setCastTimeCountdown(castTime)
  {
    this._castTimeCountdown = castTime;
  };

  /**
   * Counts down the alertedness of this battler.
   */
  countdownAlert()
  {
    if (this._alertedCounter > 0)
    {
      this._alertedCounter--;
      return;
    }

    if (this._alertedCounter <= 0)
    {
      this.clearAlert();
    }
  };

  /**
   * Removes and clears the alert state from this battler.
   */
  clearAlert()
  {
    this.setAlerted(false);
    this._alertedCounter = 0;
    // if (!this.isEngaged())
    // {
    //   this.showBalloon(J.ABS.Balloons.Silence);
    // }
  };
  //endregion timers
}

export default JABS_Battler;
//endregion JABS_Battler