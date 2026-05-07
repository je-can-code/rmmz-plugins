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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link ColorManager#loadWindowskin}.<br/>
   * Read in: {@link ColorManager#pendingColor}, {@link ColorManager#textColor}.<br/>
   */
  _windowskin: unknown;
}
declare function ColorManager(): never;
declare namespace ColorManager
{
  /**
   * Gets crisis color.
   * @returns The result.
   */
  function crisisColor(): number;
  /**
   * Gets ct gauge color1.
   * @returns The result.
   */
  function ctGaugeColor1(): number;
  /**
   * Gets ct gauge color2.
   * @returns The result.
   */
  function ctGaugeColor2(): number;
  /**
   * Gets damage color.
   * @param colorType The colorType parameter.
   * @returns The result.
   */
  function damageColor(colorType: number): string;
  /**
   * Gets death color.
   * @returns The result.
   */
  function deathColor(): number;
  /**
   * Gets dim color1.
   * @returns The result.
   */
  function dimColor1(): string;
  /**
   * Gets dim color2.
   * @returns The result.
   */
  function dimColor2(): string;
  /**
   * Gets gauge back color.
   * @returns The result.
   */
  function gaugeBackColor(): number;
  /**
   * Gets hp color.
   * @param actor The actor parameter.
   * @returns The result.
   */
  function hpColor(actor: Game_Actor): number;
  /**
   * Gets hp gauge color1.
   * @returns The result.
   */
  function hpGaugeColor1(): number;
  /**
   * Gets hp gauge color2.
   * @returns The result.
   */
  function hpGaugeColor2(): number;
  /**
   * Gets item back color1.
   * @returns The result.
   */
  function itemBackColor1(): string;
  /**
   * Gets item back color2.
   * @returns The result.
   */
  function itemBackColor2(): string;
  /**
   * Performs load windowskin.
   */
  function loadWindowskin(): void;
  /**
   * Gets mp color.
   * @returns The result.
   */
  function mpColor(): number;
  /**
   * Gets mp cost color.
   * @returns The result.
   */
  function mpCostColor(): number;
  /**
   * Gets mp gauge color1.
   * @returns The result.
   */
  function mpGaugeColor1(): number;
  /**
   * Gets mp gauge color2.
   * @returns The result.
   */
  function mpGaugeColor2(): number;
  /**
   * Gets normal color.
   * @returns The result.
   */
  function normalColor(): number;
  /**
   * Gets outline color.
   * @returns The result.
   */
  function outlineColor(): string;
  /**
   * Gets paramchange text color.
   * @param change The change parameter.
   * @returns The result.
   */
  function paramchangeTextColor(change: number): number;
  /**
   * Gets pending color.
   * @returns The result.
   */
  function pendingColor(): number;
  /**
   * Gets power down color.
   * @returns The result.
   */
  function powerDownColor(): number;
  /**
   * Gets power up color.
   * @returns The result.
   */
  function powerUpColor(): number;
  /**
   * Gets system color.
   * @returns The result.
   */
  function systemColor(): number;
  /**
   * Gets text color.
   * @param n The n parameter.
   * @returns The result.
   */
  function textColor(n: number): number;
  /**
   * Gets tp color.
   * @returns The result.
   */
  function tpColor(): number;
  /**
   * Gets tp cost color.
   * @returns The result.
   */
  function tpCostColor(): number;
  /**
   * Gets tp gauge color1.
   * @returns The result.
   */
  function tpGaugeColor1(): number;
  /**
   * Gets tp gauge color2.
   * @returns The result.
   */
  function tpGaugeColor2(): number;
}
