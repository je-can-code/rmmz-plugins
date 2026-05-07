/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_ActionResult
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_ActionResult
{
  /**
   * Gets added state objects.
   * @returns The result.
   */
  addedStateObjects(): unknown;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether buff added.
   * @param paramId The paramId parameter.
   * @returns True if buff added; false otherwise.
   */
  isBuffAdded(paramId: unknown): boolean;
  /**
   * Determines whether buff removed.
   * @param paramId The paramId parameter.
   * @returns True if buff removed; false otherwise.
   */
  isBuffRemoved(paramId: unknown): boolean;
  /**
   * Determines whether debuff added.
   * @param paramId The paramId parameter.
   * @returns True if debuff added; false otherwise.
   */
  isDebuffAdded(paramId: unknown): boolean;
  /**
   * Determines whether hit.
   * @returns True if hit; false otherwise.
   */
  isHit(): boolean;
  /**
   * Determines whether state added.
   * @param stateId The stateId parameter.
   * @returns True if state added; false otherwise.
   */
  isStateAdded(stateId: unknown): boolean;
  /**
   * Determines whether state removed.
   * @param stateId The stateId parameter.
   * @returns True if state removed; false otherwise.
   */
  isStateRemoved(stateId: unknown): boolean;
  /**
   * Determines whether status affected.
   * @returns True if status affected; false otherwise.
   */
  isStatusAffected(): boolean;
  /**
   * Performs push added buff.
   * @param paramId The paramId parameter.
   */
  pushAddedBuff(paramId: unknown): void;
  /**
   * Performs push added debuff.
   * @param paramId The paramId parameter.
   */
  pushAddedDebuff(paramId: unknown): void;
  /**
   * Performs push added state.
   * @param stateId The stateId parameter.
   */
  pushAddedState(stateId: unknown): void;
  /**
   * Performs push removed buff.
   * @param paramId The paramId parameter.
   */
  pushRemovedBuff(paramId: unknown): void;
  /**
   * Performs push removed state.
   * @param stateId The stateId parameter.
   */
  pushRemovedState(stateId: unknown): void;
  /**
   * Gets removed state objects.
   * @returns The result.
   */
  removedStateObjects(): unknown;
}
