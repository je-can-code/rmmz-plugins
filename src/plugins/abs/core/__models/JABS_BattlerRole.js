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
function JABS_BattlerRole()
{
  this.initialize(...arguments);
}

JABS_BattlerRole.prototype = {};
JABS_BattlerRole.prototype.constructor = JABS_BattlerRole;

/**
 * Initializes this role object.
 * @param {boolean} leader Whether this battler coordinates nearby followers.
 * @param {boolean} follower Whether this battler defers to a nearby leader.
 * @param {boolean} guardian Whether this battler protects a nearby ward.
 * @param {boolean} ward Whether this battler should be protected by nearby guardians.
 * @param {boolean} solo Whether this battler explicitly opts out of all coordination.
 * @param {boolean} sentinel Whether this battler holds position and does not pursue targets beyond its home range.
 */
JABS_BattlerRole.prototype.initialize = function(
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
   */
  this.leader = leader;

  /**
   * Whether this battler defers skill selection to a nearby leader.
   * Idles on basic attacks when no leader is present on the map.
   * @type {boolean}
   */
  this.follower = follower;

  /**
   * Whether this battler redirects aggro to protect a nearby ward.
   * @type {boolean}
   */
  this.guardian = guardian;

  /**
   * Whether this battler is designated as a protection target for nearby guardians.
   * @type {boolean}
   */
  this.ward = ward;

  /**
   * Whether this battler explicitly opts out of all coordination.
   * Solo battlers are never drafted as followers and ignore leader directives.
   * @type {boolean}
   */
  this.solo = solo;

  /**
   * Whether this battler holds its home position instead of pursuing targets.
   * Sentinels disengage and return home when the target moves beyond their home range.
   * @type {boolean}
   */
  this.sentinel = sentinel;
};

/**
 * Whether or not this battler has any non-default role assigned.
 * @returns {boolean}
 */
JABS_BattlerRole.prototype.hasRole = function()
{
  return (this.leader || this.follower || this.guardian || this.ward || this.solo || this.sentinel);
};
//endregion JABS_BattlerRole