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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _scrollAccelX: number;
  _scrollAccelY: number;
  _scrollBaseX: number;
  _scrollBaseY: number;
  _scrollDuration: number;
  _scrollLastCursorVisible: boolean;
  _scrollLastTouchX: number;
  _scrollLastTouchY: number;
  _scrollTargetX: number;
  _scrollTargetY: number;
  _scrollTouching: boolean;
  _scrollX: number;
  _scrollY: number;
  clearScrollStatus(): void;
  initialize(rect: Rectangle): void;
  isScrollEnabled(): boolean;
  isTouchScrollEnabled(): boolean;
  isTouchedInsideFrame(): boolean;
  isWheelScrollEnabled(): boolean;
  maxScrollX(): number;
  maxScrollY(): number;
  onTouchScroll(): void;
  onTouchScrollEnd(): void;
  onTouchScrollStart(): void;
  overallHeight(): number;
  overallWidth(): number;
  paint(): void;
  processTouchScroll(): void;
  processWheelScroll(): void;
  scrollBaseX(): number;
  scrollBaseY(): number;
  scrollBlockHeight(): number;
  scrollBlockWidth(): number;
  scrollBy(x: number, y: number): void;
  scrollTo(x: number, y: number): void;
  scrollX(): number;
  scrollY(): number;
  setScrollAccel(x: number, y: number): void;
  smoothScrollBy(x: number, y: number): void;
  smoothScrollDown(n: number): void;
  smoothScrollTo(x: number, y: number): void;
  smoothScrollUp(n: number): void;
  update(): void;
  updateArrows(): void;
  updateOrigin(): void;
  updateScrollAccel(): void;
  updateScrollBase(baseX: number, baseY: number): void;
  updateSmoothScroll(): void;
}
