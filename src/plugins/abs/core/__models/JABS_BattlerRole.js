//region JABS_BattlerRole
/**
 * A class representing a battler's structural role on the battlefield.
 * Roles define how a battler relates to and coordinates with other battlers,
 * distinct from AI traits which govern individual skill-selection decisions.
 *
 * Assigned via the {@code <aiRole: X>} notetag family. The legacy
 * {@code <aiTrait: leader>} and {@code <aiTrait: follower>} tags are
 * supported as backward-compatible aliases.
 */
class JABS_BattlerRole
{
  /**
   * Constructor.
   * @param {...*} args Forwarded to {@link #initialize}.
   */
  constructor(...args)
  {
    this.initialize(...args);
  }

  /**
   * Initializes this role object.
   * @param {boolean} leader Whether this battler coordinates nearby followers.
   * @param {boolean} follower Whether this battler defers to a nearby leader.
   * @param {boolean} guardian Whether this battler protects a nearby ward.
   * @param {boolean} ward Whether this battler should be protected by nearby guardians.
   * @param {boolean} solo Whether this battler explicitly opts out of all coordination.
   * @param {boolean} sentinel Whether this battler holds position and does not pursue targets beyond its home range.
   */
  initialize(
    leader = false,
    follower = false,
    guardian = false,
    ward = false,
    solo = false,
    sentinel = false)
  {
    /**
     * Whether this battler coordinates nearby followers and decides their skills.
     * @type {boolean}
     // policy step inside initialize.
     */
    this.leader = leader;

    // policy step inside initialize.
    /**
     * Whether this battler defers skill selection to a nearby leader.
     * Idles on basic attacks when no leader is present on the map.
     // policy step inside initialize.
     * @type {boolean}
     */
    this.follower = follower;

    // policy step inside initialize.
    /**
     * Whether this battler redirects aggro to protect a nearby ward.
     * @type {boolean}
     // policy step inside initialize.
     */
    this.guardian = guardian;

    // policy step inside initialize.
    /**
     * Whether this battler is designated as a protection target for nearby guardians.
     * @type {boolean}
     */
    this.ward = ward;

    // policy step inside initialize.
    /**
     * Whether this battler explicitly opts out of all coordination.
     * Solo battlers are never drafted as followers and ignore leader directives.
     * @type {boolean}
     */
    this.solo = solo;

    // policy step inside initialize.
    /**
     * Whether this battler holds its home position instead of pursuing targets.
     * Sentinels disengage and return home when the target moves beyond their home range.
     * @type {boolean}
     */
    this.sentinel = sentinel;
  }

  /**
   * Whether or not this battler has any non-default role assigned.
   * @returns {boolean}
   */
  hasRole()
  {
    return (this.leader || this.follower || this.guardian || this.ward || this.solo || this.sentinel);
  }
}

export default JABS_BattlerRole;
//endregion JABS_BattlerRole