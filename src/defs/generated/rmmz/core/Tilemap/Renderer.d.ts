/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap.Renderer
 */

declare namespace Tilemap
{
  export interface Renderer
  {
    /**
     * Instance fields inferred from `this._*` assignments across vanilla engine sources.
     */
    _clearBuffer: Uint8Array;
    _images: unknown[];
    _internalTextures: unknown[];
    _shader: null;
    _createInternalTextures(): void;
    _createShader(): PIXI.Shader;
    _destroyInternalTextures(): void;
    bindTextures(renderer: PIXI.Renderer): void;
    contextChange(): void;
    destroy(): void;
    getShader(): PIXI.Shader;
    initialize(renderer: PIXI.Renderer): void;
    updateTextures(renderer: PIXI.Renderer, images: TexImageSource[]): void;
  }
}
