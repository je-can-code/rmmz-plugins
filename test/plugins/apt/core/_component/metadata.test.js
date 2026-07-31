//region plugins/apt/core/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installAptHostGlobals } from './fixtures/install-apt-host-globals.js';

describe('J-Aptitude metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    await installAptHostGlobals(globalThis, {
      'menu-switch': '0',
      'max-level-threshold': '-1',
    });
  });

  it('parses the menu switch id out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.APT.Metadata.menuSwitchId).toBe(0);
  });

  it('parses the max level threshold out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.APT.Metadata.maxLevelThreshold).toBe(-1);
  });

  it('treats a negative threshold as having no level limit at all', () =>
  {
    // Arrange & Act & Assert: -1 is the "unbounded" sentinel, not a real ceiling.
    expect(globalThis.J.APT.Metadata.usingLevelThresholdLimit).toBe(false);
  });
});
//endregion plugins/apt/core/_component/metadata.test.js
