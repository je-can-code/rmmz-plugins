/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap.Layer
 */

declare namespace Tilemap
{
  export interface Layer
  {
    /**
     * Instance fields inferred from `this._*` assignments across vanilla engine sources.
     */
    _elements: unknown[];
    _images: unknown[];
    _indexArray: Float32Array;
    _indexBuffer: null;
    _needsTexturesUpdate: boolean;
    _needsVertexUpdate: boolean;
    _state: unknown;
    _vao: null;
    _vertexArray: Float32Array;
    _vertexBuffer: null;
    _createVao(): void;
    _updateIndexBuffer(): void;
    _updateVertexBuffer(): void;
    addRect(setNumber: number, sx: number, sy: number, dx: number, dy: number, w: number, h: number): void;
    clear(): void;
    destroy(): void;
    initialize(): void;
    isReady(): boolean;
    render(renderer: PIXI.Renderer): void;
    setBitmaps(bitmaps: Array<Bitmap | null>): void;
    size(): number;
  }
}
