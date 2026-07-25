//region JABS_HitstopData
/**
 * Represents per-entity hitstop state (timer and queued effects).
 */
class JABS_HitstopData
{
  /**
   * Constructor.
   */
  constructor()
  {
    // initialize all members.
    this.initMembers();
  }

  /**
   * Initializes this data model.
   */
  initMembers()
  {
    /**
     * The remaining hitstop frames for this entity.
     * @type {number}
     */
    this._frames = 0;

    /**
     * A short-lived map of actionUuid => remaining frames used to scale multi-hit decay.
     * This is per-character so decay is per-target per-action.
     * @type {Map<string, number>}
     */
    this._flurryWindows = new Map();
  }

  /**
   * Sets hitstop frames.
   * @param {number} frames The frames to set.
   */
  setFrames(frames)
  {
    // set the frames to the provided amount.
    this._frames = Math.max(0, Math.floor(frames));
  }

  /**
   * Gets remaining hitstop frames.
   * @returns {number}
   */
  getFrames()
  {
    // return the remaining frames.
    return this._frames;
  }

  /**
   * Decrements hitstop frames by one frame.
   */
  tick()
  {
    // decrement the timer if applicable.
    if (this._frames > 0) this._frames--;

    // also decrement any active flurry windows.
    this._flurryWindows.forEach((remaining, key) =>
    {
      // decrement the remaining frames.
      const next = remaining - 1;

      // if the window elapsed, remove this entry.
      if (next <= 0)
      {
        this._flurryWindows.delete(key);
      }
      // otherwise, persist the decremented window.
      else
      {
        this._flurryWindows.set(key, next);
      }
    });
  }

  /**
   * Whether this entity is currently hitstopped.
   * @returns {boolean}
   */
  isActive()
  {
    // return whether or not the frames are still ticking.
    return this._frames > 0;
  }

  /**
   * Flags the provided action uuid as “in flurry window” on this entity.
   * @param {string} actionUuid The action uuid.
   * @param {number} windowFrames The window in frames.
   */
  flagFlurryWindow(actionUuid, windowFrames)
  {
    // set or replace the window with the provided amount.
    this._flurryWindows.set(actionUuid, Math.max(0, Math.floor(windowFrames)));
  }

  /**
   * Determines whether or not the provided action uuid is inside the flurry window.
   * @param {string} actionUuid The action uuid.
   * @returns {boolean} True if in the window, false otherwise.
   */
  isInFlurryWindow(actionUuid)
  {
    // determine if the action is currently in the window.
    return this._flurryWindows.has(actionUuid);
  }
}

SerializableRegistry.register(JABS_HitstopData);

export default JABS_HitstopData;
//endregion JABS_HitstopData