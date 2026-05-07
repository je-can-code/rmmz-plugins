/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Battler
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Battler
{
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#setActionState}.
   * Read in: {@link Game_Battler#isActing}, {@link Game_Battler#isInputting}, {@link Game_Battler#isUndecided}, {@link Game_Battler#isWaiting}.
   */
  _actionState: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#clearActions}, {@link Game_Battler#initMembers}, {@link Game_Battler#makeActions}.
   * Read in: {@link Game_Battler#action}, {@link Game_Battler#currentAction}, {@link Game_Battler#forceAction}, {@link Game_Battler#isChanting}, {@link Game_Battler#isGuardWaiting}, {@link Game_Battler#makeActions}, {@link Game_Battler#makeSpeed}, {@link Game_Battler#numActions}, {@link Game_Battler#removeCurrentAction}, {@link Game_Battler#setAction}, {@link Game_Battler#tpbRequiredCastTime}.
   *
   * Consumed by:
   * - `.length`: {@link Game_Battler#numActions}.
   * - `push()`: {@link Game_Battler#forceAction}, {@link Game_Battler#makeActions}.
   * - `shift()`: {@link Game_Battler#removeCurrentAction}.
   */
  _actions: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#clearDamagePopup}, {@link Game_Battler#initMembers}, {@link Game_Battler#startDamagePopup}.
   * Read in: {@link Game_Battler#isDamagePopupRequested}.
   */
  _damagePopup: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#clearEffect}, {@link Game_Battler#initMembers}, {@link Game_Battler#requestEffect}.
   * Read in: {@link Game_Battler#effectType}, {@link Game_Battler#isEffectRequested}.
   */
  _effectType: null | number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#setLastTarget}.
   * Read in: {@link Game_Battler#forceAction}.
   */
  _lastTargetIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#cancelMotionRefresh}, {@link Game_Battler#clearMotion}, {@link Game_Battler#initMembers}, {@link Game_Battler#requestMotionRefresh}.
   * Read in: {@link Game_Battler#isMotionRefreshRequested}.
   */
  _motionRefresh: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#clearMotion}, {@link Game_Battler#initMembers}, {@link Game_Battler#requestMotion}.
   * Read in: {@link Game_Battler#isMotionRequested}, {@link Game_Battler#motionType}.
   */
  _motionType: null | number;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_ActionResult`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#initMembers}.
   * Read in: {@link Game_Battler#addBuff}, {@link Game_Battler#addDebuff}, {@link Game_Battler#addState}, {@link Game_Battler#clearResult}, {@link Game_Battler#gainHp}, {@link Game_Battler#gainMp}, {@link Game_Battler#gainTp}, {@link Game_Battler#removeBuff}, {@link Game_Battler#removeState}, {@link Game_Battler#result}, {@link Game_Battler#shouldPopupDamage}.
   *
   * Consumed by:
   * - `clear()`: {@link Game_Battler#clearResult}.
   */
  _result: Game_ActionResult;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#deselect}, {@link Game_Battler#initMembers}, {@link Game_Battler#select}.
   * Read in: {@link Game_Battler#isSelected}.
   */
  _selected: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#makeSpeed}.
   * Read in: {@link Game_Battler#speed}.
   */
  _speed: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#startTpbCasting}, {@link Game_Battler#updateTpbCastTime}.
   * Read in: {@link Game_Battler#updateTpbCastTime}.
   */
  _tpbCastTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#applyTpbPenalty}, {@link Game_Battler#clearTpbChargeTime}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbChargeTime}, {@link Game_Battler#updateTpbChargeTime}.
   * Read in: {@link Game_Battler#tpbChargeTime}, {@link Game_Battler#updateTpbChargeTime}.
   */
  _tpbChargeTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#finishTpbCharge}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbTurn}, {@link Game_Battler#onTpbTimeout}, {@link Game_Battler#startTpbTurn}, {@link Game_Battler#updateTpbIdleTime}.
   * Read in: {@link Game_Battler#isTpbTimeout}.
   */
  _tpbIdleTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#applyTpbPenalty}, {@link Game_Battler#clearTpbChargeTime}, {@link Game_Battler#finishTpbCharge}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbChargeTime}, {@link Game_Battler#startTpbAction}, {@link Game_Battler#startTpbCasting}, {@link Game_Battler#updateTpbCastTime}.
   * Read in: {@link Game_Battler#isTpbCharged}, {@link Game_Battler#isTpbReady}, {@link Game_Battler#updateTpbCastTime}, {@link Game_Battler#updateTpbChargeTime}.
   */
  _tpbState: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbTurn}, {@link Game_Battler#startTpbTurn}.
   * Read in: {@link Game_Battler#turnCount}.
   */
  _tpbTurnCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#finishTpbCharge}, {@link Game_Battler#initMembers}, {@link Game_Battler#initTpbTurn}, {@link Game_Battler#onTpbTimeout}, {@link Game_Battler#startTpbTurn}.
   * Read in: {@link Game_Battler#isTpbTurnEnd}.
   */
  _tpbTurnEnd: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Battler#clearWeaponAnimation}, {@link Game_Battler#initMembers}, {@link Game_Battler#startWeaponAnimation}.
   * Read in: {@link Game_Battler#isWeaponAnimationRequested}, {@link Game_Battler#weaponImageId}.
   */
  _weaponImageId: number;
  /**
   * Gets action.
   * @param index The index parameter.
   * @returns The result.
   */
  action(index: number): Game_Action | undefined;
  /**
   * Adds buff.
   * @param paramId The paramId parameter.
   * @param turns The turns parameter.
   */
  addBuff(paramId: number, turns: number): void;
  /**
   * Adds debuff.
   * @param paramId The paramId parameter.
   * @param turns The turns parameter.
   */
  addDebuff(paramId: number, turns: number): void;
  /**
   * Adds state.
   * @param stateId The stateId parameter.
   */
  addState(stateId: number): void;
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
  chargeTpByDamage(damageRate: number): void;
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
  consumeItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Gets current action.
   * @returns The result.
   */
  currentAction(): Game_Action | undefined;
  /**
   * Performs deselect.
   */
  deselect(): void;
  /**
   * Gets effect type.
   * @returns The result.
   */
  effectType(): number;
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
  forceAction(skillId: number, targetIndex: number): void;
  /**
   * Performs gain hp.
   * @param value The value parameter.
   */
  gainHp(value: number): void;
  /**
   * Performs gain mp.
   * @param value The value parameter.
   */
  gainMp(value: number): void;
  /**
   * Performs gain silent tp.
   * @param value The value parameter.
   */
  gainSilentTp(value: number): void;
  /**
   * Performs gain tp.
   * @param value The value parameter.
   */
  gainTp(value: number): void;
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
  initTpbChargeTime(advantageous: boolean): void;
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
  isStateAddable(stateId: number): boolean;
  /**
   * Determines whether state restrict.
   * @param stateId The stateId parameter.
   * @returns True if state restrict; false otherwise.
   */
  isStateRestrict(stateId: number): boolean;
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
  makeActionTimes(): number;
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
  maxSlipDamage(): number;
  /**
   * Gets motion type.
   * @returns The result.
   */
  motionType(): number;
  /**
   * Gets num actions.
   * @returns The result.
   */
  numActions(): number;
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
  onBattleStart(advantageous: boolean): void;
  /**
   * Performs on damage.
   * @param value The value parameter.
   */
  onDamage(value: number): void;
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
  performActionStart(action: Game_Action): void;
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
  removeBuff(paramId: number): void;
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
  removeState(stateId: number): void;
  /**
   * Removes states auto.
   * @param timing The timing parameter.
   */
  removeStatesAuto(timing: number): void;
  /**
   * Removes states by damage.
   */
  removeStatesByDamage(): void;
  /**
   * Performs request effect.
   * @param effectType The effectType parameter.
   */
  requestEffect(effectType: number): void;
  /**
   * Performs request motion.
   * @param motionType The motionType parameter.
   */
  requestMotion(motionType: number): void;
  /**
   * Performs request motion refresh.
   */
  requestMotionRefresh(): void;
  /**
   * Gets result.
   * @returns The result.
   */
  result(): Game_ActionResult;
  /**
   * Performs select.
   */
  select(): void;
  /**
   * Sets action.
   * @param index The index parameter.
   * @param action The action parameter.
   */
  setAction(index: number, action: Game_Action): void;
  /**
   * Sets action state.
   * @param actionState The actionState parameter.
   */
  setActionState(actionState: string): void;
  /**
   * Sets last target.
   * @param target The target parameter.
   */
  setLastTarget(target: Game_Battler): void;
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
  speed(): number;
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
  startWeaponAnimation(weaponImageId: number): void;
  /**
   * Gets tpb acceleration.
   * @returns The result.
   */
  tpbAcceleration(): number;
  /**
   * Gets tpb base speed.
   * @returns The result.
   */
  tpbBaseSpeed(): number;
  /**
   * Gets tpb charge time.
   * @returns The result.
   */
  tpbChargeTime(): number;
  /**
   * Gets tpb relative speed.
   * @returns The result.
   */
  tpbRelativeSpeed(): number;
  /**
   * Gets tpb required cast time.
   * @returns The result.
   */
  tpbRequiredCastTime(): number;
  /**
   * Gets tpb speed.
   * @returns The result.
   */
  tpbSpeed(): number;
  /**
   * Gets turn count.
   * @returns The result.
   */
  turnCount(): number;
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
  useItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Gets weapon image id.
   * @returns The result.
   */
  weaponImageId(): number;
}
