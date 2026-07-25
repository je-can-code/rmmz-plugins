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

  it('maps plugin parameters onto J.APT.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.APT.Metadata.name).toBe('J-Aptitude');
    expect(globalThis.J.APT.Metadata.menuSwitchId).toBe(0);
    expect(globalThis.J.APT.Metadata.maxLevelThreshold).toBe(-1);
    expect(globalThis.J.APT.Metadata.usingLevelThresholdLimit).toBe(false);
  });
});
//endregion plugins/apt/core/_component/metadata.test.js
