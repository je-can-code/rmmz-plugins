/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap.CombinedLayer
 */

declare namespace Tilemap
{
  export interface CombinedLayer extends PIXI.Container
  {
    /**
     * Adds rect.
     * @param setNumber The setNumber parameter.
     * @param sx The sx parameter.
     * @param sy The sy parameter.
     * @param dx The dx parameter.
     * @param dy The dy parameter.
     * @param w The w parameter.
     * @param h The h parameter.
     */
    addRect(setNumber: unknown, sx: unknown, sy: unknown, dx: unknown, dy: unknown, w: unknown, h: unknown): void;
    /**
     * Performs clear.
     */
    clear(): void;
    /**
     * Performs destroy.
     */
    destroy(): void;
    /**
     * Initializes initialize.
     */
    initialize(): void;
    /**
     * Determines whether ready.
     * @returns True if ready; false otherwise.
     */
    isReady(): boolean;
    /**
     * Sets bitmaps.
     * @param bitmaps The bitmaps parameter.
     */
    setBitmaps(bitmaps: unknown): void;
    /**
     * Gets size.
     * @returns The result.
     */
    size(): unknown;
  }
}
