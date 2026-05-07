/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Status
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Status
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _profileWindow: Window_Help;
  _statusEquipWindow: Window_StatusEquip;
  _statusParamsWindow: Window_StatusParams;
  _statusWindow: Window_Status;
  create(): void;
  createProfileWindow(): void;
  createStatusEquipWindow(): void;
  createStatusParamsWindow(): void;
  createStatusWindow(): void;
  helpAreaHeight(): number;
  initialize(): void;
  needsPageButtons(): boolean;
  onActorChange(): void;
  profileHeight(): number;
  profileWindowRect(): Rectangle;
  refreshActor(): void;
  start(): void;
  statusEquipWindowRect(): Rectangle;
  statusParamsHeight(): number;
  statusParamsWidth(): number;
  statusParamsWindowRect(): Rectangle;
  statusWindowRect(): Rectangle;
}
