/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Scrollable
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Scrollable
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#setScrollAccel}, {@link Window_Scrollable#updateScrollAccel}.
   * Read in: {@link Window_Scrollable#updateScrollAccel}.
   */
  _scrollAccelX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#setScrollAccel}, {@link Window_Scrollable#updateScrollAccel}.
   * Read in: {@link Window_Scrollable#updateScrollAccel}.
   */
  _scrollAccelY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_Scrollable#initialize}.
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#updateScrollBase}.
   * Read in: {@link Window_Scrollable#scrollBaseX}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateScrollBase}.
   */
  _scrollBaseX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_Scrollable#initialize}.
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#updateScrollBase}.
   * Read in: {@link Window_Scrollable#scrollBaseY}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateScrollBase}.
   */
  _scrollBaseY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#smoothScrollTo}, {@link Window_Scrollable#updateSmoothScroll}.
   * Read in: {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#updateSmoothScroll}.
   */
  _scrollDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScrollStart}.
   * Read in: {@link Window_Scrollable#onTouchScrollEnd}.
   */
  _scrollLastCursorVisible: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScroll}, {@link Window_Scrollable#onTouchScrollStart}.
   * Read in: {@link Window_Scrollable#onTouchScroll}.
   */
  _scrollLastTouchX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScroll}, {@link Window_Scrollable#onTouchScrollStart}.
   * Read in: {@link Window_Scrollable#onTouchScroll}.
   */
  _scrollLastTouchY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#smoothScrollTo}.
   * Read in: {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#updateSmoothScroll}.
   */
  _scrollTargetX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#smoothScrollTo}.
   * Read in: {@link Window_Scrollable#smoothScrollBy}, {@link Window_Scrollable#updateSmoothScroll}.
   */
  _scrollTargetY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Window_Scrollable#clearScrollStatus}, {@link Window_Scrollable#onTouchScrollEnd}, {@link Window_Scrollable#onTouchScrollStart}.
   * Read in: {@link Window_Scrollable#processTouchScroll}.
   */
  _scrollTouching: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_Scrollable#initialize}.
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#scrollTo}.
   * Read in: {@link Window_Scrollable#scrollBy}, {@link Window_Scrollable#scrollTo}, {@link Window_Scrollable#scrollX}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateSmoothScroll}.
   */
  _scrollX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_Scrollable#initialize}.
   * Written in: {@link Window_Scrollable#initialize}, {@link Window_Scrollable#scrollTo}.
   * Read in: {@link Window_Scrollable#scrollBy}, {@link Window_Scrollable#scrollTo}, {@link Window_Scrollable#scrollY}, {@link Window_Scrollable#updateArrows}, {@link Window_Scrollable#updateOrigin}, {@link Window_Scrollable#updateSmoothScroll}.
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
  initialize(rect: Rectangle): void;
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
  maxScrollX(): number;
  /**
   * Gets max scroll y.
   * @returns The result.
   */
  maxScrollY(): number;
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
  overallHeight(): number;
  /**
   * Gets overall width.
   * @returns The result.
   */
  overallWidth(): number;
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
  scrollBaseX(): number;
  /**
   * Gets scroll base y.
   * @returns The result.
   */
  scrollBaseY(): number;
  /**
   * Gets scroll block height.
   * @returns The result.
   */
  scrollBlockHeight(): number;
  /**
   * Gets scroll block width.
   * @returns The result.
   */
  scrollBlockWidth(): number;
  /**
   * Performs scroll by.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  scrollBy(x: number, y: number): void;
  /**
   * Performs scroll to.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  scrollTo(x: number, y: number): void;
  /**
   * Gets scroll x.
   * @returns The result.
   */
  scrollX(): number;
  /**
   * Gets scroll y.
   * @returns The result.
   */
  scrollY(): number;
  /**
   * Sets scroll accel.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setScrollAccel(x: number, y: number): void;
  /**
   * Performs smooth scroll by.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  smoothScrollBy(x: number, y: number): void;
  /**
   * Performs smooth scroll down.
   * @param n The n parameter.
   */
  smoothScrollDown(n: number): void;
  /**
   * Performs smooth scroll to.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  smoothScrollTo(x: number, y: number): void;
  /**
   * Performs smooth scroll up.
   * @param n The n parameter.
   */
  smoothScrollUp(n: number): void;
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
  updateScrollBase(baseX: number, baseY: number): void;
  /**
   * Updates smooth scroll.
   */
  updateSmoothScroll(): void;
}
