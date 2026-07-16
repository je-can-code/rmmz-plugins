//region plugins/abs/core/models/jabs-battler-name.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_BattlerName.js has zero imports and zero methods- just two defaulted class fields- so this
 * file dynamically imports it directly with no mocking required.
 */
describe('JABS_BattlerName (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_BattlerName.js').default} */
  let JABS_BattlerName;

  beforeAll(async () =>
  {
    ({ default: JABS_BattlerName } = await import('../../../../../src/plugins/abs/core/models/JABS_BattlerName.js'));
  });

  it('defaults to an empty name and white color hex', () =>
  {
    const name = new JABS_BattlerName();

    expect(name.name).toEqual(String.empty);
    expect(name.colorHex).toEqual('#ffffff');
  });
});
//endregion plugins/abs/core/models/jabs-battler-name.test.js
