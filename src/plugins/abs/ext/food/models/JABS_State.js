//region JABS_State food extensions
//region resolveExpiryLandingCount
/**
 * Extends {@link JABS_State.prototype.resolveExpiryLandingCount}.<br>
 * Food chains are exempt from RNG. A link of a food chain, a state carrying {@code <foodChain:TYPE>}, lands the next
 * phase its {@code <applyStateOnExpire>} names exactly once as it expires, with no roll at all: the tag's chance, the
 * bearer's State Rate traits and {@code <stateTypeResist>}, the luck between the battler that applied it and its
 * bearer, their lucky and cursed rolls, {@code <veryLucky>} and {@code <veryCursed>}, Accumulate Mode and Encore never
 * weigh on it.
 *
 * Immunity is not chance, so it still stands: the one landing goes through the bearer's own add, which refuses a next
 * phase the bearer cannot take at all. Every other state's follow-up is rolled exactly as J-ABS rolls it.
 * @param {number} nextStateId The id of the follow-up state.
 * @param {number} chance The follow-up's authored chance, as a percent from 0 to 100.
 * @returns {number}
 */
J.ABS.EXT.FOOD.Aliased.JABS_State.set('resolveExpiryLandingCount', JABS_State.prototype.resolveExpiryLandingCount);
JABS_State.prototype.resolveExpiryLandingCount = function(nextStateId, chance)
{
  // a link of a food chain lands its next phase once, with nothing rolled at all.
  if (this.isFoodChainLink()) return 1;

  // perform original logic.
  return J.ABS.EXT.FOOD.Aliased.JABS_State.get('resolveExpiryLandingCount')
    .call(this, nextStateId, chance);
};
//endregion resolveExpiryLandingCount

//region isFoodChainLink
/**
 * Whether this tracked state is a link of a food chain: a state carrying {@code <foodChain:TYPE>}, as its bearer sees
 * it.<br/>
 * The state is read the same way its expiry follow-up is, through the bearer, so the row that names the next phase is
 * the row that decides whether that phase belongs to a food chain.
 * @returns {boolean}
 */
JABS_State.prototype.isFoodChainLink = function()
{
  // the expiring state, as its bearer sees it.
  const stateRow = this.battler.state(this.stateId);

  // every phase of a food chain's arc names the arc it belongs to.
  return stateRow.jabsFoodChainType !== null;
};
//endregion isFoodChainLink
//endregion JABS_State food extensions