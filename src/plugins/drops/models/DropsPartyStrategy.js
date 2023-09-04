/**
 * A class representing a static collection of party strategies relating to rewards.
 */
class DropsPartyStrategy
{
  constructor()
  {
    console.warn(`Attempted to instantiate the PartyStrategy class.`);
    console.warn(`Please directly use the static properties on it instead of instantiating it.`);
    console.trace();
    throw new Error(`PartyStrategy is a static class that cannot be instantiated.`);
  }

  /**
   * The strategy used in niche cases like in games backed by ABS engines.
   * This defines where only the leader will influence reward rates.
   * @type {string}
   */
  static AbsStyle = "leader-only";

  /**
   * The strategy used most commonly in games wielding standard turn-based battle systems.
   * This defines where the active combat party, usually about 4 including the leader,
   * will influence reward rates.
   * @type {string}
   */
  static CombatPartyStyle = "combat-party";

  /**
   * The strategy used most often as an alternative to {@link DropsPartyStrategy.CombatPartyStyle}.
   * This defines where every single member of the party, reserve or otherwise,
   * will influence reward rates.
   * @type {string}
   */
  static FullPartyStyle = "full-party";
}