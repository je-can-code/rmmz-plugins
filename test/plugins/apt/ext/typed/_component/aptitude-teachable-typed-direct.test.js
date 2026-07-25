//region plugins/apt/ext/typed/_component/aptitude-teachable-typed-direct.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('AptitudeTeachable ApType additions (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/apt/core/_models/AptitudeTeachable.js').default} */
  let AptitudeTeachable;

  /** @type {typeof import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js').default} */
  let ApTypeKey;

  beforeAll(async () =>
  {
    // the core AptitudeTeachable class becomes a bare global once J-Aptitude core is loaded in the
    // shipped build; the ext/typed patch file below reaches it as a bare identifier, not an import.
    ({ default: AptitudeTeachable } = await import('../../../../../../src/plugins/apt/core/_models/AptitudeTeachable.js'));
    globalThis.AptitudeTeachable = AptitudeTeachable;

    ({ default: ApTypeKey } = await import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js'));

    // the file under test- patches globalThis.AptitudeTeachable.prototype directly.
    await import('../../../../../../src/plugins/apt/ext/typed/_models/AptitudeTeachable.js');
  });

  afterAll(() =>
  {
    delete globalThis.AptitudeTeachable;
  });

  it('isTyped is false until an ApTypeKey has been set', () =>
  {
    const teachable = new AptitudeTeachable(12, 40);

    expect(teachable.isTyped()).toBe(false);
    expect(teachable.apTypeKey()).toBeUndefined();
  });

  it('setApTypeKey stores the key and apTypeKey/isTyped reflect it', () =>
  {
    const teachable = new AptitudeTeachable(12, 40);
    const key = new ApTypeKey('element', 3);

    teachable.setApTypeKey(key);

    expect(teachable.apTypeKey()).toBe(key);
    expect(teachable.isTyped()).toBe(true);
  });
});
//endregion plugins/apt/ext/typed/_component/aptitude-teachable-typed-direct.test.js
