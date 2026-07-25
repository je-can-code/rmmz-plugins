//region plugins/abs/core/managers/jabs-config-regex.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installAbsHostGlobals, setPluginContextToJAbs, setPluginContextToJBase } from '../../_component/fixtures/install-abs-host-globals.js';

describe('J.ABS.RegExp.ConfigNotInanimate (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    // real production code- sets up J.ABS.RegExp.ConfigNotInanimate.
    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');
  });

  it('matches the no-space form, same as every other jabsConfig tag', () =>
  {
    // Arrange
    const regex = globalThis.J.ABS.RegExp.ConfigNotInanimate;

    // Act
    const matched = regex.test('<jabsConfig:notInanimate>');

    // Assert
    expect(matched).toBe(true);
  });

  it('matches a space after the colon, matching the convention used by every sibling jabsConfig tag', () =>
  {
    // Arrange
    const regex = globalThis.J.ABS.RegExp.ConfigNotInanimate;

    // Act
    const matched = regex.test('<jabsConfig: notInanimate>');

    // Assert
    expect(matched).toBe(true);
  });
});
//endregion plugins/abs/core/managers/jabs-config-regex.test.js
