//region JABS_Cooldown
/**
 * A class representing a skill or item's cooldown data.
 */
class JABS_Cooldown
{
  /**
   * Constructor.
   * @param {string} key The key of the cooldown.
   */
  constructor(key)
  {
    this.initialize(key);
  }

  //region initialize
  /**
   * Initializes this cooldown.
   * @param {string} key The key for this cooldown.
   */
  initialize(key)
  {
    /**
     * The key of the cooldown.
     * @type {string}
     */
    this.key = key;

    // initialize the class members.
    this.initMembers();

    // initialize the rest of the properties.
    this.clearData();
  }

  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    /**
     * The frames of the cooldown.
     * @type {number}
     */
    this.frames = 0;

    /**
     * The full duration this cooldown was set to the last time {@link #setFrames} was called with a
     * positive value- i.e. the skill's total cooldown, not however much of it remains right now.
     * Stored alongside {@link frames} the same way {@link comboExpireFramesMax} stashes the original
     * combo window size, so percentage-based cooldown modifiers have a stable total to compute against.
     * @type {number}
     */
    this.maxFrames = 0;

    /**
     * Whether or not the base cooldown is ready.
     * @type {boolean}
     */
    this.ready = false;

    /**
     * The number of frames in which the combo action can be executed instead.
     * @type {number}
     */
    this.comboFrames = 0;

    /**
     * Whether or not the combo cooldown is ready.
     * @type {boolean}
     */
    this.comboReady = false;

    /**
     * Frames remaining in the combo expiry window, counted from when the skill fired.
     * Zero means no expiry is set; when it counts down to zero from a positive value,
     * the combo is cleared even if the player has not pressed the follow-up.
     * @type {number}
     */
    this.comboExpireFrames = 0;

    /**
     * The original expiry window size set when the skill fired.
     * Stored alongside {@link comboExpireFrames} so the HUD gauge can compute a fill rate.
     * Reset to zero when the window closes or the combo is cleared.
     * @type {number}
     */
    this.comboExpireFramesMax = 0;

    /**
     * Describes how the HUD should display the cooldown-overlay icon for this slot.
     * Set at skill-fire time from the executed skill's authored combo data:
     *   'none'     — no combo link; show the overlay immediately.
     *   'expiring' — combo with an authored expire window; show the overlay once the window closes.
     *   'infinite' — combo with no expire window; never show the overlay (the whole CD is the window).
     * Reset to 'none' when the base cooldown finishes.
     * @type {'none'|'expiring'|'infinite'}
     */
    this.comboMode = 'none';

    /**
     * Whether or not this cooldown is locked from changing.
     * @type {boolean}
     */
    this.locked = false;

    /**
     * Whether or not the skill manager needs to clear the combo data for the
     * slot that this cooldown is attached to.
     * @type {boolean}
     */
    this.mustComboClear = false;
  }

  /**
   * Re-initializes all the data of this cooldown.
   */
  clearData()
  {
    // default all the values.
    this.frames = 0;
    this.maxFrames = 0;
    this.ready = false;
    this.comboFrames = 0;
    this.comboReady = false;
    this.comboExpireFrames = 0;
    this.comboExpireFramesMax = 0;
    this.comboMode = 'none';
    this.locked = false;
    this.mustComboClear = false;
  }
  //endregion initialize

  /**
   * Whether or not the combo data needs clearing.
   * @returns {boolean}
   */
  needsComboClear()
  {
    return this.mustComboClear;
  }

  /**
   * Acknowledges the combo was cleared and sets the flag to false.
   */
  acknowledgeComboClear()
  {
    this.mustComboClear = false;
  }

  /**
   * Requests the combo to be cleared and sets the flag to true.
   */
  requestComboClear()
  {
    this.mustComboClear = true;
  }

  /**
   * Manages the update cycle for this cooldown.
   */
  update(isCasting = false)
  {
    // check if we can update the cooldowns at all.
    if (!this.canUpdate()) return;

    // update the cooldowns.
    this.updateCooldownData(isCasting);
  }

  /**
   * Determines whether or not this cooldown can be updated.
   * @returns {boolean} True if it can be updated, false otherwise.
   */
  canUpdate()
  {
    // cannot update a cooldown when it is locked.
    if (this.isLocked()) return false;

    // update the cooldown!
    return true;
  }

  /**
   * Updates the base and combo cooldowns.
   */
  updateCooldownData(isCasting = false)
  {
    // update the base cooldown.
    this.updateBaseCooldown();

    // update the combo cooldown, pausing the expiry window while the battler is casting.
    this.updateComboCooldown(isCasting);
  }

  //region base cooldown
  /**
   * Updates the base skill data for this cooldown.
   */
  updateBaseCooldown()
  {
    // if the base cooldown is ready, do not update.
    if (this.ready) return;

    // check if we have a base cooldown to decrement.
    if (this.frames > 0)
    {
      // decrement the base cooldown.
      this.frames--;
    }

    // check if the base cooldown is complete.
    this.handleIfBaseReady();
  }

  /**
   * Sets how the HUD overlay icon behaves for this cooldown cycle.
   * Called by the engine at skill-fire time from the executed skill's authored combo data.
   * @param {'none'|'expiring'|'infinite'} mode The overlay mode.
   */
  setComboMode(mode)
  {
    // record the overlay behavior for this cooldown cycle.
    this.comboMode = mode;
  }

  /**
   * Enables the flag to indicate the base skill is ready for this cooldown.
   * This also clears the combo data, as they both cannot be available at the same time.
   */
  enableBase()
  {
    // set the base cooldown frames to 0.
    this.frames = 0;

    // toggles the base ready flag.
    this.ready = true;

    // reset the overlay mode so the next skill fire starts clean.
    this.comboMode = 'none';
  }

  /**
   * Gets whether or not the base skill is off cooldown.
   * @returns {boolean}
   */
  isBaseReady()
  {
    return this.ready;
  }

  /**
   * Sets a new value for the base cooldown to countdown from.
   * @param {number} frames The value to countdown from.
   */
  setFrames(frames)
  {
    // set the value.
    this.frames = frames;

    // check if the base cooldown is now ready.
    this.handleIfBaseReady();

    // check if the base cooldown is now not ready.
    this.handleIfBaseUnready();

    // a positive value means a new skill just fired on this slot.
    // clear the previous combo expiry window immediately — it belongs to the skill that just finished,
    // and the hit-side updateComboSequence will set a fresh window if the new skill has one.
    if (frames > 0)
    {
      this.setComboExpireFrames(0);

      // stash the full duration this cooldown was just set to, so percentage-based cooldown
      // modifiers (e.g. "reduce all active cooldowns by 10% of their total") have a stable total to
      // compute against instead of only ever seeing however much time happens to remain right now.
      this.maxFrames = frames;
    }
  }

  /**
   * Adds a value to the combo frames to extend the combo countdown.
   * @param {number} frames The value to add to the countdown.
   */
  modBaseFrames(frames)
  {
    // modify the value.
    this.frames += frames;

    // check if the base cooldown is now ready.
    this.handleIfBaseReady();

    // check if the base cooldown is now not ready.
    this.handleIfBaseUnready();
  }

  /**
   * Checks if the base cooldown is in a state of ready.
   * If it is, the ready flag will be enabled.
   */
  handleIfBaseReady()
  {
    // check if the base cooldown is now ready.
    if (this.frames <= 0)
    {
      // clear the combo data.
      this.resetCombo();

      // enable the base skill.
      this.enableBase();
    }
  }

  /**
   * Checks if the base cooldown is in a state of unready.
   * If it is, the ready flag will be disabled.
   */
  handleIfBaseUnready()
  {
    // check if the base cooldown is now not ready.
    if (this.frames > 0)
    {
      // not ready.
      this.ready = false;
    }
  }
  //endregion base cooldown

  //region combo cooldown
  /**
   * Updates the combo data for this cooldown.
   */
  updateComboCooldown(isCasting = false)
  {
    // tick the delay countdown only while the combo is not yet pressable.
    if (!this.comboReady)
    {
      // decrement the combo delay.
      if (this.comboFrames > 0)
      {
        this.comboFrames--;
      }

      // open the combo window once the delay has elapsed.
      this.handleIfComboReady();
    }

    // tick the expiry window only once the delay has elapsed and the follow-up is pressable.
    // the expire window represents time the player *can* press the button, not time since the skill fired.
    // do not drain it while the battler is casting — that time is not available to the player.
    if (this.comboReady && !isCasting)
    {
      this.updateComboExpire();
    }
  }

  /**
   * Ticks the combo expiry countdown and clears the combo when the window closes.
   * Has no effect when no expiry was set ({@link comboExpireFrames} is zero).
   */
  updateComboExpire()
  {
    // no expiry set; nothing to do.
    if (this.comboExpireFrames <= 0) return;

    // count down toward the deadline.
    this.comboExpireFrames--;

    // when the window closes, clear the combo as if the player missed it.
    if (this.comboExpireFrames <= 0)
    {
      this.resetCombo();
    }
  }

  /**
   * Sets the combo expiry window in frames, counted from the moment the skill fires.
   * Pass zero to remove any active expiry (no deadline).
   * @param {number} frames Frames until the combo is auto-cleared.
   */
  setComboExpireFrames(frames)
  {
    // store the countdown starting value.
    this.comboExpireFrames = frames;

    // also record the original value so the HUD gauge knows the full window size.
    this.comboExpireFramesMax = frames;
  }

  /**
   * Enables the flag to indicate a combo is ready for this cooldown.
   */
  enableCombo()
  {
    // action ready!
    // zero the wait time for combo frames.
    this.comboFrames = 0;

    // enable the combo!
    this.comboReady = true;
  }

  /**
   * Sets the combo frames to countdown from this value.
   * @param {number} frames The value to countdown from.
   */
  setComboFrames(frames)
  {
    // set the value.
    this.comboFrames = frames;

    // handle if the base cooldown is now ready.
    this.handleIfComboReady();

    // handle if the base cooldown is now not ready.
    this.handleIfComboUnready();
  }

  /**
   * Adds a value to the combo frames to extend the combo countdown.
   * @param {number} frames The value to add to the countdown.
   */
  modComboFrames(frames)
  {
    // modify the value.
    this.comboFrames += frames;

    // handle if the base cooldown is now ready.
    this.handleIfComboReady();

    // handle if the base cooldown is now not ready.
    this.handleIfComboUnready();
  }

  /**
   * Checks if the combo cooldown is in a state of ready.
   * If it is, the ready flag will be enabled.
   */
  handleIfComboReady()
  {
    // check if the base cooldown is now ready.
    if (this.comboFrames <= 0)
    {
      // enable the combo!
      this.enableCombo();
    }
  }

  /**
   * Checks if the combo cooldown is in a state of unready.
   * If it is, the ready flag will be disabled.
   */
  handleIfComboUnready()
  {
    // check if the combo cooldown is now not ready.
    if (this.comboFrames > 0)
    {
      // not ready.
      this.comboReady = false;
    }
  }

  /**
   * Resets the combo data associated with this cooldown.
   */
  resetCombo()
  {
    // zero the combo frames.
    this.comboFrames = 0;

    // disable the ready flag.
    this.comboReady = false;

    // clear any active expiry window so it does not fire again on the next skill.
    this.comboExpireFrames = 0;

    // clear the original window size now that the window is closed.
    this.comboExpireFramesMax = 0;

    // requests the slot containing this cooldown to clear the combo id.
    this.requestComboClear();
  }

  /**
   * Gets whether or not the combo cooldown is ready.
   * @returns {boolean}
   */
  isComboReady()
  {
    return this.comboReady;
  }
  //endregion combo cooldown

  //region locking
  /**
   * Gets whether or not this cooldown is locked.
   * @returns {boolean}
   */
  isLocked()
  {
    return this.locked;
  }

  /**
   * Locks this cooldown to prevent it from cooling down.
   */
  lock()
  {
    this.locked = true;
  }

  /**
   * Unlocks this cooldown to allow it to finish cooling down.
   */
  unlock()
  {
    this.locked = false;
  }
  //endregion locking
}

SerializableRegistry.register(JABS_Cooldown);

export default JABS_Cooldown;
//endregion JABS_Cooldown