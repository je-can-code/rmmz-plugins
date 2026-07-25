//region plugins/abs/core/models/jabs-state-overrides.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_StateOverrides.js has zero imports- a pure, self-contained value object- so this file
 * dynamically imports it directly with no mocking required.
 */
describe('JABS_StateOverrides (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_StateOverrides.js').default} */
  let JABS_StateOverrides;

  beforeAll(async () =>
  {
    ({ default: JABS_StateOverrides } =
      await import('../../../../../src/plugins/abs/core/models/JABS_StateOverrides.js'));
  });

  it('defaults both duration and stacks to null', () =>
  {
    const overrides = new JABS_StateOverrides();

    expect(overrides.duration).toBeNull();
    expect(overrides.stacks).toBeNull();
  });

  it('assigns the given duration and stacks', () =>
  {
    const overrides = new JABS_StateOverrides(120, 3);

    expect(overrides.duration).toEqual(120);
    expect(overrides.stacks).toEqual(3);
  });
});
//endregion plugins/abs/core/models/jabs-state-overrides.test.js
