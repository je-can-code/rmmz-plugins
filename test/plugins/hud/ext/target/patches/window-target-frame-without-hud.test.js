//region plugins/hud/ext/target/patches/window-target-frame-without-hud.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * What the affliction patch does when the target frame is not installed, which is nothing.
 *
 * Afflictions are drawn *onto* the target frame, so without that window there is no surface to draw
 * them on. The namespace check is the sanctioned one-line form for an honestly-optional sibling, and
 * this is the side of it that a project running the full HUD never takes.
 *
 * It lives in its own file because the namespace has to be absent at import time, and the rest of
 * this family's suite establishes the opposite for its whole run.
 */
describe('Window_TargetFrame affliction patch without the target frame HUD', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // the HUD namespace exists but carries no target-frame extension, which is exactly what a
    // project that installed J-HUD without J-HUD-TargetFrame looks like.
    globalThis.J = { HUD: { EXT: {} } };

    // the engine bases the window and its gauge sprite are declared against. They are only needed
    // for those class declarations to evaluate; nothing here constructs one.
    globalThis.Window_Base = class {};
    globalThis.Sprite = class {};
    globalThis.Sprite_Gauge = class {};

    await import('../../../../../../src/plugins/hud/ext/target/patches/Window_TargetFrame.js');
  });

  it('patches nothing, leaving the window exactly as its own file defined it', async () =>
  {
    // Arrange
    // Act
    const { default: Window_TargetFrame } = await import(
      '../../../../../../src/plugins/hud/ext/target/windows/Window_TargetFrame.js');

    // Assert: the patch hangs its work off an alias map that only exists alongside the extension,
    // so declining to run is what keeps this import from throwing on a missing namespace.
    expect(Window_TargetFrame.prototype.drawAfflictions)
      .toBeUndefined();
  });
});
//endregion plugins/hud/ext/target/patches/window-target-frame-without-hud.test.js