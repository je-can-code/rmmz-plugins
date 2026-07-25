//region plugin metadata
class JHitstop_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * Default frames to use when a skill lacks `<hitstop:N>`.
     * Typical values: 0–10. Keep subtle by default.
     * @type {number}
     */
    this.defaultHitstopFrames = 5;

    /**
     * Frames to add when the hit is a critical. Small bump keeps readability without camera FX.
     * @type {number}
     */
    this.critBonusFrames = 15;

    /**
     * Guarded hits scale by this percent (e.g., 50 means half duration on guard).
     * @type {number}
     */
    this.guardScalePercent = 50;

    /**
     * Global maximum cap on frames to prevent long freezes.
     * @type {number}
     */
    this.maxFrames = 60;

    /**
     * Global multi-hit decay percent applied within the flurry window (e.g., 50 = half duration).
     * @type {number}
     */
    this.flurryDecayPercent = 50;

    /**
     * The window (in frames) during which subsequent hits from the same action decay.
     * @type {number}
     */
    this.flurryWindowFrames = 20;

    /**
     * Whether to apply a brief white flash on targets (disabled in MVP; requires sprite access helper).
     * @type {boolean}
     */
    this.flashOnHit = false;

    //region shake
    /**
     * Enables a tiny screen shake when hitstop is applied.
     * @type {boolean}
     */
    this.shakeOnHit = true;

    /**
     * Minimum hitstop frames before shake triggers; prevents noise on 1–2f taps.
     * @type {number}
     */
    this.shakeMinFrames = 2;

    /**
     * Base shake power (RMMZ `$gameScreen.startShake(power, speed, duration)`).
     * Keep very small for party play.
     * @type {number}
     */
    this.shakeBasePower = 0.1;

    /**
     * Extra power per hitstop frame (e.g., 0.25 means 5f → +1.25 power).
     * @type {number}
     */
    this.shakePowerPerFrame = 0.025;

    /**
     * Shake speed (visual frequency). 5 is the engine’s typical default.
     * @type {number}
     */
    this.shakeSpeed = 8;

    /**
     * Maximum duration (in frames) for a shake, regardless of hitstop length.
     * @type {number}
     */
    this.shakeMaxDurationFrames = 8;

    /**
     * Cooldown in frames during which no new shake will start; tames APM spam.
     * @type {number}
     */
    this.shakeCooldownFrames = 5;

    /**
     * Only shake when the attacker is the player battler.
     * @type {boolean}
     */
    this.onlyOnPlayerImpact = true;

    /**
     * Also allow shake when the player is the target (being hit).
     * @type {boolean}
     */
    this.alsoOnPlayerAsTarget = true;

    /**
     * If true, only the first impact within the flurry window can trigger shake.
     * @type {boolean}
     */
    this.shakeOnlyOnFlurryFirstHit = true;

    //endregion shake
  }
}

export default JHitstop_PluginMetadata;
//endregion plugin metadata