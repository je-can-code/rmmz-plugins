//region plugins/map/_component/jabs-gated-input-without-jabs.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * What the minimap's input wiring does when J-ABS is not installed, which is nothing.
 *
 * The minimap itself is not a JABS feature - it draws on any map - but its *shortcut key* is, because
 * the binding lives on JABS's own controller and adapter. So both of those files sit entirely behind
 * a namespace check, and a project running the minimap without JABS simply toggles it through the
 * plugin command instead.
 *
 * This lives in its own file because the namespace has to be absent at import time, and the rest of
 * the map suite establishes the opposite for its whole run.
 */
describe('J-MAP JABS-gated input without J-ABS', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { MAP: { Aliased: { JABS_StandardController: new Map() } } };

    function StubJABS_StandardController()
    {
    }

    StubJABS_StandardController.prototype.initMembers = vi.fn();
    globalThis.JABS_StandardController = StubJABS_StandardController;

    globalThis.JABS_InputAdapter = {};

    await import('../../../../src/plugins/map/core/managers/JABS_InputAdapter.js');
    await import('../../../../src/plugins/map/core/objects/JABS_InputController.js');
  });

  it('adds no minimap action to the input adapter', () =>
  {
    // Arrange
    // Act
    // Assert: without JABS there is no adapter action to bind a key to, so the whole shortcut is
    // simply absent rather than present-and-broken.
    expect(globalThis.JABS_InputAdapter.performMinimapWindowAction)
      .toBeUndefined();
  });

  it('patches nothing onto the JABS controller', () =>
  {
    // Arrange
    // Act
    const aliased = globalThis.J.MAP.Aliased.JABS_StandardController;

    // Assert
    expect(aliased.size)
      .toBe(0);
  });
});
//endregion plugins/map/_component/jabs-gated-input-without-jabs.test.js