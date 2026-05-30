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
  this._pixelOverlayVisible = this._pixelOverlayVisible || initialVisibility;

  // Keep debug sample collection in sync with initial visibility.
  PixelDebugSampler.enabled = this._pixelOverlayVisible;

  // Create the overlay sprite.
  this._pixelCollisionOverlay = new Sprite_PixelCollisionOverlay();

  // Set initial visibility.
  this._pixelCollisionOverlay.visible = this._pixelOverlayVisible;

  // Add to the spriteset on the upper layer.
  this.addChild(this._pixelCollisionOverlay);
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
    this._pixelOverlayVisible = !this._pixelOverlayVisible;

    // Apply to the overlay sprite if it exists.
    if (this._pixelCollisionOverlay)
    {
      // Toggle the visibility.
      this._pixelCollisionOverlay.visible = this._pixelOverlayVisible;
    }

    // Sync the debug sample collection to overlay visibility.
    // When the overlay is hidden, no samples need to be pushed, eliminating
    // the per-frame object allocation in all _pixelCheck* probe loops.
    PixelDebugSampler.enabled = this._pixelOverlayVisible;
  }
};
//endregion Spriteset_Map