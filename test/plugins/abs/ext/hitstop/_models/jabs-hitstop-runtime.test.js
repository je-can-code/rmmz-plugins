//region plugins/abs/ext/hitstop/_models/jabs-hitstop-runtime.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Hitstop JABS_HitstopRuntime (unit, pure static state, no downstream dependencies)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopRuntime.js').default} */
  let JABS_HitstopRuntime;

  beforeAll(async () =>
  {
    ({ default: JABS_HitstopRuntime } = await import('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopRuntime.js'));
  });

  it('defaults lastShakeFrame to 0', () =>
  {
    expect(JABS_HitstopRuntime.lastShakeFrame).toBe(0);
  });

  it('is a mutable static field', () =>
  {
    // Arrange / Act
    JABS_HitstopRuntime.lastShakeFrame = 42;

    // Assert
    expect(JABS_HitstopRuntime.lastShakeFrame).toBe(42);
  });
});
//endregion plugins/abs/ext/hitstop/_models/jabs-hitstop-runtime.test.js
