/**
 * Generated from project/js/rmmz_core.js
 * Class: Graphics.FPSCounter
 */

declare namespace Graphics
{
  export interface FPSCounter
  {
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown`.
     * Initialized in: none.
     * Written in: {@link Graphics.FPSCounter#_createElements}.
     * Read in: {@link Graphics.FPSCounter#_createElements}, {@link Graphics.FPSCounter#switchMode}.
     */
    _boxDiv: unknown;
    /**
     * Inferred engine backing field.
     *
     * Type: `number`.
     * Initialized in: {@link Graphics.FPSCounter#initialize}.
     * Written in: {@link Graphics.FPSCounter#initialize}, {@link Graphics.FPSCounter#startTick}.
     * Read in: {@link Graphics.FPSCounter#endTick}.
     */
    _frameStart: number;
    /**
     * Inferred engine backing field.
     *
     * Type: `number`.
     * Initialized in: {@link Graphics.FPSCounter#initialize}.
     * Written in: {@link Graphics.FPSCounter#endTick}, {@link Graphics.FPSCounter#initialize}.
     * Read in: {@link Graphics.FPSCounter#endTick}.
     */
    _frameTime: number;
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown`.
     * Initialized in: none.
     * Written in: {@link Graphics.FPSCounter#_createElements}.
     * Read in: {@link Graphics.FPSCounter#_createElements}, {@link Graphics.FPSCounter#_update}.
     */
    _labelDiv: unknown;
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown`.
     * Initialized in: {@link Graphics.FPSCounter#initialize}.
     * Written in: {@link Graphics.FPSCounter#endTick}, {@link Graphics.FPSCounter#initialize}.
     * Read in: {@link Graphics.FPSCounter#endTick}.
     */
    _lastLoop: unknown;
    /**
     * Inferred engine backing field.
     *
     * Type: `unknown`.
     * Initialized in: none.
     * Written in: {@link Graphics.FPSCounter#_createElements}.
     * Read in: {@link Graphics.FPSCounter#_createElements}, {@link Graphics.FPSCounter#_update}.
     */
    _numberDiv: unknown;
    /**
     * Inferred engine backing field.
     *
     * Type: `boolean`.
     * Initialized in: {@link Graphics.FPSCounter#initialize}.
     * Written in: {@link Graphics.FPSCounter#initialize}, {@link Graphics.FPSCounter#switchMode}.
     * Read in: {@link Graphics.FPSCounter#_update}, {@link Graphics.FPSCounter#switchMode}.
     */
    _showFps: boolean;
    /**
     * Inferred engine backing field.
     *
     * Type: `number`.
     * Initialized in: {@link Graphics.FPSCounter#initialize}.
     * Written in: {@link Graphics.FPSCounter#endTick}, {@link Graphics.FPSCounter#initialize}.
     * Read in: none.
     */
    _tickCount: number;
    /**
     * Performs create elements.
     */
    _createElements(): void;
    /**
     * Performs update.
     */
    _update(): void;
    /**
     * Performs end tick.
     */
    endTick(): void;
    /**
     * Initializes initialize.
     */
    initialize(): void;
    /**
     * Performs start tick.
     */
    startTick(): void;
    /**
     * Performs switch mode.
     */
    switchMode(): void;
  }
}
