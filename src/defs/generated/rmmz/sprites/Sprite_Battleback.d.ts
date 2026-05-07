/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Battleback
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Battleback
{
  adjustPosition(): void;
  autotileType(z: number): number;
  battleback1Bitmap(): Bitmap;
  battleback1Name(): string;
  battleback2Bitmap(): Bitmap;
  battleback2Name(): string;
  defaultBattleback1Name(): string;
  defaultBattleback2Name(): string;
  initialize(_type: number): void;
  normalBattleback1Name(): string;
  normalBattleback2Name(): string;
  overworldBattleback1Name(): string;
  overworldBattleback2Name(): string;
  shipBattleback1Name(): string;
  shipBattleback2Name(): string;
  terrainBattleback1Name(_type: number): string | null;
  terrainBattleback2Name(_type: number): string;
}
