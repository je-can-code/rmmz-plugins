/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Battler
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Battler extends Game_BattlerBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#setActionState}.<br/>
   * Read in: {@link Game_Battler#isActing}, {@link Game_Battler#isInputting}, {@link Game_Battler#isUndecided}, {@link Game_Battler#isWaiting}.<br/>
   */
  _actionState: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#clearActions}, {@link Game_Battler#initMembers}, {@link Game_Battler#makeActions}.<br/>
   * Read in: {@link Game_Battler#action}, {@link Game_Battler#currentAction}, {@link Game_Battler#forceAction}, {@link Game_Battler#isChanting}, {@link Game_Battler#isGuardWaiting}, {@link Game_Battler#makeActions}, {@link Game_Battler#makeSpeed}, {@link Game_Battler#numActions}, {@link Game_Battler#removeCurrentAction}, {@link Game_Battler#setAction}, {@link Game_Battler#tpbRequiredCastTime}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Game_Battler#numActions}.<br/>
   * - `push()`: {@link Game_Battler#forceAction}, {@link Game_Battler#makeActions}.<br/>
   * - `shift()`: {@link Game_Battler#removeCurrentAction}.<br/>
   */
  _actions: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#clearDamagePopup}, {@link Game_Battler#initMembers}, {@link Game_Battler#startDamagePopup}.<br/>
   * Read in: {@link Game_Battler#isDamagePopupRequested}.<br/>
   */
  _damagePopup: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#clearEffect}, {@link Game_Battler#initMembers}, {@link Game_Battler#requestEffect}.<br/>
   * Read in: {@link Game_Battler#effectType}, {@link Game_Battler#isEffectRequested}.<br/>
   */
  _effectType: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#setLastTarget}.<br/>
   * Read in: {@link Game_Battler#forceAction}.<br/>
   */
  _lastTargetIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#cancelMotionRefresh}, {@link Game_Battler#clearMotion}, {@link Game_Battler#initMembers}, {@link Game_Battler#requestMotionRefresh}.<br/>
   * Read in: {@link Game_Battler#isMotionRefreshRequested}.<br/>
   */
  _motionRefresh: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#clearMotion}, {@link Game_Battler#initMembers}, {@link Game_Battler#requestMotion}.<br/>
   * Read in: {@link Game_Battler#isMotionRequested}, {@link Game_Battler#motionType}.<br/>
   */
  _motionType: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_ActionResult`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#initMembers}.<br/>
   * Read in: {@link Game_Battler#addBuff}, {@link Game_Battler#addDebuff}, {@link Game_Battler#addState}, {@link Game_Battler#clearResult}, {@link Game_Battler#gainHp}, {@link Game_Battler#gainMp}, {@link Game_Battler#gainTp}, {@link Game_Battler#removeBuff}, {@link Game_Battler#removeState}, {@link Game_Battler#result}, {@link Game_Battler#shouldPopupDamage}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `clear()`: {@link Game_Battler#clearResult}.<br/>
   */
  _result: Game_ActionResult;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#deselect}, {@link Game_Battler#initMembers}, {@link Game_Battler#select}.<br/>
   * Read in: {@link Game_Battler#isSelected}.<br/>
   */
  _selected: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#makeSpeed}.<br/>
   * Read in: {@link Game_Battler#speed}.<br/>
   */
  _speed: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#startTpbCasting}, {@link Game_Battler#updateTpbCastTime}.<br/>
   * Read in: {@link Game_Battler#updateTpbCastTime}.<br/>
   */
  _tpbCastTime: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#applyTpbPenalty}, {@link Game_Battler#clearTpbChargeTime}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbChargeTime}, {@link Game_Battler#updateTpbChargeTime}.<br/>
   * Read in: {@link Game_Battler#tpbChargeTime}, {@link Game_Battler#updateTpbChargeTime}.<br/>
   */
  _tpbChargeTime: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#finishTpbCharge}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbTurn}, {@link Game_Battler#onTpbTimeout}, {@link Game_Battler#startTpbTurn}, {@link Game_Battler#updateTpbIdleTime}.<br/>
   * Read in: {@link Game_Battler#isTpbTimeout}.<br/>
   */
  _tpbIdleTime: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#applyTpbPenalty}, {@link Game_Battler#clearTpbChargeTime}, {@link Game_Battler#finishTpbCharge}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbChargeTime}, {@link Game_Battler#startTpbAction}, {@link Game_Battler#startTpbCasting}, {@link Game_Battler#updateTpbCastTime}.<br/>
   * Read in: {@link Game_Battler#isTpbCharged}, {@link Game_Battler#isTpbReady}, {@link Game_Battler#updateTpbCastTime}, {@link Game_Battler#updateTpbChargeTime}.<br/>
   */
  _tpbState: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbTurn}, {@link Game_Battler#startTpbTurn}.<br/>
   * Read in: {@link Game_Battler#turnCount}.<br/>
   */
  _tpbTurnCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#finishTpbCharge}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbTurn}, {@link Game_Battler#onTpbTimeout}, {@link Game_Battler#startTpbTurn}.<br/>
   * Read in: {@link Game_Battler#isTpbTurnEnd}.<br/>
   */
  _tpbTurnEnd: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Battler#clearWeaponAnimation}, {@link Game_Battler#initMembers}, {@link Game_Battler#startWeaponAnimation}.<br/>
   * Read in: {@link Game_Battler#isWeaponAnimationRequested}, {@link Game_Battler#weaponImageId}.<br/>
   */
  _weaponImageId: number;
  /**
   * Gets action.
   * @param index The index parameter.
   * @returns The result.
   */
  action(index: unknown): unknown;
  /**
   * Adds buff.
   * @param paramId The paramId parameter.
   * @param turns The turns parameter.
   */
  addBuff(paramId: unknown, turns: unknown): void;
  /**
   * Adds debuff.
   * @param paramId The paramId parameter.
   * @param turns The turns parameter.
   */
  addDebuff(paramId: unknown, turns: unknown): void;
  /**
   * Adds state.
   * @param stateId The stateId parameter.
   */
  addState(stateId: unknown): void;
  /**
   * Performs apply tpb penalty.
   */
  applyTpbPenalty(): void;
  /**
   * Determines whether input.
   * @returns True if input; false otherwise.
   */
  canInput(): boolean;
  /**
   * Performs cancel motion refresh.
   */
  cancelMotionRefresh(): void;
  /**
   * Performs charge tp by damage.
   * @param damageRate The damageRate parameter.
   */
  chargeTpByDamage(damageRate: unknown): void;
  /**
   * Clears actions.
   */
  clearActions(): void;
  /**
   * Clears damage popup.
   */
  clearDamagePopup(): void;
  /**
   * Clears effect.
   */
  clearEffect(): void;
  /**
   * Clears motion.
   */
  clearMotion(): void;
  /**
   * Clears result.
   */
  clearResult(): void;
  /**
   * Clears tp.
   */
  clearTp(): void;
  /**
   * Clears tpb charge time.
   */
  clearTpbChargeTime(): void;
  /**
   * Clears weapon animation.
   */
  clearWeaponAnimation(): void;
  /**
   * Performs consume item.
   * @param item The item parameter.
   */
  consumeItem(item: unknown): void;
  /**
   * Gets current action.
   * @returns The result.
   */
  currentAction(): unknown;
  /**
   * Performs deselect.
   */
  deselect(): void;
  /**
   * Gets effect type.
   * @returns The result.
   */
  effectType(): unknown;
  /**
   * Performs escape.
   */
  escape(): void;
  /**
   * Performs finish tpb charge.
   */
  finishTpbCharge(): void;
  /**
   * Performs force action.
   * @param skillId The skillId parameter.
   * @param targetIndex The targetIndex parameter.
   */
  forceAction(skillId: unknown, targetIndex: unknown): void;
  /**
   * Performs gain hp.
   * @param value The value parameter.
   */
  gainHp(value: unknown): void;
  /**
   * Performs gain mp.
   * @param value The value parameter.
   */
  gainMp(value: unknown): void;
  /**
   * Performs gain silent tp.
   * @param value The value parameter.
   */
  gainSilentTp(value: unknown): void;
  /**
   * Performs gain tp.
   * @param value The value parameter.
   */
  gainTp(value: unknown): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes tp.
   */
  initTp(): void;
  /**
   * Initializes tpb charge time.
   * @param advantageous The advantageous parameter.
   */
  initTpbChargeTime(advantageous: unknown): void;
  /**
   * Initializes tpb turn.
   */
  initTpbTurn(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether acting.
   * @returns True if acting; false otherwise.
   */
  isActing(): boolean;
  /**
   * Determines whether chanting.
   * @returns True if chanting; false otherwise.
   */
  isChanting(): boolean;
  /**
   * Determines whether damage popup requested.
   * @returns True if damage popup requested; false otherwise.
   */
  isDamagePopupRequested(): boolean;
  /**
   * Determines whether effect requested.
   * @returns True if effect requested; false otherwise.
   */
  isEffectRequested(): boolean;
  /**
   * Determines whether guard waiting.
   * @returns True if guard waiting; false otherwise.
   */
  isGuardWaiting(): boolean;
  /**
   * Determines whether inputting.
   * @returns True if inputting; false otherwise.
   */
  isInputting(): boolean;
  /**
   * Determines whether motion refresh requested.
   * @returns True if motion refresh requested; false otherwise.
   */
  isMotionRefreshRequested(): boolean;
  /**
   * Determines whether motion requested.
   * @returns True if motion requested; false otherwise.
   */
  isMotionRequested(): boolean;
  /**
   * Determines whether selected.
   * @returns True if selected; false otherwise.
   */
  isSelected(): boolean;
  /**
   * Determines whether state addable.
   * @param stateId The stateId parameter.
   * @returns True if state addable; false otherwise.
   */
  isStateAddable(stateId: unknown): boolean;
  /**
   * Determines whether state restrict.
   * @param stateId The stateId parameter.
   * @returns True if state restrict; false otherwise.
   */
  isStateRestrict(stateId: unknown): boolean;
  /**
   * Determines whether tpb charged.
   * @returns True if tpb charged; false otherwise.
   */
  isTpbCharged(): boolean;
  /**
   * Determines whether tpb ready.
   * @returns True if tpb ready; false otherwise.
   */
  isTpbReady(): boolean;
  /**
   * Determines whether tpb timeout.
   * @returns True if tpb timeout; false otherwise.
   */
  isTpbTimeout(): boolean;
  /**
   * Determines whether tpb turn end.
   * @returns True if tpb turn end; false otherwise.
   */
  isTpbTurnEnd(): boolean;
  /**
   * Determines whether undecided.
   * @returns True if undecided; false otherwise.
   */
  isUndecided(): boolean;
  /**
   * Determines whether waiting.
   * @returns True if waiting; false otherwise.
   */
  isWaiting(): boolean;
  /**
   * Determines whether weapon animation requested.
   * @returns True if weapon animation requested; false otherwise.
   */
  isWeaponAnimationRequested(): boolean;
  /**
   * Creates action times.
   * @returns The result.
   */
  makeActionTimes(): unknown;
  /**
   * Creates actions.
   */
  makeActions(): void;
  /**
   * Creates speed.
   */
  makeSpeed(): void;
  /**
   * Creates tpb actions.
   */
  makeTpbActions(): void;
  /**
   * Gets max slip damage.
   * @returns The result.
   */
  maxSlipDamage(): unknown;
  /**
   * Gets motion type.
   * @returns The result.
   */
  motionType(): unknown;
  /**
   * Gets num actions.
   * @returns The result.
   */
  numActions(): unknown;
  /**
   * Performs on all actions end.
   */
  onAllActionsEnd(): void;
  /**
   * Performs on battle end.
   */
  onBattleEnd(): void;
  /**
   * Performs on battle start.
   * @param advantageous The advantageous parameter.
   */
  onBattleStart(advantageous: unknown): void;
  /**
   * Performs on damage.
   * @param value The value parameter.
   */
  onDamage(value: unknown): void;
  /**
   * Performs on restrict.
   */
  onRestrict(): void;
  /**
   * Performs on tpb charged.
   */
  onTpbCharged(): void;
  /**
   * Performs on tpb timeout.
   */
  onTpbTimeout(): void;
  /**
   * Performs on turn end.
   */
  onTurnEnd(): void;
  /**
   * Performs perform action.
   */
  performAction(): void;
  /**
   * Performs perform action end.
   */
  performActionEnd(): void;
  /**
   * Performs perform action start.
   * @param action The action parameter.
   */
  performActionStart(action: unknown): void;
  /**
   * Performs perform collapse.
   */
  performCollapse(): void;
  /**
   * Performs perform counter.
   */
  performCounter(): void;
  /**
   * Performs perform damage.
   */
  performDamage(): void;
  /**
   * Performs perform evasion.
   */
  performEvasion(): void;
  /**
   * Performs perform magic evasion.
   */
  performMagicEvasion(): void;
  /**
   * Performs perform miss.
   */
  performMiss(): void;
  /**
   * Performs perform recovery.
   */
  performRecovery(): void;
  /**
   * Performs perform reflection.
   */
  performReflection(): void;
  /**
   * Performs perform substitute.
   */
  performSubstitute(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs regenerate all.
   */
  regenerateAll(): void;
  /**
   * Performs regenerate hp.
   */
  regenerateHp(): void;
  /**
   * Performs regenerate mp.
   */
  regenerateMp(): void;
  /**
   * Performs regenerate tp.
   */
  regenerateTp(): void;
  /**
   * Removes all buffs.
   */
  removeAllBuffs(): void;
  /**
   * Removes battle states.
   */
  removeBattleStates(): void;
  /**
   * Removes buff.
   * @param paramId The paramId parameter.
   */
  removeBuff(paramId: unknown): void;
  /**
   * Removes buffs auto.
   */
  removeBuffsAuto(): void;
  /**
   * Removes current action.
   */
  removeCurrentAction(): void;
  /**
   * Removes state.
   * @param stateId The stateId parameter.
   */
  removeState(stateId: unknown): void;
  /**
   * Removes states auto.
   * @param timing The timing parameter.
   */
  removeStatesAuto(timing: unknown): void;
  /**
   * Removes states by damage.
   */
  removeStatesByDamage(): void;
  /**
   * Performs request effect.
   * @param effectType The effectType parameter.
   */
  requestEffect(effectType: unknown): void;
  /**
   * Performs request motion.
   * @param motionType The motionType parameter.
   */
  requestMotion(motionType: unknown): void;
  /**
   * Performs request motion refresh.
   */
  requestMotionRefresh(): void;
  /**
   * Gets result.
   * @returns The result.
   */
  result(): unknown;
  /**
   * Performs select.
   */
  select(): void;
  /**
   * Sets action.
   * @param index The index parameter.
   * @param action The action parameter.
   */
  setAction(index: unknown, action: unknown): void;
  /**
   * Sets action state.
   * @param actionState The actionState parameter.
   */
  setActionState(actionState: unknown): void;
  /**
   * Sets last target.
   * @param target The target parameter.
   */
  setLastTarget(target: unknown): void;
  /**
   * Gets should delay tpb charge.
   * @returns The result.
   */
  shouldDelayTpbCharge(): boolean;
  /**
   * Gets should popup damage.
   * @returns The result.
   */
  shouldPopupDamage(): boolean;
  /**
   * Gets speed.
   * @returns The result.
   */
  speed(): unknown;
  /**
   * Performs start damage popup.
   */
  startDamagePopup(): void;
  /**
   * Performs start tpb action.
   */
  startTpbAction(): void;
  /**
   * Performs start tpb casting.
   */
  startTpbCasting(): void;
  /**
   * Performs start tpb turn.
   */
  startTpbTurn(): void;
  /**
   * Performs start weapon animation.
   * @param weaponImageId The weaponImageId parameter.
   */
  startWeaponAnimation(weaponImageId: unknown): void;
  /**
   * Gets tpb acceleration.
   * @returns The result.
   */
  tpbAcceleration(): unknown;
  /**
   * Gets tpb base speed.
   * @returns The result.
   */
  tpbBaseSpeed(): unknown;
  /**
   * Gets tpb charge time.
   * @returns The result.
   */
  tpbChargeTime(): unknown;
  /**
   * Gets tpb relative speed.
   * @returns The result.
   */
  tpbRelativeSpeed(): unknown;
  /**
   * Gets tpb required cast time.
   * @returns The result.
   */
  tpbRequiredCastTime(): unknown;
  /**
   * Gets tpb speed.
   * @returns The result.
   */
  tpbSpeed(): unknown;
  /**
   * Gets turn count.
   * @returns The result.
   */
  turnCount(): unknown;
  /**
   * Updates tpb.
   */
  updateTpb(): void;
  /**
   * Updates tpb auto battle.
   */
  updateTpbAutoBattle(): void;
  /**
   * Updates tpb cast time.
   */
  updateTpbCastTime(): void;
  /**
   * Updates tpb charge time.
   */
  updateTpbChargeTime(): void;
  /**
   * Updates tpb idle time.
   */
  updateTpbIdleTime(): void;
  /**
   * Performs use item.
   * @param item The item parameter.
   */
  useItem(item: unknown): void;
  /**
   * Gets weapon image id.
   * @returns The result.
   */
  weaponImageId(): unknown;
}
