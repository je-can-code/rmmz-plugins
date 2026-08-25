//region JABS_State
import JABS_AiManager from './../managers/JABS_AiManager.js';
import JABS_StateBuilder from './JABS_StateBuilder.js';

/**
 * A class for handling the state data in the context of JABS.
 */
class JABS_State
{
  //region properties
  /**
   * The list of rulesets available for how to handle reapplication of a state.
   */
  static reapplicationType = {
    /**
     * "Refresh" will refresh the duration of a state when reapplied.
     * @type {'refresh'}
     */
    Refresh: 'refresh',

    /**
     * "Extend" will add the remaining duration onto the new duration when reapplied.
     * @type {'extend'}
     */
    Extend: 'extend',

    /**
     * "Stack" will add an additional stack of the state when reapplied.
     * @type {'stack'}
     */
    Stack: 'stack',
  };

  /**
   * The battler being afflicted with this state.
   * @type {Game_Battler}
   */
  battler = null;

  /**
   * The id of the state being tracked.
   * @type {number}
   */
  stateId = 0;

  /**
   * The icon index of the state being tracked (for visual purposes).
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The current duration of the state being tracked. Decrements over time.
   * @type {number}
   */
  duration = 0;

  /**
   * The base duration.
   * Used for reapplication and stacking purposes.
   * @type {number}
   */
  #baseDuration = 0;

  /**
   * Whether or not this tracked state is identified as `expired`.
   * Expired states do not apply to the battler, but are kept in the tracking collection
   * to grant the ability to refresh the state duration or whatever we choose to do.
   * @type {boolean}
   */
  expired = true;

  /**
   * The source that caused this state. Usually this is an opposing battler. If no source is specified,
   * then the afflicted battler is the source.
   * @type {Game_Battler}
   */
  source = null;

  /**
   * The skill that was executing when this state was applied, if any. This is a live reference
   * to the actual `$dataSkills` entry that was resolved at application time- including any
   * `<skillTransform>` redirect already baked in- rather than a raw id, so downstream amp tags
   * scoped to "the skill that applied this" don't need to re-derive anything. Null when the state
   * was applied without a skill in scope (food chains, ambient/self-inflicted conversions, etc.).
   * @type {RPG_Skill|null}
   */
  sourceSkill = null;

  /**
   * The number of stacks of this state applied to the tracker.
   * @type {number}
   */
  stackCount = 0;

  /**
   * The number of times this state has been refreshed.<br/>
   * This only matters when the reapplication type is {@link JABS_State.reapplicationType.Refresh}.
   * @type {number}
   */
  timesRefreshed = 0;

  /**
   * The number of frames until
   * @type {number}
   */
  #refreshResetCounter = 0;

  /**
   * Frames until the next spread pulse for this tracked state.
   * @type {number}
   */
  #spreadTickCounter = 0;

  /**
   * Frames until the next slip/regen tick for this tracked state.
   * @type {number}
   */
  #tickCounter = 0;

  //endregion properties

  /**
   * Constructor.
   * @param {Game_Battler} battler The battler afflicted.
   * @param {number} stateId The id of the state being applied to the battler.
   * @param {number} iconIndex The icon index associated with the state.
   * @param {number} duration The duration in frames that this state will remain.
   * @param {number=} startingStacks The number of stacks to start out with; defaults to 1.
   * @param {Game_Battler=} source The battler who afflicted the state; defaults to self.
   * @param {RPG_Skill=} sourceSkill The skill that was executing when the state was applied; defaults to null.
   */
  constructor(battler, stateId, iconIndex, duration, startingStacks = 1, source = battler, sourceSkill = null)
  {
    // initialize the values of the tracker.
    this.battler = battler;
    this.stateId = stateId;
    this.iconIndex = iconIndex;
    this.duration = duration;
    this.stackCount = startingStacks;
    this.source = source;
    this.sourceSkill = sourceSkill;

    // mirror the duration as base duration for stacks.
    this.setBaseDuration(duration);

    // start the spread cadence so the first pulse fires after one full interval.
    this.#spreadTickCounter = this.getSpreadTickInterval();

    // start the slip/regen cadence so the first tick fires after one full interval.
    this.#tickCounter = this.getTickInterval();

    // set the state to be active.
    this.expired = false;
  }

  /**
   * Updates the base duration to a new value.
   * @param {number} newBaseDuration The new base duration value.
   */
  setBaseDuration(newBaseDuration)
  {
    // updates the underlying base duration as well.
    this.#baseDuration = newBaseDuration;
  }

  /**
   * The original applied duration in frames (denominator for HUD/map drain ratios).
   * @returns {number}
   */
  get baseDurationFrames()
  {
    return this.#baseDuration;
  }

  /**
   * Determines whether or not the state should not expire by duration.
   * @returns {boolean} True if this state should last until removed, false otherwise.
   */
  hasEternalDuration()
  {
    // "forever" states are states that have no duration aka -1.
    if (this.#baseDuration !== -1) return false;

    // this state should never expire unless removed explicitly.
    return true;
  }

  /**
   * Whether or not this state has been refreshed recently enough that the refresh effects are diminished due to
   * repetition of being reapplied over and over again in a short amount of time.
   * @returns {boolean}
   */
  hasDiminishingRefresh()
  {
    return this.#refreshResetCounter > 0;
  }

  /**
   * Refresh the refresh reset counter.
   * @param {number=} newRefreshResetAmount The count to refresh the refresh reset counter to.
   */
  refreshRefreshResetCounter(newRefreshResetAmount = J.ABS.Metadata.DefaultStateRefreshReset)
  {
    this.#refreshResetCounter = newRefreshResetAmount;
  }

  /**
   * The update loop for this tracked state.
   * Handles decrementing the counter and removing the state as applicable.
   */
  update()
  {
    // handle all counters associated with the state.
    this.handleCounters();

    // gain or lose stacks on a duration-centric basis.
    this.handleStackChangeFromDuration();

    // handle the removal if applicable.
    this.handleExpiration();

    // reset the refresh reset counter and times refreshed counter if necessary.
    this.handleDiminishedRefresh();
  }

  /**
   * Handle all the counters that countdown on this state, like the refresh reset counter
   * and the actual duration counter.
   */
  handleCounters()
  {
    // countdown the refresh reset timer for this state.
    this.decrementRefreshResetCounter();

    // countdown if there is still time left to be counted down.
    this.decrementDuration();

    // countdown the spread pulse timer (no-op at pulse time when the state row has no spread tag).
    this.decrementSpreadTickCounter();

    // countdown the slip/regen tick timer for this state's own cadence.
    this.decrementTickCounter();
  }

  /**
   * Decrements the refresh reset counter as-needed.
   */
  decrementRefreshResetCounter()
  {
    // check if we still have any counter left.
    if (this.#refreshResetCounter > 0)
    {
      // decrement it as-needed.
      this.#refreshResetCounter--;
    }
  }

  /**
   * Decrements the duration as-needed.
   */
  decrementDuration()
  {
    // check if we still have time left on the clock.
    if (this.duration > 0)
    {
      // decrement the timer.
      this.duration--;
    }
  }

  /**
   * Decrement the stack counter as-needed.
   * @param {number=} stacksToRemove The number of stacks to decrement; defaults to 1.
   */
  decrementStacks(stacksToRemove = 1)
  {
    // remember the count going in, so the battler is only notified of a change that happened.
    const previousStackCount = this.stackCount;

    // if not being forced, then consider losing all stacks at once.
    this.stackCount -= stacksToRemove;

    // check if we STILL have stacks remaining.
    if (this.stackCount > 0)
    {
      // reset the duration to the initial duration.
      this.refreshDuration();
    }

    // check if we need to normalize the stack count.
    if (this.stackCount < 0)
    {
      // normalize the stack count.
      this.stackCount = 0;
    }

    // the stack count decides how many copies of this state Game_Battler#states hands to
    // traitObjects(), so a count that moved leaves the battler's trait caches describing a
    // stack depth that no longer exists- additive trait families like element rate would keep
    // reporting the resistance of the deeper stack until some unrelated change cleared them.
    if (this.stackCount !== previousStackCount)
    {
      // notify the battler that its data changed, exactly as incrementStacks() does.
      this.battler.onBattlerDataChange();
    }
  }

  /**
   * Handles stack changes from duration expiring: states normally lose a stack (or all stacks),
   * but a state tagged {@code <stackOnExpire>} gains a stack instead and re-arms itself
   * indefinitely, with no external reapplication required.
   */
  handleStackChangeFromDuration()
  {
    // don't do anything if duration hasn't actually run out for this state.
    if (this.canChangeStackFromDuration() === false) return;

    // grab the database row backing this tracked state.
    const stateRow = this.source.state(this.stateId);

    // self-accumulating states gain a stack on expiry instead of losing one.
    if (stateRow.jabsStackOnExpire === true)
    {
      // gain a stack (and roll for stack-conversion, same as an externally-applied stack).
      this.applyStackGain(1);

      // incrementStacks() alone never touches duration the way decrementStacks() does- without
      // this, duration stays pinned at zero and this branch would refire every single frame.
      this.refreshDuration();

      return;
    }

    // grab whether or not to lose all stacks at once.
    const loseAllStacksAtOnce = stateRow.jabsLoseAllStacksAtOnce;

    // if not being forced, then consider losing all stacks at once.
    const stacksLossCount = (loseAllStacksAtOnce === true)
      ? this.stackCount
      : 1;

    // decrement the stacks.
    this.decrementStacks(stacksLossCount);
  }

  /**
   * Determines whether or not this state can gain or lose stacks from duration expiring.
   * @returns {boolean} True if it can, false otherwise.
   */
  canChangeStackFromDuration()
  {
    // must still have stacks left.
    if (this.stackCount <= 0) return false;

    // duration must be zero.
    if (this.duration > 0) return false;

    // cannot be a perpetual state.
    if (this.hasEternalDuration()) return false;

    // this state's stacks can change from duration expiring.
    return true;
  }

  /**
   * Gains stacks on this tracked state, then rolls for stack-conversion. Shared by both
   * externally-triggered stacking ({@link JABS_Engine#stackJabsState}) and self-accumulation
   * ({@link #handleStackChangeFromDuration}) so both paths get conversion-at-threshold support.
   * @param {number} amount The number of stacks to gain; defaults to 1.
   */
  applyStackGain(amount = 1)
  {
    // increment the stack counter, respecting the state's stack cap.
    this.incrementStacks(amount);

    // roll for stack-conversion now that the stack count has changed.
    $jabsEngine.checkStackConversion(this);
  }

  /**
   * Refreshes the duration of the state based on its original duration.
   * This does not refresh the recently applied counter.
   */
  refreshDuration(newDuration = this.#baseDuration)
  {
    // don't refresh the state if the provided duration is actually 0.
    if (newDuration === 0) return;

    // refresh the duration.
    this.duration = newDuration;

    // unexpire the tracker.
    this.expired = false;

    // reset the refresh reset counter.
    this.refreshRefreshResetCounter();

    // when new states are revived, they may be revived with zero stacks.
    if (this.stackCount === 0)
    {
      // they should actually be revived with a single stack.
      this.stackCount = 1;
    }
  }

  /**
   * Handles the removal of the state from the afflicted battler if applicable.
   * When the state expires naturally, fires the applyStateOnExpire follow-up
   * before the removal takes place so that the source reference is still valid.
   */
  handleExpiration()
  {
    // check if we can and should remove this state from the battler.
    if (this.canRemoveFromBattler() && this.shouldRemoveFromBattler())
    {
      // fire any natural-expiry follow-up state before removing this one.
      this.handleApplyStateOnExpire();

      // actually remove the state from the battler.
      this.removeFromBattler();
    }
  }

  /**
   * When this state has reached the end of its natural duration, checks for an
   * {@link jabsApplyStateOnExpire} tag on the database state and rolls the
   * configured percent chance to apply the follow-up state to the same battler.<br/>
   * This method does NOT run when a state is removed by force (dispel, script, KO).
   */
  handleApplyStateOnExpire()
  {
    // grab the follow-up definition from the database state.
    const expireData = $dataStates[this.stateId].jabsApplyStateOnExpire;

    // if the state has no expiry-chain tag, there is nothing to do.
    if (expireData === null) return;

    // unpack the configured follow-up state id and its application chance.
    const { stateId: nextStateId, chance } = expireData;

    // roll the chance; if it doesn't pass, the follow-up does not fire.
    if (!RPGManager.chanceIn100(chance)) return;

    // apply the follow-up state, inheriting the source and source skill of the expiring state.
    this.battler.addState(nextStateId, this.source, this.sourceSkill);
  }

  /**
   * Handle reset circumstances for the refresh reset counter and times refreshed counter.
   */
  handleDiminishedRefresh()
  {
    // check if we have refreshed repeatedly, but the reset counter reached zero.
    if (this.timesRefreshed > 0 && this.#refreshResetCounter === 0)
    {
      // reset the number of times this state has been refreshed.
      this.timesRefreshed = 0;
    }
  }

  /**
   * Increments the stack counter as high as the limit allows.
   * @param {number} stackIncrease The number of stacks to increase; defaults to 1.
   */
  incrementStacks(stackIncrease = 1)
  {
    // grab the (possibly extension-merged) database row backing this tracked state.
    const stateRow = this.battler.state(this.stateId);

    // grab the base max number of stacks for this state, plus any state-scoped boost baked into
    // its own note (including one merged in from an <extend>/<extendType> overlay state),
    // plus any blanket boost the caster carries from their own equipment/passives/etc.
    const maxStacks = stateRow.jabsStateStackMax
      + stateRow.jabsThisStackMaxBoost
      + this.source.getStackMaxBoost();

    // check if we still have room to add more stacks.
    if (this.stackCount < maxStacks)
    {
      // project the new stack count.
      const projectedStackCount = this.stackCount + stackIncrease;

      // increment the stack counter within threshold.
      this.stackCount = Math.min(maxStacks, projectedStackCount);

      // notify the battler that its data changed so parameter caches (like msb) refresh.
      this.battler.onBattlerDataChange();
    }
  }

  /**
   * Removes this tracked state from the afflicted battler.
   */
  removeFromBattler()
  {
    // actually remove the state from the battler.
    this.battler.removeState(this.stateId);

    // expire it, too.
    this.expired = true;
  }

  /**
   * Determine if removing this state is even possible.
   * @returns {boolean} True if it is removable, false otherwise.
   */
  canRemoveFromBattler()
  {
    // if the state afflicted is death, we can't remove it.
    if (this.canHoldBecauseStateType()) return false;

    // if the battler isn't afflicted with it, we can't remove it.
    if (!this.battler.isStateAffected(this.stateId)) return false;

    // its removable.
    return true;
  }

  /**
   * Determines whether or not this state should be removed because of its type.
   * @returns {boolean}
   */
  canHoldBecauseStateType()
  {
    // if the state afflicted is death, we can't remove it.
    if (this.stateId === this.battler.deathStateId()) return true;

    // nothing is holding this state relating to its type of state.
    return false;
  }

  /**
   * Determines whether or not we should remove this state from the battler.
   * @returns {boolean} True if it should be removed, false otherwise.
   */
  shouldRemoveFromBattler()
  {
    // if there are any stacks remaining, the stacks should be decremented first.
    if (this.stackCount > 0) return false;

    // if there is still time on the clock, we shouldn't remove it.
    if (!this.shouldRemoveByDuration()) return false;

    // purge it!
    return true;
  }

  /**
   * Determines whether or not this state should be removed because of its duration.
   * @returns {boolean} True if the state should be removed, false otherwise.
   */
  shouldRemoveByDuration()
  {
    // if there is still time on the clock, we shouldn't remove it.
    if (this.duration > 0) return false;

    // if there is no time because it is an eternal state, we shouldn't remove it.
    if (this.duration <= 0 && this.hasEternalDuration()) return false;

    // time is up!
    return true;
  }

  /**
   * Determines whether or not this state is about to expire.
   * @returns {boolean} True if it is about to expire, false otherwise.
   */
  isAboutToExpire()
  {
    // define the threshold for when a state is "about to expire".
    const aboutToExpireThreshold = Math.round(this.#baseDuration / 5);

    // return whether or not the current duration is less than that.
    return (this.duration <= aboutToExpireThreshold && !this.hasEternalDuration());
  }

  /**
   * Decrements the spread tick counter and fires a spread pulse when it reaches zero.
   */
  decrementSpreadTickCounter()
  {
    // countdown toward the next spread pulse.
    if (this.#spreadTickCounter > 0)
    {
      this.#spreadTickCounter--;
    }

    // when the counter hits zero, start the next interval and attempt spreading.
    if (this.#spreadTickCounter === 0)
    {
      this.resetSpreadTickCounter();
      this.handleSpreading();
    }
  }

  /**
   * Resets the spread tick counter to the resolved interval for this state row.
   */
  resetSpreadTickCounter()
  {
    this.#spreadTickCounter = this.getSpreadTickInterval();
  }

  /**
   * Resolves how many frames elapse between spread pulses for this tracked state.
   * @returns {number}
   */
  getSpreadTickInterval()
  {
    const stateRow = this.source.state(this.stateId);

    // per-state override wins when present.
    if (stateRow && stateRow.jabsSpreadTickFrames > 0)
    {
      return stateRow.jabsSpreadTickFrames;
    }

    // fall back to the plugin default when the state row omits spreadTick.
    return J.ABS.Metadata.DefaultStateSpreadTickInterval;
  }

  /**
   * Decrements this state's own slip/regen tick counter and fires a tick when it reaches zero.
   * Unlike the legacy battler-wide regen counter, every tracked state resolves and counts down
   * its own interval, so different states can tick at entirely different speeds.
   */
  decrementTickCounter()
  {
    // countdown toward the next tick.
    if (this.#tickCounter > 0)
    {
      this.#tickCounter--;
    }

    // when the counter hits zero, start the next interval and apply this tick.
    if (this.#tickCounter === 0)
    {
      this.resetTickCounter();
      this.handleTick();
    }
  }

  /**
   * Resets the slip/regen tick counter to the freshly-resolved interval for this state.
   * Resolving on every reset (rather than once at creation) means battler-wide or type-scoped
   * tick speed modifiers gained/lost mid-affliction take effect at the next tick boundary.
   */
  resetTickCounter()
  {
    this.#tickCounter = this.getTickInterval();
  }

  /**
   * Resolves how many frames elapse between slip/regen ticks for this tracked state.<br/>
   * Base interval is this state's own {@code <thisTickSpeed:N>} override if present, otherwise
   * the plugin's global default. That base is then adjusted by every flat and percent tick speed
   * modifier currently affecting the state's source (the battler who applied it), where percent
   * modifiers include both the battler-wide total and every type-scoped modifier matching one of
   * this state's own {@code <type:CLASSIFIER>} tags. The result is floored at both a hardcoded
   * absolute minimum and the plugin's tunable minimum.
   * @returns {number}
   */
  getTickInterval()
  {
    // grab the database state row backing this tracked state.
    const stateRow = this.source.state(this.stateId);

    // per-state override wins over the global default when present.
    const baseInterval = stateRow.jabsThisTickSpeed > 0
      ? stateRow.jabsThisTickSpeed
      : J.ABS.Metadata.DefaultStateTickInterval;

    // tick speed modifiers are evaluated against the source, not the afflicted battler-
    // Festering/Exsanguination-style passives speed up the ticks of states their owner inflicts.
    const flatModifier = this.source.tickSpeedFlatModifier();
    const percentModifier = this.source.tickSpeedPercentModifier(stateRow.types());

    // apply the flat modifier first, then the combined percent modifier.
    const modifiedInterval = (baseInterval + flatModifier) / (1 + (percentModifier / 100));

    // never let the interval drop below the tunable floor, and never below 1 frame regardless.
    const tunableFloor = Math.max(J.ABS.Metadata.MinimumStateTickInterval, 1);

    return Math.max(Math.round(modifiedInterval), tunableFloor);
  }

  /**
   * Applies a single slip/regen tick for this state. Delegates the actual math and resource
   * application to the map battler wrapper, which owns the slip tag parsing and the
   * {@link JABS_Battler#onSlipRegenTick} popup hook.
   */
  handleTick()
  {
    // expired trackers should not keep ticking.
    if (this.expired === true) return;

    // abs must be active and we need a carrier to resolve the map-battler wrapper.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    if (!this.battler) return;

    // resolve the afflicted battler's map wrapper, which owns slip application.
    const carrier = JABS_AiManager.getBattlerByUuid(this.battler.getUuid());

    if (!carrier) return;

    // apply this tick's slip/regen using the live database state row.
    carrier.processStateTick(this.source.state(this.stateId));
  }

  /**
   * Attempts to spread this state to nearby battlers when the state row defines a spread rule.
   */
  handleSpreading()
  {
    // expired trackers should not keep spreading.
    if (this.expired === true) return;

    // abs must be active and we need a carrier plus a source for addState attribution.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    if (!this.battler || !this.source) return;

    const stateRow = this.source.state(this.stateId);

    // no spread tag means the cadence counter still runs but does nothing else.
    if (!stateRow || !stateRow.jabsSpreadRule) return;

    const { chance, range } = stateRow.jabsSpreadRule;

    // invalid authoring should not throw or spam rolls.
    if (chance <= 0 || range <= 0) return;

    // resolve the afflicted battler on the map for distance queries.
    const carrier = JABS_AiManager.getBattlerByUuid(this.battler.getUuid());

    if (!carrier) return;

    // gather in-range candidates (closest-first) and drop unusable targets.
    let candidates = this.#buildSpreadCandidates(carrier, range, stateRow.jabsViral);

    candidates = candidates.filter(jabsBattler =>
    {
      const targetBattler = jabsBattler.getBattler();

      if (!targetBattler) return false;

      // never spread back onto the carrier of this affliction.
      if (targetBattler === this.battler) return false;

      if (targetBattler.isStateAddable(this.stateId) === false) return false;

      // optional: never use spread to refresh or stack on battlers who already carry this state.
      if (stateRow.jabsSpreadSkipAfflicted === true
        && targetBattler.isStateAffected(this.stateId) === true)
      {
        return false;
      }

      return true;
    });

    const orderedCandidates = this.#orderSpreadCandidates(
      candidates,
      stateRow.jabsSpreadPreferUnafflicted
    );
    let successCount = 0;
    const maxPerTick = stateRow.jabsSpreadPerTick;

    for (const jabsBattler of orderedCandidates)
    {
      // honor a per-pulse success cap when configured; failed rolls do not consume it.
      if (maxPerTick > 0 && successCount >= maxPerTick) break;

      const targetBattler = jabsBattler.getBattler();

      if (RPGManager.chanceIn100(chance) === false) continue;

      // always attribute spreads to the original applier and their skill, not the current carrier.
      targetBattler.addState(this.stateId, this.source, this.sourceSkill);
      successCount++;
    }
  }

  /**
   * Builds the spread candidate list for this pulse, sorted closest to farthest.
   * @param {JABS_Battler} carrierJabs The map battler carrying this affliction.
   * @param {number} range Maximum tile distance from the carrier.
   * @param {boolean} viral When true, all battlers in range qualify; otherwise allies only.
   * @returns {JABS_Battler[]}
   */
  #buildSpreadCandidates(carrierJabs, range, viral)
  {
    if (viral === true)
    {
      return JABS_AiManager.getAllBattlersWithinRangeSortedByDistance(carrierJabs, range);
    }

    // allied helper returns range-filtered battlers but not distance-sorted.
    const allied = JABS_AiManager.getAlliedBattlersWithinRange(carrierJabs, range);

    allied.sort((a, b) =>
    {
      const distA = carrierJabs.distanceToDesignatedTarget(a);
      const distB = carrierJabs.distanceToDesignatedTarget(b);

      return distA - distB;
    });

    return allied;
  }

  /**
   * Optionally partitions candidates so unafflicted battlers are tried before carriers of this state id.
   * @param {JABS_Battler[]} candidates Distance-sorted spread targets.
   * @param {boolean} preferUnafflicted When true, reorder by affliction of this state id only.
   * @returns {JABS_Battler[]}
   */
  #orderSpreadCandidates(candidates, preferUnafflicted)
  {
    if (preferUnafflicted === false)
    {
      return candidates;
    }

    const unafflicted = [];
    const afflicted = [];

    for (const jabsBattler of candidates)
    {
      const targetBattler = jabsBattler.getBattler();

      if (targetBattler.isStateAffected(this.stateId) === false)
      {
        unafflicted.push(jabsBattler);
      }
      else
      {
        afflicted.push(jabsBattler);
      }
    }

    return unafflicted.concat(afflicted);
  }
}

/**
 * Fluent entry point for constructing a {@link JABS_State} (see {@link JABS_StateBuilder}).
 * @param {Game_Battler} target The afflicted battler.
 * @param {number} stateId The database state id.
 * @returns {JABS_StateBuilder}
 */
JABS_State.Builder = (target, stateId) => new JABS_StateBuilder(target, stateId);

export default JABS_State;
//endregion JABS_State