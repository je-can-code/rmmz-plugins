/**
 * Generated from project/js/rmmz_core.js
 * Class: Graphics.FPSCounter
 */

declare namespace Graphics
{
  export interface FPSCounter
  {
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `unknown`.<br/>
     * Initialized in: none.<br/>
     * Written in: {@link Graphics.FPSCounter#_createElements}.<br/>
     * Read in: {@link Graphics.FPSCounter#_createElements}, {@link Graphics.FPSCounter#switchMode}.<br/>
     */
    _boxDiv: unknown;
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `number`.<br/>
     * Initialized in: {@link Graphics.FPSCounter#initialize}.<br/>
     * Written in: {@link Graphics.FPSCounter#initialize}, {@link Graphics.FPSCounter#startTick}.<br/>
     * Read in: {@link Graphics.FPSCounter#endTick}.<br/>
     */
    _frameStart: number;
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `number`.<br/>
     * Initialized in: {@link Graphics.FPSCounter#initialize}.<br/>
     * Written in: {@link Graphics.FPSCounter#endTick}, {@link Graphics.FPSCounter#initialize}.<br/>
     * Read in: {@link Graphics.FPSCounter#endTick}.<br/>
     */
    _frameTime: number;
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `unknown`.<br/>
     * Initialized in: none.<br/>
     * Written in: {@link Graphics.FPSCounter#_createElements}.<br/>
     * Read in: {@link Graphics.FPSCounter#_createElements}, {@link Graphics.FPSCounter#_update}.<br/>
     */
    _labelDiv: unknown;
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `unknown`.<br/>
     * Initialized in: {@link Graphics.FPSCounter#initialize}.<br/>
     * Written in: {@link Graphics.FPSCounter#endTick}, {@link Graphics.FPSCounter#initialize}.<br/>
     * Read in: {@link Graphics.FPSCounter#endTick}.<br/>
     */
    _lastLoop: unknown;
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `unknown`.<br/>
     * Initialized in: none.<br/>
     * Written in: {@link Graphics.FPSCounter#_createElements}.<br/>
     * Read in: {@link Graphics.FPSCounter#_createElements}, {@link Graphics.FPSCounter#_update}.<br/>
     */
    _numberDiv: unknown;
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `boolean`.<br/>
     * Initialized in: {@link Graphics.FPSCounter#initialize}.<br/>
     * Written in: {@link Graphics.FPSCounter#initialize}, {@link Graphics.FPSCounter#switchMode}.<br/>
     * Read in: {@link Graphics.FPSCounter#_update}, {@link Graphics.FPSCounter#switchMode}.<br/>
     */
    _showFps: boolean;
    /**
     * Inferred engine backing field.<br/>
     *<br/>
     * Type: `number`.<br/>
     * Initialized in: {@link Graphics.FPSCounter#initialize}.<br/>
     * Written in: {@link Graphics.FPSCounter#endTick}, {@link Graphics.FPSCounter#initialize}.<br/>
     * Read in: none.<br/>
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
