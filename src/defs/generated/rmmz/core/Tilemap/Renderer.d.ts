/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap.Renderer
 */

declare namespace Tilemap
{
  export interface Renderer
  {
    /**
     * Inferred engine backing field.
     *
     * Type: `Uint8Array`.
     * Initialized in: {@link Tilemap.Renderer#initialize}.
     * Written in: {@link Tilemap.Renderer#initialize}.
     * Read in: {@link Tilemap.Renderer#updateTextures}.
     */
    _clearBuffer: Uint8Array;
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown[]`.
     * Initialized in: {@link Tilemap.Renderer#initialize}.
     * Written in: {@link Tilemap.Renderer#contextChange}, {@link Tilemap.Renderer#initialize}.
     * Read in: none.
     */
    _images: unknown[];
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown[]`.
     * Initialized in: {@link Tilemap.Renderer#initialize}.
     * Written in: {@link Tilemap.Renderer#_destroyInternalTextures}, {@link Tilemap.Renderer#initialize}.
     * Read in: {@link Tilemap.Renderer#_createInternalTextures}, {@link Tilemap.Renderer#_destroyInternalTextures}, {@link Tilemap.Renderer#bindTextures}, {@link Tilemap.Renderer#updateTextures}.
     *
     * Consumed by:
     * - `push()`: {@link Tilemap.Renderer#_createInternalTextures}.
     */
    _internalTextures: unknown[];
    /**
     * Inferred engine backing field.
     *
     * Type: `null`.
     * Initialized in: {@link Tilemap.Renderer#initialize}.
     * Written in: {@link Tilemap.Renderer#contextChange}, {@link Tilemap.Renderer#destroy}, {@link Tilemap.Renderer#initialize}.
     * Read in: {@link Tilemap.Renderer#destroy}, {@link Tilemap.Renderer#getShader}.
     */
    _shader: null;
    /**
     * Performs create internal textures.
     */
    _createInternalTextures(): void;
    /**
     * Gets create shader.
     * @returns The result.
     */
    _createShader(): PIXI.Shader;
    /**
     * Performs destroy internal textures.
     */
    _destroyInternalTextures(): void;
    /**
     * Performs bind textures.
     * @param renderer The renderer parameter.
     */
    bindTextures(renderer: PIXI.Renderer): void;
    /**
     * Performs context change.
     */
    contextChange(): void;
    /**
     * Performs destroy.
     */
    destroy(): void;
    /**
     * Gets shader.
     * @returns The result.
     */
    getShader(): PIXI.Shader;
    /**
     * Initializes initialize.
     * @param renderer The renderer parameter.
     */
    initialize(renderer: PIXI.Renderer): void;
    /**
     * Updates textures.
     * @param renderer The renderer parameter.
     * @param images The images parameter.
     */
    updateTextures(renderer: PIXI.Renderer, images: TexImageSource[]): void;
  }
}
