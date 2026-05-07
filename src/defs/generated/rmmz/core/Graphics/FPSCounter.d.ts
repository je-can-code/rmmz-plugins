/**
 * Generated from project/js/rmmz_core.js
 * Class: Graphics.FPSCounter
 */

declare namespace Graphics
{
  export interface FPSCounter
  {
    /**
     * Instance fields inferred from `this._*` assignments across vanilla engine sources.
     */
    _boxDiv: unknown;
    _frameStart: number;
    _frameTime: number;
    _labelDiv: unknown;
    _lastLoop: unknown;
    _numberDiv: unknown;
    _showFps: boolean;
    _tickCount: number;
    _createElements(): void;
    _update(): void;
    endTick(): void;
    initialize(): void;
    startTick(): void;
    switchMode(): void;
  }
}
