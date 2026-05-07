/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Scrollable
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Scrollable extends Window_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#setScrollAccel}, {@link Window_Scrollable#updateScrollAccel}.<br/>
   * Read in: {@link Window_Scrollable#updateScrollAccel}.<br/>
   */
  _scrollAccelX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#setScrollAccel}, {@link Window_Scrollable#updateScrollAccel}.<br/>
   * Read in: {@link Window_Scrollable#updateScrollAccel}.<br/>
   */
  _scrollAccelY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_Scrollable#initialize}.<br/>
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#updateScrollBase}.<br/>
   * Read in: {@link Window_Scrollable#scrollBaseX}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateScrollBase}.<br/>
   */
  _scrollBaseX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_Scrollable#initialize}.<br/>
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#updateScrollBase}.<br/>
   * Read in: {@link Window_Scrollable#scrollBaseY}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateScrollBase}.<br/>
   */
  _scrollBaseY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#smoothScrollTo}, {@link Window_Scrollable#updateSmoothScroll}.<br/>
   * Read in: {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#updateSmoothScroll}.<br/>
   */
  _scrollDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScrollStart}.<br/>
   * Read in: {@link Window_Scrollable#onTouchScrollEnd}.<br/>
   */
  _scrollLastCursorVisible: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScroll}, {@link Window_Scrollable#onTouchScrollStart}.<br/>
   * Read in: {@link Window_Scrollable#onTouchScroll}.<br/>
   */
  _scrollLastTouchX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScroll}, {@link Window_Scrollable#onTouchScrollStart}.<br/>
   * Read in: {@link Window_Scrollable#onTouchScroll}.<br/>
   */
  _scrollLastTouchY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#smoothScrollTo}.<br/>
   * Read in: {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#updateSmoothScroll}.<br/>
   */
  _scrollTargetX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#smoothScrollTo}.<br/>
   * Read in: {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#updateSmoothScroll}.<br/>
   */
  _scrollTargetY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScrollEnd}, {@link Window_Scrollable#onTouchScrollStart}.<br/>
   * Read in: {@link Window_Scrollable#processTouchScroll}.<br/>
   */
  _scrollTouching: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_Scrollable#initialize}.<br/>
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#scrollTo}.<br/>
   * Read in: {@link Window_Scrollable#scrollBy}, {@link Window_Scrollable#scrollTo}, {@link Window_Scrollable#scrollX}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateSmoothScroll}.<br/>
   */
  _scrollX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_Scrollable#initialize}.<br/>
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#scrollTo}.<br/>
   * Read in: {@link Window_Scrollable#scrollBy}, {@link Window_Scrollable#scrollTo}, {@link Window_Scrollable#scrollY}, {@link Window_Scrollable#updateArrows}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateSmoothScroll}.<br/>
   */
  _scrollY: number;
  /**
   * Clears scroll status.
   */
  clearScrollStatus(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether scroll enabled.
   * @returns True if scroll enabled; false otherwise.
   */
  isScrollEnabled(): boolean;
  /**
   * Determines whether touch scroll enabled.
   * @returns True if touch scroll enabled; false otherwise.
   */
  isTouchScrollEnabled(): boolean;
  /**
   * Determines whether touched inside frame.
   * @returns True if touched inside frame; false otherwise.
   */
  isTouchedInsideFrame(): boolean;
  /**
   * Determines whether wheel scroll enabled.
   * @returns True if wheel scroll enabled; false otherwise.
   */
  isWheelScrollEnabled(): boolean;
  /**
   * Gets max scroll x.
   * @returns The result.
   */
  maxScrollX(): unknown;
  /**
   * Gets max scroll y.
   * @returns The result.
   */
  maxScrollY(): unknown;
  /**
   * Performs on touch scroll.
   */
  onTouchScroll(): void;
  /**
   * Performs on touch scroll end.
   */
  onTouchScrollEnd(): void;
  /**
   * Performs on touch scroll start.
   */
  onTouchScrollStart(): void;
  /**
   * Gets overall height.
   * @returns The result.
   */
  overallHeight(): unknown;
  /**
   * Gets overall width.
   * @returns The result.
   */
  overallWidth(): unknown;
  /**
   * Performs paint.
   */
  paint(): void;
  /**
   * Performs process touch scroll.
   */
  processTouchScroll(): void;
  /**
   * Performs process wheel scroll.
   */
  processWheelScroll(): void;
  /**
   * Gets scroll base x.
   * @returns The result.
   */
  scrollBaseX(): unknown;
  /**
   * Gets scroll base y.
   * @returns The result.
   */
  scrollBaseY(): unknown;
  /**
   * Gets scroll block height.
   * @returns The result.
   */
  scrollBlockHeight(): unknown;
  /**
   * Gets scroll block width.
   * @returns The result.
   */
  scrollBlockWidth(): unknown;
  /**
   * Performs scroll by.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  scrollBy(x: unknown, y: unknown): void;
  /**
   * Performs scroll to.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  scrollTo(x: unknown, y: unknown): void;
  /**
   * Gets scroll x.
   * @returns The result.
   */
  scrollX(): unknown;
  /**
   * Gets scroll y.
   * @returns The result.
   */
  scrollY(): unknown;
  /**
   * Sets scroll accel.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setScrollAccel(x: unknown, y: unknown): void;
  /**
   * Performs smooth scroll by.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  smoothScrollBy(x: unknown, y: unknown): void;
  /**
   * Performs smooth scroll down.
   * @param n The n parameter.
   */
  smoothScrollDown(n: unknown): void;
  /**
   * Performs smooth scroll to.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  smoothScrollTo(x: unknown, y: unknown): void;
  /**
   * Performs smooth scroll up.
   * @param n The n parameter.
   */
  smoothScrollUp(n: unknown): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates arrows.
   */
  updateArrows(): void;
  /**
   * Updates origin.
   */
  updateOrigin(): void;
  /**
   * Updates scroll accel.
   */
  updateScrollAccel(): void;
  /**
   * Updates scroll base.
   * @param baseX The baseX parameter.
   * @param baseY The baseY parameter.
   */
  updateScrollBase(baseX: unknown, baseY: unknown): void;
  /**
   * Updates smooth scroll.
   */
  updateSmoothScroll(): void;
}
