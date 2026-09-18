//region Spriteset_Map
/**
 * Extends {@link Spriteset_Map.createLowerLayer}.<br/>
 * Also builds the plane that map popups are drawn on.
 */
J.POPUPS.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function()
{
  // perform original logic.
  J.POPUPS.Aliased.Spriteset_Map.get('createLowerLayer')
    .call(this);

  // also build the plane that popups are drawn on.
  this.createPopupPlane();
};

/**
 * Builds the plane that map popups are drawn on.
 *
 * Appended to the spriteset, which is what puts it above everything: above `_baseSprite` and its
 * screen tone, above the caption plane, and above J-Lighting's ambient mask - the mask is inserted
 * at the weather's index plus one, so anything appended afterward is beyond its reach whichever
 * plugin ran first.
 *
 * **A popup is the one readout that is never taken away.** Captions obey the dark deliberately,
 * because a nameplate is something you see and an unlit corner is meant to hide what is in it. A
 * damage number is not that: it is the report of a hit that already landed, and a hit is felt
 * rather than seen. You can tell how hard you connected with something in the dark without being
 * able to make out what you connected with, and a player who cannot tell whether they are
 * connecting at all is not being challenged, only deprived.
 */
Spriteset_Map.prototype.createPopupPlane = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The plane that map popups are drawn on.
   * @type {Sprite}
   */
  this.setPopupPlane(new Sprite());

  this.addChild(this.popupPlane());
};

/**
 * Gets the plane that map popups are drawn on.
 * @returns {Sprite} The popupPlane.
 */
Spriteset_Map.prototype.popupPlane = function()
{
  // hand back the plane the popups are drawn on.
  return this._j._popupPlane;
};

/**
 * Sets the plane that map popups are drawn on.
 * @param {Sprite} newPopupPlane The new popupPlane.
 */
Spriteset_Map.prototype.setPopupPlane = function(newPopupPlane)
{
  // assign the plane the popups are drawn on.
  this._j._popupPlane = newPopupPlane;
};
//endregion Spriteset_Map