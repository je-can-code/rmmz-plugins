/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Save
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Save
{
  executeSave(savefileId: number): void;
  firstSavefileId(): number;
  helpWindowText(): string;
  initialize(): void;
  mode(): string;
  onSaveFailure(): void;
  onSaveSuccess(): void;
  onSavefileOk(): void;
}
