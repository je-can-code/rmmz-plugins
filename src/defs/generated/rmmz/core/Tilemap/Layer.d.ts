/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap.Layer
 */

declare namespace Tilemap
{
  export interface Layer extends PIXI.Container
  {
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown[]`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#initialize}.
     * Read in: {@link Tilemap.Layer#_updateIndexBuffer}, {@link Tilemap.Layer#_updateVertexBuffer}, {@link Tilemap.Layer#addRect}, {@link Tilemap.Layer#clear}, {@link Tilemap.Layer#render}, {@link Tilemap.Layer#size}.
     *
     * Consumed by:
     * - `.length`: {@link Tilemap.Layer#_updateIndexBuffer}, {@link Tilemap.Layer#_updateVertexBuffer}, {@link Tilemap.Layer#clear}, {@link Tilemap.Layer#render}, {@link Tilemap.Layer#size}.
     * - `push()`: {@link Tilemap.Layer#addRect}.
     */
    _elements: unknown[];
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown[]`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#initialize}, {@link Tilemap.Layer#setBitmaps}.
     * Read in: {@link Tilemap.Layer#isReady}, {@link Tilemap.Layer#render}.
     *
     * Consumed by:
     * - `.length`: {@link Tilemap.Layer#isReady}.
     */
    _images: unknown[];
    /**
     * Inferred engine backing field.
     *
     * Type: `Float32Array`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#_updateIndexBuffer}, {@link Tilemap.Layer#initialize}.
     * Read in: {@link Tilemap.Layer#_updateIndexBuffer}.
     *
     * Consumed by:
     * - `.length`: {@link Tilemap.Layer#_updateIndexBuffer}.
     */
    _indexArray: Float32Array;
    /**
     * Inferred engine backing field.
     *
     * Type: `null`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#_createVao}, {@link Tilemap.Layer#destroy}, {@link Tilemap.Layer#initialize}.
     * Read in: {@link Tilemap.Layer#_createVao}, {@link Tilemap.Layer#_updateIndexBuffer}, {@link Tilemap.Layer#destroy}.
     */
    _indexBuffer: null;
    /**
     * Inferred engine backing field.
     *
     * Type: `boolean`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#initialize}, {@link Tilemap.Layer#render}, {@link Tilemap.Layer#setBitmaps}.
     * Read in: {@link Tilemap.Layer#render}.
     */
    _needsTexturesUpdate: boolean;
    /**
     * Inferred engine backing field.
     *
     * Type: `boolean`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#clear}, {@link Tilemap.Layer#initialize}, {@link Tilemap.Layer#render}.
     * Read in: {@link Tilemap.Layer#render}.
     */
    _needsVertexUpdate: boolean;
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#initialize}.
     * Read in: {@link Tilemap.Layer#render}.
     */
    _state: unknown;
    /**
     * Inferred engine backing field.
     *
     * Type: `null`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#_createVao}, {@link Tilemap.Layer#destroy}, {@link Tilemap.Layer#initialize}.
     * Read in: {@link Tilemap.Layer#destroy}, {@link Tilemap.Layer#render}.
     */
    _vao: null;
    /**
     * Inferred engine backing field.
     *
     * Type: `Float32Array`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#_updateVertexBuffer}, {@link Tilemap.Layer#initialize}.
     * Read in: {@link Tilemap.Layer#_updateVertexBuffer}.
     *
     * Consumed by:
     * - `.length`: {@link Tilemap.Layer#_updateVertexBuffer}.
     */
    _vertexArray: Float32Array;
    /**
     * Inferred engine backing field.
     *
     * Type: `null`.
     * Initialized in: {@link Tilemap.Layer#initialize}.
     * Written in: {@link Tilemap.Layer#_createVao}, {@link Tilemap.Layer#destroy}, {@link Tilemap.Layer#initialize}.
     * Read in: {@link Tilemap.Layer#_updateVertexBuffer}, {@link Tilemap.Layer#destroy}.
     */
    _vertexBuffer: null;
    /**
     * Performs create vao.
     */
    _createVao(): void;
    /**
     * Performs update index buffer.
     */
    _updateIndexBuffer(): void;
    /**
     * Performs update vertex buffer.
     */
    _updateVertexBuffer(): void;
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
    addRect(setNumber: number, sx: number, sy: number, dx: number, dy: number, w: number, h: number): void;
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
     * Performs render.
     * @param renderer The renderer parameter.
     */
    render(renderer: PIXI.Renderer): void;
    /**
     * Sets bitmaps.
     * @param bitmaps The bitmaps parameter.
     */
    setBitmaps(bitmaps: Array<Bitmap | null>): void;
    /**
     * Gets size.
     * @returns The result.
     */
    size(): number;
  }

  export namespace Layer
  {
    /**
     * Engine static constant.
     */
    const MAX_GL_TEXTURES: 3;
    /**
     * Engine static constant.
     */
    const MAX_SIZE: 16000;
  }
}
