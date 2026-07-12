//region plugins/time/jabs-input-adapter-and-controller-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from './fixtures/install-time-host-globals.js';

/**
 * Direct-import counterpart to jabs-input-adapter.test.js and jabs-input-controller.test.js. See
 * event-page-and-choice-conditionals-direct.test.js for the full explanation of why direct import is used
 * here instead of vm.Script bundle evaluation.
 */
describe('J-TIME JABS_InputAdapter + JABS_StandardController time window action (direct src import)', () =>
{
  let Game_Time;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../src/plugins/time/core/_models/Game_Time.js'));

    // patches globalThis.JABS_InputAdapter directly, no vm involved.
    await import('../../../src/plugins/time/core/managers/JABS_InputAdapter.js');

    // patches globalThis.JABS_StandardController.prototype directly, no vm involved.
    await import('../../../src/plugins/time/core/objects/JABS_InputController.js');

    globalThis.$gameTime = new Game_Time();
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  it('JABS_InputAdapter.performTimeWindowAction toggles the time window when allowed', () =>
  {
    const startingVisibility = globalThis.$gameTime.isMapWindowVisible();

    globalThis.JABS_InputAdapter.performTimeWindowAction();

    expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
  });

  it('JABS_InputAdapter._canPerformTimeWindowAction currently always allows the toggle', () =>
  {
    expect(globalThis.JABS_InputAdapter._canPerformTimeWindowAction()).toBe(true);
  });

  it('isTimeWindowActionTriggered reflects the L3 input state', () =>
  {
    const controller = new globalThis.JABS_StandardController();

    globalThis.Input.isTriggered = () => false;
    expect(controller.isTimeWindowActionTriggered()).toBe(false);

    globalThis.Input.isTriggered = symbol => symbol === globalThis.J.ABS.EXT.INPUT.Symbols.L3;
    expect(controller.isTimeWindowActionTriggered()).toBe(true);
  });

  it('performTimeWindowAction delegates to JABS_InputAdapter', () =>
  {
    const controller = new globalThis.JABS_StandardController();
    const startingVisibility = globalThis.$gameTime.isMapWindowVisible();

    controller.performTimeWindowAction();

    expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
  });

  it('updateTimeWindowAction only performs the action when triggered', () =>
  {
    const controller = new globalThis.JABS_StandardController();
    const startingVisibility = globalThis.$gameTime.isMapWindowVisible();

    globalThis.Input.isTriggered = () => false;
    controller.updateTimeWindowAction();
    expect(globalThis.$gameTime.isMapWindowVisible()).toBe(startingVisibility);

    globalThis.Input.isTriggered = symbol => symbol === globalThis.J.ABS.EXT.INPUT.Symbols.L3;
    controller.updateTimeWindowAction();
    expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
  });

  it('update calls through to the aliased original and then updateTimeWindowAction', () =>
  {
    const controller = new globalThis.JABS_StandardController();
    const startingVisibility = globalThis.$gameTime.isMapWindowVisible();

    globalThis.Input.isTriggered = symbol => symbol === globalThis.J.ABS.EXT.INPUT.Symbols.L3;

    controller.update();

    expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
  });
});
//endregion plugins/time/jabs-input-adapter-and-controller-direct.test.js
