/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ScrollText
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ScrollText extends Window_Base
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_ScrollText#initialize}.
   * Written in: {@link Window_ScrollText#initialize}, {@link Window_ScrollText#startMessage}.
   * Read in: {@link Window_ScrollText#contentsHeight}, {@link Window_ScrollText#updateMessage}.
   */
  _allTextHeight: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_ScrollText#initialize}.
   * Written in: {@link Window_ScrollText#initialize}, {@link Window_ScrollText#startMessage}.
   * Read in: {@link Window_ScrollText#refresh}, {@link Window_ScrollText#updateMessage}.
   */
  _blockHeight: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_ScrollText#initialize}.
   * Written in: {@link Window_ScrollText#initialize}, {@link Window_ScrollText#startMessage}, {@link Window_ScrollText#updateMessage}.
   * Read in: {@link Window_ScrollText#updateMessage}.
   */
  _blockIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_ScrollText#initialize}.
   * Written in: {@link Window_ScrollText#initialize}.
   * Read in: {@link Window_ScrollText#contentsHeight}, {@link Window_ScrollText#startMessage}.
   */
  _maxBitmapHeight: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `Rectangle`.
   * Initialized in: {@link Window_ScrollText#initialize}.
   * Written in: {@link Window_ScrollText#initialize}.
   * Read in: {@link Window_ScrollText#updatePlacement}.
   */
  _reservedRect: Rectangle;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_ScrollText#initialize}.
   * Written in: {@link Window_ScrollText#initialize}, {@link Window_ScrollText#startMessage}, {@link Window_ScrollText#updateMessage}.
   * Read in: {@link Window_ScrollText#refresh}, {@link Window_ScrollText#updateMessage}.
   */
  _scrollY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string | null`.
   * Initialized in: {@link Window_ScrollText#initialize}.
   * Written in: {@link Window_ScrollText#initialize}, {@link Window_ScrollText#startMessage}, {@link Window_ScrollText#terminateMessage}.
   * Read in: {@link Window_ScrollText#refresh}, {@link Window_ScrollText#startMessage}, {@link Window_ScrollText#update}.
   */
  _text: string | null;
  /**
   * Gets contents height.
   * @returns The result.
   */
  contentsHeight(): number;
  /**
   * Gets fast forward rate.
   * @returns The result.
   */
  fastForwardRate(): number;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether fast forward.
   * @returns True if fast forward; false otherwise.
   */
  isFastForward(): boolean;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Gets scroll speed.
   * @returns The result.
   */
  scrollSpeed(): number;
  /**
   * Performs start message.
   */
  startMessage(): void;
  /**
   * Performs terminate message.
   */
  terminateMessage(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates message.
   */
  updateMessage(): void;
  /**
   * Updates placement.
   */
  updatePlacement(): void;
}
