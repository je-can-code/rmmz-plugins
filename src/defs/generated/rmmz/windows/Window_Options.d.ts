/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Options
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Options
{
  addGeneralOptions(): void;
  addVolumeOptions(): void;
  booleanStatusText(value: boolean): string;
  changeValue(_symbol: string, value: boolean | number): void;
  changeVolume(_symbol: string, forward: boolean, wrap: boolean): void;
  cursorLeft(): void;
  cursorRight(): void;
  drawItem(index: number): void;
  getConfigValue(_symbol: string): boolean | number;
  initialize(rect: Rectangle): void;
  isVolumeSymbol(_symbol: string): boolean;
  makeCommandList(): void;
  processOk(): void;
  setConfigValue(_symbol: string, volume: boolean | number): void;
  statusText(index: number): string;
  statusWidth(): number;
  volumeOffset(): number;
  volumeStatusText(value: number): string;
}
