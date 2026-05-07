/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Switches
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Switches
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _data: unknown[];
  clear(): void;
  initialize(): void;
  onChange(): void;
  setValue(switchId: number, value: boolean): void;
  value(switchId: number): boolean;
}
