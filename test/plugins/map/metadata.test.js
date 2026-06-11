//region plugins/map/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMapPluginVm } from './map-vm.js';

describe('J-MAP metadata (out/map/J-Map.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadMapPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('initializes metadata with parsed params', () =>
  {
    expect(sandbox.J.MAP.Metadata.name).toBe('J-MAP');

    expect(sandbox.J.MAP.Metadata.startVisible).toBe(true);
    expect(sandbox.J.MAP.Metadata.respectHudHide).toBe(true);
    expect(sandbox.J.MAP.Metadata.overlapOpacity).toBe(0.4);
  });
});
//endregion plugins/map/metadata.test.js
