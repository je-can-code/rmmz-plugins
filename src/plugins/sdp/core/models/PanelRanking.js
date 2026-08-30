//region PanelRanking
import SdpMasteryManager from '../managers/SdpMasteryManager.js';

/**
 * A class for tracking an actor's ranking in a particular panel.
 */
class PanelRanking
{
  /**
   * Initializes a single panel ranking for tracking on a given actor.
   * @param {string} key The unique key for the panel to be tracked.
   * @param {number} actorId The id of the actor.
   */
  constructor(key, actorId)
  {
    /**
     * The key for this panel ranking.
     * @type {string}
     */
    this.key = key;

    /**
     * The id of the actor that owns this ranking.
     * @type {number}
     */
    this.actorId = actorId;

    this.initMembers();
  }

  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    /**
     * The current rank for this panel ranking.
     * @type {number}
     */
    this.currentRank = 0;

    /**
     * Whether or not this panel is maxed out.
     * @type {boolean}
     */
    this.maxed = false;

    /**
     * Whether or not this panel ranking is unlocked for investment.
     * @type {boolean}
     */
    this._isUnlocked = false;
  }

  /**
   * Determines whether or not the associated panel is unlocked.
   * @returns {boolean}
   */
  isUnlocked()
  {
    return this._isUnlocked;
  }

  /**
   * Flags the associated panel as "unlocked".
   */
  unlock()
  {
    this._isUnlocked = true;
  }

  /**
   * Flags the associated panel as "locked".
   */
  lock()
  {
    this._isUnlocked = false;
  }

  /**
   * Ranks up this panel.
   * If it is at max rank, then perform the max effect exactly once
   * and then max the panel out.
   */
  rankUp()
  {
    const panel = J.SDP.Metadata.panelsMap.get(this.key);
    const { maxRank } = panel;

    if (this.currentRank < maxRank)
    {
      this.currentRank++;
      this.performRepeatRankupEffects();
      this.performCurrentRankupEffects();
    }

    if (this.currentRank === maxRank)
    {
      this.performMaxRankupEffects();
    }
  }

  /**
   * Clamps the current rank down to the configured max rank when data changes.
   */
  normalizeRank()
  {
    const panel = J.SDP.Metadata.panelsMap.get(this.key);
    const { maxRank } = panel;

    if (this.currentRank > maxRank)
    {
      this.currentRank = maxRank;
    }
  }

  /**
   * Gets whether or not this panel is maxed out.
   * @returns {boolean} True if this panel is maxed out, false otherwise.
   */
  isPanelMaxed()
  {
    return this.maxed;
  }

  /**
   * Upon reaching a given rank of this panel, try to perform this `javascript` effect.
   * @param {number} newRank The rank to inspect and execute effects for.
   */
  performRankupEffects(newRank)
  {
    // identify the rewards.
    const rewardEffects = J.SDP.Metadata.panelsMap.get(this.key)
      .getPanelRewardsByRank(newRank);

    // if there are no rewards, then stop processing.
    if (rewardEffects.length === 0) return;

    // establish that "a" is the actor performing the rank up.
    const a = $gameActors.actor(this.actorId);

    // iterate over each of the rewards and execute them.
    rewardEffects.forEach(rewardEffect =>
    {
      // these are raw javascript rewards, so execute them as safely as we can lol.
      // 'a' is the actor context for reward scripts.
      try
      {
        new Function('a', rewardEffect.effect)(a);
      }
      catch (err)
      {
        const reward = `the rank-${this.currentRank} reward for panel: ${this.key}`;
        Diagnostics.error(__PLUGIN_NAME__, `an error occurred while trying to execute ${reward}`, err);
      }
    });
  }

  /**
   * Executes any rewards associated with the current rank (used after ranking up typically).
   */
  performCurrentRankupEffects()
  {
    this.performRankupEffects(this.currentRank);
  }

  /**
   * Executes any rewards that are defined as "repeat rankup effects", aka -1 rank.
   */
  performRepeatRankupEffects()
  {
    this.performRankupEffects(-1);
  }

  /**
   * Executes any rewards that are defined as "max rankup effects", aka 0 rank.
   */
  performMaxRankupEffects()
  {
    this.maxed = true;
    SoundManager.playRecovery();

    // run any raw javascript max-rank rewards defined in panelRewards (learnSkill, unlockSdp, etc.).
    this.performRankupEffects(0);

    // then reconcile subgroup mastery wrapper skills (separate from panelRewards eval above).
    this.applySubgroupMastery();
  }

  /**
   * Reconciles subgroup mastery skills after this panel reaches max rank.
   */
  applySubgroupMastery()
  {
    const panel = J.SDP.Metadata.panelsMap.get(this.key);

    // skip panels that aren't enrolled in the mastery program.
    if (!panel || panel.mastery.participates() === false) return;

    const actor = $gameActors.actor(this.actorId);

    // learn/forget wrapper skills for this subgroup based on highest maxed tier.
    SdpMasteryManager.reconcileSubgroupMastery(actor, panel.mastery.subgroupKey);
  }
}

SerializableRegistry.register(PanelRanking);

export default PanelRanking;
//endregion PanelRanking