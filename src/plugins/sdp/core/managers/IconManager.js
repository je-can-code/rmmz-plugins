//region IconManager
/**
 * Extend {@link #longParam}.<br>
 * First checks if the paramId was the SDP multiplier before checking others.
 */
J.SDP.Aliased.IconManager.set('longParam', IconManager.longParam)
IconManager.longParam = function(paramId)
{
  switch (paramId)
  {
    case 33:
      return this.sdpMultiplier(); // sdp
    default:
      return J.SDP.Aliased.IconManager.get('longParam')
        .call(this, paramId);
  }
};

/**
 * Gets the icon index for the SDP multiplier.
 * @return {number}
 */
IconManager.sdpMultiplier = function()
{
  return 2229;
};
//endregion IconManager