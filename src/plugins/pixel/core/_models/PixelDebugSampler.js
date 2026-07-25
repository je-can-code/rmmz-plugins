//region PixelDebugSampler
/**
 * One-frame collision sampling traces for the pixel collision overlay.
 * Populated by pixel passage helpers and consumed by {@link Sprite_PixelCollisionOverlay}.
 */
class PixelDebugSampler
{
  /**
   * Controls whether subcell samples are collected.
   * Set to true only when the collision overlay is actively visible.
   * @type {boolean}
   */
  static enabled = false;

  /**
   * @type {{x:number,y:number,color:string}[]}
   */
  static samples = [];

  /**
   * Queues a subcell sample to be drawn this frame by the overlay.
   * @param {number} x Fractional tile x (seam-aligned).
   * @param {number} y Fractional tile y (seam-aligned).
   * @param {string} color A rgba color string.
   */
  static push(x, y, color)
  {
    if (PixelDebugSampler.enabled === false)
    {
      return;
    }

    // Append the row to the working collection.
    PixelDebugSampler.samples.push({ x, y, color });
  }

  /**
   * Clears all queued samples at the end of each frame.
   */
  static clear()
  {
    PixelDebugSampler.samples.length = 0;
  }
}

export default PixelDebugSampler;
//endregion PixelDebugSampler