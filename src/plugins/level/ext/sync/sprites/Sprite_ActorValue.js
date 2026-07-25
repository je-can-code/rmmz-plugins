//region Sprite_ActorValue
if (J.HUD && J.HUD.EXT && J.HUD.EXT.PARTY)
{
  /**
   * Extends {@link #update}.<br/>
   * Each tick, lazily initializes the sync indicator sprite and shows or hides
   * it depending on whether the tracked actor is currently content-synced.
   */
  J.LEVEL.EXT.SYNC.Aliased.Sprite_ActorValue.set('update', Sprite_ActorValue.prototype.update);
  Sprite_ActorValue.prototype.update = function()
  {
    // perform original logic.
    J.LEVEL.EXT.SYNC.Aliased.Sprite_ActorValue.get('update').call(this);

    // only manage the sync icon for the level parameter.
    if (this.getParameter() !== Window_PartyFrame.gaugeTypes.Level) return;

    // ensure the sync icon child sprite exists.
    this.getOrCreateSyncIcon();

    // show or hide based on current sync state.
    if (this.getActor().isContentSynced())
    {
      this._j._syncIconSprite.show();
    }
    else
    {
      this._j._syncIconSprite.hide();
    }
  };

  /**
   * Gets or lazily creates the sync indicator icon child sprite.
   * @returns {Sprite_Icon}
   */
  Sprite_ActorValue.prototype.getOrCreateSyncIcon = function()
  {
    // return cached sprite if it already exists.
    if (this._j._syncIconSprite) return this._j._syncIconSprite;

    // resolve the configured icon index.
    const iconIndex = J.LEVEL.EXT.SYNC.Metadata.syncIndicatorIconIndex;

    // create a new icon sprite for the sync indicator.
    const sprite = new Sprite_Icon(iconIndex);

    // self-manage opacity so the HUD interference handler won't override it.
    sprite.selfManageOpacity();

    // hide immediately; the update loop will show it when synced.
    sprite.hide();

    // cache on the namespaced property block.
    this._j._syncIconSprite = sprite;

    // position the icon just to the left of the level text.
    sprite.x = -ImageManager.iconWidth;

    // stage as a child of this sprite.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  };

  /**
   * Extends {@link #updateBitmapByParameter}.<br/>
   * When the tracked actor is content-synced and we are drawing the level
   * parameter, applies a blue-tinted outline to signal the value is not real.
   * @param {Bitmap} bitmap The bitmap to mutate.
   * @returns {Bitmap}
   */
  J.LEVEL.EXT.SYNC.Aliased.Sprite_ActorValue.set('updateBitmapByParameter', Sprite_ActorValue.prototype.updateBitmapByParameter);
  Sprite_ActorValue.prototype.updateBitmapByParameter = function(bitmap)
  {
    // perform original logic.
    const updatedBitmap = J.LEVEL.EXT.SYNC.Aliased.Sprite_ActorValue.get('updateBitmapByParameter')
      .call(this, bitmap);

    // only decorate the level parameter while content-synced.
    if (this.getParameter() === Window_PartyFrame.gaugeTypes.Level && this.getActor().isContentSynced())
    {
      // override the outline color to signal the level is synced, not real.
      updatedBitmap.outlineColor = 'rgba(64, 128, 192, 1.0)';
    }

    // return the (possibly decorated) bitmap.
    return updatedBitmap;
  };

  /**
   * Extends {@link #getActorValue}.<br/>
   * When the tracked actor is content-synced and we are drawing the level
   * parameter, returns a formatted string showing both the synced level and
   * the actor's real level: e.g. {@code 050 (101)}.
   * @returns {string|number}
   */
  J.LEVEL.EXT.SYNC.Aliased.Sprite_ActorValue.set('getActorValue', Sprite_ActorValue.prototype.getActorValue);
  Sprite_ActorValue.prototype.getActorValue = function()
  {
    // perform original logic.
    const baseValue = J.LEVEL.EXT.SYNC.Aliased.Sprite_ActorValue.get('getActorValue').call(this);

    // only override the level parameter while content-synced.
    if (this.getParameter() !== Window_PartyFrame.gaugeTypes.Level) return baseValue;

    const actor = this.getActor();

    if (actor.isContentSynced() === false) return baseValue;

    // show the synced (effective) level alongside the real level.
    const syncedLevel = actor.getLevel().padZero(3);
    const realLevel = actor._level.padZero(3);

    return `${syncedLevel} (${realLevel})`;
  };
}
//endregion Sprite_ActorValue
