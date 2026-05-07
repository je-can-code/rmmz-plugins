/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Battleback
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Battleback extends TilingSprite
{
  /**
   * Performs adjust position.
   */
  adjustPosition(): void;
  /**
   * Gets autotile type.
   * @param z The z parameter.
   * @returns The result.
   */
  autotileType(z: unknown): unknown;
  /**
   * Gets battleback1 bitmap.
   * @returns The result.
   */
  battleback1Bitmap(): unknown;
  /**
   * Gets battleback1 name.
   * @returns The result.
   */
  battleback1Name(): string;
  /**
   * Gets battleback2 bitmap.
   * @returns The result.
   */
  battleback2Bitmap(): unknown;
  /**
   * Gets battleback2 name.
   * @returns The result.
   */
  battleback2Name(): string;
  /**
   * Gets default battleback1 name.
   * @returns The result.
   */
  defaultBattleback1Name(): string;
  /**
   * Gets default battleback2 name.
   * @returns The result.
   */
  defaultBattleback2Name(): string;
  /**
   * Initializes initialize.
   * @param _type The type parameter.
   */
  initialize(_type: unknown): void;
  /**
   * Gets normal battleback1 name.
   * @returns The result.
   */
  normalBattleback1Name(): unknown;
  /**
   * Gets normal battleback2 name.
   * @returns The result.
   */
  normalBattleback2Name(): unknown;
  /**
   * Gets overworld battleback1 name.
   * @returns The result.
   */
  overworldBattleback1Name(): unknown;
  /**
   * Gets overworld battleback2 name.
   * @returns The result.
   */
  overworldBattleback2Name(): unknown;
  /**
   * Gets ship battleback1 name.
   * @returns The result.
   */
  shipBattleback1Name(): string;
  /**
   * Gets ship battleback2 name.
   * @returns The result.
   */
  shipBattleback2Name(): string;
  /**
   * Gets terrain battleback1 name.
   * @param _type The type parameter.
   * @returns The result.
   */
  terrainBattleback1Name(_type: unknown): string | null;
  /**
   * Gets terrain battleback2 name.
   * @param _type The type parameter.
   * @returns The result.
   */
  terrainBattleback2Name(_type: unknown): string;
}
