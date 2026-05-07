/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Unit
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Unit
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _inBattle: boolean;
  agility(): number;
  aliveMembers(): Game_Battler[];
  clearActions(): void;
  clearResults(): void;
  deadMembers(): Game_Battler[];
  inBattle(): boolean;
  initialize(): void;
  isAllDead(): boolean;
  makeActions(): void;
  members(): Game_Battler[];
  movableMembers(): Game_Battler[];
  onBattleEnd(): void;
  onBattleStart(advantageous: boolean): void;
  randomDeadTarget(): Game_Battler | null;
  randomTarget(): Game_Battler | null;
  select(activeMember: Game_Battler): void;
  smoothDeadTarget(index: number): Game_Battler | undefined;
  smoothTarget(index: number): Game_Battler | undefined;
  substituteBattler(target: Game_Battler): Game_Battler | null;
  tgrSum(): number;
  tpbBaseSpeed(): number;
  tpbReferenceTime(): number;
  updateTpb(): void;
}
