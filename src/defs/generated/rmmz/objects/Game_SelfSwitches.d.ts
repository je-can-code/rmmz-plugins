/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_SelfSwitches
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_SelfSwitches
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _data: object;
  clear(): void;
  initialize(): void;
  onChange(): void;
  setValue(key: string, value: boolean): void;
  value(key: string): boolean;
}
