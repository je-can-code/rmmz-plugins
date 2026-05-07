/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap.CombinedLayer
 */

declare namespace Tilemap
{
  export interface CombinedLayer
  {
    addRect(setNumber: number, sx: number, sy: number, dx: number, dy: number, w: number, h: number): void;
    clear(): void;
    destroy(): void;
    initialize(): void;
    isReady(): boolean;
    setBitmaps(bitmaps: Array<Bitmap | null>): void;
    size(): number;
  }
}
