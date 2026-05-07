/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_ActionResult
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_ActionResult
{
  addedStateObjects(): RPG_State[];
  clear(): void;
  initialize(): void;
  isBuffAdded(paramId: number): boolean;
  isBuffRemoved(paramId: number): boolean;
  isDebuffAdded(paramId: number): boolean;
  isHit(): boolean;
  isStateAdded(stateId: number): boolean;
  isStateRemoved(stateId: number): boolean;
  isStatusAffected(): boolean;
  pushAddedBuff(paramId: number): void;
  pushAddedDebuff(paramId: number): void;
  pushAddedState(stateId: number): void;
  pushRemovedBuff(paramId: number): void;
  pushRemovedState(stateId: number): void;
  removedStateObjects(): RPG_State[];
}
