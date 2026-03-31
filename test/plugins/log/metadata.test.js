//region plugins/log/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLogPluginVm } from './log-vm.js';

describe('J-Log metadata (out/J-Log.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLogPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('initializes J.LOG metadata and inactivity duration from parameters', () =>
  {
    expect(sandbox.J.LOG.Metadata.Name).toBe('J-Log');
    expect(sandbox.J.LOG.Metadata.Version).toBe('2.1.1');
    expect(sandbox.J.LOG.Metadata.InactivityTimerDuration).toBe(60);
  });
});
//endregion plugins/log/metadata.test.js
