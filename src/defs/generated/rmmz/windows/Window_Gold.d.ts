/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Gold
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Gold extends Window_Selectable
{
  /**
   * Gets col spacing.
   * @returns The result.
   */
  colSpacing(): number;
  /**
   * Gets currency unit.
   * @returns The result.
   */
  currencyUnit(): unknown;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Performs open.
   */
  open(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Gets value.
   * @returns The result.
   */
  value(): unknown;
}
