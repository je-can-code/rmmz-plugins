//region plugins/abs/core/models/jabs-state-expire-data.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_StateExpireData.js has zero imports- a pure, self-contained value object- so this file
 * dynamically imports it directly with no mocking required.
 */
describe('JABS_StateExpireData (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_StateExpireData.js').default} */
  let JABS_StateExpireData;

  beforeAll(async () =>
  {
    ({ default: JABS_StateExpireData } =
      await import('../../../../../src/plugins/abs/core/models/JABS_StateExpireData.js'));
  });

  it('assigns the given stateId and chance', () =>
  {
    const data = new JABS_StateExpireData(5, 50);

    expect(data.stateId).toEqual(5);
    expect(data.chance).toEqual(50);
  });
});
//endregion plugins/abs/core/models/jabs-state-expire-data.test.js
