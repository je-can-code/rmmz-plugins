//region plugins/abs/ext/star/_models/star-phases.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Star StarPhases (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(() =>
  {
    String.empty = '';
    globalThis.BattleManager = {};
  });

  it('KNOWN BUG: throws a ReferenceError on import, since `BattleManager.starPhases = new StarPhases()` executes before the `class StarPhases` declaration- class declarations are never hoisted, so this crashes on every real load, not just under test', async () =>
  {
    // Act / Assert
    await expect(import('../../../../../../src/plugins/abs/ext/star/_models/StarPhases.js')).rejects.toThrow(
      /Cannot access 'StarPhases' before initialization/);
  });
});
//endregion plugins/abs/ext/star/_models/star-phases.test.js
