//region NaturalParameterBinding
/**
 * Attaches J-NaturalGrowth's buff and growth notetags to one registered parameter.<br/>
 * A parameter grows naturally when whoever owns it binds one of these to its registry key through
 * {@link ParameterRegistry.bindNatural}. The binding names the four tags the parameter answers to, and
 * the value those tags treat as the parameter's base: the `b` of every formula, and what a `Rate` tag
 * is a percent of.
 *
 * The four structures are references to regexes living in the owner's own `RegExp` table, never
 * patterns assembled here. The notetag reference gate and the build manifest both discover tags by
 * reading `RegExp` table literals out of the source, so a pattern built anywhere else would be a tag
 * that neither of them, nor Chef Adventure's data validator, could ever see.
 */
class NaturalParameterBinding
{
  /**
   * @param {RegExp} buffPlus The flat bonus a note source grants for as long as it is active.
   * @param {RegExp} buffRate The percent bonus a note source grants for as long as it is active.
   * @param {RegExp} growthPlus The flat bonus gained permanently with every level.
   * @param {RegExp} growthRate The percent bonus gained permanently with every level.
   * @param {function(Game_Battler): number} getBase Resolves the parameter's own value before any natural
   * bonus, in the parameter's own units.
   */
  constructor(buffPlus, buffRate, growthPlus, growthRate, getBase)
  {
    /**
     * The flat bonus a note source grants for as long as it is active.
     * @type {RegExp}
     */
    this.buffPlus = buffPlus;

    /**
     * The percent bonus a note source grants for as long as it is active.
     * @type {RegExp}
     */
    this.buffRate = buffRate;

    /**
     * The flat bonus gained permanently with every level.
     * @type {RegExp}
     */
    this.growthPlus = growthPlus;

    /**
     * The percent bonus gained permanently with every level.
     * @type {RegExp}
     */
    this.growthRate = growthRate;

    /**
     * Resolves the parameter's own value before any natural bonus, in the parameter's own units.<br/>
     * It is asked of every battler, enemies included, because buffs refresh on every battler, so it
     * must answer for a battler that has no real value for the parameter as well as one that does.
     * It must also never read the parameter itself, since that value is what natural bonuses feed.
     * @type {function(Game_Battler): number}
     */
    this.getBase = getBase;
  }
}

export default NaturalParameterBinding;
//endregion NaturalParameterBinding