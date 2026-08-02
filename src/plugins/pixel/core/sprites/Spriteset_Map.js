//region Spriteset_Map
import Sprite_PixelCollisionOverlay from './Sprite_PixelCollisionOverlay.js';
import PixelDebugSampler from './../_models/PixelDebugSampler.js';

/**
 * Extends {@link Spriteset_Map.createUpperLayer}.<br/>
 * Creates the PIXEL collision overlay sprite and adds it to the spriteset.
 */
J.PIXEL.Aliased.Spriteset_Map.set("createUpperLayer", Spriteset_Map.prototype.createUpperLayer);
Spriteset_Map.prototype.createUpperLayer = function()
{
  // Perform original createUpperLayer logic.
  // perform original logic.
  J.PIXEL.Aliased.Spriteset_Map.get("createUpperLayer")
    .call(this);

  // Add the PIXEL collision overlay.
  this.createPixelCollisionOverlay();
};

/**
 * Creates the PIXEL collision overlay sprite and adds it as a child.
 */
Spriteset_Map.prototype.createPixelCollisionOverlay = function()
{
  // Ensure the key mapping for toggle exists.
  this.setupPixelOverlayKeymap();

  // Initialize visibility from plugin metadata (defaults to false if not configured).
  const initialVisibility = (J.PIXEL && J.PIXEL.Metadata)
    ? J.PIXEL.Metadata.OverlayInitiallyVisible
    : false;
  this.setPixelOverlayVisible(this.pixelOverlayVisible() || initialVisibility);

  // Keep debug sample collection in sync with initial visibility.
  PixelDebugSampler.enabled = this.pixelOverlayVisible();

  // Create the overlay sprite.
  const overlay = new Sprite_PixelCollisionOverlay();

  // Set initial visibility.
  overlay.visible = this.pixelOverlayVisible();

  this.setPixelCollisionOverlay(overlay);

  // Add to the spriteset on the upper layer.
  this.addChild(overlay);
};

/**
 * Gets the sprite drawing the pixel collision overlay.
 * @returns {Sprite_PixelCollisionOverlay|null}
 */
Spriteset_Map.prototype.pixelCollisionOverlay = function()
{
  return this._pixelCollisionOverlay;
};

/**
 * Sets the sprite drawing the pixel collision overlay.
 * @param {Sprite_PixelCollisionOverlay} overlay The sprite to track.
 */
Spriteset_Map.prototype.setPixelCollisionOverlay = function(overlay)
{
  this._pixelCollisionOverlay = overlay;
};

/**
 * Ensures a key is mapped for toggling the overlay.
 * Uses the backslash key (keyCode 220) by default.
 */
Spriteset_Map.prototype.setupPixelOverlayKeymap = function()
{
  // If no mapping for 'pixelOverlay' exists, add one.
  if (!Input.keyMapper[220])
  {
    // Map the backslash key to a custom symbol.
    Input.keyMapper[220] = "pixelOverlay";
  }
};

/**
 * Extends {@link Spriteset_Map.update}.<br/>
 * Handles toggle input and forwards updates to the overlay.
 */
J.PIXEL.Aliased.Spriteset_Map.set("update", Spriteset_Map.prototype.update);
Spriteset_Map.prototype.update = function()
{
  // Perform original update logic.
  // perform original logic.
  J.PIXEL.Aliased.Spriteset_Map.get("update")
    .call(this);

  // If toggle pressed, flip visibility.
  if (Input.isTriggered("pixelOverlay"))
  {
    // Flip the overlay visibility flag.
    this.setPixelOverlayVisible(!this.pixelOverlayVisible());

    // Apply to the overlay sprite if it exists.
    if (this.pixelCollisionOverlay())
    {
      // Toggle the visibility.
      this.pixelCollisionOverlay().visible = this.pixelOverlayVisible();
    }

    // Sync the debug sample collection to overlay visibility.
    // When the overlay is hidden, no samples need to be pushed, eliminating
    // the per-frame object allocation in all _pixelCheck* probe loops.
    PixelDebugSampler.enabled = this.pixelOverlayVisible();
  }
};

//region properties
/**
 * Gets the pixel overlay visible.
 * @returns {*} The pixelOverlayVisible.
 */
Spriteset_Map.prototype.pixelOverlayVisible = function()
{
  // hand back the pixel overlay visible.
  return this._pixelOverlayVisible;
};

/**
 * Sets the pixel overlay visible.
 * @param {*} newPixelOverlayVisible The new pixelOverlayVisible.
 */
Spriteset_Map.prototype.setPixelOverlayVisible = function(newPixelOverlayVisible)
{
  // assign the pixel overlay visible.
  this._pixelOverlayVisible = newPixelOverlayVisible;
};
//endregion properties
//endregion Spriteset_Map