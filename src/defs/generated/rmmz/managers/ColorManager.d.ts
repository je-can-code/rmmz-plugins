/**
 * Generated from project/js/rmmz_managers.js
 * Class: ColorManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface ColorManager
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _windowskin: unknown;
}
declare function ColorManager(): never;
declare namespace ColorManager
{
  function crisisColor(): number;
  function ctGaugeColor1(): number;
  function ctGaugeColor2(): number;
  function damageColor(colorType: number): string;
  function deathColor(): number;
  function dimColor1(): string;
  function dimColor2(): string;
  function gaugeBackColor(): number;
  function hpColor(actor: Game_Actor): number;
  function hpGaugeColor1(): number;
  function hpGaugeColor2(): number;
  function itemBackColor1(): string;
  function itemBackColor2(): string;
  function loadWindowskin(): void;
  function mpColor(): number;
  function mpCostColor(): number;
  function mpGaugeColor1(): number;
  function mpGaugeColor2(): number;
  function normalColor(): number;
  function outlineColor(): string;
  function paramchangeTextColor(change: number): number;
  function pendingColor(): number;
  function powerDownColor(): number;
  function powerUpColor(): number;
  function systemColor(): number;
  function textColor(n: number): number;
  function tpColor(): number;
  function tpCostColor(): number;
  function tpGaugeColor1(): number;
  function tpGaugeColor2(): number;
}
